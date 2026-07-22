// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { match, matchMerge } from "./match"

const matchMatcherDataFirst = match(
  ["a", "b"] as const,
  [1, 2] as const,
  (leftValue, rightValue) => leftValue === "a" && rightValue === 1,
)
const matchMatcherDataLast = match(
  [1, 2] as const,
  (leftValue: "a" | "b", rightValue) => leftValue === "a" && rightValue === 1,
)(["a", "b"] as const)
const matchMatcherDataLastWithExtraProperties = match(
  [{ id: 1, count: 1 }] as const,
  (leftValue: { id: number }, rightValue) => leftValue.id === rightValue.id,
)([{ id: 1, label: "A" }] as const)
const matchMatcherIterableDataLast = match(
  new Set([{ id: 1, count: 1 }] as const),
  (leftValue: { id: number }, rightValue) => leftValue.id === rightValue.id,
)(new Set([{ id: 1, label: "A" }] as const))

const matchPathMatcherDataFirst = match(
  [{ id: "a" }, { id: "b" }] as const,
  [{ id: "b" }, { id: "a" }] as const,
  "id",
)
const matchDotPathMatcherDataFirst = match(
  [{ user: { id: "a" } }, { user: { id: "b" } }] as const,
  [{ user: { id: "b" } }, { user: { id: "a" } }] as const,
  "user.id",
)
const matchPathMatcherDataLast = match(
  [{ id: "b" }, { id: "a" }] as const,
  "id",
)([{ id: "a" }, { id: "b" }] as const)
const matchDotPathMatcherDataLast = match(
  [{ user: { id: "b" } }, { user: { id: "a" } }] as const,
  "user.id",
)([{ user: { id: "a" } }, { user: { id: "b" } }] as const)
const matchPathMatcherDataLastWithExtraProperties = match(
  [{ id: 1, rightOnly: "right" }] as const,
  "id",
)([{ id: 1, leftOnly: "left" }] as const)
const matchPathMatcherIterableDataLastWithExtraProperties = match(
  new Set([{ id: 1, rightOnly: "right" }] as const),
  "id",
)(new Set([{ id: 1, leftOnly: "left" }] as const))

const matchMergeDataFirst = matchMerge(
  [{ id: "a", label: "A" }],
  [{ id: "a", count: 1 }],
  "id",
)
const matchMergeDataLast = matchMerge(
  [{ id: "a", count: 1 }],
  "id",
)([{ id: "a", label: "A" }])
const matchMergeMatcherDataFirst = matchMerge(
  [{ id: "a", label: "A" }],
  [{ id: "a", count: 1 }],
  (leftValue, rightValue) => leftValue.id === rightValue.id,
)
const matchMergeMatcherDataLast = matchMerge(
  [{ id: "a", count: 1 }],
  (leftValue: { id: string; label: string }, rightValue) =>
    leftValue.id === rightValue.id,
)([{ id: "a", label: "A" }])

true satisfies IsEqual<typeof matchMatcherDataFirst, Array<["a" | "b", 1 | 2]>>
true satisfies IsEqual<typeof matchMatcherDataLast, Array<["a" | "b", 1 | 2]>>
true satisfies IsEqual<
  typeof matchMatcherDataLastWithExtraProperties,
  Array<
    [
      { readonly id: 1; readonly label: "A" },
      { readonly id: 1; readonly count: 1 },
    ]
  >
>
true satisfies IsEqual<
  typeof matchMatcherIterableDataLast,
  Array<
    [
      { readonly id: 1; readonly label: "A" },
      { readonly id: 1; readonly count: 1 },
    ]
  >
>
true satisfies IsEqual<
  typeof matchPathMatcherDataFirst,
  Array<
    [
      { readonly id: "a" } | { readonly id: "b" },
      { readonly id: "b" } | { readonly id: "a" },
    ]
  >
>
true satisfies IsEqual<
  typeof matchDotPathMatcherDataFirst,
  Array<
    [
      (
        | { readonly user: { readonly id: "a" } }
        | { readonly user: { readonly id: "b" } }
      ),
      (
        | { readonly user: { readonly id: "b" } }
        | { readonly user: { readonly id: "a" } }
      ),
    ]
  >
>
true satisfies IsEqual<
  typeof matchPathMatcherDataLast,
  Array<
    [
      { readonly id: "a" } | { readonly id: "b" },
      { readonly id: "b" } | { readonly id: "a" },
    ]
  >
>
true satisfies IsEqual<
  typeof matchDotPathMatcherDataLast,
  Array<
    [
      (
        | { readonly user: { readonly id: "a" } }
        | { readonly user: { readonly id: "b" } }
      ),
      (
        | { readonly user: { readonly id: "b" } }
        | { readonly user: { readonly id: "a" } }
      ),
    ]
  >
>
true satisfies IsEqual<
  typeof matchPathMatcherDataLastWithExtraProperties,
  Array<
    [
      { readonly id: 1; readonly leftOnly: "left" },
      { readonly id: 1; readonly rightOnly: "right" },
    ]
  >
>
true satisfies IsEqual<
  typeof matchPathMatcherIterableDataLastWithExtraProperties,
  Array<
    [
      { readonly id: 1; readonly leftOnly: "left" },
      { readonly id: 1; readonly rightOnly: "right" },
    ]
  >
>
true satisfies IsEqual<
  typeof matchMergeDataFirst,
  Array<{ id: string; label: string; count: number }>
>
true satisfies IsEqual<
  typeof matchMergeDataLast,
  Array<{ id: string; label: string; count: number }>
>
true satisfies IsEqual<
  typeof matchMergeMatcherDataFirst,
  Array<{ id: string; label: string; count: number }>
>
true satisfies IsEqual<
  typeof matchMergeMatcherDataLast,
  Array<{ id: string; label: string; count: number }>
>

// @ts-expect-error match requires a matcher.
match(["a", "b"] as const, [1, 2] as const)

// @ts-expect-error data-last match requires a matcher.
match([1, 2] as const)

// @ts-expect-error match accepts a positional matcher, not an options object.
match(["a", "b"] as const, [1, 2] as const, { matcher: () => true })

// @ts-expect-error string matchers must exist on both sides.
match([{ id: 1 }] as const, [{ name: "one" }] as const, "id")

// @ts-expect-error string matcher values must have the same type on both sides.
match([{ id: 1 }] as const, [{ id: "one" }] as const, "id")

// @ts-expect-error data-last string matchers must exist on the bound right side.
match([{ name: "one" }] as const, "id")

// @ts-expect-error data-last string matchers are checked once left values are provided.
match([{ id: 1 }] as const, "id")([{ name: "one" }] as const)

/**
 * Named fixture for reusable-value inference checks involving
 * wrongMatcherLeftValues.
 */
const wrongMatcherLeftValues = [{ id: 1 }] as const

/**
 * Declares the reusable-value inference fixture that checks whether the name is
 * truthy.
 *
 * @param leftValue - The left value to match.
 * @param leftValue.name - The name used by the matcher.
 */
const nameMatcher = (leftValue: { name: string }) => !!leftValue.name

// @ts-expect-error data-last matcher callbacks constrain accepted left values.
match([{ id: 1 }] as const, nameMatcher)(wrongMatcherLeftValues)

// @ts-expect-error matchMerge requires a matcher.
matchMerge([{ id: "a" }], [{ id: "a" }])

// @ts-expect-error matchMerge requires left values to be objects.
matchMerge(["a"], [{ id: 1 }], () => true)

// @ts-expect-error matchMerge requires right values to be objects.
matchMerge([{ id: 1 }], [1], () => true)

// @ts-expect-error matchMerge string matchers must exist on both sides.
matchMerge([{ id: "a" }], [{ name: "a" }], "id")
