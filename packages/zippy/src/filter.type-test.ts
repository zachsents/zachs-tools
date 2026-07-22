// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { filter, filterOut } from "./filter"
import { isDefined, isNonNullish, isTruthy, propIsTruthy } from "./guards"
import { pipe } from "./pipe"

type AEntry = { kind: "a"; value: number }
type BEntry = { kind: "b"; value: string }
type User = {
  email?: string | null
  profile?: { name?: string | null } | null
}

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

const filterDataFirst = filter([1, 2, 3, 4] as const, (value) => value > 1)
const filterDataLast = filter((value: 1 | 2 | 3 | 4) => value > 1)([
  1, 2, 3, 4,
] as const)
const filterByCountDataLast = filter(
  (value: { readonly count: number }) => value.count > 1,
)([{ count: 1 }, { count: 2 }] as const)

/**
 * Named fixture for reusable-value inference checks involving
 * annotatedPredicateValuesWithExtraProperties.
 */
const annotatedPredicateValuesWithExtraProperties = [
  { count: 1, label: "one" },
] as const
const filterDataLastWithAnnotatedPredicateVariable = filter(
  (value: { readonly count: number }) => value.count > 1,
)(annotatedPredicateValuesWithExtraProperties)
const filterDataLastWithAnnotatedPredicateInline = filter(
  (value: { readonly count: number }) => value.count > 1,
)([{ count: 1, label: "one" }] as const)
const filterGuardDataFirst = filter(entries, isAEntry)
const filterGuardDataLast = filter(isAEntry)(entries)
const filterIterableDataFirst = filter(
  new Set([1, 2, 3, 4] as const),
  (value) => value > 1,
)
const filterIterableDataLast = filter((value: 1 | 2 | 3 | 4) => value > 1)(
  new Set([1, 2, 3, 4] as const),
)

true satisfies IsEqual<typeof filterDataFirst, Array<1 | 2 | 3 | 4>>
true satisfies IsEqual<typeof filterDataLast, Array<1 | 2 | 3 | 4>>
true satisfies IsEqual<
  typeof filterByCountDataLast,
  Array<{ readonly count: 1 } | { readonly count: 2 }>
>
true satisfies IsEqual<
  typeof filterDataLastWithAnnotatedPredicateVariable,
  Array<{ readonly count: 1; readonly label: "one" }>
>
true satisfies IsEqual<
  typeof filterDataLastWithAnnotatedPredicateInline,
  Array<{ readonly count: 1; readonly label: "one" }>
>
true satisfies IsEqual<typeof filterGuardDataFirst, AEntry[]>
true satisfies IsEqual<typeof filterGuardDataLast, AEntry[]>
true satisfies IsEqual<typeof filterIterableDataFirst, Array<1 | 2 | 3 | 4>>
true satisfies IsEqual<typeof filterIterableDataLast, Array<1 | 2 | 3 | 4>>

// @ts-expect-error data-last predicate values must satisfy the predicate parameter.
filter((value: { readonly count: number }) => value.count > 1)([
  { label: "one" },
] as const)

const values = [
  0,
  1,
  "",
  "zippy",
  false,
  true,
  null,
  undefined,
  0n,
  2n,
] as const

const truthyDataFirst = filter(values, isTruthy)
const truthyDataLast = filter(isTruthy)(values)

true satisfies IsEqual<typeof truthyDataFirst, Array<1 | "zippy" | true | 2n>>
// Known gap: standalone curried generic guards would require TypeScript to
// preserve and later apply the guard's generic narrowing function, such as
// `T -> Truthy<T>`, to the later values type. That higher-kinded operation is
// not currently expressible, so data-first and contextual pipe forms are the
// supported exact narrowings. See microsoft/TypeScript#22617.
// @ts-expect-error standalone curried generic guards cannot re-apply narrowing.
true satisfies IsEqual<typeof truthyDataLast, Array<1 | "zippy" | true | 2n>>

const presentDataFirst = filter([1, null, 2, undefined] as const, isNonNullish)
const presentDataLast = filter(isNonNullish)([1, null, 2, undefined] as const)

true satisfies IsEqual<typeof presentDataFirst, Array<1 | 2>>
true satisfies IsEqual<typeof presentDataLast, Array<1 | 2>>

declare const voidValue: void

const definedDataFirst = filter(
  [1, null, undefined, voidValue] as const,
  isDefined,
)
const definedDataLast = filter(isDefined)([
  1,
  null,
  undefined,
  voidValue,
] as const)

true satisfies IsEqual<typeof definedDataFirst, Array<1 | null>>
// @ts-expect-error standalone curried generic guards cannot re-apply narrowing.
true satisfies IsEqual<typeof definedDataLast, Array<1 | null>>

const users = [] as User[]

/** Named fixture for reusable-value inference checks involving usersWithEmail. */
const usersWithEmail = filter(users, propIsTruthy("email"))

/**
 * Named fixture for reusable-value inference checks involving
 * usersWithEmailDataLast.
 */
const usersWithEmailDataLast = filter(propIsTruthy("email"))(users)

/**
 * Named fixture for reusable-value inference checks involving
 * usersWithProfileName.
 */
const usersWithProfileName = filter(users, propIsTruthy("profile.name"))
const selectorPredicate = filter((value: User) => value.email)(users)

usersWithEmail[0]!.email satisfies string
// @ts-expect-error standalone curried generic guards cannot re-apply narrowing.
usersWithEmailDataLast[0]!.email satisfies string
usersWithProfileName[0]!.profile.name satisfies string
true satisfies IsEqual<typeof selectorPredicate, User[]>

const truthyPiped = pipe(values, filter(isTruthy))
const presentPiped = pipe(
  [1, null, 2, undefined] as const,
  filter(isNonNullish),
)
const definedPiped = pipe(
  [1, null, undefined, voidValue] as const,
  filter(isDefined),
)

/**
 * Named fixture for reusable-value inference checks involving
 * usersWithEmailPiped.
 */
const usersWithEmailPiped = pipe(users, filter(propIsTruthy("email")))

true satisfies IsEqual<typeof truthyPiped, Array<1 | "zippy" | true | 2n>>
true satisfies IsEqual<typeof presentPiped, Array<1 | 2>>
true satisfies IsEqual<typeof definedPiped, Array<1 | null>>
usersWithEmailPiped[0]!.email satisfies string

const filterOutDataFirst = filterOut(
  [1, 2, 3, 4] as const,
  (value) => value > 1,
)
const filterOutDataLast = filterOut((value: 1 | 2 | 3 | 4) => value > 1)([
  1, 2, 3, 4,
] as const)
const filterOutByCountDataLast = filterOut(
  (value: { readonly count: number }) => value.count > 1,
)([{ count: 1 }, { count: 2 }] as const)
const filterOutDataLastWithAnnotatedPredicateVariable = filterOut(
  (value: { readonly count: number }) => value.count > 1,
)(annotatedPredicateValuesWithExtraProperties)
const filterOutDataLastWithAnnotatedPredicateInline = filterOut(
  (value: { readonly count: number }) => value.count > 1,
)([{ count: 1, label: "one" }] as const)
const filterOutGuardDataFirst = filterOut(entries, isAEntry)
const filterOutGuardDataLast = filterOut(isAEntry)(entries)
const filterOutIterableDataFirst = filterOut(
  new Set([1, 2, 3, 4] as const),
  (value) => value > 1,
)
const filterOutIterableDataLast = filterOut(
  (value: 1 | 2 | 3 | 4) => value > 1,
)(new Set([1, 2, 3, 4] as const))

true satisfies IsEqual<typeof filterOutDataFirst, Array<1 | 2 | 3 | 4>>
true satisfies IsEqual<typeof filterOutDataLast, Array<1 | 2 | 3 | 4>>
true satisfies IsEqual<
  typeof filterOutByCountDataLast,
  Array<{ readonly count: 1 } | { readonly count: 2 }>
>
true satisfies IsEqual<
  typeof filterOutDataLastWithAnnotatedPredicateVariable,
  Array<{ readonly count: 1; readonly label: "one" }>
>
true satisfies IsEqual<
  typeof filterOutDataLastWithAnnotatedPredicateInline,
  Array<{ readonly count: 1; readonly label: "one" }>
>
true satisfies IsEqual<typeof filterOutGuardDataFirst, Array<BEntry | null>>
true satisfies IsEqual<typeof filterOutGuardDataLast, Array<BEntry | null>>
true satisfies IsEqual<typeof filterOutIterableDataFirst, Array<1 | 2 | 3 | 4>>
true satisfies IsEqual<typeof filterOutIterableDataLast, Array<1 | 2 | 3 | 4>>

// @ts-expect-error data-last predicate values must satisfy the predicate parameter.
filterOut((value: { readonly count: number }) => value.count > 1)([
  { label: "one" },
] as const)

const falsyDataFirst = filterOut(values, isTruthy)
const falsyDataLast = filterOut(isTruthy)(values)

true satisfies IsEqual<
  typeof falsyDataFirst,
  Array<0 | "" | false | null | undefined | 0n>
>
// @ts-expect-error standalone curried generic guards cannot re-apply narrowing.
true satisfies IsEqual<
  typeof falsyDataLast,
  Array<0 | "" | false | null | undefined | 0n>
>

const falsyPiped = pipe(values, filterOut(isTruthy))

true satisfies IsEqual<
  typeof falsyPiped,
  Array<0 | "" | false | null | undefined | 0n>
>

// @ts-expect-error filterOut no longer accepts property paths directly.
filterOut("email")(users)
