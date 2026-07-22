import type { Merge, MergeDeep } from "type-fest"

import { isPlainObject } from "./guards"

/**
 * Shallowly merges a source object into a destination object.
 *
 * @param destination - The destination object.
 * @param source - The source object.
 */
function mergeValues<Destination extends object, Source extends object>(
  destination: Destination,
  source: Source,
): Merge<Destination, Source> {
  // @ts-expect-error TypeScript models Object.assign as an intersection, but
  // object spread semantics overwrite destination keys with source keys.
  return Object.assign({}, destination, source)
}

/**
 * Recursively merges a source object into a destination object.
 *
 * @param destination - The destination object.
 * @param source - The source object.
 */
function deepMergeValues<Destination extends object, Source extends object>(
  destination: Destination,
  source: Source,
): MergeDeep<Destination, Source> {
  const result = Object.assign({}, destination) as Partial<
    Record<PropertyKey, unknown>
  >
  for (const key of Reflect.ownKeys(source)) {
    if (!Object.prototype.propertyIsEnumerable.call(source, key)) {
      continue
    }

    const destinationValue = (
      destination as Partial<Record<PropertyKey, unknown>>
    )[key]
    const sourceValue = (source as Partial<Record<PropertyKey, unknown>>)[key]

    result[key] =
      isPlainObject(destinationValue) && isPlainObject(sourceValue)
        ? deepMergeValues(destinationValue, sourceValue)
        : sourceValue
  }

  // @ts-expect-error The loop mirrors MergeDeep's plain-object recursion, but
  // TypeScript cannot prove the dynamic key assignments produce that type.
  return result
}

/**
 * Shallowly merges objects, directly or in data-last form.
 *
 * @example
 *   merge({ a: 1 }, { b: 2 }) // { a: 1, b: 2 }
 *
 * @param destination - The destination object.
 * @param source - The source object.
 */
export function merge<Destination extends object, Source extends object>(
  destination: Destination,
  source: Source,
): Merge<Destination, Source>

/**
 * Shallowly merges objects, directly or in data-last form.
 *
 * @example
 *   merge({ b: 2 })({ a: 1 }) // { a: 1, b: 2 }
 *
 * @param source - The source object.
 */
export function merge<Source extends object>(
  source: Source,
): <Destination extends object>(
  destination: Destination,
) => Merge<Destination, Source>
export function merge<Destination extends object, Source extends object>(
  ...args: [destination: Destination, source: Source] | [source: Source]
) {
  if (args.length === 1) {
    const [source] = args

    return (destination: Destination) => mergeValues(destination, source)
  }

  const [destination, source] = args

  return mergeValues(destination, source)
}

/**
 * Deeply merges objects, directly or in data-last form.
 *
 * @example
 *   deepMerge({ config: { retries: 1 } }, { config: { timeout: 100 } }) // { config: { retries: 1, timeout: 100 } }
 *
 * @param destination - The destination object.
 * @param source - The source object.
 */
export function deepMerge<Destination extends object, Source extends object>(
  destination: Destination,
  source: Source,
): MergeDeep<Destination, Source>

/**
 * Deeply merges objects, directly or in data-last form.
 *
 * @example
 *   deepMerge({ config: { timeout: 100 } })({ config: { retries: 1 } }) // { config: { retries: 1, timeout: 100 } }
 *
 * @param source - The source object.
 */
export function deepMerge<Source extends object>(
  source: Source,
): <Destination extends object>(
  destination: Destination,
) => MergeDeep<Destination, Source>
export function deepMerge<Destination extends object, Source extends object>(
  ...args: [destination: Destination, source: Source] | [source: Source]
) {
  if (args.length === 1) {
    const [source] = args

    return (destination: Destination) => deepMergeValues(destination, source)
  }

  const [destination, source] = args

  return deepMergeValues(destination, source)
}
