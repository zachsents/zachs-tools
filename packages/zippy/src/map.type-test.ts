// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import {
  map,
  mapAsync,
  mapEntries,
  mapEntriesAsync,
  mapKeys,
  mapKeysAsync,
  mapValues,
  mapValuesAsync,
} from "./map"
import { pipe } from "./pipe"

const mapDataFirst = map([1, 2, 3] as const, (value) =>
  value === 1 ? "one" : "other",
)
const mapDataLast = map((value: 1 | 2 | 3) => (value === 1 ? "one" : "other"))([
  1, 2, 3,
] as const)
const mapIterableDataFirst = map(new Set([1, 2, 3] as const), (value) =>
  value === 1 ? "one" : "other",
)
const mapIterableDataLast = map((value: 1 | 2 | 3) =>
  value === 1 ? "one" : "other",
)(new Set([1, 2, 3] as const))

/**
 * Named fixture for reusable-value inference checks involving
 * annotatedMapValuesWithExtraProperties.
 */
const annotatedMapValuesWithExtraProperties = [
  { count: 1, label: "one" },
] as const
const annotatedMapRecordWithExtraProperties = {
  first: { count: 1, label: "one" },
} as const
const mapDataLastWithAnnotatedSelectorVariable = map(
  (value: { readonly count: number }) => value.count,
)(annotatedMapValuesWithExtraProperties)
const mapDataLastWithAnnotatedSelectorInline = map(
  (value: { readonly count: number }) => value.count,
)([{ count: 1, label: "one" }] as const)
const mapPathDataFirst = map(
  [
    { id: 1, profile: { name: "Ada" } },
    { id: 2, profile: { name: "Linus" } },
  ] as const,
  "profile.name",
)
const mapPathDataLast = map("id")([
  { id: 1, profile: { name: "Ada" } },
  { id: 2, profile: { name: "Linus" } },
] as const)
const mapPathIterableDataLast = map("id")(
  new Set([
    { id: 1, profile: { name: "Ada" } },
    { id: 2, profile: { name: "Linus" } },
  ] as const),
)
const mapPipeContext = pipe(
  [1, 2, 3] as const,
  map((value) => (value === 1 ? "one" : "other")),
)

true satisfies IsEqual<typeof mapDataFirst, Array<"one" | "other">>
true satisfies IsEqual<typeof mapDataLast, Array<"one" | "other">>
true satisfies IsEqual<typeof mapIterableDataFirst, Array<"one" | "other">>
true satisfies IsEqual<typeof mapIterableDataLast, Array<"one" | "other">>
true satisfies IsEqual<
  typeof mapDataLastWithAnnotatedSelectorVariable,
  number[]
>
true satisfies IsEqual<typeof mapDataLastWithAnnotatedSelectorInline, number[]>
true satisfies IsEqual<typeof mapPathDataFirst, Array<"Ada" | "Linus">>
true satisfies IsEqual<typeof mapPathDataLast, Array<1 | 2>>
true satisfies IsEqual<typeof mapPathIterableDataLast, Array<1 | 2>>
true satisfies IsEqual<typeof mapPipeContext, Array<"one" | "other">>

// @ts-expect-error string selectors must exist on the value type.
map([{ id: 1 }] as const, "missing")

// @ts-expect-error data-last string selectors are checked once values are provided.
map("missing")([{ id: 1 }] as const)

// @ts-expect-error primitive strings are selectors, not iterable values.
const _primitiveStringMap: string[] = map("id")

const mapAsyncDataFirst = mapAsync([1, 2, 3] as const, async (value) =>
  value === 1 ? "one" : "other",
)
const mapAsyncDataLast = mapAsync(async (value: 1 | 2 | 3) =>
  value === 1 ? "one" : "other",
)([1, 2, 3] as const)
const mapAsyncIterableDataFirst = mapAsync(
  new Set([1, 2, 3] as const),
  async (value) => (value === 1 ? "one" : "other"),
)
const mapAsyncIterableDataLast = mapAsync(async (value: 1 | 2 | 3) =>
  value === 1 ? "one" : "other",
)(new Set([1, 2, 3] as const))
const mapAsyncDataLastWithAnnotatedMapperVariable = mapAsync(
  async (value: { readonly count: number }) => value.count,
)(annotatedMapValuesWithExtraProperties)
const mapAsyncDataLastWithAnnotatedMapperInline = mapAsync(
  async (value: { readonly count: number }) => value.count,
)([{ count: 1, label: "one" }] as const)
const mapAsyncOptionsDataFirst = mapAsync(
  [1, 2, 3] as const,
  async (value) => (value === 1 ? "one" : "other"),
  { concurrency: 2 },
)
const mapAsyncOptionsDataLast = mapAsync(
  async (value: 1 | 2 | 3) => (value === 1 ? "one" : "other"),
  { concurrency: 2 },
)([1, 2, 3] as const)
const mapAsyncPathDataFirst = mapAsync(
  [
    { id: 1, profile: { name: "Ada" } },
    { id: 2, profile: { name: "Linus" } },
  ] as const,
  "profile.name",
)
const mapAsyncPathDataLast = mapAsync("id")([
  { id: 1, profile: { name: "Ada" } },
  { id: 2, profile: { name: "Linus" } },
] as const)

true satisfies IsEqual<
  typeof mapAsyncDataFirst,
  Promise<Array<"one" | "other">>
>
true satisfies IsEqual<typeof mapAsyncDataLast, Promise<Array<"one" | "other">>>
true satisfies IsEqual<
  typeof mapAsyncIterableDataFirst,
  Promise<Array<"one" | "other">>
>
true satisfies IsEqual<
  typeof mapAsyncIterableDataLast,
  Promise<Array<"one" | "other">>
>
true satisfies IsEqual<
  typeof mapAsyncDataLastWithAnnotatedMapperVariable,
  Promise<number[]>
>
true satisfies IsEqual<
  typeof mapAsyncDataLastWithAnnotatedMapperInline,
  Promise<number[]>
>
true satisfies IsEqual<
  typeof mapAsyncOptionsDataFirst,
  Promise<Array<"one" | "other">>
>
true satisfies IsEqual<
  typeof mapAsyncOptionsDataLast,
  Promise<Array<"one" | "other">>
>
true satisfies IsEqual<
  typeof mapAsyncPathDataFirst,
  Promise<Array<"Ada" | "Linus">>
>
true satisfies IsEqual<typeof mapAsyncPathDataLast, Promise<Array<1 | 2>>>

// @ts-expect-error string selectors must exist on the value type.
void mapAsync([{ id: 1 }] as const, "missing")

// @ts-expect-error data-last string selectors are checked once values are provided.
void mapAsync("missing")([{ id: 1 }] as const)

const mapValuesDataFirst = mapValues({ a: 1, b: 2 } as const, (value) =>
  value === 1 ? "one" : "other",
)
const mapValuesDataLast = mapValues((value: 1 | 2) =>
  value === 1 ? "one" : "other",
)({ a: 1, b: 2 } as const)
const mapValuesDataLastWithAnnotatedMapperVariable = mapValues(
  (value: { readonly count: number }) => value.count,
)(annotatedMapRecordWithExtraProperties)
const mapValuesDataLastWithAnnotatedMapperInline = mapValues(
  (value: { readonly count: number }) => value.count,
)({ first: { count: 1, label: "one" } } as const)
const mapValuesPathDataFirst = mapValues(
  {
    first: { id: 1, profile: { name: "Ada" } },
    second: { id: 2, profile: { name: "Linus" } },
  } as const,
  "profile.name",
)
const mapValuesPathDataLast = mapValues("id")({
  first: { id: 1, profile: { name: "Ada" } },
  second: { id: 2, profile: { name: "Linus" } },
} as const)

true satisfies IsEqual<
  typeof mapValuesDataFirst,
  Record<string, "one" | "other">
>
true satisfies IsEqual<
  typeof mapValuesDataLast,
  Record<string, "one" | "other">
>
true satisfies IsEqual<
  typeof mapValuesDataLastWithAnnotatedMapperVariable,
  Record<string, number>
>
true satisfies IsEqual<
  typeof mapValuesDataLastWithAnnotatedMapperInline,
  Record<string, number>
>
true satisfies IsEqual<
  typeof mapValuesPathDataFirst,
  Record<string, "Ada" | "Linus">
>
true satisfies IsEqual<typeof mapValuesPathDataLast, Record<string, 1 | 2>>

// @ts-expect-error string selectors must exist on the value type.
mapValues({ first: { id: 1 } } as const, "missing")

// @ts-expect-error data-last string selectors are checked once values are provided.
mapValues("missing")({ first: { id: 1 } } as const)

const mapValuesAsyncDataFirst = mapValuesAsync(
  { a: 1, b: 2 } as const,
  async (value) => (value === 1 ? "one" : "other"),
)
const mapValuesAsyncDataLast = mapValuesAsync(async (value: 1 | 2) =>
  value === 1 ? "one" : "other",
)({ a: 1, b: 2 } as const)
const mapValuesAsyncDataLastWithAnnotatedMapperVariable = mapValuesAsync(
  async (value: { readonly count: number }) => value.count,
)(annotatedMapRecordWithExtraProperties)
const mapValuesAsyncDataLastWithAnnotatedMapperInline = mapValuesAsync(
  async (value: { readonly count: number }) => value.count,
)({ first: { count: 1, label: "one" } } as const)
const mapValuesAsyncOptionsDataFirst = mapValuesAsync(
  { a: 1, b: 2 } as const,
  async (value) => (value === 1 ? "one" : "other"),
  { concurrency: 2 },
)
const mapValuesAsyncOptionsDataLast = mapValuesAsync(
  async (value: 1 | 2) => (value === 1 ? "one" : "other"),
  { concurrency: 2 },
)({ a: 1, b: 2 } as const)
const mapValuesAsyncPathDataFirst = mapValuesAsync(
  {
    first: { id: 1, profile: { name: "Ada" } },
    second: { id: 2, profile: { name: "Linus" } },
  } as const,
  "profile.name",
)
const mapValuesAsyncPathDataLast = mapValuesAsync("id")({
  first: { id: 1, profile: { name: "Ada" } },
  second: { id: 2, profile: { name: "Linus" } },
} as const)

true satisfies IsEqual<
  typeof mapValuesAsyncDataFirst,
  Promise<Record<string, "one" | "other">>
>
true satisfies IsEqual<
  typeof mapValuesAsyncDataLast,
  Promise<Record<string, "one" | "other">>
>
true satisfies IsEqual<
  typeof mapValuesAsyncDataLastWithAnnotatedMapperVariable,
  Promise<Record<string, number>>
>
true satisfies IsEqual<
  typeof mapValuesAsyncDataLastWithAnnotatedMapperInline,
  Promise<Record<string, number>>
>
true satisfies IsEqual<
  typeof mapValuesAsyncOptionsDataFirst,
  Promise<Record<string, "one" | "other">>
>
true satisfies IsEqual<
  typeof mapValuesAsyncOptionsDataLast,
  Promise<Record<string, "one" | "other">>
>
true satisfies IsEqual<
  typeof mapValuesAsyncPathDataFirst,
  Promise<Record<string, "Ada" | "Linus">>
>
true satisfies IsEqual<
  typeof mapValuesAsyncPathDataLast,
  Promise<Record<string, 1 | 2>>
>

// @ts-expect-error string selectors must exist on the value type.
void mapValuesAsync({ first: { id: 1 } } as const, "missing")

// @ts-expect-error data-last string selectors are checked once values are provided.
void mapValuesAsync("missing")({ first: { id: 1 } } as const)

const mapKeysDataFirst = mapKeys({ a: 1, b: 2 } as const, (_value, key) =>
  key === "a" ? "first" : "other",
)
const mapKeysDataLast = mapKeys((_value: 1 | 2, key) =>
  key === "a" ? "first" : "other",
)({ a: 1, b: 2 } as const)
const mapKeysDataLastWithAnnotatedMapperVariable = mapKeys(
  (value: { readonly count: number }) => value.count,
)(annotatedMapRecordWithExtraProperties)
const mapKeysDataLastWithAnnotatedMapperInline = mapKeys(
  (value: { readonly count: number }) => value.count,
)({ first: { count: 1, label: "one" } } as const)
const mapKeysPathDataFirst = mapKeys(
  {
    first: { id: "user-1", profile: { name: "Ada" } },
    second: { id: "user-2", profile: { name: "Linus" } },
  } as const,
  "id",
)
const mapKeysPathDataLast = mapKeys("profile.name")({
  first: { id: "user-1", profile: { name: "Ada" } },
  second: { id: "user-2", profile: { name: "Linus" } },
} as const)

true satisfies IsEqual<
  typeof mapKeysDataFirst,
  Record<"first" | "other", 1 | 2>
>
true satisfies IsEqual<typeof mapKeysDataLast, Record<"first" | "other", 1 | 2>>
true satisfies IsEqual<
  typeof mapKeysDataLastWithAnnotatedMapperVariable,
  Record<number, { readonly count: 1; readonly label: "one" }>
>
true satisfies IsEqual<
  typeof mapKeysDataLastWithAnnotatedMapperInline,
  Record<number, { readonly count: 1; readonly label: "one" }>
>
true satisfies IsEqual<
  typeof mapKeysPathDataFirst,
  Record<
    "user-1" | "user-2",
    | { readonly id: "user-1"; readonly profile: { readonly name: "Ada" } }
    | { readonly id: "user-2"; readonly profile: { readonly name: "Linus" } }
  >
>
true satisfies IsEqual<
  typeof mapKeysPathDataLast,
  Record<
    "Ada" | "Linus",
    | { readonly id: "user-1"; readonly profile: { readonly name: "Ada" } }
    | { readonly id: "user-2"; readonly profile: { readonly name: "Linus" } }
  >
>

// @ts-expect-error string selectors used as keys must point to property keys.
mapKeys({ first: { profile: { name: "Ada" } } } as const, "profile")

// @ts-expect-error data-last string selectors are checked once values are provided.
mapKeys("missing")({ first: { id: "user-1" } } as const)

const mapKeysAsyncDataFirst = mapKeysAsync(
  { a: 1, b: 2 } as const,
  async (_value, key) => (key === "a" ? "first" : "other"),
)
const mapKeysAsyncDataLast = mapKeysAsync(async (_value: 1 | 2, key) =>
  key === "a" ? "first" : "other",
)({ a: 1, b: 2 } as const)
const mapKeysAsyncDataLastWithAnnotatedMapperVariable = mapKeysAsync(
  async (value: { readonly count: number }) => value.count,
)(annotatedMapRecordWithExtraProperties)
const mapKeysAsyncDataLastWithAnnotatedMapperInline = mapKeysAsync(
  async (value: { readonly count: number }) => value.count,
)({ first: { count: 1, label: "one" } } as const)
const mapKeysAsyncOptionsDataFirst = mapKeysAsync(
  { a: 1, b: 2 } as const,
  async (_value, key) => (key === "a" ? "first" : "other"),
  { concurrency: 2 },
)
const mapKeysAsyncOptionsDataLast = mapKeysAsync(
  async (_value: 1 | 2, key) => (key === "a" ? "first" : "other"),
  { concurrency: 2 },
)({ a: 1, b: 2 } as const)
const mapKeysAsyncPathDataFirst = mapKeysAsync(
  {
    first: { id: "user-1", profile: { name: "Ada" } },
    second: { id: "user-2", profile: { name: "Linus" } },
  } as const,
  "id",
)
const mapKeysAsyncPathDataLast = mapKeysAsync("profile.name")({
  first: { id: "user-1", profile: { name: "Ada" } },
  second: { id: "user-2", profile: { name: "Linus" } },
} as const)

true satisfies IsEqual<
  typeof mapKeysAsyncDataFirst,
  Promise<Record<"first" | "other", 1 | 2>>
>
true satisfies IsEqual<
  typeof mapKeysAsyncDataLast,
  Promise<Record<"first" | "other", 1 | 2>>
>
true satisfies IsEqual<
  typeof mapKeysAsyncDataLastWithAnnotatedMapperVariable,
  Promise<Record<number, { readonly count: 1; readonly label: "one" }>>
>
true satisfies IsEqual<
  typeof mapKeysAsyncDataLastWithAnnotatedMapperInline,
  Promise<Record<number, { readonly count: 1; readonly label: "one" }>>
>
true satisfies IsEqual<
  typeof mapKeysAsyncOptionsDataFirst,
  Promise<Record<"first" | "other", 1 | 2>>
>
true satisfies IsEqual<
  typeof mapKeysAsyncOptionsDataLast,
  Promise<Record<"first" | "other", 1 | 2>>
>
true satisfies IsEqual<
  typeof mapKeysAsyncPathDataFirst,
  Promise<
    Record<
      "user-1" | "user-2",
      | { readonly id: "user-1"; readonly profile: { readonly name: "Ada" } }
      | { readonly id: "user-2"; readonly profile: { readonly name: "Linus" } }
    >
  >
>
true satisfies IsEqual<
  typeof mapKeysAsyncPathDataLast,
  Promise<
    Record<
      "Ada" | "Linus",
      | { readonly id: "user-1"; readonly profile: { readonly name: "Ada" } }
      | { readonly id: "user-2"; readonly profile: { readonly name: "Linus" } }
    >
  >
>

// @ts-expect-error string selectors used as keys must point to property keys.
void mapKeysAsync({ first: { profile: { name: "Ada" } } } as const, "profile")

// @ts-expect-error data-last string selectors are checked once values are provided.
void mapKeysAsync("missing")({ first: { id: "user-1" } } as const)

const mapEntriesDataFirst = mapEntries(
  { a: 1, b: 2 } as const,
  ([key, value]) =>
    [key === "a" ? "first" : "other", value === 1 ? "one" : "other"] as const,
)
const mapEntriesDataLast = mapEntries(
  ([key, value]: readonly [string, 1 | 2]) =>
    [key === "a" ? "first" : "other", value === 1 ? "one" : "other"] as const,
)({ a: 1, b: 2 } as const)
const mapEntriesDataLastWithAnnotatedMapperVariable = mapEntries(
  ([key, value]: readonly [string, { readonly count: number }]) =>
    [key, value.count] as const,
)(annotatedMapRecordWithExtraProperties)
const mapEntriesDataLastWithAnnotatedMapperInline = mapEntries(
  ([key, value]: readonly [string, { readonly count: number }]) =>
    [key, value.count] as const,
)({ first: { count: 1, label: "one" } } as const)

true satisfies IsEqual<
  typeof mapEntriesDataFirst,
  Record<"first" | "other", "one" | "other">
>
true satisfies IsEqual<
  typeof mapEntriesDataLast,
  Record<"first" | "other", "one" | "other">
>
true satisfies IsEqual<
  typeof mapEntriesDataLastWithAnnotatedMapperVariable,
  Record<string, number>
>
true satisfies IsEqual<
  typeof mapEntriesDataLastWithAnnotatedMapperInline,
  Record<string, number>
>

const mapEntriesAsyncDataFirst = mapEntriesAsync(
  { a: 1, b: 2 } as const,
  async ([key, value]) =>
    [key === "a" ? "first" : "other", value === 1 ? "one" : "other"] as const,
)
const mapEntriesAsyncDataLast = mapEntriesAsync(
  async ([key, value]: readonly [string, 1 | 2]) =>
    [key === "a" ? "first" : "other", value === 1 ? "one" : "other"] as const,
)({ a: 1, b: 2 } as const)
const mapEntriesAsyncDataLastWithAnnotatedMapperVariable = mapEntriesAsync(
  async ([key, value]: readonly [string, { readonly count: number }]) =>
    [key, value.count] as const,
)(annotatedMapRecordWithExtraProperties)
const mapEntriesAsyncDataLastWithAnnotatedMapperInline = mapEntriesAsync(
  async ([key, value]: readonly [string, { readonly count: number }]) =>
    [key, value.count] as const,
)({ first: { count: 1, label: "one" } } as const)
const mapEntriesAsyncOptionsDataFirst = mapEntriesAsync(
  { a: 1, b: 2 } as const,
  async ([key, value]) =>
    [key === "a" ? "first" : "other", value === 1 ? "one" : "other"] as const,
  { concurrency: 2 },
)
const mapEntriesAsyncOptionsDataLast = mapEntriesAsync(
  async ([key, value]: readonly [string, 1 | 2]) =>
    [key === "a" ? "first" : "other", value === 1 ? "one" : "other"] as const,
  { concurrency: 2 },
)({ a: 1, b: 2 } as const)

true satisfies IsEqual<
  typeof mapEntriesAsyncDataFirst,
  Promise<Record<"first" | "other", "one" | "other">>
>
true satisfies IsEqual<
  typeof mapEntriesAsyncDataLast,
  Promise<Record<"first" | "other", "one" | "other">>
>
true satisfies IsEqual<
  typeof mapEntriesAsyncDataLastWithAnnotatedMapperVariable,
  Promise<Record<string, number>>
>
true satisfies IsEqual<
  typeof mapEntriesAsyncDataLastWithAnnotatedMapperInline,
  Promise<Record<string, number>>
>
true satisfies IsEqual<
  typeof mapEntriesAsyncOptionsDataFirst,
  Promise<Record<"first" | "other", "one" | "other">>
>
true satisfies IsEqual<
  typeof mapEntriesAsyncOptionsDataLast,
  Promise<Record<"first" | "other", "one" | "other">>
>
