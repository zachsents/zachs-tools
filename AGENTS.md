# Agent Instructions

The reusable project rules live in `packages/agent-rules/AGENTS.md`. Read and follow that file before editing code in this repository.

## Repository-specific packaging

- In publishable workspace packages, pin dependencies and peer dependencies on other Zach-owned packages to exact versions instead of using ranges or `workspace:*`. `workspace:*` is still acceptable in the private root package.
- When a Zach-owned package changes, audit every internal consumer. When a consumer starts using behavior from the new release, update its exact pin and bump the consumer package in the same change. Do not rely on consumer lockfiles to refresh a compatible transitive range.
- After changing an internal dependency pin, verify the corresponding workspace dependency in `bun.lock` manually. Bun may preserve the old specifier when the dependency resolves to a local workspace, even after `bun install`.
- Before publishing, inventory all Zach-owned package references in publishable manifests and verify that every exact pin matches the version whose API or behavior the consumer was built and tested against.
- Bump publishable workspace versions with `bun run version:bump <workspace> <increment-or-version>`. The script updates both the package manifest and its otherwise-stale workspace version in `bun.lock` without creating a Git commit or tag.
- When bumping the Zach Codex plugin, keep the version synchronized in `plugins/zach-codex/package.json`, `plugins/zach-codex/.codex-plugin/plugin.json`, and `.agents/plugins/marketplace.json` so the marketplace discovers the release.
