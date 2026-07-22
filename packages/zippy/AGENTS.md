# Zippy Guidelines

These rules supplement the repository-wide instructions in the root `AGENTS.md`.

## TypeScript

- Overloaded implementations: omit return annotation; annotate overload signatures. Implementation annotations fight inference.
- Overload order is API surface, especially for data-last selectors. Language-server selection uses order and inference such as `NoInfer<T>`, affecting autocomplete even when CLI type tests pass.
- Selector pairs: authoritative/contextual overload before generic fallback. Keep `selector: SelectorFunction<NoInfer<T>, number> -> (values: readonly T[]) => number` before `selector: SelectorFunction<T, number> -> <U extends T>(values: readonly U[]) => number`. First improves callback autocomplete from eventual values; second preserves extra properties on later inline values.
- Inline one-use helpers/types for trivial checks, simple unions, or direct selector dispatch. Extract only when reused, encoding a domain invariant, or removing meaningful complexity.

## Type tests

- When a data-last selector is narrower than values, test its returned function with named values and inline arrays. `(values: readonly T[]) => number` may reject only the inline case through excess-property checking; use `<U extends T>(values: readonly U[]) => number` to allow extra properties.
- Compare generic vs non-generic returned functions. Do not delete the selector overload while `NoInfer<T>` remains; that tests overload selection instead of returned-function inference.

## Source layout

- Keep flat `packages/zippy/src` layout. Group variants (`sum`/`sumBy`, `filter`/`filterOut`) with top-level `.test.ts` and `.type-test.ts` files. No nested utility folders, per-function barrels, or shared helpers unless existing precedent matches.

## Publishing

- Publish only on explicit request; then complete it from CLI with the repo script when available.
- Use interactive PTY. On `Press ENTER to open in the browser...`, press Enter and keep process running for browser approval.
- After non-interactive `EOTP`, retry interactively. Request OTP only if browser auth is unavailable, fails, or asks for code.
- Verify success with `npm view <package>@<version> version --prefer-online` and the `latest` dist-tag. `npm view <package> version` may be briefly stale.

## Release prep

- “Release” means prepare npm release for CI, not local publish, unless manual publish is explicit.
- Run `git status`; scope release commit. Version lives in `packages/zippy/package.json` and `bun.lock`; stage only those and intentionally changed release docs.
- Semver since latest `vX.Y.Z`: patch for fixes/docs/internal-only changes; minor for public helpers/options; major for breaking API. Pre-1.0 features still use minor.
- Run `bun run --cwd packages/zippy check`; remove uncommitted build/pack artifacts before staging.
- Commit `chore: release zippy X.Y.Z`; push current `main`. `.github/workflows/npm-release.yml` publishes npm/GitHub release when package version increases.
