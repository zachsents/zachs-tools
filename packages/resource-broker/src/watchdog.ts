import { terminateProcessGroupAndWait } from "./process-group.ts"
import { BrokerState } from "./state.ts"

const [ownerPidValue, processGroupIdValue, jobId, stateDirectory] =
  process.argv.slice(2)
const OWNER_PID = Number(ownerPidValue)
const PROCESS_GROUP_ID = Number(processGroupIdValue)
if (
  !Number.isSafeInteger(OWNER_PID) ||
  !Number.isSafeInteger(PROCESS_GROUP_ID) ||
  !jobId ||
  !stateDirectory
)
  process.exit(64)

using state = new BrokerState(stateDirectory)
while (true) {
  const job = state.getJob(jobId)
  if (!job || job.status === "cancelled" || job.status === "completed") break
  if (!isProcessAlive(OWNER_PID)) {
    try {
      await Promise.all([
        terminateProcessGroupAndWait(PROCESS_GROUP_ID),
        ...state
          .listOwnedProcessGroupIds(jobId)
          .map(terminateProcessGroupAndWait),
      ])
      state.markOwnerExited(jobId, OWNER_PID)
      break
    } catch {
      await Bun.sleep(100)
    }
    continue
  }
  await Bun.sleep(100)
}

/**
 * Check whether the watched owner process still exists.
 *
 * @param pid - Broker owner process identifier.
 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
