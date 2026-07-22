import { describe, expect, test } from "bun:test"

import { tuple } from "./tuple"

describe("tuple", () => {
  test("returns values in an array", () => {
    expect(tuple("a", 1, true)).toEqual(["a", 1, true])
  })

  test("returns an empty array when called without values", () => {
    expect(tuple()).toEqual([])
  })

  test("supports many arguments", () => {
    expect(tuple(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ])
  })
})
