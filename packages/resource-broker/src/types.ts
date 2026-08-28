export const CONFIGURATION_EXIT_CODE = 78
export const RESOURCE_CANCELLATION_EXIT_CODE = 75
export const CHILD_EXIT_CODE_COLLISION_REMAP = 76

export type DiagnosticMode = "jsonl" | "quiet" | "text"
export type JobStatus =
  | "admitted"
  | "cancelled"
  | "cancelling"
  | "completed"
  | "running"
  | "waiting"
export type MemoryPressureLevel = "critical" | "normal" | "warning"

export interface BrokerEvent {
  command?: string[]
  details?: unknown
  event: string
  jobId?: string
  limit?: number
  ownerPid?: number
  pool?: string
  processGroupId?: number
  schemaVersion: 1
  timestamp: string
  weight?: number
}

export interface BrokerJob {
  admittedAt?: number
  command: string[]
  completedAt?: number
  createdAt: number
  cancellationReason?: string
  id: string
  limit: number
  ownerPid: number
  pool: string
  processGroupId?: number
  pressureLevel?: Exclude<MemoryPressureLevel, "normal">
  startedAt?: number
  status: JobStatus
  weight: number
}

export interface RunBrokeredCommandOptions {
  command: string[]
  diagnostics?: DiagnosticMode
  limit: number
  pool: string
  stateDirectory?: string
  weight?: number
}
