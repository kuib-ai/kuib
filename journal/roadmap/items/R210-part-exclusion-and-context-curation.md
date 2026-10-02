---
id: R210
title: Per-part exclusion and context curation
state: absorbed
horizon: next
domains: [core, host]
depends-on: []
converges-with: ["[[roadmap/items/R209-message-editing-and-branching]]", "[[roadmap/items/R306-discussions-context-control]]", "[[roadmap/items/R101-context-transparency-and-control]]"]
split-from: []
absorbed-into: "[[roadmap/items/R007-context-control]]"
feature: ""
origin: ["[[_archive/context-engine/decisions#Goal]]", "[[_archive/context-engine/decisions#3. Context Curations]]", "[[_archive/protocol-design/decisions#Event Taxonomy — Revised (2026-04-26)]]"]
touched: 2026-09-28
---

# R210 — Per-part exclusion and context curation

## Idea

Every part already carries `excluded: boolean`, but nothing sets it and `buildMessages` ignores
it. The design: the user toggles a part in a host (still rendered, dimmed/struck-through, not
sent to the model); the host submits `PartExcluded { messageID, partID }` /
`PartIncluded { messageID, partID }`; context assembly filters excluded parts before building
the provider payload. Step boundaries and transient states are never sent regardless.

## Why

Selective inclusion is the cheapest context-control tool: drop a huge tool output or a wrong
answer without editing or branching.

## Open questions

- Is exclusion folded as a replayed event (log-only) or as state on the materialized part?
- How an excluded tool call is represented to the provider (drop the call and its result as a
  pair, or keep a stub result).

## Constraints already decided

- `PartBase { partID, excluded }` on every part — [[domains/core/current#^protocol-parts]],
  [[domains/core/decisions#^D009]].
- Exclusion events are order-independent user actions needing no lock (R201).

## History

- 2026-09-22 migrated from the archive
- 2026-09-28 absorbed into [[roadmap/items/R007-context-control]]
