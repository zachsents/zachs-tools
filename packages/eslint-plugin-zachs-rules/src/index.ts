import noOverlyBroadParameters from "./rules/no-overly-broad-parameters"
import noSingleUseTypeAlias from "./rules/no-single-use-type-alias"
import preferInlineModuleConst from "./rules/prefer-inline-module-const"
import preferInlineSingleUseLocalConst from "./rules/prefer-inline-single-use-local-const"
import preferObjectSpreadForExactObjectMap from "./rules/prefer-object-spread-for-exact-object-map"
import preferPickForObjectSubsetMap from "./rules/prefer-pick-for-object-subset-map"

export default {
  meta: {
    name: "eslint-plugin-zachs-rules",
  },
  rules: {
    "no-overly-broad-parameters": noOverlyBroadParameters,
    "no-single-use-type-alias": noSingleUseTypeAlias,
    "prefer-inline-module-const": preferInlineModuleConst,
    "prefer-inline-single-use-local-const": preferInlineSingleUseLocalConst,
    "prefer-object-spread-for-exact-object-map":
      preferObjectSpreadForExactObjectMap,
    "prefer-pick-for-object-subset-map": preferPickForObjectSubsetMap,
  },
}
