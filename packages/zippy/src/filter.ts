import { type IterableInput, toReadonlyArray } from "./iterable"

type FilterGuard<T, Narrowed extends T> = (
  value: T,
  index: number,
  values: readonly T[],
) => value is Narrowed

type FilterPredicate<T> = (
  value: T,
  index: number,
  values: readonly T[],
) => unknown

// normal; type guard
/**
 * Filters the passed array to values matched by the type guard.
 *
 * @example
 *   const values = [1, "two"] as const
 *   filter(values, (value): value is 1 => value === 1) // [1]
 *
 * @param values - The values to process.
 * @param predicate - The predicate to apply.
 */
export function filter<T, Narrowed extends T>(
  values: IterableInput<T>,
  predicate: FilterGuard<T, Narrowed>,
): Narrowed[]

// normal; predicate
/**
 * Filters the passed array to values matched by the predicate.
 *
 * @example
 *   const values = [1, 2, 3, 4]
 *   filter(values, (value) => value % 2 === 0) // [2, 4]
 *
 * @param values - The values to process.
 * @param predicate - The predicate to apply.
 */
export function filter<T>(
  values: IterableInput<T>,
  predicate: FilterPredicate<T>,
): T[]

// authoritative pipe curry; type guard
// The `unknown` gate keeps this overload contextual: without a concrete `T`
// from a surrounding call like `pipe(data, filter(guard))`, standalone
// `filter(guard)(data)` calls fall through to the generic overload below.
/**
 * Returns a function that filters the passed array to values matched by the
 * type guard.
 *
 * @example
 *   const values = [1, "two"] as const
 *   filter((value): value is 1 => value === 1)(values) // [1]
 *
 * @param predicate - The predicate to apply.
 */
export function filter<T, Narrowed extends T>(
  predicate: FilterGuard<NoInfer<T>, Narrowed> &
    (unknown extends T ? never : unknown),
): (values: IterableInput<T>) => Narrowed[]

// generic curry; type guard
/**
 * Returns a function that filters the passed array to values matched by the
 * type guard.
 *
 * @example
 *   const values = [1, "two"] as const
 *   filter((value): value is 1 => value === 1)(values) // [1]
 *
 * @param predicate - The predicate to apply.
 */
export function filter<T, Narrowed extends T>(
  predicate: FilterGuard<T, Narrowed>,
): <Value extends T>(
  values: IterableInput<Value>,
) => Array<Narrowed extends Value ? Narrowed : Extract<Value, Narrowed>>

// authoritative pipe curry; predicate
/**
 * Returns a function that filters the passed array to values matched by the
 * predicate.
 *
 * @example
 *   const values = [1, 2, 3, 4]
 *   filter((value) => value % 2 === 0)(values) // [2, 4]
 *
 * @param predicate - The predicate to apply.
 */
export function filter<T>(
  predicate: FilterPredicate<NoInfer<T>> &
    (unknown extends T ? never : unknown),
): (values: IterableInput<T>) => T[]

// generic curry; predicate
/**
 * Returns a function that filters the passed array to values matched by the
 * predicate.
 *
 * @example
 *   const values = [1, 2, 3, 4]
 *   filter((value) => value % 2 === 0)(values) // [2, 4]
 *
 * @param predicate - The predicate to apply.
 */
export function filter<T>(
  predicate: FilterPredicate<T>,
): <Value extends T>(values: IterableInput<Value>) => Value[]
export function filter<T>(
  ...args:
    | [values: IterableInput<T>, predicate: FilterPredicate<T>]
    | [predicate: FilterPredicate<T>]
) {
  if (args.length === 1) {
    const [predicate] = args

    return <Value extends T>(values: IterableInput<Value>) => {
      const source = toReadonlyArray(values)

      return source.filter((value, index) => predicate(value, index, source))
    }
  }

  const [values, predicate] = args
  const source = toReadonlyArray(values)

  return source.filter((value, index) => predicate(value, index, source))
}

// normal; type guard
/**
 * Filters the passed array to values not matched by the type guard.
 *
 * @example
 *   const values = [1, "two"] as const
 *   filterOut(values, (value): value is 1 => value === 1) // ["two"]
 *
 * @param values - The values to process.
 * @param predicate - The predicate to apply.
 */
export function filterOut<T, Narrowed extends T>(
  values: IterableInput<T>,
  predicate: FilterGuard<T, Narrowed>,
): Array<Exclude<T, Narrowed>>

// normal; predicate
/**
 * Filters the passed array to values not matched by the predicate.
 *
 * @example
 *   const values = [1, 2, 3, 4]
 *   filterOut(values, (value) => value % 2 === 0) // [1, 3]
 *
 * @param values - The values to process.
 * @param predicate - The predicate to apply.
 */
export function filterOut<T>(
  values: IterableInput<T>,
  predicate: FilterPredicate<T>,
): T[]

// authoritative pipe curry; type guard
/**
 * Returns a function that filters the passed array to values not matched by the
 * type guard.
 *
 * @example
 *   const values = [1, "two"] as const
 *   filterOut((value): value is 1 => value === 1)(values) // ["two"]
 *
 * @param predicate - The predicate to apply.
 */
export function filterOut<T, Narrowed extends T>(
  predicate: FilterGuard<NoInfer<T>, Narrowed> &
    (unknown extends T ? never : unknown),
): (values: IterableInput<T>) => Array<Exclude<T, Narrowed>>

// generic curry; type guard
/**
 * Returns a function that filters the passed array to values not matched by the
 * type guard.
 *
 * @example
 *   const values = [1, "two"] as const
 *   filterOut((value): value is 1 => value === 1)(values) // ["two"]
 *
 * @param predicate - The predicate to apply.
 */
export function filterOut<T, Narrowed extends T>(
  predicate: FilterGuard<T, Narrowed>,
): <Value extends T>(
  values: IterableInput<Value>,
) => Array<Exclude<Value, Narrowed>>

// authoritative pipe curry; predicate
/**
 * Returns a function that filters the passed array to values not matched by the
 * predicate.
 *
 * @example
 *   const values = [1, 2, 3, 4]
 *   filterOut((value) => value % 2 === 0)(values) // [1, 3]
 *
 * @param predicate - The predicate to apply.
 */
export function filterOut<T>(
  predicate: FilterPredicate<NoInfer<T>> &
    (unknown extends T ? never : unknown),
): (values: IterableInput<T>) => T[]

// generic curry; predicate
/**
 * Returns a function that filters the passed array to values not matched by the
 * predicate.
 *
 * @example
 *   const values = [1, 2, 3, 4]
 *   filterOut((value) => value % 2 === 0)(values) // [1, 3]
 *
 * @param predicate - The predicate to apply.
 */
export function filterOut<T>(
  predicate: FilterPredicate<T>,
): <Value extends T>(values: IterableInput<Value>) => Value[]
export function filterOut<T>(
  ...args:
    | [values: IterableInput<T>, predicate: FilterPredicate<T>]
    | [predicate: FilterPredicate<T>]
) {
  if (args.length === 1) {
    const [predicate] = args

    return <Value extends T>(values: IterableInput<Value>) => {
      const source = toReadonlyArray(values)

      return source.filter((value, index) => !predicate(value, index, source))
    }
  }

  const [values, predicate] = args
  const source = toReadonlyArray(values)

  return source.filter((value, index) => !predicate(value, index, source))
}
