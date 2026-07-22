// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { unique } from "./unique"

const uniqueDataFirst = unique([1, 2, 1] as const)
const uniqueDataLast = unique()([1, 2, 1] as const)
const uniqueIterableDataFirst = unique(new Set([1, 2] as const))
const uniqueIterableDataLast = unique()(new Set([1, 2] as const))

true satisfies IsEqual<typeof uniqueDataFirst, Array<1 | 2>>
true satisfies IsEqual<typeof uniqueDataLast, Array<1 | 2>>
true satisfies IsEqual<typeof uniqueIterableDataFirst, Array<1 | 2>>
true satisfies IsEqual<typeof uniqueIterableDataLast, Array<1 | 2>>

const uniqueByDataFirst = unique(
  [{ id: 1 }, { id: 2 }, { id: 1 }] as const,
  (value) => value.id,
)
const uniqueByDataLast = unique((value: { readonly id: number }) => value.id)([
  { id: 1 },
  { id: 2 },
  { id: 1 },
] as const)
const uniqueByFunctionDataLastWithInlineExtraProperties = unique(
  (value: { id: number }) => value.id,
)([
  { id: 1, leftOnly: "first" },
  { id: 2, leftOnly: "second" },
  { id: 1, leftOnly: "duplicate" },
])
const uniqueByPathDataFirst = unique(
  [{ id: 1 }, { id: 2 }, { id: 1 }] as const,
  "id",
)
const uniqueByDotPathDataFirst = unique(
  [{ user: { id: 1 } }, { user: { id: 2 } }, { user: { id: 1 } }] as const,
  "user.id",
)
const uniqueByPathDataLast = unique("id")([
  { id: 1 },
  { id: 2 },
  { id: 1 },
] as const)

/**
 * Named fixture for reusable-value inference checks involving
 * uniqueByPathValuesWithExtraProperties.
 */
const uniqueByPathValuesWithExtraProperties = [
  { a: 5, b: "first" },
  { a: 6, b: "second" },
  { a: 5, b: "duplicate" },
] as const
const uniqueByPathDataLastWithExtraPropertiesFromVariable = unique("a")(
  uniqueByPathValuesWithExtraProperties,
)
const uniqueByPathDataLastWithExtraPropertiesInline = unique("a")([
  { a: 5, b: "first" },
  { a: 6, b: "second" },
  { a: 5, b: "duplicate" },
] as const)
const uniqueByPathIterableDataLastWithExtraProperties = unique("a")(
  new Set(uniqueByPathValuesWithExtraProperties),
)
const uniqueByDotPathDataLast = unique("user.id")([
  { user: { id: 1 } },
  { user: { id: 2 } },
  { user: { id: 1 } },
] as const)

type UniqueByExpected = Array<{ readonly id: 1 } | { readonly id: 2 }>
type UniqueByDotPathExpected = Array<
  { readonly user: { readonly id: 1 } } | { readonly user: { readonly id: 2 } }
>
type UniqueByPathExtraExpected = Array<
  | { readonly a: 5; readonly b: "first" }
  | { readonly a: 6; readonly b: "second" }
  | { readonly a: 5; readonly b: "duplicate" }
>

true satisfies IsEqual<typeof uniqueByDataFirst, UniqueByExpected>
true satisfies IsEqual<typeof uniqueByDataLast, UniqueByExpected>
true satisfies IsEqual<
  typeof uniqueByFunctionDataLastWithInlineExtraProperties,
  Array<{ id: number; leftOnly: string }>
>
true satisfies IsEqual<typeof uniqueByPathDataFirst, UniqueByExpected>
true satisfies IsEqual<typeof uniqueByDotPathDataFirst, UniqueByDotPathExpected>
true satisfies IsEqual<typeof uniqueByPathDataLast, UniqueByExpected>
true satisfies IsEqual<
  typeof uniqueByPathDataLastWithExtraPropertiesFromVariable,
  UniqueByPathExtraExpected
>
true satisfies IsEqual<
  typeof uniqueByPathDataLastWithExtraPropertiesInline,
  UniqueByPathExtraExpected
>
true satisfies IsEqual<
  typeof uniqueByPathIterableDataLastWithExtraProperties,
  UniqueByPathExtraExpected
>
true satisfies IsEqual<typeof uniqueByDotPathDataLast, UniqueByDotPathExpected>

// @ts-expect-error string selectors must exist on the value type.
unique([{ id: 1 }] as const, "missing")

// @ts-expect-error data-last string selectors are checked once values are provided.
unique("missing")([{ id: 1 }] as const)

// @ts-expect-error primitive strings are selectors, not iterable values.
const _primitiveStringUnique: string[] = unique("id")
