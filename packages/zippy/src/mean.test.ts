import { describe, expect, test } from "bun:test"

import {
  completionMarker,
  getStringLiteralCompletionNames,
} from "./lib/autocomplete-test-utils"
import { mean } from "./mean"

describe("mean", () => {
  test("returns the arithmetic average", () => {
    expect(mean([2, 4, 9])).toBe(5)
  })

  test("returns undefined for an empty array", () => {
    expect(mean([])).toBeUndefined()
  })

  test("returns the arithmetic average data-last", () => {
    expect(mean()([2, 4, 9])).toBe(5)
  })

  test("returns the arithmetic average for iterable numbers", () => {
    expect(mean(new Uint8Array([2, 4, 9]))).toBe(5)
  })
})

describe("mean selectors", () => {
  test("returns the average of mapped numbers", () => {
    expect(
      mean([{ score: 2 }, { score: 4 }, { score: 9 }], (value) => value.score),
    ).toBe(5)
  })

  test("returns the average of numbers selected by property path", () => {
    expect(mean([{ score: 2 }, { score: 4 }, { score: 9 }], "score")).toBe(5)
  })

  test("returns the average of numbers selected by dot path", () => {
    expect(
      mean(
        [
          { stats: { score: 2 } },
          { stats: { score: 4 } },
          { stats: { score: 9 } },
        ],
        "stats.score",
      ),
    ).toBe(5)
  })

  test("returns undefined for an empty array", () => {
    expect(mean([], () => 1)).toBeUndefined()
  })

  test("returns the average of mapped numbers data-last", () => {
    expect(
      mean((value: { score: number }) => value.score)([{ score: 2 }]),
    ).toBe(2)
  })

  test("passes index and source array to the mapper data-last", () => {
    const values = [{ score: 2 }, { score: 4 }]
    const sourcesMatch: boolean[] = []

    expect(
      mean((value: { score: number }, index, source) => {
        sourcesMatch.push(source === values)

        return value.score + index
      })(values),
    ).toBe(3.5)
    expect(sourcesMatch).toEqual([true, true])
  })

  test("returns the average of property path numbers data-last", () => {
    expect(mean("score")([{ score: 2 }])).toBe(2)
  })

  test("returns the average of dot path numbers data-last", () => {
    expect(mean("stats.score")([{ stats: { score: 2 } }])).toBe(2)
  })
})

describe("mean autocomplete", () => {
  test("completes numeric path selectors from data-first values", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { mean } from "./mean"

        const values = [
          { score: 1, label: "one", stats: { score: 2, name: "Ada" } },
        ]

        mean(values, "${completionMarker}")
      `),
    ).toEqual(["score", "stats.score"])
  })

  test("does not complete data-last path selectors without value context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { mean } from "./mean"

        mean("${completionMarker}")
      `),
    ).toEqual([])
  })

  test("completes numeric path selectors from an explicit data-last value type", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { mean } from "./mean"

        type Value = {
          score: number
          label: string
          stats: {
            score: number
            name: string
          }
        }

        mean<Value>("${completionMarker}")
      `),
    ).toEqual(["score", "stats.score"])
  })

  test("completes numeric path selectors from pipe context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { pipe } from "./pipe"
        import { mean } from "./mean"

        const values = [
          { score: 1, label: "one", stats: { score: 2, name: "Ada" } },
        ]

        pipe(values, mean("${completionMarker}"))
      `),
    ).toEqual(["score", "stats.score"])
  })
})
