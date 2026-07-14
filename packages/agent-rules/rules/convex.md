# Convex Rules

> Only applies in projects using Convex as the backend.

## Validation

- After editing Convex functions or schema, run `bunx convex dev --once` to verify the code compiles and deploys correctly.
- Never edit files in `convex/_generated/`; they are auto-generated.

## Patterns

- Use `convex-helpers` when available for common patterns such as custom functions, validators, and relationships.
- Use `@convex-dev/react-query` to bridge Convex with TanStack Query rather than using Convex hooks directly.
- Prefer Convex's built-in scheduling (`ctx.scheduler`) over external cron or queue systems.
