# zachs-tools

Personal tooling monorepo for agent type-awareness, lint rules, shared formatter and linter configuration, and reusable agent instructions.

## Packages

- `packages/ts-mcp`: MCP server that gives agents TypeScript language-server awareness.
- `packages/eslint-plugin-zachs-rules`: custom ESLint and oxlint rules.
- `packages/prettier-config`: shared Prettier config.
- `packages/oxlint-config`: shared oxlint config objects for `oxlint.config.ts`.
- `packages/agent-rules`: reusable `AGENTS.md` guidance for projects.

## Usage

Use the Prettier config from `package.json`:

```json
{
  "prettier": "@zachsents/prettier-config"
}
```

Use the oxlint config from `oxlint.config.ts`:

```ts
import { defineConfig } from "oxlint"
import baseConfig from "@zachsents/oxlint-config"

export default defineConfig({
  extends: [baseConfig],
})
```

React projects can extend the React config as well:

```ts
import { defineConfig } from "oxlint"
import baseConfig from "@zachsents/oxlint-config"
import reactConfig from "@zachsents/oxlint-config/react"

export default defineConfig({
  extends: [baseConfig, reactConfig],
})
```

Copy or link `packages/agent-rules/AGENTS.md` into projects that should share the agent guidance.

## Development

```sh
bun install
bun run check
```

Bump a publishable workspace package without creating a Git commit or tag:

```sh
bun run version:bump oxlint-config patch
```

The command accepts a workspace package name, directory name, or path and keeps
the package manifest and `bun.lock` workspace version synchronized.
