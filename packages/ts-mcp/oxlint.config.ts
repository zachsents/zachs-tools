import { defineConfig } from "oxlint"
import baseConfig from "../oxlint-config/index.ts"

export default defineConfig({
  extends: [baseConfig],
  ignorePatterns: ["test/**"],
})
