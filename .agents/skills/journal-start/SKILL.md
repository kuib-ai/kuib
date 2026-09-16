---
name: journal-start
description: Start optional scratchpad notes for an unclear task. Creates journal/scratchpad/<name>/notes.md. Use /journal-graduate directly when the plan is already clear.
user-invocable: true
argument-hint: [experiment-name]
---

# Journal Start

You are starting a working journal named: "$ARGUMENTS"

The layout contract is `journal/SPEC.md` — read it if you haven't this session.

## Steps

1. **Check for existing work:**
   - `journal/features/$ARGUMENTS/` exists → a feature already exists. Read its `plan.md` +
     `implementation.toml` and continue there.
   - Grep `journal/_index.md` for the name or topic → an existing context entry may cover this.
   - `journal/scratchpad/$ARGUMENTS/` exists → ongoing provisional work; read `notes.md`.

2. **Choose the entry path:**
   - If objectives, phases, and acceptance criteria are already concrete → run
     `/journal-graduate $ARGUMENTS` directly. Do not create a scratchpad.
   - Otherwise create `journal/scratchpad/$ARGUMENTS/notes.md` with a 2–3 line statement of
     what is being explored and why. Optional `research/` subfolder for findings.

3. **Tell the user** the scratchpad is provisional. When the plan is concrete, run
   `/journal-graduate $ARGUMENTS` to create the canonical feature entry.

## Rules

- Scratchpad content is not project truth — it becomes truth after graduation.
- Do NOT start a journal for bug-fix sessions (tracked via commits).
- Existing context entries in `journal/<name>/` are reference material with the old format
  (decisions.md, wikilinks). Features under `journal/features/` use the new strict schema.
