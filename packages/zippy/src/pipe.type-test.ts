// This file is typechecked only and will never actually run.
import { pipe as remedaPipe, piped as remedaPiped } from "remeda"
import type { IsEqual } from "type-fest"
import { pipe, pipeAsync, piped, pipedAsync } from "./pipe"

/**
 * Named fixture for reusable-value inference checks involving
 * pipeMatchesRemeda.
 */
const pipeMatchesRemeda: typeof remedaPipe = pipe

/**
 * Named fixture for reusable-value inference checks involving
 * pipedMatchesRemeda.
 */
const pipedMatchesRemeda: typeof remedaPiped = piped

/**
 * Named fixture for reusable-value inference checks involving
 * remedaMatchesPiped.
 */
const remedaMatchesPiped: typeof piped = remedaPiped

void pipeMatchesRemeda
void pipedMatchesRemeda
void remedaMatchesPiped

const zippyPipeResult = pipe(
  1 as const,
  (value) => value + 1,
  (value) => `${value}` as const,
  (value) => ({ value }),
)
const remedaPipeResult = remedaPipe(
  1 as const,
  (value) => value + 1,
  (value) => `${value}` as const,
  (value) => ({ value }),
)
const zippyLongPipeResult = pipe(
  1,
  (value) => value + 1,
  (value) => `${value}`,
  (value) => value.length,
  (value) => value > 0,
  (value) => (value ? ["zippy"] : []),
  (value) => value.length,
  (value) => value * 2,
  (value) => value + 1,
  (value) => ({ value }),
  (value) => value.value,
  (value) => value.toString(),
  (value) => value.split(""),
  (value) => value.join(""),
  (value) => Number(value),
  (value) => value > 0,
)
const remedaLongPipeResult = remedaPipe(
  1,
  (value) => value + 1,
  (value) => `${value}`,
  (value) => value.length,
  (value) => value > 0,
  (value) => (value ? ["zippy"] : []),
  (value) => value.length,
  (value) => value * 2,
  (value) => value + 1,
  (value) => ({ value }),
  (value) => value.value,
  (value) => value.toString(),
  (value) => value.split(""),
  (value) => value.join(""),
  (value) => Number(value),
  (value) => value > 0,
)
const zippyPipedResult = piped(
  (value: number) => value + 1,
  (value) => `${value}` as const,
  (value) => ({ value }),
)(1)
const remedaPipedResult = remedaPiped(
  (value: number) => value + 1,
  (value) => `${value}` as const,
  (value) => ({ value }),
)(1)

true satisfies IsEqual<typeof zippyPipeResult, typeof remedaPipeResult>
true satisfies IsEqual<typeof zippyLongPipeResult, typeof remedaLongPipeResult>
true satisfies IsEqual<typeof zippyPipedResult, typeof remedaPipedResult>

const asyncInitialPromise = pipeAsync(
  Promise.resolve(1 as const),
  (value) => value + 1,
  async (value) => `${value}` as const,
  (value) => value.length,
)
declare const asyncUnionInput: 1 | 2
const asyncMiddlePromise = pipeAsync(
  asyncUnionInput,
  (value) =>
    Promise.resolve(value === 1 ? ("one" as const) : ("other" as const)),
  (value) => (value === "one" ? 1 : 2),
)

/** Named fixture for reusable-value inference checks involving asyncReusable. */
const asyncReusable = pipedAsync(
  (value: number) => Promise.resolve(value + 1),
  (value) => `${value}` as const,
  (value) => value.length,
)
const asyncReusableResult = asyncReusable(Promise.resolve(1))
const asyncIdentity = pipedAsync<number>()(Promise.resolve(1))

true satisfies IsEqual<typeof asyncInitialPromise, Promise<number>>
true satisfies IsEqual<typeof asyncMiddlePromise, Promise<1 | 2>>
true satisfies IsEqual<typeof asyncReusableResult, Promise<number>>
true satisfies IsEqual<typeof asyncIdentity, Promise<number>>
