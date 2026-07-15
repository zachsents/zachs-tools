import { defineRule } from "@oxlint/plugins"
import preferInlineModuleConst from "./rules/prefer-inline-module-const"
import preferInlineSingleUseLocalConst from "./rules/prefer-inline-single-use-local-const"

export default {
  meta: {
    name: "zachs-rules",
  },
  rules: {
    "prefer-inline-module-const": preferInlineModuleConst,
    "prefer-inline-single-use-local-const": preferInlineSingleUseLocalConst,
    "require-disable-directive-description": defineRule({
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
    }),
  },
}
