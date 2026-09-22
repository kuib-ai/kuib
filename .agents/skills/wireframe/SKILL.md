---
name: wireframe
description: Design or edit a screen wireframe. Loads the wireframe conventions and the current state of every screen, then helps draw ASCII frames that represent screen states properly.
---

# Wireframe

You are designing or editing a **screen wireframe** — the motivation + intended layout of one screen, kept as a first-class journal node. Follow these steps in order before drawing anything.

## 1. Load context (always, in this order)

1. Read `journal/SPEC.md` → "Wireframes" — the contract (file format, lifecycle, screen-level rule). Do not improvise around it.
2. Sketch in cell-grid terms (boxes, text runs, scroll regions, lists, inputs). Screens render through kuib's own terminal UI library (roadmap item for it: grep `journal/roadmap/items/` for "TUI library"); do not assume any third-party component set.
3. Load the current state:
   - `find journal/roadmap/wireframes journal/domains/*/wireframes -name '*.md'` — every screen and its status. Read any that relate to the screen being worked on.
   - `journal/domains/host/current.md` — what the host actually renders today.
   - The roadmap item(s) that link the screen — its intent, constraints and open questions.
   - If the target screen has an `implements:` path, read that source — the wireframe must not contradict as-built truth without an explicit supersede decision.

## 2. Decide where the wireframe lives

- One file per **screen** (a route or a dialog). Screen-level ONLY — components never get their own wireframes; a screen's runtime **states** are frames inside its single file.
- `exploring` → `journal/roadmap/wireframes/<screen>.md`, linked from the roadmap item that wants the screen (`## Idea` or `## Open questions`).
- `adopted` → move it to `journal/domains/host/wireframes/<screen>.md` and record the adoption as a host decision.

## 3. Draw

- Frontmatter is validated by `tooling/journal.ts`: `screen` (must equal filename), `kind: route | dialog`, `status: exploring | adopted | superseded`, `sizes: [80x24, ...]`, `implements: []`, `superseded-by` only when superseded.
- Start with a `## Motivation` section: why the screen exists, what the user is doing there, what it must never obscure. This is the part future iterations read first.
- Frames go in fenced code blocks at the declared sizes. Box-drawing borders mark the terminal edge. Annotate with circled markers (①②③); the legend lives BELOW the frame, never inside it.
- While exploring: `## Variant <X> — <name>` sections, one frame each, a one-line **Verdict** on every loser (keep losers — they are the archaeology).
- Once adopted: `## States` with one frame per distinct-layout state (empty, streaming, error, overlay open…).

## 4. Validate and hand off

1. Run `pnpm journal build && pnpm journal check` — zero errors (it validates wireframe frontmatter and placement, and rebuilds the index).
2. When a variant is adopted or a screen supersedes, record the decision in `journal/domains/host/decisions.md` (if built) or the roadmap item's `## Constraints already decided` (if not), with a wikilink to the wireframe.

## Rules that override everything

- Never silently edit a sketch to match code — supersede instead (`status: superseded` + `superseded-by`).
- Never create a component-level wireframe.
- Read the existing wireframe before modifying a screen; it carries the motivation the code cannot.
