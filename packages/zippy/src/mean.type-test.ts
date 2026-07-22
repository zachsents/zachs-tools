// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { mean } from "./mean"

const meanDataFirst = mean([1, 2, 3] as const)
const meanDataLast = mean()([1, 2, 3] as const)
const meanIterableDataFirst = mean(new Set([1, 2, 3] as const))
const meanIterableDataLast = mean()(new Set([1, 2, 3] as const))

true satisfies IsEqual<typeof meanDataFirst, number | undefined>
true satisfies IsEqual<typeof meanDataLast, number | undefined>
true satisfies IsEqual<typeof meanIterableDataFirst, number | undefined>
true satisfies IsEqual<typeof meanIterableDataLast, number | undefined>

const meanByDataFirst = mean(
  [{ score: 1 }, { score: 2 }] as const,
  (value) => value.score,
)
const meanByDataLast = mean((value: { readonly score: number }) => value.score)(
  [{ score: 1 }, { score: 2 }] as const,
)

/**
 * Named fixture for reusable-value inference checks involving
 * meanAnnotatedSelectorValuesWithExtraProperties.
 */
const meanAnnotatedSelectorValuesWithExtraProperties = [
  { score: 1, label: "one" },
] as const
const meanByDataLastWithAnnotatedSelectorVariable = mean(
  (value: { readonly score: number }) => value.score,
)(meanAnnotatedSelectorValuesWithExtraProperties)
const meanByDataLastWithAnnotatedSelectorInline = mean(
  (value: { readonly score: number }) => value.score,
)([{ score: 1, label: "one" }] as const)
const meanByPathDataFirst = mean([{ score: 1 }, { score: 2 }] as const, "score")
const meanByDotPathDataFirst = mean(
  [{ stats: { score: 1 } }, { stats: { score: 2 } }] as const,
  "stats.score",
)
const meanByPathDataLast = mean("score")([{ score: 1 }, { score: 2 }])
const meanByPathDataLastWithExtraProperties = mean("a")([
  { a: 5, b: "djwjdkw" },
])
const meanByPathIterableDataLastWithExtraProperties = mean("a")(
  new Set([{ a: 5, b: "djwjdkw" }]),
)
const meanByDotPathDataLast = mean("stats.score")([
  { stats: { score: 1 } },
  { stats: { score: 2 } },
])
const meanByTypedPathDataLast = mean<{
  readonly stats: { readonly score: number }
}>("stats.score")([{ stats: { score: 1 } }])

true satisfies IsEqual<typeof meanByDataFirst, number | undefined>
true satisfies IsEqual<typeof meanByDataLast, number | undefined>
true satisfies IsEqual<
  typeof meanByDataLastWithAnnotatedSelectorVariable,
  number | undefined
>
true satisfies IsEqual<
  typeof meanByDataLastWithAnnotatedSelectorInline,
  number | undefined
>
true satisfies IsEqual<typeof meanByPathDataFirst, number | undefined>
true satisfies IsEqual<typeof meanByDotPathDataFirst, number | undefined>
true satisfies IsEqual<typeof meanByPathDataLast, number | undefined>
true satisfies IsEqual<
  typeof meanByPathDataLastWithExtraProperties,
  number | undefined
>
true satisfies IsEqual<
  typeof meanByPathIterableDataLastWithExtraProperties,
  number | undefined
>
true satisfies IsEqual<typeof meanByDotPathDataLast, number | undefined>
true satisfies IsEqual<typeof meanByTypedPathDataLast, number | undefined>

// @ts-expect-error selector functions must return a number.
mean([{ score: 1, label: "one" }] as const, (value) => value.label)

// @ts-expect-error data-last selector functions must return a number.
mean((value: { readonly score: number; readonly label: string }) => value.label)

// @ts-expect-error string selectors must point to a number.
mean([{ score: 1, label: "one" }] as const, "label")

// @ts-expect-error string selectors must exist on the value type.
mean([{ score: 1 }] as const, "missing")

// @ts-expect-error data-last string selectors are checked once values are provided.
mean("label")([{ score: 1, label: "one" }])

// @ts-expect-error primitive strings are selectors, not numeric iterable inputs.
const _primitiveStringMean: number | undefined = mean("score")

// @ts-expect-error explicit data-last string selectors must point to a number.
mean<{ readonly score: number; readonly label: string }>("label")
