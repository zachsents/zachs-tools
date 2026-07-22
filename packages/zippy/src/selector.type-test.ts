// This file is typechecked only and will never actually run.
import type { Get } from "type-fest"
import type { IsEqual } from "type-fest"
import type {
  MatchingPath,
  MatchingPathValue,
  PathSatisfier,
  SelectorPath,
  Selector,
} from "./selector"

type Metric = {
  readonly count: number
  readonly label: string
  readonly stats: {
    readonly score: number
    readonly name: string
    readonly optionalScore?: number
  }
  readonly optionalStats?: {
    readonly score: number
  }
}

const rootPath = "count" satisfies SelectorPath<Metric>
const dotPath = "stats.score" satisfies SelectorPath<Metric>
const numberRootPath = "count" satisfies SelectorPath<Metric, number>
const numberDotPath = "stats.score" satisfies SelectorPath<Metric, number>
const functionSelector = ((value: Metric) => value.count) satisfies Selector<
  Metric,
  number
>
const pathSelector = "stats.score" satisfies Selector<Metric, number>

true satisfies IsEqual<typeof rootPath, "count">
true satisfies IsEqual<typeof dotPath, "stats.score">
true satisfies IsEqual<typeof numberRootPath, "count">
true satisfies IsEqual<typeof numberDotPath, "stats.score">
true satisfies IsEqual<SelectorPath<Metric, number>, "count" | "stats.score">
true satisfies IsEqual<Get<Metric, "stats.score">, number>
true satisfies IsEqual<
  PathSatisfier<"stats.score", number>,
  { stats: { score: number } }
>
true satisfies IsEqual<typeof functionSelector, (value: Metric) => number>
true satisfies IsEqual<typeof pathSelector, "stats.score">

type LiteralLeft = {
  readonly id: 1
  readonly enabled: true
  readonly nested: {
    readonly code: "left"
  }
  readonly object: {
    readonly value: 1
  }
}

true satisfies IsEqual<MatchingPathValue<LiteralLeft, "id">, number>
true satisfies IsEqual<
  MatchingPathValue<LiteralLeft, "object">,
  { readonly value: 1 }
>
true satisfies IsEqual<
  MatchingPath<
    LiteralLeft,
    {
      readonly id: 2
      readonly enabled: false
      readonly nested: { readonly code: "right" }
      readonly object: { readonly value: 2 }
    }
  >,
  "id" | "enabled" | "nested.code" | "object.value"
>
true satisfies IsEqual<
  MatchingPath<
    LiteralLeft,
    {
      readonly id: "two"
      readonly enabled: "false"
      readonly nested: { readonly code: 2 }
      readonly object: { readonly value: "two" }
    }
  >,
  never
>
true satisfies IsEqual<
  MatchingPath<{ readonly object: { readonly value: 1 } }, LiteralLeft>,
  "object" | "object.value"
>

// @ts-expect-error string paths must exist on the selected value.
"missing" satisfies SelectorPath<Metric>

// @ts-expect-error selected paths must resolve to the requested value type.
"label" satisfies SelectorPath<Metric, number>

// @ts-expect-error optional paths are not valid number selectors.
"stats.optionalScore" satisfies SelectorPath<Metric, number>

// @ts-expect-error optional parent paths are not valid number selectors.
"optionalStats.score" satisfies SelectorPath<Metric, number>

// @ts-expect-error path selectors are value-type checked.
"stats.name" satisfies Selector<Metric, number>
