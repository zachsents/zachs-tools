type Deployment = {
  createdAt: Date
  id: string
  projectId: string
  status: "active" | "failed"
  updatedAt: Date
  ownerId: string
}

declare const deployment: Deployment
declare const syncedWorkflows: string[]

export function serializeDeploymentSubset() {
  return {
    createdAt: deployment.createdAt,
    id: deployment.id,
    projectId: deployment.projectId,
    status: deployment.status,
    workflows: syncedWorkflows,
  }
}
