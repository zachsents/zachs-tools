// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { mode } from "./mode"

const modeDataFirst = mode([1, 2, 2] as const)
const modeDataLast = mode()([1, 2, 2] as const)
const modeIterableDataFirst = mode(new Set([1, 2] as const))
const modeIterableDataLast = mode()(new Set([1, 2] as const))

true satisfies IsEqual<typeof modeDataFirst, 1 | 2 | undefined>
true satisfies IsEqual<typeof modeDataLast, 1 | 2 | undefined>
true satisfies IsEqual<typeof modeIterableDataFirst, 1 | 2 | undefined>
true satisfies IsEqual<typeof modeIterableDataLast, 1 | 2 | undefined>

const values = [
  { kind: "a", score: 1 },
  { kind: "b", score: 2 },
] as const

const modeByDataFirst = mode(values, (value) => value.kind)
const modeByDataLast = mode((value: (typeof values)[number]) => value.kind)(
  values,
)

/**
 * Named fixture for reusable-value inference checks involving
 * modeAnnotatedSelectorValuesWithExtraProperties.
 */
const modeAnnotatedSelectorValuesWithExtraProperties = [
  { kind: "a", label: "one" },
  { kind: "b", label: "two" },
] as const
const modeByDataLastWithAnnotatedSelectorVariable = mode(
  (value: { readonly kind: string }) => value.kind,
)(modeAnnotatedSelectorValuesWithExtraProperties)
const modeByDataLastWithAnnotatedSelectorInline = mode(
  (value: { readonly kind: string }) => value.kind,
)([
  { kind: "a", label: "one" },
  { kind: "b", label: "two" },
] as const)
const modeByPathDataFirst = mode(values, "kind")
const modeByDotPathDataFirst = mode(
  [
    { meta: { kind: "a" }, score: 1 },
    { meta: { kind: "b" }, score: 2 },
  ] as const,
  "meta.kind",
)
const modeByPathDataLast = mode("kind")(values)
const modeByPathIterableDataLast = mode("kind")(new Set(values))
const modeByDotPathDataLast = mode("meta.kind")([
  { meta: { kind: "a" }, score: 1 },
  { meta: { kind: "b" }, score: 2 },
] as const)
const modeByTypedPathDataLast = mode<{
  readonly kind: string
  readonly score: number
}>("kind")([{ kind: "a", score: 1 }])

true satisfies IsEqual<
  typeof modeByDataFirst,
  (typeof values)[number] | undefined
>
true satisfies IsEqual<
  typeof modeByDataLast,
  (typeof values)[number] | undefined
>
true satisfies IsEqual<
  typeof modeByDataLastWithAnnotatedSelectorVariable,
  (typeof modeAnnotatedSelectorValuesWithExtraProperties)[number] | undefined
>
true satisfies IsEqual<
  typeof modeByDataLastWithAnnotatedSelectorInline,
  | { readonly kind: "a"; readonly label: "one" }
  | { readonly kind: "b"; readonly label: "two" }
  | undefined
>
true satisfies IsEqual<
  typeof modeByPathDataFirst,
  (typeof values)[number] | undefined
>
true satisfies IsEqual<
  typeof modeByDotPathDataFirst,
  | { readonly meta: { readonly kind: "a" }; readonly score: 1 }
  | { readonly meta: { readonly kind: "b" }; readonly score: 2 }
  | undefined
>
true satisfies IsEqual<
  typeof modeByPathDataLast,
  (typeof values)[number] | undefined
>
true satisfies IsEqual<
  typeof modeByPathIterableDataLast,
  (typeof values)[number] | undefined
>
true satisfies IsEqual<
  typeof modeByDotPathDataLast,
  | { readonly meta: { readonly kind: "a" }; readonly score: 1 }
  | { readonly meta: { readonly kind: "b" }; readonly score: 2 }
  | undefined
>
true satisfies IsEqual<
  typeof modeByTypedPathDataLast,
  { readonly kind: string; readonly score: number } | undefined
>

// @ts-expect-error string selectors must exist on the value type.
mode(values, "missing")

// @ts-expect-error data-last string selectors are checked once values are provided.
mode("missing")(values)

// @ts-expect-error primitive strings are selectors, not iterable values.
const _primitiveStringMode: string | undefined = mode("kind")

// @ts-expect-error explicit data-last string selectors must exist on the value type.
mode<{ readonly kind: string }>("missing")
