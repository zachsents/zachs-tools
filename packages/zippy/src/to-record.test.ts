import { describe, expect, test } from "bun:test"

import { toRecord } from "./to-record"

describe("toRecord", () => {
  test("converts an entry iterable to a record", () => {
    expect(
      toRecord([
        ["name", "zippy"],
        ["kind", "utility"],
      ]),
    ).toEqual({ name: "zippy", kind: "utility" })
  })

  test("converts an entry iterator to a record", () => {
    expect(
      toRecord(
        new Map([
          ["name", "zippy"],
          ["kind", "utility"],
        ]).entries(),
      ),
    ).toEqual({ name: "zippy", kind: "utility" })
  })

  test("converts a non-iterable iterator to a record", () => {
    const values = [
      ["name", "zippy"],
      ["kind", "utility"],
    ] as const
    let index = 0
    const iterator: Iterator<(typeof values)[number]> = {
      next: () => {
        const value = values[index]
        index += 1

        return value === undefined
          ? { done: true, value: undefined }
          : { done: false, value }
      },
    }

    expect(toRecord(iterator)).toEqual({ name: "zippy", kind: "utility" })
  })

  test("converts a value exposing entries to a record", () => {
    expect(
      toRecord({
        entries: () =>
          new Map([
            ["content-type", "application/json"],
            ["x-zippy", "true"],
          ]).entries(),
      }),
    ).toEqual({
      "content-type": "application/json",
      "x-zippy": "true",
    })
  })

  test("accepts entry containers without special handling", () => {
    expect(
      toRecord(
        new Headers({
          "content-type": "application/json",
          "x-zippy": "true",
        }),
      ),
    ).toEqual({
      "content-type": "application/json",
      "x-zippy": "true",
    })
  })

  test("supports data-last usage", () => {
    expect(
      toRecord()(
        new Map([
          ["name", "zippy"],
          ["kind", "utility"],
        ]),
      ),
    ).toEqual({ name: "zippy", kind: "utility" })
  })

  test("uses the last value for duplicate keys", () => {
    expect(
      toRecord([
        ["name", "first"],
        ["name", "last"],
      ]),
    ).toEqual({ name: "last" })
  })
})
