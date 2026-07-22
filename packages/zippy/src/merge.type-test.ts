// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { deepMerge, merge } from "./merge"

const mergeDataFirst = merge({ a: 1, b: "left" }, { b: 2, c: true })
const mergeDataLast = merge({ b: 2, c: true })({ a: 1, b: "left" })

true satisfies IsEqual<
  typeof mergeDataFirst,
  { a: number; b: number; c: boolean }
>
true satisfies IsEqual<
  typeof mergeDataLast,
  { a: number; b: number; c: boolean }
>

const deepMergeDataFirst = deepMerge(
  {
    config: {
      retries: 1,
      flags: { debug: false, trace: false },
    },
    tags: ["left"],
  },
  {
    config: {
      timeout: 100,
      flags: { debug: true },
    },
    tags: ["right"],
  },
)
const deepMergeDataLast = deepMerge({
  config: {
    timeout: 100,
    flags: { trace: true },
  },
})({
  config: {
    retries: 1,
    flags: { debug: false },
  },
  enabled: true,
})

true satisfies IsEqual<
  typeof deepMergeDataFirst,
  {
    config: {
      retries: number
      timeout: number
      flags: { debug: boolean; trace: boolean }
    }
    tags: string[]
  }
>
true satisfies IsEqual<
  typeof deepMergeDataLast,
  {
    config: {
      retries: number
      timeout: number
      flags: { debug: boolean; trace: boolean }
    }
    enabled: boolean
  }
>

const deepMergeReplacedValue = deepMerge(
  { value: { nested: true }, count: 1 },
  { value: null },
)

true satisfies IsEqual<
  typeof deepMergeReplacedValue,
  { value: null; count: number }
>
