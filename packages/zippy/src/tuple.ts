/**
 * Preserves the literal tuple type of the passed values.
 *
 * @param values - The values to process.
 */
export function tuple<const Values extends unknown[]>(
  ...values: Values
): Values {
  return values
}
