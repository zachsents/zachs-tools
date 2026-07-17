import { createRule } from "../shared/create-rule"
import {
  getConstDefinition,
  getRuntimeReadReferences,
  hasNonInitializerWrite,
  isLoopVariable,
  isModuleLevel,
  visitScopes,
} from "../shared/scope-variables"

export default createRule<
  [{ ignoreNestedFunctionReads?: boolean }?],
  "preferInlineSingleUseLocalConst"
>({
  name: "prefer-inline-single-use-local-const",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer inlining local const variables read only once",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignoreNestedFunctionReads: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferInlineSingleUseLocalConst:
        "`{{name}}` is a local const used only once. Consider inlining it.",
    },
  },
  defaultOptions: [{ ignoreNestedFunctionReads: false }],
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
              isModuleLevel(definition) ||
              isLoopVariable(definition) ||
              definition.node.id.typeAnnotation ||
              hasNonInitializerWrite(variable)
            ) {
              continue
            }

            const runtimeReads = getRuntimeReadReferences(
              variable,
              context.sourceCode,
            )

            if (
              runtimeReads.length !== 1 ||
              (options?.ignoreNestedFunctionReads &&
                runtimeReads.some(
                  (reference) =>
                    reference.from.variableScope !==
                    variable.scope.variableScope,
                ))
            ) {
              continue
            }

            context.report({
              node: definition.name,
              messageId: "preferInlineSingleUseLocalConst",
              data: { name: variable.name },
            })
          }
        })
      },
    }
  },
})
