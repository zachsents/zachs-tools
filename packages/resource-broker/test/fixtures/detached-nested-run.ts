const [cliPath, stateDirectory, counterDatabase, readyPath] =
  process.argv.slice(2)
if (!cliPath || !stateDirectory || !counterDatabase || !readyPath)
  throw new Error("Expected CLI, state, counter, and ready paths.")

const counterFixture = new URL("./counter.ts", import.meta.url).pathname
const nested = Bun.spawn({
  cmd: [
    process.execPath,
    cliPath,
    "run",
    "--state",
    stateDirectory,
    "--pool",
    "detached-test",
    "--limit",
    "2",
    "--weight",
    "1",
    "--diagnostics",
    "quiet",
    "--",
    process.execPath,
    counterFixture,
    counterDatabase,
    "250",
    readyPath,
  ],
  detached: true,
})
process.exitCode = await nested.exited
