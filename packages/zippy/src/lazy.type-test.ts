// This file is typechecked only and will never actually run.
import type { IsEqual } from "type-fest"
import { lazy } from "./lazy"

const getString = lazy(() => "zippy" as const)
const getObject = lazy(() => ({ name: "zippy", enabled: true }) as const)
const getUndefined = lazy(() => undefined)
const getPromise = lazy(async () => "zippy" as const)

true satisfies IsEqual<ReturnType<typeof getString>, "zippy">
true satisfies IsEqual<
  ReturnType<typeof getObject>,
  { readonly name: "zippy"; readonly enabled: true }
>
true satisfies IsEqual<ReturnType<typeof getUndefined>, undefined>
true satisfies IsEqual<ReturnType<typeof getPromise>, Promise<"zippy">>
