export type IterableInput<T> = Iterable<T> & object

/**
 * Checks whether a value can be consumed as iterable input.
 *
 * @param value - The value to process.
 */
export function isIterableInput<T = unknown>(
  value: unknown,
): value is IterableInput<T> {
  return (
    (typeof value === "object" || typeof value === "function") &&
    value !== null &&
    typeof (value as { readonly [Symbol.iterator]?: unknown })[
      Symbol.iterator
    ] === "function"
  )
}

/**
 * Materializes iterable input as a readonly array.
 *
 * @param values - The values to process.
 */
export function toReadonlyArray<T>(values: IterableInput<T>): readonly T[] {
  return Array.isArray(values) ? values : Array.from(values)
}
