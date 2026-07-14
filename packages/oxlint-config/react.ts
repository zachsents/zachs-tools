import { defineConfig } from "oxlint"

import baseConfig from "./index.ts"

export default defineConfig({
  extends: [baseConfig],
  plugins: ["eslint", "typescript", "unicorn", "oxc", "react"],
  jsPlugins: [
    {
      name: "react-hooks-js",
      specifier: "eslint-plugin-react-hooks",
    },
    {
      name: "@tanstack/router",
      specifier: "@tanstack/eslint-plugin-router",
    },
  ],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/no-children-prop": "off",
    "react/jsx-key": "error",
    "react/jsx-no-duplicate-props": "error",
    "react/jsx-no-useless-fragment": "warn",
    "react/no-array-index-key": "warn",
    "react/no-danger-with-children": "error",
    "react/self-closing-comp": "warn",

    "react-hooks-js/rules-of-hooks": "error",
    "react-hooks-js/exhaustive-deps": "warn",
    "react-hooks-js/config": "error",
    "react-hooks-js/gating": "error",
    "react-hooks-js/globals": "error",
    "react-hooks-js/immutability": "error",
    "react-hooks-js/preserve-manual-memoization": "error",
    "react-hooks-js/purity": "error",
    "react-hooks-js/refs": "error",
    "react-hooks-js/set-state-in-effect": "error",
    "react-hooks-js/set-state-in-render": "error",
    "react-hooks-js/static-components": "error",
    "react-hooks-js/unsupported-syntax": "warn",
    "react-hooks-js/error-boundaries": "error",
    "react-hooks-js/use-memo": "error",
    "react-hooks-js/incompatible-library": "warn",
    "react-hooks-js/void-use-memo": "error",

    "@tanstack/router/create-route-property-order": "warn",
    "@tanstack/router/route-param-names": "error",
  },
})
