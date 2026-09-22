---
name: journal-start
description: Capture an idea as a roadmap item, or start optional scratchpad notes for an unclear task. Use /journal-graduate directly when the plan is already clear.
user-invocable: true
argument-hint: [name or idea]
---

# Journal Start

Starting: "$ARGUMENTS". Layout contract: `journal/SPEC.md` → Roadmap.

## Steps

1. **Check for existing work**
   - `journal/features/<name>/` exists → continue there (`/remember <name>`).
   - Grep `journal/roadmap/items/` for the topic → an item may already hold this intent;
     extend it instead of duplicating.
   - `journal/scratchpad/<name>/` exists → read `notes.md` and continue.

2. **Choose the path**
   - **Any idea worth keeping, however raw** → `journal/roadmap/items/R###-<slug>.md` (next free
     ID, `state: idea`, a `horizon`, `origin: ["conversation YYYY-MM-DD"]`, `touched`, and
     `## Idea` — one line is enough). Add `depends-on` / `converges-with` edges to related items.
   - **Exploratory work session** → `journal/scratchpad/<name>/notes.md` with 2–3 lines on
     what is being explored and why (git-ignored, provisional).
   - **Objectives, phases and acceptance criteria already concrete** → `/journal-graduate`.

3. `pnpm journal build && pnpm journal check` after touching roadmap files.

## Rules

- Roadmap and scratchpad content is intent, not truth. Truth lives in `journal/domains/`.
- Record the owner's words verbatim when an idea comes with a ruling or constraint.
