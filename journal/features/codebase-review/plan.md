---
owner: roysupriyo10
lifecycle: implementing
summary: Parallel reviewer agents audit the codebase and its domain claims; findings are triaged and fixed.
topics:
  - review
  - quality
supersedes: []
superseded-by: []
roadmap: R005
context: []
checkpoint:
  summary: "Three Opus 5 xhigh reviews done; reports in tasks/*/report.md, not yet triaged. The owner has not asked for the findings to be pursued; triage (P02-I01) waits for the owner. P01-I04 migration review queued."
  next: ["P02-I01", "P01-I04"]
  blockers: []
  note: ""
---

# Plan — codebase-review

## Objective

Every part of the codebase has been reviewed for correctness bugs, security problems and
untrue domain claims, and the accepted findings are fixed with `pnpm run check` green.

## Non-goals

- Style-only changes.
- New features discovered during review (they become roadmap items).

## Principles

- Reviewers are read-only; their reports are the record.
- Findings are triaged by the owner before any fix round.

## P01 — Review

### P01-I01 — Tooling review

- Acceptance: `tasks/review-tooling/report.md` covers scripts/journal.ts, scripts/agents.ts,
  the orchestra tool, the session hook and the require-context-link rule.
- State: implemented
- Refs:
  - `journal/features/codebase-review/tasks/review-tooling/brief.md` — brief

### P01-I02 — Core review

- Acceptance: `tasks/review-core/report.md` covers the core packages and the truth of every
  core claim.
- State: implemented
- Refs:
  - `journal/features/codebase-review/tasks/review-core/brief.md` — brief

### P01-I03 — Host, infra and services review

- Acceptance: `tasks/review-rest/report.md` covers host, infra packages and services and the
  truth of their claims.
- State: implemented
- Refs:
  - `journal/features/codebase-review/tasks/review-rest/brief.md` — brief

### P01-I04 — Migration fidelity review

- Acceptance: a report samples archive ledgers against their targets and reviews roadmap
  items and instruction coherence.
- State: planned

## P02 — Fixes

### P02-I01 — Triage

- Acceptance: every finding is accepted (with a fix task), deferred (roadmap item) or
  rejected (with a reason) in this plan's decisions or gaps.
- State: planned

## Decisions

## Gaps
