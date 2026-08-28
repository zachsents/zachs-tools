import { readFileSync } from "node:fs"

import { createEvent, emitDiagnostic } from "./diagnostics.ts"
import { terminateProcessGroup } from "./process-group.ts"
import type { BrokerState } from "./state.ts"
import type { DiagnosticMode, MemoryPressureLevel } from "./types.ts"

const PRESSURE_POLL_INTERVAL_MS = getPositiveIntegerEnvironmentValue(
  "RESOURCE_BROKER_PRESSURE_POLL_INTERVAL_MS",
  1_000,
)
const CANCELLATION_COOLDOWN_MS = getPositiveIntegerEnvironmentValue(
  "RESOURCE_BROKER_CANCELLATION_COOLDOWN_MS",
  5_000,
)

interface MemoryPressureMonitorOptions {
  diagnostics: DiagnosticMode
  state: BrokerState
}

/**
 * Poll macOS pressure state and cancel the newest admitted job when pressure
 * rises.
 *
 * @param options - Monitor state and diagnostic settings.
 */
export function startMemoryPressureMonitor(
  options: MemoryPressureMonitorOptions,
): () => void {
  if (
    process.platform !== "darwin" &&
    !process.env.RESOURCE_BROKER_TEST_PRESSURE_FILE
  )
    return () => undefined

  let checking = false
  const check = () => {
    if (checking) return
    checking = true
    try {
      const level = readMemoryPressureLevel()
      if (level === "normal") {
        if (options.state.observeNormalPressure()) {
          emitDiagnostic(
            options.diagnostics,
            options.state.recordEvent("memory-pressure.normal", undefined, {
              level,
            }),
          )
        }
        return
      }

      const target = options.state.requestPressureCancellation(
        level,
        CANCELLATION_COOLDOWN_MS,
      )
      if (!target) return
      emitDiagnostic(
        options.diagnostics,
        createEvent("job.cancellation-requested", {
          jobId: target.job.id,
          pool: target.job.pool,
          ownerPid: target.job.ownerPid,
          ...(target.processGroupId === undefined
            ? {}
            : { processGroupId: target.processGroupId }),
          weight: target.job.weight,
          limit: target.job.limit,
          command: target.job.command,
          details: { reason: "memory-pressure", level },
        }),
      )
      if (target.processGroupId !== undefined)
        terminateProcessGroup(target.processGroupId)
      for (const processGroupId of options.state.listOwnedProcessGroupIds(
        target.job.id,
      ))
        terminateProcessGroup(processGroupId)
    } finally {
      checking = false
    }
  }

  check()
  const timer = setInterval(check, PRESSURE_POLL_INTERVAL_MS)
  timer.unref()
  return () => clearInterval(timer)
}

/** Read macOS's current memorystatus pressure level. */
export function readMemoryPressureLevel(): MemoryPressureLevel {
  const testFile = process.env.RESOURCE_BROKER_TEST_PRESSURE_FILE
  const level = Number.parseInt(
    testFile
      ? readFileSync(testFile, "utf8").trim()
      : Bun.spawnSync([
          "/usr/sbin/sysctl",
          "-n",
          "kern.memorystatus_vm_pressure_level",
        ])
          .stdout.toString()
          .trim(),
    10,
  )
  if (level >= 4) return "critical"
  if (level >= 2) return "warning"
  return "normal"
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
