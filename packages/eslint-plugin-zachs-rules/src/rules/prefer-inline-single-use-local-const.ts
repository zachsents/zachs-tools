import { createRule } from "../shared/create-rule"
import {
  countRuntimeReads,
  getConstDefinition,
  hasNonInitializerWrite,
  isLoopVariable,
  isModuleLevel,
  visitScopes,
} from "../shared/scope-variables"

export default createRule<[], "preferInlineSingleUseLocalConst">({
  name: "prefer-inline-single-use-local-const",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer inlining local const variables read only once",
    },
    schema: [],
    messages: {
      preferInlineSingleUseLocalConst:
        "`{{name}}` is a local const used only once. Consider inlining it.",
    },
  },
  defaultOptions: [],
  create(context) {
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
              hasNonInitializerWrite(variable) ||
              countRuntimeReads(variable, context.sourceCode) !== 1
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
