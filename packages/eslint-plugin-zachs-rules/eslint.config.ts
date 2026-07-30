import type { ESLint } from "eslint"
import stylisticPlugin from "@stylistic/eslint-plugin"
import parser from "@typescript-eslint/parser"
import { defineConfig } from "eslint/config"
import zachsRules from "./src/index.ts"

export default defineConfig([
  {
    ignores: ["dist/**", "eslint.config.ts", "fixtures/**", "oxlint.config.ts"],
  },
  {
    name: "eslint-plugin-zachs-rules/bootstrap",
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "@stylistic": stylisticPlugin,
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- @typescript-eslint rule modules are runtime-compatible with ESLint plugin objects, but their generic rule types do not line up exactly.
      "zachs-rules": zachsRules as unknown as ESLint.Plugin,
    },
    rules: {
      "@stylistic/lines-around-comment": [
        "error",
        {
          beforeBlockComment: true,
          allowArrayStart: true,
          allowBlockStart: true,
          allowClassStart: true,
          allowEnumStart: true,
          allowInterfaceStart: true,
          allowModuleStart: true,
          allowObjectStart: true,
          allowTypeStart: true,
        },
      ],
      "zachs-rules/require-intentional-module-const": ["error", { maxUses: 3 }],
      "zachs-rules/require-intentional-single-use-local-const": [
        "error",
        { ignoreNestedFunctionReads: true },
      ],
      "zachs-rules/require-intentional-single-use-type-alias": "error",
    },
  },
])
