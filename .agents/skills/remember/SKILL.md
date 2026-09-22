---
name: remember
description: Bootstraps the agent into an existing in-progress task by reading the active journal context.
user-invocable: true
argument-hint: [feature or search query]
---

# Remember

Load journal context matching: "$ARGUMENTS". Layout contract: `journal/SPEC.md`.

Load narrowly — the point of the journal layers is that a session reads one feature plus the
exact domain context it declares, never the whole journal.

## Steps

1. **Orient** — read `journal/_index.md` (domains, features, roadmap "now").

2. **Feature hit** (`journal/features/$ARGUMENTS/` or a feature whose name/summary/topics match):
   - Read `plan.md` and `implementation.toml`: objective, current phase, checkpoint
     summary/next/blockers, accepted decisions, open gaps.
   - Read every link in the plan's `context:` frontmatter — these are the domain claims and
     decisions the feature depends on. Read only the linked sections of `current.md` /
     `decisions.md`, not whole files.
   - Read the roadmap item named by `roadmap:` for intent and constraints.
   - Read `research/` only when the query needs evidence.

3. **Roadmap hit** (`journal/roadmap/items/R###-*.md` matching the query) → read the item and
   its `depends-on` / `converges-with` neighbours. It is intent, not truth.

4. **Domain hit** (topic belongs to built code) → grep `journal/domains/*/current.md` headings
   and read the matching sections, including their `[!sources]` callouts.

5. **Scratchpad hit** (`journal/scratchpad/<name>/notes.md`) → read it; label it provisional.

6. **No hit** → say so and show the 3 nearest matches; don't guess.

7. **Verify** — run `pnpm journal drift` and mention any broken/changed claims among the ones
   you loaded. The journal says what was decided; the code shows what exists now.

8. **Summarize** what is recorded, the current phase and next work, relevant gaps, and any
   drift. Wait for confirmation before implementation work.
