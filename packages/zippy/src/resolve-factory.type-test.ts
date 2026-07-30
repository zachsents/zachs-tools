// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { pipe } from "./pipe"
import { resolveFactory } from "./resolve-factory"

const valueDataFirst = resolveFactory("zippy" as const)
const valueDataLast = resolveFactory()("zippy" as const)
const factoryDataFirst = resolveFactory(() => "zippy" as const)
const factoryDataLast = resolveFactory()(() => "zippy" as const)

true satisfies IsEqual<typeof valueDataFirst, "zippy">
true satisfies IsEqual<typeof valueDataLast, "zippy">
true satisfies IsEqual<typeof factoryDataFirst, "zippy">
true satisfies IsEqual<typeof factoryDataLast, "zippy">

declare const valueOrFactory: string | (() => string)

const unionDataFirst = resolveFactory(valueOrFactory)
const unionDataLast = resolveFactory()(valueOrFactory)
const unionPipe = pipe(valueOrFactory, resolveFactory())

true satisfies IsEqual<typeof unionDataFirst, string>
true satisfies IsEqual<typeof unionDataLast, string>
true satisfies IsEqual<typeof unionPipe, string>

declare const unionFactory:
  | (() => { readonly kind: "first"; readonly value: 1 })
  | (() => { readonly kind: "second"; readonly value: 2 })

const unionFactoryDataFirst = resolveFactory(unionFactory)
const unionFactoryDataLast = resolveFactory()(unionFactory)

true satisfies IsEqual<
  typeof unionFactoryDataFirst,
  | { readonly kind: "first"; readonly value: 1 }
  | { readonly kind: "second"; readonly value: 2 }
>
true satisfies IsEqual<
  typeof unionFactoryDataLast,
  | { readonly kind: "first"; readonly value: 1 }
  | { readonly kind: "second"; readonly value: 2 }
>
