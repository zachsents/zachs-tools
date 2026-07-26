import { isIterableInput } from "./iterable"

type Entry = readonly [PropertyKey, unknown]

type EntrySource<Value extends Entry> =
  | Iterable<Value>
  | Iterator<Value>
  | {
      readonly [Symbol.iterator]?: never
      entries(): Iterator<Value>
    }

type EntriesRecord<Value extends Entry> = {
  [EntryValue in Value as EntryValue[0]]: EntryValue[1]
}

/**
 * Converts entries to a record, directly or in data-last form.
 *
 * @example
 *   toRecord()(
 *     new Map([
 *       ["name", "zippy"],
 *       ["kind", "utility"],
 *     ]),
 *   ) // { name: "zippy", kind: "utility" }
 */
export function toRecord(): <const Value extends Entry>(
  source: EntrySource<Value>,
) => EntriesRecord<Value>

/**
 * Converts entries to a record, directly or in data-last form.
 *
 * Accepts an iterable or iterator of key-value tuples, or a non-iterable value
 * whose `entries()` method returns such an iterator.
 *
 * @example
 *   toRecord(
 *     new Map([
 *       ["name", "zippy"],
 *       ["kind", "utility"],
 *     ]),
 *   ) // { name: "zippy", kind: "utility" }
 *
 * @param source - The entries or value exposing entries to convert.
 */
export function toRecord<const Value extends Entry>(
  source: EntrySource<Value>,
): EntriesRecord<Value>
export function toRecord(...args: [] | [source: EntrySource<Entry>]) {
  if (args.length === 0) {
    return toRecordValues
  }

  return toRecordValues(args[0])
}

/**
 * Converts a normalized entry source to a record.
 *
 * @param source - The normalized source to convert.
 */
function toRecordValues<const Value extends Entry>(
  source: EntrySource<Value>,
): EntriesRecord<Value> {
  const iterator =
    "next" in source
      ? source
      : isIterableInput<Value>(source)
        ? source[Symbol.iterator]()
        : source.entries()

  // @ts-expect-error Object.fromEntries loses literal key/value relationships.
  return Object.fromEntries({
    [Symbol.iterator]: () => iterator,
  })
}
