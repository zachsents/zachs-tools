# eslint-plugin-zachs-rules

A small set of custom ESLint rules.

## Rules

### ESLint

- `zachs-rules/no-overly-broad-parameters`

  - Reports explicitly typed parameters on non-exported function helpers when
    every visible direct callsite accepts a common narrower type.
  - Skips helpers that escape through a non-call reference, omitted or spread
    arguments, overloads, incompatible callsite types, and exported functions.

- `zachs-rules/no-single-use-const`

  - Reports `const` variables that are read up to a configurable threshold and
    can often be inlined.
  - Set `{ maxUses: 2 }` to report const variables read up to two times. The
    default is `1`.
  - Skips exports, destructuring, `declare const`, and variables with
    non-initializer writes.
  - Set `{ ignoreConstantCase: true }` to skip names like `API_URL` and
    `VARS_LIKE_THIS`.

- `zachs-rules/prefer-object-spread-for-exact-object-map`

  - Reports repeated same-name property maps when TypeScript proves the mapped
    keys exactly match the source object's known properties.
  - Recommendation: `{ ...deployment }`.

- `zachs-rules/prefer-pick-for-object-subset-map`
  - Reports repeated same-name property maps when TypeScript proves the mapped
    keys are a subset of the source object's known properties, or the source has
    an index signature.
  - Recommendation: `pick(deployment, ["createdAt", "id", "projectId", "status"])`.

The object-map rules intentionally skip renamed properties, computed
properties, already-spread objects, single-property mappings, unions, and
unknown-like source types.

### Oxlint

- `zachs-rules/require-disable-directive-description`
  - Reports disable directives recognized by oxlint that do not include a
    description after `--`.

## ESLint Usage

```ts
// eslint.config.ts
import { defineConfig } from "eslint/config"
import zachsRules from "eslint-plugin-zachs-rules"

export default defineConfig([zachsRules.configs["recommended-type-checked"]])
```

Use `zachsRules.configs.recommended` to enable only the non-type-aware
`no-single-use-const` rule. The `recommended-type-checked` preset enables every
ESLint rule, configures `@typescript-eslint/parser`, and uses the TypeScript
project service. Both presets configure `no-single-use-const` with
`{ ignoreConstantCase: true, maxUses: 3 }`.

## Oxlint Usage

```ts
// oxlint.config.ts
import { defineConfig } from "oxlint"
import recommended from "eslint-plugin-zachs-rules/oxlint/recommended"

export default defineConfig({
  extends: [recommended],
})
```

Loading `oxlint.config.ts` requires Node.js `^20.19.0` or `>=22.18.0`.

## Development

```sh
bun install
bun run check
```

The package uses Bun, Prettier, oxlint with type-aware linting, and zshy for
build output.
