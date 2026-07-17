import { createRule } from "../shared/create-rule"
import {
  getConstDefinition,
  getRuntimeReadReferences,
  hasDocumentationComment,
  hasNonInitializerWrite,
  isExported,
  isModuleLevel,
  visitScopes,
} from "../shared/scope-variables"

/**
 * Check whether a name uses screaming-snake-case syntax.
 *
 * @param name - Identifier to inspect.
 * @returns Whether the name uses screaming-snake-case syntax.
 */
function isConstantCase(name: string) {
  return /^[A-Z][A-Z0-9_]*$/u.test(name)
}

export default createRule<[{ maxUses?: number }?], "preferInlineModuleConst">({
  name: "prefer-inline-module-const",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer inlining lightly reused module constants unless their significance is explicit",
    },
    schema: [
      {
        type: "object",
        properties: {
          maxUses: {
            type: "integer",
            minimum: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferInlineModuleConst:
        "`{{name}}` is a module-level const with only {{useCount}}. Consider inlining it, using a SCREAMING_SNAKE_CASE name, or documenting it with `/** */`.",
    },
  },
  defaultOptions: [{ maxUses: 1 }],
  create(context, [options]) {
    return {
      "Program:exit"() {
        const globalScope = context.sourceCode.scopeManager?.globalScope

        if (!globalScope) return

        visitScopes(globalScope, (scope) => {
          for (const variable of scope.variables) {
            const definition = getConstDefinition(variable)

            if (
              !definition ||
              !isModuleLevel(definition) ||
              isExported(definition) ||
              isConstantCase(variable.name) ||
              hasDocumentationComment(definition, context.sourceCode) ||
              hasNonInitializerWrite(variable)
            ) {
              continue
            }

            const runtimeReadCount = getRuntimeReadReferences(
              variable,
              context.sourceCode,
            ).length

            if (
              runtimeReadCount < 1 ||
              runtimeReadCount > (options?.maxUses ?? 1)
            ) {
              continue
            }

            context.report({
              node: definition.name,
              messageId: "preferInlineModuleConst",
              data: {
                name: variable.name,
                useCount:
                  runtimeReadCount === 1
                    ? "one runtime use"
                    : `${runtimeReadCount} runtime uses`,
              },
            })
          }
        })
      },
    }
  },
})
