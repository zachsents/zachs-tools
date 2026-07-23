---
name: review-code
description: Review code changes against applicable rules that automated checks do not enforce, with special attention to over-abstraction, misdirection, and defensive handling of functionally impossible cases. Use when reviewing a diff, pull request, branch, or implementation.
---

# Review Code

1. Read every applicable `AGENTS.md` and the rule or prompt files they reference. Treat active coding instructions as review criteria too. Focus on rules that linters and type checks cannot reliably enforce.
2. Inspect the changes and enough surrounding code and call sites to verify each finding.
3. Look especially for trivial helpers that only rename or forward an operation, unnecessary abstraction, indirection that obscures behavior, and defensive code for states excluded by types or established invariants.
4. Report only actionable findings with the relevant file and line, concrete evidence, and the simplest reasonable correction. Do not flag mere preferences or restate automated diagnostics.
5. If there are no findings, say so and briefly note any validation gaps.
