import { constants as osConstants } from "node:os"
import { extname, resolve } from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import type { EventEmitter } from "node:events"

import { createEvent, emitDiagnostic } from "./diagnostics.ts"
import { startMemoryPressureMonitor } from "./memory-pressure.ts"
import {
  forceKillProcessGroup,
  terminateProcessGroup,
  terminateProcessGroupAndWait,
} from "./process-group.ts"
import { BrokerState, getDefaultStateDirectory } from "./state.ts"
import {
  CHILD_EXIT_CODE_COLLISION_REMAP,
  CONFIGURATION_EXIT_CODE,
  RESOURCE_CANCELLATION_EXIT_CODE,
  type BrokerJob,
  type DiagnosticMode,
  type RunBrokeredCommandOptions,
} from "./types.ts"

const OWNERSHIP_ENVIRONMENT_VARIABLE = "RESOURCE_BROKER_OWNERSHIP"
const ADMISSION_POLL_INTERVAL_MS = getPositiveIntegerEnvironmentValue(
  "RESOURCE_BROKER_ADMISSION_POLL_INTERVAL_MS",
  200,
)
const processEvents: EventEmitter = process

interface OwnershipToken {
  jobId: string
  limit: number
  pool: string
  secret: string
  stateDirectory: string
  subclaimDelegationOwnerPid?: number
  subclaimDelegationToken?: string
  subclaimId?: string
  subclaimSecret?: string
  subclaimWeight?: number
  weight: number
}

interface ChildResult {
  exitCode: number | null
  signalCode: NodeJS.Signals | null
}

/**
 * Run a command after reserving weighted capacity in a machine-wide pool.
 *
 * @param options - Command, pool, and diagnostic settings.
 */
export async function runBrokeredCommand(
  options: RunBrokeredCommandOptions,
): Promise<number> {
  validateOptions(options)
  if (process.env.CI === "true") {
    const result = await spawnCommand(options.command, false, process.env)
    return normalizeCommandExitCode(
      result.exitCode ??
        (result.signalCode === null ? 1 : signalExitCode(result.signalCode)),
    )
  }
  const diagnostics = options.diagnostics ?? "text"
  const stateDirectory = resolve(
    options.stateDirectory ?? getDefaultStateDirectory(),
  )
  const weight = options.weight ?? 1
  using state = new BrokerState(stateDirectory)

  const inheritedOwnership = readOwnershipToken()
  if (inheritedOwnership?.stateDirectory === stateDirectory) {
    const owner = state.ownsActiveReservation(
      inheritedOwnership.jobId,
      inheritedOwnership.secret,
      options.pool,
      options.limit,
      weight,
    )
    const currentProcessGroupId = getCurrentProcessGroupId()
    if (owner && currentProcessGroupId !== undefined) {
      // Keep the verified subgroup identity stable across the following ownership decision.
      const inheritedSubclaimProcessGroupId =
        inheritedOwnership.subclaimId && inheritedOwnership.subclaimSecret
          ? state.ownsActiveSubclaim(
              inheritedOwnership.subclaimId,
              inheritedOwnership.subclaimSecret,
              owner.id,
              weight,
            )
          : undefined
      if (
        inheritedSubclaimProcessGroupId === currentProcessGroupId &&
        inheritedOwnership.subclaimDelegationToken
      ) {
        return await runWithinActiveSubclaim(
          options.command,
          diagnostics,
          owner,
          state,
          inheritedOwnership,
        )
      }
      if (inheritedSubclaimProcessGroupId !== undefined) {
        emitDiagnostic(
          diagnostics,
          state.recordEvent("job.subclaim-cross-group-rejected", owner, {
            claimId: inheritedOwnership.subclaimId,
            currentProcessGroupId,
            claimedProcessGroupId: inheritedSubclaimProcessGroupId,
            exitCode: CONFIGURATION_EXIT_CODE,
            reason:
              "cannot transfer an active delegated claim across process groups",
          }),
        )
        return CONFIGURATION_EXIT_CODE
      }
      return await runWithInheritedReservation(
        options.command,
        diagnostics,
        owner,
        state,
        weight,
        inheritedOwnership,
      )
    }
  }

  reapOrphans(state, diagnostics)
  const jobId = crypto.randomUUID()
  const ownershipSecret = crypto.randomUUID()
  emitDiagnostic(
    diagnostics,
    createEvent(
      "job.queued",
      eventFields(
        state.registerJob({
          id: jobId,
          pool: options.pool,
          limit: options.limit,
          weight,
          ownerPid: process.pid,
          ownershipSecret,
          command: options.command,
        }),
      ),
    ),
  )

  let childProcessGroupId: number | undefined
  let interruptedSignal: NodeJS.Signals | undefined
  let finished = false
  const forwardedSignals: NodeJS.Signals[] = ["SIGHUP", "SIGINT", "SIGTERM"]
  const signalHandlers = forwardedSignals.map((signal) => {
    const handler = () => {
      interruptedSignal = signal
      if (childProcessGroupId !== undefined)
        signalReservationProcessGroups(
          state,
          jobId,
          childProcessGroupId,
          signal,
        )
    }
    processEvents.on(signal, handler)
    return { handler, signal }
  })
  const exitHandler = () => {
    if (!finished && childProcessGroupId !== undefined)
      forceKillReservationProcessGroups(state, jobId, childProcessGroupId)
  }
  processEvents.on("exit", exitHandler)

  try {
    const admittedJob = await waitForAdmission(
      state,
      jobId,
      diagnostics,
      () => interruptedSignal,
    )
    if (!admittedJob) {
      if (state.getJob(jobId)?.status === "cancelling") {
        state.completeJob(jobId, RESOURCE_CANCELLATION_EXIT_CODE)
        const cancelledJob = state.getJob(jobId)
        if (cancelledJob) {
          emitDiagnostic(
            diagnostics,
            createEvent("job.cancelled", {
              ...eventFields(cancelledJob),
              details: completionDetails(
                cancelledJob,
                RESOURCE_CANCELLATION_EXIT_CODE,
                RESOURCE_CANCELLATION_EXIT_CODE,
              ),
            }),
          )
        }
      } else
        state.cancelWaitingJob(
          jobId,
          interruptedSignal
            ? `received ${interruptedSignal}`
            : "resource cancellation",
        )
      return interruptedSignal
        ? signalExitCode(interruptedSignal)
        : RESOURCE_CANCELLATION_EXIT_CODE
    }

    emitDiagnostic(
      diagnostics,
      createEvent("job.admitted", eventFields(admittedJob)),
    )
    if (interruptedSignal) {
      state.cancelWaitingJob(jobId, `received ${interruptedSignal}`)
      return signalExitCode(interruptedSignal)
    }
    const ownership: OwnershipToken = {
      jobId,
      pool: options.pool,
      limit: options.limit,
      weight,
      secret: ownershipSecret,
      stateDirectory,
    }
    const childResult = await spawnOwnedCommand(
      options.command,
      ownership,
      (processGroupId) => {
        childProcessGroupId = processGroupId
        const started = state.markStarted(jobId, processGroupId)
        if (started?.status === "cancelling" || started?.status === "cancelled")
          terminateProcessGroup(processGroupId)
      },
      state,
      diagnostics,
    )
    const childExitCode =
      childResult.exitCode ??
      (childResult.signalCode === null
        ? 1
        : signalExitCode(childResult.signalCode))
    const commandExitCode = normalizeCommandExitCode(childExitCode)
    const status = state.completeJob(jobId, commandExitCode, childExitCode)
    const finalExitCode =
      status === "cancelled" ? RESOURCE_CANCELLATION_EXIT_CODE : commandExitCode
    const finalJob = state.getJob(jobId) ?? admittedJob
    emitDiagnostic(
      diagnostics,
      createEvent(status === "cancelled" ? "job.cancelled" : "job.completed", {
        ...eventFields(finalJob),
        details: completionDetails(finalJob, finalExitCode, childExitCode),
      }),
    )
    return finalExitCode
  } finally {
    finished = true
    processEvents.off("exit", exitHandler)
    for (const { handler, signal } of signalHandlers)
      processEvents.off(signal, handler)
  }
}

/**
 * Run a nested command inside its ancestor's existing process-group
 * reservation.
 *
 * @param command - Command and arguments.
 * @param diagnostics - Selected diagnostic mode.
 * @param owner - Verified ancestor reservation.
 * @param state - Shared broker state.
 * @param weight - Nested claim weight.
 * @param ownership - Root reservation token delegated to the nested command.
 */
async function runWithInheritedReservation(
  command: string[],
  diagnostics: DiagnosticMode,
  owner: BrokerJob,
  state: BrokerState,
  weight: number,
  ownership: OwnershipToken,
): Promise<number> {
  const claimId = crypto.randomUUID()
  const claimSecret = crypto.randomUUID()
  state.registerSubclaim(claimId, owner.id, process.pid, claimSecret, weight)
  while (true) {
    state.reapOrphanedSubclaims()
    const status = state.tryAdmitSubclaim(claimId)
    if (
      status === "cancelled" ||
      status === "completed" ||
      status === undefined
    )
      return RESOURCE_CANCELLATION_EXIT_CODE
    if (status === "running") break
    await Bun.sleep(ADMISSION_POLL_INTERVAL_MS)
  }

  emitDiagnostic(
    diagnostics,
    createEvent("job.reused-reservation", {
      ...eventFields(owner),
      details: { claimId, weight },
    }),
  )
  const result = await spawnClaimedCommand(
    command,
    {
      ...ownership,
      subclaimDelegationToken: claimSecret,
      subclaimId: claimId,
      subclaimSecret: claimSecret,
      subclaimWeight: weight,
    },
    state,
  )
  const childExitCode =
    result.exitCode ??
    (result.signalCode === null ? 1 : signalExitCode(result.signalCode))
  const exitCode = normalizeCommandExitCode(childExitCode)
  const event = state.completeSubclaim(claimId, exitCode, childExitCode)
  if (event) emitDiagnostic(diagnostics, event)
  return exitCode
}

/**
 * Run a deeper wrapper inside capacity already delegated to its command
 * subtree.
 *
 * @param command - Command and arguments.
 * @param diagnostics - Selected diagnostic mode.
 * @param owner - Root broker reservation.
 * @param state - Shared broker state.
 * @param ownership - Active delegated subclaim token.
 */
async function runWithinActiveSubclaim(
  command: string[],
  diagnostics: DiagnosticMode,
  owner: BrokerJob,
  state: BrokerState,
  ownership: OwnershipToken,
): Promise<number> {
  if (!ownership.subclaimId || !ownership.subclaimDelegationToken) {
    throw new Error("An active delegated subclaim is required.")
  }
  const delegatedToken = crypto.randomUUID()
  while (true) {
    const status = state.tryTransferSubclaimDelegation(
      ownership.subclaimId,
      ownership.subclaimDelegationToken,
      delegatedToken,
      process.pid,
    )
    if (status === "cancelled") return RESOURCE_CANCELLATION_EXIT_CODE
    if (status === "acquired") break
    await Bun.sleep(ADMISSION_POLL_INTERVAL_MS)
  }
  const processGroupId = getCurrentProcessGroupId()
  if (processGroupId === undefined) {
    throw new Error("Unable to verify the delegated process group.")
  }
  startDelegationWatchdog(ownership, delegatedToken, processGroupId)
  emitDiagnostic(
    diagnostics,
    createEvent("job.reused-reservation", {
      ...eventFields(owner),
      details: {
        claimId: ownership.subclaimId,
        weight: ownership.subclaimWeight,
      },
    }),
  )
  try {
    const result = await spawnCommand(command, false, {
      ...process.env,
      [OWNERSHIP_ENVIRONMENT_VARIABLE]: JSON.stringify({
        ...ownership,
        subclaimDelegationOwnerPid: process.pid,
        subclaimDelegationToken: delegatedToken,
      }),
    })
    const childExitCode =
      result.exitCode ??
      (result.signalCode === null ? 1 : signalExitCode(result.signalCode))
    const exitCode = normalizeCommandExitCode(childExitCode)
    emitDiagnostic(
      diagnostics,
      state.recordEvent("job.subclaim-descendant-completed", owner, {
        claimId: ownership.subclaimId,
        exitCode,
        ...(exitCode === childExitCode ? {} : { childExitCode }),
      }),
    )
    return exitCode
  } finally {
    state.restoreSubclaimDelegation(
      ownership.subclaimId,
      delegatedToken,
      ownership.subclaimDelegationToken,
      ownership.subclaimDelegationOwnerPid,
    )
  }
}

/**
 * Wait in FIFO order until the shared pool has enough unclaimed capacity.
 *
 * @param state - Shared broker state.
 * @param jobId - Waiting job identifier.
 * @param diagnostics - Selected diagnostic mode.
 * @param getInterruptedSignal - Reads any pending user interruption.
 */
async function waitForAdmission(
  state: BrokerState,
  jobId: string,
  diagnostics: DiagnosticMode,
  getInterruptedSignal: () => NodeJS.Signals | undefined,
): Promise<BrokerJob | undefined> {
  while (!getInterruptedSignal()) {
    reapOrphans(state, diagnostics)
    const job = state.tryAdmit(jobId)
    if (!job || job.status === "cancelled" || job.status === "cancelling")
      return undefined
    if (job.status === "admitted") return job
    await Bun.sleep(ADMISSION_POLL_INTERVAL_MS)
  }
  return undefined
}

/**
 * Spawn a new process-group leader and monitor it for macOS memory pressure.
 *
 * @param command - Command and arguments.
 * @param ownership - Reservation inherited by descendants.
 * @param onSpawn - Registers the new process group.
 * @param state - Shared broker state.
 * @param diagnostics - Selected diagnostic mode.
 */
async function spawnOwnedCommand(
  command: string[],
  ownership: OwnershipToken,
  onSpawn: (processGroupId: number) => void,
  state: BrokerState,
  diagnostics: DiagnosticMode,
): Promise<ChildResult> {
  const child = Bun.spawn({
    cmd: command,
    detached: true,
    env: {
      ...process.env,
      [OWNERSHIP_ENVIRONMENT_VARIABLE]: JSON.stringify(ownership),
    },
    stdio: ["inherit", "inherit", "inherit"],
    onExit: () => undefined,
  })
  startOwnerWatchdog(ownership, child.pid)
  onSpawn(child.pid)
  const stopMemoryPressureMonitor = startMemoryPressureMonitor({
    state,
    diagnostics,
  })
  let result: ChildResult
  try {
    result = await waitForChild(child)
  } finally {
    stopMemoryPressureMonitor()
  }
  await drainReservationProcessGroups(state, ownership.jobId, child.pid)
  return result
}

/**
 * Spawn and supervise a nested claim in its own process group.
 *
 * @param command - Command and arguments.
 * @param ownership - Delegated nested claim token.
 * @param state - Shared broker state.
 */
async function spawnClaimedCommand(
  command: string[],
  ownership: OwnershipToken,
  state: BrokerState,
): Promise<ChildResult> {
  if (!ownership.subclaimId)
    throw new Error("A delegated subclaim identifier is required.")
  const child = Bun.spawn({
    cmd: command,
    detached: true,
    env: {
      ...process.env,
      [OWNERSHIP_ENVIRONMENT_VARIABLE]: JSON.stringify(ownership),
    },
    stdio: ["inherit", "inherit", "inherit"],
    onExit: () => undefined,
  })
  state.markSubclaimStarted(ownership.subclaimId, child.pid)
  startSubclaimWatchdog(ownership, child.pid)
  // Preserve the command result while its process group is drained before capacity release.
  const result = await waitForChild(child)
  await terminateProcessGroupAndWait(child.pid)
  return result
}

/**
 * Spawn a command with inherited process-group membership.
 *
 * @param command - Command and arguments.
 * @param detached - Whether to create a process group.
 * @param environment - Child environment.
 */
async function spawnCommand(
  command: string[],
  detached: boolean,
  environment: NodeJS.ProcessEnv,
): Promise<ChildResult> {
  return waitForChild(
    Bun.spawn({
      cmd: command,
      detached,
      env: environment,
      stdio: ["inherit", "inherit", "inherit"],
      onExit: () => undefined,
    }),
  )
}

/**
 * Resolve when a Bun subprocess exits while preserving its terminating signal.
 *
 * @param child - Spawned Bun subprocess.
 */
function waitForChild(
  child: Bun.Subprocess<"inherit", "inherit", "inherit">,
): Promise<ChildResult> {
  return new Promise((resolveChild, rejectChild) => {
    void child.exited.then(
      (exitCode) => {
        resolveChild({ exitCode, signalCode: child.signalCode })
      },
      (error: unknown) =>
        rejectChild(error instanceof Error ? error : new Error(String(error))),
    )
  })
}

/**
 * Release stale reservations and kill process groups whose broker owner
 * disappeared.
 *
 * @param state - Shared broker state.
 * @param diagnostics - Selected diagnostic mode.
 */
function reapOrphans(state: BrokerState, diagnostics: DiagnosticMode): void {
  for (const orphan of state.reapOrphanedJobs()) {
    if (orphan.processGroupId !== undefined)
      forceKillProcessGroup(orphan.processGroupId)
    emitDiagnostic(diagnostics, state.recordEvent("job.orphan-reaped", orphan))
  }
}

/** Parse the cooperative reservation inherited from a brokered ancestor. */
function readOwnershipToken(): OwnershipToken | undefined {
  const serialized = process.env[OWNERSHIP_ENVIRONMENT_VARIABLE]
  if (!serialized) return undefined
  const parsed = JSON.parse(serialized) as unknown
  if (!isRecord(parsed)) return undefined
  return typeof parsed.jobId === "string" &&
    typeof parsed.pool === "string" &&
    typeof parsed.limit === "number" &&
    typeof parsed.weight === "number" &&
    typeof parsed.secret === "string" &&
    typeof parsed.stateDirectory === "string"
    ? {
        jobId: parsed.jobId,
        pool: parsed.pool,
        limit: parsed.limit,
        weight: parsed.weight,
        secret: parsed.secret,
        stateDirectory: parsed.stateDirectory,
        ...(typeof parsed.subclaimId === "string"
          ? { subclaimId: parsed.subclaimId }
          : {}),
        ...(typeof parsed.subclaimDelegationToken === "string"
          ? { subclaimDelegationToken: parsed.subclaimDelegationToken }
          : {}),
        ...(typeof parsed.subclaimDelegationOwnerPid === "number"
          ? { subclaimDelegationOwnerPid: parsed.subclaimDelegationOwnerPid }
          : {}),
        ...(typeof parsed.subclaimSecret === "string"
          ? { subclaimSecret: parsed.subclaimSecret }
          : {}),
        ...(typeof parsed.subclaimWeight === "number"
          ? { subclaimWeight: parsed.subclaimWeight }
          : {}),
      }
    : undefined
}

/** Read the caller's current POSIX process-group identifier. */
function getCurrentProcessGroupId(): number | undefined {
  if (process.platform === "win32") return undefined
  const result = Bun.spawnSync([
    "/bin/ps",
    "-o",
    "pgid=",
    "-p",
    String(process.pid),
  ])
  const processGroupId = Number.parseInt(result.stdout.toString().trim(), 10)
  return result.exitCode === 0 &&
    Number.isSafeInteger(processGroupId) &&
    processGroupId > 0
    ? processGroupId
    : undefined
}

/**
 * Launch an independent process that kills the command group if its broker
 * owner dies.
 *
 * @param ownership - Reservation watched for owner death.
 * @param processGroupId - Owned command process group.
 */
function startOwnerWatchdog(
  ownership: OwnershipToken,
  processGroupId: number,
): void {
  Bun.spawn({
    cmd: [
      process.execPath,
      fileURLToPath(
        new URL(
          `./watchdog${extname(fileURLToPath(import.meta.url))}`,
          import.meta.url,
        ),
      ),
      String(process.pid),
      String(processGroupId),
      ownership.jobId,
      ownership.stateDirectory,
    ],
    detached: true,
    env: { ...process.env, [OWNERSHIP_ENVIRONMENT_VARIABLE]: undefined },
    stdio: ["ignore", "ignore", "ignore"],
  }).unref()
}

/**
 * Launch an independent process that kills nested work if its claim owner dies.
 *
 * @param ownership - Delegated nested claim token.
 * @param processGroupId - Nested command process group.
 * @throws When the delegated token lacks its required claim identifier.
 */
function startSubclaimWatchdog(
  ownership: OwnershipToken,
  processGroupId: number,
): void {
  if (!ownership.subclaimId)
    throw new Error("A delegated subclaim identifier is required.")
  Bun.spawn({
    cmd: [
      process.execPath,
      fileURLToPath(
        new URL(
          `./subclaim-watchdog${extname(fileURLToPath(import.meta.url))}`,
          import.meta.url,
        ),
      ),
      String(process.pid),
      String(processGroupId),
      ownership.subclaimId,
      ownership.stateDirectory,
    ],
    detached: true,
    env: { ...process.env, [OWNERSHIP_ENVIRONMENT_VARIABLE]: undefined },
    stdio: ["ignore", "ignore", "ignore"],
  }).unref()
}

/**
 * Supervise one transferable descendant delegation until its claim completes.
 *
 * @param ownership - Delegated nested claim token.
 * @param delegatedToken - Token exclusively held by this broker.
 * @param processGroupId - Claimed command process group.
 * @throws When the delegated token lacks its required claim identifier.
 */
function startDelegationWatchdog(
  ownership: OwnershipToken,
  delegatedToken: string,
  processGroupId: number,
): void {
  if (!ownership.subclaimId)
    throw new Error("A delegated subclaim identifier is required.")
  Bun.spawn({
    cmd: [
      process.execPath,
      fileURLToPath(
        new URL(
          `./delegation-watchdog${extname(fileURLToPath(import.meta.url))}`,
          import.meta.url,
        ),
      ),
      String(process.pid),
      String(processGroupId),
      ownership.subclaimId,
      delegatedToken,
      ownership.stateDirectory,
    ],
    detached: true,
    env: { ...process.env, [OWNERSHIP_ENVIRONMENT_VARIABLE]: undefined },
    stdio: ["ignore", "ignore", "ignore"],
  }).unref()
}

/**
 * Signal every process group owned by one root reservation.
 *
 * @param state - Shared broker state.
 * @param jobId - Root reservation identifier.
 * @param processGroupId - Root command process group.
 * @param signal - Signal to deliver.
 */
function signalReservationProcessGroups(
  state: BrokerState,
  jobId: string,
  processGroupId: number,
  signal: NodeJS.Signals,
): void {
  terminateProcessGroup(processGroupId, signal)
  for (const nestedProcessGroupId of state.listOwnedProcessGroupIds(jobId))
    terminateProcessGroup(nestedProcessGroupId, signal)
}

/**
 * Force-kill every process group owned by one root reservation.
 *
 * @param state - Shared broker state.
 * @param jobId - Root reservation identifier.
 * @param processGroupId - Root command process group.
 */
function forceKillReservationProcessGroups(
  state: BrokerState,
  jobId: string,
  processGroupId: number,
): void {
  forceKillProcessGroup(processGroupId)
  for (const nestedProcessGroupId of state.listOwnedProcessGroupIds(jobId))
    forceKillProcessGroup(nestedProcessGroupId)
}

/**
 * Wait for every process group owned by one root reservation to terminate.
 *
 * @param state - Shared broker state.
 * @param jobId - Root reservation identifier.
 * @param processGroupId - Root command process group.
 */
async function drainReservationProcessGroups(
  state: BrokerState,
  jobId: string,
  processGroupId: number,
): Promise<void> {
  await Promise.all([
    terminateProcessGroupAndWait(processGroupId),
    ...state.listOwnedProcessGroupIds(jobId).map(terminateProcessGroupAndWait),
  ])
}

/**
 * Select the stable job fields included in every job diagnostic.
 *
 * @param job - Broker job to describe.
 */
function eventFields(
  job: BrokerJob,
): Omit<
  import("./types.ts").BrokerEvent,
  "event" | "schemaVersion" | "timestamp"
> {
  return {
    jobId: job.id,
    pool: job.pool,
    ownerPid: job.ownerPid,
    ...(job.processGroupId === undefined
      ? {}
      : { processGroupId: job.processGroupId }),
    weight: job.weight,
    limit: job.limit,
    command: job.command,
  }
}

/**
 * Validate public library inputs before changing shared state.
 *
 * @param options - Public command options.
 * @throws When a command or pool setting is invalid.
 */
function validateOptions(options: RunBrokeredCommandOptions): void {
  if (!options.command.length) throw new TypeError("A command is required.")
  if (!options.pool.trim()) throw new TypeError("Pool name cannot be empty.")
  if (!Number.isSafeInteger(options.limit) || options.limit < 1)
    throw new TypeError("Pool limit must be a positive integer.")
  const weight = options.weight ?? 1
  if (!Number.isSafeInteger(weight) || weight < 1 || weight > options.limit) {
    throw new TypeError(
      "Job weight must be a positive integer no greater than the pool limit.",
    )
  }
}

/**
 * Narrow an unknown boundary value to an object record.
 *
 * @param value - Unknown boundary value.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/**
 * Convert a terminating POSIX signal to conventional shell exit status.
 *
 * @param signal - Terminating signal.
 */
function signalExitCode(signal: NodeJS.Signals): number {
  return 128 + osConstants.signals[signal]
}

/**
 * Reserve status 75 exclusively for broker resource cancellation.
 *
 * @param exitCode - Raw child command status.
 */
function normalizeCommandExitCode(exitCode: number): number {
  return exitCode === RESOURCE_CANCELLATION_EXIT_CODE
    ? CHILD_EXIT_CODE_COLLISION_REMAP
    : exitCode
}

/**
 * Build consistent live completion details from persisted cancellation state.
 *
 * @param job - Completed broker job.
 * @param exitCode - Public broker status.
 * @param childExitCode - Raw child status.
 */
function completionDetails(
  job: BrokerJob,
  exitCode: number,
  childExitCode: number,
): unknown {
  return {
    exitCode,
    ...(childExitCode === exitCode ? {} : { childExitCode }),
    ...(job.cancellationReason ? { reason: job.cancellationReason } : {}),
    ...(job.pressureLevel ? { pressureLevel: job.pressureLevel } : {}),
  }
}

/**
 * Read a positive integer tuning value while preserving a safe default.
 *
 * @param name - Environment variable name.
 * @param fallback - Default value.
 */
function getPositiveIntegerEnvironmentValue(
  name: string,
  fallback: number,
): number {
  const value = process.env[name]
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}
