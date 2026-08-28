# Resource Broker

`resource-broker` coordinates resource-intensive local commands across agents, repositories, and worktrees. Named pools use a shared per-user SQLite database, so separate shells cannot exceed the same admission limit.

## Install

```sh
bun add --global @zachsents/resource-broker
```

## Run commands

Reserve one slot in a two-slot pool:

```sh
resource-broker run --pool automate-ax-validation --limit 2 --weight 1 -- bun run typecheck:unlocked
```

Reserve the whole pool for a command that can run two expensive descendants:

```sh
resource-broker run --pool automate-ax-validation --limit 2 --weight 2 -- bun run check:unlocked
```

A brokered command owns a new process group. Nested `resource-broker` calls in the same group can reuse a verified delegated claim; cross-group descendants of the root reservation receive separately supervised claims. Their aggregate claims cannot exceed the ancestor's reserved weight, and concurrent descendants serialize when they share one delegated claim. A cross-group hop beneath an already active delegated claim fails with status 78 instead of waiting on its own capacity. Signals and resource cancellation target every owned process group, including grandchildren. Independent watchdogs kill those groups if a broker owner crashes or receives `SIGKILL`.

All active users of a pool must specify the same `--limit`. A conflicting limit exits with configuration status 78 instead of weakening active admission guarantees.

When `CI=true`, the CLI runs the command directly without creating local broker state. Repositories can therefore declare the package as a development dependency and use the same scripts locally and in CI.

## Memory pressure

On macOS, every owner monitors `kern.memorystatus_vm_pressure_level`. Warning or critical pressure atomically selects the newest active job across all pools, sends its process group `SIGTERM`, and escalates to `SIGKILL` after three seconds. Continued pressure can cancel another newest job after a five-second cooldown.

A job cancelled for resource pressure exits with status **75** (`RESOURCE_CANCELLATION_EXIT_CODE`) regardless of the signal observed by its child. Status 75 is reserved: an ordinary child status 75 is remapped to 76 and preserved as `childExitCode` in diagnostics. Callers can therefore distinguish retryable resource cancellation from command failure.

## Diagnostics

Use JSON Lines during a run:

```sh
resource-broker run --diagnostics jsonl --pool validation --limit 2 -- bun run typecheck
```

Inspect active ownership or persisted events:

```sh
resource-broker status --pool validation --json
resource-broker diagnostics --pool validation --count 100
```

Events include `schemaVersion`, timestamp, job and process-group IDs, pool weight and limit, command arguments, public and raw child exit statuses, cancellation reason, and pressure level. The broker retains seven days in `~/Library/Caches/zachs-resource-broker/state.sqlite` on macOS. Set `RESOURCE_BROKER_STATE_DIR` to isolate another state database.
