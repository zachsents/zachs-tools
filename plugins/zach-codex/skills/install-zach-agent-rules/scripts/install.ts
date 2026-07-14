import { mkdir } from "node:fs/promises"
import { basename, resolve } from "node:path"

const ruleFiles = [
  "general.md",
  "typescript.md",
  "react.md",
  "convex.md",
  "tech-stack.md",
  "mcp-preferences.md",
]
const startMarker = "<!-- zach-agent-rules:start -->"
const endMarker = "<!-- zach-agent-rules:end -->"
const args = process.argv.slice(2)
const targetIndex = args.indexOf("--target")
const targetArgument = targetIndex === -1 ? undefined : args[targetIndex + 1]

if (targetIndex !== -1 && !targetArgument) {
  console.error("--target requires a repository path")
  process.exit(1)
}

const targetRoot = resolve(targetArgument ?? process.cwd())
const checkOnly = args.includes("--check")
const sourceRoot = resolve(
  import.meta.dir,
  "../../follow-zach-coding-standards/references",
)
const destinationRoot = resolve(targetRoot, ".agents/zach-rules")
const rootAgentsPath = resolve(targetRoot, "AGENTS.md")
const managedBlock = `${startMarker}
# Zach Agent Rules

Read and follow \`.agents/zach-rules/AGENTS.md\` before editing or reviewing code in this repository.
${endMarker}`

/** Insert or update the managed rule pointer without changing other guidance. */
function updateManagedBlock(current: string) {
  const start = current.indexOf(startMarker)
  const end = current.indexOf(endMarker)

  if ((start === -1) !== (end === -1)) {
    throw new Error("AGENTS.md contains an incomplete Zach agent rules block")
  }

  if (start !== -1 && end >= start) {
    return `${current.slice(0, start)}${managedBlock}${current.slice(end + endMarker.length)}`
  }

  return current.trim()
    ? `${current.trimEnd()}\n\n${managedBlock}\n`
    : `${managedBlock}\n`
}

const sourceEntries = await Promise.all(
  ruleFiles.map(async (name) => ({
    name,
    content: await Bun.file(resolve(sourceRoot, name)).text(),
  })),
)
const rulesIndex = `# Zach Agent Rules

Before editing code, read and follow these rule files:

- \`general.md\`
- \`typescript.md\` for TypeScript or JavaScript work
- \`react.md\` for React work
- \`convex.md\` for Convex work
- \`tech-stack.md\` when choosing defaults for new project work
- \`mcp-preferences.md\` when external tools or systems are involved

Repository-specific and nested \`AGENTS.md\` instructions take precedence when they are more specific.
`
const expectedFiles = [
  ...sourceEntries,
  { name: "AGENTS.md", content: rulesIndex },
]
const currentRootAgents = (await Bun.file(rootAgentsPath).exists())
  ? await Bun.file(rootAgentsPath).text()
  : ""
const expectedRootAgents = updateManagedBlock(currentRootAgents)

if (checkOnly) {
  const staleFiles = (
    await Promise.all(
      expectedFiles.map(async ({ name, content }) => {
        const path = resolve(destinationRoot, name)
        return (await Bun.file(path).exists()) &&
          (await Bun.file(path).text()) === content
          ? undefined
          : path
      }),
    )
  ).filter((path) => path !== undefined)

  if (currentRootAgents !== expectedRootAgents) staleFiles.push(rootAgentsPath)

  if (staleFiles.length) {
    console.error(`Outdated Zach agent rules:\n${staleFiles.join("\n")}`)
    process.exitCode = 1
  } else {
    console.log(`Zach agent rules are current in ${targetRoot}`)
  }
} else {
  await mkdir(destinationRoot, { recursive: true })
  await Promise.all(
    expectedFiles.map(({ name, content }) =>
      Bun.write(resolve(destinationRoot, name), content),
    ),
  )
  await Bun.write(rootAgentsPath, expectedRootAgents)
  console.log(`Installed Zach agent rules in ${basename(targetRoot)}`)
}
