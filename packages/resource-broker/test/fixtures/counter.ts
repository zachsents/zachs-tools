import { Database } from "bun:sqlite"

const [databasePath, duration, readyPath] = process.argv.slice(2)
if (!databasePath || !duration)
  throw new Error("Expected counter database path and duration.")

using database = new Database(databasePath, { create: true })
database.run("PRAGMA busy_timeout = 5000")

database
  .transaction(() => {
    database.run(
      "UPDATE counter SET active = active + 1, maximum = MAX(maximum, active + 1) WHERE singleton = 1",
    )
  })
  .immediate()
if (readyPath) await Bun.write(readyPath, String(process.pid))

let cleanedUp = false
const cleanUp = () => {
  if (cleanedUp) return
  cleanedUp = true
  database
    .transaction(() => {
      database.run("UPDATE counter SET active = active - 1 WHERE singleton = 1")
    })
    .immediate()
}
process.on("SIGTERM", () => {
  cleanUp()
  process.exit(143)
})

try {
  await Bun.sleep(Number(duration))
} finally {
  cleanUp()
}
