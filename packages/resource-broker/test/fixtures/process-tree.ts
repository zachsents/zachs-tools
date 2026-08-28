const [readyPath, childPidPath] = process.argv.slice(2)
if (!readyPath || !childPidPath)
  throw new Error("Expected ready and child PID paths.")

const child = Bun.spawn(["/bin/sleep", "30"], {
  stdio: ["ignore", "ignore", "ignore"],
})
await Promise.all([
  Bun.write(readyPath, String(process.pid)),
  Bun.write(childPidPath, String(child.pid)),
])
process.exitCode = await child.exited
