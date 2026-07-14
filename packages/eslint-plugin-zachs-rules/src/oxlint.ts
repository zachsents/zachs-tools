import { definePlugin, defineRule } from "@oxlint/plugins"

const requireDisableDirectiveDescription = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require disable directives recognized by oxlint to include a description",
    },
    messages: {
      missingDescription:
        "Disable directive should include a description after `--`.",
    },
  },
  create(context) {
    return {
      Program() {
        const { directives } = context.sourceCode.getDisableDirectives()

        for (const directive of directives) {
          if (!directive.type.startsWith("disable")) continue
          if (directive.justification?.trim()) continue

          context.report({
            node: directive.node,
            messageId: "missingDescription",
          })
        }
      },
    }
  },
})

export default definePlugin({
  meta: {
    name: "zachs-rules",
  },
  rules: {
    "require-disable-directive-description": requireDisableDirectiveDescription,
  },
})
