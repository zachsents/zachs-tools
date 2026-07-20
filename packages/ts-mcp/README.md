# TS Hover MCP

**Give AI agents TypeScript type inference — no editor required.**

A standalone MCP server that provides type information using [TypeScript 7's native compiler](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/). Works with any MCP client that supports stdio MCP servers.

No running editor or global compiler install is needed. It includes TypeScript 7 and manages native LSP instances directly, keeping them warm for fast subsequent queries.

## Install

Add an MCP server named `ts-hover`:

```json
{
  "mcpServers": {
    "ts-hover": {
      "command": "npx",
      "args": ["-y", "@zachsents/ts-mcp"],
      "cwd": "/tmp"
    }
  }
}
```

## How it works

1. Agent calls a tool (e.g. `hover` with a file path and position)
2. The MCP server finds the nearest `tsconfig.json` to determine the project root
3. It spawns (or reuses) a TypeScript 7 LSP instance for that project
4. Returns the type information
5. The TypeScript instance stays warm for 5 minutes, making follow-up queries near-instant

Multiple project roots are handled automatically — each gets its own TypeScript instance.

## Tools

### `hover`

Get TypeScript type information at a position, plus where it's defined. Returns the same info you'd see hovering in an IDE — resolved types, inferred types, JSDoc — and the definition location.

| Parameter   | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| `file`      | `string` | Absolute path to the TypeScript file |
| `line`      | `number` | Line number (0-indexed)              |
| `character` | `number` | Character position (0-indexed)       |

### `diagnostics`

Get TypeScript errors and warnings for a file, along with available quick fixes and their exact text edits.

| Parameter | Type     | Description                          |
| --------- | -------- | ------------------------------------ |
| `file`    | `string` | Absolute path to the TypeScript file |

### `references`

Find all references to a symbol across the project.

| Parameter   | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| `file`      | `string` | Absolute path to the TypeScript file |
| `line`      | `number` | Line number (0-indexed)              |
| `character` | `number` | Character position (0-indexed)       |

### `outline`

Get a structured outline of all symbols in a file — functions, classes, interfaces, types, variables — with line numbers and nesting.

| Parameter | Type     | Description                          |
| --------- | -------- | ------------------------------------ |
| `file`    | `string` | Absolute path to the TypeScript file |

### `rename`

Rename a symbol across the project. Applies the edits directly to all affected files.

| Parameter   | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| `file`      | `string` | Absolute path to the TypeScript file |
| `line`      | `number` | Line number (0-indexed)              |
| `character` | `number` | Character position (0-indexed)       |
| `newName`   | `string` | The new name for the symbol          |

### `inlay_hints`

Get inferred type annotations for a line range — variable types, parameter types, return types that TypeScript infers but aren't written in code.

| Parameter   | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| `file`      | `string` | Absolute path to the TypeScript file |
| `startLine` | `number` | Start line (0-indexed, inclusive)    |
| `endLine`   | `number` | End line (0-indexed, exclusive)      |

## Configuration

| Env var    | Description                                       |
| ---------- | ------------------------------------------------- |
| `TSC_PATH` | Override the path to the native TypeScript binary |

## License

MIT — Zach Sents
