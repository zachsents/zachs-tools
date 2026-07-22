// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { identity } from "./identity"

const stringLiteral = identity("zippy" as const)
const numberLiteral = identity(1 as const)
const booleanLiteral = identity(false as const)
const objectLiteral = identity({ name: "zippy", enabled: true } as const)
const tupleLiteral = identity(["zippy", 1, false] as const)

true satisfies IsEqual<typeof stringLiteral, "zippy">
true satisfies IsEqual<typeof numberLiteral, 1>
true satisfies IsEqual<typeof booleanLiteral, false>
true satisfies IsEqual<
  typeof objectLiteral,
  { readonly name: "zippy"; readonly enabled: true }
>
true satisfies IsEqual<typeof tupleLiteral, readonly ["zippy", 1, false]>

declare const unionValue:
  | { readonly kind: "first"; readonly value: 1 }
  | { readonly kind: "second"; readonly value: 2 }
declare const unknownValue: unknown
declare const neverValue: never

const unionResult = identity(unionValue)
const unknownResult = identity(unknownValue)
const neverResult = identity(neverValue)

true satisfies IsEqual<typeof unionResult, typeof unionValue>
true satisfies IsEqual<typeof unknownResult, unknown>
true satisfies IsEqual<typeof neverResult, never>
