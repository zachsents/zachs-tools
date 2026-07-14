import type { OxlintConfig } from "oxlint"

const oxlintRecommended = {
  jsPlugins: [
    {
      name: "zachs-rules",
      specifier: "eslint-plugin-zachs-rules/oxlint",
    },
  ],
  rules: {
    "zachs-rules/require-disable-directive-description": "error",
  },
} satisfies OxlintConfig

export default oxlintRecommended
