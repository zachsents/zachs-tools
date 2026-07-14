type Deployment = {
  createdAt: Date
  id: string
  projectId: string
  status: "active" | "failed"
}

type UnknownDeployment = Record<string, unknown>

declare const deployment: Deployment
declare const otherDeployment: Deployment
declare const unknownDeployment: UnknownDeployment

export function singleMapping() {
  return {
    id: deployment.id,
  }
}

export function renamedMapping() {
  return {
    deploymentId: deployment.id,
    project: deployment.projectId,
  }
}

export function splitAcrossSources() {
  return {
    id: deployment.id,
    projectId: otherDeployment.projectId,
  }
}

export function existingSpread() {
  return {
    ...deployment,
    id: deployment.id,
    projectId: deployment.projectId,
  }
}

export function unknownShape() {
  return {
    id: unknownDeployment.id,
    projectId: unknownDeployment.projectId,
  }
}
