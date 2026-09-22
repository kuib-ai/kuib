---
name: journal-promote
description: Ship a feature — move its lasting truth into domain claims and decisions, mark its roadmap item shipped, and close the feature.
user-invocable: true
argument-hint: [feature-name]
---

# Journal Promote

Promoting: "$ARGUMENTS". Layout contract: `journal/SPEC.md` → "Promotion (feature → domains)".

## 1. Readiness

Read `journal/features/$ARGUMENTS/plan.md` + `implementation.toml`. All items must be
`implemented`, `verified`, or terminal. If not, list what remains and stop unless the owner
says to promote anyway.

## 2. Truth → domain claims

For each domain the feature touched (file ownership via `code:` globs of the changed files —
use the `refs` in `implementation.toml` and `git log` for the feature's commits):
- Find claims in `current.md` whose sources the feature changed (`pnpm journal drift`).
  Rewrite them to describe the code as it is now.
- Add claims for new behaviour, citing code and tests. Aim to cite every new source file.
- Narrow `@context` headers of new files to their claim where one claim is primary.

## 3. Rationale → domain decisions

Append each accepted feature decision that still explains built code to the owning domain's
`decisions.md` (new domain D###, `From: [[features/$ARGUMENTS/plan]]`). Supersede domain
decisions it replaces (reciprocal links). Decisions about things not built go back to
roadmap items instead.

## 4. Intent → roadmap

- The feature's roadmap item: `state: shipped`, `touched: <today>`, `## History` line.
- Open gaps and deferred items become new roadmap items (or `## Open questions` on existing
  ones), `origin: ["[[features/$ARGUMENTS/plan]]"]`.

## 5. Close

- `plan.md`: `lifecycle: shipped`; `implementation.toml`: `state = "shipped"` and a final
  checkpoint summary.
- `pnpm journal stamp <domain>` for touched domains, then `pnpm journal build && pnpm journal check`.
- Present the diff of domain files for review. Do not commit unless asked.
