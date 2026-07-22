import {
  isIterableInput,
  type IterableInput,
  toReadonlyArray,
} from "./iterable"
import { tuple } from "./tuple"

type ZipMerger<Left = unknown, Right = unknown, Mapped = unknown> = (
  leftValue: Left,
  rightValue: Right,
  index: number,
  leftValues: readonly Left[],
  rightValues: readonly Right[],
) => Mapped

/**
 * Zips two inputs with the provided merger.
 *
 * @param leftValues - The left-side values.
 * @param rightValues - The right-side values.
 * @param merger - The merger to apply.
 */
function zipImpl(
  leftValues: IterableInput<unknown>,
  rightValues: IterableInput<unknown>,
  merger: ZipMerger = (leftValue, rightValue) => tuple(leftValue, rightValue),
) {
  const leftSource = toReadonlyArray(leftValues)
  const rightSource = toReadonlyArray(rightValues)
  const result: unknown[] = []
  for (
    let index = 0;
    index < Math.min(leftSource.length, rightSource.length);
    index += 1
  ) {
    result.push(
      merger(
        leftSource[index],
        rightSource[index],
        index,
        leftSource,
        rightSource,
      ),
    )
  }

  return result
}

// authoritative pipe curry; merger
/**
 * Returns a function that zips the passed left values with the right values and
 * maps each pair with the merger function.
 *
 * @example
 *   const left = ["a", "b"]
 *   zip([1, 2], (l, r) => `${l}:${r}`)(left) // ["a:1", "b:2"]
 *
 * @param rightValues - The right-side values.
 * @param merger - The merger to apply.
 */
export function zip<Left, Right, Mapped>(
  rightValues: IterableInput<Right>,
  merger: ZipMerger<NoInfer<Left>, Right, Mapped> &
    (unknown extends Left ? never : unknown),
): (leftValues: IterableInput<Left>) => Mapped[]

// generic curry; merger
/**
 * Returns a function that zips the passed left values with the right values and
 * maps each pair with the merger function.
 *
 * @example
 *   const left = ["a", "b"]
 *   zip([1, 2], (l: string, r) => `${l}:${r}`)(left) // ["a:1", "b:2"]
 *
 * @param rightValues - The right-side values.
 * @param merger - The merger to apply.
 */
export function zip<Left, Right, Mapped>(
  rightValues: IterableInput<Right>,
  merger: ZipMerger<Left, Right, Mapped>,
): // oxlint-disable eslint/no-unnecessary-type-parameters -- returned generic preserves extra properties in data-last calls
<InputLeft extends Left>(leftValues: IterableInput<InputLeft>) => Mapped[]

// curried pairs
/**
 * Returns a function that zips the passed left values with the right values.
 *
 * @example
 *   const left = ["a", "b"]
 *   zip([1, 2])(left) // [["a", 1], ["b", 2]]
 *
 * @param rightValues - The right-side values.
 */
export function zip<Right>(
  rightValues: IterableInput<Right>,
): <Left>(leftValues: IterableInput<Left>) => Array<[Left, Right]>

// normal; merger
/**
 * Zips the passed arrays and maps each pair with the merger function.
 *
 * @example
 *   zip(["a", "b"], [1, 2], (l, r) => `${l}:${r}`) // ["a:1", "b:2"]
 *
 * @param leftValues - The left-side values.
 * @param rightValues - The right-side values.
 * @param merger - The merger to apply.
 */
export function zip<Left, Right, Mapped>(
  leftValues: IterableInput<Left>,
  rightValues: IterableInput<Right>,
  merger: ZipMerger<Left, Right, Mapped>,
): Mapped[]

// normal pairs
/**
 * Zips the passed arrays.
 *
 * @example
 *   zip(["a", "b"], [1, 2]) // [["a", 1], ["b", 2]]
 *
 * @param leftValues - The left-side values.
 * @param rightValues - The right-side values.
 */
export function zip<Left, Right>(
  leftValues: IterableInput<Left>,
  rightValues: IterableInput<Right>,
): Array<[Left, Right]>

export function zip(
  ...args:
    | [rightValues: IterableInput<unknown>]
    | [rightValues: IterableInput<unknown>, merger: ZipMerger]
    | [leftValues: IterableInput<unknown>, rightValues: IterableInput<unknown>]
    | [
        leftValues: IterableInput<unknown>,
        rightValues: IterableInput<unknown>,
        merger: ZipMerger,
      ]
) {
  if (args.length === 1) {
    const [rightValues] = args
    const rightSource = toReadonlyArray(rightValues)

    return (leftValues: IterableInput<unknown>) =>
      zipImpl(leftValues, rightSource)
  }

  if (args.length === 2) {
    const [leftOrRightValues, rightValuesOrMerger] = args

    if (isIterableInput(rightValuesOrMerger)) {
      return zipImpl(leftOrRightValues, rightValuesOrMerger)
    }

    const rightSource = toReadonlyArray(leftOrRightValues)

    return (leftValues: IterableInput<unknown>) =>
      zipImpl(leftValues, rightSource, rightValuesOrMerger)
  }

  return zipImpl(...args)
}
