import type { Get, Promisable } from "type-fest"

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

type Dictionary<T> = Readonly<Record<string, T>>

type MapAsyncOptions = {
  concurrency?: number
}

type ArrayMapper<T = unknown, Mapped = unknown> = (
  value: T,
  index: number,
  values: readonly T[],
) => Mapped

type AsyncArrayMapper<T = unknown, Mapped = unknown> = (
  value: T,
  index: number,
  values: readonly T[],
) => Promisable<Mapped>

type DictionaryMapper<Value = unknown, Mapped = unknown> = (
  value: Value,
  key: string,
  values: Dictionary<Value>,
) => Mapped

type AsyncDictionaryMapper<Value = unknown, Mapped = unknown> = (
  value: Value,
  key: string,
  values: Dictionary<Value>,
) => Promisable<Mapped>

type EntryMapper<
  Value = unknown,
  MappedKey extends PropertyKey = PropertyKey,
  MappedValue = unknown,
> = (
  entry: readonly [key: string, value: Value],
  index: number,
  values: Dictionary<Value>,
) => readonly [key: MappedKey, value: MappedValue]

type AsyncEntryMapper<
  Value = unknown,
  MappedKey extends PropertyKey = PropertyKey,
  MappedValue = unknown,
> = (
  entry: readonly [key: string, value: Value],
  index: number,
  values: Dictionary<Value>,
) => Promisable<readonly [key: MappedKey, value: MappedValue]>

type RuntimeArrayMapper = AsyncArrayMapper | string
type RuntimeDictionaryMapper<Mapped = unknown> =
  | AsyncDictionaryMapper<unknown, Mapped>
  | string
type RuntimeEntryMapper = AsyncEntryMapper

type MapAsyncArgs =
  | [mapper: RuntimeArrayMapper, options?: MapAsyncOptions]
  | [
      values: IterableInput<unknown>,
      mapper: RuntimeArrayMapper,
      options?: MapAsyncOptions,
    ]

type MapDictionaryAsyncArgs<Mapped = unknown> =
  | [mapper: RuntimeDictionaryMapper<Mapped>, options?: MapAsyncOptions]
  | [
      values: Dictionary<unknown>,
      mapper: RuntimeDictionaryMapper<Mapped>,
      options?: MapAsyncOptions,
    ]

type MapEntriesAsyncArgs =
  | [mapper: RuntimeEntryMapper, options?: MapAsyncOptions]
  | [
      values: Dictionary<unknown>,
      mapper: RuntimeEntryMapper,
      options?: MapAsyncOptions,
    ]

/**
 * Checks whether array mapping arguments use the data-first form.
 *
 * @param args - The runtime arguments.
 */
function isMapAsyncDataFirstArgs(
  args: MapAsyncArgs,
): args is [
  values: IterableInput<unknown>,
  mapper: RuntimeArrayMapper,
  options?: MapAsyncOptions,
] {
  return isIterableInput(args[0])
}

/**
 * Checks whether dictionary mapping arguments use the data-first form.
 *
 * @param args - The runtime arguments.
 */
function isDictionaryAsyncDataFirstArgs<Mapped>(
  args: MapDictionaryAsyncArgs<Mapped>,
): args is [
  values: Dictionary<unknown>,
  mapper: RuntimeDictionaryMapper<Mapped>,
  options?: MapAsyncOptions,
] {
  return typeof args[0] !== "function" && typeof args[0] !== "string"
}

/**
 * Checks whether entry mapping arguments use the data-first form.
 *
 * @param args - The runtime arguments.
 */
function isEntriesAsyncDataFirstArgs(
  args: MapEntriesAsyncArgs,
): args is [
  values: Dictionary<unknown>,
  mapper: RuntimeEntryMapper,
  options?: MapAsyncOptions,
] {
  return typeof args[0] !== "function"
}

/**
 * Maps items asynchronously with optional concurrency control.
 *
 * @param items - The items to map.
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
async function mapAsyncItems<Item, Mapped>(
  items: readonly Item[],
  mapper: (item: Item, index: number) => Promisable<Mapped>,
  options?: MapAsyncOptions,
) {
  const { concurrency } = options ?? {}

  if (
    concurrency !== undefined &&
    (!Number.isInteger(concurrency) || concurrency < 1)
  ) {
    throw new RangeError("mapAsync concurrency must be a positive integer")
  }

  if (concurrency === undefined || concurrency >= items.length) {
    return Promise.all(items.map((item, index) => mapper(item, index)))
  }

  const entries = items.entries()
  const result: Array<Awaited<Mapped>> = []
  let rejected = false

  /** Processes asynchronous mapping work from the shared queue. */
  async function worker() {
    for (;;) {
      if (rejected) {
        return
      }

      const next = entries.next()

      if (next.done) {
        return
      }

      const [index, item] = next.value

      result[index] = await mapper(item, index)
    }
  }

  return Promise.all(
    Array.from({ length: concurrency }, () =>
      worker().catch((error: unknown) => {
        rejected = true

        throw error
      }),
    ),
  ).then(() => result)
}

// authoritative pipe curry; path
/**
 * Returns a function that maps the passed array by accessing the property
 * denoted by the path selector.
 *
 * @example
 *   const values = [{ profile: { name: "Ada" } }]
 *   map("profile.name")(values) // ["Ada"]
 *
 * @param selector - The selector to apply.
 */
export function map<T, Path extends SelectorPath<T> = SelectorPath<T>>(
  selector: Path,
): (values: IterableInput<T>) => Array<Get<T, Path>>

// generic curry; path
/**
 * Returns a function that maps the passed array by accessing the property
 * denoted by the path selector.
 *
 * @example
 *   const values = [{ profile: { name: "Ada" } }]
 *   map("profile.name")(values) // ["Ada"]
 *
 * @param selector - The selector to apply.
 */
export function map<Path extends string>(
  selector: Path,
): <T extends PathSatisfier<Path>>(
  values: IterableInput<T>,
) => Array<Get<T, Path>>

// authoritative pipe curry; selector fn
/**
 * Returns a function that maps the passed array with the selector function.
 *
 * @example
 *   const values = [{ count: 1 }]
 *   map((value) => value.count)(values) // [1]
 *
 * @param selector - The selector to apply.
 */
export function map<T, Mapped>(
  selector: SelectorFunction<NoInfer<T>, Mapped> &
    (unknown extends T ? never : unknown),
): (values: IterableInput<T>) => Mapped[]

// generic curry; selector fn
/**
 * Returns a function that maps the passed array with the selector function.
 *
 * @example
 *   const values = [{ count: 1 }]
 *   map((value: { count: number }) => value.count)(values) // [1]
 *
 * @param selector - The selector to apply.
 */
export function map<T, Mapped>(
  selector: SelectorFunction<T, Mapped>,
): // oxlint-disable eslint/no-unnecessary-type-parameters -- returned generic preserves extra properties in data-last calls
<U extends T>(values: IterableInput<U>) => Mapped[]

// normal; path
/**
 * Maps the passed array by accessing the property denoted by the path selector.
 *
 * @example
 *   const values = [{ profile: { name: "Ada" } }]
 *   map(values, "profile.name") // ["Ada"]
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
export function map<T, Path extends SelectorPath<T>>(
  values: IterableInput<T>,
  selector: Path,
): Array<Get<T, Path>>

// normal; selector fn
/**
 * Maps the passed array with the selector function.
 *
 * @example
 *   const values = [{ count: 1 }]
 *   map(values, (value) => value.count) // [1]
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
export function map<T, Mapped>(
  values: IterableInput<T>,
  selector: SelectorFunction<T, Mapped>,
): Mapped[]

export function map(
  ...args:
    | [selector: ArrayMapper | string]
    | [values: IterableInput<unknown>, selector: ArrayMapper | string]
) {
  if (args.length === 1) {
    const [selector] = args

    return ((values: IterableInput<unknown>) => {
      const source = toReadonlyArray(values)

      return source.map((value, index) =>
        typeof selector === "string"
          ? getPropertyPathValue(value, selector)
          : selector(value, index, source),
      )
    }) as unknown
  }

  const [values, selector] = args
  const source = toReadonlyArray(values)

  return source.map((value, index) =>
    typeof selector === "string"
      ? getPropertyPathValue(value, selector)
      : selector(value, index, source),
  ) as unknown
}

// authoritative pipe curry; path
/**
 * Returns a function that asynchronously maps the passed array by accessing the
 * property denoted by the path selector.
 *
 * @example
 *   const values = [{ profile: { name: "Ada" } }]
 *   await mapAsync("profile.name")(values) // ["Ada"]
 *
 * @param selector - The selector to apply.
 * @param options - The mapping options.
 */
export function mapAsync<T, Path extends SelectorPath<T> = SelectorPath<T>>(
  selector: Path,
  options?: MapAsyncOptions,
): (values: IterableInput<T>) => Promise<Array<Awaited<Get<T, Path>>>>

// generic curry; path
/**
 * Returns a function that asynchronously maps the passed array by accessing the
 * property denoted by the path selector.
 *
 * @example
 *   const values = [{ profile: { name: "Ada" } }]
 *   await mapAsync("profile.name")(values) // ["Ada"]
 *
 * @param selector - The selector to apply.
 * @param options - The mapping options.
 */
export function mapAsync<Path extends string>(
  selector: Path,
  options?: MapAsyncOptions,
): <T extends PathSatisfier<Path>>(
  values: IterableInput<T>,
) => Promise<Array<Awaited<Get<T, Path>>>>

// authoritative pipe curry; selector fn
/**
 * Returns a function that asynchronously maps the passed array with the mapper
 * function.
 *
 * @example
 *   const values = [1, 2]
 *   await mapAsync(async (value) => value * 2)(values) // [2, 4]
 *
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
export function mapAsync<T, Mapped>(
  mapper: AsyncArrayMapper<NoInfer<T>, Mapped> &
    (unknown extends T ? never : unknown),
  options?: MapAsyncOptions,
): (values: IterableInput<T>) => Promise<Array<Awaited<Mapped>>>

// generic curry; selector fn
/**
 * Returns a function that asynchronously maps the passed array with the mapper
 * function.
 *
 * @example
 *   const values = [1, 2]
 *   await mapAsync(async (value: number) => value * 2)(values) // [2, 4]
 *
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
export function mapAsync<T, Mapped>(
  mapper: AsyncArrayMapper<T, Mapped>,
  options?: MapAsyncOptions,
): // oxlint-disable eslint/no-unnecessary-type-parameters -- returned generic preserves extra properties in data-last calls
<U extends T>(values: IterableInput<U>) => Promise<Array<Awaited<Mapped>>>

// normal; path
/**
 * Asynchronously maps the passed array by accessing the property denoted by the
 * path selector.
 *
 * @example
 *   const values = [{ profile: { name: "Ada" } }]
 *   await mapAsync(values, "profile.name") // ["Ada"]
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 * @param options - The mapping options.
 */
export function mapAsync<T, Path extends SelectorPath<T>>(
  values: IterableInput<T>,
  selector: Path,
  options?: MapAsyncOptions,
): Promise<Array<Awaited<Get<T, Path>>>>

// normal; selector fn
/**
 * Asynchronously maps the passed array with the mapper function.
 *
 * @example
 *   const values = [1, 2]
 *   await mapAsync(values, async (value) => value * 2) // [2, 4]
 *
 * @param values - The values to process.
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
export function mapAsync<T, Mapped>(
  values: IterableInput<T>,
  mapper: AsyncArrayMapper<T, Mapped>,
  options?: MapAsyncOptions,
): Promise<Array<Awaited<Mapped>>>

export function mapAsync(...args: MapAsyncArgs) {
  if (isMapAsyncDataFirstArgs(args)) {
    const [values, mapper, options] = args
    const source = toReadonlyArray(values)

    return mapAsyncItems(
      source,
      (value, index) =>
        typeof mapper === "string"
          ? getPropertyPathValue(value, mapper)
          : mapper(value, index, source),
      options,
    ) as unknown
  }

  const [mapper, options] = args

  return ((values: IterableInput<unknown>) => {
    const source = toReadonlyArray(values)

    return mapAsyncItems(
      source,
      (value, index) =>
        typeof mapper === "string"
          ? getPropertyPathValue(value, mapper)
          : mapper(value, index, source),
      options,
    )
  }) as unknown
}

// authoritative pipe curry; path
/**
 * Returns a function that maps object values by accessing the property denoted
 * by the path selector.
 *
 * @example
 *   const values = { user: { profile: { name: "Ada" } } }
 *   mapValues("profile.name")(values) // { user: "Ada" }
 *
 * @param selector - The selector to apply.
 */
export function mapValues<
  Value,
  Path extends SelectorPath<Value> = SelectorPath<Value>,
>(
  selector: Path,
): (values: Dictionary<Value>) => Record<string, Get<Value, Path>>

// generic curry; path
/**
 * Returns a function that maps object values by accessing the property denoted
 * by the path selector.
 *
 * @example
 *   const values = { user: { profile: { name: "Ada" } } }
 *   mapValues("profile.name")(values) // { user: "Ada" }
 *
 * @param selector - The selector to apply.
 */
export function mapValues<Path extends string>(
  selector: Path,
): <Value extends PathSatisfier<Path>>(
  values: Dictionary<Value>,
) => Record<string, Get<Value, Path>>

// authoritative pipe curry; mapper fn
/**
 * Returns a function that maps object values while preserving keys.
 *
 * @example
 *   const values = { a: 1, b: 2 }
 *   mapValues((value) => value * 10)(values) // { a: 10, b: 20 }
 *
 * @param mapper - The mapper to apply.
 */
export function mapValues<Value, Mapped>(
  mapper: DictionaryMapper<NoInfer<Value>, Mapped> &
    (unknown extends Value ? never : unknown),
): (values: Dictionary<Value>) => Record<string, Mapped>

// generic curry; mapper fn
/**
 * Returns a function that maps object values while preserving keys.
 *
 * @example
 *   const values = { a: 1, b: 2 }
 *   mapValues((value: number) => value * 10)(values) // { a: 10, b: 20 }
 *
 * @param mapper - The mapper to apply.
 */
export function mapValues<Value, Mapped>(
  mapper: DictionaryMapper<Value, Mapped>,
): <InputValue extends Value>(
  values: Dictionary<InputValue>,
) => Record<string, Mapped>

// normal; path
/**
 * Maps object values by accessing the property denoted by the path selector.
 *
 * @example
 *   const values = { user: { profile: { name: "Ada" } } }
 *   mapValues(values, "profile.name") // { user: "Ada" }
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
export function mapValues<Value, Path extends SelectorPath<Value>>(
  values: Dictionary<Value>,
  selector: Path,
): Record<string, Get<Value, Path>>

// normal; mapper fn
/**
 * Maps object values while preserving keys.
 *
 * @example
 *   const values = { a: 1, b: 2 }
 *   mapValues(values, (value) => value * 10) // { a: 10, b: 20 }
 *
 * @param values - The values to process.
 * @param mapper - The mapper to apply.
 */
export function mapValues<Value, Mapped>(
  values: Dictionary<Value>,
  mapper: DictionaryMapper<Value, Mapped>,
): Record<string, Mapped>

export function mapValues(
  ...args:
    | [mapper: DictionaryMapper | string]
    | [values: Dictionary<unknown>, mapper: DictionaryMapper | string]
) {
  if (args.length === 1) {
    const [mapper] = args

    return (<Value>(values: Dictionary<Value>) => {
      const result: Record<string, unknown> = {}

      for (const [key, value] of Object.entries(values)) {
        result[key] =
          typeof mapper === "string"
            ? getPropertyPathValue(value, mapper)
            : mapper(value, key, values)
      }

      return result
    }) as unknown
  }

  const [values, mapper] = args
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(values)) {
    result[key] =
      typeof mapper === "string"
        ? getPropertyPathValue(value, mapper)
        : mapper(value, key, values)
  }

  return result as unknown
}

// authoritative pipe curry; path
/**
 * Returns a function that asynchronously maps object values by accessing the
 * property denoted by the path selector.
 *
 * @example
 *   const values = { user: { profile: { name: "Ada" } } }
 *   await mapValuesAsync("profile.name")(values) // { user: "Ada" }
 *
 * @param selector - The selector to apply.
 * @param options - The mapping options.
 */
export function mapValuesAsync<
  Value,
  Path extends SelectorPath<Value> = SelectorPath<Value>,
>(
  selector: Path,
  options?: MapAsyncOptions,
): (
  values: Dictionary<Value>,
) => Promise<Record<string, Awaited<Get<Value, Path>>>>

// generic curry; path
/**
 * Returns a function that asynchronously maps object values by accessing the
 * property denoted by the path selector.
 *
 * @example
 *   const values = { user: { profile: { name: "Ada" } } }
 *   await mapValuesAsync("profile.name")(values) // { user: "Ada" }
 *
 * @param selector - The selector to apply.
 * @param options - The mapping options.
 */
export function mapValuesAsync<Path extends string>(
  selector: Path,
  options?: MapAsyncOptions,
): <Value extends PathSatisfier<Path>>(
  values: Dictionary<Value>,
) => Promise<Record<string, Awaited<Get<Value, Path>>>>

// authoritative pipe curry; mapper fn
/**
 * Returns a function that asynchronously maps object values while preserving
 * keys.
 *
 * @example
 *   const values = { a: 1, b: 2 }
 *   await mapValuesAsync(async (value) => value * 10)(values)
 *
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
export function mapValuesAsync<Value, Mapped>(
  mapper: AsyncDictionaryMapper<NoInfer<Value>, Mapped> &
    (unknown extends Value ? never : unknown),
  options?: MapAsyncOptions,
): (values: Dictionary<Value>) => Promise<Record<string, Awaited<Mapped>>>

// generic curry; mapper fn
/**
 * Returns a function that asynchronously maps object values while preserving
 * keys.
 *
 * @example
 *   const values = { a: 1, b: 2 }
 *   await mapValuesAsync(async (value: number) => value * 10)(values)
 *
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
export function mapValuesAsync<Value, Mapped>(
  mapper: AsyncDictionaryMapper<Value, Mapped>,
  options?: MapAsyncOptions,
): <InputValue extends Value>(
  values: Dictionary<InputValue>,
) => Promise<Record<string, Awaited<Mapped>>>

// normal; path
/**
 * Asynchronously maps object values by accessing the property denoted by the
 * path selector.
 *
 * @example
 *   const values = { user: { profile: { name: "Ada" } } }
 *   await mapValuesAsync(values, "profile.name") // { user: "Ada" }
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 * @param options - The mapping options.
 */
export function mapValuesAsync<Value, Path extends SelectorPath<Value>>(
  values: Dictionary<Value>,
  selector: Path,
  options?: MapAsyncOptions,
): Promise<Record<string, Awaited<Get<Value, Path>>>>

// normal; mapper fn
/**
 * Asynchronously maps object values while preserving keys.
 *
 * @example
 *   const values = { a: 1, b: 2 }
 *   await mapValuesAsync(values, async (value) => value * 10)
 *
 * @param values - The values to process.
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
export function mapValuesAsync<Value, Mapped>(
  values: Dictionary<Value>,
  mapper: AsyncDictionaryMapper<Value, Mapped>,
  options?: MapAsyncOptions,
): Promise<Record<string, Awaited<Mapped>>>

export function mapValuesAsync(...args: MapDictionaryAsyncArgs) {
  if (isDictionaryAsyncDataFirstArgs(args)) {
    const [values, mapper, options] = args

    return mapAsyncItems(
      Object.entries(values),
      async ([key, value]) =>
        [
          key,
          typeof mapper === "string"
            ? await getPropertyPathValue(value, mapper)
            : await mapper(value, key, values),
        ] as const,
      options,
    ).then((mappedEntries) =>
      Object.fromEntries(mappedEntries as Iterable<readonly [string, unknown]>),
    ) as unknown
  }

  const [mapper, options] = args

  return (<Value>(values: Dictionary<Value>) =>
    mapAsyncItems(
      Object.entries(values),
      async ([key, value]) =>
        [
          key,
          typeof mapper === "string"
            ? getPropertyPathValue(value, mapper)
            : await mapper(value, key, values),
        ] as const,
      options,
    ).then((mappedEntries) =>
      Object.fromEntries(mappedEntries as Iterable<readonly [string, unknown]>),
    )) as unknown
}

// authoritative pipe curry; path
/**
 * Returns a function that maps object keys by accessing the property denoted by
 * the path selector.
 *
 * @example
 *   const values = { user: { id: "user-1" } }
 *   mapKeys("id")(values) // { "user-1": values.user }
 *
 * @param selector - The selector to apply.
 */
export function mapKeys<
  Value,
  Path extends SelectorPath<Value, PropertyKey> = SelectorPath<
    Value,
    PropertyKey
  >,
>(
  selector: Path,
): (values: Dictionary<Value>) => Record<Get<Value, Path> & PropertyKey, Value>

// generic curry; path
/**
 * Returns a function that maps object keys by accessing the property denoted by
 * the path selector.
 *
 * @example
 *   const values = { user: { id: "user-1" } }
 *   mapKeys("id")(values) // { "user-1": values.user }
 *
 * @param selector - The selector to apply.
 */
export function mapKeys<Path extends string>(
  selector: Path,
): <Value extends PathSatisfier<Path, PropertyKey>>(
  values: Dictionary<Value>,
) => Record<Get<Value, Path> & PropertyKey, Value>

// authoritative pipe curry; mapper fn
/**
 * Returns a function that maps object keys while preserving values.
 *
 * @example
 *   const values = { first: 1 }
 *   mapKeys((_value, key) => key.toUpperCase())(values) // { FIRST: 1 }
 *
 * @param mapper - The mapper to apply.
 */
export function mapKeys<Value, MappedKey extends PropertyKey>(
  mapper: DictionaryMapper<NoInfer<Value>, MappedKey> &
    (unknown extends Value ? never : unknown),
): (values: Dictionary<Value>) => Record<MappedKey, Value>

// generic curry; mapper fn
/**
 * Returns a function that maps object keys while preserving values.
 *
 * @example
 *   const values = { first: 1 }
 *   mapKeys((_value: number, key) => key.toUpperCase())(values)
 *
 * @param mapper - The mapper to apply.
 */
export function mapKeys<Value, MappedKey extends PropertyKey>(
  mapper: DictionaryMapper<Value, MappedKey>,
): <InputValue extends Value>(
  values: Dictionary<InputValue>,
) => Record<MappedKey, InputValue>

// normal; path
/**
 * Maps object keys by accessing the property denoted by the path selector.
 *
 * @example
 *   const values = { user: { id: "user-1" } }
 *   mapKeys(values, "id") // { "user-1": values.user }
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 */
export function mapKeys<Value, Path extends SelectorPath<Value, PropertyKey>>(
  values: Dictionary<Value>,
  selector: Path,
): Record<Get<Value, Path> & PropertyKey, Value>

// normal; mapper fn
/**
 * Maps object keys while preserving values.
 *
 * @example
 *   const values = { first: 1 }
 *   mapKeys(values, (_value, key) => key.toUpperCase()) // { FIRST: 1 }
 *
 * @param values - The values to process.
 * @param mapper - The mapper to apply.
 */
export function mapKeys<Value, MappedKey extends PropertyKey>(
  values: Dictionary<Value>,
  mapper: DictionaryMapper<Value, MappedKey>,
): Record<MappedKey, Value>

export function mapKeys(
  ...args:
    | [mapper: DictionaryMapper<unknown, PropertyKey> | string]
    | [
        values: Dictionary<unknown>,
        mapper: DictionaryMapper<unknown, PropertyKey> | string,
      ]
) {
  if (args.length === 1) {
    const [mapper] = args

    return (<Value>(values: Dictionary<Value>) => {
      const result: Record<PropertyKey, unknown> = Object.create(null)

      for (const [key, value] of Object.entries(values)) {
        const mappedKey =
          typeof mapper === "string"
            ? getPropertyPathValue(value, mapper)
            : mapper(value, key, values)

        result[
          typeof mappedKey === "string" ||
          typeof mappedKey === "number" ||
          typeof mappedKey === "symbol"
            ? mappedKey
            : String(mappedKey)
        ] = value
      }

      return result
    }) as unknown
  }

  const [values, mapper] = args
  const result: Record<PropertyKey, unknown> = Object.create(null)

  for (const [key, value] of Object.entries(values)) {
    const mappedKey =
      typeof mapper === "string"
        ? getPropertyPathValue(value, mapper)
        : mapper(value, key, values)

    result[
      typeof mappedKey === "string" ||
      typeof mappedKey === "number" ||
      typeof mappedKey === "symbol"
        ? mappedKey
        : String(mappedKey)
    ] = value
  }

  return result as unknown
}

// authoritative pipe curry; path
/**
 * Returns a function that asynchronously maps object keys by accessing the
 * property denoted by the path selector.
 *
 * @example
 *   const values = { user: { id: "user-1" } }
 *   await mapKeysAsync("id")(values) // { "user-1": values.user }
 *
 * @param selector - The selector to apply.
 * @param options - The mapping options.
 */
export function mapKeysAsync<
  Value,
  Path extends SelectorPath<Value, Promisable<PropertyKey>> = SelectorPath<
    Value,
    Promisable<PropertyKey>
  >,
>(
  selector: Path,
  options?: MapAsyncOptions,
): (
  values: Dictionary<Value>,
) => Promise<Record<Awaited<Get<Value, Path>> & PropertyKey, Value>>

// generic curry; path
/**
 * Returns a function that asynchronously maps object keys by accessing the
 * property denoted by the path selector.
 *
 * @example
 *   const values = { user: { id: "user-1" } }
 *   await mapKeysAsync("id")(values) // { "user-1": values.user }
 *
 * @param selector - The selector to apply.
 * @param options - The mapping options.
 */
export function mapKeysAsync<Path extends string>(
  selector: Path,
  options?: MapAsyncOptions,
): <Value extends PathSatisfier<Path, Promisable<PropertyKey>>>(
  values: Dictionary<Value>,
) => Promise<Record<Awaited<Get<Value, Path>> & PropertyKey, Value>>

// authoritative pipe curry; mapper fn
/**
 * Returns a function that asynchronously maps object keys while preserving
 * values.
 *
 * @example
 *   const values = { first: 1 }
 *   await mapKeysAsync(async (_value, key) => key.toUpperCase())(values)
 *
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
export function mapKeysAsync<Value, MappedKey extends PropertyKey>(
  mapper: AsyncDictionaryMapper<NoInfer<Value>, MappedKey> &
    (unknown extends Value ? never : unknown),
  options?: MapAsyncOptions,
): (values: Dictionary<Value>) => Promise<Record<Awaited<MappedKey>, Value>>

// generic curry; mapper fn
/**
 * Returns a function that asynchronously maps object keys while preserving
 * values.
 *
 * @example
 *   const values = { first: 1 }
 *   await mapKeysAsync(async (_value: number, key) => key.toUpperCase())(
 *     values,
 *   )
 *
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
export function mapKeysAsync<Value, MappedKey extends PropertyKey>(
  mapper: AsyncDictionaryMapper<Value, MappedKey>,
  options?: MapAsyncOptions,
): <InputValue extends Value>(
  values: Dictionary<InputValue>,
) => Promise<Record<Awaited<MappedKey>, InputValue>>

// normal; path
/**
 * Asynchronously maps object keys by accessing the property denoted by the path
 * selector.
 *
 * @example
 *   const values = { user: { id: "user-1" } }
 *   await mapKeysAsync(values, "id") // { "user-1": values.user }
 *
 * @param values - The values to process.
 * @param selector - The selector to apply.
 * @param options - The mapping options.
 */
export function mapKeysAsync<
  Value,
  Path extends SelectorPath<Value, Promisable<PropertyKey>>,
>(
  values: Dictionary<Value>,
  selector: Path,
  options?: MapAsyncOptions,
): Promise<Record<Awaited<Get<Value, Path>> & PropertyKey, Value>>

// normal; mapper fn
/**
 * Asynchronously maps object keys while preserving values.
 *
 * @example
 *   const values = { first: 1 }
 *   await mapKeysAsync(values, async (_value, key) => key.toUpperCase())
 *
 * @param values - The values to process.
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
export function mapKeysAsync<Value, MappedKey extends PropertyKey>(
  values: Dictionary<Value>,
  mapper: AsyncDictionaryMapper<Value, MappedKey>,
  options?: MapAsyncOptions,
): Promise<Record<Awaited<MappedKey>, Value>>

export function mapKeysAsync(...args: MapDictionaryAsyncArgs<PropertyKey>) {
  if (isDictionaryAsyncDataFirstArgs(args)) {
    const [values, mapper, options] = args

    return mapAsyncItems(
      Object.entries(values),
      async ([key, value]) => {
        const mappedKey =
          typeof mapper === "string"
            ? await getPropertyPathValue(value, mapper)
            : await mapper(value, key, values)

        return [
          typeof mappedKey === "string" ||
          typeof mappedKey === "number" ||
          typeof mappedKey === "symbol"
            ? mappedKey
            : String(mappedKey),
          value,
        ] as const
      },
      options,
    ).then((mappedEntries) => {
      const result: Record<PropertyKey, unknown> = Object.create(null)

      for (const [key, value] of mappedEntries) {
        result[key] = value
      }

      return result
    }) as unknown
  }

  const [mapper, options] = args

  return (<Value>(values: Dictionary<Value>) =>
    mapAsyncItems(
      Object.entries(values),
      async ([key, value]) => {
        const mappedKey =
          typeof mapper === "string"
            ? getPropertyPathValue(value, mapper)
            : await mapper(value, key, values)

        return [
          typeof mappedKey === "string" ||
          typeof mappedKey === "number" ||
          typeof mappedKey === "symbol"
            ? mappedKey
            : String(mappedKey),
          value,
        ] as const
      },
      options,
    ).then((mappedEntries) => {
      const result: Record<PropertyKey, unknown> = Object.create(null)

      for (const [key, value] of mappedEntries) {
        result[key] = value
      }

      return result
    })) as unknown
}

// authoritative pipe curry; mapper fn
/**
 * Returns a function that maps object entries into a new object.
 *
 * @example
 *   const values = { a: 1 }
 *   mapEntries(([key, value]) => [key.toUpperCase(), value])(values)
 *
 * @param mapper - The mapper to apply.
 */
export function mapEntries<Value, MappedKey extends PropertyKey, MappedValue>(
  mapper: EntryMapper<NoInfer<Value>, MappedKey, MappedValue> &
    (unknown extends Value ? never : unknown),
): (values: Dictionary<Value>) => Record<MappedKey, MappedValue>

// generic curry; mapper fn
/**
 * Returns a function that maps object entries into a new object.
 *
 * @example
 *   const values = { a: 1 }
 *   mapEntries(([key, value]: readonly [string, number]) => [key, value])(
 *     values,
 *   )
 *
 * @param mapper - The mapper to apply.
 */
export function mapEntries<Value, MappedKey extends PropertyKey, MappedValue>(
  mapper: EntryMapper<Value, MappedKey, MappedValue>,
): <InputValue extends Value>(
  values: Dictionary<InputValue>,
) => Record<MappedKey, MappedValue>

// normal; mapper fn
/**
 * Maps object entries into a new object.
 *
 * @example
 *   const values = { a: 1 }
 *   mapEntries(values, ([key, value]) => [key.toUpperCase(), value])
 *
 * @param values - The values to process.
 * @param mapper - The mapper to apply.
 */
export function mapEntries<Value, MappedKey extends PropertyKey, MappedValue>(
  values: Dictionary<Value>,
  mapper: EntryMapper<Value, MappedKey, MappedValue>,
): Record<MappedKey, MappedValue>

export function mapEntries(
  ...args:
    | [mapper: EntryMapper]
    | [values: Dictionary<unknown>, mapper: EntryMapper]
) {
  if (args.length === 1) {
    const [mapper] = args

    return (<Value>(values: Dictionary<Value>) => {
      const result: Record<PropertyKey, unknown> = Object.create(null)
      for (const [index, entry] of Object.entries(values).entries()) {
        const [key, value] = mapper(entry, index, values)

        result[key] = value
      }

      return result
    }) as unknown
  }

  const [values, mapper] = args
  const result: Record<PropertyKey, unknown> = Object.create(null)
  for (const [index, entry] of Object.entries(values).entries()) {
    const [key, value] = mapper(entry, index, values)

    result[key] = value
  }

  return result as unknown
}

// authoritative pipe curry; mapper fn
/**
 * Returns a function that asynchronously maps object entries into a new object.
 *
 * @example
 *   const values = { a: 1 }
 *   await mapEntriesAsync(async ([key, value]) => [key, value])(values)
 *
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
export function mapEntriesAsync<
  Value,
  MappedKey extends PropertyKey,
  MappedValue,
>(
  mapper: AsyncEntryMapper<NoInfer<Value>, MappedKey, MappedValue> &
    (unknown extends Value ? never : unknown),
  options?: MapAsyncOptions,
): (
  values: Dictionary<Value>,
) => Promise<Record<MappedKey, Awaited<MappedValue>>>

// generic curry; mapper fn
/**
 * Returns a function that asynchronously maps object entries into a new object.
 *
 * @example
 *   const values = { a: 1 }
 *   await mapEntriesAsync(
 *     async ([key, value]: readonly [string, number]) => [key, value],
 *   )(values)
 *
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
export function mapEntriesAsync<
  Value,
  MappedKey extends PropertyKey,
  MappedValue,
>(
  mapper: AsyncEntryMapper<Value, MappedKey, MappedValue>,
  options?: MapAsyncOptions,
): <InputValue extends Value>(
  values: Dictionary<InputValue>,
) => Promise<Record<MappedKey, Awaited<MappedValue>>>

// normal; mapper fn
/**
 * Asynchronously maps object entries into a new object.
 *
 * @example
 *   const values = { a: 1 }
 *   await mapEntriesAsync(values, async ([key, value]) => [key, value])
 *
 * @param values - The values to process.
 * @param mapper - The mapper to apply.
 * @param options - The mapping options.
 */
export function mapEntriesAsync<
  Value,
  MappedKey extends PropertyKey,
  MappedValue,
>(
  values: Dictionary<Value>,
  mapper: AsyncEntryMapper<Value, MappedKey, MappedValue>,
  options?: MapAsyncOptions,
): Promise<Record<MappedKey, Awaited<MappedValue>>>

export function mapEntriesAsync(...args: MapEntriesAsyncArgs) {
  if (isEntriesAsyncDataFirstArgs(args)) {
    const [values, mapper, options] = args

    return mapAsyncItems(
      Object.entries(values),
      async (entry, index) => mapper(entry, index, values),
      options,
    ).then((mappedEntries) => {
      const result: Record<PropertyKey, unknown> = Object.create(null)

      for (const [key, value] of mappedEntries) {
        result[key] = value
      }

      return result
    }) as unknown
  }

  const [mapper, options] = args

  return (<Value>(values: Dictionary<Value>) =>
    mapAsyncItems(
      Object.entries(values),
      async (entry, index) => mapper(entry, index, values),
      options,
    ).then((mappedEntries) => {
      const result: Record<PropertyKey, unknown> = Object.create(null)

      for (const [key, value] of mappedEntries) {
        result[key] = value
      }

      return result
    })) as unknown
}
