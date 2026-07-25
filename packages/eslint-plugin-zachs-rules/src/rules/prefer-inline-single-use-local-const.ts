import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils"
import { createRule } from "../shared/create-rule"
import {
  getConstDefinition,
  getRuntimeReadReferences,
  hasNonInitializerWrite,
  isLoopVariable,
  isModuleLevel,
  visitScopes,
} from "../shared/scope-variables"

const SHORT_CIRCUIT_ASSIGNMENT_OPERATORS = new Set(["&&=", "||=", "??="])

/**
 * Check whether moving an initializer to its sole read could change when or how
 * often it is evaluated.
 *
 * @param declaration - Const declarator containing the initializer.
 * @param reference - Sole runtime read of the const.
 * @param sourceCode - Parsed source used to inspect ancestor paths.
 */
function isReadAcrossExecutionBoundary(
  declaration: TSESTree.VariableDeclarator,
  reference: TSESLint.Scope.Reference,
  sourceCode: TSESLint.SourceCode,
) {
  const declarationAncestors = new Set([
    ...sourceCode.getAncestors(declaration),
    declaration,
  ])
  const readPath = [
    ...sourceCode.getAncestors(reference.identifier),
    reference.identifier,
  ]

  return readPath.some((ancestor, index) => {
    if (declarationAncestors.has(ancestor)) return false

    const child = readPath[index + 1]

    switch (ancestor.type) {
      case AST_NODE_TYPES.ForStatement:
        return child !== ancestor.init

      case AST_NODE_TYPES.ForInStatement:
      case AST_NODE_TYPES.ForOfStatement:
        return child !== ancestor.right

      case AST_NODE_TYPES.DoWhileStatement:
      case AST_NODE_TYPES.WhileStatement:
      case AST_NODE_TYPES.CatchClause:
      case AST_NODE_TYPES.SwitchCase:
      case AST_NODE_TYPES.TryStatement:
        return true

      case AST_NODE_TYPES.IfStatement:
        return child === ancestor.consequent || child === ancestor.alternate

      case AST_NODE_TYPES.ConditionalExpression:
        return child === ancestor.consequent || child === ancestor.alternate

      case AST_NODE_TYPES.LogicalExpression:
        return child === ancestor.right

      case AST_NODE_TYPES.AssignmentExpression:
        return (
          child === ancestor.right &&
          SHORT_CIRCUIT_ASSIGNMENT_OPERATORS.has(ancestor.operator)
        )

      case AST_NODE_TYPES.ChainExpression: {
        const firstOptionalToken = sourceCode
          .getTokens(ancestor)
          .find((token) => token.value === "?.")

        return (
          firstOptionalToken !== undefined &&
          reference.identifier.range[0] > firstOptionalToken.range[0]
        )
      }

      default:
        return false
    }
  })
}

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
  defaultOptions: [{ ignoreNestedFunctionReads: true }],
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
                runtimeReads[0]?.from.variableScope !==
                  variable.scope.variableScope) ||
              (runtimeReads[0] &&
                isReadAcrossExecutionBoundary(
                  definition.node,
                  runtimeReads[0],
                  context.sourceCode,
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
