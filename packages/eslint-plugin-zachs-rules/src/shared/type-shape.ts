import { TSESTree } from "@typescript-eslint/utils"
import type { ParserServicesWithTypeInformation } from "@typescript-eslint/utils"

/**
 * Check whether an ESTree node resolves to a callable TypeScript type.
 *
 * @param services - Type-aware parser services for the linted program.
 * @param node - ESTree node whose type should be inspected.
 */
export function hasCallSignature(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Node,
) {
  return (
    services.program
      .getTypeChecker()
      .getApparentType(services.getTypeAtLocation(node))
      .getCallSignatures().length > 0
  )
}
