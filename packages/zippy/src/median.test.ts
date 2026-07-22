import { describe, expect, test } from "bun:test"

import {
  completionMarker,
  getStringLiteralCompletionNames,
} from "./lib/autocomplete-test-utils"
import { median } from "./median"

describe("median", () => {
  test("returns the middle sorted number for odd-length arrays", () => {
    expect(median([9, 2, 4])).toBe(4)
  })

  test("returns the average of the middle sorted numbers for even-length arrays", () => {
    expect(median([10, 2, 4, 8])).toBe(6)
  })

  test("does not mutate the input array", () => {
    const values = [3, 1, 2]

    expect(median(values)).toBe(2)
    expect(values).toEqual([3, 1, 2])
  })

  test("returns undefined for an empty array", () => {
    expect(median([])).toBeUndefined()
  })

  test("returns the median data-last", () => {
    expect(median()([10, 2, 4, 8])).toBe(6)
  })

  test("returns the median for iterable numbers", () => {
    expect(median([10, 2, 4, 8].values())).toBe(6)
  })
})

describe("median selectors", () => {
  test("returns the median of mapped numbers", () => {
    expect(
      median(
        [{ score: 10 }, { score: 2 }, { score: 4 }, { score: 8 }],
        (value) => value.score,
      ),
    ).toBe(6)
  })

  test("returns the median of numbers selected by property path", () => {
    expect(
      median(
        [{ score: 10 }, { score: 2 }, { score: 4 }, { score: 8 }],
        "score",
      ),
    ).toBe(6)
  })

  test("returns the median of numbers selected by dot path", () => {
    expect(
      median(
        [
          { stats: { score: 10 } },
          { stats: { score: 2 } },
          { stats: { score: 4 } },
          { stats: { score: 8 } },
        ],
        "stats.score",
      ),
    ).toBe(6)
  })

  test("returns undefined for an empty array", () => {
    expect(median([], () => 1)).toBeUndefined()
  })

  test("returns the median of mapped numbers data-last", () => {
    expect(
      median((value: { score: number }) => value.score)([
        { score: 10 },
        { score: 2 },
        { score: 4 },
        { score: 8 },
      ]),
    ).toBe(6)
  })

  test("passes index and source array to the mapper data-last", () => {
    const values = [{ score: 10 }, { score: 2 }, { score: 4 }, { score: 8 }]
    const sourcesMatch: boolean[] = []

    expect(
      median((value: { score: number }, index, source) => {
        sourcesMatch.push(source === values)

        return value.score + index
      })(values),
    ).toBe(8)
    expect(sourcesMatch).toEqual([true, true, true, true])
  })

  test("returns the median of property path numbers data-last", () => {
    expect(median("score")([{ score: 10 }, { score: 2 }])).toBe(6)
  })

  test("returns the median of dot path numbers data-last", () => {
    expect(
      median("stats.score")([
        { stats: { score: 10 } },
        { stats: { score: 2 } },
      ]),
    ).toBe(6)
  })
})

describe("median autocomplete", () => {
  test("completes numeric path selectors from data-first values", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { median } from "./median"

        const values = [
          { score: 1, label: "one", stats: { score: 2, name: "Ada" } },
        ]

        median(values, "${completionMarker}")
      `),
    ).toEqual(["score", "stats.score"])
  })

  test("does not complete data-last path selectors without value context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { median } from "./median"

        median("${completionMarker}")
      `),
    ).toEqual([])
  })

  test("completes numeric path selectors from an explicit data-last value type", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { median } from "./median"

        type Value = {
          score: number
          label: string
          stats: {
            score: number
            name: string
          }
        }

        median<Value>("${completionMarker}")
      `),
    ).toEqual(["score", "stats.score"])
  })

  test("completes numeric path selectors from pipe context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { pipe } from "./pipe"
        import { median } from "./median"

        const values = [
          { score: 1, label: "one", stats: { score: 2, name: "Ada" } },
        ]

        pipe(values, median("${completionMarker}"))
      `),
    ).toEqual(["score", "stats.score"])
  })
})
