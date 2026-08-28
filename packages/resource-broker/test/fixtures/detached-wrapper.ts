const [cliPath, stateDirectory] = process.argv.slice(2)
if (!cliPath || !stateDirectory)
  throw new Error("Expected CLI and state paths.")

const child = Bun.spawn({
  cmd: [
    process.execPath,
    cliPath,
    "run",
    "--state",
    stateDirectory,
    "--pool",
    "detached-wrapper-test",
    "--limit",
    "1",
    "--weight",
    "1",
    "--diagnostics",
    "jsonl",
    "--",
    "/usr/bin/true",
  ],
  detached: true,
  stdio: ["ignore", "ignore", "inherit"],
})
process.exitCode = await child.exited
