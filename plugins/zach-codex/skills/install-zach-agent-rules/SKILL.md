---
name: install-zach-agent-rules
description: Install or refresh Zach's reusable agent guidance in a repository while preserving existing instructions. Use when the user asks to add, install, sync, update, or bootstrap Zach's AGENTS.md rules in a project.
---

# Install Zach Agent Rules

Use the bundled installer to copy the current rule set into a repository and add a managed pointer to its root `AGENTS.md`.

## Workflow

1. Inspect the target repository's existing `AGENTS.md` and dirty worktree before installation.
2. Run `bun scripts/install.ts --target <repository-root>`.
3. Review the resulting `.agents/zach-rules/` files and managed block in `AGENTS.md`.
4. Run `bun scripts/install.ts --target <repository-root> --check` to verify the installed rules are current.
5. Do not edit content outside the managed block or overwrite other agent guidance.

The installer replaces only files under `.agents/zach-rules/` and the block delimited by `zach-agent-rules:start` and `zach-agent-rules:end`.
