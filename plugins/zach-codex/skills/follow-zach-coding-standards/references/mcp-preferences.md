# MCP and Tool Preferences

Use the most direct source of truth available for the task. Prefer purpose-built MCP tools and installed app connectors over generic web search, browser automation, or remembered facts.

## Selection

- Use Context7 for current third-party library documentation when an official first-party documentation connector is not available.
- Use the OpenAI documentation tools for OpenAI products and APIs.
- Use `ts-hover` to inspect actual TypeScript-produced types instead of guessing about inference.
- Use Axiom for application and route-level logs.
- Use Linear for issue and project state.
- Use Vercel for deployment and hosting state.
- Use the GitHub connector for pull requests, issues, reviews, and repository state beyond the local checkout.
- Use the in-app Browser for local web testing and public pages.
- Use Chrome when the task depends on the user's existing signed-in Chrome session or extensions.
- Use Computer Use only when a dedicated connector, API, CLI, or browser tool cannot operate the required desktop UI.

## Operating Rules

- Start with read-only inspection unless the user asked for a change.
- Use direct API, database, deployment, or log evidence for live incidents.
- Keep writes scoped to the system and action the user authorized.
- Do not duplicate an installed official plugin's MCP server unless the bundled connection is intentionally replacing it.
- Never embed credentials in plugin files. Use OAuth or environment-variable references.
