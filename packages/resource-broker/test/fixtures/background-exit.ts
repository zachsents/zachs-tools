const [childPidPath] = process.argv.slice(2)
if (!childPidPath) throw new Error("Expected a child PID path.")

const child = Bun.spawn(["/bin/sleep", "30"], {
  stdio: ["ignore", "ignore", "ignore"],
})
await Bun.write(childPidPath, String(child.pid))
child.unref()
