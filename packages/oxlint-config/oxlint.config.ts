import { defineConfig } from "oxlint"
import baseConfig from "./index.ts"

export default defineConfig({
  extends: [baseConfig],
  overrides: [
    {
      files: ["*.test.ts"],
      rules: {
        "jsdoc-js/require-jsdoc": "off",
      },
    },
  ],
})
