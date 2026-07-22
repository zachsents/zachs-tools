import type { ArrayElement, If, IsNever, UnknownArray } from "type-fest"

type CastArrayResult<T> = [Exclude<T, void>] extends [infer E]
  ? If<
      IsNever<E>,
      [],
      [E] extends [UnknownArray]
        ? E
        : Array<E extends UnknownArray ? ArrayElement<E> : E>
    >
  : never

/**
 * Returns the value wrapped in an array when needed.
 *
 * @param value - The value to cast.
 */
const castArrayImpl = (value: unknown) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

/**
 * Casts a value to an array, directly or in data-last form.
 *
 * @example
 *   const toArray = castArray()
 *   toArray("zippy") // ["zippy"]
 */
export function castArray(): <T>(value: T) => CastArrayResult<T>

/**
 * Casts a value to an array, directly or in data-last form.
 *
 * @example
 *   castArray("zippy") // ["zippy"]
 *
 * @param value - The value to process.
 */
export function castArray<T>(value: T): CastArrayResult<T>
export function castArray(...args: [] | [unknown]) {
  if (args.length === 0) {
    return castArrayImpl
  }

  return castArrayImpl(args[0])
}
