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
 * Returns a function that finds the first value with the most common key
 * denoted by the path selector.
 *
 * @example
 *   const data = [{ kind: "a" }, { kind: "b" }, { kind: "a" }]
 *   mode("kind")(data) // { kind: "a" }
 *
 * @param selector - The selector to apply.
 */
export function mode<T>(
  selector: SelectorPath<T>,
): (values: IterableInput<T>) => T | undefined

// generic curry; path
/**
 * Returns a function that finds the first value with the most common key
 * denoted by the path selector.
 *
 * @example
 *   const data = [{ kind: "a" }, { kind: "b" }, { kind: "a" }]
 *   mode("kind")(data) // { kind: "a" }
 *
 * @param selector - The selector to apply.
 */
export function mode<Path extends string>(
  selector: Path,
): // oxlint-disable eslint/no-unnecessary-type-parameters -- returned generic preserves extra properties in data-last calls
<T extends PathSatisfier<Path>>(values: IterableInput<T>) => T | undefined

// authoritative pipe curry; selector fn
/**
 * Returns a function that finds the first value with the most common key
 * returned by the selector function.
 *
 * @example
 *   const data = [{ kind: "a" }, { kind: "b" }, { kind: "a" }]
 *   mode((x) => x.kind)(data) // { kind: "a" }
 *
 * @param selector - The selector to apply.
 */
export function mode<T>(
  selector: SelectorFunction<NoInfer<T>>,
): (values: IterableInput<T>) => T | undefined

// generic curry; selector fn
/**
 * Returns a function that finds the first value with the most common key
 * returned by the selector function.
 *
 * @example
 *   const data = [{ kind: "a" }, { kind: "b" }, { kind: "a" }]
 *   mode((x) => x.kind)(data) // { kind: "a" }
 *
 * @param selector - The selector to apply.
 */
export function mode<T>(
  selector: SelectorFunction<T>,
): // oxlint-disable eslint/no-unnecessary-type-parameters -- returned generic preserves extra properties in data-last calls
<U extends T>(values: IterableInput<U>) => U | undefined

// normal; path
/**
 * Finds the first value with the most common key denoted by the path selector.
 *
 * @example
 *   const data = [{ kind: "a" }, { kind: "b" }, { kind: "a" }]
 *   mode(data, "kind") // { kind: "a" }
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
export function mode<T>(
  values: IterableInput<T>,
  selector: SelectorPath<T>,
): T | undefined

// normal; selector fn
/**
 * Finds the first value with the most common key returned by the selector
 * function.
 *
 * @example
 *   const data = [{ kind: "a" }, { kind: "b" }, { kind: "a" }]
 *   mode(data, (x) => x.kind) // { kind: "a" }
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
export function mode<T>(
  values: IterableInput<T>,
  selector: SelectorFunction<T>,
): T | undefined

// normal values
/**
 * Finds the most common value in the passed array.
 *
 * @example
 *   const data = ["z", "i", "p", "p", "y"]
 *   mode(data) // "p"
 *
 * @param values - The values to process.
 */
export function mode<T>(values: IterableInput<T>): T | undefined

// curried values
/**
 * Returns a function that finds the most common value in the passed array.
 *
 * @example
 *   const data = ["z", "i", "p", "p", "y"]
 *   mode()(data) // "p"
 */
export function mode(): <T>(values: IterableInput<T>) => T | undefined

export function mode(
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
    return (values: []) => modeImpl(values)
  }

  if (args.length === 1) {
    const [a] = args
    return isIterableInput(a)
      ? modeImpl(a)
      : (values: []) => modeImpl(values, a)
  }

  return modeImpl(...args)
}

/**
 * Returns the first value with the most frequent selected key.
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
function modeImpl<T>(
  values: IterableInput<T>,
  selector?: string | SelectorFunction<T>,
) {
  const source = toReadonlyArray(values)
  const counts = new Map<unknown, number>()
  const firstValues = new Map<unknown, T>()
  const orderedKeys: unknown[] = []

  for (const [index, value] of source.entries()) {
    const key =
      selector === undefined
        ? value
        : typeof selector === "string"
          ? getPropertyPathValue(value, selector)
          : selector(value, index, source)
    const count = counts.get(key)

    if (count === undefined) {
      counts.set(key, 1)
      firstValues.set(key, value)
      orderedKeys.push(key)
    } else {
      counts.set(key, count + 1)
    }
  }

  let bestValue: T | undefined
  let bestCount = 0

  for (const key of orderedKeys) {
    const count = counts.get(key)

    if (count !== undefined && count > bestCount) {
      bestValue = firstValues.get(key)
      bestCount = count
    }
  }

  return bestValue
}
