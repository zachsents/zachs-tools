const [cliPath, stateDirectory, depthValue = "0", exitCodeValue = "0"] =
  process.argv.slice(2)
if (!cliPath || !stateDirectory)
  throw new Error("Expected CLI and state paths.")

const depth = Number(depthValue)
if (depth === 0) process.exit(Number(exitCodeValue))

const child = Bun.spawn({
  cmd: [
    process.execPath,
    cliPath,
    "run",
    "--state",
    stateDirectory,
    "--pool",
    "wrapper-chain-test",
    "--limit",
    "1",
    "--weight",
    "1",
    "--diagnostics",
    "jsonl",
    "--",
    process.execPath,
    new URL("./wrapper-chain.ts", import.meta.url).pathname,
    cliPath,
    stateDirectory,
    String(depth - 1),
    exitCodeValue,
  ],
  stdio: ["ignore", "ignore", "inherit"],
})
process.exitCode = await child.exited
