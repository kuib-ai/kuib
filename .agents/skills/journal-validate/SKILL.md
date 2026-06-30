---
name: journal-validate
description: Validate the Breadreaper context graph. Runs structural checks via the compiler script, followed by LLM-based semantic staleness detection.
---

# Journal Validate

Full validation of the architecture graph: structural integrity + semantic staleness detection.

## Phase 1: Structural Validation (script)

Run the compiler script first:

```bash
pnpm exec tsx scripts/compile-journal-index.ts
```

This handles:

- Index matches filesystem
- Frontmatter consistency (required fields, valid types/statuses)
- Bidirectional edge check (depends-on vs informs)
- Index rebuild

Report any structural issues from the script output and fix them before proceeding.

## Phase 2: Semantic Staleness Detection (LLM)

After structural checks pass, do a semantic review:

1. **Read the full index** (`journal/architecture/_index.md`) to get the graph topology.

2. **For each entry with status `decided`:**
   - Read its `decisions.md`
   - Read the `decisions.md` of every entry in its `depends-on` and `informs` lists
   - Check: do the decisions in this entry contradict or conflict with decisions in related entries?
   - Check: does this entry reference concepts, tools, or approaches that have been changed elsewhere?

3. **Drift detection:**
   - Find entries that share tags but don't reference each other — they might be covering the same topic with divergent decisions.

4. **For each issue found, report:**
   - Which entries conflict
   - What the contradiction is (quote the specific lines)
   - Suggested resolution (update one, merge them, etc.)

## Phase 3: Resolution (interactive)

For each semantic issue found, present the conflict to the user and ask them to decide:

- Propose options: update entry A, update entry B, or merge.
- Apply the user's decision immediately.
- Re-run the compile script after all resolutions to rebuild the index.

Do NOT silently resolve semantic conflicts. Always ask the user.
