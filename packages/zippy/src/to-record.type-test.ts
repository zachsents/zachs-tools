// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { toRecord } from "./to-record"

/** Named fixture shared by data-first and data-last inference checks. */
const literalEntries = [
  ["name", "zippy"],
  ["count", 2],
] as const
const literalDataFirst = toRecord(literalEntries)
const literalDataLast = toRecord()(literalEntries)

true satisfies IsEqual<typeof literalDataFirst, { name: "zippy"; count: 2 }>
true satisfies IsEqual<typeof literalDataLast, { name: "zippy"; count: 2 }>

declare const entryIterator: Iterator<readonly [string, { id: number }]>

const iteratorResult = toRecord(entryIterator)

true satisfies IsEqual<typeof iteratorResult, Record<string, { id: number }>>

declare const entryIterable: Iterable<readonly ["enabled" | "visible", boolean]>

const iterableResult = toRecord(entryIterable)

true satisfies IsEqual<
  typeof iterableResult,
  { enabled: boolean; visible: boolean }
>

declare const entryContainer: {
  entries(): Iterator<readonly [string, number]>
}

const entryContainerResult = toRecord(entryContainer)

true satisfies IsEqual<typeof entryContainerResult, Record<string, number>>

declare const headers: Headers

const headersResult = toRecord(headers)

true satisfies IsEqual<typeof headersResult, Record<string, string>>

const mapResult = toRecord(
  new Map<"name" | "kind", string>([
    ["name", "zippy"],
    ["kind", "utility"],
  ]),
)

true satisfies IsEqual<typeof mapResult, { name: string; kind: string }>

declare const symbolKey: unique symbol

const propertyKeyResult = toRecord([
  [1, "number"] as const,
  [symbolKey, "symbol"] as const,
])

true satisfies IsEqual<
  typeof propertyKeyResult,
  { 1: "number"; [symbolKey]: "symbol" }
>
