// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { sum } from "./sum"

const sumDataFirst = sum([1, 2, 3] as const)
const sumDataLast = sum()([1, 2, 3] as const)
const sumIterableDataFirst = sum(new Set([1, 2, 3] as const))
const sumIterableDataLast = sum()(new Set([1, 2, 3] as const))

true satisfies IsEqual<typeof sumDataFirst, number>
true satisfies IsEqual<typeof sumDataLast, number>
true satisfies IsEqual<typeof sumIterableDataFirst, number>
true satisfies IsEqual<typeof sumIterableDataLast, number>

const sumByDataFirst = sum(
  [{ count: 1 }, { count: 2 }] as const,
  (value) => value.count,
)
const sumByDataLast = sum((value: { readonly count: number }) => value.count)([
  { count: 1 },
  { count: 2 },
] as const)

/**
 * Named fixture for reusable-value inference checks involving
 * annotatedSelectorValuesWithExtraProperties.
 */
const annotatedSelectorValuesWithExtraProperties = [
  { count: 1, label: "one" },
] as const
const sumByDataLastWithAnnotatedSelectorVariable = sum(
  (value: { readonly count: number }) => value.count,
)(annotatedSelectorValuesWithExtraProperties)
const sumByDataLastWithAnnotatedSelectorInline = sum(
  (value: { readonly count: number }) => value.count,
)([{ count: 1, label: "one" }] as const)
const sumByPathDataFirst = sum([{ count: 1 }, { count: 2 }] as const, "count")
const sumByDotPathDataFirst = sum(
  [{ stats: { score: 1 } }, { stats: { score: 2 } }] as const,
  "stats.score",
)
const sumByPathDataLast = sum("count")([{ count: 1 }, { count: 2 }] as const)
const sumByPathDataLastWithExtraProperties = sum("a")([
  { a: 5, b: "djwjdkw" },
] as const)
const sumByPathIterableDataLastWithExtraProperties = sum("a")(
  new Set([{ a: 5, b: "djwjdkw" }] as const),
)
const sumByDotPathDataLast = sum("stats.score")([
  { stats: { score: 1 } },
  { stats: { score: 2 } },
] as const)
const sumByTypedPathDataLast = sum<{
  readonly stats: { readonly score: number }
}>("stats.score")([{ stats: { score: 1 } }] as const)

true satisfies IsEqual<typeof sumByDataFirst, number>
true satisfies IsEqual<typeof sumByDataLast, number>
true satisfies IsEqual<
  typeof sumByDataLastWithAnnotatedSelectorVariable,
  number
>
true satisfies IsEqual<typeof sumByDataLastWithAnnotatedSelectorInline, number>
true satisfies IsEqual<typeof sumByPathDataFirst, number>
true satisfies IsEqual<typeof sumByDotPathDataFirst, number>
true satisfies IsEqual<typeof sumByPathDataLast, number>
true satisfies IsEqual<typeof sumByPathDataLastWithExtraProperties, number>
true satisfies IsEqual<
  typeof sumByPathIterableDataLastWithExtraProperties,
  number
>
true satisfies IsEqual<typeof sumByDotPathDataLast, number>
true satisfies IsEqual<typeof sumByTypedPathDataLast, number>

// @ts-expect-error selector functions must return a number.
sum([{ count: 1, label: "one" }] as const, (value) => value.label)

// @ts-expect-error data-last selector functions must return a number.
sum((value: { readonly count: number; readonly label: string }) => value.label)

// @ts-expect-error string selectors must point to a number.
sum([{ count: 1, label: "one" }] as const, "label")

// @ts-expect-error string selectors must exist on the value type.
sum([{ count: 1 }] as const, "missing")

// @ts-expect-error data-last string selectors are checked once values are provided.
sum("label")([{ count: 1, label: "one" }] as const)

// @ts-expect-error primitive strings are selectors, not numeric iterable inputs.
const _primitiveStringSum: number = sum("count")

// @ts-expect-error explicit data-last string selectors must point to a number.
sum<{ readonly count: number; readonly label: string }>("label")
