import { describe, expect, test } from "bun:test"

import { zip } from "./zip"

describe("zip", () => {
  test("pairs values by index", () => {
    expect(zip(["a", "b"], [1, 2])).toEqual([
      ["a", 1],
      ["b", 2],
    ])
  })

  test("pairs values by index data-last", () => {
    expect(zip([1, 2])(["a", "b"])).toEqual([
      ["a", 1],
      ["b", 2],
    ])
  })

  test("pairs iterable values by index", () => {
    expect(zip(new Set(["a", "b"]), new Uint8Array([1, 2]))).toEqual([
      ["a", 1],
      ["b", 2],
    ])
  })

  test("materializes data-last right iterables once", () => {
    const zipWithRightValues = zip([1, 2].values())

    expect(zipWithRightValues(["a", "b"])).toEqual([
      ["a", 1],
      ["b", 2],
    ])
    expect(zipWithRightValues(["c", "d"])).toEqual([
      ["c", 1],
      ["d", 2],
    ])
  })

  test("merges paired values by index", () => {
    expect(
      zip(["a", "b"], [1, 2], (leftValue, rightValue) => {
        return `${leftValue}:${rightValue}`
      }),
    ).toEqual(["a:1", "b:2"])
  })

  test("merges paired values by index data-last", () => {
    expect(
      zip([1, 2], (leftValue: string, rightValue) => {
        return `${leftValue}:${rightValue}`
      })(["a", "b"]),
    ).toEqual(["a:1", "b:2"])
  })

  test("returns an empty array when either input is empty", () => {
    expect(zip([], [1, 2])).toEqual([])
    expect(zip(["a", "b"], [])).toEqual([])
    expect(zip([1, 2])([])).toEqual([])
  })

  test("truncates to the shorter array", () => {
    expect(zip(["a", "b"], [1, 2, 3])).toEqual([
      ["a", 1],
      ["b", 2],
    ])
    expect(zip(["a", "b", "c"], [1, 2])).toEqual([
      ["a", 1],
      ["b", 2],
    ])
    expect(
      zip(["a", "b", "c"], [1, 2], (leftValue, rightValue) => {
        return `${leftValue}:${rightValue}`
      }),
    ).toEqual(["a:1", "b:2"])
    expect(
      zip([1, 2], (leftValue: string, rightValue) => {
        return `${leftValue}:${rightValue}`
      })(["a", "b", "c"]),
    ).toEqual(["a:1", "b:2"])
  })

  test("preserves undefined values", () => {
    expect(zip([undefined, "b"], [1, undefined])).toEqual([
      [undefined, 1],
      ["b", undefined],
    ])
  })

  test("passes index and source arrays to the merger", () => {
    const leftValues = ["z", "i"]
    const rightValues = [1, 2]
    const sourcesMatch: boolean[] = []

    expect(
      zip(
        leftValues,
        rightValues,
        (leftValue, rightValue, index, left, right) => {
          sourcesMatch.push(left === leftValues && right === rightValues)

          return `${index}:${leftValue}:${rightValue}`
        },
      ),
    ).toEqual(["0:z:1", "1:i:2"])
    expect(sourcesMatch).toEqual([true, true])
  })

  test("passes index and source arrays to data-last mergers", () => {
    const leftValues = ["z", "i"]
    const rightValues = [1, 2]
    const sourcesMatch: boolean[] = []

    expect(
      zip(rightValues, (leftValue: string, rightValue, index, left, right) => {
        sourcesMatch.push(left === leftValues && right === rightValues)

        return `${index}:${leftValue}:${rightValue}`
      })(leftValues),
    ).toEqual(["0:z:1", "1:i:2"])
    expect(sourcesMatch).toEqual([true, true])
  })

  test("passes materialized source arrays to iterable mergers", () => {
    const sources: Array<{
      left: readonly string[]
      right: readonly number[]
    }> = []

    expect(
      zip(
        new Set(["z", "i"]),
        new Set([1, 2]),
        (leftValue, rightValue, index, left, right) => {
          sources.push({ left, right })

          return `${index}:${leftValue}:${rightValue}`
        },
      ),
    ).toEqual(["0:z:1", "1:i:2"])
    expect(sources).toHaveLength(2)
    expect(sources.every((source) => source.left === sources[0]!.left)).toBe(
      true,
    )
    expect(sources.every((source) => source.right === sources[0]!.right)).toBe(
      true,
    )
    expect(sources[0]).toEqual({ left: ["z", "i"], right: [1, 2] })
  })
})
