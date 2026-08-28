import { terminateProcessGroupAndWait } from "./process-group.ts"
import { BrokerState } from "./state.ts"

const [
  ownerPidValue,
  processGroupIdValue,
  subclaimId,
  delegatedToken,
  stateDirectory,
] = process.argv.slice(2)
const OWNER_PID = Number(ownerPidValue)
const PROCESS_GROUP_ID = Number(processGroupIdValue)
if (
  !Number.isSafeInteger(OWNER_PID) ||
  !Number.isSafeInteger(PROCESS_GROUP_ID) ||
  !subclaimId ||
  !delegatedToken ||
  !stateDirectory
)
  process.exit(64)

using state = new BrokerState(stateDirectory)
while (true) {
  const delegation = state.getSubclaimDelegation(subclaimId)
  if (delegation?.status !== "running") break
  if (
    delegation.ownerPid === OWNER_PID &&
    delegation.token === delegatedToken &&
    !isProcessAlive(OWNER_PID)
  ) {
    try {
      await terminateProcessGroupAndWait(PROCESS_GROUP_ID)
      state.cancelSubclaimDelegationOwner(subclaimId, OWNER_PID, delegatedToken)
      break
    } catch {
      await Bun.sleep(100)
    }
    continue
  }
  await Bun.sleep(100)
}

/**
 * Check whether the watched delegation owner still exists.
 *
 * @param pid - Delegation-owner process identifier.
 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
