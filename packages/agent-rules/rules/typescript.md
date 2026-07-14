# TypeScript Rules

- Avoid explicit type annotations unless they materially improve readability. Prefer inference.
- If the type is genuinely unknown, prefer `unknown`.
- Avoid type casting. Only cast when strictly necessary to make something work, not as a convenience.
- Never manually redefine types that can be derived or imported. If a type exists elsewhere in the app or a library, import it.
- For values from untrusted or unknown sources, use Zod to validate at runtime and infer types.
- Do not create `.d.ts` files for declaring modules.
- Design types to be as specific as possible as early in the type graph as possible.
- Never use `as unknown as`. It is always wrong.
- One acceptable use-case of `any` is when using the `infer` keyword or declaring generic functions where you need to skip a generic parameter you do not care about.
