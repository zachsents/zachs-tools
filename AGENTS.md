# Agent Instructions

The reusable project rules live in `packages/agent-rules/AGENTS.md`. Read and follow that file before editing code in this repository.

## Repository-specific packaging

- In publishable workspace packages, use explicit semver ranges for internal dependencies and peer dependencies instead of `workspace:*`. Bun can pack workspace references using stale workspace versions from `bun.lock` after a package version bump. `workspace:*` is still acceptable in the private root package.
