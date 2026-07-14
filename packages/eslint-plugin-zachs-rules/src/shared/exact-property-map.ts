import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils"

export type ExactPropertyMapping = {
  keyName: string
  node: TSESTree.Property
}

export type SourceMappingGroup = {
  sourceName: string
  sourceNode: TSESTree.Identifier
  mappings: ExactPropertyMapping[]
}

type GroupState = SourceMappingGroup & {
  hasExistingSpread: boolean
}

function getStaticPropertyName(key: TSESTree.Property["key"]): string | null {
  if (key.type === AST_NODE_TYPES.Identifier) {
    return key.name
  }

  if (key.type === AST_NODE_TYPES.Literal && typeof key.value === "string") {
    return key.value
  }

  return null
}

function getIdentifierMemberName(
  member: TSESTree.MemberExpression,
): string | null {
  if (member.computed || member.property.type !== AST_NODE_TYPES.Identifier) {
    return null
  }

  return member.property.name
}

function getSourceIdentifier(
  expression: TSESTree.Expression,
): TSESTree.Identifier | null {
  if (expression.type === AST_NODE_TYPES.Identifier) {
    return expression
  }

  return null
}

function isSameNamedIdentifierMemberMapping(
  property: TSESTree.Property,
): { source: TSESTree.Identifier; keyName: string } | null {
  if (
    property.computed ||
    property.kind !== "init" ||
    property.method ||
    property.value.type !== AST_NODE_TYPES.MemberExpression
  ) {
    return null
  }

  const keyName = getStaticPropertyName(property.key)
  const memberName = getIdentifierMemberName(property.value)
  const source = getSourceIdentifier(property.value.object)

  if (!keyName || !memberName || !source || keyName !== memberName) {
    return null
  }

  return { source, keyName }
}

function getSpreadIdentifier(
  property: TSESTree.SpreadElement,
): TSESTree.Identifier | null {
  return property.argument.type === AST_NODE_TYPES.Identifier
    ? property.argument
    : null
}

export function findSameNamedSourceMappings(
  objectExpression: TSESTree.ObjectExpression,
  minProperties: number,
): SourceMappingGroup[] {
  const groups = new Map<string, GroupState>()

  for (const property of objectExpression.properties) {
    if (property.type === AST_NODE_TYPES.SpreadElement) {
      const spreadSource = getSpreadIdentifier(property)
      if (spreadSource) {
        const group = groups.get(spreadSource.name)
        if (group) {
          group.hasExistingSpread = true
        } else {
          groups.set(spreadSource.name, {
            sourceName: spreadSource.name,
            sourceNode: spreadSource,
            mappings: [],
            hasExistingSpread: true,
          })
        }
      }
      continue
    }

    const mapping = isSameNamedIdentifierMemberMapping(property)
    if (!mapping) continue

    const group = groups.get(mapping.source.name)
    if (group) {
      group.mappings.push({ keyName: mapping.keyName, node: property })
    } else {
      groups.set(mapping.source.name, {
        sourceName: mapping.source.name,
        sourceNode: mapping.source,
        mappings: [{ keyName: mapping.keyName, node: property }],
        hasExistingSpread: false,
      })
    }
  }

  return Array.from(groups.values()).filter(
    (group) =>
      !group.hasExistingSpread &&
      new Set(group.mappings.map((mapping) => mapping.keyName)).size >=
        minProperties,
  )
}
