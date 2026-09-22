---
name: journal-promote
description: Ship a feature — move its lasting truth into domain claims and decisions, mark its roadmap item shipped, and close the feature.
user-invocable: true
argument-hint: [feature-name]
---

# Journal Promote

Promoting: "$ARGUMENTS". Layout contract: `journal/SPEC.md` → "Promotion (feature → domains)".

## 1. Readiness

`pnpm journal handoff $ARGUMENTS` and read `plan.md`. All items must be `implemented`,
`verified`, or terminal. If not, list what remains and stop unless the owner says to promote
anyway.

## 2. Truth → domain claims

For each domain the feature touched (ownership via `code:` globs of the changed files — use the
items' `Refs` and `git log` for the feature's commits):
- `pnpm journal drift` shows claims whose linked code changed. Rewrite each to describe the
  code as it is now.
- Add claims for new behaviour and tie them to the code: a `@claim <domain>/<claim>` line above
  each scope that makes the claim true (a first-line `@claim` for modules it explains as a
  whole), `test:` and quote sources where links cannot go.
- `pnpm journal stamp <domain>/<claim>` for every new or rewritten claim; `pnpm journal gate`
  must pass.

## 3. Rationale → domain decisions

Append each accepted feature decision that still explains built code to the owning domain's
`decisions.md` (new domain D###, `From: [[features/$ARGUMENTS/plan]]`). Supersede domain
decisions it replaces (reciprocal links). Decisions about things not built go back to roadmap
items instead.

## 4. Intent → roadmap

- The feature's roadmap item: `state: shipped`, `touched: <today>`, `## History` line.
- Open gaps and deferred items become new roadmap items (or `## Open questions` on existing
  ones), `origin: ["[[features/$ARGUMENTS/plan]]"]`.

## 5. Close

- `plan.md`: `lifecycle: shipped`; a final checkpoint (`pnpm journal checkpoint`).
- `pnpm journal build && pnpm journal check && pnpm journal gate`.
- Present the diff of domain files for review. Do not commit unless asked.
