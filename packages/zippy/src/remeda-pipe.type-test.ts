// This file is typechecked only and will never actually run.
import { pipe } from "remeda"
import type { IsEqual } from "type-fest"
import { castArray } from "./cast-array"
import { filter, filterOut } from "./filter"
import { isDefined, isNonNullish, isTruthy } from "./guards"
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
import { match, matchMerge } from "./match"
import { mean } from "./mean"
import { median } from "./median"
import { deepMerge, merge } from "./merge"
import { mode } from "./mode"
import { sum } from "./sum"
import { unique } from "./unique"
import { zip } from "./zip"

type AEntry = { kind: "a"; value: number }
type BEntry = { kind: "b"; value: string }

/**
 * Declares the A-entry type guard used by type tests.
 *
 * @param value - The value to process.
 */
declare function isAEntry(value: unknown): value is AEntry

const entries = [
  { kind: "a", value: 1 },
  { kind: "b", value: "two" },
  null,
] satisfies Array<AEntry | BEntry | null>

const castArrayPipe = pipe("zippy" as const, castArray())
const castReadonlyArrayPipe = pipe([1, 2] as const, castArray())
declare const maybeCastArrayValue: "zippy" | void
const castMaybePipe = pipe(
  maybeCastArrayValue,
  castArray(),
  map((value) => value),
)

true satisfies IsEqual<typeof castArrayPipe, Array<"zippy">>
true satisfies IsEqual<typeof castReadonlyArrayPipe, readonly [1, 2]>
true satisfies IsEqual<typeof castMaybePipe, Array<"zippy">>

const filterPipe = pipe(
  [1, 2, 3, 4] as const,
  filter((value: 1 | 2 | 3 | 4) => value > 1),
)
const filterGuardPipe = pipe(entries, filter(isAEntry))
const filterOutPipe = pipe(
  [1, 2, 3, 4] as const,
  filterOut((value: 1 | 2 | 3 | 4) => value > 1),
)
const filterOutGuardPipe = pipe(entries, filterOut(isAEntry))
const filterTruthyPipe = pipe(
  [0, 1, "", "zippy", false, true, null, undefined, 0n, 2n] as const,
  filter(isTruthy),
)
const filterNonNullishPipe = pipe(
  [1, null, 2, undefined] as const,
  filter(isNonNullish),
)
const filterDefinedPipe = pipe([1, null, undefined] as const, filter(isDefined))

true satisfies IsEqual<typeof filterPipe, Array<1 | 2 | 3 | 4>>
true satisfies IsEqual<typeof filterGuardPipe, AEntry[]>
true satisfies IsEqual<typeof filterOutPipe, Array<1 | 2 | 3 | 4>>
true satisfies IsEqual<typeof filterOutGuardPipe, Array<BEntry | null>>
true satisfies IsEqual<typeof filterTruthyPipe, Array<1 | "zippy" | true | 2n>>
true satisfies IsEqual<typeof filterNonNullishPipe, Array<1 | 2>>
true satisfies IsEqual<typeof filterDefinedPipe, Array<1 | null>>

const uniquePipe = pipe([1, 2, 1] as const, unique())
const uniqueByPipe = pipe([{ id: 1 }, { id: 2 }, { id: 1 }], unique("id"))
const mapPipe = pipe(
  [1, 2, 3] as const,
  map((value: 1 | 2 | 3) => (value === 1 ? "one" : "other")),
)
const mapPathPipe = pipe([{ id: 1 }, { id: 2 }] as const, map("id"))
const mapAsyncPipe = pipe(
  [1, 2, 3] as const,
  mapAsync(async (value: 1 | 2 | 3) => (value === 1 ? "one" : "other")),
)
const mapAsyncPathPipe = pipe([{ id: 1 }, { id: 2 }] as const, mapAsync("id"))
const mapAsyncOptionsPipe = pipe(
  [1, 2, 3] as const,
  mapAsync(async (value: 1 | 2 | 3) => (value === 1 ? "one" : "other"), {
    concurrency: 2,
  }),
)

true satisfies IsEqual<typeof uniquePipe, Array<1 | 2>>
true satisfies IsEqual<typeof uniqueByPipe, Array<{ id: number }>>
true satisfies IsEqual<typeof mapPipe, Array<"one" | "other">>
true satisfies IsEqual<typeof mapPathPipe, Array<1 | 2>>
true satisfies IsEqual<typeof mapAsyncPipe, Promise<Array<"one" | "other">>>
true satisfies IsEqual<typeof mapAsyncPathPipe, Promise<Array<1 | 2>>>
true satisfies IsEqual<
  typeof mapAsyncOptionsPipe,
  Promise<Array<"one" | "other">>
>

const sumPipe = pipe([1, 2, 3] as const, sum())
const sumByPipe = pipe(
  [{ count: 1 }, { count: 2 }] as const,
  sum((value: { readonly count: number }) => value.count),
)
const sumByPathPipe = pipe([{ count: 1 }, { count: 2 }] as const, sum("count"))
const meanPipe = pipe([1, 2, 3] as const, mean())
const meanByPipe = pipe(
  [{ score: 1 }, { score: 2 }] as const,
  mean((value: { readonly score: number }) => value.score),
)
const meanByPathPipe = pipe([{ score: 1 }, { score: 2 }], mean("score"))
const medianPipe = pipe([1, 2, 3] as const, median())
const medianByPipe = pipe(
  [{ score: 1 }, { score: 2 }] as const,
  median((value: { readonly score: number }) => value.score),
)
const medianByPathPipe = pipe([{ score: 1 }, { score: 2 }], median("score"))
const modePipe = pipe([1, 2, 2] as const, mode())
const modeValues = [
  { kind: "a", score: 1 },
  { kind: "b", score: 2 },
] as const
const modeByPipe = pipe(
  modeValues,
  mode((value: (typeof modeValues)[number]) => value.kind),
)
const modeByPathPipe = pipe(modeValues, mode("kind"))

true satisfies IsEqual<typeof sumPipe, number>
true satisfies IsEqual<typeof sumByPipe, number>
true satisfies IsEqual<typeof sumByPathPipe, number>
true satisfies IsEqual<typeof meanPipe, number | undefined>
true satisfies IsEqual<typeof meanByPipe, number | undefined>
true satisfies IsEqual<typeof meanByPathPipe, number | undefined>
true satisfies IsEqual<typeof medianPipe, number | undefined>
true satisfies IsEqual<typeof medianByPipe, number | undefined>
true satisfies IsEqual<typeof medianByPathPipe, number | undefined>
true satisfies IsEqual<typeof modePipe, 1 | 2 | undefined>
true satisfies IsEqual<
  typeof modeByPipe,
  (typeof modeValues)[number] | undefined
>
true satisfies IsEqual<
  typeof modeByPathPipe,
  (typeof modeValues)[number] | undefined
>

const mapValuesPipe = pipe(
  { a: 1, b: 2 } as const,
  mapValues((value: 1 | 2) => (value === 1 ? "one" : "other")),
)
const mapValuesPathPipe = pipe(
  {
    first: { id: 1, profile: { name: "Ada" } },
    second: { id: 2, profile: { name: "Linus" } },
  } as const,
  mapValues("profile.name"),
)
const mapValuesAsyncPipe = pipe(
  { a: 1, b: 2 } as const,
  mapValuesAsync(async (value: 1 | 2) => (value === 1 ? "one" : "other")),
)
const mapValuesAsyncPathPipe = pipe(
  {
    first: { id: 1, profile: { name: "Ada" } },
    second: { id: 2, profile: { name: "Linus" } },
  } as const,
  mapValuesAsync("profile.name"),
)
const mapValuesAsyncOptionsPipe = pipe(
  { a: 1, b: 2 } as const,
  mapValuesAsync(async (value: 1 | 2) => (value === 1 ? "one" : "other"), {
    concurrency: 2,
  }),
)
const mapKeysPipe = pipe(
  { a: 1, b: 2 } as const,
  mapKeys((_value: 1 | 2, key) => (key === "a" ? "first" : "other")),
)
const mapKeysPathPipe = pipe(
  {
    first: { id: "user-1", profile: { name: "Ada" } },
    second: { id: "user-2", profile: { name: "Linus" } },
  } as const,
  mapKeys("id"),
)
const mapKeysAsyncPipe = pipe(
  { a: 1, b: 2 } as const,
  mapKeysAsync(async (_value: 1 | 2, key) => (key === "a" ? "first" : "other")),
)
const mapKeysAsyncPathPipe = pipe(
  {
    first: { id: "user-1", profile: { name: "Ada" } },
    second: { id: "user-2", profile: { name: "Linus" } },
  } as const,
  mapKeysAsync("id"),
)
const mapKeysAsyncOptionsPipe = pipe(
  { a: 1, b: 2 } as const,
  mapKeysAsync(
    async (_value: 1 | 2, key) => (key === "a" ? "first" : "other"),
    { concurrency: 2 },
  ),
)
const mapEntriesPipe = pipe(
  { a: 1, b: 2 } as const,
  mapEntries(
    ([key, value]: readonly [string, 1 | 2]) =>
      [key === "a" ? "first" : "other", value === 1 ? "one" : "other"] as const,
  ),
)
const mapEntriesAsyncPipe = pipe(
  { a: 1, b: 2 } as const,
  mapEntriesAsync(
    async ([key, value]: readonly [string, 1 | 2]) =>
      [key === "a" ? "first" : "other", value === 1 ? "one" : "other"] as const,
  ),
)
const mapEntriesAsyncOptionsPipe = pipe(
  { a: 1, b: 2 } as const,
  mapEntriesAsync(
    async ([key, value]: readonly [string, 1 | 2]) =>
      [key === "a" ? "first" : "other", value === 1 ? "one" : "other"] as const,
    { concurrency: 2 },
  ),
)
const mergePipe = pipe({ a: 1, b: "left" }, merge({ b: 2, c: true }))
const deepMergePipe = pipe(
  { config: { retries: 1, flags: { debug: false } }, enabled: true },
  deepMerge({ config: { timeout: 100, flags: { trace: true } } }),
)

true satisfies IsEqual<typeof mapValuesPipe, Record<string, "one" | "other">>
true satisfies IsEqual<
  typeof mapValuesPathPipe,
  Record<string, "Ada" | "Linus">
>
true satisfies IsEqual<
  typeof mapValuesAsyncPipe,
  Promise<Record<string, "one" | "other">>
>
true satisfies IsEqual<
  typeof mapValuesAsyncPathPipe,
  Promise<Record<string, "Ada" | "Linus">>
>
true satisfies IsEqual<
  typeof mapValuesAsyncOptionsPipe,
  Promise<Record<string, "one" | "other">>
>
true satisfies IsEqual<typeof mapKeysPipe, Record<"first" | "other", 1 | 2>>
true satisfies IsEqual<
  typeof mapKeysPathPipe,
  Record<
    "user-1" | "user-2",
    | { readonly id: "user-1"; readonly profile: { readonly name: "Ada" } }
    | { readonly id: "user-2"; readonly profile: { readonly name: "Linus" } }
  >
>
true satisfies IsEqual<
  typeof mapKeysAsyncPipe,
  Promise<Record<"first" | "other", 1 | 2>>
>
true satisfies IsEqual<
  typeof mapKeysAsyncPathPipe,
  Promise<
    Record<
      "user-1" | "user-2",
      | { readonly id: "user-1"; readonly profile: { readonly name: "Ada" } }
      | { readonly id: "user-2"; readonly profile: { readonly name: "Linus" } }
    >
  >
>
true satisfies IsEqual<
  typeof mapKeysAsyncOptionsPipe,
  Promise<Record<"first" | "other", 1 | 2>>
>
true satisfies IsEqual<
  typeof mapEntriesPipe,
  Record<"first" | "other", "one" | "other">
>
true satisfies IsEqual<
  typeof mapEntriesAsyncPipe,
  Promise<Record<"first" | "other", "one" | "other">>
>
true satisfies IsEqual<
  typeof mapEntriesAsyncOptionsPipe,
  Promise<Record<"first" | "other", "one" | "other">>
>
true satisfies IsEqual<typeof mergePipe, { a: number; b: number; c: boolean }>
true satisfies IsEqual<
  typeof deepMergePipe,
  {
    config: {
      retries: number
      timeout: number
      flags: { debug: boolean; trace: boolean }
    }
    enabled: boolean
  }
>

const zipPipe = pipe(["a", "b"] as const, zip([1, 2] as const))
const zipMergerPipe = pipe(
  ["a", "b"] as const,
  zip([1, 2] as const, (leftValue: "a" | "b", rightValue) =>
    leftValue === "a" && rightValue === 1 ? "first" : "other",
  ),
)
const matchPipe = pipe(
  ["a", "b"] as const,
  match(
    ["b", "a"] as const,
    (leftValue: "a" | "b", rightValue) => leftValue === rightValue,
  ),
)
const matchMatcherPipe = pipe(
  ["a", "b"] as const,
  match(
    [1, 2] as const,
    (leftValue: "a" | "b", rightValue) => leftValue === "a" && rightValue === 1,
  ),
)
const matchPathMatcherPipe = pipe(
  [{ id: "a" }, { id: "b" }],
  match([{ id: "b" }, { id: "a" }], "id"),
)
const matchDotPathPipe = pipe(
  [{ user: { id: "a" } }, { user: { id: "b" } }] as const,
  match([{ user: { id: "b" } }, { user: { id: "a" } }] as const, "user.id"),
)
const matchMergePipe = pipe(
  [{ id: "a", label: "A" }],
  matchMerge([{ id: "a", count: 1 }], "id"),
)

true satisfies IsEqual<typeof zipPipe, Array<["a" | "b", 1 | 2]>>
true satisfies IsEqual<typeof zipMergerPipe, Array<"first" | "other">>
true satisfies IsEqual<typeof matchPipe, Array<["a" | "b", "a" | "b"]>>
true satisfies IsEqual<typeof matchMatcherPipe, Array<["a" | "b", 1 | 2]>>
true satisfies IsEqual<
  typeof matchPathMatcherPipe,
  Array<[{ id: string }, { id: string }]>
>
true satisfies IsEqual<
  typeof matchDotPathPipe,
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
  typeof matchMergePipe,
  Array<{ id: string; label: string; count: number }>
>

const castArrayInferencePipe = pipe("zippy" as const, castArray())
const filterInferencePipe = pipe(
  [1, 2, 3] as const,
  filter((value: 1 | 2 | 3) => value > 1),
)
const filterGuardInferencePipe = pipe(entries, filter(isAEntry))
const filterOutInferencePipe = pipe(
  [1, 2, 3] as const,
  filterOut((value: 1 | 2 | 3) => value > 1),
)
const filterOutGuardInferencePipe = pipe(entries, filterOut(isAEntry))
const filterTruthyInferencePipe = pipe(
  [0, 1, "", "zippy", false, true, null, undefined, 0n, 2n] as const,
  filter(isTruthy),
)
const filterNonNullishInferencePipe = pipe(
  [1, null, 2, undefined] as const,
  filter(isNonNullish),
)
const filterDefinedInferencePipe = pipe(
  [1, null, undefined] as const,
  filter(isDefined),
)
const uniqueInferencePipe = pipe([1, 2, 1] as const, unique())
const uniqueByInferencePipe = pipe(
  [{ id: 1 }, { id: 2 }, { id: 1 }],
  unique("id"),
)
const mapInferencePipe = pipe(
  [1, 2, 3] as const,
  map((value) => (value === 1 ? "one" : "other")),
)
const mapPathInferencePipe = pipe([{ id: 1 }, { id: 2 }], map("id"))
const mapAsyncInferencePipe = pipe(
  [1, 2, 3] as const,
  mapAsync(async (value) => (value === 1 ? "one" : "other")),
)
const mapAsyncPathInferencePipe = pipe([{ id: 1 }, { id: 2 }], mapAsync("id"))
const sumInferencePipe = pipe([1, 2, 3] as const, sum())
const sumByInferencePipe = pipe(
  [{ count: 1 }, { count: 2 }] as const,
  sum((value) => value.count),
)
const sumByPathInferencePipe = pipe([{ hello: 5 }], sum("hello"))
const meanInferencePipe = pipe([1, 2, 3] as const, mean())
const meanByInferencePipe = pipe(
  [{ score: 1 }, { score: 2 }] as const,
  mean((value) => value.score),
)
const meanByPathInferencePipe = pipe(
  [{ score: 1 }, { score: 2 }],
  mean("score"),
)
const medianInferencePipe = pipe([1, 2, 3] as const, median())
const medianByInferencePipe = pipe(
  [{ score: 1 }, { score: 2 }] as const,
  median((value) => value.score),
)
const medianByPathInferencePipe = pipe(
  [{ score: 1 }, { score: 2 }],
  median("score"),
)
const modeInferencePipe = pipe([1, 2, 2] as const, mode())
const modeByInferencePipe = pipe(
  modeValues,
  mode((value) => value.kind),
)
const modeByPathInferencePipe = pipe(modeValues, mode("kind"))
const mapValuesInferencePipe = pipe(
  { a: 1, b: 2 } as const,
  mapValues((value) => (value === 1 ? "one" : "other")),
)
const mapValuesPathInferencePipe = pipe(
  {
    first: { id: 1, profile: { name: "Ada" } },
    second: { id: 2, profile: { name: "Linus" } },
  },
  mapValues("profile.name"),
)
const mapValuesAsyncInferencePipe = pipe(
  { a: 1, b: 2 } as const,
  mapValuesAsync(async (value) => (value === 1 ? "one" : "other")),
)
const mapValuesAsyncPathInferencePipe = pipe(
  {
    first: { id: 1, profile: { name: "Ada" } },
    second: { id: 2, profile: { name: "Linus" } },
  },
  mapValuesAsync("profile.name"),
)
const mapKeysInferencePipe = pipe(
  { a: 1, b: 2 } as const,
  mapKeys((_value, key) => (key === "a" ? "first" : "other")),
)

/**
 * Named fixture for reusable-value inference checks involving
 * mapKeysPathInferenceValues.
 */
const mapKeysPathInferenceValues = {
  first: { id: "user-1", profile: { name: "Ada" } },
  second: { id: "user-2", profile: { name: "Linus" } },
}
type MapKeysPathInferenceValue =
  (typeof mapKeysPathInferenceValues)[keyof typeof mapKeysPathInferenceValues]
const mapKeysPathInferencePipe = pipe(mapKeysPathInferenceValues, mapKeys("id"))
const mapKeysAsyncInferencePipe = pipe(
  { a: 1, b: 2 } as const,
  mapKeysAsync(async (_value, key) => (key === "a" ? "first" : "other")),
)
const mapKeysAsyncPathInferencePipe = pipe(
  mapKeysPathInferenceValues,
  mapKeysAsync("id"),
)
const mapEntriesInferencePipe = pipe(
  { a: 1, b: 2 } as const,
  mapEntries(
    ([key, value]) =>
      [key === "a" ? "first" : "other", value === 1 ? "one" : "other"] as const,
  ),
)
const mapEntriesAsyncInferencePipe = pipe(
  { a: 1, b: 2 } as const,
  mapEntriesAsync(
    async ([key, value]) =>
      [key === "a" ? "first" : "other", value === 1 ? "one" : "other"] as const,
  ),
)
const mergeInferencePipe = pipe({ a: 1, b: "left" }, merge({ b: 2, c: true }))
const deepMergeInferencePipe = pipe(
  { config: { retries: 1, flags: { debug: false } }, enabled: true },
  deepMerge({ config: { timeout: 100, flags: { trace: true } } }),
)
const zipInferencePipe = pipe(["a", "b"] as const, zip([1, 2] as const))
const zipMergerInferencePipe = pipe(
  ["a", "b"] as const,
  zip([1, 2] as const, (leftValue, rightValue) =>
    leftValue === "a" && rightValue === 1 ? "first" : "other",
  ),
)
const matchInferencePipe = pipe(
  [{ id: "a" }, { id: "b" }],
  match([{ id: "b" }, { id: "a" }], "id"),
)
const matchMatcherInferencePipe = pipe(
  ["a", "b"] as const,
  match(
    [1, 2] as const,
    (leftValue: "a" | "b", rightValue) => leftValue === "a" && rightValue === 1,
  ),
)
const matchPathMatcherInferencePipe = pipe(
  [{ id: "a" }, { id: "b" }],
  match([{ id: "b" }, { id: "a" }], "id"),
)
const matchDotPathInferencePipe = pipe(
  [{ user: { id: "a" } }, { user: { id: "b" } }] as const,
  match([{ user: { id: "b" } }, { user: { id: "a" } }] as const, "user.id"),
)
const matchMergeInferencePipe = pipe(
  [{ id: "a", label: "A" }],
  matchMerge([{ id: "a", count: 1 }], "id"),
)

true satisfies IsEqual<typeof castArrayInferencePipe, Array<"zippy">>
true satisfies IsEqual<typeof filterInferencePipe, Array<1 | 2 | 3>>
true satisfies IsEqual<typeof filterGuardInferencePipe, AEntry[]>
true satisfies IsEqual<typeof filterOutInferencePipe, Array<1 | 2 | 3>>
true satisfies IsEqual<typeof filterOutGuardInferencePipe, Array<BEntry | null>>
true satisfies IsEqual<
  typeof filterTruthyInferencePipe,
  Array<1 | "zippy" | true | 2n>
>
true satisfies IsEqual<typeof filterNonNullishInferencePipe, Array<1 | 2>>
true satisfies IsEqual<typeof filterDefinedInferencePipe, Array<1 | null>>
true satisfies IsEqual<typeof uniqueInferencePipe, Array<1 | 2>>
true satisfies IsEqual<typeof uniqueByInferencePipe, Array<{ id: number }>>
true satisfies IsEqual<typeof mapInferencePipe, Array<"one" | "other">>
true satisfies IsEqual<typeof mapPathInferencePipe, number[]>
true satisfies IsEqual<
  typeof mapAsyncInferencePipe,
  Promise<Array<"one" | "other">>
>
true satisfies IsEqual<typeof mapAsyncPathInferencePipe, Promise<number[]>>
true satisfies IsEqual<typeof sumInferencePipe, number>
true satisfies IsEqual<typeof sumByInferencePipe, number>
true satisfies IsEqual<typeof sumByPathInferencePipe, number>
true satisfies IsEqual<typeof meanInferencePipe, number | undefined>
true satisfies IsEqual<typeof meanByInferencePipe, number | undefined>
true satisfies IsEqual<typeof meanByPathInferencePipe, number | undefined>
true satisfies IsEqual<typeof medianInferencePipe, number | undefined>
true satisfies IsEqual<typeof medianByInferencePipe, number | undefined>
true satisfies IsEqual<typeof medianByPathInferencePipe, number | undefined>
true satisfies IsEqual<typeof modeInferencePipe, 1 | 2 | undefined>
true satisfies IsEqual<
  typeof modeByInferencePipe,
  (typeof modeValues)[number] | undefined
>
true satisfies IsEqual<
  typeof modeByPathInferencePipe,
  (typeof modeValues)[number] | undefined
>
true satisfies IsEqual<
  typeof mapValuesInferencePipe,
  Record<string, "one" | "other">
>
true satisfies IsEqual<
  typeof mapValuesPathInferencePipe,
  Record<string, string>
>
true satisfies IsEqual<
  typeof mapValuesAsyncInferencePipe,
  Promise<Record<string, "one" | "other">>
>
true satisfies IsEqual<
  typeof mapValuesAsyncPathInferencePipe,
  Promise<Record<string, string>>
>
true satisfies IsEqual<
  typeof mapKeysInferencePipe,
  Record<"first" | "other", 1 | 2>
>
true satisfies IsEqual<
  typeof mapKeysPathInferencePipe,
  Record<string, MapKeysPathInferenceValue>
>
true satisfies IsEqual<
  typeof mapKeysAsyncInferencePipe,
  Promise<Record<"first" | "other", 1 | 2>>
>
true satisfies IsEqual<
  typeof mapKeysAsyncPathInferencePipe,
  Promise<Record<string, MapKeysPathInferenceValue>>
>
true satisfies IsEqual<
  typeof mapEntriesInferencePipe,
  Record<"first" | "other", "one" | "other">
>
true satisfies IsEqual<
  typeof mapEntriesAsyncInferencePipe,
  Promise<Record<"first" | "other", "one" | "other">>
>
true satisfies IsEqual<
  typeof mergeInferencePipe,
  { a: number; b: number; c: boolean }
>
true satisfies IsEqual<
  typeof deepMergeInferencePipe,
  {
    config: {
      retries: number
      timeout: number
      flags: { debug: boolean; trace: boolean }
    }
    enabled: boolean
  }
>
true satisfies IsEqual<typeof zipInferencePipe, Array<["a" | "b", 1 | 2]>>
true satisfies IsEqual<typeof zipMergerInferencePipe, Array<"first" | "other">>
true satisfies IsEqual<
  typeof matchInferencePipe,
  Array<[{ id: string }, { id: string }]>
>
true satisfies IsEqual<
  typeof matchMatcherInferencePipe,
  Array<["a" | "b", 1 | 2]>
>
true satisfies IsEqual<
  typeof matchPathMatcherInferencePipe,
  Array<[{ id: string }, { id: string }]>
>
true satisfies IsEqual<
  typeof matchDotPathInferencePipe,
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
  typeof matchMergeInferencePipe,
  Array<{ id: string; label: string; count: number }>
>
