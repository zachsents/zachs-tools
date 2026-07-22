// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { median } from "./median"

const medianDataFirst = median([1, 2, 3] as const)
const medianDataLast = median()([1, 2, 3] as const)
const medianIterableDataFirst = median(new Set([1, 2, 3] as const))
const medianIterableDataLast = median()(new Set([1, 2, 3] as const))

true satisfies IsEqual<typeof medianDataFirst, number | undefined>
true satisfies IsEqual<typeof medianDataLast, number | undefined>
true satisfies IsEqual<typeof medianIterableDataFirst, number | undefined>
true satisfies IsEqual<typeof medianIterableDataLast, number | undefined>

const medianByDataFirst = median(
  [{ score: 1 }, { score: 2 }] as const,
  (value) => value.score,
)
const medianByDataLast = median(
  (value: { readonly score: number }) => value.score,
)([{ score: 1 }, { score: 2 }] as const)

/**
 * Named fixture for reusable-value inference checks involving
 * medianAnnotatedSelectorValuesWithExtraProperties.
 */
const medianAnnotatedSelectorValuesWithExtraProperties = [
  { score: 1, label: "one" },
] as const
const medianByDataLastWithAnnotatedSelectorVariable = median(
  (value: { readonly score: number }) => value.score,
)(medianAnnotatedSelectorValuesWithExtraProperties)
const medianByDataLastWithAnnotatedSelectorInline = median(
  (value: { readonly score: number }) => value.score,
)([{ score: 1, label: "one" }] as const)
const medianByPathDataFirst = median(
  [{ score: 1 }, { score: 2 }] as const,
  "score",
)
const medianByDotPathDataFirst = median(
  [{ stats: { score: 1 } }, { stats: { score: 2 } }] as const,
  "stats.score",
)
const medianByPathDataLast = median("score")([{ score: 1 }, { score: 2 }])
const medianByPathDataLastWithExtraProperties = median("a")([
  { a: 5, b: "djwjdkw" },
])
const medianByPathIterableDataLastWithExtraProperties = median("a")(
  new Set([{ a: 5, b: "djwjdkw" }]),
)
const medianByDotPathDataLast = median("stats.score")([
  { stats: { score: 1 } },
  { stats: { score: 2 } },
])
const medianByTypedPathDataLast = median<{
  readonly stats: { readonly score: number }
}>("stats.score")([{ stats: { score: 1 } }])

true satisfies IsEqual<typeof medianByDataFirst, number | undefined>
true satisfies IsEqual<typeof medianByDataLast, number | undefined>
true satisfies IsEqual<
  typeof medianByDataLastWithAnnotatedSelectorVariable,
  number | undefined
>
true satisfies IsEqual<
  typeof medianByDataLastWithAnnotatedSelectorInline,
  number | undefined
>
true satisfies IsEqual<typeof medianByPathDataFirst, number | undefined>
true satisfies IsEqual<typeof medianByDotPathDataFirst, number | undefined>
true satisfies IsEqual<typeof medianByPathDataLast, number | undefined>
true satisfies IsEqual<
  typeof medianByPathDataLastWithExtraProperties,
  number | undefined
>
true satisfies IsEqual<
  typeof medianByPathIterableDataLastWithExtraProperties,
  number | undefined
>
true satisfies IsEqual<typeof medianByDotPathDataLast, number | undefined>
true satisfies IsEqual<typeof medianByTypedPathDataLast, number | undefined>

// @ts-expect-error selector functions must return a number.
median([{ score: 1, label: "one" }] as const, (value) => value.label)

median(
  // @ts-expect-error data-last selector functions must return a number.
  (value: { readonly score: number; readonly label: string }) => value.label,
)

// @ts-expect-error string selectors must point to a number.
median([{ score: 1, label: "one" }] as const, "label")

// @ts-expect-error string selectors must exist on the value type.
median([{ score: 1 }] as const, "missing")

// @ts-expect-error data-last string selectors are checked once values are provided.
median("label")([{ score: 1, label: "one" }])

// @ts-expect-error primitive strings are selectors, not numeric iterable inputs.
const _primitiveStringMedian: number | undefined = median("score")

// @ts-expect-error explicit data-last string selectors must point to a number.
median<{ readonly score: number; readonly label: string }>("label")
