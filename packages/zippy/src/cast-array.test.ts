import { describe, expect, test } from "bun:test"

import { castArray } from "./cast-array"

describe("castArray", () => {
  test("returns a pipeable function when called without a value", () => {
    expect(castArray()("zippy")).toEqual(["zippy"])
  })

  test("wraps non-array values", () => {
    expect(castArray("zippy")).toEqual(["zippy"])
  })

  test.each([
    ["null", null],
    ["false", false],
    ["zero", 0],
    ["empty string", ""],
  ] as const)("wraps %s values", (_name, value) => {
    expect(castArray(value)).toEqual([value])
    expect(castArray()(value)).toEqual([value])
  })

  test("returns an empty array for undefined values", () => {
    expect(castArray(undefined)).toEqual([])
    expect(castArray()(undefined)).toEqual([])
  })

  test("preserves wrapped value identity", () => {
    const value = { name: "zippy" }

    expect(castArray(value)[0]).toBe(value)
    expect(castArray()(value)[0]).toBe(value)
  })

  test("returns array values unchanged", () => {
    const value = [1, 2, 3]

    expect(castArray(value)).toBe(value)
    expect(castArray()(value)).toBe(value)
  })
})
