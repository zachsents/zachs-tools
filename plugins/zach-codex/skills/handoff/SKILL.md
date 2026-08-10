---
name: handoff
description: Produce a very short, copyable context handoff for another Codex task or agent. Use when the user asks for a handoff, context transfer, or copyable context for resuming current work in a fresh task or with another agent.
---

# Handoff

Reply with only one fenced `text` code block. Do not create a file or add prose outside the block.

Use terse fragments, normally three to eight short lines. Include only context a capable agent cannot quickly recover from the repository:

- The user's goal and the relevant current state.
- Non-obvious decisions, constraints, failed approaches, or blockers.
- Precise pointers to important files, symbols, artifacts, commands, errors, URLs, or IDs.
- The immediate next action.

Prioritize any focus the user names. Reference existing artifacts instead of restating them. Never include routine instructions such as reading `AGENTS.md`, following repository conventions, reviewing the diff, or running required checks. Omit suggested skills, formal sections, and narrative history.
