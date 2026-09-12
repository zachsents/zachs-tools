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
- Prefer the `use()` hook for reading context in render. Use React Query for
  async data.
- Use error boundaries to isolate failures in distinct UI sections.

## Components & Hooks

- Keep components small; move non-UI logic into hooks.
- One component or hook per file unless trivial.
- Give component props a named interface.
- Avoid `useEffect` whenever possible; prefer event-driven architecture.
- Always strictly follow the Rules of React.
- For a small static list whose items have distinct markup, write the items
  directly or extract a shared component. Do not force them through a data array
  that needs identity checks or one-off JSX values.

## Async State

- Always use TanStack React Query for async operations: queries for reads and
  mutations for writes or imperative async actions.
- Manual loading, pending, and error state management is strictly prohibited.
  Do not track async lifecycle state with `useState`, `useReducer`, refs, stores,
  or custom async wrappers, including `setLoading` / `setError` patterns around
  `try/catch/finally`.
- Derive loading indicators, disabled controls, and error messages directly from
  React Query's query or mutation state. Never mirror that state locally.
- Do not fetch data in effects or hand-roll request lifecycle management. Keep
  synchronous UI state local when appropriate.

## UI Primitives

- Use shadcn components for standard UI primitives. Add a missing primitive with
  the shadcn CLI instead of hand-rolling an equivalent.
- Treat shadcn-generated classes as design-system defaults. Do not flag,
  restate, or override them from consumers unless the exception is intentional.
- Let design-system components such as buttons, menus, and badges size their
  icons. Do not add consumer-level icon sizing without an intentional exception.
- Do not add transitions, custom leading or tracking, or breakpoint-specific
  font-size changes unless the user requests them.

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
