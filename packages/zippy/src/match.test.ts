import { describe, expect, test } from "bun:test"

import { match, matchMerge } from "./match"

describe("match", () => {
  test("matches values with a custom matcher", () => {
    const leftB = { id: "b", label: "B" }
    const leftA = { id: "a", label: "A" }
    const rightA = { id: "a", count: 1 }
    const rightB = { id: "b", count: 2 }

    expect(
      match(
        [leftB, leftA, { id: "missing", label: "Missing" }],
        [rightA, rightB, { id: "b", count: 3 }],
        (leftValue, rightValue) => leftValue.id === rightValue.id,
      ),
    ).toEqual([
      [leftB, rightB],
      [leftA, rightA],
    ])
  })

  test("matches values with a property path matcher", () => {
    const leftB = { id: "b", label: "B" }
    const leftA = { id: "a", label: "A" }
    const rightA = { id: "a", count: 1 }
    const rightB = { id: "b", count: 2 }

    expect(
      match(
        [leftB, leftA, { id: "missing", label: "Missing" }],
        [rightA, rightB, { id: "b", count: 3 }],
        "id",
      ),
    ).toEqual([
      [leftB, rightB],
      [leftA, rightA],
    ])
  })

  test("matches iterable values with a property path matcher", () => {
    const leftA = { id: "a", label: "A" }
    const leftB = { id: "b", label: "B" }
    const rightA = { id: "a", count: 1 }
    const rightB = { id: "b", count: 2 }

    expect(
      match(new Set([leftB, leftA]), new Set([rightA, rightB]), "id"),
    ).toEqual([
      [leftB, rightB],
      [leftA, rightA],
    ])
  })

  test("matches values data-last with a dot path matcher", () => {
    const leftFirst = { user: { id: "first" }, label: "A" }
    const leftSecond = { user: { id: "second" }, label: "B" }
    const rightSecond = { user: { id: "second" }, count: 2 }
    const rightFirst = { user: { id: "first" }, count: 1 }

    expect(
      match([rightSecond, rightFirst], "user.id")([leftFirst, leftSecond]),
    ).toEqual([
      [leftFirst, rightFirst],
      [leftSecond, rightSecond],
    ])
  })

  test("materializes data-last right iterables once", () => {
    const leftA = { id: "a", label: "A" }
    const leftB = { id: "b", label: "B" }
    const rightA = { id: "a", count: 1 }
    const rightB = { id: "b", count: 2 }

    /**
     * Implements the runtime dispatch for rightValues.
     *
     * @yields The right-side values.
     */
    function* rightValues() {
      yield rightB
      yield rightA
    }

    const matchRightValues = match(rightValues(), "id")

    expect(matchRightValues([leftA, leftB])).toEqual([
      [leftA, rightA],
      [leftB, rightB],
    ])
    expect(matchRightValues([leftB])).toEqual([[leftB, rightB]])
  })

  test("matches values data-last with a custom matcher", () => {
    const leftA = { id: "a", label: "A" }
    const leftB = { id: "b", label: "B" }
    const rightB = { id: "b", count: 2 }
    const rightA = { id: "a", count: 1 }

    expect(
      match(
        [rightB, rightA],
        (leftValue: { id: string; label: string }, rightValue) =>
          leftValue.id === rightValue.id,
      )([leftA, leftB]),
    ).toEqual([
      [leftA, rightA],
      [leftB, rightB],
    ])
  })

  test("uses SameValueZero equality for property path matchers", () => {
    const leftNaN = { id: NaN, label: "left" }
    const rightNaN = { id: NaN, count: 1 }

    expect(match([leftNaN], [rightNaN], "id")).toEqual([[leftNaN, rightNaN]])
  })

  test("passes indexes and source arrays to the matcher", () => {
    const leftValues = ["z", "i"] as const
    const rightValues = ["skip", "z", "i"] as const
    const calls: Array<{
      leftIndex: number
      rightIndex: number
      leftValue: string
      rightValue: string
      sameSources: boolean
    }> = []

    expect(
      match(
        leftValues,
        rightValues,
        (leftValue, rightValue, leftIndex, rightIndex, left, right) => {
          calls.push({
            leftIndex,
            rightIndex,
            leftValue,
            rightValue,
            sameSources: left === leftValues && right === rightValues,
          })

          return leftValue === rightValue && leftIndex + 1 === rightIndex
        },
      ),
    ).toEqual([
      ["z", "z"],
      ["i", "i"],
    ])
    expect(calls).toEqual([
      {
        leftIndex: 0,
        rightIndex: 0,
        leftValue: "z",
        rightValue: "skip",
        sameSources: true,
      },
      {
        leftIndex: 0,
        rightIndex: 1,
        leftValue: "z",
        rightValue: "z",
        sameSources: true,
      },
      {
        leftIndex: 1,
        rightIndex: 0,
        leftValue: "i",
        rightValue: "skip",
        sameSources: true,
      },
      {
        leftIndex: 1,
        rightIndex: 2,
        leftValue: "i",
        rightValue: "i",
        sameSources: true,
      },
    ])
  })

  test("passes materialized source arrays to iterable matchers", () => {
    const sources: Array<{
      left: readonly string[]
      right: readonly string[]
    }> = []

    expect(
      match(
        new Set(["z", "i"]),
        new Set(["skip", "z", "i"]),
        (leftValue, rightValue, _leftIndex, _rightIndex, left, right) => {
          sources.push({ left, right })

          return leftValue === rightValue
        },
      ),
    ).toEqual([
      ["z", "z"],
      ["i", "i"],
    ])
    expect(sources).toHaveLength(4)
    expect(sources.every((source) => source.left === sources[0]!.left)).toBe(
      true,
    )
    expect(sources.every((source) => source.right === sources[0]!.right)).toBe(
      true,
    )
    expect(sources[0]).toEqual({ left: ["z", "i"], right: ["skip", "z", "i"] })
  })
})

describe("matchMerge", () => {
  test("matches and shallow merges objects with a property path matcher", () => {
    expect(
      matchMerge(
        [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        [
          { id: "a", label: "right A", count: 1 },
          { id: "b", label: "right B", count: 2 },
        ],
        "id",
      ),
    ).toEqual([
      { id: "a", label: "right A", count: 1 },
      { id: "b", label: "right B", count: 2 },
    ])
  })

  test("matches and shallow merges objects with a matcher", () => {
    expect(
      matchMerge(
        [
          { id: "b", label: "B" },
          { id: "a", label: "A" },
          { id: "missing", label: "Missing" },
        ],
        [
          { id: "a", count: 1 },
          { id: "b", count: 2 },
          { id: "b", count: 3 },
        ],
        (leftValue, rightValue) => leftValue.id === rightValue.id,
      ),
    ).toEqual([
      { id: "b", label: "B", count: 2 },
      { id: "a", label: "A", count: 1 },
    ])
  })

  test("matches and shallow merges objects data-last with a path matcher", () => {
    expect(
      matchMerge(
        [
          { id: "second", count: 2 },
          { id: "first", count: 1 },
        ],
        "id",
      )([
        { id: "first", label: "A" },
        { id: "second", label: "B" },
      ]),
    ).toEqual([
      { id: "first", label: "A", count: 1 },
      { id: "second", label: "B", count: 2 },
    ])
  })

  test("matches and shallow merges iterable objects", () => {
    expect(
      matchMerge(
        new Set([
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ]),
        new Set([
          { id: "a", count: 1 },
          { id: "b", count: 2 },
        ]),
        "id",
      ),
    ).toEqual([
      { id: "a", label: "A", count: 1 },
      { id: "b", label: "B", count: 2 },
    ])
  })

  test("matches and shallow merges objects data-last with a matcher", () => {
    expect(
      matchMerge(
        [
          { id: "second", count: 2 },
          { id: "first", count: 1 },
        ],
        (leftValue: { id: string; label: string }, rightValue) =>
          leftValue.id === rightValue.id,
      )([
        { id: "first", label: "A" },
        { id: "second", label: "B" },
      ]),
    ).toEqual([
      { id: "first", label: "A", count: 1 },
      { id: "second", label: "B", count: 2 },
    ])
  })
})
