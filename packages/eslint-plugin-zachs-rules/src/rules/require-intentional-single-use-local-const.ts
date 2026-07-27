import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils"
import { createRule } from "../shared/create-rule"
import {
  getConstDefinition,
  getRuntimeReadReferences,
  hasLeadingComment,
  hasNonInitializerWrite,
  isLoopVariable,
  isModuleLevel,
  visitScopes,
} from "../shared/scope-variables"
import { hasCallSignature } from "../shared/type-shape"

const SHORT_CIRCUIT_ASSIGNMENT_OPERATORS = new Set(["&&=", "||=", "??="])

/**
 * Check whether a name follows React's Hook naming convention.
 *
 * @param name - Identifier name to inspect.
 */
function isReactHookName(name: string) {
  return name === "use" || /^use[A-Z0-9]/.test(name)
}

/**
 * Check whether a call target uses React's direct or namespaced Hook syntax.
 *
 * @param callee - Call expression target to inspect.
 */
function isReactHookCallee(callee: TSESTree.CallExpression["callee"]) {
  return (
    (callee.type === AST_NODE_TYPES.Identifier &&
      isReactHookName(callee.name)) ||
    (callee.type === AST_NODE_TYPES.MemberExpression &&
      !callee.computed &&
      callee.object.type === AST_NODE_TYPES.Identifier &&
      /^[A-Z]/.test(callee.object.name) &&
      callee.property.type === AST_NODE_TYPES.Identifier &&
      isReactHookName(callee.property.name))
  )
}

/**
 * Find the variable declarator whose initializer eagerly evaluates a node.
 *
 * @param node - Descendant node evaluated during traversal.
 * @param sourceCode - Parsed source used to inspect ancestor paths.
 */
function getEagerlyEvaluatedDeclarator(
  node: TSESTree.CallExpression,
  sourceCode: TSESLint.SourceCode,
) {
  const ancestors = sourceCode.getAncestors(node)

  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index]

    if (!ancestor) continue

    if (ancestor.type === AST_NODE_TYPES.VariableDeclarator) return ancestor

    if (
      ancestor.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      ancestor.type === AST_NODE_TYPES.FunctionExpression ||
      ancestor.type === AST_NODE_TYPES.FunctionDeclaration ||
      ancestor.type === AST_NODE_TYPES.ClassExpression ||
      ancestor.type === AST_NODE_TYPES.ClassDeclaration
    ) {
      return undefined
    }
  }

  return undefined
}

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
  "unintentionalSingleUseLocalConst"
>({
  name: "require-intentional-single-use-local-const",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require local constants read only once to be inlined or intentionally documented",
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
      unintentionalSingleUseLocalConst:
        "`{{name}}` is a local const used only once. Consider inlining it. If the name, evaluation order, or initialization behavior is intentional, add a comment.",
    },
  },
  defaultOptions: [{ ignoreNestedFunctionReads: true }],
  create(context, [options]) {
    const services = ESLintUtils.getParserServices(context)
    const reactHookInitializers = new WeakSet<TSESTree.VariableDeclarator>()

    return {
      CallExpression(node) {
        if (!isReactHookCallee(node.callee)) return

        const declarator = getEagerlyEvaluatedDeclarator(
          node,
          context.sourceCode,
        )

        if (declarator) reactHookInitializers.add(declarator)
      },

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
              hasLeadingComment(definition, context.sourceCode) ||
              definition.node.id.typeAnnotation ||
              reactHookInitializers.has(definition.node) ||
              hasCallSignature(services, definition.name) ||
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
              messageId: "unintentionalSingleUseLocalConst",
              data: { name: variable.name },
            })
          }
        })
      },
    }
  },
})
