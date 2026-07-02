---
title: "UX Iteration Process"
type: reference
layer: process
status: decided
created: 2026-07-03
tags: [ux, wireframes, iteration, tui, process, screens]
depends-on: ["[[host-layer]]", "[[testing-strategy]]"]
informs:
  [
    "[[discussions-ux]]",
    "[[context-bootstrap]]",
    "[[multi-device-ux]]",
    "[[comprehension-model]]",
  ]
---

# UX Iteration Process

How we design, iterate, and keep truth about kuib's screens. Grounded in a research pass (2026-07-03): there is no "Figma for TUIs" — every polished TUI team (opencode, lazygit, Charm) iterates live in the real framework. What separates fast teams is the feedback loop around live iteration. Ours has three parts: screen-level ASCII wireframes as first-class journal nodes, a headless frame-dump harness for agent-visible rendering, and watch-restart against the persistent engine ([[host-layer]] TUI dev loop).

## Wireframes are first-class journal nodes

A wireframe is the **motivation + intended layout of one screen**, kept where decisions live so any iteration (human or agent) reads it before touching the screen.

### Screen-level ONLY

One wireframe file per **screen** — a route or a dialog ([[host-layer]] TUI structure). **Never per component.** Components are exercised through the screens that contain them; a component with no screen has no wireframe. Distinct runtime **states** of a screen (empty, streaming, tool-running, error, overlay open) are frames _inside_ that screen's single file, not separate files. This keeps the wireframe set enumerable: the route union + dialog list IS the table of contents of the wireframe folders.

### Location

`journal/<entry>/wireframes/<screen>.md` — sibling to `research/`. A screen belongs to the feature entry that owns its UX (e.g. `discussions-ux`); global chrome (session screen, status bar, pane layout) belongs to [[host-layer]]. Wikilink as \[\[<entry>/wireframes/<screen>\]\], e.g. [[host-layer/wireframes/session]].

### File format

```markdown
---
screen: <name> # matches the Route union member or dialog id
kind: route | dialog
status: exploring | adopted | superseded
sizes: [80x24, 120x32] # terminal dimensions the frames are drawn at
implements: [] # component path(s) once built
superseded-by: # wikilink, only when status: superseded
---

## Motivation

Why this screen exists; what the user is doing here; what it must never obscure.

## Variant A — <name> (while exploring)

\`\`\`
<frame drawn at a declared width, annotated with ① ② markers>
\`\`\`

① legend lines live BELOW the frame, never inside it
**Verdict:** rejected — <one line why>. (Losing variants are KEPT — they are the archaeology.)

## States (once adopted: one frame per distinct-layout state)

### empty / streaming / tool-running / error …
```

### Lifecycle (the binding rules)

1. **Read before iterate.** Any change to a screen — design or code — starts by reading its wireframe. It carries the motivation; code only carries the result.
2. **Explore in variants.** Sketch alternatives as Variant sections; record a one-line verdict on each loser instead of deleting it.
3. **Adopt explicitly.** Winner flips the file to `adopted`; the owning `decisions.md` records _why_ with a wikilink to the wireframe.
4. **Supersede, don't chase.** When the implementation diverges for good reasons, do NOT edit the sketch to match the code — flip `status: superseded`, set `superseded-by`, and start a new wireframe (or let the as-built snapshot become the truth). Superseded wireframes are cleaned to motivation + verdicts; stale frames may be dropped.
5. **As-built loop closes it.** Once implemented, `implements:` points at the component, and `captureCharFrame()` snapshots at the declared `sizes` (committed next to the component tests) are the as-built frames. Wireframe = intent, snapshot = actual, both plain text at the same dimensions — drift is a `diff` away and resolving it (fix screen vs supersede wireframe) is an explicit decision, never silent rot.

## The iteration loop

1. **Sketch** — screen wireframe in ASCII (variants, states). This is also the prompt artifact: "build variant B" is a complete instruction.
2. **Build** — implement against the wireframe with OpenTUI + Solid.
3. **Verify headless** — the frame-dump harness (`testRender` + `captureCharFrame` + fixture event logs) renders the screen at the declared sizes; the agent reads frames as text — no screenshots needed.
4. **Verify live** — `dev:watch` (watch-restart TUI, engine-service persists across restarts — [[host-layer]]).
5. **Lock in** — frame snapshots become regression tests (`bun test` `toMatchSnapshot`).

## Tooling decisions

- **`/wireframe` skill** (`.claude/skills/wireframe/`): the entry point for designing/editing any screen wireframe. Loads this entry's conventions, the `opentui` skill, and the current wireframe/codebase state before drawing; validates via the index compiler after.
- **Design session** (`pnpm design` / `scripts/design-session.sh`): one command (works over ssh, `-t`) that converges tmux session `kuib/rupsha` to: left pane `claude "/wireframe"`, right pane the live picker. Idempotent — a running claude is never killed; the picker is always respawned fresh; a malformed session is rebuilt.

- **Wireframe picker** (`pnpm wireframes`, its own app: `apps/wireframes` — dev tooling, deliberately NOT part of the product host): an OpenTUI app that discovers every `journal/*/wireframes/*.md` and renders it in the terminal — the wireframes' native medium, at true fidelity. `h`/`l` (and `j`/`k`) flip between screens, the list shows `entry/screen` + status, the preview header shows which file contains the frame. Built from stock components (`select`, `scrollbox`, `text`) — dogfoods our own TUI stack. Works over SSH, so co-design sessions can flip through sketches next to the running TUI in one tmux.
- **Frame-dump harness** (to build, before the first new screen): a small script + fixture event logs that mounts one screen with mock state and prints `captureCharFrame()` at each declared size. Our DIY "storybook for terminals" — none exists in JS land.
- **Snapshot tests**: `testRender` char frames via Bun snapshots — the OpenTUI analog of Textual's `pytest-textual-snapshot`.
- **Deferred/optional**: anscribe (point-at-renderable → agent capture, OpenTUI-native), tuistory/pilotty (PTY driver for agent-run e2e), VHS (scripted GIFs for design review).

## Not process

- Engine/orchestration iteration (own entry when started); this entry is screens only.
- Dev-loop mechanics (watch/hot-reload findings) live in [[host-layer]].
