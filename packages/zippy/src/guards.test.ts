import { describe, expect, test } from "bun:test"

import {
  completionMarker,
  getStringLiteralCompletionNames,
} from "./lib/autocomplete-test-utils"
import {
  isDefined,
  isFalsy,
  isNullish,
  isNonNullish,
  isPlainObject,
  isReadonlyArray,
  isTruthy,
  isUndefined,
  propIsDefined,
  propIsFalsy,
  propIsNullish,
  propIsNonNullish,
  propIsPlainObject,
  propIsTruthy,
  propIsUndefined,
} from "./guards"

describe("type guards", () => {
  test("detects nullish values", () => {
    expect(isNullish(null)).toBe(true)
    expect(isNullish(undefined)).toBe(true)
    expect(isNullish(false)).toBe(false)
    expect(isNullish(0)).toBe(false)
    expect(isNullish("")).toBe(false)
  })

  test("detects non-nullish values", () => {
    expect(isNonNullish(false)).toBe(true)
    expect(isNonNullish(0)).toBe(true)
    expect(isNonNullish("")).toBe(true)
    expect(isNonNullish(null)).toBe(false)
    expect(isNonNullish(undefined)).toBe(false)
  })

  test("detects truthy values", () => {
    expect(isTruthy(1)).toBe(true)
    expect(isTruthy("zippy")).toBe(true)
    expect(isTruthy({})).toBe(true)
    expect(isTruthy(0)).toBe(false)
    expect(isTruthy("")).toBe(false)
    expect(isTruthy(null)).toBe(false)
  })

  test("detects falsy values", () => {
    expect(isFalsy(false)).toBe(true)
    expect(isFalsy(0)).toBe(true)
    expect(isFalsy(0n)).toBe(true)
    expect(isFalsy("")).toBe(true)
    expect(isFalsy(null)).toBe(true)
    expect(isFalsy(undefined)).toBe(true)
    expect(isFalsy(Number.NaN)).toBe(true)
    expect(isFalsy("zippy")).toBe(false)
  })

  test("detects undefined", () => {
    expect(isUndefined(undefined)).toBe(true)
    expect(isUndefined(void 0)).toBe(true)
    expect(isUndefined(null)).toBe(false)
    expect(isUndefined(0)).toBe(false)
  })

  test("detects defined values", () => {
    expect(isDefined(null)).toBe(true)
    expect(isDefined(0)).toBe(true)
    expect(isDefined("")).toBe(true)
    expect(isDefined(undefined)).toBe(false)
    expect(isDefined(void 0)).toBe(false)
  })

  test("detects plain objects", () => {
    expect(isPlainObject({ name: "zippy" })).toBe(true)
    expect(isPlainObject(Object.create(null))).toBe(true)
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject(new Date())).toBe(false)
    expect(isPlainObject(Object.create({ inherited: true }))).toBe(false)
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject("zippy")).toBe(false)
  })

  test("detects array values", () => {
    expect(isReadonlyArray([])).toBe(true)
    expect(isReadonlyArray(["zippy"])).toBe(true)
    expect(isReadonlyArray([1, 2] as const)).toBe(true)
  })

  test("rejects non-array values", () => {
    expect(isReadonlyArray(null)).toBe(false)
    expect(isReadonlyArray(undefined)).toBe(false)
    expect(isReadonlyArray("zippy")).toBe(false)
    expect(isReadonlyArray({ length: 1, 0: "zippy" })).toBe(false)
    expect(isReadonlyArray(new Set(["zippy"]))).toBe(false)
    expect(isReadonlyArray(new Uint8Array([1, 2]))).toBe(false)
  })

  test("detects property path values", () => {
    const value = {
      enabled: true,
      disabled: false,
      missing: undefined,
      contact: { email: "zippy@example.com" },
      profile: null,
      meta: { source: "test" },
    }

    expect(propIsTruthy("enabled")(value)).toBe(true)
    expect(propIsTruthy("disabled")(value)).toBe(false)
    expect(propIsFalsy("disabled")(value)).toBe(true)
    expect(propIsNullish("profile")(value)).toBe(true)
    expect(propIsNonNullish("contact.email")(value)).toBe(true)
    expect(propIsUndefined("missing")(value)).toBe(true)
    expect(propIsDefined("contact.email")(value)).toBe(true)
    expect(propIsPlainObject("meta")(value)).toBe(true)
    expect(propIsTruthy("profile.name")(value)).toBe(false)
  })
})

describe("property guard autocomplete", () => {
  test("completes path selectors from filter value context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { propIsTruthy } from "./guards"

        const values = [
          { enabled: true, label: "one", count: 0, stats: { score: 2, name: "Ada" } },
        ]

        values.filter(propIsTruthy("${completionMarker}"))
      `),
    ).toEqual([
      "count",
      "enabled",
      "label",
      "stats",
      "stats.name",
      "stats.score",
    ])
  })

  test("completes path selectors from pipe value context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { propIsTruthy } from "./guards"
        import { pipe } from "./pipe"

        const value = {
          enabled: true,
          label: "one",
          count: 0,
          stats: { score: 2, name: "Ada" },
        }

        pipe(value, propIsTruthy("${completionMarker}"))
      `),
    ).toEqual([
      "count",
      "enabled",
      "label",
      "stats",
      "stats.name",
      "stats.score",
    ])
  })

  test("does not complete path selectors without value context", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { propIsTruthy } from "./guards"

        propIsTruthy("${completionMarker}")
      `),
    ).toEqual([])
  })

  test("completes path selectors from an explicit value type", () => {
    expect(
      getStringLiteralCompletionNames(`
        import { propIsTruthy } from "./guards"

        type Value = {
          enabled: boolean
          label: string
          count: 0 | 1
          profile?: {
            name?: string | null
          }
          stats: {
            score: number
            name: string
          }
        }

        propIsTruthy<Value>("${completionMarker}")
      `),
    ).toEqual([
      "count",
      "enabled",
      "label",
      "profile",
      "profile.name",
      "stats",
      "stats.name",
      "stats.score",
    ])
  })
})
