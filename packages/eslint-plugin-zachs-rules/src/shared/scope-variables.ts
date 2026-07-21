import {
  AST_NODE_TYPES,
  AST_TOKEN_TYPES,
  TSESLint,
} from "@typescript-eslint/utils"

type VariableDefinition = TSESLint.Scope.Definitions.VariableDefinition

/**
 * Find a simple initialized const definition for a variable.
 *
 * @param variable - Scope variable to inspect.
 */
export function getConstDefinition(
  variable: TSESLint.Scope.Variable,
): VariableDefinition | undefined {
  const definition = variable.defs.find(
    (candidate): candidate is VariableDefinition =>
      candidate.type === TSESLint.Scope.DefinitionType.Variable,
  )

  if (!definition) return undefined

  if (
    definition.parent.kind !== "const" ||
    definition.parent.declare ||
    definition.node.id.type !== AST_NODE_TYPES.Identifier ||
    !definition.node.init
  ) {
    return undefined
  }

  return definition
}

/**
 * Check whether a declaration is directly exported.
 *
 * @param definition - Variable definition to inspect.
 */
export function isExported(definition: VariableDefinition) {
  return (
    definition.parent.parent.type === AST_NODE_TYPES.ExportNamedDeclaration ||
    definition.parent.parent.type === AST_NODE_TYPES.ExportDefaultDeclaration
  )
}

/**
 * Check whether a declaration belongs directly to the module.
 *
 * @param definition - Variable definition to inspect.
 */
export function isModuleLevel(definition: VariableDefinition) {
  const parent = definition.parent.parent

  return (
    parent.type === AST_NODE_TYPES.Program ||
    ((parent.type === AST_NODE_TYPES.ExportNamedDeclaration ||
      parent.type === AST_NODE_TYPES.ExportDefaultDeclaration) &&
      parent.parent.type === AST_NODE_TYPES.Program)
  )
}

/**
 * Check whether a declaration creates a loop binding.
 *
 * @param definition - Variable definition to inspect.
 */
export function isLoopVariable(definition: VariableDefinition) {
  const declaration = definition.parent
  const parent = declaration.parent

  return (
    ((parent.type === AST_NODE_TYPES.ForInStatement ||
      parent.type === AST_NODE_TYPES.ForOfStatement) &&
      parent.left === declaration) ||
    (parent.type === AST_NODE_TYPES.ForStatement && parent.init === declaration)
  )
}

/**
 * Check whether a variable is reassigned after initialization.
 *
 * @param variable - Scope variable to inspect.
 */
export function hasNonInitializerWrite(variable: TSESLint.Scope.Variable) {
  return variable.references.some(
    (reference) => reference.isWrite() && reference.init !== true,
  )
}

/**
 * Get runtime reads, excluding value references made only through a type query.
 *
 * @param variable - Scope variable whose references should be collected.
 * @param sourceCode - Parsed source used to inspect reference ancestors.
 */
export function getRuntimeReadReferences(
  variable: TSESLint.Scope.Variable,
  sourceCode: TSESLint.SourceCode,
): TSESLint.Scope.Reference[] {
  return variable.references.filter(
    (reference) =>
      reference.isRead() &&
      !sourceCode
        .getAncestors(reference.identifier)
        .some((ancestor) => ancestor.type === AST_NODE_TYPES.TSTypeQuery),
  )
}

/**
 * Check whether a const declaration has an attached documentation comment.
 *
 * @param definition - Variable definition to inspect.
 * @param sourceCode - Parsed source used to read leading comments.
 */
export function hasDocumentationComment(
  definition: VariableDefinition,
  sourceCode: TSESLint.SourceCode,
) {
  return sourceCode
    .getCommentsBefore(definition.parent)
    .some(
      (comment) =>
        comment.type === AST_TOKEN_TYPES.Block && comment.value.startsWith("*"),
    )
}

/**
 * Visit every scope in a scope tree.
 *
 * @param scope - Root scope to visit.
 * @param visitor - Callback invoked for each scope.
 */
export function visitScopes(
  scope: TSESLint.Scope.Scope,
  visitor: (scope: TSESLint.Scope.Scope) => void,
) {
  visitor(scope)

  for (const childScope of scope.childScopes) {
    visitScopes(childScope, visitor)
  }
}
