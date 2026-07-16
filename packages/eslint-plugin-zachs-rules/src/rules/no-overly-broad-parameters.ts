import {
  AST_NODE_TYPES,
  ESLintUtils,
  type ParserServicesWithTypeInformation,
  TSESTree,
} from "@typescript-eslint/utils"
import ts from "typescript"
import { createRule } from "../shared/create-rule"

type ParameterCandidate = {
  argumentIndex: number
  declaredType: ts.Type
  invalid: boolean
  name: string
  node: TSESTree.Identifier
  observedTypes: ts.Type[]
  tsNode: ts.ParameterDeclaration
}

/**
 * Check whether a declaration is exported.
 *
 * @param node - Declaration node to inspect.
 * @returns Whether the declaration is directly exported.
 */
function isExported(node: TSESTree.Node): boolean {
  return (
    node.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration ||
    node.parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration
  )
}

/**
 * Check whether an observed type is useful for narrowing.
 *
 * @param type - Observed argument type.
 * @returns Whether the type can support a useful narrowing suggestion.
 */
function isUsableObservedType(type: ts.Type): boolean {
  return !(
    type.flags &
    (ts.TypeFlags.Any |
      ts.TypeFlags.Unknown |
      ts.TypeFlags.Never |
      ts.TypeFlags.TypeParameter)
  )
}

/**
 * Check whether a candidate type is strictly narrower than a declared type.
 *
 * @param candidate - Candidate replacement type.
 * @param declared - Type currently declared on the parameter.
 * @param checker - TypeScript checker used for assignability tests.
 * @returns Whether the candidate is safely and strictly narrower.
 */
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

/**
 * Find one widened type that accepts every observed argument type.
 *
 * @param observedTypes - Argument types collected from direct calls.
 * @param checker - TypeScript checker used to widen and compare types.
 * @returns A common observed type, or null when none is suitable.
 */
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

/**
 * Resolve the unique TypeScript symbol for a function name.
 *
 * @param checker - TypeScript checker used to resolve the symbol.
 * @param node - ESTree identifier for the function name.
 * @param services - Parser services mapping ESTree to TypeScript nodes.
 * @returns The unique declaration symbol, or null when resolution is ambiguous.
 */
function getFunctionNameSymbol(
  checker: ts.TypeChecker,
  node: TSESTree.Identifier,
  services: ParserServicesWithTypeInformation,
): { declarationName: ts.Identifier; symbol: ts.Symbol } | null {
  const declarationName = services.esTreeNodeToTSNodeMap.get(node)
  if (!ts.isIdentifier(declarationName)) return null

  const symbol = checker.getSymbolAtLocation(declarationName)
  if (symbol?.declarations?.length !== 1) return null

  return { declarationName, symbol }
}

/**
 * Build narrowing candidates from supported function parameters.
 *
 * @param checker - TypeScript checker used to resolve declared types.
 * @param estreeParameters - Function parameters from the ESTree tree.
 * @param tsParameters - Matching parameters from the TypeScript tree.
 * @returns Supported parameters that can be evaluated for narrowing.
 */
function getParameters(
  checker: ts.TypeChecker,
  estreeParameters: TSESTree.Parameter[],
  tsParameters: ts.NodeArray<ts.ParameterDeclaration>,
): ParameterCandidate[] {
  const parameters: ParameterCandidate[] = []
  let argumentIndex = 0

  for (const [index, node] of estreeParameters.entries()) {
    const tsNode = tsParameters.at(index)
    if (tsNode && ts.isIdentifier(tsNode.name) && tsNode.name.text === "this") {
      continue
    }

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
      argumentIndex: argumentIndex - 1,
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

export default createRule<[], "overlyBroadParameter">({
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
    const candidates: Array<{
      callCount: number
      declarationName: ts.Identifier
      invalid: boolean
      name: string
      parameters: ParameterCandidate[]
      symbol: ts.Symbol
    }> = []

    /**
     * Add a locally declared function to the candidate set.
     *
     * @param nameNode - ESTree identifier for the function name.
     * @param estreeParameters - Function parameters from the ESTree tree.
     * @param tsParameters - Matching parameters from the TypeScript tree.
     */
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
        ...nameSymbol,
        invalid: false,
        name: nameNode.name,
        parameters,
      })
    }

    /** Inspect references and collect argument types for candidate functions. */
    function inspectReferences() {
      /**
       * Visit TypeScript nodes to associate calls with candidates.
       *
       * @param node - TypeScript node to traverse.
       * @param bySymbol - Candidate functions indexed by resolved symbol.
       */
      function visit(
        node: ts.Node,
        bySymbol: Map<ts.Symbol, (typeof candidates)[number]>,
      ) {
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

        ts.forEachChild(node, (child) => visit(child, bySymbol))
      }

      /**
       * Visit source files with one shared candidate index.
       *
       * @param files - TypeScript source files to traverse.
       * @param bySymbol - Candidate functions indexed by resolved symbol.
       */
      function visitFiles(
        files: ts.SourceFile[],
        bySymbol: Map<ts.Symbol, (typeof candidates)[number]>,
      ) {
        for (const file of files) visit(file, bySymbol)
      }

      visitFiles(
        ts.isExternalModule(sourceFile)
          ? [sourceFile]
          : services.program
              .getSourceFiles()
              .filter((file) => !file.isDeclarationFile),
        new Map(candidates.map((candidate) => [candidate.symbol, candidate])),
      )
    }

    /** Report parameters that can be narrowed at every direct callsite. */
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

          context.report({
            node: parameter.node,
            messageId: "overlyBroadParameter",
            data: {
              declaredType: checker.typeToString(
                parameter.declaredType,
                parameter.tsNode,
                typeFormatFlags,
              ),
              functionName: candidate.name,
              observedType: checker.typeToString(
                observedType,
                parameter.tsNode,
                typeFormatFlags,
              ),
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
