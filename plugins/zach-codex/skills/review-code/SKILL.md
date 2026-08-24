---
name: review-code
description: Review a diff, pull request, branch, or implementation for correctness and applicable rules that automated checks do not enforce. Trace real execution paths, verify external and public contracts, find missing surface coverage, and reject unnecessary complexity. Use for every substantive local code review before a ready pull request.
---

# Review Code

1. Read every applicable `AGENTS.md` and referenced rule. Read the issue or acceptance criteria when available. Determine the exact base and complete intended diff; derive missing context instead of trusting the author summary.
2. Inspect the full diff, surrounding implementation, callers, public exports and types, tests, docs, migrations, and generated contracts. Follow changed values and side effects through their real entry point, persistence, external boundary, retry path, and observable result.
3. Review correctness before style. Look for wrong requests or responses, stale assumptions, incomplete state mappings, missing `await`, invalid ordering, mutation-before-failure hazards, retry or idempotency defects, authorization and scope mistakes, race conditions, ambiguous execution boundaries, and cleanup or rollback gaps.
4. For integrations and external APIs, verify current official docs, OpenAPI, or SDK source. Reconcile every changed endpoint, auth flow, scope expression, identifier, enum, nullable or optional field, request, response, event, and pagination rule. Check that public facades, docs, and tests cover the complete intended callable surface.
5. Judge tests by the behavior they execute. Planning, snapshots, and mocked internals do not prove runtime behavior. Identify the smallest missing test that would exercise every owned layer relevant to a credible defect, using realistic external-boundary fixtures.
6. Then check maintainability: trivial forwarding helpers, unnecessary abstraction, misleading indirection, duplicate sources of truth, and defensive code for states excluded by types or established invariants.
7. Report only reproducible P0–P2 findings. For each, give the file and line, execution path, concrete consequence, evidence, and simplest correction. Do not report preferences, automated diagnostics, speculative failures, or impossible states.
8. If there are no findings, say so and name any material validation or contract coverage you could not verify.

Use P0 for an immediate security, data-loss, or outage risk; P1 for a defect that breaks a primary path or public contract; and P2 for a concrete edge-case, completeness, or maintainability defect worth blocking the pull request. Do not report P3 preferences.
