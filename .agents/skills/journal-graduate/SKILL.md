---
name: journal-graduate
description: Create a canonical feature entry with plan.md + implementation.toml. Works from a scratchpad or directly from clear conversation context.
user-invocable: true
argument-hint: [feature-name]
---

# Journal Graduate

Graduating: "$ARGUMENTS". Layout contract: `journal/SPEC.md` (read it if you haven't this session).

Nothing enters the tracked journal as a placeholder. Graduation means the plan is concrete
enough to become project truth before implementation.

## Phase 1 — Gather claims

If `journal/scratchpad/$ARGUMENTS/` exists, read `notes.md` and all material. If not, use
the current conversation and repository as the source — direct graduation is valid when
objectives, phases, and acceptance criteria are already clear.

List the claims being promoted: decisions, repository facts, planned behavior, files/paths,
approaches rejected, gaps, and conclusions.

## Phase 2 — Verify against the codebase

For each repository claim:
- Referenced files/paths exist?
- Code state matches what was documented?
- Anything superseded by later changes?

Resolve contradictions with the user. Never promote a stale claim silently.

## Phase 3 — Construct the feature

Create `journal/features/$ARGUMENTS/` with:

- **`plan.md`**: owner, lifecycle, summary, topics. Objective, non-goals, principles.
  Exact phases/items with acceptance criteria. Decisions with full context/options/consequences.
  Gaps for known unknowns. No generic placeholders.

- **`implementation.toml`**: feature name, state, current_phase. Checkpoint with summary/next/blockers.
  Phase states. Every plan item mapped with state, linked decisions, addresses (gaps), and refs
  to actual code files.

- **`research/`**: optional subfolder for investigation evidence cited by decisions or items.

## Phase 4 — Validate

Run `/journal-validate` to check structural integrity. All feature validation checks must pass:
- Coverage (every plan item has an implementation entry)
- State consistency
- Refs exist

## Phase 5 — Close

- Report what was graduated, which claims were verified/corrected, and any remaining gaps.
- The scratchpad (if any) is NOT deleted — remove it by hand if you want it gone.
