import { describe, expect, test } from "bun:test"

import {
  completionMarker,
  getStringLiteralCompletionNames,
} from "./lib/autocomplete-test-utils"
import { unique } from "./unique"

describe("unique", () => {
  test("returns values without duplicates", () => {
    expect(unique([1, 2, 1, 3, 2])).toEqual([1, 2, 3])
  })

  test("returns a pipeable function when called without values", () => {
    const uniqueValues: (values: readonly number[]) => number[] = unique()

    expect(uniqueValues([1, 2, 1, 3, 2])).toEqual([1, 2, 3])
    expect(unique()(["z", "i", "p", "p", "y"])).toEqual(["z", "i", "p", "y"])
  })

  test("preserves first occurrence order", () => {
    expect(unique(["z", "i", "p", "p", "y"])).toEqual(["z", "i", "p", "y"])
  })

  test("deduplicates by SameValueZero equality", () => {
    expect(unique([NaN, NaN, 0, -0])).toEqual([NaN, 0])
  })

  test("keeps distinct object references", () => {
    const first = { name: "zippy" }
    const second = { name: "zippy" }

    expect(unique([first, second, first])).toEqual([first, second])
  })

  test("returns unique values from iterable inputs", () => {
    expect(unique(["z", "i", "p", "p", "y"].values())).toEqual([
      "z",
      "i",
      "p",
      "y",
    ])
  })
})

describe("unique selectors", () => {
  test("returns values with unique selected keys", () => {
    expect(
      unique(
        [
          { id: 1, name: "first" },
          { id: 2, name: "second" },
          { id: 1, name: "duplicate" },
        ],
        (value) => value.id,
      ),
    ).toEqual([
      { id: 1, name: "first" },
      { id: 2, name: "second" },
    ])
  })

  test("accepts a property path selector", () => {
    expect(
      unique(
        [
          { user: { id: 1 }, name: "first" },
          { user: { id: 2 }, name: "second" },
          { user: { id: 1 }, name: "duplicate" },
        ],
        "user.id",
      ),
    ).toEqual([
      { user: { id: 1 }, name: "first" },
      { user: { id: 2 }, name: "second" },
    ])
  })

  test("passes index and source array to the selector", () => {
    const values = [{ id: 1 }, { id: 1 }]
    const sourcesMatch: boolean[] = []

    expect(
      unique(values, (value, index, source) => {
        sourcesMatch.push(source === values)

        return value.id + index
      }),
    ).toEqual(values)
    expect(sourcesMatch).toEqual([true, true])
  })

  test("returns a pipeable function", () => {
    expect(
      unique("id")([
        { id: 1, name: "first" },
        { id: 2, name: "second" },
        { id: 1, name: "duplicate" },
      ]),
    ).toEqual([
      { id: 1, name: "first" },
      { id: 2, name: "second" },
    ])
  })
})

describe("unique autocomplete", () => {
  test("completes path selectors from data-first values", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { unique } from "./unique"

        const values = [
          { id: 1, label: "one", stats: { score: 2, name: "Ada" } },
        ]

        unique(values, "${completionMarker}")
      `),
    ).toEqual(["id", "label", "stats", "stats.name", "stats.score"])
  })

  test("does not complete data-last path selectors without value context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { unique } from "./unique"

        unique("${completionMarker}")
      `),
    ).toEqual([])
  })

  test("completes path selectors from an explicit data-last value type", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { unique } from "./unique"

        type Value = {
          id: number
          label: string
          stats: {
            score: number
            name: string
          }
        }

        unique<Value>("${completionMarker}")
      `),
    ).toEqual(["id", "label", "stats", "stats.name", "stats.score"])
  })

  test("completes path selectors from pipe context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { pipe } from "./pipe"
        import { unique } from "./unique"

        const values = [
          { id: 1, label: "one", stats: { score: 2, name: "Ada" } },
        ]

        pipe(values, unique("${completionMarker}"))
      `),
    ).toEqual(["id", "label", "stats", "stats.name", "stats.score"])
  })
})
