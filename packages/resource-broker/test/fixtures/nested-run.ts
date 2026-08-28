const [cliPath, stateDirectory, counterDatabase, countValue = "3"] =
  process.argv.slice(2)
if (!cliPath || !stateDirectory || !counterDatabase)
  throw new Error("Expected CLI, state, and counter paths.")

const counterFixture = new URL("./counter.ts", import.meta.url).pathname
const commands = Array.from({ length: Number(countValue) }, () =>
  Bun.spawn([
    process.execPath,
    cliPath,
    "run",
    "--state",
    stateDirectory,
    "--pool",
    "nested-test",
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
    "200",
  ]),
)

const exitCodes = await Promise.all(commands.map((command) => command.exited))
if (exitCodes.some((exitCode) => exitCode !== 0)) process.exit(1)
