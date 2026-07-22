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
 * Returns a function that finds the median of the values in the passed array by
 * accessing the property denoted by the path selector.
 *
 * @example
 *   const data = [{ a: { num: 5 } }, { a: { num: 12 } }]
 *   median("a.num")(data) // 8.5
 *
 * @param selector - The selector to apply.
 */
export function median<T>(
  selector: SelectorPath<T, number>,
): (values: IterableInput<T>) => number | undefined

// generic curry; path
/**
 * Returns a function that finds the median of the values in the passed array by
 * accessing the property denoted by the path selector.
 *
 * @example
 *   const data = [{ a: { num: 5 } }, { a: { num: 12 } }]
 *   median("a.num")(data) // 8.5
 *
 * @param selector - The selector to apply.
 */
export function median<Path extends string>(
  selector: Path,
): // oxlint-disable eslint/no-unnecessary-type-parameters -- returned generic preserves extra properties in data-last calls
<T extends PathSatisfier<Path, number>>(
  values: IterableInput<T>,
) => number | undefined

// authoritative pipe curry; selector fn
/**
 * Returns a function that finds the median of the values in the passed array by
 * accessing the property returned by the selector function.
 *
 * @example
 *   const data = [{ a: { num: 5 } }, { a: { num: 12 } }]
 *   median((x) => x.a.num)(data) // 8.5
 *
 * @param selector - The selector to apply.
 */
export function median<T>(
  selector: SelectorFunction<NoInfer<T>, number>,
): (values: IterableInput<T>) => number | undefined

// generic curry; selector fn
/**
 * Returns a function that finds the median of the values in the passed array by
 * accessing the property returned by the selector function.
 *
 * @example
 *   const data = [{ a: { num: 5 } }, { a: { num: 12 } }]
 *   median((x) => x.a.num)(data) // 8.5
 *
 * @param selector - The selector to apply.
 */
export function median<T>(
  selector: SelectorFunction<T, number>,
): // oxlint-disable eslint/no-unnecessary-type-parameters -- returned generic preserves extra properties in data-last calls
<U extends T>(values: IterableInput<U>) => number | undefined

// normal; path
/**
 * Finds the median of the values in the passed array by accessing the property
 * denoted by the path selector.
 *
 * @example
 *   const data = [{ a: { num: 5 } }, { a: { num: 12 } }]
 *   median(data, "a.num") // 8.5
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
export function median<T>(
  values: IterableInput<T>,
  selector: SelectorPath<T, number>,
): number | undefined

// normal; selector fn
/**
 * Finds the median of the values in the passed array by accessing the property
 * returned by the selector function.
 *
 * @example
 *   const data = [{ a: { num: 5 } }, { a: { num: 12 } }]
 *   median(data, (x) => x.a.num) // 8.5
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
export function median<T>(
  values: IterableInput<T>,
  selector: SelectorFunction<T, number>,
): number | undefined

// normal numbers
/**
 * Finds the median of the passed array.
 *
 * @example
 *   const data = [5, 12]
 *   median(data) // 8.5
 *
 * @param values - The values to process.
 */
export function median(values: IterableInput<number>): number | undefined

// curried numbers
/**
 * Returns a function that finds the median of the values in the passed array.
 *
 * @example
 *   const data = [5, 12]
 *   median()(data) // 8.5
 */
export function median(): (values: IterableInput<number>) => number | undefined

export function median(
  ...args:
    | []
    | [IterableInput<number>]
    | [string | SelectorFunction<unknown, number>]
    | [
        values: IterableInput<unknown>,
        selector: string | SelectorFunction<unknown, number>,
      ]
) {
  if (args.length === 0) {
    return (values: []) => medianImpl(values)
  }

  if (args.length === 1) {
    const [a] = args
    return isIterableInput(a)
      ? medianImpl(a)
      : (values: []) => medianImpl(values, a)
  }

  return medianImpl(...args)
}

/**
 * Returns the median of the selected values.
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
function medianImpl(
  values: IterableInput<unknown>,
  selector: string | SelectorFunction<unknown, number> = Number,
) {
  const source = toReadonlyArray(values)

  if (source.length === 0) {
    return undefined
  }

  const sorted = source.map((value, index, source) =>
    typeof selector === "string"
      ? Number(getPropertyPathValue(value, selector))
      : selector(value, index, source),
  )

  // oxlint-disable-next-line unicorn/no-array-sort -- The mapped values are a new array.
  sorted.sort((left, right) => left - right)

  const midpoint = Math.floor(sorted.length / 2)
  const right = sorted[midpoint]

  if (right === undefined) {
    return undefined
  }

  if (sorted.length % 2 === 1) {
    return right
  }

  const left = sorted[midpoint - 1]

  return left === undefined ? undefined : (left + right) / 2
}
