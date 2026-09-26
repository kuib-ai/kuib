---
id: R411
title: Component-layer lint rules for kuib's own TUI library
state: idea
horizon: later
domains: [infra]
depends-on: ["[[roadmap/items/R300-own-tui-library]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/house-style-linting/decisions#Open Questions — Solid-JSX linting bucket (deferred)]]", "[[_archive/house-style-linting/decisions#The house style (audited from the author's hand-written reference codebase)]]"]
touched: 2026-09-25
---

# R411 — Component-layer lint rules for kuib's own TUI library

## Idea

The house style locks only the pure-module archetype (namespace-object barrel). The reference
codebase also had a component archetype (named re-export barrel) and a service/store archetype
(`export *`), both React-derived and deferred to a Solid-JSX bucket. With OpenTUI/Solid gone,
the bucket re-targets kuib's own terminal UI library. Open rules to decide:

- Component definition shape and the scope of `no-destructure-props`.
- Component / service barrel archetypes.
- State idioms (signals/stores/memos — the RTK replacement).
- Props typing (`type` vs `interface`).
- Reactivity lints (effect dependencies, etc.).

React-derived rules cannot be ported as-is; the component model differs.

## Why

Agent-written UI code needs the same idiom enforcement as the rest of the codebase.

## Open questions

- The UI is native
  ([[features/deno-runtime/plan#D007 — The terminal UI is native; engine, daemon and tooling stay TypeScript]]),
  so these ESLint rules for a TypeScript/Solid component layer may not apply: retarget them to
  the native language's linter, or drop this item.
- Target library: [[roadmap/items/R300-own-tui-library]].
- Which of these still apply once the TUI library's component model exists?

## Constraints already decided

- House style as a lint plugin at error severity: [[domains/infra/decisions#^D015]]; current rule set: [[domains/infra/current#^house-style-rules]].

## History

- 2026-09-22 migrated from the archive
- 2026-09-25 flagged: the UI is native (deno-runtime D007)
