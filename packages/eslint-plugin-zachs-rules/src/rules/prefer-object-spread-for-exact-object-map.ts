import { ESLintUtils, TSESTree } from "@typescript-eslint/utils"
import { findSameNamedSourceMappings } from "../shared/exact-property-map"
import { getSourceShape } from "../shared/type-shape"

type Options = [
  {
    minProperties?: number
  }?,
]

type MessageIds = "preferSpread"

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://example.invalid/rules/${name}`,
)

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

export default createRule<Options, MessageIds>({
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
    const services = ESLintUtils.getParserServices(context)
    const minProperties = options?.minProperties ?? 2

    return {
      ObjectExpression(node: TSESTree.ObjectExpression) {
        for (const group of findSameNamedSourceMappings(node, minProperties)) {
          const shape = getSourceShape(services, group.sourceNode)
          if (shape.kind !== "known" || shape.hasIndexSignature) continue

          const mappedKeys = new Set(
            group.mappings.map((mapping) => mapping.keyName),
          )

          if (!hasExactPropertySet(mappedKeys, shape.propertyNames)) continue

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
