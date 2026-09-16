---
name: remember
description: Bootstraps the agent into an existing in-progress task by reading the active journal context.
user-invocable: true
argument-hint: [search query]
---

# Remember

Load journal context matching: "$ARGUMENTS"

## Steps

1. **Read `journal/_index.md`** and list `journal/features/` for active features. Grep both
   for "$ARGUMENTS" and synonyms.

2. **Feature hit** (`journal/features/<name>/`) → read `plan.md` and `implementation.toml`:
   - Plan objective, current phases/items, accepted decisions relevant to the query.
   - Checkpoint summary/next/blockers, item states.
   - Read `research/` only when the query needs evidence or rationale.

3. **Context entry hit** (`journal/<name>/decisions.md`) → read decisions.md for the old-format
   context entry. These are background reference, not active features.

4. **Scratchpad hit** (`journal/scratchpad/<name>/`) → read notes.md. Label it provisional.

5. **No hit** → say so and show the 3 nearest matches; don't guess.

6. **Summarize**: what is recorded, current phase/next work, relevant gaps. Verify against
   actual code — the journal says what was planned/decided, the code shows what exists now.

7. **Wait for confirmation** before proceeding with any implementation work.
