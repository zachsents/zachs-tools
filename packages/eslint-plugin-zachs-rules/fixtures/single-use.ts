declare function getValue(): string
declare function getObject(): { destructured: string }

const once = getValue()
console.log(once)

const API_URL = getValue()
console.log(API_URL)

/** A documented module constant is intentionally named and retained. */
const documented = getValue()
console.log(documented)

const twice = getValue()
console.log(twice)
console.log(twice)

export function run(input: string) {
  const scopedOnce = input.trim()
  return scopedOnce
}

export function useTwice(input: string) {
  const uri = input.trim()
  console.log(uri)
  return uri
}

export function explicitlyTyped(input: string) {
  const result: string = input.trim()
  return result
}

export function loopVariables(values: string[]) {
  for (const value of values) {
    console.log(value)
  }
}

export const exported = "public-api"

const { destructured } = getObject()
console.log(destructured)

declare const declaredOnce: string
console.log(declaredOnce)

const jsonRpcMessageSchema = getValue()
type JsonRpcMessage = typeof jsonRpcMessageSchema
declare function consumeJsonRpcMessage(message: JsonRpcMessage): void

type UsedTwice = string
declare function consumeTwice(message: UsedTwice): UsedTwice

export type ExportedType = string
