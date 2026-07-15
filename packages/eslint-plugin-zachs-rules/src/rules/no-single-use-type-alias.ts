import { AST_NODE_TYPES, TSESLint } from "@typescript-eslint/utils"
import { createRule } from "../shared/create-rule"
import { visitScopes } from "../shared/scope-variables"

export default createRule<[], "singleUseTypeAlias">({
  name: "no-single-use-type-alias",
  meta: {
    type: "suggestion",
    docs: {
      description: "Report type aliases referenced only once",
    },
    schema: [],
    messages: {
      singleUseTypeAlias:
        "`{{name}}` is a type alias used only once. Consider inlining it.",
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
            const definition = variable.defs.find(
              (candidate) =>
                candidate.type === TSESLint.Scope.DefinitionType.Type &&
                candidate.node.type === AST_NODE_TYPES.TSTypeAliasDeclaration &&
                !candidate.node.declare &&
                candidate.node.parent.type !==
                  AST_NODE_TYPES.ExportNamedDeclaration &&
                candidate.node.parent.type !==
                  AST_NODE_TYPES.ExportDefaultDeclaration,
            )

            if (!definition) continue

            if (
              variable.references.filter(
                (reference) =>
                  reference.isTypeReference &&
                  !context.sourceCode
                    .getAncestors(reference.identifier)
                    .includes(definition.node),
              ).length !== 1
            ) {
              continue
            }

            context.report({
              node: definition.name,
              messageId: "singleUseTypeAlias",
              data: { name: variable.name },
            })
          }
        })
      },
    }
  },
})
