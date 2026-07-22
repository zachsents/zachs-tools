// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { pipe } from "./pipe"
import { zip } from "./zip"

const zipDataFirst = zip(["a", "b"] as const, [1, 2] as const)
const zipDataLast = zip([1, 2] as const)(["a", "b"] as const)
const zipIterableDataFirst = zip(
  new Set(["a", "b"] as const),
  new Set([1, 2] as const),
)
const zipIterableDataLast = zip(new Set([1, 2] as const))(
  new Set(["a", "b"] as const),
)
const zipMergerDataFirst = zip(
  ["a", "b"] as const,
  [1, 2] as const,
  (leftValue, rightValue) =>
    leftValue === "a" && rightValue === 1 ? "first" : "other",
)
const zipMergerDataLast = zip(
  [1, 2] as const,
  (leftValue: "a" | "b", rightValue) =>
    leftValue === "a" && rightValue === 1 ? "first" : "other",
)(["a", "b"] as const)

/**
 * Named fixture for reusable-value inference checks involving
 * annotatedZipLeftValuesWithExtraProperties.
 */
const annotatedZipLeftValuesWithExtraProperties = [
  { count: 1, label: "one" },
] as const
const zipMergerDataLastWithAnnotatedLeftVariable = zip(
  [10] as const,
  (leftValue: { readonly count: number }, rightValue) =>
    leftValue.count + rightValue,
)(annotatedZipLeftValuesWithExtraProperties)
const zipMergerDataLastWithAnnotatedLeftInline = zip(
  [10] as const,
  (leftValue: { readonly count: number }, rightValue) =>
    leftValue.count + rightValue,
)([{ count: 1, label: "one" }] as const)
const zipPipeContext = pipe(
  [
    { count: 1, label: "one" },
    { count: 2, label: "two" },
  ] as const,
  zip([10, 20] as const, (leftValue, rightValue) =>
    leftValue.label === "one" && rightValue === 10 ? "first" : "other",
  ),
)
const zipMergerSourcesDataFirst = zip(
  ["a", "b"] as const,
  [1, 2] as const,
  (leftValue, rightValue, index, leftValues, rightValues) => {
    true satisfies IsEqual<typeof leftValue, "a" | "b">
    true satisfies IsEqual<typeof rightValue, 1 | 2>
    true satisfies IsEqual<typeof index, number>
    true satisfies IsEqual<typeof leftValues, readonly ("a" | "b")[]>
    true satisfies IsEqual<typeof rightValues, readonly (1 | 2)[]>

    return leftValue === "a" && rightValue === 1 ? "first" : "other"
  },
)
const zipMergerSourcesDataLast = zip(
  [1, 2] as const,
  (leftValue: "a" | "b", rightValue, index, leftValues, rightValues) => {
    true satisfies IsEqual<typeof rightValue, 1 | 2>
    true satisfies IsEqual<typeof index, number>
    true satisfies IsEqual<typeof leftValues, readonly ("a" | "b")[]>
    true satisfies IsEqual<typeof rightValues, readonly (1 | 2)[]>

    return leftValue === "a" && rightValue === 1 ? "first" : "other"
  },
)(["a", "b"] as const)

true satisfies IsEqual<typeof zipDataFirst, Array<["a" | "b", 1 | 2]>>
true satisfies IsEqual<typeof zipDataLast, Array<["a" | "b", 1 | 2]>>
true satisfies IsEqual<typeof zipIterableDataFirst, Array<["a" | "b", 1 | 2]>>
true satisfies IsEqual<typeof zipIterableDataLast, Array<["a" | "b", 1 | 2]>>
true satisfies IsEqual<typeof zipMergerDataFirst, Array<"first" | "other">>
true satisfies IsEqual<typeof zipMergerDataLast, Array<"first" | "other">>
true satisfies IsEqual<
  typeof zipMergerDataLastWithAnnotatedLeftVariable,
  number[]
>
true satisfies IsEqual<
  typeof zipMergerDataLastWithAnnotatedLeftInline,
  number[]
>
true satisfies IsEqual<typeof zipPipeContext, Array<"first" | "other">>
true satisfies IsEqual<
  typeof zipMergerSourcesDataFirst,
  Array<"first" | "other">
>
true satisfies IsEqual<
  typeof zipMergerSourcesDataLast,
  Array<"first" | "other">
>
