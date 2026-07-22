// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { castArray } from "./cast-array"

const castArrayDataFirst = castArray("zippy" as const)
const castArrayDataLast = castArray()("zippy" as const)

true satisfies IsEqual<typeof castArrayDataFirst, Array<"zippy">>
true satisfies IsEqual<typeof castArrayDataLast, Array<"zippy">>

const readonlyArrayDataFirst = castArray([1, 2] as const)
const readonlyArrayDataLast = castArray()([1, 2] as const)

true satisfies IsEqual<typeof readonlyArrayDataFirst, readonly [1, 2]>
true satisfies IsEqual<typeof readonlyArrayDataLast, readonly [1, 2]>

/** Named fixture for reusable-value inference checks involving mutableArray. */
const mutableArray = [1, 2] as Array<1 | 2>
const mutableArrayDataFirst = castArray(mutableArray)
const mutableArrayDataLast = castArray()(mutableArray)

true satisfies IsEqual<typeof mutableArrayDataFirst, Array<1 | 2>>
true satisfies IsEqual<typeof mutableArrayDataLast, Array<1 | 2>>

const undefinedDataFirst = castArray(undefined)
const undefinedDataLast = castArray()(undefined)

true satisfies IsEqual<typeof undefinedDataFirst, []>
true satisfies IsEqual<typeof undefinedDataLast, []>

const nullDataFirst = castArray(null)
const nullDataLast = castArray()(null)

true satisfies IsEqual<typeof nullDataFirst, Array<null>>
true satisfies IsEqual<typeof nullDataLast, Array<null>>

const falseDataFirst = castArray(false as const)
const falseDataLast = castArray()(false as const)
const zeroDataFirst = castArray(0 as const)
const zeroDataLast = castArray()(0 as const)
const emptyStringDataFirst = castArray("" as const)
const emptyStringDataLast = castArray()("" as const)

true satisfies IsEqual<typeof falseDataFirst, Array<false>>
true satisfies IsEqual<typeof falseDataLast, Array<false>>
true satisfies IsEqual<typeof zeroDataFirst, Array<0>>
true satisfies IsEqual<typeof zeroDataLast, Array<0>>
true satisfies IsEqual<typeof emptyStringDataFirst, Array<"">>
true satisfies IsEqual<typeof emptyStringDataLast, Array<"">>

declare const voidValue: void

const voidDataFirst = castArray(voidValue)
const voidDataLast = castArray()(voidValue)

true satisfies IsEqual<typeof voidDataFirst, []>
true satisfies IsEqual<typeof voidDataLast, []>

declare const maybeValue: "zippy" | void

const maybeDataFirst = castArray(maybeValue)
const maybeDataLast = castArray()(maybeValue)

true satisfies IsEqual<typeof maybeDataFirst, Array<"zippy">>
true satisfies IsEqual<typeof maybeDataLast, Array<"zippy">>

declare const maybeNullishValue: "zippy" | null | void

const maybeNullishDataFirst = castArray(maybeNullishValue)
const maybeNullishDataLast = castArray()(maybeNullishValue)

true satisfies IsEqual<typeof maybeNullishDataFirst, Array<"zippy" | null>>
true satisfies IsEqual<typeof maybeNullishDataLast, Array<"zippy" | null>>

declare const arrayOrValue: readonly [1, 2] | "zippy"

const arrayOrValueDataFirst = castArray(arrayOrValue)
const arrayOrValueDataLast = castArray()(arrayOrValue)

true satisfies IsEqual<typeof arrayOrValueDataFirst, Array<1 | 2 | "zippy">>
true satisfies IsEqual<typeof arrayOrValueDataLast, Array<1 | 2 | "zippy">>
