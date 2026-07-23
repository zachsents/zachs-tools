import { AST_NODE_TYPES, TSESLint, TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../shared/create-rule"
import {
  getRuntimeReadReferences,
  visitScopes,
} from "../shared/scope-variables"

const MIN_NAME_TOKEN_RATIO = 0.6

/**
 * Split a JavaScript identifier into lowercase semantic tokens.
 *
 * @param name - Identifier name to tokenize.
 */
function tokenizeIdentifierName(name: string) {
  return (
    name
      .match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])|\d+/gu)
      ?.map((token) => token.toLowerCase()) ?? []
  )
}

/**
 * Check whether every token in a candidate appears in order in a larger list.
 *
 * @param candidate - Tokens that must appear.
 * @param tokens - Tokens to search.
 */
function isOrderedSubsequence(candidate: string[], tokens: string[]) {
  let candidateIndex = 0

  for (const token of tokens) {
    if (token === candidate[candidateIndex]) candidateIndex += 1
  }

  return candidateIndex === candidate.length
}

/**
 * Check whether a wrapper name substantially restates its callee's name.
 *
 * @param wrapperName - Function declaration name.
 * @param calleeName - Called function or method name.
 */
function hasSimilarName(wrapperName: string, calleeName: string) {
  const wrapperTokens = tokenizeIdentifierName(wrapperName)
  const calleeTokens = tokenizeIdentifierName(calleeName)

  return (
    calleeTokens.length >= 2 &&
    calleeTokens.length <= wrapperTokens.length &&
    calleeTokens.length / wrapperTokens.length >= MIN_NAME_TOKEN_RATIO &&
    isOrderedSubsequence(calleeTokens, wrapperTokens)
  )
}

/**
 * Find the single call represented by a function body.
 *
 * @param node - Function declaration to inspect.
 */
function getSingleCall(node: TSESTree.FunctionDeclaration) {
  if (node.body.body.length !== 1) return undefined

  const [statement] = node.body.body

  if (!statement) return undefined

  const expression =
    statement.type === AST_NODE_TYPES.ExpressionStatement
      ? statement.expression
      : statement.type === AST_NODE_TYPES.ReturnStatement
        ? statement.argument
        : undefined

  if (!expression) return undefined

  const unwrappedExpression =
    expression.type === AST_NODE_TYPES.AwaitExpression
      ? expression.argument
      : expression

  return unwrappedExpression.type === AST_NODE_TYPES.CallExpression
    ? unwrappedExpression
    : undefined
}

/**
 * Read the static identifier name of a direct call target.
 *
 * @param call - Call expression to inspect.
 */
function getCalleeName(call: TSESTree.CallExpression) {
  if (call.optional) return undefined
  if (call.callee.type === AST_NODE_TYPES.Identifier) return call.callee.name

  if (
    call.callee.type === AST_NODE_TYPES.MemberExpression &&
    !call.callee.computed &&
    call.callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return call.callee.property.name
  }

  return undefined
}

/**
 * Check that an argument contains only parameters and static container values.
 *
 * @param node - Argument node to inspect.
 * @param parameterNames - Function parameters available for forwarding.
 * @param forwardedParameters - Parameters observed in the argument.
 */
function isSimpleForwardedValue(
  node: TSESTree.Node,
  parameterNames: ReadonlySet<string>,
  forwardedParameters: Set<string>,
): boolean {
  if (node.type === AST_NODE_TYPES.Literal) return true

  if (node.type === AST_NODE_TYPES.Identifier) {
    if (node.name === "undefined") return true
    if (!parameterNames.has(node.name)) return false

    forwardedParameters.add(node.name)
    return true
  }

  if (node.type === AST_NODE_TYPES.TemplateLiteral) {
    return node.expressions.length === 0
  }

  if (node.type === AST_NODE_TYPES.SpreadElement) {
    return isSimpleForwardedValue(
      node.argument,
      parameterNames,
      forwardedParameters,
    )
  }

  if (node.type === AST_NODE_TYPES.ArrayExpression) {
    return node.elements.every(
      (element) =>
        element === null ||
        isSimpleForwardedValue(element, parameterNames, forwardedParameters),
    )
  }

  if (node.type === AST_NODE_TYPES.ObjectExpression) {
    return node.properties.every((property) => {
      if (property.type === AST_NODE_TYPES.SpreadElement) {
        return isSimpleForwardedValue(
          property.argument,
          parameterNames,
          forwardedParameters,
        )
      }

      return (
        property.kind === "init" &&
        !property.computed &&
        !property.method &&
        isSimpleForwardedValue(
          property.value,
          parameterNames,
          forwardedParameters,
        )
      )
    })
  }

  return false
}

/**
 * Check whether a call only forwards all parameters with optional static data.
 *
 * @param node - Function declaration containing the call.
 * @param call - Single call in the function body.
 */
function onlyForwardsParameters(
  node: TSESTree.FunctionDeclaration,
  call: TSESTree.CallExpression,
) {
  const parameterNames = new Set<string>()

  for (const parameter of node.params) {
    if (parameter.type !== AST_NODE_TYPES.Identifier) return false
    parameterNames.add(parameter.name)
  }

  const forwardedParameters = new Set<string>()

  return (
    call.arguments.every((argument) =>
      isSimpleForwardedValue(argument, parameterNames, forwardedParameters),
    ) &&
    [...parameterNames].every((parameter) => forwardedParameters.has(parameter))
  )
}

/**
 * Check whether a function declaration is directly exported.
 *
 * @param node - Function declaration to inspect.
 */
function isExported(node: TSESTree.FunctionDeclaration) {
  return (
    node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration ||
    node.parent.type === AST_NODE_TYPES.ExportDefaultDeclaration
  )
}

export default createRule<[], "preferInlineTrivialCallWrapper">({
  name: "prefer-inline-trivial-call-wrapper",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer inlining single-use function declarations that only specialize a similarly named call",
    },
    schema: [],
    messages: {
      preferInlineTrivialCallWrapper:
        "`{{wrapperName}}` only specializes and forwards a call to `{{calleeName}}`. Consider calling `{{calleeName}}` directly.",
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
              (
                candidate,
              ): candidate is TSESLint.Scope.Definitions.FunctionNameDefinition & {
                node: TSESTree.FunctionDeclaration
              } =>
                candidate.type === TSESLint.Scope.DefinitionType.FunctionName &&
                candidate.node.type === AST_NODE_TYPES.FunctionDeclaration,
            )

            if (!definition || isExported(definition.node)) continue

            const call = getSingleCall(definition.node)
            const calleeName = call && getCalleeName(call)

            if (
              !call ||
              !calleeName ||
              calleeName === variable.name ||
              !hasSimilarName(variable.name, calleeName) ||
              !onlyForwardsParameters(definition.node, call)
            ) {
              continue
            }

            const runtimeReads = getRuntimeReadReferences(
              variable,
              context.sourceCode,
            )
            const soleRead = runtimeReads[0]?.identifier

            if (
              runtimeReads.length !== 1 ||
              !soleRead ||
              soleRead.parent.type !== AST_NODE_TYPES.CallExpression ||
              soleRead.parent.callee !== soleRead
            ) {
              continue
            }

            context.report({
              node: definition.name,
              messageId: "preferInlineTrivialCallWrapper",
              data: {
                calleeName,
                wrapperName: variable.name,
              },
            })
          }
        })
      },
    }
  },
})
