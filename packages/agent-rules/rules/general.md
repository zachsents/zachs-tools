# General Coding Rules

## Workflow

- Use Bun as the package manager and runtime, including scripts and CLIs such as `bunx shadcn@latest add menu`.
- Research current documentation before using a library; do not rely on remembered APIs.
- If the project has an oxlint config, run `oxlint --rules` before writing code and follow the active rules.
- Never start a dev server unless the user asks. If one is required and not running, stop and ask.
- Avoid long workarounds or hacks. If a request is not directly feasible, explain the constraint and offer alternatives.

## Stack Defaults

Use these unless the user or repository specifies otherwise:

- **Runtime and package management:** Bun
- **Full-stack React:** Vite + TanStack Start
- **TanStack libraries:** Router, Query, Form, Table, Virtual, Pacer
- **Backend:** Convex
- **Linting:** oxlint in type-aware mode with `@zachsents/oxlint-config`; add `@zachsents/oxlint-config/react` for React
- **Formatting:** Prettier with `@zachsents/prettier-config`
- **Type checking:** TypeScript 7's native `tsc`
- **Styling:** TailwindCSS v4
- **Components:** shadcn/ui with Base UI
- **Authentication:** Better Auth
- **Utilities:** `@zachsents/zippy`, Remeda, Zod v4, date-fns

## Utilities

- Prefer `@zachsents/zippy` over Remeda or a one-off helper when it makes the
  code cleaner or preserves stronger type inference. Reach for its
  data-first/data-last iterable and object helpers, type-safe selectors and
  guards, math utilities, matching and zipping helpers, and pipelines.
- Prefer zippy's `pipe` for multi-step transformations when the pipeline reads
  more clearly than nested calls or chained array methods. Keep a direct call
  for a single simple operation.
- Use Remeda when zippy does not cover the needed operation cleanly.

## Code Style

- Use function declarations for top-level and exported functions; use arrows for callbacks and closures.
- Prefer `const`; mutate only when required.
- Inline single-use values and helpers unless it harms readability. Hoist only reused or semantically meaningful values.
- Remove code structure left over from iterative edits. Avoid deep nesting, misdirection, and defensive handling for impossible cases.
- Prefer declarative, expression-based code over imperative mutation for stronger type inference.
  - Build objects and arrays in one expression with conditional spreads and ternaries.
  - Prefer `filter`, `map`, and `flatMap` over loops with `push`, except when a loop materially improves performance, such as short-circuiting.
- Use `Promise.all` for independent async work.
- Use `try/catch` only for meaningful recovery; never swallow or merely re-log errors.
- Prefer self-explanatory code. Comment non-obvious intent, never obvious behavior. Prefer an inline comment over extracting a one-use helper only to explain it.
- Mark intentional rule exceptions with `REVIEW: [reason]`.
- Avoid unnecessary spreads and manual property re-listing. Prefer object spread, `R.pick`, or `R.omit`.
- Use the simplest correct condition. Prefer truthy checks where appropriate; distinguish `null` from `undefined` only when needed.

## JSDoc

- For destructured object parameters, use a meaningful parent name in property
  paths—usually `options` for an options object—rather than a synthetic name
  such as `root0`.
- Do not require or add `@returns` tags. Let the TypeScript signature describe
  the return type, and put non-obvious return semantics in the JSDoc summary
  instead of maintaining a redundant tag.

## TypeScript

- Use `ts-mcp` throughout implementation: inspect inferred types with hover and inlay hints, find references before changing shared symbols, and check diagnostics after meaningful edits.
- Prefer inference; add explicit annotations only when they improve readability.
- Use `unknown` for genuinely unknown values.
- Avoid casts unless required. Never use `as unknown as`.
- Import or derive existing types instead of redefining them.
- Validate untrusted values with Zod and infer their types from the schema.
- Do not create `.d.ts` files to declare modules.
- Make types specific as early in the type graph as possible.
- Use `any` only with `infer` or as an intentionally ignored generic parameter.

## Dependencies and Scaffolding

- Add dependencies with `bun add` or update them with `bun update <package> --latest`; let Bun resolve versions.
- After adding a workspace dependency, run `bun install` to create the workspace link.
- Prefer official CLIs and generators over manual scaffolding.

## Check Pipeline

Every package, whether standalone or in a workspace, should expose:

- `typecheck`: `tsc --noEmit`
- `lint`: `oxlint --type-aware`
- `lint:fix`: `oxlint --type-aware --fix-suggestions`
- `check`: `bun run typecheck && bun run lint`

Standalone packages should also expose:

- `format`: `prettier . --write`
- `fix`: `bun run typecheck && bun run lint:fix && bun run format`

Monorepo roots should use Turborepo and expose:

- `typecheck`: `turbo run typecheck`
- `format`: `prettier . --write`
- `lint`: `turbo run lint`
- `lint:fix`: `turbo run lint:fix`
- `check`: `turbo run check`
- `fix`: `bun run typecheck && bun run lint:fix && bun run format`

Keep formatting at the monorepo root so one Prettier invocation covers the repository. Use this `turbo.json` structure:

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "lint:fix": {
      "cache": false,
      "outputs": []
    },
    "check": {
      "dependsOn": ["^check"],
      "outputs": []
    }
  }
}
```

Keep `lint:fix` uncached because it writes to the working tree. Add task outputs or inputs only when needed.

After edits, run `bun run fix` when available. Use `fix` for development and agent work; use non-writing `check` for CI and validation-only contexts. Without `fix`, run the smallest relevant typecheck, lint-fix, and formatting commands.

## Git and Co-working

- Never perform Git writes unless explicitly instructed. If asked to commit, use a short message.
- Treat unexpected file changes as concurrent user or agent work. If they conflict with the task, stop and explain.
