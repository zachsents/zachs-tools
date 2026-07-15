import { ESLintUtils, TSESTree } from "@typescript-eslint/utils"
import { createRule } from "../shared/create-rule"
import { findSameNamedSourceMappings } from "../shared/exact-property-map"
import { getSourceShape } from "../shared/type-shape"

/** Check whether mapped keys are a strict subset of source properties. */
function isStrictSubset(
  mappedKeys: Set<string>,
  sourceProperties: Set<string>,
): boolean {
  if (mappedKeys.size >= sourceProperties.size) return false

  for (const key of mappedKeys) {
    if (!sourceProperties.has(key)) return false
  }

  return true
}

export default createRule<[{ minProperties?: number }?], "preferPick">({
  name: "prefer-pick-for-object-subset-map",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer a pick utility when an object literal remaps a same-named property subset from a source object",
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
      preferPick:
        "`{{source}}` is remapped by {{count}} identical property names but has other known properties. Prefer `pick({{source}}, [{{keys}}])` or equivalent.",
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
          if (shape.kind !== "known") continue

          const mappedKeys = new Set(
            group.mappings.map((mapping) => mapping.keyName),
          )
          if (
            !shape.hasIndexSignature &&
            !isStrictSubset(mappedKeys, shape.propertyNames)
          ) {
            continue
          }

          const firstMapping = group.mappings.at(0)
          if (!firstMapping) continue

          context.report({
            node: firstMapping.node,
            messageId: "preferPick",
            data: {
              source: group.sourceName,
              count: String(mappedKeys.size),
              keys: Array.from(mappedKeys)
                .toSorted()
                .map((key) => `"${key}"`)
                .join(", "),
            },
          })
        }
      },
    }
  },
})
