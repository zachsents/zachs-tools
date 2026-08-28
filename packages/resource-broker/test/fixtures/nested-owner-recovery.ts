const [cliPath, stateDirectory, counterDatabase, nestedPidPath, readyPath] =
  process.argv.slice(2)
if (
  !cliPath ||
  !stateDirectory ||
  !counterDatabase ||
  !nestedPidPath ||
  !readyPath
) {
  throw new Error("Expected CLI, state, counter, PID, and ready paths.")
}

const counterFixture = new URL("./counter.ts", import.meta.url).pathname
const nested = Bun.spawn({
  cmd: [
    process.execPath,
    cliPath,
    "run",
    "--state",
    stateDirectory,
    "--pool",
    "nested-recovery-test",
    "--limit",
    "1",
    "--weight",
    "1",
    "--diagnostics",
    "quiet",
    "--",
    process.execPath,
    counterFixture,
    counterDatabase,
    "1000",
    readyPath,
  ],
  stdio: ["ignore", "ignore", "ignore"],
})
await Bun.write(nestedPidPath, String(nested.pid))
await nested.exited

const replacement = Bun.spawn({
  cmd: [
    process.execPath,
    cliPath,
    "run",
    "--state",
    stateDirectory,
    "--pool",
    "nested-recovery-test",
    "--limit",
    "1",
    "--weight",
    "1",
    "--diagnostics",
    "quiet",
    "--",
    process.execPath,
    counterFixture,
    counterDatabase,
    "150",
  ],
  stdio: ["ignore", "ignore", "ignore"],
})
process.exitCode = await replacement.exited
