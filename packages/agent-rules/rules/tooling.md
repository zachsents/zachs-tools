# Tooling Rules

## Session Start

- If the project has an oxlint config, run `oxlint --rules` before writing code. Internalize the active rules and avoid code that violates them.
- If the project uses Convex, run `bunx convex dev --once` after editing Convex functions or schema.

## Check Pipeline

Prefer projects to expose these scripts:

- `typecheck`: `command -v tsgo >/dev/null && tsgo --noEmit || tsc --noEmit`
- `lint`: `oxlint --type-aware --fix --fix-suggestions`
- `format`: `prettier . --write`
- `fix`: `bun run lint && bun run format`
- `check`: `bun run typecheck && bun run fix`

After edits, run `bun run check` when it exists. If the project does not have a `check` script, run the smallest relevant typecheck, lint, and test commands.
