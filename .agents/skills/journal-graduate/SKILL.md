---
name: journal-graduate
description: Create a canonical feature entry with plan.md + implementation.toml from a roadmap item, a scratchpad, or clear conversation context.
user-invocable: true
argument-hint: [feature-name] [R###]
---

# Journal Graduate

Graduating: "$ARGUMENTS". Layout contract: `journal/SPEC.md` (read it if you haven't this session).

Nothing enters the tracked journal as a placeholder. Graduation means the plan is concrete
enough to become project truth before implementation.

## Phase 1 — Gather claims

Sources, in order: the roadmap item (`journal/roadmap/items/R###-*.md` — idea, constraints
already decided, open questions, edges), `journal/scratchpad/<name>/`, then the conversation.
If no roadmap item exists yet, create one first (see `/journal-start`).

List the claims being promoted: decisions, repository facts, planned behaviour, paths,
rejected approaches, gaps.

## Phase 2 — Verify against the codebase and domains

- Repository claims: paths exist, code matches, nothing superseded.
- Find the domain claims/decisions the feature builds on (`journal/domains/*/current.md`,
  `decisions.md`). These become the plan's `context:` links.
- Resolve contradictions with the user. Never promote a stale claim silently.

## Phase 3 — Construct the feature

Create `journal/features/<name>/`:

- `plan.md` — frontmatter per SPEC including `roadmap: R###` and
  `context: ["[[domains/<d>/current#^C###]]", …]`. Objective, non-goals, principles, phases
  and items with acceptance criteria, decisions, gaps. No generic placeholders.
- `implementation.toml` — every plan item mapped with state, decisions, addresses, and
  `refs = [{ path, role }]` to real files.
- `research/` — optional evidence.

Update the roadmap item: `state: graduated`, `feature: <name>`, `touched: <today>`, and a
`## History` line.

## Phase 4 — Validate

`pnpm journal build && pnpm journal check` — zero errors.

## Phase 5 — Close

Report what graduated, which claims were verified or corrected, and remaining gaps. The
scratchpad (if any) is not deleted.
