import { describe, expect, mock, test } from "bun:test"

import { resolveFactory } from "./resolve-factory"

describe("resolveFactory", () => {
  test("returns a pipeable function when called without a value", () => {
    expect(resolveFactory()(() => "zippy")).toBe("zippy")
  })

  test("returns values unchanged", () => {
    const value = { name: "zippy" }

    expect(resolveFactory(value)).toBe(value)
    expect(resolveFactory()(value)).toBe(value)
  })

  test("invokes factories once", () => {
    const factory = mock(() => ({ name: "zippy" }))

    expect(resolveFactory(factory)).toEqual({ name: "zippy" })
    expect(factory).toHaveBeenCalledTimes(1)
  })

  test.each([
    ["undefined", undefined],
    ["null", null],
    ["false", false],
    ["zero", 0],
    ["empty string", ""],
  ] as const)("returns %s values unchanged", (_name, value) => {
    expect(resolveFactory(value)).toBe(value)
    expect(resolveFactory()(value)).toBe(value)
  })
})
