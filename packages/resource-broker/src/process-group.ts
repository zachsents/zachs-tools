const FORCE_KILL_DELAY_MS = getPositiveIntegerEnvironmentValue(
  "RESOURCE_BROKER_FORCE_KILL_DELAY_MS",
  3_000,
)
const PROCESS_GROUP_POLL_INTERVAL_MS = 25

/**
 * Signal a supervised process group, escalating to SIGKILL after a grace
 * period.
 *
 * @param processGroupId - Owned process-group identifier.
 * @param signal - Initial signal to deliver.
 */
export function terminateProcessGroup(
  processGroupId: number,
  signal: NodeJS.Signals = "SIGTERM",
): void {
  signalProcessGroup(processGroupId, signal)
  if (signal === "SIGKILL") return

  setTimeout(
    () => signalProcessGroup(processGroupId, "SIGKILL"),
    FORCE_KILL_DELAY_MS,
  ).unref()
}

/**
 * Immediately kill a supervised process group.
 *
 * @param processGroupId - Owned process-group identifier.
 */
export function forceKillProcessGroup(processGroupId: number): void {
  signalProcessGroup(processGroupId, "SIGKILL")
}

/**
 * Terminate a process group and wait until no members remain before releasing
 * capacity.
 *
 * @param processGroupId - Owned process-group identifier.
 * @throws When the process group remains alive after forced termination.
 */
export async function terminateProcessGroupAndWait(
  processGroupId: number,
): Promise<void> {
  if (!isProcessGroupAlive(processGroupId)) return
  signalProcessGroup(processGroupId, "SIGTERM")
  const forceKillAt = Date.now() + FORCE_KILL_DELAY_MS
  while (isProcessGroupAlive(processGroupId) && Date.now() < forceKillAt)
    await Bun.sleep(PROCESS_GROUP_POLL_INTERVAL_MS)
  if (!isProcessGroupAlive(processGroupId)) return
  signalProcessGroup(processGroupId, "SIGKILL")
  const timeoutAt = Date.now() + 1_000
  while (isProcessGroupAlive(processGroupId) && Date.now() < timeoutAt)
    await Bun.sleep(PROCESS_GROUP_POLL_INTERVAL_MS)
  if (isProcessGroupAlive(processGroupId)) {
    throw new Error(
      `Process group ${processGroupId} remained alive after forced termination.`,
    )
  }
}

/**
 * Signal a whole POSIX process group or the owned process on Windows.
 *
 * @param processGroupId - Owned process-group identifier.
 * @param signal - Signal to deliver.
 * @throws Unexpected operating-system signaling failures.
 */
function signalProcessGroup(
  processGroupId: number,
  signal: NodeJS.Signals,
): void {
  try {
    process.kill(
      process.platform === "win32" ? processGroupId : -processGroupId,
      signal,
    )
  } catch (error) {
    if (!isMissingProcessError(error)) throw error
  }
}

/**
 * Check whether an owned process group still contains a process.
 *
 * @param processGroupId - Owned process-group identifier.
 * @throws Unexpected operating-system process inspection failures.
 */
function isProcessGroupAlive(processGroupId: number): boolean {
  if (process.platform !== "win32") {
    const result = Bun.spawnSync(["/bin/ps", "-axo", "pgid=,stat="])
    if (result.exitCode === 0) {
      return result.stdout
        .toString()
        .trim()
        .split("\n")
        .some((line) => {
          const match = line.trim().match(/^(\d+)\s+(\S+)/)
          return (
            match !== null &&
            Number(match[1]) === processGroupId &&
            !match[2]?.startsWith("Z")
          )
        })
    }
  }
  try {
    process.kill(
      process.platform === "win32" ? processGroupId : -processGroupId,
      0,
    )
    return true
  } catch (error) {
    if (isMissingProcessError(error)) return false
    throw error
  }
}

/**
 * Identify the expected error for a process group that has already exited.
 *
 * @param error - Unknown signaling failure.
 */
function isMissingProcessError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ESRCH"
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
