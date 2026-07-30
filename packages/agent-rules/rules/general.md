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
- Prefer native array methods for a simple direct transformation of an array,
  such as `values.map(mapper)`, `values.filter(predicate)`, or
  `values.flatMap(mapper)`. Use zippy's collection helpers when they add value,
  such as for a non-array iterable, a property-path selector, a data-last
  pipeline, or stronger type inference.
- Prefer zippy's `pipe` for multi-step transformations when the pipeline reads
  more clearly than nested calls or chained array methods. Keep a direct call
  for a single simple operation.
- Use Remeda when zippy does not cover the needed operation cleanly.

## Code Style

- Use function declarations for top-level and exported functions; use arrows for callbacks and closures.
- Prefer `const`; mutate only when required.
- Inline single-use values and helpers unless it harms readability. Hoist only reused or semantically meaningful values.
- Remove code structure left over from iterative edits. Avoid deep nesting, misdirection, and defensive handling for impossible cases.
- Do not raise theoretical edge cases without a realistic execution path in this system.
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

## Monorepos and Releases

- Use Bun workspaces, Turborepo, and Changesets for JavaScript and TypeScript
  monorepos.
- Declare every cross-workspace dependency in the consuming package with
  `workspace:*`. Include development and build-time relationships, not only
  runtime imports. A package's manifest should contain everything it needs to
  build, check, and publish when considered on its own.
- Import shared workspace tooling by package name instead of reaching into a
  sibling directory. Give each package its own lint config and explicit config
  dependency. Keep formatting at the monorepo root.
- When ESLint-only rules supplement oxlint, make each code package's `lint`
  command run both engines in parallel so standalone package checks enforce the
  same rules as repository checks. Do not add separately exposed engine commands
  unless there is a real workflow that invokes them individually.
- Avoid circular workspace dependencies. When a shared config loads a plugin
  from the same repository, give the plugin a small self-contained bootstrap
  config rather than making the plugin depend on the config that loads it.
- Let Turbo derive task ordering from the workspace graph. Use `^build`,
  `^check`, and similar dependency tasks instead of hard-coded package lists,
  `--cwd` chains, or prebuild scripts that manually build sibling packages.
- Register repository-owned checks as Turbo root tasks such as `//#lint:root`.
  Give those tasks `^build` when they consume workspace tooling, then invoke
  them alongside package tasks so Turbo can schedule both from one graph.
- Give build tasks accurate `outputs`; leave validation tasks with no outputs,
  and disable caching for tasks that write to the working tree.
- Use Changesets to record publishable changes and create version PRs. Couple
  packages when one published artifact embeds or resolves another workspace's
  exact version.
- After `changeset version`, run `bun update` and commit `bun.lock`. Bun resolves
  published `workspace:*` versions from the lockfile, so a manifest-only version
  bump can publish a stale internal dependency version.
- Publish workspace packages with `bun publish`, not `changeset publish` or
  `npm publish`, so Bun replaces workspace protocols.
- In CI and release jobs, use Turbo filters that include each target's dependency
  closure. Install with `bun install --frozen-lockfile` after the version PR has
  committed the refreshed lockfile.

## Check Pipeline

Every package, whether standalone or in a workspace, should expose:

- `typecheck`: `tsc --noEmit`
- `lint`: oxlint and ESLint in parallel
- `lint:fix`: both lint engines' fix commands in parallel
- `check`: `bun run typecheck && bun run lint`

Standalone packages should also expose:

- `format`: `prettier . --write`
- `fix`: `bun run typecheck && bun run lint:fix && bun run format`

Monorepo roots should use Turborepo and expose:

- `typecheck`: `turbo run typecheck`
- `format`: `prettier . --write`
- `lint`: `turbo run lint lint:root`
- `lint:fix`: `turbo run lint:fix lint:root:fix`
- `check`: `turbo run check check:root`
- `fix`: `bun run typecheck && bun run lint:fix && bun run format`

Keep formatting at the monorepo root so one Prettier invocation covers the repository. Use this `turbo.json` structure:

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "//#lint:root": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint:fix": {
      "dependsOn": ["^build"],
      "cache": false,
      "outputs": []
    },
    "//#lint:root:fix": {
      "dependsOn": ["^build"],
      "cache": false,
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "check": {
      "dependsOn": ["^check", "^build"],
      "outputs": []
    },
    "//#check:root": {
      "dependsOn": ["^build"],
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
