import { resolve } from "node:path"

/**
 * Returns whether a value is a non-array object.
 *
 * @param value - Value to inspect.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const repositoryRoot = resolve(import.meta.dir, "..")
const packagePath = resolve(repositoryRoot, "plugins/zach-codex/package.json")
const pluginManifestPath = resolve(
  repositoryRoot,
  "plugins/zach-codex/.codex-plugin/plugin.json",
)
const marketplacePath = resolve(
  repositoryRoot,
  ".agents/plugins/marketplace.json",
)
const packageManifest: unknown = await Bun.file(packagePath).json()
const pluginManifest: unknown = await Bun.file(pluginManifestPath).json()
const marketplace: unknown = await Bun.file(marketplacePath).json()

if (!isRecord(packageManifest) || typeof packageManifest.version !== "string") {
  throw new Error(`Invalid package manifest: ${packagePath}`)
}

if (!isRecord(pluginManifest) || typeof pluginManifest.version !== "string") {
  throw new Error(`Invalid plugin manifest: ${pluginManifestPath}`)
}

if (!isRecord(marketplace) || !Array.isArray(marketplace.plugins)) {
  throw new Error(`Invalid marketplace manifest: ${marketplacePath}`)
}

const marketplacePlugin = marketplace.plugins.find(
  (entry) => isRecord(entry) && entry.name === "zach-codex",
)

if (
  !isRecord(marketplacePlugin) ||
  !isRecord(marketplacePlugin.source) ||
  typeof marketplacePlugin.source.version !== "string"
) {
  throw new Error(`Zach Codex is missing from ${marketplacePath}`)
}

pluginManifest.version = packageManifest.version
marketplacePlugin.source.version = packageManifest.version

await Promise.all([
  Bun.write(
    pluginManifestPath,
    `${JSON.stringify(pluginManifest, undefined, 2)}\n`,
  ),
  Bun.write(marketplacePath, `${JSON.stringify(marketplace, undefined, 2)}\n`),
])

console.log(`Synchronized Zach Codex metadata to ${packageManifest.version}`)
