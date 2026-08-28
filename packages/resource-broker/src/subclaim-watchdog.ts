import { terminateProcessGroupAndWait } from "./process-group.ts"
import { BrokerState } from "./state.ts"

const [ownerPidValue, processGroupIdValue, subclaimId, stateDirectory] =
  process.argv.slice(2)
const OWNER_PID = Number(ownerPidValue)
const PROCESS_GROUP_ID = Number(processGroupIdValue)
if (
  !Number.isSafeInteger(OWNER_PID) ||
  !Number.isSafeInteger(PROCESS_GROUP_ID) ||
  !subclaimId ||
  !stateDirectory
)
  process.exit(64)

using state = new BrokerState(stateDirectory)
while (true) {
  const status = state.getSubclaimStatus(subclaimId)
  if (!status || status === "cancelled" || status === "completed") break
  if (!isProcessAlive(OWNER_PID)) {
    try {
      await terminateProcessGroupAndWait(PROCESS_GROUP_ID)
      state.markSubclaimOwnerExited(subclaimId, OWNER_PID)
      break
    } catch {
      await Bun.sleep(100)
    }
    continue
  }
  await Bun.sleep(100)
}

/**
 * Check whether the watched nested broker process still exists.
 *
 * @param pid - Nested broker process identifier.
 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
