import { defineConfig } from "oxlint"
import baseConfig from "../oxlint-config/index.ts"

export default defineConfig({
  extends: [baseConfig],
  overrides: [
    {
      files: ["fixtures/**", "test/**"],
      rules: {
        "jsdoc-js/require-jsdoc": "off",
      },
    },
  ],
})
