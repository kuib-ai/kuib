---
id: R300
title: kuib's own terminal UI library
state: shaped
horizon: next
domains: [host]
depends-on: ["[[roadmap/items/R002-deno-runtime]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/host-layer/decisions#v1 Frontend — OpenTUI + Solid (nvim-flavored)]]", "[[_archive/host-layer/decisions#TUI structure — provider stack, route store, dialog overlay (2026-07-03)]]", "[[_archive/host-layer/decisions#Current Decisions]]", "[[_archive/host-layer/research/tui-framework#Why OpenTUI+Solid (not Ink)]]", "[[_archive/host-layer/research/tui-framework#nvim fork (decided: flavored for v1)]]", "[[_archive/host-layer/research/tui-framework#Reference apps (proven OpenTUI, for study)]]", "[[features/deno-runtime/plan]]"]
touched: 2026-09-22
---

# R300 — kuib's own terminal UI library

## Idea

A pure-TypeScript terminal UI stack, owned end to end below the reactive layer, that every
kuib screen is built on. Direction is fixed by
[[features/deno-runtime/plan#D005 — Direction for the follow-up TUI library]]:

- **Owned layers:** terminal I/O and input parsing, a cell buffer with a diffing writer,
  grapheme width, an owned flex subset (no Yoga), components, and a keymap.
- **Reactivity:** Solid stays as the reactive core through `solid-js/universal`
  `createRenderer`. Frame scheduling belongs to the renderer, not to Solid effects. The
  renderer depends only on the universal-renderer contract, so Solid stays replaceable.
- **Render-on-change, flicker-free:** fine-grained reactivity means only changed nodes
  update (the user's "dynamic FPS" requirement — no fixed render loop). The writer is
  retained-mode and double-buffered: it writes only changed cells and never clears then
  redraws. Known failure modes to avoid: `\x1b[3J` wiping scrollback, `reset()`-then-`write()`
  blank frames, and full-subtree replacement flicker. Ink was rejected for the same reason
  (whole-tree reconcile plus JS-side ANSI diffing).
- **nvim-flavored, not embedded nvim:** modal navigation and selection (normal/visual, `hjkl`,
  operators, leader) bound to a minimal verb set of real actions — navigate, visual-select
  parts, save/exclude/toggle discussion, preview payload. Not a vim emulator. Real embedded nvim
  is [[roadmap/items/R308-nvim-bridge]].
- **App structure (three layers, no router library):**
  - *Provider stack* — Solid contexts at the root for shared state (event-log store, config,
    theme, keymap); screens consume hooks.
  - *Route store* — `Route` is a Zod-first discriminated union held in a Solid store;
    `navigate()` is `reconcile()`; the root renders `<Switch>/<Match>` on `route.type`. No URLs,
    no history stack. Screens live in `routes/`.
  - *Dialog overlay layer* — pickers, approvals, help, palette stack above the current route via a
    dialog context; they are not routes. The remote-daemon picker for command execution lands
    here.
  The Route union plus the dialog list is the table of contents of the wireframe set: one
  wireframe per route or dialog ([[SPEC#Wireframes]]).
- **Components needed by the planned screens:** scroll box, text, markdown, input, textarea,
  select, tab-select, code with line numbers, diff, syntax highlighting.

Reference TUIs worth studying for patterns (they were built on OpenTUI, the patterns carry over):
OpenCode (client-server: HTTP server + thin TUI client, validates the engine/host split),
`modem-dev/hunk` (review-first terminal diff viewer — the closest analog to kuib's comprehension
surface), `kitlangton/ghui` (clean Solid TUI state and JSX patterns), `remorses/critique`
(git-change reviewer).

## Why

The OpenTUI/Solid view layer was deleted rather than ported
([[domains/host/decisions#^D002]]); kuib wants full control over rendering and look, peak
performance, and fast startup, which `dlopen`-based native cores hurt. Every UI item below
depends on this library existing.

## Open questions

- Solid JSX needs a compile step on Deno (deno-runtime G005): where it runs in dev vs for
  `deno compile` binaries.
- Mouse tracking: enabling it forces Shift+drag for terminal text selection; is in-app
  copy-on-select part of the keymap work?
- Hot reload (same-PID re-eval with renderer reuse) is unsolved and leak-prone; the standing
  answer is watch-restart ([[domains/host/decisions#^D008]]). Revisit only if restarts get slow.

## Constraints already decided

- [[domains/host/decisions#^D001]] — a UI host never embeds the engine.
- [[domains/host/decisions#^D002]] — no `@opentui/*`; the view layer returns on this library.
- [[domains/host/decisions#^D003]] — runs on Deno from source.
- [[domains/host/decisions#^D008]] — watch-restart dev loop, no HMR.

## History

- 2026-09-22 migrated from the archive
