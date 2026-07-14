function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to sign in"
}

declare const firstError: Error
declare const secondError: Error

errorMessage(firstError)
errorMessage(secondError)

const stringifyError = (error: Error | string) => String(error)

stringifyError(firstError)
stringifyError(secondError)

function errorWithThis(this: void, error: unknown) {
  return String(error)
}

errorWithThis(firstError)
errorWithThis(secondError)

function alreadyNarrow(error: Error) {
  return error.message
}

alreadyNarrow(firstError)
alreadyNarrow(secondError)

function mixedCallsites(value: unknown) {
  return String(value)
}

mixedCallsites(firstError)
mixedCallsites("not an error")

function escapedHelper(value: unknown) {
  return String(value)
}

declare function register(callback: (value: unknown) => string): void

register(escapedHelper)
escapedHelper(firstError)

function sometimesOmitted(value?: Error) {
  return value?.message
}

sometimesOmitted(firstError)
sometimesOmitted()

export function exportedHelper(error: unknown) {
  return String(error)
}

exportedHelper(firstError)

function reexportedHelper(error: unknown) {
  return String(error)
}

reexportedHelper(firstError)

export { reexportedHelper }
