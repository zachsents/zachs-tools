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
- Avoid deep nesting and misdirection. Prefer inlining helper logic unless extraction significantly improves readability.
- Be wary of ode structure (e.g. variables, helpers, etc.) that exist only due to iterative edits by agents. Re-evaluate which variables actually need to exist to serve the end goal; simplify aggressively.
- Prefer declarative, expression-based code over imperative mutation.
  - Generally, this leads to better type-safety through inference. Imperative mutation forces vague annotations like `Record<string, unknown>` that destroy downstream type safety.
  - Prefer conditional spreads and ternaries for conditional properties.
  - Use `Array.filter`, `.map`, `.flatMap`, etc. over imperative loops with `push`.
  - The exception is when an imperative loop may significantly improve performance e.g. looping with a short-circuit condition.
- When vanilla JavaScript lacks the right utility, reach for Remeda (`R`) or @zachsents/zippy. They provide well-typed functional utilities that keep code declarative without sacrificing type safety.
- Prefer zippy's `pipe` over chained native array methods when it fits the surrounding code.
- Use `Promise.all` when possible to speed things up.
- Use `try/catch` very sparingly
  - Only use it when meaningful work needs to happen in response to an error.
  - Do not use `try/catch` just to swallow errors or re-log them.
- Prefer self-explanatory code through naming and structure, but comment when intent isn't immediately obvious.
  - This rule may be in conflict with the expectation to inline one-off helpers; prefer inlining + commenting over unnecessary abstraction.
  - Never comment obvious behavior.
- If you break any coding rule, leave a comment with `REVIEW: [reason]`.
- Avoid unnecessary spreads. Confirm the spread is actually needed to create a new reference.
- Avoid manually re-listing all object properties. Prefer object spread, or `R.pick` / `R.omit`.
- Avoid overly defensive coding for scenarios that would never happen.
- Avoid jumping into implementing long-winded workarounds or hacks. If what the user asks for isn't directly feasible, stop, explain, and come ready to brainstorm instead.
- For conditionals, use the simplest check that is correct e.g. `if(someVar)` is fine over `if(Boolean(someVar))`
- Avoid strict `===` / `!==` for nullish checks unless the distinction between `null` and `undefined` matters.

## Git

- Never perform Git writes unless explicitly instructed.
- If asked to commit, keep commit messages short.

## Co-working

- If files change unexpectedly, assume the change came from the user or another agent. There are often multiple users/agents working in the same tree.
- If the change is in direct conflict with what you're doing, stop and explain to the user.

## Dependencies

- Always add dependencies using `bun add` to get the latest version.
- Do not manually edit `package.json` to add versions; let Bun resolve the version automatically.
- After adding a workspace dependency, always run `bun install` so the workspace links correctly.

## Tooling & Scaffolding

- Prefer using official CLI tools or generators over manually creating or editing config files.
- Use `@zachsents/prettier-config` instead of recreating the shared Prettier settings.
- Extend `@zachsents/oxlint-config` for oxlint configuration. React projects should also use `@zachsents/oxlint-config/react`.
