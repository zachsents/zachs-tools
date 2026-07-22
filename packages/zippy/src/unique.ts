import {
  isIterableInput,
  type IterableInput,
  toReadonlyArray,
} from "./iterable"
import {
  getPropertyPathValue,
  type PathSatisfier,
  type SelectorFunction,
  type SelectorPath,
} from "./selector"

// authoritative pipe curry; path
/**
 * Returns a function that keeps the first value for each unique property path
 * value.
 *
 * @example
 *   const data = [
 *     { id: 1, name: "first" },
 *     { id: 1, name: "duplicate" },
 *   ]
 *   unique("id")(data) // [{ id: 1, name: "first" }]
 *
 * @param selector - The selector to apply.
 */
export function unique<T>(
  selector: SelectorPath<T>,
): (values: IterableInput<T>) => T[]

// generic curry; path
/**
 * Returns a function that keeps the first value for each unique property path
 * value.
 *
 * @example
 *   const data = [
 *     { id: 1, name: "first" },
 *     { id: 1, name: "duplicate" },
 *   ]
 *   unique("id")(data) // [{ id: 1, name: "first" }]
 *
 * @param selector - The selector to apply.
 */
export function unique<Path extends string>(
  selector: Path,
): // oxlint-disable eslint/no-unnecessary-type-parameters -- returned generic preserves extra properties in data-last calls
<T extends PathSatisfier<Path>>(values: IterableInput<T>) => T[]

// authoritative pipe curry; selector fn
/**
 * Returns a function that keeps the first value for each unique key returned by
 * the selector function.
 *
 * @example
 *   const data = [
 *     { id: 1, name: "first" },
 *     { id: 1, name: "duplicate" },
 *   ]
 *   unique((x) => x.id)(data) // [{ id: 1, name: "first" }]
 *
 * @param selector - The selector to apply.
 */
export function unique<T>(
  selector: SelectorFunction<NoInfer<T>>,
): (values: IterableInput<T>) => T[]

// generic curry; selector fn
/**
 * Returns a function that keeps the first value for each unique key returned by
 * the selector function.
 *
 * @example
 *   const data = [
 *     { id: 1, name: "first" },
 *     { id: 1, name: "duplicate" },
 *   ]
 *   unique((x) => x.id)(data) // [{ id: 1, name: "first" }]
 *
 * @param selector - The selector to apply.
 */
export function unique<T>(
  selector: SelectorFunction<T>,
): // oxlint-disable eslint/no-unnecessary-type-parameters -- returned generic preserves extra properties in data-last calls
<U extends T>(values: IterableInput<U>) => U[]

// normal; path
/**
 * Keeps the first value for each unique property path value.
 *
 * @example
 *   const data = [
 *     { id: 1, name: "first" },
 *     { id: 1, name: "duplicate" },
 *   ]
 *   unique(data, "id") // [{ id: 1, name: "first" }]
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
export function unique<T>(
  values: IterableInput<T>,
  selector: SelectorPath<T>,
): T[]

// normal; selector fn
/**
 * Keeps the first value for each unique key returned by the selector function.
 *
 * @example
 *   const data = [
 *     { id: 1, name: "first" },
 *     { id: 1, name: "duplicate" },
 *   ]
 *   unique(data, (x) => x.id) // [{ id: 1, name: "first" }]
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
export function unique<T>(
  values: IterableInput<T>,
  selector: SelectorFunction<T>,
): T[]

// normal values
/**
 * Keeps the first occurrence of each value in the passed array.
 *
 * @example
 *   unique([1, 2, 1, 3]) // [1, 2, 3]
 *
 * @param values - The values to process.
 */
export function unique<T>(values: IterableInput<T>): T[]

// curried values
/**
 * Returns a function that keeps the first occurrence of each value in the
 * passed array.
 *
 * @example
 *   unique()([1, 2, 1, 3]) // [1, 2, 3]
 */
export function unique(): <T>(values: IterableInput<T>) => T[]

export function unique(
  ...args:
    | []
    | [IterableInput<unknown>]
    | [string | SelectorFunction<unknown>]
    | [
        values: IterableInput<unknown>,
        selector: string | SelectorFunction<unknown>,
      ]
) {
  if (args.length === 0) {
    return (values: []) => uniqueImpl(values)
  }

  if (args.length === 1) {
    const [a] = args
    return isIterableInput(a)
      ? uniqueImpl(a)
      : (values: []) => uniqueImpl(values, a)
  }

  return uniqueImpl(...args)
}

/**
 * Returns the first value for each unique selected key.
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
function uniqueImpl<T>(
  values: IterableInput<T>,
  selector: string | SelectorFunction<T> = (value) => value,
) {
  const source = toReadonlyArray(values)
  const seenKeys = new Set<unknown>()
  const result: T[] = []

  for (const [index, value] of source.entries()) {
    const key =
      typeof selector === "string"
        ? getPropertyPathValue(value, selector)
        : selector(value, index, source)

    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      result.push(value)
    }
  }

  return result
}
