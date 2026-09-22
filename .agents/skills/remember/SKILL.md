---
name: remember
description: Bootstraps the agent into an existing in-progress task by reading the active journal context.
user-invocable: true
argument-hint: [feature or topic]
---

# Remember

Load journal context matching: "$ARGUMENTS". Layout contract: `journal/SPEC.md`.

Load narrowly — a session reads one feature plus the exact domain context it declares, never
the whole journal.

## Steps

1. **Orient** — read `journal/_index.md` (domains, features, roadmap "now").

2. **Feature hit** (`journal/features/$ARGUMENTS/` or a feature whose name/summary/topics match):
   - `pnpm journal handoff <feature>` — checkpoint, the previous session's note, rulings, open
     questions, unfinished items, tasks and claims to re-verify, rendered from disk.
   - Read `plan.md` for the objective, principles and the items you will touch.
   - Read every link in the plan's `context:` frontmatter — only those sections of
     `current.md` / `decisions.md`, not whole files.
   - Read the roadmap item named by `roadmap:` for intent and constraints.
   - Read `research/` only when the task needs evidence.

3. **Roadmap hit** (`journal/roadmap/items/R###-*.md`) → read the item and its `depends-on` /
   `converges-with` neighbours. It is intent, not truth.

4. **Domain hit** (topic belongs to built code) → grep `journal/domains/*/current.md` headings
   and read the matching claims; `pnpm journal claims <file>` shows the claims tied to a file.

5. **Scratchpad hit** (`journal/scratchpad/<name>/notes.md`) → read it; label it provisional.

6. **No hit** → say so and show the 3 nearest matches; don't guess.

7. **Verify** — `pnpm journal drift` and mention flagged claims among the ones you loaded. The
   journal says what was decided; the code shows what exists now.

8. **Summarize** what is recorded, the current phase and next work, the note, open questions
   and drift. Wait for confirmation before implementation work.
