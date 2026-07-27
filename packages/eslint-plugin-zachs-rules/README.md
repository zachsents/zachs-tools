# eslint-plugin-zachs-rules

A small set of custom ESLint rules.

## Rules

### ESLint and Oxlint

The rules that inspect TypeScript types run through the companion ESLint config
because Oxlint's JavaScript plugin API does not expose semantic type
information.

- `zachs-rules/require-intentional-module-const`

  - Reports module-level `const` variables with one to `maxUses` runtime reads.
  - Skips exports, SCREAMING_SNAKE_CASE and PascalCase names, function-valued
    constants, JSDoc-documented declarations, destructuring, `declare const`, and
    variables with non-initializer writes.
  - Type-only references such as `z.infer<typeof schema>` do not count as uses.

- `zachs-rules/require-intentional-single-use-local-const`

  - Reports local `const` variables with exactly one runtime read.
  - Skips loop bindings, explicitly annotated variables, function-valued
    constants, commented declarations, destructuring, declarations without
    initializers, and variables with later writes.
  - Skips reads across loops, conditional branches, short-circuiting
    expressions, optional chains, and exception-handling regions because
    inlining could change when or how often the initializer is evaluated.
  - Skips reads inside nested functions and closures by default. Set
    `ignoreNestedFunctionReads: false` to include them.

- `zachs-rules/prefer-inline-trivial-call-wrapper`

  - Reports non-exported function declarations used at one direct callsite when
    their body only forwards parameters and static data to a similarly named
    function.
  - Name similarity uses ordered camel-case, acronym, numeric, and snake-case
    tokens. The callee must contribute at least two tokens and cover at least
    60% of the wrapper name.
  - Skips transformed arguments, destructured parameters, optional or dynamic
    callees, multiple statements, indirect references, and reused helpers.

- `zachs-rules/require-intentional-single-use-type-alias`

  - Reports non-exported type aliases referenced only once.
  - Skips exported, recursive, reused, and JSDoc-documented aliases.

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
