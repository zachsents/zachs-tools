# eslint-plugin-zachs-rules

A small set of custom ESLint rules.

## Rules

### ESLint and Oxlint

- `zachs-rules/no-overly-broad-parameters`

  - Reports explicitly typed parameters on non-exported function helpers when
    every visible direct callsite accepts a common narrower type.
  - Skips helpers that escape through a non-call reference, omitted or spread
    arguments, overloads, incompatible callsite types, and exported functions.

- `zachs-rules/prefer-inline-module-const`

  - Reports module-level `const` variables with one to `maxUses` runtime reads.
  - Skips exports, SCREAMING_SNAKE_CASE names, documented declarations,
    destructuring, `declare const`, and variables with non-initializer writes.
  - Type-only references such as `z.infer<typeof schema>` do not count as uses.

- `zachs-rules/prefer-inline-single-use-local-const`

  - Reports local `const` variables with exactly one runtime read.
  - Skips loop bindings, explicitly annotated variables, destructuring,
    declarations without initializers, and variables with later writes.

- `zachs-rules/no-single-use-type-alias`

  - Reports non-exported type aliases referenced only once.

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

- `zachs-rules/require-disable-directive-description`
  - Reports disable directives recognized by oxlint that do not include a
    description after `--`.

## Usage

The rules are enabled by the two concrete configs shipped from
`@zachsents/oxlint-config`.

```ts
// eslint.config.ts
export { default } from "@zachsents/oxlint-config/eslint"
```

```ts
// oxlint.config.ts
export { default } from "@zachsents/oxlint-config"
```

Loading `oxlint.config.ts` requires Node.js `^20.19.0` or `>=22.18.0`.

## Development

```sh
bun install
bun run check
```

The package uses Bun, Prettier, oxlint with type-aware linting, and zshy for
build output.
