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

/**
 * Read a static property name from an object property key.
 *
 * @param key - Non-computed object property key.
 * @returns Its static string name, or null when unavailable.
 */
function getStaticPropertyName(
  key: TSESTree.PropertyNameNonComputed,
): string | null {
  if (key.type === AST_NODE_TYPES.Identifier) {
    return key.name
  }

  if (typeof key.value === "string") {
    return key.value
  }

  return null
}

/**
 * Read the property name from a non-computed member expression.
 *
 * @param member - Member expression to inspect.
 * @returns Its identifier property name, or null when unsupported.
 */
function getIdentifierMemberName(
  member: TSESTree.MemberExpression,
): string | null {
  if (member.computed || member.property.type !== AST_NODE_TYPES.Identifier) {
    return null
  }

  return member.property.name
}

/**
 * Return an expression when it is a direct identifier reference.
 *
 * @param expression - Expression to inspect.
 * @returns The expression as an identifier, or null for other forms.
 */
function getSourceIdentifier(
  expression: TSESTree.Expression,
): TSESTree.Identifier | null {
  if (expression.type === AST_NODE_TYPES.Identifier) {
    return expression
  }

  return null
}

/**
 * Match a property that maps a source member under the same name.
 *
 * @param property - Object property to inspect.
 * @returns Its same-named source mapping, or null when it does not match.
 */
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

/**
 * Return the identifier used by a spread element.
 *
 * @param property - Spread element to inspect.
 * @returns Its source identifier, or null for non-identifier arguments.
 */
function getSpreadIdentifier(
  property: TSESTree.SpreadElement,
): TSESTree.Identifier | null {
  return property.argument.type === AST_NODE_TYPES.Identifier
    ? property.argument
    : null
}

/**
 * Group same-named source property mappings that could use a helper.
 *
 * @param objectExpression - Object literal to analyze.
 * @param minProperties - Minimum number of mappings required per source.
 * @returns Eligible same-named mappings grouped by source object.
 */
export function findSameNamedSourceMappings(
  objectExpression: TSESTree.ObjectExpression,
  minProperties: number,
): SourceMappingGroup[] {
  const groups = new Map<
    string,
    SourceMappingGroup & { hasExistingSpread: boolean }
  >()

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
