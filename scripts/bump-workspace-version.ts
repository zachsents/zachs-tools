import { basename, resolve } from "node:path"

/** Returns whether a value is a non-array object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const repositoryRoot = resolve(import.meta.dir, "..")
const lockPath = resolve(repositoryRoot, "bun.lock")
const [workspaceSelector, increment = "patch"] = Bun.argv.slice(2)

if (!workspaceSelector) {
  console.error(
    "Usage: bun run version:bump <workspace name|directory> [increment|version]",
  )
  process.exit(1)
}

const originalLock = await Bun.file(lockPath).text()
const parsedLock: unknown = Bun.JSONC.parse(originalLock)

if (!isRecord(parsedLock) || !isRecord(parsedLock.workspaces)) {
  throw new Error("bun.lock does not contain a workspaces object")
}

const workspaceMatches = Object.entries(parsedLock.workspaces).filter(
  ([workspacePath, workspace]) =>
    workspacePath &&
    isRecord(workspace) &&
    (workspacePath === workspaceSelector ||
      basename(workspacePath) === workspaceSelector ||
      workspace.name === workspaceSelector),
)

const workspaceMatch = workspaceMatches[0]

if (!workspaceMatch) {
  throw new Error(`Workspace not found: ${workspaceSelector}`)
}

if (workspaceMatches[1]) {
  throw new Error(`Workspace selector is ambiguous: ${workspaceSelector}`)
}

const [workspacePath, workspace] = workspaceMatch

if (!isRecord(workspace) || typeof workspace.version !== "string") {
  throw new Error(`Workspace has no version in bun.lock: ${workspacePath}`)
}

const packagePath = resolve(repositoryRoot, workspacePath, "package.json")
const originalPackage = await Bun.file(packagePath).text()
const parsedPackage: unknown = JSON.parse(originalPackage)

if (
  !isRecord(parsedPackage) ||
  typeof parsedPackage.name !== "string" ||
  typeof parsedPackage.version !== "string"
) {
  throw new Error(`Invalid package.json: ${packagePath}`)
}

if (workspace.version !== parsedPackage.version) {
  throw new Error(
    `Version mismatch before bump: package.json=${parsedPackage.version}, bun.lock=${workspace.version}`,
  )
}

const workspaceMarker = `    ${JSON.stringify(workspacePath)}: {\n`
const workspaceStart = originalLock.indexOf(workspaceMarker)
const workspaceEnd = originalLock.indexOf("\n    },", workspaceStart)
const previousVersionLine = `      "version": ${JSON.stringify(parsedPackage.version)},`

if (workspaceStart < 0 || workspaceEnd < 0) {
  throw new Error(
    `Could not locate the workspace version in bun.lock: ${workspacePath}`,
  )
}

const workspaceEntry = originalLock.slice(workspaceStart, workspaceEnd)

if (!workspaceEntry.includes(previousVersionLine)) {
  throw new Error(
    `Could not locate version ${parsedPackage.version} for ${workspacePath} in bun.lock`,
  )
}

const result = Bun.spawnSync({
  cmd: ["bun", "pm", "version", increment, "--no-git-tag-version"],
  cwd: resolve(repositoryRoot, workspacePath),
  stderr: "pipe",
  stdout: "pipe",
})

if (!result.success) {
  process.stderr.write(result.stderr)
  process.exit(result.exitCode)
}

const updatedPackage: unknown = await Bun.file(packagePath).json()

if (!isRecord(updatedPackage) || typeof updatedPackage.version !== "string") {
  await Bun.write(packagePath, originalPackage)
  throw new Error(`Bun wrote an invalid package version: ${packagePath}`)
}

const updatedVersionLine = `      "version": ${JSON.stringify(updatedPackage.version)},`
const updatedLock = `${originalLock.slice(0, workspaceStart)}${workspaceEntry.replace(previousVersionLine, updatedVersionLine)}${originalLock.slice(workspaceEnd)}`

try {
  await Bun.write(lockPath, updatedLock)
} catch (error) {
  await Bun.write(packagePath, originalPackage)
  throw error
}

console.log(
  `${parsedPackage.name}: ${parsedPackage.version} -> ${updatedPackage.version}`,
)
