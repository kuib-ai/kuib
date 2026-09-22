---
id: R211
title: Discussions — a PartID[] overlay, toggleable in context and shareable across sessions
state: shaped
horizon: later
domains: [core, host]
depends-on: ["[[roadmap/items/R207-checkpoints-and-context-assembly]]"]
converges-with: ["[[roadmap/items/R306-discussions-context-control]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Discussion Clustering]]", "[[_archive/protocol-design/decisions#Event Taxonomy — Revised (2026-04-26)]]", "[[_archive/protocol-design/decisions#Open Questions]]", "[[_archive/protocol-design/decisions#Resolved Questions]]", "[[_archive/protocol-design/progress#Rebuild list]]"]
touched: 2026-09-22
---

# R211 — Discussions — a PartID[] overlay, toggleable in context and shareable across sessions

## Idea

Messages cluster into discussions that can be included in or excluded from the model context at
runtime.

- **Model:** `Discussion { _version: 1, id: DiscussionID, partIDs: PartID[], … }` — an ordered
  sequence of part IDs stored on the discussion entity. **Parts are oblivious to membership**
  (no back-reference), so there are no structural invariants on the parts array to maintain.
- **Rendering:** linear render of messages is the base; a discussion view loads its `partIDs`,
  builds a `Set<PartID>`, and styles each part by membership (in-discussion highlighted,
  excluded dimmed). Step boundaries and transient states are never members.
- **Mutations are surgical events:** `DiscussionCreated`, `DiscussionUpdated`,
  `DiscussionDeleted`, `DiscussionPartsAdded` / `DiscussionPartsRemoved { discussionID,
  partIDs }`, `DiscussionToggled { sessionID, discussionID, included }`.
- **Cross-session sharing:** a session references a discussion via `SessionDiscussionRef
  { discussionID, included, snapshotVersion }` (`DiscussionLinked`). Snapshot semantics:
  changes to a discussion do not propagate automatically; a session explicitly updates to the
  latest.
- Checkpoints record `discussions: [{ id, included }]` (R207).

## Why

Topic-level context control: a long session mixes several threads, and only some should reach
the model for a given question.

## Open questions

- The UX is undecided — schema first, UX in the discussions UX work.
- Cross-session snapshot semantics in detail; the `session` schema redesign.
- User / org / team model and its effect on discussions and permissions.

## Constraints already decided

- `DiscussionID` exists and `MessageBase` carries `discussionID` —
  [[domains/core/current#^C004]], [[domains/core/current#^C010]].
- Every part has a stable `partID` — [[domains/core/decisions#^D009]].

## History

- 2026-09-22 migrated from the archive; also carries protocol-design's "Discussion Model —
  PartID[] Overlay (Updated 2026-04-25)" section, whose brackets cannot be wikilinked in `origin`.
