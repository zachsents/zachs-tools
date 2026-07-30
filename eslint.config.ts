import { defineConfig } from "eslint/config"
import baseConfig from "@zachsents/oxlint-config/eslint"

export default defineConfig([
  {
    ignores: [
      "packages/**",
      "plugins/**",
      "scripts/**/*.test.ts",
      "eslint.config.ts",
      "oxlint.config.ts",
    ],
  },
  baseConfig,
  {
    name: "zachs-tools/scripts",
    files: ["scripts/**/*.ts"],
    rules: {
      // REVIEW: CLI scripts intentionally use module scope as their execution scope.
      "zachs-rules/require-intentional-module-const": "off",
    },
  },
])
