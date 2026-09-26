---
id: R300
title: kuib's own native terminal UI
state: shaped
horizon: next
domains: [host]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/host-layer/decisions#v1 Frontend — OpenTUI + Solid (nvim-flavored)]]", "[[_archive/host-layer/decisions#TUI structure — provider stack, route store, dialog overlay (2026-07-03)]]", "[[_archive/host-layer/decisions#Current Decisions]]", "[[_archive/host-layer/research/tui-framework#Why OpenTUI+Solid (not Ink)]]", "[[_archive/host-layer/research/tui-framework#nvim fork (decided: flavored for v1)]]", "[[_archive/host-layer/research/tui-framework#Reference apps (proven OpenTUI, for study)]]", "[[features/deno-runtime/plan]]", "conversation 2026-09-23"]
touched: 2026-09-25
---

# R300 — kuib's own native terminal UI

## Idea

A terminal UI stack written in a native language, owned end to end, that every kuib screen is
built on, shipped as its own executable. Direction is fixed by
[[features/deno-runtime/plan#D007 — The terminal UI is native; engine, daemon and tooling stay TypeScript]],
which supersedes the TypeScript-and-Solid direction of D005:

- **Owned layers:** terminal I/O and input parsing, a cell buffer with a diffing writer,
  grapheme width, an owned flex subset (no Yoga), components, and a keymap.
- **State and rendering:** a retained view tree fed by the session fold; frame scheduling
  belongs to the renderer. The reactive model is chosen with the language.
- **Render-on-change, flicker-free:** only changed nodes update (the user's "dynamic FPS"
  requirement — no fixed render loop). The writer is retained-mode and double-buffered: it writes
  only changed cells and never clears then redraws. Known failure modes to avoid: `\x1b[3J`
  wiping scrollback, `reset()`-then-`write()` blank frames, and full-subtree replacement flicker.
  Ink was rejected for the same reason (whole-tree reconcile plus JS-side ANSI diffing).
- **nvim-flavored, not embedded nvim:** modal navigation and selection (normal/visual, `hjkl`,
  operators, leader) bound to a minimal verb set of real actions — navigate, visual-select
  parts, save/exclude/toggle discussion, preview payload. Not a vim emulator. Real embedded nvim
  is [[roadmap/items/R308-nvim-bridge]].
- **App structure (three layers, no router library):**
  - *Shared state* at the root (event-log store, config, theme, keymap) that screens read.
  - *Route store* — `Route` is a discriminated union held in one store; navigating replaces it
    and the root switches on the route type. No URLs, no history stack. One module per screen.
  - *Dialog overlay layer* — pickers, approvals, help, palette stack above the current route;
    they are not routes. The remote-daemon picker for command execution lands here.
  The Route union plus the dialog list is the table of contents of the wireframe set: one
  wireframe per route or dialog ([[SPEC#Wireframes]]).
- **Components needed by the planned screens:** scroll box, text, markdown, input, textarea,
  select, tab-select, code with line numbers, diff, syntax highlighting.
- **Engine boundary:** the UI never links engine code. It spawns or attaches to the engine
  entry ([[roadmap/items/R221-self-contained-engine]]), sends `submit`/`interrupt` frames on the
  engine socket and reads the session from the SQLite log ([[domains/core/decisions#^D016]],
  [[roadmap/items/R302-ui-host-attach]]).

Reference TUIs worth studying for patterns (they were built on OpenTUI, the patterns carry over):
OpenCode (client-server: HTTP server + thin TUI client, validates the engine/host split),
`modem-dev/hunk` (review-first terminal diff viewer — the closest analog to kuib's comprehension
surface), `kitlangton/ghui` (clean TUI state patterns), `remorses/critique` (git-change
reviewer).

## Why

The OpenTUI/Solid view layer was deleted rather than ported
([[domains/host/decisions#^D002]]); kuib wants full control over rendering and look, peak
performance, and startup that feels instant. A compiled Deno program cannot start below its
runtime floor of about 14 ms, and the current TypeScript entry takes about 90 ms
([[roadmap/research/startup-and-compile]]); a native binary starts in a few milliseconds with no
garbage-collection pauses. Every UI item below depends on this library existing.

## Open questions

- Which native language.
- How the protocol's Zod schemas (events, envelope, control frames) reach the native code:
  generated types from a JSON-schema export ([[roadmap/items/R212-schema-migration-chain]]
  snapshots one) or hand-kept mirrors.
- Reading the SQLite log natively: WAL reader, poll interval, and the doorbell of
  [[roadmap/items/R302-ui-host-attach]].
- Mouse tracking: enabling it forces Shift+drag for terminal text selection; is in-app
  copy-on-select part of the keymap work?
- Hot reload stays out; the dev loop is watch-restart ([[domains/host/decisions#^D008]]), so the
  language's incremental build time matters.

## Constraints already decided

- Owner, 2026-09-23: "keep the engine and the daemon adn everything in typescript" — "and make
  the TUI in a native language for extreemly fast startups".
- [[domains/host/decisions#^D001]] — a UI host never embeds the engine.
- [[domains/host/decisions#^D002]] — no `@opentui/*`; the view layer returns on this library.
- [[domains/host/decisions#^D008]] — watch-restart dev loop, no HMR.
- [[domains/host/decisions#^D003]] (the host runs on Deno from source) covers today's TypeScript
  host; the native UI host supersedes it for the UI when it is built.

## History

- 2026-09-22 migrated from the archive
- 2026-09-25 the UI is native (deno-runtime D007); TypeScript/Solid direction dropped, engine
  boundary and language questions added
