import { defineConfig } from "eslint/config"
import baseConfig from "./packages/oxlint-config/eslint.ts"

export default defineConfig([
  {
    ignores: [
      "**/dist/**",
      "**/oxlint.config.ts",
      "eslint.config.ts",
      "packages/eslint-plugin-zachs-rules/fixtures/**",
      "packages/ts-mcp/test/**",
      "plugins/**",
    ],
  },
  baseConfig,
])
