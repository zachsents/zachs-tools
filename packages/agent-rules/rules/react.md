# React Rules

> Only applies in React projects.

## React Compiler

- Assume React Compiler is enabled unless the project explicitly states otherwise.
- Never use `useCallback`, `useMemo`, or `React.memo`; the compiler handles memoization.
  - Exception: wrapping a third-party library that breaks without manual memoization.

## Modern React

- Use `ref` as a regular prop. `forwardRef` is no longer needed in React 19.
- Ref callbacks can return a cleanup function. Prefer inline ref callbacks for per-element observers such as `ResizeObserver` or `IntersectionObserver`.
- When using `useEffect` to subscribe to events, use `useEffectEvent` for the handler. The effect should only manage subscription and cleanup.
- Prefer the `use()` hook for reading promises and context in render.
- Use error boundaries to isolate failures in distinct UI sections.

## Components & Hooks

- Keep components small; move non-UI logic into hooks.
- One component or hook per file unless trivial.
- Avoid `useEffect` whenever possible; prefer event-driven architecture.
- Always strictly follow the Rules of React.

## JSDoc

- Let TypeScript prop types document a component's parameters. Require a useful
  component-level JSDoc description when appropriate, but do not duplicate the
  prop type as `@param` tags that can become stale.
- When extending `@zachsents/oxlint-config/react`, preserve its
  `jsdoc-js/require-param` override. If configuring the rule directly, use this
  pattern so typed props are exempt while untyped parameters remain checked:

  ```ts
  "jsdoc-js/require-param": [
    "error",
    {
      enableFixer: false,
      interfaceExemptsParamsCheck: true,
    },
  ]
  ```
