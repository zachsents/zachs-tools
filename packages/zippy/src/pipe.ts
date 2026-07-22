import type { Promisable } from "type-fest"

type PipeFunction<Input, Output> = (input: Input) => Output
type PipeImplementationFunction = (input: never) => unknown

/**
 * Calls a pipe function while preserving type-guard behavior.
 *
 * @param func - The function to call.
 * @param input - The input value.
 */
function callPipeFunction(func: PipeImplementationFunction, input: unknown) {
  return Reflect.apply(func, undefined, [input]) as unknown
}

/**
 * Applies synchronous pipe functions to a value.
 *
 * @param input - The input value.
 * @param functions - The functions to compose.
 */
function pipeValue(
  input: unknown,
  functions: readonly PipeImplementationFunction[],
) {
  let output = input

  for (const func of functions) {
    output = callPipeFunction(func, output)
  }

  return output
}

/**
 * Applies synchronous or asynchronous pipe functions to a value.
 *
 * @param input - The input value.
 * @param functions - The functions to compose.
 */
async function pipeValueAsync(
  input: unknown,
  functions: readonly PipeImplementationFunction[],
) {
  let output = await input

  for (const func of functions) {
    output = await callPipeFunction(func, output)
  }

  return output
}

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   pipe(1) // 1
 *
 * @param data - The initial pipeline value.
 */
export function pipe<A>(data: A): A

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const value: number | string = "zippy"
 *   pipe(value, (input): input is string => typeof input === "string") // true
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 */
export function pipe<A, B extends A>(
  data: A,
  funcA: (input: A) => input is B,
): data is B

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(0, increment) // 1
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 */
export function pipe<A, B>(data: A, funcA: PipeFunction<A, B>): B

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(0, increment, increment) // 2
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 */
export function pipe<A, B, C>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
): C

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(0, increment, increment, increment) // 3
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 */
export function pipe<A, B, C, D>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
): D

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(0, increment, increment, increment, increment) // 4
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 */
export function pipe<A, B, C, D, E>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
): E

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(0, increment, increment, increment, increment, increment) // 5
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 */
export function pipe<A, B, C, D, E, F>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
): F

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(0, increment, increment, increment, increment, increment, increment) // 6
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 */
export function pipe<A, B, C, D, E, F, G>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
): G

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(
 *     0,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   ) // 7
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 */
export function pipe<A, B, C, D, E, F, G, H>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
): H

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(
 *     0,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   ) // 8
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 */
export function pipe<A, B, C, D, E, F, G, H, I>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
): I

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(
 *     0,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   ) // 9
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 */
export function pipe<A, B, C, D, E, F, G, H, I, J>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
): J

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(
 *     0,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   ) // 10
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 */
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
  funcJ: PipeFunction<J, K>,
): K

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(
 *     0,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   ) // 11
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 */
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
  funcJ: PipeFunction<J, K>,
  funcK: PipeFunction<K, L>,
): L

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(
 *     0,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   ) // 12
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 */
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
  funcJ: PipeFunction<J, K>,
  funcK: PipeFunction<K, L>,
  funcL: PipeFunction<L, M>,
): M

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(
 *     0,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   ) // 13
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 * @param funcM - The next pipe function.
 */
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
  funcJ: PipeFunction<J, K>,
  funcK: PipeFunction<K, L>,
  funcL: PipeFunction<L, M>,
  funcM: PipeFunction<M, N>,
): N

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(
 *     0,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   ) // 14
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 * @param funcM - The next pipe function.
 * @param funcN - The next pipe function.
 */
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
  funcJ: PipeFunction<J, K>,
  funcK: PipeFunction<K, L>,
  funcL: PipeFunction<L, M>,
  funcM: PipeFunction<M, N>,
  funcN: PipeFunction<N, O>,
): O

/**
 * Pipes a value through the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   pipe(
 *     0,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   ) // 15
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 * @param funcM - The next pipe function.
 * @param funcN - The next pipe function.
 * @param funcO - The next pipe function.
 */
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  data: A,
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
  funcJ: PipeFunction<J, K>,
  funcK: PipeFunction<K, L>,
  funcL: PipeFunction<L, M>,
  funcM: PipeFunction<M, N>,
  funcN: PipeFunction<N, O>,
  funcO: PipeFunction<O, P>,
): P
export function pipe(
  data: unknown,
  ...functions: readonly PipeImplementationFunction[]
) {
  return pipeValue(data, functions)
}

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   piped<number>()(1) // 1
 */
export function piped<A>(): PipeFunction<A, A>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(increment)(0) // 1
 *
 * @param funcA - The first pipe function.
 */
export function piped<A, B>(funcA: PipeFunction<A, B>): PipeFunction<A, B>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(increment, increment)(0) // 2
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 */
export function piped<A, B, C>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
): PipeFunction<A, C>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(increment, increment, increment)(0) // 3
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 */
export function piped<A, B, C, D>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
): PipeFunction<A, D>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(increment, increment, increment, increment)(0) // 4
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 */
export function piped<A, B, C, D, E>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
): PipeFunction<A, E>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(increment, increment, increment, increment, increment)(0) // 5
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 */
export function piped<A, B, C, D, E, F>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
): PipeFunction<A, F>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   )(0) // 6
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 */
export function piped<A, B, C, D, E, F, G>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
): PipeFunction<A, G>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   )(0) // 7
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 */
export function piped<A, B, C, D, E, F, G, H>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
): PipeFunction<A, H>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   )(0) // 8
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 */
export function piped<A, B, C, D, E, F, G, H, I>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
): PipeFunction<A, I>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   )(0) // 9
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 */
export function piped<A, B, C, D, E, F, G, H, I, J>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
): PipeFunction<A, J>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   )(0) // 10
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 */
export function piped<A, B, C, D, E, F, G, H, I, J, K>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
  funcJ: PipeFunction<J, K>,
): PipeFunction<A, K>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   )(0) // 11
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 */
export function piped<A, B, C, D, E, F, G, H, I, J, K, L>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
  funcJ: PipeFunction<J, K>,
  funcK: PipeFunction<K, L>,
): PipeFunction<A, L>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   )(0) // 12
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 */
export function piped<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
  funcJ: PipeFunction<J, K>,
  funcK: PipeFunction<K, L>,
  funcL: PipeFunction<L, M>,
): PipeFunction<A, M>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   )(0) // 13
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 * @param funcM - The next pipe function.
 */
export function piped<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
  funcJ: PipeFunction<J, K>,
  funcK: PipeFunction<K, L>,
  funcL: PipeFunction<L, M>,
  funcM: PipeFunction<M, N>,
): PipeFunction<A, N>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   )(0) // 14
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 * @param funcM - The next pipe function.
 * @param funcN - The next pipe function.
 */
export function piped<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
  funcJ: PipeFunction<J, K>,
  funcK: PipeFunction<K, L>,
  funcL: PipeFunction<L, M>,
  funcM: PipeFunction<M, N>,
  funcN: PipeFunction<N, O>,
): PipeFunction<A, O>

/**
 * Creates a reusable pipeline from the provided functions.
 *
 * @example
 *   const increment = (value: number) => value + 1
 *   piped(
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *     increment,
 *   )(0) // 15
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 * @param funcM - The next pipe function.
 * @param funcN - The next pipe function.
 * @param funcO - The next pipe function.
 */
export function piped<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<B, C>,
  funcC: PipeFunction<C, D>,
  funcD: PipeFunction<D, E>,
  funcE: PipeFunction<E, F>,
  funcF: PipeFunction<F, G>,
  funcG: PipeFunction<G, H>,
  funcH: PipeFunction<H, I>,
  funcI: PipeFunction<I, J>,
  funcJ: PipeFunction<J, K>,
  funcK: PipeFunction<K, L>,
  funcL: PipeFunction<L, M>,
  funcM: PipeFunction<M, N>,
  funcN: PipeFunction<N, O>,
  funcO: PipeFunction<O, P>,
): PipeFunction<A, P>
export function piped(...functions: readonly PipeImplementationFunction[]) {
  return (data: unknown) => pipeValue(data, functions)
}

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   await pipeAsync(Promise.resolve(1)) // 1
 *
 * @param data - The initial pipeline value.
 */
export function pipeAsync<A>(data: A): Promise<Awaited<A>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(0, incrementAsync) // 1
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 */
export function pipeAsync<A, B>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
): Promise<Awaited<B>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(0, incrementAsync, incrementAsync) // 2
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 */
export function pipeAsync<A, B, C>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
): Promise<Awaited<C>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(0, incrementAsync, incrementAsync, incrementAsync) // 3
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 */
export function pipeAsync<A, B, C, D>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
): Promise<Awaited<D>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(
 *     0,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   ) // 4
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 */
export function pipeAsync<A, B, C, D, E>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
): Promise<Awaited<E>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(
 *     0,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   ) // 5
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 */
export function pipeAsync<A, B, C, D, E, F>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
): Promise<Awaited<F>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(
 *     0,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   ) // 6
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 */
export function pipeAsync<A, B, C, D, E, F, G>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
): Promise<Awaited<G>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(
 *     0,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   ) // 7
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 */
export function pipeAsync<A, B, C, D, E, F, G, H>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
): Promise<Awaited<H>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(
 *     0,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   ) // 8
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 */
export function pipeAsync<A, B, C, D, E, F, G, H, I>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
): Promise<Awaited<I>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(
 *     0,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   ) // 9
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 */
export function pipeAsync<A, B, C, D, E, F, G, H, I, J>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
): Promise<Awaited<J>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(
 *     0,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   ) // 10
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 */
export function pipeAsync<A, B, C, D, E, F, G, H, I, J, K>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
  funcJ: PipeFunction<Awaited<J>, K>,
): Promise<Awaited<K>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(
 *     0,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   ) // 11
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 */
export function pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
  funcJ: PipeFunction<Awaited<J>, K>,
  funcK: PipeFunction<Awaited<K>, L>,
): Promise<Awaited<L>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(
 *     0,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   ) // 12
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 */
export function pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
  funcJ: PipeFunction<Awaited<J>, K>,
  funcK: PipeFunction<Awaited<K>, L>,
  funcL: PipeFunction<Awaited<L>, M>,
): Promise<Awaited<M>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(
 *     0,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   ) // 13
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 * @param funcM - The next pipe function.
 */
export function pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
  funcJ: PipeFunction<Awaited<J>, K>,
  funcK: PipeFunction<Awaited<K>, L>,
  funcL: PipeFunction<Awaited<L>, M>,
  funcM: PipeFunction<Awaited<M>, N>,
): Promise<Awaited<N>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(
 *     0,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   ) // 14
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 * @param funcM - The next pipe function.
 * @param funcN - The next pipe function.
 */
export function pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
  funcJ: PipeFunction<Awaited<J>, K>,
  funcK: PipeFunction<Awaited<K>, L>,
  funcL: PipeFunction<Awaited<L>, M>,
  funcM: PipeFunction<Awaited<M>, N>,
  funcN: PipeFunction<Awaited<N>, O>,
): Promise<Awaited<O>>

/**
 * Pipes a value through synchronous or asynchronous functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipeAsync(
 *     0,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   ) // 15
 *
 * @param data - The initial pipeline value.
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 * @param funcM - The next pipe function.
 * @param funcN - The next pipe function.
 * @param funcO - The next pipe function.
 */
export function pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  data: A,
  funcA: PipeFunction<Awaited<A>, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
  funcJ: PipeFunction<Awaited<J>, K>,
  funcK: PipeFunction<Awaited<K>, L>,
  funcL: PipeFunction<Awaited<L>, M>,
  funcM: PipeFunction<Awaited<M>, N>,
  funcN: PipeFunction<Awaited<N>, O>,
  funcO: PipeFunction<Awaited<O>, P>,
): Promise<Awaited<P>>
export function pipeAsync(
  data: unknown,
  ...functions: readonly PipeImplementationFunction[]
) {
  return pipeValueAsync(data, functions)
}

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   await pipedAsync<number>()(1) // 1
 */
export function pipedAsync<A>(): PipeFunction<
  Promisable<A>,
  Promise<Awaited<A>>
>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(incrementAsync)(0) // 1
 *
 * @param funcA - The first pipe function.
 */
export function pipedAsync<A, B>(
  funcA: PipeFunction<A, B>,
): PipeFunction<Promisable<A>, Promise<Awaited<B>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(incrementAsync, incrementAsync)(0) // 2
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 */
export function pipedAsync<A, B, C>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
): PipeFunction<Promisable<A>, Promise<Awaited<C>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(incrementAsync, incrementAsync, incrementAsync)(0) // 3
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 */
export function pipedAsync<A, B, C, D>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
): PipeFunction<Promisable<A>, Promise<Awaited<D>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   )(0) // 4
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 */
export function pipedAsync<A, B, C, D, E>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
): PipeFunction<Promisable<A>, Promise<Awaited<E>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   )(0) // 5
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 */
export function pipedAsync<A, B, C, D, E, F>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
): PipeFunction<Promisable<A>, Promise<Awaited<F>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   )(0) // 6
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 */
export function pipedAsync<A, B, C, D, E, F, G>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
): PipeFunction<Promisable<A>, Promise<Awaited<G>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   )(0) // 7
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 */
export function pipedAsync<A, B, C, D, E, F, G, H>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
): PipeFunction<Promisable<A>, Promise<Awaited<H>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   )(0) // 8
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 */
export function pipedAsync<A, B, C, D, E, F, G, H, I>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
): PipeFunction<Promisable<A>, Promise<Awaited<I>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   )(0) // 9
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 */
export function pipedAsync<A, B, C, D, E, F, G, H, I, J>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
): PipeFunction<Promisable<A>, Promise<Awaited<J>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   )(0) // 10
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 */
export function pipedAsync<A, B, C, D, E, F, G, H, I, J, K>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
  funcJ: PipeFunction<Awaited<J>, K>,
): PipeFunction<Promisable<A>, Promise<Awaited<K>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   )(0) // 11
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 */
export function pipedAsync<A, B, C, D, E, F, G, H, I, J, K, L>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
  funcJ: PipeFunction<Awaited<J>, K>,
  funcK: PipeFunction<Awaited<K>, L>,
): PipeFunction<Promisable<A>, Promise<Awaited<L>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   )(0) // 12
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 */
export function pipedAsync<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
  funcJ: PipeFunction<Awaited<J>, K>,
  funcK: PipeFunction<Awaited<K>, L>,
  funcL: PipeFunction<Awaited<L>, M>,
): PipeFunction<Promisable<A>, Promise<Awaited<M>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   )(0) // 13
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 * @param funcM - The next pipe function.
 */
export function pipedAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
  funcJ: PipeFunction<Awaited<J>, K>,
  funcK: PipeFunction<Awaited<K>, L>,
  funcL: PipeFunction<Awaited<L>, M>,
  funcM: PipeFunction<Awaited<M>, N>,
): PipeFunction<Promisable<A>, Promise<Awaited<N>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   )(0) // 14
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 * @param funcM - The next pipe function.
 * @param funcN - The next pipe function.
 */
export function pipedAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
  funcJ: PipeFunction<Awaited<J>, K>,
  funcK: PipeFunction<Awaited<K>, L>,
  funcL: PipeFunction<Awaited<L>, M>,
  funcM: PipeFunction<Awaited<M>, N>,
  funcN: PipeFunction<Awaited<N>, O>,
): PipeFunction<Promisable<A>, Promise<Awaited<O>>>

/**
 * Creates a reusable asynchronous pipeline from the provided functions.
 *
 * @example
 *   const incrementAsync = async (value: number) => value + 1
 *   await pipedAsync(
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *     incrementAsync,
 *   )(0) // 15
 *
 * @param funcA - The first pipe function.
 * @param funcB - The next pipe function.
 * @param funcC - The next pipe function.
 * @param funcD - The next pipe function.
 * @param funcE - The next pipe function.
 * @param funcF - The next pipe function.
 * @param funcG - The next pipe function.
 * @param funcH - The next pipe function.
 * @param funcI - The next pipe function.
 * @param funcJ - The next pipe function.
 * @param funcK - The next pipe function.
 * @param funcL - The next pipe function.
 * @param funcM - The next pipe function.
 * @param funcN - The next pipe function.
 * @param funcO - The next pipe function.
 */
export function pipedAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  funcA: PipeFunction<A, B>,
  funcB: PipeFunction<Awaited<B>, C>,
  funcC: PipeFunction<Awaited<C>, D>,
  funcD: PipeFunction<Awaited<D>, E>,
  funcE: PipeFunction<Awaited<E>, F>,
  funcF: PipeFunction<Awaited<F>, G>,
  funcG: PipeFunction<Awaited<G>, H>,
  funcH: PipeFunction<Awaited<H>, I>,
  funcI: PipeFunction<Awaited<I>, J>,
  funcJ: PipeFunction<Awaited<J>, K>,
  funcK: PipeFunction<Awaited<K>, L>,
  funcL: PipeFunction<Awaited<L>, M>,
  funcM: PipeFunction<Awaited<M>, N>,
  funcN: PipeFunction<Awaited<N>, O>,
  funcO: PipeFunction<Awaited<O>, P>,
): PipeFunction<Promisable<A>, Promise<Awaited<P>>>
export function pipedAsync(
  ...functions: readonly PipeImplementationFunction[]
) {
  return (data: unknown) => pipeValueAsync(data, functions)
}
