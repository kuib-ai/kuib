---
title: "Discussions UX"
type: implementation
status: open
layer: experience
created: 2026-06-18
tags: [discussions, context, selection, ux, v1]
depends-on: ["[[protocol-design]]", "[[comprehension-model]]", "[[host-layer]]"]
informs: ["[[context-bootstrap]]", "[[context-engine]]"]
---

# Discussions UX

## Current Decisions

### Protocol vs UX Split

**Protocol** ([[protocol-design]]): `Discussion { partIDs: PartID[] }` overlay; `PartBase { partID, excluded }`; events for create/toggle/add/remove parts; context build filters excluded parts.

**UX (this entry)**: how users select, deselect, save, and reference discussions in the host — merged into v1 Pair/Kuib interface.

### Granular Context Control

Not linear "last N messages" focus. Users can:

- **Exclude parts** — dim in UI, omit from LLM payload (`UserPartExcluded` / `PartIncluded`)
- **Toggle discussions** — include/exclude entire clusters at runtime
- **Select parts → save discussion** — `DiscussionPartsAdded`, name for later reference
- **Link discussions across sessions** — `DiscussionLinked` + snapshot semantics (detail TBD in protocol)

Linear `Message[]` is the render base. Discussion view overlays via `Set<PartID>` lookup — highlighted in-discussion, dimmed excluded.

### v1 Merge with Comprehension

- Conversation pane handles discussions + transparency (same host window)
- Ledger handles hunks separately; cross-link via optional `anchors: HunkID[]` on discussion metadata (navigation only, not sent to LLM)
- Sub-chats may be discussions with hunk anchor metadata (`#sc-12`)

### Host Affordances (To Build)

- Visual selection of message parts (operator or visual mode)
- Save selection as named discussion
- Toggle discussion included in next context build
- Preview payload before send (transparency — [[vision]])

## Open Questions

- Discussion included by default on create, or opt-in?
- Cross-session snapshot: explicit "update to latest" UX
- Mixed refs (parts + hunk IDs) vs parts-only for LLM context
