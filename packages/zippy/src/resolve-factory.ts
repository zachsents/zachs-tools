type ResolveFactoryResult<T> = T extends (
  ...args: never[]
) => infer ResolvedValue
  ? ResolvedValue
  : T

/**
 * Resolves a value or invokes it when it is a function.
 *
 * @param value - The value to resolve.
 */
function resolveFactoryImpl(value: unknown) {
  return typeof value === "function" ? value() : value
}

/**
 * Resolves a value or zero-argument factory, directly or in data-last form.
 *
 * @example
 *   const resolve = resolveFactory()
 *   resolve(() => "zippy") // "zippy"
 */
export function resolveFactory(): <T>(value: T) => ResolveFactoryResult<T>

/**
 * Resolves a value or zero-argument factory, directly or in data-last form.
 *
 * @example
 *   resolveFactory(() => "zippy") // "zippy"
 *
 * @param value - The value or factory to resolve.
 */
export function resolveFactory<T>(value: T): ResolveFactoryResult<T>
export function resolveFactory(...args: [] | [unknown]) {
  if (args.length === 0) {
    return resolveFactoryImpl
  }

  return resolveFactoryImpl(args[0])
}
