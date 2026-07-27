import { AST_NODE_TYPES, TSESLint } from "@typescript-eslint/utils"
import { createRule } from "../shared/create-rule"
import { hasLeadingJSDocComment, visitScopes } from "../shared/scope-variables"

export default createRule<[], "unintentionalSingleUseTypeAlias">({
  name: "require-intentional-single-use-type-alias",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require type aliases referenced only once to be inlined or intentionally documented",
    },
    schema: [],
    messages: {
      unintentionalSingleUseTypeAlias:
        "`{{name}}` is a type alias used only once. Consider inlining it. If the named abstraction is intentional, add JSDoc.",
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

            const typeReferences = variable.references.filter(
              (reference) => reference.isTypeReference,
            )

            if (
              hasLeadingJSDocComment(definition.node, context.sourceCode) ||
              typeReferences.some((reference) =>
                context.sourceCode
                  .getAncestors(reference.identifier)
                  .includes(definition.node),
              ) ||
              typeReferences.length !== 1
            ) {
              continue
            }

            context.report({
              node: definition.name,
              messageId: "unintentionalSingleUseTypeAlias",
              data: { name: variable.name },
            })
          }
        })
      },
    }
  },
})
