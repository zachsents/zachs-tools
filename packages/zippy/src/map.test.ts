import { describe, expect, test } from "bun:test"

import {
  completionMarker,
  getStringLiteralCompletionNames,
} from "./lib/autocomplete-test-utils"
import {
  map,
  mapAsync,
  mapEntries,
  mapEntriesAsync,
  mapKeys,
  mapKeysAsync,
  mapValues,
  mapValuesAsync,
} from "./map"

/**
 * Returns the passed number for runtime tests.
 *
 * @param value - The number to return.
 */
const asyncNumberIdentity = async (value: number) => value
const wait = (duration: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, duration))

describe("map", () => {
  test("maps array values", () => {
    expect(map([1, 2, 3], (value) => value * 2)).toEqual([2, 4, 6])
  })

  test("maps array values data-last", () => {
    expect(map((value: number) => value * 2)([1, 2, 3])).toEqual([2, 4, 6])
  })

  test("maps iterable values", () => {
    expect(map(new Set([1, 2, 3]), (value) => value * 2)).toEqual([2, 4, 6])
  })

  test("maps array values with string paths", () => {
    const values = [
      { id: 1, profile: { name: "Ada" } },
      { id: 2, profile: { name: "Linus" } },
    ]

    expect(map(values, "profile.name")).toEqual(["Ada", "Linus"])
    expect(map("id")(values)).toEqual([1, 2])
  })

  test("passes index and source array to the mapper", () => {
    expect(
      map(
        ["z", "i", "p"],
        (value, index, source) => value + index + source.length,
      ),
    ).toEqual(["z03", "i13", "p23"])
  })

  test("passes a materialized source array for data-last iterable values", () => {
    const sources: Array<readonly string[]> = []

    expect(
      map((value: string, index, source) => {
        sources.push(source)

        return value + index + source.length
      })(["z", "i", "p"].values()),
    ).toEqual(["z03", "i13", "p23"])
    expect(sources).toHaveLength(3)
    expect(sources.every((source) => source === sources[0])).toBe(true)
    expect(sources[0]).toEqual(["z", "i", "p"])
  })
})

describe("map autocomplete", () => {
  test("completes path selectors from data-first values", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { map } from "./map"

        const values = [
          { id: 1, label: "one", profile: { name: "Ada", age: 36 } },
        ]

        map(values, "${completionMarker}")
      `),
    ).toEqual(["id", "label", "profile", "profile.age", "profile.name"])
  })

  test("does not complete data-last path selectors without value context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { map } from "./map"

        map("${completionMarker}")
      `),
    ).toEqual([])
  })

  test("completes path selectors from an explicit data-last value type", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { map } from "./map"

        type Value = {
          id: number
          label: string
          profile: {
            name: string
            age: number
          }
        }

        map<Value>("${completionMarker}")
      `),
    ).toEqual(["id", "label", "profile", "profile.age", "profile.name"])
  })

  test("completes path selectors from pipe context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { pipe } from "./pipe"
        import { map } from "./map"

        const values = [
          { id: 1, label: "one", profile: { name: "Ada", age: 36 } },
        ]

        pipe(values, map("${completionMarker}"))
      `),
    ).toEqual(["id", "label", "profile", "profile.age", "profile.name"])
  })
})

describe("mapAsync", () => {
  test("maps array values with async mappers", async () => {
    expect(mapAsync([1, 2, 3], async (value) => value * 2)).resolves.toEqual([
      2, 4, 6,
    ])
  })

  test("maps array values with async mappers data-last", async () => {
    expect(
      mapAsync(async (value: number) => value * 2)([1, 2, 3]),
    ).resolves.toEqual([2, 4, 6])
  })

  test("maps iterable values with async mappers", async () => {
    expect(
      mapAsync(new Uint8Array([1, 2, 3]), async (value) => value * 2),
    ).resolves.toEqual([2, 4, 6])
  })

  test("maps array values with string paths", async () => {
    const values = [
      { id: 1, profile: { name: "Ada" } },
      { id: 2, profile: { name: "Linus" } },
    ]

    expect(mapAsync(values, "profile.name")).resolves.toEqual(["Ada", "Linus"])
    expect(mapAsync("id")(values)).resolves.toEqual([1, 2])
  })

  test("preserves input order", async () => {
    expect(
      mapAsync([1, 2, 3], async (value) => {
        await Promise.resolve()

        return 4 - value
      }),
    ).resolves.toEqual([3, 2, 1])
  })

  test("limits mapper concurrency", async () => {
    let active = 0
    let maxActive = 0

    expect(
      await mapAsync(
        [1, 2, 3, 4],
        async (value) => {
          active += 1
          maxActive = Math.max(maxActive, active)

          await wait(1)

          active -= 1

          return value * 2
        },
        { concurrency: 2 },
      ),
    ).toEqual([2, 4, 6, 8])
    expect(maxActive).toBe(2)
  })

  test("limits mapper concurrency data-last", async () => {
    let active = 0
    let maxActive = 0

    expect(
      await mapAsync(
        async (value: number) => {
          active += 1
          maxActive = Math.max(maxActive, active)

          await wait(1)

          active -= 1

          return value * 2
        },
        { concurrency: 1 },
      )([1, 2, 3]),
    ).toEqual([2, 4, 6])
    expect(maxActive).toBe(1)
  })

  test("throws for invalid concurrency limits", () => {
    expect(() =>
      mapAsync([1], asyncNumberIdentity, { concurrency: 0 }),
    ).toThrow(RangeError)
    expect(() =>
      mapAsync([1], asyncNumberIdentity, { concurrency: 1.5 }),
    ).toThrow("positive integer")
  })
})

describe("mapValues", () => {
  test("maps object values while preserving keys", () => {
    expect(mapValues({ a: 1, b: 2 }, (value) => value * 10)).toEqual({
      a: 10,
      b: 20,
    })
  })

  test("maps object values while preserving keys data-last", () => {
    expect(mapValues((value: number) => value * 10)({ a: 1, b: 2 })).toEqual({
      a: 10,
      b: 20,
    })
  })

  test("maps object values with string paths", () => {
    const values = {
      first: { id: 1, profile: { name: "Ada" } },
      second: { id: 2, profile: { name: "Linus" } },
    }

    expect(mapValues(values, "profile.name")).toEqual({
      first: "Ada",
      second: "Linus",
    })
    expect(mapValues("id")(values)).toEqual({
      first: 1,
      second: 2,
    })
  })

  test("passes key and source object to the mapper", () => {
    const values = { a: 1, b: 2 }
    const sourceMatches: boolean[] = []

    expect(
      mapValues(values, (value, key, source) => {
        sourceMatches.push(source === values)

        return `${key}:${value}`
      }),
    ).toEqual({
      a: "a:1",
      b: "b:2",
    })
    expect(sourceMatches).toEqual([true, true])
  })
})

describe("mapValuesAsync", () => {
  test("maps object values with async mappers", async () => {
    expect(
      mapValuesAsync({ a: 1, b: 2 }, async (value) => value * 10),
    ).resolves.toEqual({
      a: 10,
      b: 20,
    })
  })

  test("maps object values with async mappers data-last", async () => {
    expect(
      mapValuesAsync(async (value: number) => value * 10)({ a: 1, b: 2 }),
    ).resolves.toEqual({
      a: 10,
      b: 20,
    })
  })

  test("maps object values with string paths", async () => {
    const values = {
      first: { id: 1, profile: { name: "Ada" } },
      second: { id: 2, profile: { name: "Linus" } },
    }

    expect(mapValuesAsync(values, "profile.name")).resolves.toEqual({
      first: "Ada",
      second: "Linus",
    })
    expect(mapValuesAsync("id")(values)).resolves.toEqual({
      first: 1,
      second: 2,
    })
  })

  test("passes key and source object to the mapper", async () => {
    const values = { a: 1, b: 2 }
    const sourceMatches: boolean[] = []

    expect(
      mapValuesAsync(values, async (value, key, source) => {
        sourceMatches.push(source === values)

        return `${key}:${value}`
      }),
    ).resolves.toEqual({
      a: "a:1",
      b: "b:2",
    })
    expect(sourceMatches).toEqual([true, true])
  })

  test("limits mapper concurrency", async () => {
    let active = 0
    let maxActive = 0

    expect(
      await mapValuesAsync(
        { a: 1, b: 2, c: 3 },
        async (value) => {
          active += 1
          maxActive = Math.max(maxActive, active)

          await wait(1)

          active -= 1

          return value * 10
        },
        { concurrency: 2 },
      ),
    ).toEqual({
      a: 10,
      b: 20,
      c: 30,
    })
    expect(maxActive).toBe(2)
  })

  test("limits mapper concurrency data-last", async () => {
    let active = 0
    let maxActive = 0

    expect(
      await mapValuesAsync(
        async (value: number) => {
          active += 1
          maxActive = Math.max(maxActive, active)

          await wait(1)

          active -= 1

          return value * 10
        },
        { concurrency: 1 },
      )({ a: 1, b: 2 }),
    ).toEqual({
      a: 10,
      b: 20,
    })
    expect(maxActive).toBe(1)
  })
})

describe("mapKeys", () => {
  test("maps object keys while preserving values", () => {
    expect(
      mapKeys({ first: 1, second: 2 }, (_value, key) => key.toUpperCase()),
    ).toEqual({
      FIRST: 1,
      SECOND: 2,
    })
  })

  test("maps object keys while preserving values data-last", () => {
    expect(
      mapKeys((_value: number, key) => key.toUpperCase())({
        first: 1,
        second: 2,
      }),
    ).toEqual({
      FIRST: 1,
      SECOND: 2,
    })
  })

  test("maps object keys with string paths", () => {
    const values = {
      first: { id: "user-1", name: "Ada" },
      second: { id: "user-2", name: "Linus" },
    }

    expect(mapKeys(values, "id")).toEqual({
      "user-1": values.first,
      "user-2": values.second,
    })
    expect(mapKeys("name")(values)).toEqual({
      Ada: values.first,
      Linus: values.second,
    })
  })

  test("uses the last value when mapped keys collide", () => {
    expect(mapKeys({ first: 1, second: 2 }, () => "same")).toEqual({
      same: 2,
    })
  })
})

describe("mapKeys autocomplete", () => {
  test("completes property-key path selectors from data-first values", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { mapKeys } from "./map"

        const values = {
          first: {
            id: "user-1",
            profile: { name: "Ada" },
            metadata: { active: true },
          },
        }

        mapKeys(values, "${completionMarker}")
      `),
    ).toEqual(["id", "profile.name"])
  })

  test("does not complete data-last key path selectors without value context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { mapKeys } from "./map"

        mapKeys("${completionMarker}")
      `),
    ).toEqual([])
  })

  test("completes property-key path selectors from an explicit data-last value type", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { mapKeys } from "./map"

        type Value = {
          id: string
          count: number
          profile: {
            name: string
          }
          metadata: {
            active: true
          }
        }

        mapKeys<Value>("${completionMarker}")
      `),
    ).toEqual(["count", "id", "profile.name"])
  })

  test("completes property-key path selectors from pipe context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { pipe } from "./pipe"
        import { mapKeys } from "./map"

        const values = {
          first: {
            id: "user-1",
            profile: { name: "Ada" },
            metadata: { active: true },
          },
        }

        pipe(values, mapKeys("${completionMarker}"))
      `),
    ).toEqual(["id", "profile.name"])
  })
})

describe("mapKeysAsync", () => {
  test("maps object keys with async mappers", async () => {
    expect(
      mapKeysAsync({ first: 1, second: 2 }, async (_value, key) =>
        key.toUpperCase(),
      ),
    ).resolves.toEqual({
      FIRST: 1,
      SECOND: 2,
    })
  })

  test("maps object keys with async mappers data-last", async () => {
    expect(
      mapKeysAsync(async (_value: number, key) => key.toUpperCase())({
        first: 1,
        second: 2,
      }),
    ).resolves.toEqual({
      FIRST: 1,
      SECOND: 2,
    })
  })

  test("maps object keys with string paths", async () => {
    const values = {
      first: { id: "user-1", name: "Ada" },
      second: { id: "user-2", name: "Linus" },
    }

    expect(mapKeysAsync(values, "id")).resolves.toEqual({
      "user-1": values.first,
      "user-2": values.second,
    })
    expect(mapKeysAsync("name")(values)).resolves.toEqual({
      Ada: values.first,
      Linus: values.second,
    })
  })

  test("uses the last value when mapped keys collide", async () => {
    expect(
      mapKeysAsync({ first: 1, second: 2 }, async () => "same"),
    ).resolves.toEqual({
      same: 2,
    })
  })

  test("limits mapper concurrency", async () => {
    let active = 0
    let maxActive = 0

    expect(
      await mapKeysAsync(
        { first: 1, second: 2, third: 3 },
        async (_value, key) => {
          active += 1
          maxActive = Math.max(maxActive, active)

          await wait(1)

          active -= 1

          return key.toUpperCase()
        },
        { concurrency: 2 },
      ),
    ).toEqual({
      FIRST: 1,
      SECOND: 2,
      THIRD: 3,
    })
    expect(maxActive).toBe(2)
  })

  test("limits mapper concurrency data-last", async () => {
    let active = 0
    let maxActive = 0

    expect(
      await mapKeysAsync(
        async (_value: number, key) => {
          active += 1
          maxActive = Math.max(maxActive, active)

          await wait(1)

          active -= 1

          return key.toUpperCase()
        },
        { concurrency: 1 },
      )({ first: 1, second: 2 }),
    ).toEqual({
      FIRST: 1,
      SECOND: 2,
    })
    expect(maxActive).toBe(1)
  })
})

describe("mapEntries", () => {
  test("maps object entries into new keys and values", () => {
    expect(
      mapEntries({ a: 1, b: 2 }, ([key, value]) => [
        key.toUpperCase(),
        value * 10,
      ]),
    ).toEqual({
      A: 10,
      B: 20,
    })
  })

  test("maps object entries into new keys and values data-last", () => {
    expect(
      mapEntries(([key, value]: readonly [string, number]) => [
        key.toUpperCase(),
        value * 10,
      ])({ a: 1, b: 2 }),
    ).toEqual({
      A: 10,
      B: 20,
    })
  })

  test("passes index and source object to the mapper", () => {
    const values = { a: 1, b: 2 }
    const sourceMatches: boolean[] = []

    expect(
      mapEntries(values, ([key, value], index, source) => {
        sourceMatches.push(source === values)

        return [`${index}:${key}`, value + index]
      }),
    ).toEqual({
      "0:a": 1,
      "1:b": 3,
    })
    expect(sourceMatches).toEqual([true, true])
  })
})

describe("mapEntriesAsync", () => {
  test("maps object entries into new keys and values with async mappers", async () => {
    expect(
      mapEntriesAsync({ a: 1, b: 2 }, async ([key, value]) => [
        key.toUpperCase(),
        value * 10,
      ]),
    ).resolves.toEqual({
      A: 10,
      B: 20,
    })
  })

  test("maps object entries into new keys and values with async mappers data-last", async () => {
    expect(
      mapEntriesAsync(async ([key, value]: readonly [string, number]) => [
        key.toUpperCase(),
        value * 10,
      ])({ a: 1, b: 2 }),
    ).resolves.toEqual({
      A: 10,
      B: 20,
    })
  })

  test("passes index and source object to the mapper", async () => {
    const values = { a: 1, b: 2 }
    const sourceMatches: boolean[] = []

    expect(
      mapEntriesAsync(values, async ([key, value], index, source) => {
        sourceMatches.push(source === values)

        return [`${index}:${key}`, value + index]
      }),
    ).resolves.toEqual({
      "0:a": 1,
      "1:b": 3,
    })
    expect(sourceMatches).toEqual([true, true])
  })

  test("limits mapper concurrency", async () => {
    let active = 0
    let maxActive = 0

    expect(
      await mapEntriesAsync(
        { a: 1, b: 2, c: 3 },
        async ([key, value]) => {
          active += 1
          maxActive = Math.max(maxActive, active)

          await wait(1)

          active -= 1

          return [key.toUpperCase(), value * 10] as const
        },
        { concurrency: 2 },
      ),
    ).toEqual({
      A: 10,
      B: 20,
      C: 30,
    })
    expect(maxActive).toBe(2)
  })

  test("limits mapper concurrency data-last", async () => {
    let active = 0
    let maxActive = 0

    expect(
      await mapEntriesAsync(
        async ([key, value]: readonly [string, number]) => {
          active += 1
          maxActive = Math.max(maxActive, active)

          await wait(1)

          active -= 1

          return [key.toUpperCase(), value * 10] as const
        },
        { concurrency: 1 },
      )({ a: 1, b: 2 }),
    ).toEqual({
      A: 10,
      B: 20,
    })
    expect(maxActive).toBe(1)
  })
})
