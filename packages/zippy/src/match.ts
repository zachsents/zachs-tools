import type { Merge } from "type-fest"

import { type IterableInput, toReadonlyArray } from "./iterable"
import { merge } from "./merge"
import {
  getPropertyPathValue,
  type MatchingPath,
  type MatchingPathValue,
  type PathSatisfier,
  type SelectorPath,
} from "./selector"
import { tuple } from "./tuple"

type Cb<Left, Right, Out = unknown> = (
  leftValue: Left,
  rightValue: Right,
  leftIndex: number,
  rightIndex: number,
  leftValues: readonly Left[],
  rightValues: readonly Right[],
) => Out

/**
 * Compares values using SameValueZero semantics.
 *
 * @param left - The left value.
 * @param right - The right value.
 */
function isSameValueZero(left: unknown, right: unknown) {
  return left === right || (left !== left && right !== right)
}

/**
 * Matches left- and right-side values and combines each matching pair with the
 * merger.
 *
 * @param leftValues - The left-side values.
 * @param rightValues - The right-side values.
 * @param matcher - The matcher to apply.
 * @param merger - The merger to apply.
 */
function impl(
  leftValues: IterableInput<unknown>,
  rightValues: IterableInput<unknown>,
  matcher: Cb<unknown, unknown> | string,
  merger: (left: unknown, right: unknown) => unknown,
) {
  const leftSource = toReadonlyArray(leftValues)
  const rightSource = toReadonlyArray(rightValues)
  const matchedRightIndexes = new Set<number>()

  return leftSource.flatMap((leftValue, leftIndex) => {
    for (const [rightIndex, rightValue] of rightSource.entries()) {
      if (matchedRightIndexes.has(rightIndex)) {
        continue
      }

      if (
        !(typeof matcher === "string"
          ? isSameValueZero(
              getPropertyPathValue(leftValue, matcher),
              getPropertyPathValue(rightValue, matcher),
            )
          : matcher(
              leftValue,
              rightValue,
              leftIndex,
              rightIndex,
              leftSource,
              rightSource,
            ))
      ) {
        continue
      }

      matchedRightIndexes.add(rightIndex)

      return [merger(leftValue, rightValue)]
    }

    return []
  })
}

// authoritative pipe curry; path
/**
 * Matches left- and right-side values.
 *
 * @example
 *   const left = [{ id: 1, name: "Ada" }]
 *   match([{ id: 1, score: 10 }], "id")(left) // [[left[0], { id: 1, score: 10 }]]
 *
 * @param rightValues - The right-side values.
 * @param matcher - The matcher to apply.
 */
export function match<Left, Right>(
  rightValues: IterableInput<Right>,
  matcher: MatchingPath<NoInfer<Left>, Right>,
): (leftValues: IterableInput<Left>) => Array<[Left, Right]>

// generic curry; path
/**
 * Matches left- and right-side values.
 *
 * @example
 *   const left = [{ id: 1, name: "Ada" }]
 *   match([{ id: 1, score: 10 }], "id")(left) // [[left[0], { id: 1, score: 10 }]]
 *
 * @param rightValues - The right-side values.
 * @param matcher - The matcher to apply.
 */
export function match<Right, Path extends SelectorPath<Right>>(
  rightValues: IterableInput<Right>,
  matcher: Path,
): <T extends PathSatisfier<Path, MatchingPathValue<Right, Path>>>(
  leftValues: IterableInput<T>,
) => Array<[T, Right]>

// authoritative pipe curry; selector fn
/**
 * Matches left- and right-side values.
 *
 * @example
 *   const left = [{ id: 1, name: "Ada" }]
 *   match(
 *     [{ id: 1, score: 10 }],
 *     (a: { id: number; name: string }, b) => a.id === b.id,
 *   )(left) // [[left[0], { id: 1, score: 10 }]]
 *
 * @param rightValues - The right-side values.
 * @param matcher - The matcher to apply.
 */
export function match<Left, Right>(
  rightValues: IterableInput<Right>,
  matcher: Cb<NoInfer<Left>, Right>,
): (leftValues: IterableInput<Left>) => Array<[Left, Right]>

// generic curry; selector fn
/**
 * Matches left- and right-side values.
 *
 * @example
 *   const left = [{ id: 1, name: "Ada" }]
 *   match(
 *     [{ id: 1, score: 10 }],
 *     (a: { id: number; name: string }, b) => a.id === b.id,
 *   )(left) // [[left[0], { id: 1, score: 10 }]]
 *
 * @param rightValues - The right-side values.
 * @param matcher - The matcher to apply.
 */
export function match<Right, TMatcher extends Cb<never, Right>>(
  rightValues: IterableInput<Right>,
  matcher: TMatcher,
): <T extends TMatcher extends Cb<infer L, never> ? L : never>(
  leftValues: IterableInput<T>,
) => Array<[T, Right]>

// normal
/**
 * Matches left- and right-side values.
 *
 * @example
 *   match([{ id: 1, name: "Ada" }], [{ id: 1, score: 10 }], "id") // [[{ id: 1, name: "Ada" }, { id: 1, score: 10 }]]
 *
 * @param leftValues - The left-side values.
 * @param rightValues - The right-side values.
 * @param matcher - The matcher to apply.
 */
export function match<Left, Right>(
  leftValues: IterableInput<Left>,
  rightValues: IterableInput<Right>,
  matcher: Cb<Left, Right> | MatchingPath<Left, Right>,
): Array<[Left, Right]>

export function match(
  ...args:
    | [IterableInput<unknown>, Cb<unknown, unknown> | string]
    | [
        IterableInput<unknown>,
        IterableInput<unknown>,
        Cb<unknown, unknown> | string,
      ]
) {
  if (args.length === 2) {
    const [rightValues, matcher] = args
    const rightSource = toReadonlyArray(rightValues)

    return (<T>(leftValues: IterableInput<T>) =>
      impl(leftValues, rightSource, matcher, tuple)) as unknown
  }

  return impl(...args, tuple)
}

// authoritative pipe curry; path
/**
 * Matches and merges left- and right-side objects.
 *
 * @example
 *   const left = [{ id: 1, name: "Ada" }]
 *   matchMerge([{ id: 1, score: 10 }], "id")(left) // [{ id: 1, name: "Ada", score: 10 }]
 *
 * @param rightValues - The right-side values.
 * @param matcher - The matcher to apply.
 */
export function matchMerge<Left extends object, Right extends object>(
  rightValues: IterableInput<Right>,
  matcher: MatchingPath<NoInfer<Left>, Right>,
): (leftValues: IterableInput<Left>) => Merge<Left, Right>[]

// generic curry; path
/**
 * Matches and merges left- and right-side objects.
 *
 * @example
 *   const left = [{ id: 1, name: "Ada" }]
 *   matchMerge([{ id: 1, score: 10 }], "id")(left) // [{ id: 1, name: "Ada", score: 10 }]
 *
 * @param rightValues - The right-side values.
 * @param matcher - The matcher to apply.
 */
export function matchMerge<
  Right extends object,
  Path extends SelectorPath<Right>,
>(
  rightValues: IterableInput<Right>,
  matcher: Path,
): <T extends PathSatisfier<Path, MatchingPathValue<Right, Path>>>(
  leftValues: IterableInput<T>,
) => Merge<T, Right>[]

// authoritative pipe curry; selector fn
/**
 * Matches and merges left- and right-side objects.
 *
 * @example
 *   const left = [{ id: 1, name: "Ada" }]
 *   matchMerge(
 *     [{ id: 1, score: 10 }],
 *     (a: { id: number; name: string }, b) => a.id === b.id,
 *   )(left) // [{ id: 1, name: "Ada", score: 10 }]
 *
 * @param rightValues - The right-side values.
 * @param matcher - The matcher to apply.
 */
export function matchMerge<Left extends object, Right extends object>(
  rightValues: IterableInput<Right>,
  matcher: Cb<NoInfer<Left>, Right>,
): (leftValues: IterableInput<Left>) => Merge<Left, Right>[]

// generic curry; selector fn
/**
 * Matches and merges left- and right-side objects.
 *
 * @example
 *   const left = [{ id: 1, name: "Ada" }]
 *   matchMerge(
 *     [{ id: 1, score: 10 }],
 *     (a: { id: number; name: string }, b) => a.id === b.id,
 *   )(left) // [{ id: 1, name: "Ada", score: 10 }]
 *
 * @param rightValues - The right-side values.
 * @param matcher - The matcher to apply.
 */
export function matchMerge<
  Right extends object,
  TMatcher extends Cb<never, Right>,
>(
  rightValues: IterableInput<Right>,
  matcher: TMatcher,
): <T extends TMatcher extends Cb<infer L, never> ? L : never>(
  leftValues: IterableInput<T>,
) => Merge<T, Right>[]

// normal
/**
 * Matches and merges left- and right-side objects.
 *
 * @example
 *   matchMerge([{ id: 1, name: "Ada" }], [{ id: 1, score: 10 }], "id") // [{ id: 1, name: "Ada", score: 10 }]
 *
 * @param leftValues - The left-side values.
 * @param rightValues - The right-side values.
 * @param matcher - The matcher to apply.
 */
export function matchMerge<Left extends object, Right extends object>(
  leftValues: IterableInput<Left>,
  rightValues: IterableInput<Right>,
  matcher: Cb<Left, Right> | MatchingPath<Left, Right>,
): Merge<Left, Right>[]

export function matchMerge(
  ...args:
    | [IterableInput<unknown>, Cb<unknown, unknown> | string]
    | [
        IterableInput<unknown>,
        IterableInput<unknown>,
        Cb<unknown, unknown> | string,
      ]
) {
  if (args.length === 2) {
    const [rightValues, matcher] = args
    const rightSource = toReadonlyArray(rightValues)

    return (<T>(leftValues: IterableInput<T>) =>
      impl(leftValues, rightSource, matcher, merge)) as unknown
  }

  return impl(...args, merge)
}
