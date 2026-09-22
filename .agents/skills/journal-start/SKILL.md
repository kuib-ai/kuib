---
name: journal-start
description: Capture an idea into the roadmap (inbox line or item), or start optional scratchpad notes for an unclear task. Use /journal-graduate directly when the plan is already clear.
user-invocable: true
argument-hint: [name or idea]
---

# Journal Start

Starting: "$ARGUMENTS". Layout contract: `journal/SPEC.md` (read it if you haven't this session).

## Steps

1. **Check for existing work**
   - `journal/features/<name>/` exists → continue there (`/remember <name>`).
   - Grep `journal/roadmap/items/` and `journal/roadmap/inbox.md` for the topic → an item may
     already hold this intent; extend it instead of duplicating.
   - `journal/scratchpad/<name>/` exists → read `notes.md` and continue.

2. **Choose the path**
   - **A vague idea to keep** → append `- YYYY-MM-DD <idea>` to `journal/roadmap/inbox.md`.
   - **An idea worth shaping** → create `journal/roadmap/items/R###-<slug>.md` per SPEC
     (next free ID, `state: idea`, `origin: ["conversation YYYY-MM-DD"]`, `## Idea`). Add
     `depends-on` / `converges-with` edges to related items.
   - **Exploratory work session** → `journal/scratchpad/<name>/notes.md` with 2–3 lines on
     what is being explored and why (git-ignored, provisional).
   - **Objectives, phases and acceptance criteria already concrete** → `/journal-graduate`.

3. Run `pnpm journal build && pnpm journal check` after touching roadmap files.

## Rules

- Roadmap and scratchpad content is intent, not truth. Truth lives in `journal/domains/`.
- Do not start a journal entry for bug-fix sessions (tracked via commits).
