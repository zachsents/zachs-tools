---
name: handoff
description: Produce a very short, copyable context handoff for another Codex task or agent. Use when the user asks for a handoff, context transfer, or copyable context for resuming current work in a fresh task or with another agent.
---

# Handoff

Reply with only one fenced `text` code block. Do not create a file or add prose outside the block.

Write for a capable recipient with no conversation history. Reconstruct the handoff from the underlying goal, current artifacts, and settled decisions; do not edit or annotate an earlier handoff.

Use terse fragments, normally three to eight short lines. Include only context the recipient cannot quickly recover from the repository:

- The user's goal and the relevant current state.
- Non-obvious decisions, constraints, failed approaches, or blockers.
- Precise pointers to important files, symbols, artifacts, commands, errors, URLs, or IDs.
- The immediate next action.

Treat any requested focus as an inclusion filter. For example, “FTS only” means regenerate the handoff from the full underlying goal using only context needed for the FTS work. In the handoff, never mention excluded, parallel, previous, or “unrelated” work—even as a prohibition—unless the recipient must understand it to complete the handed-off task.

Every constraint and noun must be understandable from the included text or a precise artifact pointer. Do not use context-dependent phrases such as “the earlier approach,” “that issue,” or an unexplained project name. Reference existing artifacts instead of restating recoverable detail, but identify what each pointer contributes.

Never include routine instructions such as reading `AGENTS.md`, following repository conventions, reviewing the diff, or running required checks. Omit suggested skills, formal sections, and narrative history.

Before replying, apply this recipient-knowledge check to every line: “Could a fresh agent act on every line without asking what prior work this refers to?” Remove any line that fails.

## Evaluation Case: FTS-Only Handoff

Given source context that contains a PGlite full-text search (FTS) feature among multiple efforts, a request for an “FTS only” handoff must generate a new handoff containing only:

- The PGlite FTS goal and current state.
- Precise pointers to its relevant files or symbols.
- Its settled design choices and constraints.
- Its immediate next action.

The handoff fails this case if it refers to any filtered-out effort, including statements that such work was omitted, or if any line assumes knowledge of the source conversation.
