import type {
  Get,
  If,
  IsEqual,
  IsLiteral,
  IsUnknown,
  LiteralToPrimitive,
  Paths,
} from "type-fest"

export type SelectorFunction<T, Selected = unknown> = (
  value: T,
  index: number,
  values: readonly T[],
) => Selected

export type SelectorPath<T, Selected = unknown> = Extract<
  keyof {
    [K in Extract<Paths<T, { bracketNotation: false }>, string> as Get<
      T,
      K
    > extends Selected
      ? K
      : never]: never
  },
  string
>

export type Selector<T, Selected = unknown> =
  | SelectorFunction<T, Selected>
  | SelectorPath<T, Selected>

export type MatchingPathValue<T, Path extends string> =
  IsLiteral<Get<T, Path>> extends true
    ? LiteralToPrimitive<Get<T, Path>>
    : Get<T, Path>

export type MatchingPath<Left, Right> = Extract<
  keyof {
    [K in Extract<SelectorPath<Left>, SelectorPath<Right>> as IsEqual<
      MatchingPathValue<Left, K>,
      MatchingPathValue<Right, K>
    > extends true
      ? K
      : never]: never
  },
  string
>

export type PathSatisfier<
  Path extends string = string,
  Value = unknown,
> = Path extends `${infer Key}.${infer Rest}`
  ? { [K in Key]: PathSatisfier<Rest, Value> }
  : { [K in Path]: Value }

/**
 * Checks whether a value can contain keyed properties.
 *
 * @param value - The value to process.
 */
function isPropertyContainer(
  value: unknown,
): value is { readonly [key: string]: unknown } {
  return (
    (typeof value === "object" && value !== null) || typeof value === "function"
  )
}

/**
 * Reads a nested property path from a value.
 *
 * @example
 *   getPropertyPathValue({ profile: { name: "Ada" } }, "profile.name") // "Ada"
 *
 * @param value - The value to process.
 * @param path - The property path.
 */
export function getPropertyPathValue<T, Path extends SelectorPath<T>>(
  value: T,
  path: Path,
): Get<T, Path>

/**
 * Reads a nested property path from a value.
 *
 * @example
 *   getPropertyPathValue({ profile: { name: "Ada" } }, "profile.name") // "Ada"
 *
 * @param value - The value to process.
 * @param path - The property path.
 */
export function getPropertyPathValue<T>(
  value: T,
  path: string,
): If<IsUnknown<T>, unknown, Get<T, SelectorPath<T>> | undefined>
export function getPropertyPathValue(value: unknown, path: string) {
  return path
    .split(".")
    .reduce(
      (acc, key) => (isPropertyContainer(acc) ? acc[key] : undefined),
      value,
    )
}
