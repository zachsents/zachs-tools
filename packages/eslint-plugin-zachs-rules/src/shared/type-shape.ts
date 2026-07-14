import { TSESTree } from "@typescript-eslint/utils"
import type { ParserServicesWithTypeInformation } from "@typescript-eslint/utils"
import ts from "typescript"

export type SourceShape =
  | {
      kind: "known"
      propertyNames: Set<string>
      hasIndexSignature: boolean
    }
  | {
      kind: "unknown"
    }

/** Check whether a type cannot provide a stable property shape. */
function isUnknownLikeType(type: ts.Type): boolean {
  return Boolean(
    type.flags &
      (ts.TypeFlags.Any |
        ts.TypeFlags.Unknown |
        ts.TypeFlags.Never |
        ts.TypeFlags.TypeParameter),
  )
}

/** Check whether a type accepts arbitrary string or number keys. */
function hasIndexSignature(type: ts.Type, checker: ts.TypeChecker): boolean {
  const apparent = checker.getApparentType(type)
  return (
    checker.getIndexInfoOfType(apparent, ts.IndexKind.String) !== undefined ||
    checker.getIndexInfoOfType(apparent, ts.IndexKind.Number) !== undefined
  )
}

/** Return a user-facing property name for a TypeScript symbol. */
function getStringPropertyName(symbol: ts.Symbol): string | null {
  const name = symbol.getName()
  return name.startsWith("__@") ? null : name
}

/** Resolve the statically known property shape for an ESTree node. */
export function getSourceShape(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
): SourceShape {
  const type = services.getTypeAtLocation(node)
  const checker = services.program.getTypeChecker()

  if (isUnknownLikeType(type) || type.isUnion()) {
    return { kind: "unknown" }
  }

  const apparent = checker.getApparentType(type)

  if (isUnknownLikeType(apparent) || apparent.getCallSignatures().length > 0) {
    return { kind: "unknown" }
  }

  const propertyNames = new Set(
    checker
      .getPropertiesOfType(apparent)
      .map(getStringPropertyName)
      .filter((name): name is string => name !== null),
  )

  if (propertyNames.size === 0) {
    return { kind: "unknown" }
  }

  return {
    kind: "known",
    propertyNames,
    hasIndexSignature: hasIndexSignature(apparent, checker),
  }
}
