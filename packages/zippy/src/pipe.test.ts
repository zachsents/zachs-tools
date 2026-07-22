import { describe, expect, test } from "bun:test"

import { pipe, pipeAsync, piped, pipedAsync } from "./pipe"

describe("pipe", () => {
  test("returns the input when there are no functions", () => {
    const value = { id: "zippy" }

    expect(pipe(value)).toBe(value)
  })

  test("passes each result to the next function", () => {
    expect(
      pipe(
        1,
        (value) => value + 1,
        (value) => `${value}`,
        (value) => value.padStart(2, "0"),
      ),
    ).toBe("02")
  })
})

describe("piped", () => {
  test("returns a reusable pipe function", () => {
    const transform = piped(
      (value: number) => value + 1,
      (value) => `${value}`,
    )

    expect(transform(1)).toBe("2")
    expect(transform(4)).toBe("5")
  })

  test("returns an identity function with no functions", () => {
    const value = { id: "zippy" }

    expect(piped()(value)).toBe(value)
  })
})

describe("pipeAsync", () => {
  test("awaits the input when there are no functions", async () => {
    expect(await pipeAsync(Promise.resolve("zippy"))).toBe("zippy")
  })

  test("awaits promises between pipeline stages", async () => {
    expect(
      await pipeAsync(
        Promise.resolve(1),
        (value) => Promise.resolve(value + 1),
        (value) => `${value}`,
        async (value) => value.padStart(2, "0"),
      ),
    ).toBe("02")
  })
})

describe("pipedAsync", () => {
  test("returns a reusable async pipe function", async () => {
    const transform = pipedAsync(
      (value: number) => Promise.resolve(value + 1),
      (value) => `${value}`,
    )

    expect(await transform(Promise.resolve(1))).toBe("2")
    expect(await transform(4)).toBe("5")
  })

  test("returns an async identity function with no functions", async () => {
    expect(await pipedAsync()(Promise.resolve("zippy"))).toBe("zippy")
  })
})
