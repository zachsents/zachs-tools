/**
 * Returns the passed value unchanged.
 *
 * @example
 *   const value = { name: "zippy" }
 *   identity(value) // value
 *
 * @param value - The value to process.
 */
export function identity<T>(value: T): T {
  return value
}
