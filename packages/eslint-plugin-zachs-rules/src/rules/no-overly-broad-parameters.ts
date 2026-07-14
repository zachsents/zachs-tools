import { AST_NODE_TYPES, ESLintUtils, TSESTree } from "@typescript-eslint/utils"
import ts from "typescript"

type Options = []

type MessageIds = "overlyBroadParameter"

type ParameterCandidate = {
  argumentIndex: number
  declaredType: ts.Type
  invalid: boolean
  name: string
  node: TSESTree.Identifier
  observedTypes: ts.Type[]
  tsNode: ts.ParameterDeclaration
}

type FunctionCandidate = {
  callCount: number
  declarationName: ts.Identifier
  invalid: boolean
  name: string
  parameters: ParameterCandidate[]
  symbol: ts.Symbol
}

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/zachsents/eslint-plugin-zachs-rules#${name}`,
)

function isExported(node: TSESTree.Node): boolean {
  return (
    node.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration ||
    node.parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration
  )
}

function isUsableObservedType(type: ts.Type): boolean {
  return !(
    type.flags &
    (ts.TypeFlags.Any |
      ts.TypeFlags.Unknown |
      ts.TypeFlags.Never |
      ts.TypeFlags.TypeParameter)
  )
}

function isStrictlyNarrower(
  candidate: ts.Type,
  declared: ts.Type,
  checker: ts.TypeChecker,
): boolean {
  if (!isUsableObservedType(candidate)) return false
  if (!checker.isTypeAssignableTo(candidate, declared)) return false

  if (declared.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
    return true
  }

  return !checker.isTypeAssignableTo(declared, candidate)
}

function findCommonObservedType(
  observedTypes: ts.Type[],
  checker: ts.TypeChecker,
): ts.Type | null {
  const widenedTypes = observedTypes.map((type) =>
    checker.getBaseTypeOfLiteralType(checker.getWidenedType(type)),
  )

  return (
    widenedTypes.find(
      (candidate) =>
        isUsableObservedType(candidate) &&
        widenedTypes.every((type) =>
          checker.isTypeAssignableTo(type, candidate),
        ),
    ) ?? null
  )
}

function getFunctionNameSymbol(
  checker: ts.TypeChecker,
  node: TSESTree.Identifier,
  services: ReturnType<typeof ESLintUtils.getParserServices>,
): { declarationName: ts.Identifier; symbol: ts.Symbol } | null {
  const declarationName = services.esTreeNodeToTSNodeMap.get(node)
  if (!ts.isIdentifier(declarationName)) return null

  const symbol = checker.getSymbolAtLocation(declarationName)
  if (symbol?.declarations?.length !== 1) return null

  return { declarationName, symbol }
}

function getParameters(
  checker: ts.TypeChecker,
  estreeParameters: TSESTree.Parameter[],
  tsParameters: ts.NodeArray<ts.ParameterDeclaration>,
): ParameterCandidate[] {
  const parameters: ParameterCandidate[] = []
  let argumentIndex = 0

  for (const [index, node] of estreeParameters.entries()) {
    const tsNode = tsParameters.at(index)
    const isThisParameter =
      tsNode && ts.isIdentifier(tsNode.name) && tsNode.name.text === "this"

    if (isThisParameter) continue

    const parameterArgumentIndex = argumentIndex
    argumentIndex += 1

    if (
      node.type !== AST_NODE_TYPES.Identifier ||
      !node.typeAnnotation ||
      !tsNode?.type ||
      tsNode.dotDotDotToken
    ) {
      continue
    }

    parameters.push({
      argumentIndex: parameterArgumentIndex,
      declaredType: checker.getTypeFromTypeNode(tsNode.type),
      invalid: false,
      name: node.name,
      node,
      observedTypes: [],
      tsNode,
    })
  }

  return parameters
}

export default createRule<Options, MessageIds>({
  name: "no-overly-broad-parameters",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Report non-exported helper parameters that are broader than every visible direct callsite requires",
    },
    schema: [],
    messages: {
      overlyBroadParameter:
        "`{{parameter}}` is declared as `{{declaredType}}`, but every direct call to `{{functionName}}` passes `{{observedType}}`. Narrow the parameter type to `{{observedType}}`.",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context)
    const checker = services.program.getTypeChecker()
    const sourceFile = services.esTreeNodeToTSNodeMap.get(
      context.sourceCode.ast,
    )
    const candidates: FunctionCandidate[] = []

    function addCandidate(
      nameNode: TSESTree.Identifier,
      estreeParameters: TSESTree.Parameter[],
      tsParameters: ts.NodeArray<ts.ParameterDeclaration>,
    ) {
      const nameSymbol = getFunctionNameSymbol(checker, nameNode, services)
      if (!nameSymbol) return

      const parameters = getParameters(checker, estreeParameters, tsParameters)
      if (parameters.length === 0) return

      candidates.push({
        callCount: 0,
        declarationName: nameSymbol.declarationName,
        invalid: false,
        name: nameNode.name,
        parameters,
        symbol: nameSymbol.symbol,
      })
    }

    function inspectReferences() {
      const bySymbol = new Map(
        candidates.map((candidate) => [candidate.symbol, candidate]),
      )

      function visit(node: ts.Node) {
        if (ts.isIdentifier(node)) {
          const resolvedSymbol = checker.getSymbolAtLocation(node)
          const symbol =
            resolvedSymbol && resolvedSymbol.flags & ts.SymbolFlags.Alias
              ? checker.getAliasedSymbol(resolvedSymbol)
              : resolvedSymbol
          const candidate = symbol ? bySymbol.get(symbol) : undefined

          if (candidate && node !== candidate.declarationName) {
            const parent = node.parent

            if (ts.isCallExpression(parent) && parent.expression === node) {
              candidate.callCount += 1

              for (const parameter of candidate.parameters) {
                const argument = parent.arguments.at(parameter.argumentIndex)

                if (!argument || ts.isSpreadElement(argument)) {
                  parameter.invalid = true
                } else {
                  parameter.observedTypes.push(
                    checker.getTypeAtLocation(argument),
                  )
                }
              }
            } else {
              candidate.invalid = true
            }
          }
        }

        ts.forEachChild(node, visit)
      }

      const sourceFiles = ts.isExternalModule(sourceFile)
        ? [sourceFile]
        : services.program
            .getSourceFiles()
            .filter((file) => !file.isDeclarationFile)

      for (const file of sourceFiles) visit(file)
    }

    function reportCandidates() {
      inspectReferences()

      const typeFormatFlags =
        ts.TypeFormatFlags.NoTruncation |
        ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope

      for (const candidate of candidates) {
        if (candidate.invalid || candidate.callCount === 0) continue

        for (const parameter of candidate.parameters) {
          if (
            parameter.invalid ||
            parameter.observedTypes.length !== candidate.callCount
          ) {
            continue
          }

          const observedType = findCommonObservedType(
            parameter.observedTypes,
            checker,
          )

          if (
            !observedType ||
            !isStrictlyNarrower(observedType, parameter.declaredType, checker)
          ) {
            continue
          }

          const observedTypeName = checker.typeToString(
            observedType,
            parameter.tsNode,
            typeFormatFlags,
          )
          const declaredTypeName = checker.typeToString(
            parameter.declaredType,
            parameter.tsNode,
            typeFormatFlags,
          )

          context.report({
            node: parameter.node,
            messageId: "overlyBroadParameter",
            data: {
              declaredType: declaredTypeName,
              functionName: candidate.name,
              observedType: observedTypeName,
              parameter: parameter.name,
            },
          })
        }
      }
    }

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
        if (!node.id || isExported(node)) return

        const tsNode = services.esTreeNodeToTSNodeMap.get(node)
        if (!ts.isFunctionDeclaration(tsNode) || !tsNode.body) return

        addCandidate(node.id, node.params, tsNode.parameters)
      },
      VariableDeclarator(node: TSESTree.VariableDeclarator) {
        if (
          node.id.type !== AST_NODE_TYPES.Identifier ||
          !node.init ||
          (node.init.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
            node.init.type !== AST_NODE_TYPES.FunctionExpression) ||
          (node.init.type === AST_NODE_TYPES.FunctionExpression &&
            node.init.id !== null) ||
          node.parent.kind !== "const" ||
          isExported(node.parent)
        ) {
          return
        }

        const tsNode = services.esTreeNodeToTSNodeMap.get(node.init)
        if (!ts.isArrowFunction(tsNode) && !ts.isFunctionExpression(tsNode)) {
          return
        }

        addCandidate(node.id, node.init.params, tsNode.parameters)
      },
      "Program:exit": reportCandidates,
    }
  },
})
