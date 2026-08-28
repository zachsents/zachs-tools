const [
  cliPath,
  stateDirectory,
  counterDatabase,
  pool = "claimed-siblings-test",
  duration = "150",
  pidPrefix,
  readyPrefix,
] = process.argv.slice(2)
if (!cliPath || !stateDirectory || !counterDatabase) {
  throw new Error("Expected CLI, state, and counter paths.")
}

const counterFixture = new URL("./counter.ts", import.meta.url).pathname
const commands: Array<Bun.Subprocess<"ignore", "ignore", "ignore">> = []
for (const index of [0, 1]) {
  const command = Bun.spawn({
    cmd: [
      process.execPath,
      cliPath,
      "run",
      "--state",
      stateDirectory,
      "--pool",
      pool,
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
      duration,
      ...(readyPrefix ? [`${readyPrefix}-${index}`] : []),
    ],
    stdio: ["ignore", "ignore", "ignore"],
  })
  if (pidPrefix) await Bun.write(`${pidPrefix}-${index}`, String(command.pid))
  commands.push(command)
}
const exitCodes = await Promise.all(commands.map((command) => command.exited))
if (exitCodes.some((exitCode) => exitCode !== 0)) process.exit(1)
