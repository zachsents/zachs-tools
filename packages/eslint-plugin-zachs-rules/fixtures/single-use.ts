declare function getValue(): string
declare function getObject(): { destructured: string }

const once = getValue()
console.log(once)

const API_URL = getValue()
console.log(API_URL)

const twice = getValue()
console.log(twice)
console.log(twice)

export function run(input: string) {
  const scopedOnce = input.trim()
  return scopedOnce
}

export const exported = "public-api"

const { destructured } = getObject()
console.log(destructured)

declare const declaredOnce: string
console.log(declaredOnce)
