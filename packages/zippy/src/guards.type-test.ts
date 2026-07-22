// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"

import {
  isDefined,
  isFalsy,
  isNullish,
  isNonNullish,
  isPlainObject,
  isReadonlyArray,
  isTruthy,
  isUndefined,
  propIsDefined,
  propIsFalsy,
  propIsNullish,
  propIsNonNullish,
  propIsPlainObject,
  propIsTruthy,
  propIsUndefined,
  type Falsy,
} from "./guards"
import { pipe } from "./pipe"

const values = [
  0,
  1,
  "",
  "zippy",
  false,
  true,
  null,
  undefined,
  0n,
  2n,
] as const

const truthy = values.filter(isTruthy)
const falsy = values.filter(isFalsy)
const nonNullish = values.filter(isNonNullish)
const defined = values.filter(isDefined)

/** Named fixture for reusable-value inference checks involving narrowFalsy. */
const narrowFalsy = [0, 1] as const satisfies ReadonlyArray<0 | 1>
const onlyZero = narrowFalsy.filter(isFalsy)

true satisfies IsEqual<typeof truthy, Array<1 | "zippy" | true | 2n>>
true satisfies IsEqual<typeof falsy, Falsy[]>
true satisfies IsEqual<
  typeof nonNullish,
  Array<0 | 1 | "" | "zippy" | false | true | 0n | 2n>
>
true satisfies IsEqual<
  typeof defined,
  Array<0 | 1 | "" | "zippy" | false | true | null | 0n | 2n>
>
true satisfies IsEqual<typeof onlyZero, 0[]>

declare const maybeNullish: number | null | undefined

if (isNullish(maybeNullish)) {
  true satisfies IsEqual<typeof maybeNullish, null | undefined>
} else {
  true satisfies IsEqual<typeof maybeNullish, number>
}

if (isNonNullish(maybeNullish)) {
  true satisfies IsEqual<typeof maybeNullish, number>
} else {
  true satisfies IsEqual<typeof maybeNullish, null | undefined>
}

declare const maybeUndefined: number | undefined

if (isUndefined(maybeUndefined)) {
  true satisfies IsEqual<typeof maybeUndefined, undefined>
} else {
  true satisfies IsEqual<typeof maybeUndefined, number>
}

if (isDefined(maybeUndefined)) {
  true satisfies IsEqual<typeof maybeUndefined, number>
} else {
  true satisfies IsEqual<typeof maybeUndefined, undefined>
}

declare const maybeVoid: number | void

if (isUndefined(maybeVoid)) {
  true satisfies IsEqual<typeof maybeVoid, void>
} else {
  true satisfies IsEqual<typeof maybeVoid, number>
}

if (isDefined(maybeVoid)) {
  true satisfies IsEqual<typeof maybeVoid, number>
} else {
  true satisfies IsEqual<typeof maybeVoid, void>
}

declare const maybeObject: unknown

if (isPlainObject(maybeObject)) {
  true satisfies IsEqual<typeof maybeObject, Record<PropertyKey, unknown>>
}

declare const maybeReadonlyArray: unknown

if (isReadonlyArray(maybeReadonlyArray)) {
  true satisfies IsEqual<typeof maybeReadonlyArray, ReadonlyArray<unknown>>
}

declare const maybeStringOrReadonlyArray: null | ReadonlyArray<string>

if (isReadonlyArray(maybeStringOrReadonlyArray)) {
  true satisfies IsEqual<
    typeof maybeStringOrReadonlyArray,
    ReadonlyArray<string>
  >
}

/** Named fixture for reusable-value inference checks involving mixedValues. */
const mixedValues: unknown[] = [
  1,
  ["zippy"] as const,
  { length: 1, 0: "zippy" },
  ["zip", "zap"] as const,
]

const arrays = mixedValues.filter(isReadonlyArray)

true satisfies IsEqual<typeof arrays, Array<ReadonlyArray<unknown>>>

type Contact =
  | { kind: "email"; email?: string | null }
  | { kind: "phone"; phone: string }

/** Named fixture for reusable-value inference checks involving contacts. */
const contacts = [] as Contact[]

/** Named fixture for reusable-value inference checks involving emailContacts. */
const emailContacts = contacts.filter(propIsTruthy("email"))

/**
 * Named fixture for reusable-value inference checks involving
 * nullishEmailContacts.
 */
const nullishEmailContacts = contacts.filter(propIsNullish("email"))
declare const maybeContact: Contact

emailContacts[0]!.kind satisfies "email"
emailContacts[0]!.email satisfies string
nullishEmailContacts[0]!.kind satisfies "email"
nullishEmailContacts[0]!.email satisfies null | undefined

if (pipe(maybeContact, propIsTruthy("email"))) {
  maybeContact.kind satisfies "email"
  maybeContact.email satisfies string
}

const users = [] as Array<{
  email?: string | null
  disabled?: boolean | 0 | ""
  profile?: { name?: string | null } | null
  payload?: unknown
}>

/** Named fixture for reusable-value inference checks involving withEmail. */
const withEmail = users.filter(propIsNonNullish("email"))

/** Named fixture for reusable-value inference checks involving withDefinedEmail. */
const withDefinedEmail = users.filter(propIsDefined("email"))

/** Named fixture for reusable-value inference checks involving withoutEmail. */
const withoutEmail = users.filter(propIsNullish("email"))

/** Named fixture for reusable-value inference checks involving withDisabled. */
const withDisabled = users.filter(propIsFalsy("disabled"))

/** Named fixture for reusable-value inference checks involving withMissingEmail. */
const withMissingEmail = users.filter(propIsUndefined("email"))

/** Named fixture for reusable-value inference checks involving withProfileName. */
const withProfileName = users.filter(propIsTruthy("profile.name"))

/**
 * Named fixture for reusable-value inference checks involving
 * withPayloadObject.
 */
const withPayloadObject = users.filter(propIsPlainObject("payload"))

/** Named fixture for reusable-value inference checks involving withMissingPath. */
const withMissingPath = users.filter(propIsTruthy("missing"))

withEmail[0]!.email satisfies string
withDefinedEmail[0]!.email satisfies string | null
withoutEmail[0]!.email satisfies null | undefined
withDisabled[0]!.disabled satisfies false | 0 | "" | undefined
withMissingEmail[0]!.email satisfies undefined
withProfileName[0]!.profile.name satisfies string
withPayloadObject[0]!.payload satisfies Record<PropertyKey, unknown>
withMissingPath satisfies never[]
