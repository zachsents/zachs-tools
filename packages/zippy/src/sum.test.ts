import { describe, expect, test } from "bun:test"

import {
  completionMarker,
  getStringLiteralCompletionNames,
} from "./lib/autocomplete-test-utils"
import { sum } from "./sum"

describe("sum", () => {
  test("adds numbers", () => {
    expect(sum([1, 2, 3, 4])).toBe(10)
  })

  test("returns zero for an empty array", () => {
    expect(sum([])).toBe(0)
  })

  test("adds numbers data-last", () => {
    expect(sum()([1, 2, 3, 4])).toBe(10)
  })

  test("adds iterable numbers", () => {
    expect(sum(new Set([1, 2, 3, 4]))).toBe(10)
  })

  test("adds iterable numbers data-last", () => {
    expect(sum()([1, 2, 3, 4].values())).toBe(10)
  })
})

describe("sum selectors", () => {
  test("adds mapped numbers", () => {
    expect(sum([{ count: 2 }, { count: 3 }], (value) => value.count)).toBe(5)
  })

  test("adds numbers selected by property path", () => {
    expect(sum([{ count: 2 }, { count: 3 }], "count")).toBe(5)
  })

  test("adds numbers selected by dot path", () => {
    expect(
      sum([{ stats: { score: 2 } }, { stats: { score: 3 } }], "stats.score"),
    ).toBe(5)
  })

  test("passes index and source array to the mapper", () => {
    const values = [{ count: 2 }, { count: 3 }]
    const sourcesMatch: boolean[] = []

    expect(
      sum(values, (value, index, source) => {
        sourcesMatch.push(source === values)

        return value.count + index
      }),
    ).toBe(6)
    expect(sourcesMatch).toEqual([true, true])
  })

  test("adds mapped numbers data-last", () => {
    expect(sum((value: { count: number }) => value.count)([{ count: 2 }])).toBe(
      2,
    )
  })

  test("passes index and source array to the mapper data-last", () => {
    const values = [{ count: 2 }, { count: 3 }]
    const sourcesMatch: boolean[] = []

    expect(
      sum((value: { count: number }, index, source) => {
        sourcesMatch.push(source === values)

        return value.count + index
      })(values),
    ).toBe(6)
    expect(sourcesMatch).toEqual([true, true])
  })

  test("passes a materialized source array for iterable selectors", () => {
    const sources: Array<readonly { count: number }[]> = []

    expect(
      sum(new Set([{ count: 2 }, { count: 3 }]), (value, index, source) => {
        sources.push(source)

        return value.count + index
      }),
    ).toBe(6)
    expect(sources).toHaveLength(2)
    expect(sources.every((source) => source === sources[0])).toBe(true)
    expect(sources[0]).toEqual([{ count: 2 }, { count: 3 }])
  })

  test("adds property path numbers data-last", () => {
    expect(sum("count")([{ count: 2 }])).toBe(2)
  })

  test("adds dot path numbers data-last", () => {
    expect(sum("stats.score")([{ stats: { score: 2 } }])).toBe(2)
  })
})

describe("sum autocomplete", () => {
  test("completes numeric path selectors from data-first values", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { sum } from "./sum"

        const values = [
          { count: 1, label: "one", stats: { score: 2, name: "Ada" } },
        ]

        sum(values, "${completionMarker}")
      `),
    ).toEqual(["count", "stats.score"])
  })

  test("does not complete data-last path selectors without value context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { sum } from "./sum"

        sum("${completionMarker}")
      `),
    ).toEqual([])
  })

  test("completes numeric path selectors from an explicit data-last value type", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { sum } from "./sum"

        type Value = {
          count: number
          label: string
          stats: {
            score: number
            name: string
          }
        }

        sum<Value>("${completionMarker}")
      `),
    ).toEqual(["count", "stats.score"])
  })

  test("completes numeric path selectors from pipe context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { pipe } from "./pipe"
        import { sum } from "./sum"

        const values = [
          { count: 1, label: "one", stats: { score: 2, name: "Ada" } },
        ]

        pipe(values, sum("${completionMarker}"))
      `),
    ).toEqual(["count", "stats.score"])
  })
})
