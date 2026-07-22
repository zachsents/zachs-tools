import { describe, expect, test } from "bun:test"

import {
  completionMarker,
  getStringLiteralCompletionNames,
} from "./lib/autocomplete-test-utils"
import { mode } from "./mode"

describe("mode", () => {
  test("returns the most common value", () => {
    expect(mode(["z", "i", "p", "p", "y"])).toBe("p")
  })

  test("returns the first-occurring value when frequencies tie", () => {
    expect(mode(["a", "b", "b", "a"])).toBe("a")
  })

  test("returns undefined for an empty array", () => {
    expect(mode([])).toBeUndefined()
  })

  test("uses SameValueZero equality", () => {
    expect(mode([NaN, NaN, 0, -0, 0])).toBe(0)
  })

  test("keeps distinct object references", () => {
    const first = { name: "zippy" }

    expect(mode([first, { name: "zippy" }, first])).toBe(first)
  })

  test("returns the most common value data-last", () => {
    expect(mode()(["z", "i", "p", "p", "y"])).toBe("p")
  })

  test("returns the most common value from iterable inputs", () => {
    expect(mode(new Set(["z", "i", "p", "p", "y"]))).toBe("z")
    expect(mode()(["z", "i", "p", "p", "y"].values())).toBe("p")
  })
})

describe("mode selectors", () => {
  test("returns the first value with the most common mapped key", () => {
    const firstA = { kind: "a", label: "first-a" }

    expect(
      mode(
        [firstA, { kind: "b", label: "b" }, { kind: "a", label: "second-a" }],
        (value) => value.kind,
      ),
    ).toBe(firstA)
  })

  test("returns the first value with the most common property path key", () => {
    const firstA = { kind: "a", label: "first-a" }

    expect(
      mode(
        [firstA, { kind: "b", label: "b" }, { kind: "a", label: "second-a" }],
        "kind",
      ),
    ).toBe(firstA)
  })

  test("returns the first value with the most common dot path key", () => {
    const firstA = { meta: { kind: "a" }, label: "first-a" }

    expect(
      mode(
        [
          firstA,
          { meta: { kind: "b" }, label: "b" },
          { meta: { kind: "a" }, label: "second-a" },
        ],
        "meta.kind",
      ),
    ).toBe(firstA)
  })

  test("returns the first value whose mapped key is first in a tie", () => {
    const firstA = { kind: "a", label: "first-a" }

    expect(
      mode(
        [
          firstA,
          { kind: "b", label: "first-b" },
          { kind: "b", label: "second-b" },
          { kind: "a", label: "second-a" },
        ],
        (value) => value.kind,
      ),
    ).toBe(firstA)
  })

  test("returns undefined for an empty array", () => {
    expect(mode([], () => "key")).toBeUndefined()
  })

  test("returns the first value with the most common mapped key data-last", () => {
    const firstA = { kind: "a", label: "first-a" }

    expect(
      mode((value: { kind: string }) => value.kind)([
        firstA,
        { kind: "b", label: "b" },
        { kind: "a", label: "second-a" },
      ]),
    ).toBe(firstA)
  })

  test("passes index and source array to the mapper data-last", () => {
    const firstA = { kind: "a", label: "first-a" }
    const values = [
      firstA,
      { kind: "b", label: "b" },
      { kind: "a", label: "second-a" },
    ]
    const sourcesMatch: boolean[] = []

    expect(
      mode((value: { kind: string }, index, source) => {
        sourcesMatch.push(source === values)

        return index === 1 ? value.kind : "a"
      })(values),
    ).toBe(firstA)
    expect(sourcesMatch).toEqual([true, true, true])
  })

  test("returns the first value with the most common property path key data-last", () => {
    const firstA = { kind: "a", label: "first-a" }

    expect(
      mode("kind")([
        firstA,
        { kind: "b", label: "b" },
        { kind: "a", label: "second-a" },
      ]),
    ).toBe(firstA)
  })

  test("returns the first value with the most common dot path key data-last", () => {
    const firstA = { meta: { kind: "a" }, label: "first-a" }

    expect(
      mode("meta.kind")([
        firstA,
        { meta: { kind: "b" }, label: "b" },
        { meta: { kind: "a" }, label: "second-a" },
      ]),
    ).toBe(firstA)
  })
})

describe("mode autocomplete", () => {
  const allPathCompletions = [
    "count",
    "kind",
    "label",
    "stats",
    "stats.name",
    "stats.score",
  ]

  test("completes path selectors from data-first values", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { mode } from "./mode"

        const values = [
          { kind: "a", count: 1, label: "one", stats: { score: 2, name: "Ada" } },
        ]

        mode(values, "${completionMarker}")
      `),
    ).toEqual(allPathCompletions)
  })

  test("does not complete data-last path selectors without value context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { mode } from "./mode"

        mode("${completionMarker}")
      `),
    ).toEqual([])
  })

  test("completes path selectors from an explicit data-last value type", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { mode } from "./mode"

        type Value = {
          kind: string
          count: number
          label: string
          stats: {
            score: number
            name: string
          }
        }

        mode<Value>("${completionMarker}")
      `),
    ).toEqual(allPathCompletions)
  })

  test("completes path selectors from pipe context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { pipe } from "./pipe"
        import { mode } from "./mode"

        const values = [
          { kind: "a", count: 1, label: "one", stats: { score: 2, name: "Ada" } },
        ]

        pipe(values, mode("${completionMarker}"))
      `),
    ).toEqual(allPathCompletions)
  })
})
