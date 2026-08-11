import { describe, expect, mock, test } from "bun:test"

import { lazy } from "./lazy"

describe("lazy", () => {
  test("loads a value once", () => {
    const value = { name: "zippy" }
    const load = mock(() => value)
    const getValue = lazy(load)

    expect(getValue()).toBe(value)
    expect(getValue()).toBe(value)
    expect(load).toHaveBeenCalledTimes(1)
  })

  test.each([
    ["undefined", undefined],
    ["null", null],
    ["false", false],
    ["zero", 0],
    ["empty string", ""],
  ] as const)("caches %s values", (_name, value) => {
    const load = mock(() => value)
    const getValue = lazy(load)

    expect(getValue()).toBe(value)
    expect(getValue()).toBe(value)
    expect(load).toHaveBeenCalledTimes(1)
  })

  test("retries after the loader throws", () => {
    const error = new Error("load failed")
    const load = mock(() => {
      if (load.mock.calls.length === 1) {
        throw error
      }

      return "zippy"
    })
    const getValue = lazy(load)

    expect(getValue).toThrow(error)
    expect(getValue()).toBe("zippy")
    expect(getValue()).toBe("zippy")
    expect(load).toHaveBeenCalledTimes(2)
  })

  test("shares a pending promise", async () => {
    const load = mock(async () => "zippy")
    const getValue = lazy(load)

    const first = getValue()

    expect(getValue()).toBe(first)
    expect(await first).toBe("zippy")
    expect(load).toHaveBeenCalledTimes(1)
  })
})
