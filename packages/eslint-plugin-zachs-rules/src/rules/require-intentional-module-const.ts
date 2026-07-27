import { ESLintUtils } from "@typescript-eslint/utils"
import { createRule } from "../shared/create-rule"
import {
  getConstDefinition,
  getRuntimeReadReferences,
  hasLeadingJSDocComment,
  hasNonInitializerWrite,
  isExported,
  isModuleLevel,
  visitScopes,
} from "../shared/scope-variables"
import { hasCallSignature } from "../shared/type-shape"

/**
 * Check whether a module constant uses an intentionally prominent name.
 *
 * @param name - Identifier to inspect.
 */
function isProminentConstantName(name: string) {
  return /^[A-Z][A-Z0-9_]*$/u.test(name) || /^[A-Z][A-Za-z0-9]*$/u.test(name)
}

export default createRule<[{ maxUses?: number }?], "unintentionalModuleConst">({
  name: "require-intentional-module-const",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require lightly reused module constants to be inlined or made intentionally prominent",
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
      unintentionalModuleConst:
        "`{{name}}` is a module-level const with only {{useCount}}. Consider inlining it. If its name or initialization behavior is intentional, add JSDoc or use a SCREAMING_SNAKE_CASE or PascalCase name.",
    },
  },
  defaultOptions: [{ maxUses: 1 }],
  create(context, [options]) {
    const services = ESLintUtils.getParserServices(context)

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
              isProminentConstantName(variable.name) ||
              hasLeadingJSDocComment(definition.parent, context.sourceCode) ||
              hasCallSignature(services, definition.name) ||
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
              messageId: "unintentionalModuleConst",
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
