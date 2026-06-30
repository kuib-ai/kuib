---
name: journal-validate
description: Validate the journal graph — structural checks via script, then LLM-based staleness detection by reading related entries and finding contradictions.
user-invocable: true
---

# Journal Validate

Full validation of the journal graph: structural integrity + semantic staleness detection.

## Phase 1: Structural Validation (script)

Run the compiler script first:

```
npx tsx scripts/compile-journal-index.ts
```

This handles:

- Index matches filesystem
- All wikilinks resolve
- Frontmatter consistency (required fields, valid types/statuses)
- Bidirectional edge check
- Index rebuild

Report any structural issues from the script output.

## Phase 2: Semantic Staleness Detection (LLM)

After structural checks pass, do a semantic review:

1. **Read the full index** (`journal/_index.md`) to get the graph topology.

2. **For each entry with status `decided` or `stable`:**
   - Read its `decisions.md`
   - Read the `decisions.md` of every entry in its `depends-on` and `informs` lists
   - Check: do the decisions in this entry contradict or conflict with decisions in related entries?
   - Check: does this entry reference concepts, tools, or approaches that have been changed elsewhere?

3. **Drift detection:**
   - Find entries that share tags but don't reference each other — they might be covering the same topic with divergent decisions
   - Find entries not modified in 14+ days that are referenced by recently modified entries — the referencing entry may have evolved while this one stayed behind

4. **For each issue found, report:**
   - Which entries conflict
   - What the contradiction is (quote the specific lines)
   - Suggested resolution (update one, mark one stale, merge them)

5. **Auto-fix structural issues:**
   - Add missing bidirectional edges
   - Rebuild the index via the script

## Phase 3: Resolution (interactive)

For each semantic issue found, present the conflict to the user and ask them to decide:

- Quote the conflicting text from both entries
- Propose options: update entry A, update entry B, mark one as stale, merge them, or ignore
- Apply the user's decision immediately — update frontmatter, edit content, add `superseded-by` fields as needed
- Re-run the script after all resolutions to rebuild the index

Do NOT silently resolve conflicts. Always ask.
