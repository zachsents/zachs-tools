import { defineConfig } from "oxlint"
import baseConfig from "./packages/oxlint-config/index.ts"

export default defineConfig({
  extends: [baseConfig],
})
