---
name: update-zachs-tools
description: Update every zachs-tools package used by a consumer repository, refresh the globally installed Zach Codex plugin, and migrate project configuration, prompts, and agent guidance to match the new releases. Use whenever the user asks to update, upgrade, sync, or check Zach's tooling, configs, coding standards, lint or Prettier setup, ts-mcp, agent rules, or the zach-codex plugin in another project. Do not use this skill to release the zachs-tools repository itself.
---

# Update Zach's Tools

Treat this as a migration, not just a dependency bump. Published releases can
change configuration exports, peer requirements, skills, prompts, MCP setup, or
agent rules without requiring changes to the consumer's application code.

## Inventory

1. Read the target repository's applicable `AGENTS.md` files and inspect its
   dirty worktree before making changes. Preserve unrelated work.
2. Read the current `follow-zach-coding-standards` skill and every reference it
   marks as applicable to the target repository. Treat those rules as the
   desired state for the migration, even when the Zach Codex plugin version is
   unchanged or a published package diff does not mention them.
3. Identify the repository's package manager from `packageManager` and its
   lockfile. Keep the existing package manager; use Bun when the repository
   already uses Bun or does not specify one.
4. Search manifests, lockfiles, config files, scripts, MCP configuration,
   documentation, and agent guidance for zachs-tools artifacts. Check at least:
   - `@zachsents/agent-rules`
   - `@zachsents/oxlint-config`
   - `@zachsents/prettier-config`
   - `@zachsents/ts-mcp`
   - `eslint-plugin-zachs-rules`
   - `@zachsents/zach-codex`
   - copied or adapted Zach rules under `AGENTS.md`, `.agents/`, `.codex/`, or
     other agent-instruction files
5. Update packages that the project actually uses. Do not add every known
   package merely because it is listed here, and do not convert the project to
   a different toolchain without an explicit request.

## Compare Published Releases

Resolve the exact installed version and the registry's `latest` version for
each discovered package. Use the lockfile or package-manager inspection for the
installed version rather than treating a range such as `^0.2.0` as an exact
version.

Before installing a newer version, inspect the published package diff. Start
with the changed-file list, then read the full diff:

```sh
npm diff --diff="<package>@<installed-version>" --diff="<package>@<latest-version>" --diff-name-only
npm diff --diff="<package>@<installed-version>" --diff="<package>@<latest-version>" --diff-unified=8
```

Run this for `@zachsents/zach-codex` too. Pay special attention to changes in:

- `package.json`, exports, peer dependencies, and executable entries
- formatter, linter, ESLint, TypeScript, and MCP configuration
- `.codex-plugin/plugin.json` and `.mcp.json`
- `skills/**/SKILL.md`, `skills/**/references/`, and agent interface metadata
- deleted or renamed files, commands, skills, and rules

If the diff is too large or a complete new file is needed for migration, pack
the published version into a temporary directory and inspect the tarball there.
Do not modify an installed plugin cache directly.

## Update The Consumer Repository

1. Audit the consumer's current configuration, package scripts, dependencies,
   documentation, and durable agent guidance against the current coding rules.
   Do this independently of version and package diffs: an already-current
   Git-backed plugin can contain guidance that the consumer has not adopted.
2. Update all discovered zachs-tools dependencies to their latest releases in
   one package-manager operation when practical so the resolver can keep peer
   dependencies coherent. With Bun, use `bun update <packages...> --latest`.
3. Let the package manager update manifests and the lockfile. Preserve the
   project's existing dependency sections and version-range conventions unless
   the new package's documented peer relationship requires a change.
4. Reconcile both the current coding-rule audit and the published package diff
   with actual usage. Update any affected:
   - config imports, exports, composition, and options
   - package scripts and required peer tools
   - MCP server declarations or command arguments
   - `AGENTS.md`, `.agents/`, `.codex/`, and other durable agent guidance
   - prompts or copied rules that now conflict with the latest plugin guidance
   - documentation that tells contributors to use superseded commands
5. Search again for removed APIs, obsolete rules, old commands, and duplicated
   copied guidance identified by either the current rules or the package diff.
   Version checks alone do not complete the migration.

## Refresh The Global Zach Codex Plugin

The plugin is installed through Codex rather than as a project dependency.

1. Use `codex plugin list` and `codex plugin marketplace list` to identify the
   installed `zach-codex` version and its marketplace. Do not assume the
   marketplace is named `personal` if the local configuration says otherwise.
2. Refresh a Git-backed marketplace with
   `codex plugin marketplace upgrade <marketplace>` when applicable. A local
   marketplace should already reflect its source directory.
3. Install the current marketplace entry with:

   ```sh
   codex plugin add zach-codex@<marketplace>
   ```

   If the CLI does not offer an in-place update for the installed entry, use
   `/plugins` in Codex CLI or the desktop Plugins directory to reinstall/update
   it. Do not delete plugin caches by hand.

4. Confirm the installed version after the operation. Explain that bundled
   skills and MCP changes require a new Codex task or CLI session before they
   become active.

If the latest marketplace entry or npm version is not yet published, report
that clearly and leave the working installation intact.

## Verify And Report

Run the target repository's formatter/fix command and its smallest complete
check pipeline. Add focused smoke checks for changed config imports, linter
loading, formatter loading, or MCP startup when those surfaces changed.

Report:

- every package and plugin version before and after
- discrepancies found by reviewing the consumer against the current coding
  rules, including migrations made when package versions were already current
- the important release-diff findings
- project config, prompt, rule, or documentation migrations made because of
  those findings
- verification commands and results
- anything intentionally left unchanged, including unpublished plugin updates
- the need to start a new Codex task when the plugin changed
