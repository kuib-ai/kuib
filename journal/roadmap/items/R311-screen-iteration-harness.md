---
id: R311
title: Screen iteration harness — frame dumps, snapshot tests, wireframe picker
state: shaped
horizon: next
domains: [host, infra]
depends-on: ["[[roadmap/items/R300-own-tui-library]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/ux-iteration-process/decisions#The iteration loop]]", "[[_archive/ux-iteration-process/decisions#Tooling decisions]]", "[[_archive/ux-iteration-process/decisions#Lifecycle (the binding rules)]]"]
touched: 2026-09-22
---

# R311 — Screen iteration harness — frame dumps, snapshot tests, wireframe picker

## Idea

There is no "Figma for TUIs"; polished TUI teams iterate live in the real framework. The feedback
loop around live iteration is what makes it fast. The loop:

1. **Sketch** — screen wireframe in ASCII ([[SPEC#Wireframes]]); "build variant B" is a complete
   instruction.
2. **Build** — on [[roadmap/items/R300-own-tui-library]].
3. **Verify headless** — a **frame-dump harness**: a small script + fixture event logs that mounts
   one screen with mock state and prints its character frame at each declared wireframe size.
   The agent reads frames as text, no screenshots. A "storybook for terminals" — none exists in
   JS land. Build it before the first new screen.
4. **Verify live** — watch-restart against the persistent engine
   ([[domains/host/decisions#^D008]]).
5. **Lock in** — frame snapshots as regression tests on `deno test` + `@std/testing/snapshot`,
   committed next to the component tests. Wireframe = intent, snapshot = actual, both plain text
   at the same dimensions: drift is a `diff` away and resolving it (fix screen vs supersede
   wireframe) is an explicit decision.

**Wireframe picker** (dev tooling, not part of the product host): discovers every wireframe
(`roadmap/wireframes/`, `domains/*/wireframes/`) and renders it in the terminal at true fidelity;
`h/l` (and `j/k`) flip screens; the list shows screen + status; works over SSH so co-design
sessions flip sketches next to the running UI in one tmux. It dogfoods the library's stock
components (select, scroll box, text). It is the right-hand pane of the design session
([[domains/infra/current#^design-script]]), which currently has nothing to show there.

Deferred/optional: a PTY driver for agent-run end-to-end tests, scripted GIF recordings for
design review.

## Why

Agents iterate on screens they cannot see; text frames at fixed sizes make rendering reviewable
and regressions diffable.

## Open questions

- Fixture format for event logs (recorded SQLite files vs event arrays).
- Whether the picker lives as a role of the main binary or a separate dev script.

## Constraints already decided

- [[domains/infra/decisions#^D022]] — design sessions run in an isolated, converging worktree.
- [[domains/infra/decisions#^D023]] — colocated, hermetic Deno tests.
- [[domains/host/decisions#^D008]] — watch-restart, no HMR.

## History

- 2026-09-22 migrated from the archive
