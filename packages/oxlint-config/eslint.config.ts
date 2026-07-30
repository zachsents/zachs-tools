import { defineConfig } from "eslint/config"
import baseConfig from "./eslint.ts"

export default defineConfig([
  {
    ignores: ["dist/**", "eslint.config.ts", "oxlint.config.ts"],
  },
  baseConfig,
])
