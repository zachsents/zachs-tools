import { resolve } from "node:path"

const checkOnly = process.argv.includes("--check")
const repositoryRoot = resolve(import.meta.dir, "../../..")
const sourceRoot = resolve(repositoryRoot, "packages/agent-rules/rules")
const destinationRoot = resolve(
  repositoryRoot,
  "plugins/zach-codex/skills/follow-zach-coding-standards/references",
)
const ruleFiles = (
  await Array.fromAsync(
    new Bun.Glob("*.md").scan({ cwd: sourceRoot, onlyFiles: true }),
  )
).sort()
const entries = await Promise.all(
  ruleFiles.map(async (name) => ({
    name,
    content: await Bun.file(resolve(sourceRoot, name)).text(),
  })),
)

if (checkOnly) {
  const staleFiles = (
    await Promise.all(
      entries.map(async ({ name, content }) => {
        const path = resolve(destinationRoot, name)
        return (await Bun.file(path).exists()) &&
          (await Bun.file(path).text()) === content
          ? undefined
          : name
      }),
    )
  ).filter((name) => name !== undefined)

  if (staleFiles.length) {
    console.error(`Outdated plugin rule copies:\n${staleFiles.join("\n")}`)
    process.exitCode = 1
  } else {
    console.log("Plugin rule copies match packages/agent-rules/rules")
  }
} else {
  await Promise.all(
    entries.map(({ name, content }) =>
      Bun.write(resolve(destinationRoot, name), content),
    ),
  )
  console.log("Synced agent rules into the Zach Codex plugin")
}
