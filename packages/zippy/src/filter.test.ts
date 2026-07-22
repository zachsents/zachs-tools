import { describe, expect, test } from "bun:test"

import { filter, filterOut } from "./filter"
import { isDefined, isNonNullish, isTruthy, propIsTruthy } from "./guards"
import type { IterableInput } from "./iterable"

type AEntry = { kind: "a"; value: number }
type User = { name: string; email?: string | null }

/**
 * Checks whether a test value is an A entry.
 *
 * @param value - The value to process.
 */
function isAEntry(value: unknown): value is AEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    value.kind === "a" &&
    "value" in value &&
    typeof value.value === "number"
  )
}

describe("filter", () => {
  test("keeps values matching a predicate", () => {
    expect(filter([1, 2, 3, 4], (value) => value % 2 === 0)).toEqual([2, 4])
  })

  test("keeps values matching a data-last predicate", () => {
    const keepEven: (values: IterableInput<number>) => number[] = filter(
      (value: number) => value % 2 === 0,
    )

    expect(keepEven([1, 2, 3, 4])).toEqual([2, 4])
  })

  test("keeps values matched by a type guard", () => {
    expect(
      filter(
        [{ kind: "a", value: 1 }, { kind: "b", value: "two" }, null],
        isAEntry,
      ),
    ).toEqual([{ kind: "a", value: 1 }])
  })

  test("keeps values matched by a data-last type guard", () => {
    const onlyAValues: (values: IterableInput<unknown>) => AEntry[] =
      filter(isAEntry)

    expect(
      onlyAValues([{ kind: "a", value: 1 }, { kind: "b", value: "two" }, null]),
    ).toEqual([{ kind: "a", value: 1 }])
  })

  test("keeps values matched by a value guard", () => {
    expect(
      filter(
        [0, 1, "", "zippy", false, true, null, undefined, 0n, 2n],
        isTruthy,
      ),
    ).toEqual([1, "zippy", true, 2n])
  })

  test("keeps values matched by a data-last value guard", () => {
    const keepPresent: (
      values: IterableInput<number | null | undefined>,
    ) => number[] = filter(isNonNullish)

    expect(keepPresent([1, null, 2, undefined])).toEqual([1, 2])
  })

  test("keeps values from iterable inputs", () => {
    expect(filter(new Set([1, 2, 3, 4]), (value) => value % 2 === 0)).toEqual([
      2, 4,
    ])
  })

  test("passes a materialized source array for iterable inputs", () => {
    const values = new Set([1, 2, 3])
    const sources: Array<readonly number[]> = []

    expect(
      filter(values, (value, _index, source) => {
        sources.push(source)

        return value > 1
      }),
    ).toEqual([2, 3])
    expect(sources).toHaveLength(3)
    expect(sources.every((source) => source === sources[0])).toBe(true)
    expect(sources[0]).toEqual([1, 2, 3])
    expect(sources[0]).not.toBe(values)
  })

  test("keeps values matched by a property guard", () => {
    const users: User[] = [
      { name: "Ada", email: "ada@example.com" },
      { name: "Linus", email: null },
      { name: "Grace" },
    ]

    expect(filter(users, propIsTruthy("email"))).toEqual([
      { name: "Ada", email: "ada@example.com" },
    ])
  })
})

describe("filterOut", () => {
  test("removes values matching a predicate", () => {
    expect(filterOut([1, 2, 3, 4], (value) => value % 2 === 0)).toEqual([1, 3])
  })

  test("removes values matching a data-last predicate", () => {
    const removeEven: (values: IterableInput<number>) => number[] = filterOut(
      (value: number) => value % 2 === 0,
    )

    expect(removeEven([1, 2, 3, 4])).toEqual([1, 3])
  })

  test("removes values matched by a type guard", () => {
    expect(
      filterOut(
        [{ kind: "a", value: 1 }, { kind: "b", value: "two" }, null],
        isAEntry,
      ),
    ).toEqual([{ kind: "b", value: "two" }, null])
  })

  test("removes values matched by a data-last type guard", () => {
    const withoutAValues: (values: IterableInput<AEntry | null>) => null[] =
      filterOut(isAEntry)

    expect(withoutAValues([{ kind: "a", value: 1 }, null])).toEqual([null])
  })

  test("removes values matched by a value guard", () => {
    expect(filterOut([1, null, undefined, void 0], isDefined)).toEqual([
      undefined,
      undefined,
    ])
  })

  test("removes values matched by a data-last value guard", () => {
    const removeDefined: (
      values: IterableInput<number | null | undefined | void>,
    ) => Array<undefined | void> = filterOut(isDefined)

    expect(removeDefined([1, null, undefined, void 0])).toEqual([
      undefined,
      undefined,
    ])
  })

  test("removes values matched by a property guard", () => {
    const users: User[] = [
      { name: "Ada", email: "ada@example.com" },
      { name: "Linus", email: null },
      { name: "Grace" },
    ]

    expect(filterOut(users, propIsTruthy("email"))).toEqual([
      { name: "Linus", email: null },
      { name: "Grace" },
    ])
  })

  test("removes values from iterable inputs", () => {
    expect(
      filterOut(new Set([1, 2, 3, 4]), (value) => value % 2 === 0),
    ).toEqual([1, 3])
  })
})
