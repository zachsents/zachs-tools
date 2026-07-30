# Agent Instructions

The reusable project rules live in `packages/agent-rules/AGENTS.md`. Read and follow that file before editing code in this repository.

## Repository-specific packaging

- Declare every internal dependency with `workspace:*`; Turbo uses those edges to order tasks.
- Add a Changeset for publishable changes. The version workflow runs `changeset version`, synchronizes plugin metadata, and then runs `bun update` so `bun.lock` records the versions that Bun will publish.
- Publish only with `bun publish` so Bun replaces `workspace:*` using the versions recorded in `bun.lock`.
- Keep the Zach Codex version synchronized in `plugins/zach-codex/package.json`, `plugins/zach-codex/.codex-plugin/plugin.json`, and `.agents/plugins/marketplace.json`.
