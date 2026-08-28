import { Database } from "bun:sqlite"
import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { BrokerState } from "../src/state.ts"
import {
  CHILD_EXIT_CODE_COLLISION_REMAP,
  CONFIGURATION_EXIT_CODE,
  RESOURCE_CANCELLATION_EXIT_CODE,
} from "../src/types.ts"

const CLI_PATH = new URL("../src/cli.ts", import.meta.url).pathname
const BACKGROUND_EXIT_FIXTURE_PATH = new URL(
  "./fixtures/background-exit.ts",
  import.meta.url,
).pathname
const CLAIMED_SIBLINGS_FIXTURE_PATH = new URL(
  "./fixtures/claimed-siblings.ts",
  import.meta.url,
).pathname
const COUNTER_FIXTURE_PATH = new URL("./fixtures/counter.ts", import.meta.url)
  .pathname
const DETACHED_NESTED_FIXTURE_PATH = new URL(
  "./fixtures/detached-nested-run.ts",
  import.meta.url,
).pathname
const DETACHED_WRAPPER_FIXTURE_PATH = new URL(
  "./fixtures/detached-wrapper.ts",
  import.meta.url,
).pathname
const NESTED_FIXTURE_PATH = new URL("./fixtures/nested-run.ts", import.meta.url)
  .pathname
const NESTED_OWNER_RECOVERY_FIXTURE_PATH = new URL(
  "./fixtures/nested-owner-recovery.ts",
  import.meta.url,
).pathname
const PROCESS_TREE_FIXTURE_PATH = new URL(
  "./fixtures/process-tree.ts",
  import.meta.url,
).pathname
const WRAPPER_CHAIN_FIXTURE_PATH = new URL(
  "./fixtures/wrapper-chain.ts",
  import.meta.url,
).pathname
const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { force: true, recursive: true })
})

describe("resource-broker", () => {
  test("bypasses local admission in CI", async () => {
    const directory = createTemporaryDirectory()
    const command = spawnBroker(directory, "ci-test", 1, 1, ["/usr/bin/true"], {
      CI: "true",
    })

    expect(await command.exited).toBe(0)
    expect(existsSync(join(directory, "state.sqlite"))).toBe(false)
  })

  test("enforces a shared weighted admission limit", async () => {
    const directory = createTemporaryDirectory()
    const counterDatabase = join(directory, "counter.sqlite")
    initializeCounter(counterDatabase)
    const jobs = [1, 2, 3].map(() =>
      spawnBroker(directory, "weighted-test", 2, 1, [
        process.execPath,
        COUNTER_FIXTURE_PATH,
        counterDatabase,
        "200",
      ]),
    )

    expect(await Promise.all(jobs.map((job) => job.exited))).toEqual([0, 0, 0])
    expect(readMaximum(counterDatabase)).toBe(2)
  })

  test("nested commands share no more than their process-group owner's capacity", async () => {
    const directory = createTemporaryDirectory()
    const counterDatabase = join(directory, "counter.sqlite")
    initializeCounter(counterDatabase)
    const owner = spawnBroker(directory, "nested-test", 2, 2, [
      process.execPath,
      NESTED_FIXTURE_PATH,
      CLI_PATH,
      directory,
      counterDatabase,
    ])

    expect(await withTimeout(owner.exited, 3_000)).toBe(0)
    expect(readMaximum(counterDatabase)).toBe(2)
  })

  test("multi-level nested wrappers reuse one delegated claim without deadlocking", async () => {
    const directory = createTemporaryDirectory()
    const owner = spawnBroker(directory, "wrapper-chain-test", 1, 1, [
      process.execPath,
      WRAPPER_CHAIN_FIXTURE_PATH,
      CLI_PATH,
      directory,
      "3",
    ])

    expect(await withTimeout(owner.exited, 3_000)).toBe(0)
  })

  test("concurrent descendants serialize inside one delegated claim", async () => {
    const directory = createTemporaryDirectory()
    const counterDatabase = join(directory, "counter.sqlite")
    initializeCounter(counterDatabase)
    const owner = spawnBroker(directory, "claimed-siblings-test", 1, 1, [
      process.execPath,
      CLAIMED_SIBLINGS_FIXTURE_PATH,
      CLI_PATH,
      directory,
      counterDatabase,
    ])

    expect(await withTimeout(owner.exited, 3_000)).toBe(0)
    expect(readMaximum(counterDatabase)).toBe(1)
  })

  test("a dead delegation owner drains and cancels its claimed process group", async () => {
    const directory = createTemporaryDirectory()
    const counterDatabase = join(directory, "counter.sqlite")
    const pidPrefix = join(directory, "delegation-broker")
    const readyPrefix = join(directory, "delegation-ready")
    const pool = "delegation-recovery-test"
    initializeCounter(counterDatabase)
    const owner = spawnBroker(directory, pool, 1, 1, [
      process.execPath,
      CLI_PATH,
      "run",
      "--state",
      directory,
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
      CLAIMED_SIBLINGS_FIXTURE_PATH,
      CLI_PATH,
      directory,
      counterDatabase,
      pool,
      "1000",
      pidPrefix,
      readyPrefix,
    ])
    const activeIndex = await waitForAnyFile([
      `${readyPrefix}-0`,
      `${readyPrefix}-1`,
    ])
    const activeCounterPid = Number(
      readFileSync(`${readyPrefix}-${activeIndex}`, "utf8"),
    )

    process.kill(
      Number(readFileSync(`${pidPrefix}-${activeIndex}`, "utf8")),
      "SIGKILL",
    )
    expect(await withTimeout(owner.exited, 5_000)).not.toBe(0)
    await waitForProcessExit(activeCounterPid)

    const replacement = spawnBroker(directory, pool, 1, 1, [
      process.execPath,
      COUNTER_FIXTURE_PATH,
      counterDatabase,
      "150",
    ])
    expect(await withTimeout(replacement.exited, 3_000)).toBe(0)
    expect(readMaximum(counterDatabase)).toBe(1)
  })

  test("a detached descendant receives a bounded process-group claim", async () => {
    const directory = createTemporaryDirectory()
    const counterDatabase = join(directory, "counter.sqlite")
    const detachedReady = join(directory, "detached-ready")
    initializeCounter(counterDatabase)
    const owner = spawnBroker(directory, "detached-test", 2, 1, [
      process.execPath,
      DETACHED_NESTED_FIXTURE_PATH,
      CLI_PATH,
      directory,
      counterDatabase,
      detachedReady,
    ])
    await waitForFile(detachedReady)
    const external = spawnBroker(directory, "detached-test", 2, 1, [
      process.execPath,
      COUNTER_FIXTURE_PATH,
      counterDatabase,
      "150",
    ])

    expect(await Promise.all([owner.exited, external.exited])).toEqual([0, 0])
    expect(readMaximum(counterDatabase)).toBe(2)
  })

  test("a cross-group hop under an active claim fails instead of deadlocking", async () => {
    const directory = createTemporaryDirectory()
    const command = spawnBroker(directory, "detached-wrapper-test", 1, 1, [
      process.execPath,
      CLI_PATH,
      "run",
      "--state",
      directory,
      "--pool",
      "detached-wrapper-test",
      "--limit",
      "1",
      "--weight",
      "1",
      "--diagnostics",
      "quiet",
      "--",
      process.execPath,
      DETACHED_WRAPPER_FIXTURE_PATH,
      CLI_PATH,
      directory,
    ])

    expect(await withTimeout(command.exited, 3_000)).toBe(
      CONFIGURATION_EXIT_CODE,
    )
    const diagnostics = (await new Response(command.stderr).text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { details?: unknown; event: string })
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        event: "job.subclaim-cross-group-rejected",
        details: expect.objectContaining({ exitCode: CONFIGURATION_EXIT_CODE }),
      }),
    )
  })

  test("memory pressure terminates the newest process group with the resource exit status", async () => {
    const directory = createTemporaryDirectory()
    const pressureFile = join(directory, "pressure")
    await Bun.write(pressureFile, "1")
    const olderReady = join(directory, "older-ready")
    const olderChild = join(directory, "older-child")
    const newerReady = join(directory, "newer-ready")
    const newerChild = join(directory, "newer-child")
    const environment = {
      RESOURCE_BROKER_TEST_PRESSURE_FILE: pressureFile,
      RESOURCE_BROKER_PRESSURE_POLL_INTERVAL_MS: "25",
      RESOURCE_BROKER_CANCELLATION_COOLDOWN_MS: "1000",
      RESOURCE_BROKER_FORCE_KILL_DELAY_MS: "100",
    }
    const older = spawnBroker(
      directory,
      "pressure-test",
      2,
      1,
      [process.execPath, PROCESS_TREE_FIXTURE_PATH, olderReady, olderChild],
      environment,
    )
    await waitForFile(olderReady)
    const newer = spawnBroker(
      directory,
      "pressure-test",
      2,
      1,
      [process.execPath, PROCESS_TREE_FIXTURE_PATH, newerReady, newerChild],
      environment,
    )
    await waitForFile(newerReady)

    await Bun.write(pressureFile, "4")
    expect(await withTimeout(newer.exited, 3_000)).toBe(
      RESOURCE_CANCELLATION_EXIT_CODE,
    )
    const diagnostics = (await new Response(newer.stderr).text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { details?: unknown; event: string })
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        event: "job.cancelled",
        details: expect.objectContaining({
          exitCode: 75,
          reason: "macOS memory pressure: critical",
          pressureLevel: "critical",
        }),
      }),
    )
    using pressureState = new BrokerState(directory)
    expect(pressureState.listEvents("pressure-test", 20)).toContainEqual(
      expect.objectContaining({
        event: "job.cancelled",
        details: expect.objectContaining({
          exitCode: 75,
          reason: "macOS memory pressure: critical",
          pressureLevel: "critical",
        }),
      }),
    )
    await Bun.write(pressureFile, "1")
    await waitForProcessExit(Number(readFileSync(newerChild, "utf8")))
    expect(isProcessRunning(Number(readFileSync(olderChild, "utf8")))).toBe(
      true,
    )

    older.kill("SIGTERM")
    await withTimeout(older.exited, 3_000)
  })

  test("an independent watchdog kills the command group after hard owner death", async () => {
    const directory = createTemporaryDirectory()
    const readyPath = join(directory, "ready")
    const childPidPath = join(directory, "child")
    const broker = spawnBroker(directory, "watchdog-test", 1, 1, [
      process.execPath,
      PROCESS_TREE_FIXTURE_PATH,
      readyPath,
      childPidPath,
    ])
    await waitForFile(readyPath)

    broker.kill("SIGKILL")
    await withTimeout(broker.exited, 3_000)
    await Promise.all([
      waitForProcessExit(Number(readFileSync(readyPath, "utf8"))),
      waitForProcessExit(Number(readFileSync(childPidPath, "utf8"))),
    ])
    using state = new BrokerState(directory)
    await withTimeout(
      (async () => {
        while (state.listActiveJobs("watchdog-test").length > 0)
          await Bun.sleep(20)
      })(),
      3_000,
    )
    expect(state.listActiveJobs("watchdog-test")).toEqual([])
  })

  test("a successful command leader cannot leave background group members running", async () => {
    const directory = createTemporaryDirectory()
    const childPidPath = join(directory, "background-child")
    const broker = spawnBroker(directory, "background-test", 1, 1, [
      process.execPath,
      BACKGROUND_EXIT_FIXTURE_PATH,
      childPidPath,
    ])

    expect(await withTimeout(broker.exited, 3_000)).toBe(0)
    await waitForProcessExit(Number(readFileSync(childPidPath, "utf8")))
  })

  test("hard nested-broker death drains its command group before releasing the claim", async () => {
    const directory = createTemporaryDirectory()
    const counterDatabase = join(directory, "counter.sqlite")
    const nestedPidPath = join(directory, "nested-broker")
    const readyPath = join(directory, "nested-ready")
    initializeCounter(counterDatabase)
    const owner = spawnBroker(directory, "nested-recovery-test", 1, 1, [
      process.execPath,
      NESTED_OWNER_RECOVERY_FIXTURE_PATH,
      CLI_PATH,
      directory,
      counterDatabase,
      nestedPidPath,
      readyPath,
    ])
    await Promise.all([waitForFile(nestedPidPath), waitForFile(readyPath)])

    process.kill(Number(readFileSync(nestedPidPath, "utf8")), "SIGKILL")
    expect(await withTimeout(owner.exited, 5_000)).toBe(0)
    expect(readMaximum(counterDatabase)).toBe(1)
  })

  test("reserves exit status 75 for resource cancellation", async () => {
    const directory = createTemporaryDirectory()
    const command = spawnBroker(directory, "exit-test", 1, 1, [
      "/bin/sh",
      "-c",
      "exit 75",
    ])

    expect(await command.exited).toBe(CHILD_EXIT_CODE_COLLISION_REMAP)
    const diagnostics = (await new Response(command.stderr).text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { details?: unknown; event: string })
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        event: "job.completed",
        details: { exitCode: 76, childExitCode: 75 },
      }),
    )
  })

  test("nested diagnostics preserve a child exit-status collision", async () => {
    const directory = createTemporaryDirectory()
    const command = spawnBroker(directory, "wrapper-chain-test", 1, 1, [
      process.execPath,
      WRAPPER_CHAIN_FIXTURE_PATH,
      CLI_PATH,
      directory,
      "1",
      String(RESOURCE_CANCELLATION_EXIT_CODE),
    ])

    expect(await command.exited).toBe(CHILD_EXIT_CODE_COLLISION_REMAP)
    const diagnostics = (await new Response(command.stderr).text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { details?: unknown; event: string })
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        event: "job.subclaim-completed",
        details: expect.objectContaining({ exitCode: 76, childExitCode: 75 }),
      }),
    )
  })

  test("returns usage status 64 for invalid CLI options", async () => {
    const unknownOption = Bun.spawn(
      [process.execPath, CLI_PATH, "run", "--bogus", "x"],
      { stdio: ["ignore", "ignore", "ignore"] },
    )
    const invalidWeight = Bun.spawn(
      [
        process.execPath,
        CLI_PATH,
        "run",
        "--pool",
        "usage-test",
        "--limit",
        "1",
        "--weight",
        "2",
        "--",
        "/usr/bin/true",
      ],
      { stdio: ["ignore", "ignore", "ignore"] },
    )

    expect(
      await Promise.all([unknownOption.exited, invalidWeight.exited]),
    ).toEqual([64, 64])
  })
})

function spawnBroker(
  stateDirectory: string,
  pool: string,
  limit: number,
  weight: number,
  command: string[],
  environment: Record<string, string> = {},
): Bun.Subprocess<"ignore", "ignore", "pipe"> {
  return Bun.spawn({
    cmd: [
      process.execPath,
      CLI_PATH,
      "run",
      "--state",
      stateDirectory,
      "--pool",
      pool,
      "--limit",
      String(limit),
      "--weight",
      String(weight),
      "--diagnostics",
      "jsonl",
      "--",
      ...command,
    ],
    env: { ...process.env, ...environment },
    stdio: ["ignore", "ignore", "pipe"],
  })
}

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "resource-broker-test-"))
  temporaryDirectories.push(directory)
  return directory
}

function readMaximum(databasePath: string): number {
  using database = new Database(databasePath, { readonly: true })
  return (
    database
      .query<
        { maximum: number },
        []
      >("SELECT maximum FROM counter WHERE singleton = 1")
      .get()?.maximum ?? 0
  )
}

function initializeCounter(databasePath: string): void {
  using database = new Database(databasePath, { create: true })
  database.run("PRAGMA journal_mode = WAL")
  database.run(
    "CREATE TABLE counter(singleton INTEGER PRIMARY KEY, active INTEGER NOT NULL, maximum INTEGER NOT NULL)",
  )
  database.run(
    "INSERT INTO counter(singleton, active, maximum) VALUES (1, 0, 0)",
  )
}

async function waitForFile(path: string): Promise<void> {
  await withTimeout(
    (async () => {
      while (!existsSync(path)) await Bun.sleep(20)
    })(),
    3_000,
  )
}

async function waitForAnyFile(paths: string[]): Promise<number> {
  return withTimeout(
    (async () => {
      while (true) {
        const index = paths.findIndex((path) => existsSync(path))
        if (index >= 0) return index
        await Bun.sleep(20)
      }
    })(),
    3_000,
  )
}

async function waitForProcessExit(pid: number): Promise<void> {
  await withTimeout(
    (async () => {
      while (isProcessRunning(pid)) await Bun.sleep(20)
    })(),
    3_000,
  )
}

function isProcessRunning(pid: number): boolean {
  const result = Bun.spawnSync(["/bin/ps", "-o", "stat=", "-p", String(pid)])
  const status = result.stdout.toString().trim()
  return result.exitCode === 0 && Boolean(status) && !status.startsWith("Z")
}

async function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
): Promise<T> {
  return Promise.race([
    promise,
    Bun.sleep(milliseconds).then(() => {
      throw new Error(`Timed out after ${milliseconds}ms.`)
    }),
  ])
}
