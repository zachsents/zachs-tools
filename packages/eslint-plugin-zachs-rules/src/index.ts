import preferInlineTrivialCallWrapper from "./rules/prefer-inline-trivial-call-wrapper"
import requireIntentionalModuleConst from "./rules/require-intentional-module-const"
import requireIntentionalSingleUseLocalConst from "./rules/require-intentional-single-use-local-const"
import requireIntentionalSingleUseTypeAlias from "./rules/require-intentional-single-use-type-alias"

export default {
  meta: {
    name: "eslint-plugin-zachs-rules",
  },
  rules: {
    "prefer-inline-trivial-call-wrapper": preferInlineTrivialCallWrapper,
    "require-intentional-module-const": requireIntentionalModuleConst,
    "require-intentional-single-use-local-const":
      requireIntentionalSingleUseLocalConst,
    "require-intentional-single-use-type-alias":
      requireIntentionalSingleUseTypeAlias,
  },
}
