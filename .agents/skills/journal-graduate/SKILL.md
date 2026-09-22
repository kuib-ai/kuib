---
name: journal-graduate
description: Create a canonical feature plan from a roadmap item, a scratchpad, or clear conversation context.
user-invocable: true
argument-hint: [feature-name] [R###]
---

# Journal Graduate

Graduating: "$ARGUMENTS". Layout contract: `journal/SPEC.md` → Features.

Nothing enters the tracked journal as a placeholder. Graduation means the plan is concrete
enough to become project truth before implementation.

## Phase 1 — Gather

Sources, in order: the roadmap item (`journal/roadmap/items/R###-*.md` — idea, constraints
already decided, open questions, edges), `journal/scratchpad/<name>/`, then the conversation.
If no roadmap item exists yet, create one first (see `/journal-start`).

List what is being promoted: decisions (with the owner's rulings verbatim), repository facts,
planned behaviour, paths, rejected approaches, gaps.

## Phase 2 — Verify against the code and domains

- Repository facts: paths exist, code matches, nothing superseded.
- Find the domain claims/decisions the feature builds on (`pnpm journal claims <file>` for the
  files it will touch; `journal/domains/*/current.md`, `decisions.md`). These become the plan's
  `context:` links.
- Resolve contradictions with the owner. Never promote a stale claim silently.

## Phase 3 — Write `journal/features/<name>/plan.md`

- Frontmatter per SPEC: `lifecycle`, `summary`, `roadmap: R###`, `context:` wikilinks, and a
  `checkpoint` (summary, next, blockers, empty note).
- Body: objective, non-goals, principles, phases, items with `- Acceptance:` and `- State:`
  (plus `Decisions`, `Addresses`, `Refs` where they apply), decisions (`- Ruling:` quoting the
  owner where one exists), gaps (`- Recommendation:` where the owner owes a decision).
- `research/` — optional evidence.

Update the roadmap item: `state: graduated`, `feature: <name>`, `touched: <today>`, and a
`## History` line.

## Phase 4 — Validate

`pnpm journal build && pnpm journal check` — zero errors.

## Phase 5 — Close

Report what graduated, which claims were verified or corrected, and remaining gaps. The
scratchpad (if any) is not deleted.
