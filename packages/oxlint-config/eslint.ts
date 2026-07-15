import type { ESLint } from "eslint"
import parser from "@typescript-eslint/parser"
import { defineConfig } from "eslint/config"
import zachsRules from "eslint-plugin-zachs-rules"

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- @typescript-eslint rule modules are runtime-compatible with ESLint plugin objects, but their generic rule types do not line up exactly.
const eslintPlugin = zachsRules as unknown as ESLint.Plugin

export default defineConfig([
  {
    name: "zachs-rules/base",
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "zachs-rules": eslintPlugin,
    },
    rules: {
      "lines-around-comment": [
        "error",
        {
          beforeBlockComment: true,
          allowArrayStart: true,
          allowBlockStart: true,
          allowClassStart: true,
          allowObjectStart: true,
        },
      ],
      "zachs-rules/no-overly-broad-parameters": "error",
      "zachs-rules/no-single-use-type-alias": "error",
      "zachs-rules/prefer-object-spread-for-exact-object-map": "error",
      "zachs-rules/prefer-pick-for-object-subset-map": "error",
    },
  },
])
