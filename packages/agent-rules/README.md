# @zachsents/agent-rules

Reusable coding guidance for agents.

`rules/general.md` is the main rulebook. Framework-specific guidance stays separate:

- `rules/general.md`
- `rules/react.md`
- `rules/convex.md`

These files are the source for the `$follow-zach-coding-standards` skill bundled
with the Zach Codex plugin. The skill applies them automatically when coding
work matches its description, but naming the skill makes activation more
reliable.

Add this line to a project's root `AGENTS.md`:

```md
Use the installed `$follow-zach-coding-standards` skill for all implementation, debugging, and code-review work. Repository-specific instructions take precedence when more specific.
```
