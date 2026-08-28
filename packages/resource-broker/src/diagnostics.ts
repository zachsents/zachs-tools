import type { BrokerEvent, DiagnosticMode } from "./types.ts"

/**
 * Write one broker event in the selected user-facing format.
 *
 * @param mode - Selected diagnostic output format.
 * @param event - Structured event to write.
 */
export function emitDiagnostic(mode: DiagnosticMode, event: BrokerEvent): void {
  if (mode === "quiet") return
  if (mode === "jsonl") {
    console.error(JSON.stringify(event))
    return
  }

  const prefix = `[resource-broker:${event.pool ?? "system"}]`
  const message = formatEvent(event)
  if (message) console.error(`${prefix} ${message}`)
}

/**
 * Create a versioned structured broker event.
 *
 * @param event - Stable event name.
 * @param input - Event-specific fields.
 */
export function createEvent(
  event: string,
  input: Omit<BrokerEvent, "event" | "schemaVersion" | "timestamp"> = {},
): BrokerEvent {
  return {
    schemaVersion: 1,
    timestamp: new Date().toISOString(),
    event,
    ...input,
  }
}

/**
 * Convert a structured event to a concise terminal message.
 *
 * @param event - Structured broker event.
 */
function formatEvent(event: BrokerEvent): string | undefined {
  switch (event.event) {
    case "job.queued":
      return `waiting for ${event.weight}/${event.limit} slots: ${formatCommand(event.command)}`
    case "job.admitted":
      return `admitted ${event.jobId}`
    case "job.reused-reservation":
      return `reusing reservation ${event.jobId}`
    case "job.subclaim-cross-group-rejected":
      return "rejected a cross-group hop beneath an active delegated claim (exit status 78)"
    case "job.cancellation-requested":
      return `memory pressure cancelled newest job ${event.jobId}`
    case "job.cancelled":
      return `cancelled ${event.jobId} with exit status 75`
    case "job.completed":
      return `completed ${event.jobId}`
    case "job.orphan-reaped":
      return `terminated orphaned process group ${event.processGroupId ?? "unknown"}`
    case "memory-pressure.normal":
      return "memory pressure returned to normal"
    default:
      return undefined
  }
}

/**
 * Quote a command for diagnostic display without invoking a shell.
 *
 * @param command - Command arguments to display.
 */
function formatCommand(command: string[] | undefined): string {
  return (
    command
      ?.map((argument) =>
        argument.includes(" ") ? JSON.stringify(argument) : argument,
      )
      .join(" ") ?? "<unknown>"
  )
}
