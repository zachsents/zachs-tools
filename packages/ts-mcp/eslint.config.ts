import { defineConfig } from "eslint/config"
import baseConfig from "@zachsents/oxlint-config/eslint"

export default defineConfig([
  {
    ignores: ["dist/**", "eslint.config.ts", "oxlint.config.ts", "test/**"],
  },
  baseConfig,
])
