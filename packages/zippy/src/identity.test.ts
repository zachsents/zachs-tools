import { describe, expect, test } from "bun:test"

import { identity } from "./identity"

describe("identity", () => {
  test("returns the same value", () => {
    const value = { name: "zippy" }

    expect(identity(value)).toBe(value)
  })
})
