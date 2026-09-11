import { Database } from "bun:sqlite"
import { mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

import {
  RESOURCE_CANCELLATION_EXIT_CODE,
  type BrokerEvent,
  type BrokerJob,
  type JobStatus,
  type MemoryPressureLevel,
} from "./types.ts"

const ACTIVE_STATUSES = "'waiting', 'admitted', 'running', 'cancelling'"
const EVENT_RETENTION_MS = 7 * 24 * 60 * 60 * 1_000

interface JobRow {
  admitted_at: number | null
  command: string
  completed_at: number | null
  cancellation_reason: string | null
  created_at: number
  id: string
  limit_value: number
  owner_pid: number
  ownership_secret: string
  pool: string
  pressure_level: Exclude<MemoryPressureLevel, "normal"> | null
  process_group_id: number | null
  sequence: number
  started_at: number | null
  status: JobStatus
  weight: number
}

interface SubclaimRow {
  created_at: number
  delegation_owner_pid: number | null
  delegation_token: string | null
  id: string
  owner_job_id: string
  owner_pid: number
  ownership_secret: string | null
  process_group_id: number | null
  sequence: number
  status: "cancelled" | "completed" | "running" | "waiting"
  weight: number
}

interface PoolRow {
  limit_value: number
  name: string
}

interface CountRow {
  count: number
}

interface WeightRow {
  weight: number | null
}

interface EventRow {
  command: string | null
  details: string | null
  event: string
  job_id: string | null
  limit_value: number | null
  occurred_at: number
  owner_pid: number | null
  pool: string | null
  process_group_id: number | null
  weight: number | null
}

interface PressureRow {
  last_cancelled_at: number | null
  level: MemoryPressureLevel
}

interface ColumnRow {
  name: string
}

interface RegisterJobInput {
  command: string[]
  id: string
  limit: number
  ownerPid: number
  ownershipSecret: string
  pool: string
  weight: number
}

interface CancellationTarget {
  job: BrokerJob
  processGroupId?: number
}

/** Describe incompatible limits used concurrently for one shared pool. */
export class PoolLimitConflictError extends Error {
  /**
   * Create a pool limit conflict.
   *
   * @param pool - Shared pool name.
   * @param activeLimit - Limit owned by active jobs.
   * @param requestedLimit - Incompatible requested limit.
   */
  constructor(pool: string, activeLimit: number, requestedLimit: number) {
    super(
      `Pool ${JSON.stringify(pool)} is active with limit ${activeLimit}; requested ${requestedLimit}.`,
    )
    this.name = "PoolLimitConflictError"
  }
}

/** Persist shared pool, ownership, pressure, and diagnostic state in SQLite. */
export class BrokerState implements Disposable {
  readonly #database: Database

  /**
   * Open the machine-shared broker database.
   *
   * @param stateDirectory - Directory containing shared SQLite state.
   * @throws When shared state cannot be initialized.
   */
  constructor(stateDirectory = getDefaultStateDirectory()) {
    mkdirSync(stateDirectory, { recursive: true })
    this.#database = new Database(join(stateDirectory, "state.sqlite"), {
      create: true,
    })
    this.#database.run("PRAGMA busy_timeout = 5000")
    try {
      this.#database.run("PRAGMA journal_mode = WAL")
    } catch (error) {
      // Another first-time client can hold the schema lock while it enables WAL.
      if (!isDatabaseBusyError(error)) throw error
    }
    this.#database.run("PRAGMA synchronous = NORMAL")
    this.#database.run(`
      CREATE TABLE IF NOT EXISTS pools (
        name TEXT PRIMARY KEY,
        limit_value INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS jobs (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT NOT NULL UNIQUE,
        pool TEXT NOT NULL,
        limit_value INTEGER NOT NULL,
        weight INTEGER NOT NULL,
        owner_pid INTEGER NOT NULL,
        ownership_secret TEXT NOT NULL,
        process_group_id INTEGER,
        command TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        admitted_at INTEGER,
        started_at INTEGER,
        completed_at INTEGER,
        exit_code INTEGER,
        cancellation_reason TEXT
      );
      CREATE INDEX IF NOT EXISTS jobs_active_pool_idx ON jobs(pool, status, sequence);
      CREATE TABLE IF NOT EXISTS subclaims (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT NOT NULL UNIQUE,
        owner_job_id TEXT NOT NULL,
        owner_pid INTEGER NOT NULL,
        ownership_secret TEXT,
        delegation_owner_pid INTEGER,
        delegation_token TEXT,
        process_group_id INTEGER,
        weight INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        admitted_at INTEGER,
        completed_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS subclaims_owner_status_idx ON subclaims(owner_job_id, status, sequence);
      CREATE TABLE IF NOT EXISTS events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        occurred_at INTEGER NOT NULL,
        event TEXT NOT NULL,
        job_id TEXT,
        pool TEXT,
        owner_pid INTEGER,
        process_group_id INTEGER,
        weight INTEGER,
        limit_value INTEGER,
        command TEXT,
        details TEXT
      );
      CREATE INDEX IF NOT EXISTS events_pool_sequence_idx ON events(pool, sequence DESC);
      CREATE TABLE IF NOT EXISTS pressure (
        singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
        level TEXT NOT NULL,
        last_observed_at INTEGER NOT NULL,
        last_cancelled_at INTEGER
      );
      INSERT OR IGNORE INTO pressure(singleton, level, last_observed_at) VALUES (1, 'normal', 0);
    `)
    if (
      !this.#database
        .query<ColumnRow, []>("PRAGMA table_info(jobs)")
        .all()
        .some(({ name }) => name === "pressure_level")
    ) {
      try {
        this.#database.run("ALTER TABLE jobs ADD COLUMN pressure_level TEXT")
      } catch (error) {
        // Another first-time client can win the same additive migration.
        if (!isDuplicateColumnError(error)) throw error
      }
    }
    if (
      !this.#database
        .query<ColumnRow, []>("PRAGMA table_info(subclaims)")
        .all()
        .some(({ name }) => name === "ownership_secret")
    ) {
      try {
        this.#database.run(
          "ALTER TABLE subclaims ADD COLUMN ownership_secret TEXT",
        )
      } catch (error) {
        // Another first-time client can win the same additive migration.
        if (!isDuplicateColumnError(error)) throw error
      }
    }
    if (
      !this.#database
        .query<ColumnRow, []>("PRAGMA table_info(subclaims)")
        .all()
        .some(({ name }) => name === "delegation_owner_pid")
    ) {
      try {
        this.#database.run(
          "ALTER TABLE subclaims ADD COLUMN delegation_owner_pid INTEGER",
        )
      } catch (error) {
        // Another first-time client can win the same additive migration.
        if (!isDuplicateColumnError(error)) throw error
      }
    }
    if (
      !this.#database
        .query<ColumnRow, []>("PRAGMA table_info(subclaims)")
        .all()
        .some(({ name }) => name === "delegation_token")
    ) {
      try {
        this.#database.run(
          "ALTER TABLE subclaims ADD COLUMN delegation_token TEXT",
        )
      } catch (error) {
        // Another first-time client can win the same additive migration.
        if (!isDuplicateColumnError(error)) throw error
      }
    }
    if (
      !this.#database
        .query<ColumnRow, []>("PRAGMA table_info(subclaims)")
        .all()
        .some(({ name }) => name === "process_group_id")
    ) {
      try {
        this.#database.run(
          "ALTER TABLE subclaims ADD COLUMN process_group_id INTEGER",
        )
      } catch (error) {
        // Another first-time client can win the same additive migration.
        if (!isDuplicateColumnError(error)) throw error
      }
    }
    this.#database.run("DELETE FROM events WHERE occurred_at < ?", [
      Date.now() - EVENT_RETENTION_MS,
    ])
  }

  /** Close the broker database. */
  [Symbol.dispose](): void {
    this.#database.close()
  }

  /**
   * Add a FIFO job after reconciling the shared pool limit.
   *
   * @param input - New job identity and capacity claim.
   * @throws When active jobs use another limit for the pool.
   */
  registerJob(input: RegisterJobInput): BrokerJob {
    const now = Date.now()
    const register = this.#database.transaction(() => {
      const activeCount = this.#database
        .query<
          CountRow,
          [string]
        >(`SELECT COUNT(*) AS count FROM jobs WHERE pool = ? AND status IN (${ACTIVE_STATUSES})`)
        .get(input.pool)?.count
      const pool = this.#database
        .query<
          PoolRow,
          [string]
        >("SELECT name, limit_value FROM pools WHERE name = ?")
        .get(input.pool)

      if (activeCount && pool && pool.limit_value !== input.limit) {
        throw new PoolLimitConflictError(
          input.pool,
          pool.limit_value,
          input.limit,
        )
      }

      this.#database.run(
        `INSERT INTO pools(name, limit_value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(name) DO UPDATE SET limit_value = excluded.limit_value, updated_at = excluded.updated_at
         WHERE ? = 0`,
        [input.pool, input.limit, now, activeCount ?? 0],
      )
      this.#database.run(
        `INSERT INTO jobs(
          id, pool, limit_value, weight, owner_pid, ownership_secret, command, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting', ?)`,
        [
          input.id,
          input.pool,
          input.limit,
          input.weight,
          input.ownerPid,
          input.ownershipSecret,
          JSON.stringify(input.command),
          now,
        ],
      )
    })
    register.immediate()

    const job = this.getJob(input.id)
    if (!job) throw new Error(`Failed to register broker job ${input.id}.`)
    this.recordEvent("job.queued", job)
    return job
  }

  /**
   * Admit the oldest waiter when its weight fits the pool.
   *
   * @param jobId - Waiting job identifier.
   */
  tryAdmit(jobId: string): BrokerJob | undefined {
    const admit = this.#database.transaction(() => {
      const row = this.#getJobRow(jobId)
      if (row?.status !== "waiting") return row

      const usedWeight =
        this.#database
          .query<
            WeightRow,
            [string]
          >("SELECT SUM(weight) AS weight FROM jobs WHERE pool = ? AND status IN ('admitted', 'running', 'cancelling')")
          .get(row.pool)?.weight ?? 0

      if (
        this.#database
          .query<
            JobRow,
            [string]
          >("SELECT * FROM jobs WHERE pool = ? AND status = 'waiting' ORDER BY sequence LIMIT 1")
          .get(row.pool)?.id !== jobId ||
        usedWeight + row.weight > row.limit_value
      )
        return row

      this.#database.run(
        "UPDATE jobs SET status = 'admitted', admitted_at = ? WHERE id = ? AND status = 'waiting'",
        [Date.now(), jobId],
      )
      return this.#getJobRow(jobId)
    })
    const row = admit.immediate()
    const job = row ? toJob(row) : undefined
    if (job?.status === "admitted") this.recordEvent("job.admitted", job)
    return job
  }

  /**
   * Attach an admitted reservation to its newly owned process group.
   *
   * @param jobId - Admitted job identifier.
   * @param processGroupId - Owned process-group leader.
   */
  markStarted(jobId: string, processGroupId: number): BrokerJob | undefined {
    const start = this.#database.transaction(() => {
      const row = this.#getJobRow(jobId)
      if (row?.status !== "admitted") return row
      this.#database.run(
        "UPDATE jobs SET status = 'running', process_group_id = ?, started_at = ? WHERE id = ? AND status = 'admitted'",
        [processGroupId, Date.now(), jobId],
      )
      return this.#getJobRow(jobId)
    })
    const row = start.immediate()
    const job = row ? toJob(row) : undefined
    if (job?.status === "running") this.recordEvent("job.started", job)
    return job
  }

  /**
   * Finish a job, preserving whether resource pressure cancelled it.
   *
   * @param jobId - Running job identifier.
   * @param exitCode - Public command exit status.
   * @param childExitCode - Raw child command status.
   */
  completeJob(
    jobId: string,
    exitCode: number,
    childExitCode = exitCode,
  ): JobStatus | undefined {
    const complete = this.#database.transaction(() => {
      const row = this.#getJobRow(jobId)
      if (!row) return undefined
      const status: JobStatus =
        row.status === "cancelling" ? "cancelled" : "completed"
      const publicExitCode =
        status === "cancelled" ? RESOURCE_CANCELLATION_EXIT_CODE : exitCode
      this.#database.run(
        "UPDATE jobs SET status = ?, completed_at = ?, exit_code = ? WHERE id = ?",
        [status, Date.now(), publicExitCode, jobId],
      )
      this.#database.run(
        "UPDATE subclaims SET status = 'cancelled', completed_at = ? WHERE owner_job_id = ? AND status IN ('waiting', 'running')",
        [Date.now(), jobId],
      )
      return { job: toJob({ ...row, status }), publicExitCode, status }
    })
    const result = complete.immediate()
    if (result)
      this.recordEvent(
        result.status === "cancelled" ? "job.cancelled" : "job.completed",
        result.job,
        {
          exitCode: result.publicExitCode,
          ...(result.publicExitCode === childExitCode ? {} : { childExitCode }),
          ...(result.job.cancellationReason
            ? { reason: result.job.cancellationReason }
            : {}),
          ...(result.job.pressureLevel
            ? { pressureLevel: result.job.pressureLevel }
            : {}),
        },
      )
    return result?.status
  }

  /**
   * Cancel a job that has not started its owned command.
   *
   * @param jobId - Waiting or admitted job identifier.
   * @param reason - Cancellation reason.
   */
  cancelWaitingJob(jobId: string, reason: string): void {
    const row = this.#getJobRow(jobId)
    if (!row || (row.status !== "waiting" && row.status !== "admitted")) return
    this.#database.run(
      "UPDATE jobs SET status = 'cancelled', completed_at = ?, cancellation_reason = ? WHERE id = ? AND status IN ('waiting', 'admitted')",
      [Date.now(), reason, jobId],
    )
    this.recordEvent("job.cancelled", toJob({ ...row, status: "cancelled" }), {
      reason,
    })
  }

  /**
   * Read one job by its stable identifier.
   *
   * @param jobId - Job identifier.
   */
  getJob(jobId: string): BrokerJob | undefined {
    const row = this.#getJobRow(jobId)
    return row ? toJob(row) : undefined
  }

  /**
   * Verify that an inherited token owns enough active capacity for a nested
   * command.
   *
   * @param jobId - Ancestor job identifier.
   * @param secret - Ancestor ownership secret.
   * @param pool - Requested pool.
   * @param limit - Requested pool limit.
   * @param weight - Requested nested weight.
   */
  ownsActiveReservation(
    jobId: string,
    secret: string,
    pool: string,
    limit: number,
    weight: number,
  ): BrokerJob | undefined {
    const row = this.#database
      .query<JobRow, [string, string, string, number, number]>(
        `SELECT * FROM jobs
         WHERE id = ? AND ownership_secret = ? AND pool = ? AND limit_value = ? AND weight >= ?
           AND status = 'running' AND process_group_id IS NOT NULL`,
      )
      .get(jobId, secret, pool, limit, weight)
    return row ? toJob(row) : undefined
  }

  /**
   * Queue capacity inside an inherited owner reservation.
   *
   * @param id - Nested claim identifier.
   * @param ownerJobId - Ancestor reservation identifier.
   * @param ownerPid - Nested broker process identifier.
   * @param ownershipSecret - Secret delegated to the claimed command subtree.
   * @param weight - Requested nested capacity.
   * @throws When the ancestor reservation is no longer running.
   */
  registerSubclaim(
    id: string,
    ownerJobId: string,
    ownerPid: number,
    ownershipSecret: string,
    weight: number,
  ): void {
    const register = this.#database.transaction(() => {
      const owner = this.#getJobRow(ownerJobId)
      if (owner?.status !== "running" || weight > owner.weight) return false
      this.#database.run(
        `INSERT INTO subclaims(
          id, owner_job_id, owner_pid, ownership_secret, delegation_token, weight, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?)`,
        [
          id,
          ownerJobId,
          ownerPid,
          ownershipSecret,
          ownershipSecret,
          weight,
          Date.now(),
        ],
      )
      return true
    })
    if (!register.immediate())
      throw new Error(`Reservation owner ${ownerJobId} is no longer running.`)
  }

  /**
   * Verify capacity already delegated to a nested command subtree.
   *
   * @param id - Nested claim identifier.
   * @param ownershipSecret - Delegated claim secret.
   * @param ownerJobId - Ancestor reservation identifier.
   * @param weight - Requested descendant capacity.
   */
  ownsActiveSubclaim(
    id: string,
    ownershipSecret: string,
    ownerJobId: string,
    weight: number,
  ): number | undefined {
    return (
      this.#database
        .query<SubclaimRow, [string, string, string, number]>(
          `SELECT * FROM subclaims
           WHERE id = ? AND ownership_secret = ? AND owner_job_id = ? AND weight >= ?
             AND status = 'running' AND process_group_id IS NOT NULL`,
        )
        .get(id, ownershipSecret, ownerJobId, weight)?.process_group_id ??
      undefined
    )
  }

  /**
   * Atomically transfer exclusive descendant use of one active subclaim.
   *
   * @param id - Nested claim identifier.
   * @param presentedToken - Delegation token inherited by this broker.
   * @param nextToken - Fresh token delegated only to this broker's command
   *   subtree.
   * @param ownerPid - Broker process responsible for the transferred
   *   delegation.
   */
  tryTransferSubclaimDelegation(
    id: string,
    presentedToken: string,
    nextToken: string,
    ownerPid: number,
  ): "acquired" | "cancelled" | "waiting" {
    const transfer = this.#database.transaction(() => {
      const claim = this.#database
        .query<SubclaimRow, [string]>("SELECT * FROM subclaims WHERE id = ?")
        .get(id)
      if (claim?.status !== "running") return "cancelled" as const
      if (claim.delegation_token !== presentedToken) return "waiting" as const
      this.#database.run(
        "UPDATE subclaims SET delegation_token = ?, delegation_owner_pid = ? WHERE id = ? AND delegation_token = ? AND status = 'running'",
        [nextToken, ownerPid, id, presentedToken],
      )
      return "acquired" as const
    })
    return transfer.immediate()
  }

  /**
   * Return exclusive descendant use to the caller's sibling generation.
   *
   * @param id - Nested claim identifier.
   * @param delegatedToken - Token previously delegated to the completed
   *   subtree.
   * @param restoredToken - Token inherited by the completing broker.
   * @param restoredOwnerPid - Broker owning the restored parent delegation.
   * @throws When another live descendant still owns the delegation.
   */
  restoreSubclaimDelegation(
    id: string,
    delegatedToken: string,
    restoredToken: string,
    restoredOwnerPid: number | undefined,
  ): void {
    const restore = this.#database.transaction(() => {
      const claim = this.#database
        .query<SubclaimRow, [string]>("SELECT * FROM subclaims WHERE id = ?")
        .get(id)
      if (claim?.status !== "running") return true
      if (claim.delegation_token !== delegatedToken) return false
      this.#database.run(
        "UPDATE subclaims SET delegation_token = ?, delegation_owner_pid = ? WHERE id = ? AND delegation_token = ? AND status = 'running'",
        [restoredToken, restoredOwnerPid ?? null, id, delegatedToken],
      )
      return true
    })
    if (!restore.immediate()) {
      throw new Error(
        `Subclaim ${id} still has an active descendant delegation.`,
      )
    }
  }

  /**
   * Read the active exclusive delegation for watchdog supervision.
   *
   * @param id - Nested claim identifier.
   */
  getSubclaimDelegation(id: string):
    | {
        ownerPid?: number
        status: SubclaimRow["status"]
        token?: string
      }
    | undefined {
    const claim = this.#database
      .query<SubclaimRow, [string]>("SELECT * FROM subclaims WHERE id = ?")
      .get(id)
    return claim
      ? {
          status: claim.status,
          ...(claim.delegation_owner_pid === null
            ? {}
            : { ownerPid: claim.delegation_owner_pid }),
          ...(claim.delegation_token === null
            ? {}
            : { token: claim.delegation_token }),
        }
      : undefined
  }

  /**
   * Cancel a claim only if the expected dead broker still owns its delegation.
   *
   * @param id - Nested claim identifier.
   * @param ownerPid - Expected dead delegation owner.
   * @param token - Expected delegated token.
   */
  cancelSubclaimDelegationOwner(
    id: string,
    ownerPid: number,
    token: string,
  ): void {
    this.#database.run(
      `UPDATE subclaims SET status = 'cancelled', completed_at = ?
       WHERE id = ? AND delegation_owner_pid = ? AND delegation_token = ? AND status = 'running'`,
      [Date.now(), id, ownerPid, token],
    )
  }

  /**
   * Admit the oldest nested claim within its ancestor's reserved weight.
   *
   * @param id - Nested claim identifier.
   */
  tryAdmitSubclaim(id: string): SubclaimRow["status"] | undefined {
    const admit = this.#database.transaction(() => {
      const claim = this.#database
        .query<SubclaimRow, [string]>("SELECT * FROM subclaims WHERE id = ?")
        .get(id)
      if (claim?.status !== "waiting") return claim?.status
      const owner = this.#getJobRow(claim.owner_job_id)
      if (owner?.status !== "running") {
        this.#database.run(
          "UPDATE subclaims SET status = 'cancelled', completed_at = ? WHERE id = ?",
          [Date.now(), id],
        )
        return "cancelled" as const
      }
      const usedWeight =
        this.#database
          .query<
            WeightRow,
            [string]
          >("SELECT SUM(weight) AS weight FROM subclaims WHERE owner_job_id = ? AND status = 'running'")
          .get(claim.owner_job_id)?.weight ?? 0
      if (
        this.#database
          .query<
            SubclaimRow,
            [string]
          >("SELECT * FROM subclaims WHERE owner_job_id = ? AND status = 'waiting' ORDER BY sequence LIMIT 1")
          .get(claim.owner_job_id)?.id !== id ||
        usedWeight + claim.weight > owner.weight
      )
        return claim.status
      this.#database.run(
        "UPDATE subclaims SET status = 'running', admitted_at = ? WHERE id = ?",
        [Date.now(), id],
      )
      return "running" as const
    })
    return admit.immediate()
  }

  /**
   * Attach an admitted nested claim to its independently supervised process
   * group.
   *
   * @param id - Nested claim identifier.
   * @param processGroupId - Nested command process-group leader.
   */
  markSubclaimStarted(id: string, processGroupId: number): void {
    this.#database.run(
      "UPDATE subclaims SET process_group_id = ? WHERE id = ? AND status = 'running'",
      [processGroupId, id],
    )
  }

  /**
   * Release capacity held by one nested claim.
   *
   * @param id - Nested claim identifier.
   * @param exitCode - Public nested command status.
   * @param childExitCode - Raw nested child status.
   */
  completeSubclaim(
    id: string,
    exitCode: number,
    childExitCode: number,
  ): BrokerEvent | undefined {
    const claim = this.#database
      .query<SubclaimRow, [string]>("SELECT * FROM subclaims WHERE id = ?")
      .get(id)
    this.#database.run(
      "UPDATE subclaims SET status = 'completed', completed_at = ? WHERE id = ? AND status = 'running'",
      [Date.now(), id],
    )
    const owner = claim ? this.getJob(claim.owner_job_id) : undefined
    return owner
      ? this.recordEvent("job.subclaim-completed", owner, {
          claimId: id,
          exitCode,
          ...(exitCode === childExitCode ? {} : { childExitCode }),
        })
      : undefined
  }

  /**
   * Read one nested claim's lifecycle state.
   *
   * @param id - Nested claim identifier.
   */
  getSubclaimStatus(id: string): SubclaimRow["status"] | undefined {
    return this.#database
      .query<SubclaimRow, [string]>("SELECT * FROM subclaims WHERE id = ?")
      .get(id)?.status
  }

  /**
   * Close a nested claim after its independent watchdog observes owner death.
   *
   * @param id - Nested claim identifier.
   * @param ownerPid - Expected dead nested broker process.
   */
  markSubclaimOwnerExited(id: string, ownerPid: number): void {
    this.#database.run(
      "UPDATE subclaims SET status = 'cancelled', completed_at = ? WHERE id = ? AND owner_pid = ? AND status = 'running'",
      [Date.now(), id, ownerPid],
    )
  }

  /**
   * List active nested process groups owned by one root reservation.
   *
   * @param ownerJobId - Root reservation identifier.
   */
  listOwnedProcessGroupIds(ownerJobId: string): number[] {
    return this.#database
      .query<SubclaimRow, [string]>(
        "SELECT * FROM subclaims WHERE owner_job_id = ? AND status = 'running' AND process_group_id IS NOT NULL",
      )
      .all(ownerJobId)
      .flatMap(({ process_group_id }) =>
        process_group_id === null ? [] : [process_group_id],
      )
  }

  /** Release claims whose nested broker process disappeared. */
  reapOrphanedSubclaims(): void {
    const orphanedIds = this.#database
      .query<SubclaimRow, []>(
        "SELECT * FROM subclaims WHERE status = 'waiting'",
      )
      .all()
      .filter(({ owner_pid }) => !isProcessAlive(owner_pid))
      .map(({ id }) => id)
    if (!orphanedIds.length) return
    const reap = this.#database.transaction(() => {
      for (const id of orphanedIds) {
        this.#database.run(
          "UPDATE subclaims SET status = 'cancelled', completed_at = ? WHERE id = ?",
          [Date.now(), id],
        )
      }
    })
    reap.immediate()
  }

  /**
   * Atomically select and cancel the newest job during macOS memory pressure.
   *
   * @param level - Critical pressure level.
   * @param cooldownMs - Minimum delay between cancellations.
   */
  requestPressureCancellation(
    level: "critical",
    cooldownMs: number,
  ): CancellationTarget | undefined {
    const cancel = this.#database.transaction(() => {
      const now = Date.now()
      const pressure = this.#database
        .query<
          PressureRow,
          []
        >("SELECT level, last_cancelled_at FROM pressure WHERE singleton = 1")
        .get()
      this.#database.run(
        "UPDATE pressure SET level = ?, last_observed_at = ? WHERE singleton = 1",
        [level, now],
      )
      if (
        pressure?.last_cancelled_at &&
        now - pressure.last_cancelled_at < cooldownMs
      )
        return undefined

      const target = this.#database
        .query<JobRow, []>(
          `SELECT * FROM jobs WHERE status IN ('admitted', 'running')
           ORDER BY COALESCE(started_at, admitted_at, created_at) DESC, sequence DESC LIMIT 1`,
        )
        .get()
      if (!target) return undefined

      this.#database.run(
        `UPDATE jobs SET status = 'cancelling', cancellation_reason = ?, pressure_level = ?
         WHERE id = ? AND status IN ('admitted', 'running')`,
        [`macOS memory pressure: ${level}`, level, target.id],
      )
      this.#database.run(
        "UPDATE pressure SET last_cancelled_at = ? WHERE singleton = 1",
        [now],
      )
      return {
        job: toJob({ ...target, status: "cancelling" }),
        processGroupId: target.process_group_id ?? undefined,
      }
    })
    const target = cancel.immediate()
    if (target)
      this.recordEvent("job.cancellation-requested", target.job, {
        reason: "memory-pressure",
        level,
      })
    return target
  }

  /**
   * Record non-critical pressure and report transitions once across monitors.
   *
   * @param level - Current normal or warning pressure level.
   */
  observePressure(level: Exclude<MemoryPressureLevel, "critical">): boolean {
    const observe = this.#database.transaction(() => {
      // Preserve the pre-update level so only one monitor reports a transition.
      const previousLevel = this.#database
        .query<
          PressureRow,
          []
        >("SELECT level, last_cancelled_at FROM pressure WHERE singleton = 1")
        .get()?.level
      this.#database.run(
        "UPDATE pressure SET level = ?, last_observed_at = ? WHERE singleton = 1",
        [level, Date.now()],
      )
      return previousLevel !== level
    })
    return observe.immediate()
  }

  /** Cancel reservations whose owning broker process no longer exists. */
  reapOrphanedJobs(): BrokerJob[] {
    const orphaned = this.#database
      .query<JobRow, []>(
        `SELECT * FROM jobs WHERE status IN (${ACTIVE_STATUSES})`,
      )
      .all()
      .filter((row) => !isProcessAlive(row.owner_pid))
    if (!orphaned.length) return []

    const reap = this.#database.transaction(() => {
      for (const row of orphaned) {
        this.#database.run(
          "UPDATE jobs SET status = 'cancelled', completed_at = ?, cancellation_reason = 'owner-exited' WHERE id = ?",
          [Date.now(), row.id],
        )
      }
    })
    reap.immediate()
    return orphaned.map((row) => toJob({ ...row, status: "cancelled" }))
  }

  /**
   * Atomically close one reservation after its independent watchdog observes
   * owner death.
   *
   * @param jobId - Watched reservation identifier.
   * @param ownerPid - Expected dead owner process.
   */
  markOwnerExited(jobId: string, ownerPid: number): BrokerJob | undefined {
    const mark = this.#database.transaction(() => {
      const row = this.#getJobRow(jobId)
      if (
        !row ||
        row.owner_pid !== ownerPid ||
        !["admitted", "cancelling", "running", "waiting"].includes(row.status)
      )
        return undefined
      this.#database.run(
        "UPDATE jobs SET status = 'cancelled', completed_at = ?, cancellation_reason = 'owner-exited' WHERE id = ?",
        [Date.now(), jobId],
      )
      this.#database.run(
        "UPDATE subclaims SET status = 'cancelled', completed_at = ? WHERE owner_job_id = ? AND status IN ('waiting', 'running')",
        [Date.now(), jobId],
      )
      return toJob({
        ...row,
        cancellation_reason: "owner-exited",
        status: "cancelled",
      })
    })
    const job = mark.immediate()
    if (job)
      this.recordEvent("job.owner-exited", job, { reason: "owner-exited" })
    return job
  }

  /**
   * List live reservations, optionally restricted to one pool.
   *
   * @param pool - Optional shared pool name.
   */
  listActiveJobs(pool?: string): BrokerJob[] {
    return (
      pool
        ? this.#database
            .query<
              JobRow,
              [string]
            >(`SELECT * FROM jobs WHERE status IN (${ACTIVE_STATUSES}) AND pool = ? ORDER BY sequence`)
            .all(pool)
        : this.#database
            .query<
              JobRow,
              []
            >(`SELECT * FROM jobs WHERE status IN (${ACTIVE_STATUSES}) ORDER BY pool, sequence`)
            .all()
    ).map(toJob)
  }

  /**
   * Read recent structured diagnostics in chronological order.
   *
   * @param pool - Optional shared pool name.
   * @param count - Maximum event count.
   */
  listEvents(pool: string | undefined, count: number): BrokerEvent[] {
    return (
      pool
        ? this.#database
            .query<
              EventRow,
              [string, number]
            >("SELECT * FROM events WHERE pool = ? ORDER BY sequence DESC LIMIT ?")
            .all(pool, count)
        : this.#database
            .query<
              EventRow,
              [number]
            >("SELECT * FROM events ORDER BY sequence DESC LIMIT ?")
            .all(count)
    )
      .toReversed()
      .map(toEvent)
  }

  /**
   * Persist and return one versioned structured diagnostic event.
   *
   * @param event - Stable event name.
   * @param job - Optional related job.
   * @param details - Optional event details.
   */
  recordEvent(event: string, job?: BrokerJob, details?: unknown): BrokerEvent {
    const timestamp = Date.now()
    this.#database.run(
      `INSERT INTO events(
        occurred_at, event, job_id, pool, owner_pid, process_group_id, weight, limit_value, command, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        timestamp,
        event,
        job?.id ?? null,
        job?.pool ?? null,
        job?.ownerPid ?? null,
        job?.processGroupId ?? null,
        job?.weight ?? null,
        job?.limit ?? null,
        job ? JSON.stringify(job.command) : null,
        details === undefined ? null : JSON.stringify(details),
      ],
    )
    return {
      schemaVersion: 1,
      timestamp: new Date(timestamp).toISOString(),
      event,
      ...(job
        ? {
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
        : {}),
      ...(details === undefined ? {} : { details }),
    }
  }

  /**
   * Read one internal job row.
   *
   * @param jobId - Job identifier.
   */
  #getJobRow(jobId: string): JobRow | undefined {
    return (
      this.#database
        .query<JobRow, [string]>("SELECT * FROM jobs WHERE id = ?")
        .get(jobId) ?? undefined
    )
  }
}

/** Resolve the shared state directory for this user and operating system. */
export function getDefaultStateDirectory(): string {
  const configured = process.env.RESOURCE_BROKER_STATE_DIR
  if (configured) return configured
  if (process.platform === "darwin")
    return join(homedir(), "Library", "Caches", "zachs-resource-broker")
  return join(
    process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state"),
    "zachs-resource-broker",
  )
}

/**
 * Convert a normalized database row to the public job shape.
 *
 * @param row - Persisted job row.
 */
function toJob(row: JobRow): BrokerJob {
  return {
    id: row.id,
    pool: row.pool,
    limit: row.limit_value,
    weight: row.weight,
    ownerPid: row.owner_pid,
    command: parseCommand(row.command),
    ...(row.cancellation_reason === null
      ? {}
      : { cancellationReason: row.cancellation_reason }),
    status: row.status,
    createdAt: row.created_at,
    ...(row.admitted_at === null ? {} : { admittedAt: row.admitted_at }),
    ...(row.started_at === null ? {} : { startedAt: row.started_at }),
    ...(row.completed_at === null ? {} : { completedAt: row.completed_at }),
    ...(row.process_group_id === null
      ? {}
      : { processGroupId: row.process_group_id }),
    ...(row.pressure_level === null
      ? {}
      : { pressureLevel: row.pressure_level }),
  }
}

/**
 * Convert a normalized database row to the public event shape.
 *
 * @param row - Persisted event row.
 */
function toEvent(row: EventRow): BrokerEvent {
  return {
    schemaVersion: 1,
    timestamp: new Date(row.occurred_at).toISOString(),
    event: row.event,
    ...(row.job_id === null ? {} : { jobId: row.job_id }),
    ...(row.pool === null ? {} : { pool: row.pool }),
    ...(row.owner_pid === null ? {} : { ownerPid: row.owner_pid }),
    ...(row.process_group_id === null
      ? {}
      : { processGroupId: row.process_group_id }),
    ...(row.weight === null ? {} : { weight: row.weight }),
    ...(row.limit_value === null ? {} : { limit: row.limit_value }),
    ...(row.command === null ? {} : { command: parseCommand(row.command) }),
    ...(row.details === null ? {} : { details: parseJson(row.details) }),
  }
}

/**
 * Parse a persisted command while containing malformed local state.
 *
 * @param serialized - Persisted JSON command.
 */
function parseCommand(serialized: string): string[] {
  const value = parseJson(serialized)
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : ["<invalid command>"]
}

/**
 * Parse persisted JSON at the local database trust boundary.
 *
 * @param serialized - Persisted JSON value.
 */
function parseJson(serialized: string): unknown {
  return JSON.parse(serialized) as unknown
}

/**
 * Check whether an owning process still exists.
 *
 * @param pid - Owning process identifier.
 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/**
 * Identify a transient SQLite lock held by another broker client.
 *
 * @param error - Unknown database failure.
 */
function isDatabaseBusyError(error: unknown): boolean {
  return (
    error instanceof Error && "code" in error && error.code === "SQLITE_BUSY"
  )
}

/**
 * Identify the harmless loser of a concurrent additive schema migration.
 *
 * @param error - Unknown database failure.
 */
function isDuplicateColumnError(error: unknown): boolean {
  return (
    error instanceof Error && error.message.includes("duplicate column name")
  )
}
