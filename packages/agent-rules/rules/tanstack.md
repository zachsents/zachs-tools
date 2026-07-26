# TanStack Router and Start Rules

> Applies when working with TanStack Router or TanStack Start.

## Routing

- Use TanStack Router `Link` from `@tanstack/react-router` for internal navigation.
- Do not manually regenerate the TanStack Router route tree while the web dev server is running; the dev server updates it automatically.

## Search Params

- For TanStack Router `validateSearch`, use tolerant Zod schemas for user-controlled params, usually ending individual params in `.catch(...)`, so malformed URLs do not throw the whole route.
- Keep search-param defaults in the schema. Use `.prefault(...)` when defaults should still flow through transforms, and pair default-valued params with `stripSearchParams(...)` middleware to keep URLs clean.
