import { ESLintUtils, TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../shared/create-rule"
import { findSameNamedSourceMappings } from "../shared/exact-property-map"
import { getSourceShape } from "../shared/type-shape"

/** Check whether mapped keys exactly match the source properties. */
function hasExactPropertySet(
  mappedKeys: Set<string>,
  sourceProperties: Set<string>,
): boolean {
  if (mappedKeys.size !== sourceProperties.size) return false

  for (const propertyName of sourceProperties) {
    if (!mappedKeys.has(propertyName)) return false
  }

  return true
}

export default createRule<[{ minProperties?: number }?], "preferSpread">({
  name: "prefer-object-spread-for-exact-object-map",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer object spread when an object literal remaps all same-named properties from a source object",
    },
    schema: [
      {
        type: "object",
        properties: {
          minProperties: {
            type: "number",
            minimum: 2,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferSpread:
        "`{{source}}` is remapped by identical property names for all of its known properties. Prefer `{ ...{{source}} }`.",
    },
  },
  defaultOptions: [{ minProperties: 2 }],
  create(context, [options]) {
    return {
      ObjectExpression(node: TSESTree.ObjectExpression) {
        for (const group of findSameNamedSourceMappings(
          node,
          options?.minProperties ?? 2,
        )) {
          const shape = getSourceShape(
            ESLintUtils.getParserServices(context),
            group.sourceNode,
          )
          if (shape.kind !== "known" || shape.hasIndexSignature) continue

          if (
            !hasExactPropertySet(
              new Set(group.mappings.map((mapping) => mapping.keyName)),
              shape.propertyNames,
            )
          ) {
            continue
          }

          const firstMapping = group.mappings.at(0)
          if (!firstMapping) continue

          context.report({
            node: firstMapping.node,
            messageId: "preferSpread",
            data: {
              source: group.sourceName,
            },
          })
        }
      },
    }
  },
})
