#!/usr/bin/env bun

import { parseArgs } from "node:util"

import { runBrokeredCommand } from "./run.ts"
import {
  BrokerState,
  getDefaultStateDirectory,
  PoolLimitConflictError,
} from "./state.ts"
import { CONFIGURATION_EXIT_CODE, type DiagnosticMode } from "./types.ts"

const USAGE_EXIT_CODE = 64

/** Dispatch the resource-broker subcommand. */
async function main(): Promise<number> {
  const [subcommand, ...args] = process.argv.slice(2)
  switch (subcommand) {
    case "run":
      return runCommand(args)
    case "status":
      return statusCommand(args)
    case "diagnostics":
      return diagnosticsCommand(args)
    case "help":
    case "--help":
    case "-h":
    case undefined:
      printUsage()
      return subcommand ? 0 : USAGE_EXIT_CODE
    default:
      throw new UsageError(`Unknown command ${JSON.stringify(subcommand)}.`)
  }
}

/**
 * Parse and execute a brokered command.
 *
 * @param args - Subcommand arguments.
 */
async function runCommand(args: string[]): Promise<number> {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      diagnostics: { type: "string", default: "text" },
      limit: { type: "string" },
      pool: { type: "string" },
      state: { type: "string" },
      weight: { type: "string", default: "1" },
    },
  })
  if (!values.pool) throw new UsageError("run requires --pool <name>.")
  if (!values.limit) throw new UsageError("run requires --limit <count>.")
  if (!positionals.length)
    throw new UsageError("run requires -- <command> [args...].")

  return runBrokeredCommand({
    command: positionals,
    pool: values.pool,
    limit: parsePositiveInteger(values.limit, "limit"),
    weight: parsePositiveInteger(values.weight, "weight"),
    diagnostics: parseDiagnosticMode(values.diagnostics),
    ...(values.state ? { stateDirectory: values.state } : {}),
  })
}

/**
 * Print current shared-pool ownership.
 *
 * @param args - Subcommand arguments.
 */
function statusCommand(args: string[]): number {
  const { values } = parseArgs({
    args,
    strict: true,
    options: {
      json: { type: "boolean", default: false },
      pool: { type: "string" },
      state: { type: "string" },
    },
  })
  using state = new BrokerState(values.state ?? getDefaultStateDirectory())
  const jobs = state.listActiveJobs(values.pool)
  if (values.json) {
    console.log(JSON.stringify({ schemaVersion: 1, jobs }, undefined, 2))
    return 0
  }
  if (!jobs.length) {
    console.log("No active brokered jobs.")
    return 0
  }
  for (const job of jobs) {
    console.log(
      `${job.pool}\t${job.status}\t${job.weight}/${job.limit}\t${job.id}\t${job.command.join(" ")}`,
    )
  }
  return 0
}

/**
 * Print persisted structured diagnostic events.
 *
 * @param args - Subcommand arguments.
 */
function diagnosticsCommand(args: string[]): number {
  const { values } = parseArgs({
    args,
    strict: true,
    options: {
      count: { type: "string", default: "50" },
      json: { type: "boolean", default: false },
      pool: { type: "string" },
      state: { type: "string" },
    },
  })
  using state = new BrokerState(values.state ?? getDefaultStateDirectory())
  const events = state.listEvents(
    values.pool,
    parsePositiveInteger(values.count, "count"),
  )
  if (values.json)
    console.log(JSON.stringify({ schemaVersion: 1, events }, undefined, 2))
  else for (const event of events) console.log(JSON.stringify(event))
  return 0
}

/**
 * Validate a diagnostic output mode.
 *
 * @param value - Untrusted CLI option.
 * @throws When the selected mode is unsupported.
 */
function parseDiagnosticMode(value: string): DiagnosticMode {
  if (value === "jsonl" || value === "quiet" || value === "text") return value
  throw new UsageError("diagnostics must be text, jsonl, or quiet.")
}

/**
 * Parse one positive integer CLI option.
 *
 * @param value - Untrusted CLI option.
 * @param name - Option name for errors.
 * @throws When the option is not a positive integer.
 */
function parsePositiveInteger(value: string, name: string): number {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1)
    throw new UsageError(`${name} must be a positive integer.`)
  return parsed
}

/** Print the command-line contract. */
function printUsage(): void {
  console.log(`Usage:
  resource-broker run --pool <name> --limit <count> [--weight <count>] [--diagnostics text|jsonl|quiet] -- <command> [args...]
  resource-broker status [--pool <name>] [--json]
  resource-broker diagnostics [--pool <name>] [--count <count>] [--json]`)
}

/** Identify command-line usage errors. */
class UsageError extends Error {}

try {
  process.exitCode = await main()
} catch (error) {
  if (error instanceof UsageError || error instanceof TypeError) {
    console.error(error.message)
    printUsage()
    process.exitCode = USAGE_EXIT_CODE
  } else if (error instanceof PoolLimitConflictError) {
    console.error(error.message)
    process.exitCode = CONFIGURATION_EXIT_CODE
  } else {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
