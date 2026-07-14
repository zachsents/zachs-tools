import type { ESLint, Linter } from "eslint"
import parser from "@typescript-eslint/parser"
import noOverlyBroadParameters from "./rules/no-overly-broad-parameters"
import noSingleUseConst from "./rules/no-single-use-const"
import preferObjectSpreadForExactObjectMap from "./rules/prefer-object-spread-for-exact-object-map"
import preferPickForObjectSubsetMap from "./rules/prefer-pick-for-object-subset-map"

const rules = {
  "no-overly-broad-parameters": noOverlyBroadParameters,
  "no-single-use-const": noSingleUseConst,
  "prefer-object-spread-for-exact-object-map":
    preferObjectSpreadForExactObjectMap,
  "prefer-pick-for-object-subset-map": preferPickForObjectSubsetMap,
}

type Plugin = {
  meta: {
    name: string
  }
  configs: {
    recommended: Linter.Config[]
    "recommended-type-checked": Linter.Config[]
  }
  rules: typeof rules
}

const plugin: Plugin = {
  meta: {
    name: "eslint-plugin-zachs-rules",
  },
  configs: {
    recommended: [],
    "recommended-type-checked": [],
  },
  rules,
}

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- @typescript-eslint rule modules are runtime-compatible with ESLint plugin objects, but their generic rule types do not line up exactly.
const eslintPlugin = plugin as unknown as ESLint.Plugin

plugin.configs.recommended = [
  {
    name: "zachs-rules/recommended",
    plugins: {
      "zachs-rules": eslintPlugin,
    },
    rules: {
      "zachs-rules/no-single-use-const": [
        "error",
        { ignoreConstantCase: true, maxUses: 3 },
      ],
    },
  },
]

plugin.configs["recommended-type-checked"] = [
  {
    name: "zachs-rules/recommended-type-checked",
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
      "zachs-rules/no-overly-broad-parameters": "error",
      "zachs-rules/no-single-use-const": [
        "error",
        { ignoreConstantCase: true, maxUses: 3 },
      ],
      "zachs-rules/prefer-object-spread-for-exact-object-map": "error",
      "zachs-rules/prefer-pick-for-object-subset-map": "error",
    },
  },
]

export default plugin
