type DeploymentSummary = {
  createdAt: Date
  id: string
  projectId: string
  status: "active" | "failed"
}

declare const deployment: DeploymentSummary
declare const syncedWorkflows: string[]

export function serializeDeployment() {
  return {
    createdAt: deployment.createdAt,
    id: deployment.id,
    projectId: deployment.projectId,
    status: deployment.status,
    workflows: syncedWorkflows,
  }
}
