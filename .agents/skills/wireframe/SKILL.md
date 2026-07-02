---
name: wireframe
description: Design or edit a screen wireframe. Loads the wireframe conventions, the OpenTUI skill, and the current state of every screen, then helps draw ASCII frames that represent screen states properly.
---

# Wireframe

You are designing or editing a **screen wireframe** — the motivation + intended layout of one screen, kept as a first-class journal node. Follow these steps in order before drawing anything.

## 1. Load context (always, in this order)

1. Read `journal/ux-iteration-process/decisions.md` — the full wireframe conventions (file format, lifecycle, screen-level rule). This is the contract; do not improvise around it.
2. Invoke the `opentui` skill (Skill tool) — the frames must be drawable with real OpenTUI primitives (`box`, `scrollbox`, `select`, `text`, `input`, `markdown`, `code`, `diff`, tree-sitter panes), so know what exists before sketching.
3. Load the current state of the codebase:
   - `journal/_index.md` — which entries exist, which wireframes exist and their statuses (lines like `[[<entry>/wireframes/<screen>]] | wireframe:<status>`).
   - List all wireframe files: `find journal -path '*/wireframes/*.md'`. Read any that relate to the screen being worked on.
   - If the target screen has an `implements:` path, read that component source — the wireframe must not contradict as-built truth without an explicit supersede decision.
   - Read `journal/host-layer/decisions.md` sections "TUI structure" (routes/dialogs enumerate the screens) and "v1 Frontend" (pane layout direction).

## 2. Decide where the wireframe lives

- One file per **screen** (a route or a dialog): `journal/<entry>/wireframes/<screen>.md`. Screen-level ONLY — components never get their own wireframes; a screen's runtime **states** are frames inside its single file.
- The screen belongs to the feature entry that owns its UX; global chrome belongs to `host-layer`. New feature without an entry → `/journal-start` it first.

## 3. Draw

- Frontmatter is validated by `scripts/compile-journal-index.ts`: `screen` (must equal filename), `kind: route | dialog`, `status: exploring | adopted | superseded`, `sizes: [80x24, ...]`, `implements: []`, `superseded-by` only when superseded.
- Start with a `## Motivation` section: why the screen exists, what the user is doing there, what it must never obscure. This is the part future iterations read first.
- Frames go in fenced code blocks at the declared sizes. Box-drawing borders mark the terminal edge. Annotate with circled markers (①②③); the legend lives BELOW the frame, never inside it.
- While exploring: `## Variant <X> — <name>` sections, one frame each, a one-line **Verdict** on every loser (keep losers — they are the archaeology).
- Once adopted: `## States` with one frame per distinct-layout state (empty, streaming, error, overlay open…).

## 4. Validate and hand off

1. Run `bun scripts/compile-journal-index.ts` — must pass with zero new warnings (it validates frontmatter and rebuilds the index).
2. The picker (`pnpm wireframes`, apps/wireframes) auto-detects the new/edited file within ~2s and jumps to it — tell the user it's already visible there; no reload needed.
3. When a variant is adopted or a screen supersedes, record the decision + wikilink in the owning entry's `decisions.md`.

## Rules that override everything

- Never silently edit a sketch to match code — supersede instead (`status: superseded` + `superseded-by`).
- Never create a component-level wireframe.
- Read the existing wireframe before modifying a screen; it carries the motivation the code cannot.
