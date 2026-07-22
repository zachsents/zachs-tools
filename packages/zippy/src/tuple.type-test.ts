// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { tuple } from "./tuple"

const emptyTuple = tuple()
const literalTuple = tuple("a", 1, true)
const objectTuple = tuple({ id: "a" } as const, ["b"] as const)
const manyValueTuple = tuple(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)

true satisfies IsEqual<typeof emptyTuple, []>
true satisfies IsEqual<typeof literalTuple, ["a", 1, true]>
true satisfies IsEqual<
  typeof objectTuple,
  [{ readonly id: "a" }, readonly ["b"]]
>
true satisfies IsEqual<
  typeof manyValueTuple,
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
>
