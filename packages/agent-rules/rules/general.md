# General Coding Rules

## Runtime

- Only ever use Bun as the package manager and runtime. This includes running scripts e.g. `bunx shadcn@latest add menu`

## Research

- When using a library, always research the latest docs. Your knowledge is often out of date.

## Session Start

- If the project has an oxlint config, run `oxlint --rules` before writing code. Internalize the active rules and avoid code that violates them.
- Never start dev servers on your own. The user is usually running one. If they're not and you need one, stop and ask.

## Check Pipeline

Prefer projects to expose these scripts:

- `typecheck`: `command -v tsgo >/dev/null && tsgo --noEmit || tsc --noEmit`
- `lint`: `oxlint --type-aware --fix --fix-suggestions`
- `format`: `prettier . --write`
- `fix`: `bun run lint && bun run format`
- `check`: `bun run typecheck && bun run fix`

After edits, run `bun run check` when it exists. If the project does not have a `check` script, run the smallest relevant typecheck, lint, and test commands.

## Style

- Use `function` declarations for top-level and exported functions. Use arrow functions for inline callbacks and closures.
- Prefer `const` unless mutation is intentional and required.
- Inline values used once unless it harms readability.
- Do not hoist magic values into constants unless they are reused or semantically meaningful.
- Avoid deep nesting. Prefer inlining helper logic unless extraction significantly improves readability.
- Be wary of variables that exist only due to iterative edits. Re-evaluate which variables actually need to exist and simplify aggressively.

## Declarative Style

- Prefer declarative, expression-based code over imperative mutation. Build objects and arrays in a single expression rather than declaring an empty/partial value and conditionally mutating it.
  - This is critical for type inference. Declarative construction lets TypeScript infer the full shape automatically, whereas imperative mutation forces vague annotations like `Record<string, unknown>` that destroy downstream type safety.
  - Use conditional spreads and ternaries for conditional properties.
  - Use `Array.filter`, `.map`, `.flatMap`, etc. over imperative loops with `push`.
- When vanilla JavaScript lacks the right utility, reach for Remeda (`R`). It provides well-typed functional utilities that keep code declarative without sacrificing type safety.
- Prefer Remeda's `pipe` over chained native array methods when it fits the surrounding code.

## Concurrency

- Use `Promise.all` when possible to speed things up.

## Error Handling

- Use `try/catch` very sparingly.
- Only use it when meaningful work needs to happen in response to an error.
- Do not use `try/catch` just to swallow errors or re-log them.

## Documentation & Comments

- Comment only when intent is not obvious from code.
- Prefer self-explanatory code through naming and structure.
- Never comment obvious behavior.
- If you break any coding rule, leave a comment with `REVIEW: [reason]`.
- Document function declarations unless painfully simple or obvious. Don't use JSDoc tags; use simple descriptions.
- For inline comments describing what a line does, use `//`. For documenting a variable or function, use `/** */`.

## Git

- Never perform Git writes unless explicitly instructed.
- If asked to commit, keep commit messages short.

## Concurrent Changes

- If files change unexpectedly, assume the change came from the user or another agent.
- Do not revert or overwrite unexpected changes unless the user explicitly asks.
- Inspect the change, preserve it, and work with it. Ask only if the change makes the task impossible to complete safely.

## Dependencies

- Always add dependencies using `bun add`.
- Do not manually edit `package.json` to add versions; let Bun resolve the version automatically.
- After adding a workspace dependency, always run `bun install` so the workspace links correctly.

## Tooling & Scaffolding

- Prefer using official CLI tools or generators over manually creating or editing config files.
- Use `@zachsents/prettier-config` instead of recreating the shared Prettier settings.
- Extend `@zachsents/oxlint-config` for oxlint configuration. React projects should also use `@zachsents/oxlint-config/react`.

## Object & Value Handling

- Avoid unnecessary spreads. Confirm the spread is actually needed to create a new reference.
- Avoid manually re-listing all object properties. Prefer object spread, or `R.pick` / `R.omit`.
- Avoid unnecessary defaults, coalescing, optional chaining, or conditions.

## Conditionals

- Use the simplest check that is correct.
- Prefer truthy/falsy checks when appropriate.
- Avoid strict `===` / `!==` for nullish checks unless the distinction between `null` and `undefined` matters.
