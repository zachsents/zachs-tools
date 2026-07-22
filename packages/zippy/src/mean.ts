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
 * Returns a function that averages the values in the passed array by accessing
 * the property denoted by the path selector.
 *
 * @example
 *   const data = [{ a: { num: 5 } }, { a: { num: 15 } }]
 *   mean("a.num")(data) // 10
 *
 * @param selector - The selector to apply.
 */
export function mean<T>(
  selector: SelectorPath<T, number>,
): (values: IterableInput<T>) => number | undefined

// generic curry; path
/**
 * Returns a function that averages the values in the passed array by accessing
 * the property denoted by the path selector.
 *
 * @example
 *   const data = [{ a: { num: 5 } }, { a: { num: 15 } }]
 *   mean("a.num")(data) // 10
 *
 * @param selector - The selector to apply.
 */
export function mean<Path extends string>(
  selector: Path,
): // oxlint-disable eslint/no-unnecessary-type-parameters -- returned generic preserves extra properties in data-last calls
<T extends PathSatisfier<Path, number>>(
  values: IterableInput<T>,
) => number | undefined

// authoritative pipe curry; selector fn
/**
 * Returns a function that averages the values in the passed array by accessing
 * the property returned by the selector function.
 *
 * @example
 *   const data = [{ a: { num: 5 } }, { a: { num: 15 } }]
 *   mean((x) => x.a.num)(data) // 10
 *
 * @param selector - The selector to apply.
 */
export function mean<T>(
  selector: SelectorFunction<NoInfer<T>, number>,
): (values: IterableInput<T>) => number | undefined

// generic curry; selector fn
/**
 * Returns a function that averages the values in the passed array by accessing
 * the property returned by the selector function.
 *
 * @example
 *   const data = [{ a: { num: 5 } }, { a: { num: 15 } }]
 *   mean((x) => x.a.num)(data) // 10
 *
 * @param selector - The selector to apply.
 */
export function mean<T>(
  selector: SelectorFunction<T, number>,
): // oxlint-disable eslint/no-unnecessary-type-parameters -- returned generic preserves extra properties in data-last calls
<U extends T>(values: IterableInput<U>) => number | undefined

// normal; path
/**
 * Averages the values in the passed array by accessing the property denoted by
 * the path selector.
 *
 * @example
 *   const data = [{ a: { num: 5 } }, { a: { num: 15 } }]
 *   mean(data, "a.num") // 10
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
export function mean<T>(
  values: IterableInput<T>,
  selector: SelectorPath<T, number>,
): number | undefined

// normal; selector fn
/**
 * Averages the values in the passed array by accessing the property returned by
 * the selector function.
 *
 * @example
 *   const data = [{ a: { num: 5 } }, { a: { num: 15 } }]
 *   mean(data, (x) => x.a.num) // 10
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
export function mean<T>(
  values: IterableInput<T>,
  selector: SelectorFunction<T, number>,
): number | undefined

// normal numbers
/**
 * Averages the passed array.
 *
 * @example
 *   const data = [5, 15]
 *   mean(data) // 10
 *
 * @param values - The values to process.
 */
export function mean(values: IterableInput<number>): number | undefined

// curried numbers
/**
 * Returns a function that averages the values in the passed array.
 *
 * @example
 *   const data = [5, 15]
 *   mean()(data) // 10
 */
export function mean(): (values: IterableInput<number>) => number | undefined

export function mean(
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
    return (values: []) => meanImpl(values)
  }

  if (args.length === 1) {
    const [a] = args
    return isIterableInput(a)
      ? meanImpl(a)
      : (values: []) => meanImpl(values, a)
  }

  return meanImpl(...args)
}

/**
 * Returns the arithmetic mean of the selected values.
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
function meanImpl(
  values: IterableInput<unknown>,
  selector: string | SelectorFunction<unknown, number> = Number,
) {
  const source = toReadonlyArray(values)

  if (source.length === 0) {
    return undefined
  }

  return (
    source.reduce<number>(
      (sum, cur, i, arr) =>
        sum +
        (typeof selector === "string"
          ? Number(getPropertyPathValue(cur, selector))
          : selector(cur, i, arr)),
      0,
    ) / source.length
  )
}
