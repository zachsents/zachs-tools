/**
 * Creates a getter that loads its value on first access and caches the result.
 * Promises are cached as values, while a loader that throws is retried on the
 * next access.
 *
 * @example
 *   const getConfig = lazy(() => ({ name: "zippy" }))
 *   getConfig() // { name: "zippy" }
 *
 * @param load - The function that loads the value.
 */
export function lazy<T>(load: () => T): () => T {
  let cache: { value: T } | undefined

  return () => (cache ??= { value: load() }).value
}
