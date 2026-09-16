---
name: journal-validate
description: Validate the journal graph. Checks features (plan + implementation coverage, state consistency, refs) and context entries (structural integrity, staleness).
user-invocable: true
---

# Journal Validate

Full validation of the journal: features + context graph.

## Phase 1: Feature Validation

For each `journal/features/<feature>/`:

1. **Structure** — `plan.md` has valid frontmatter (owner, lifecycle, summary, topics).
   Body has well-formed phases (P01, P02...), items (P01-I01), decisions (D001), gaps (G001).

2. **Coverage** — every plan item has a matching `[items."P01-I01"]` in `implementation.toml`.
   No orphan implementation entries.

3. **State consistency:**
   - Phase state derived from items: all planned → `planned`, any started → `in_progress`,
     all implemented/verified → `implemented`.
   - Feature `state` consistent with phases.
   - Checkpoint `next` references live, non-terminal items.

4. **Refs** — every `path` in implementation refs exists in the repo.

5. **Report** discrepancies. Do NOT auto-fix — present to the user.

## Phase 2: Context Graph Validation

Run the compiler script:

```bash
pnpm exec tsx scripts/compile-journal-index.ts
```

This validates existing context entries (`journal/<name>/decisions.md`):
- Index matches filesystem
- Frontmatter consistency
- Bidirectional edge check (depends-on vs informs)
- Index rebuild

## Phase 3: Semantic Staleness Detection

After structural checks pass, do a semantic review of context entries:

1. Read `journal/_index.md` for the graph topology.
2. For entries with status `decided`: check for contradictions with related entries.
3. Drift detection: entries sharing tags but not referencing each other.
4. Report conflicts with specific quotes. Ask the user to decide resolution.

Do NOT silently resolve conflicts.
