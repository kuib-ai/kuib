---
id: R207
title: Checkpoints as bookmarks and checkpoint-driven context assembly
state: shaped
horizon: later
domains: [core]
depends-on: ["[[roadmap/items/R200-message-materializer-and-crash-recovery]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Checkpoint Model — Bookmarks, Not Snapshots]]", "[[_archive/protocol-design/decisions#Persistence Model — Three Layers (revised 2026-04-28)]]", "[[_archive/protocol-design/decisions#Resolved Questions]]"]
touched: 2026-09-22
---

# R207 — Checkpoints as bookmarks and checkpoint-driven context assembly

## Idea

A checkpoint is a lightweight pointer into existing data, not a state copy:

```ts
Checkpoint {
  _version: 1,
  id: CheckpointID,
  sessionID: SessionID,
  seq: number,                    // event sequence at this point
  model: ModelRef,
  discussions: Array<{ id: DiscussionID, included: boolean }>,
  git?: GitState,
  activeMessages: Array<{ messageID: MessageID, version: number }>,
  createdAt: number,
}
```

Three persistence layers: **event log** (canonical, per-event append), **message store** (all
messages, all versions, never deleted — R200), **checkpoints** (created, never modified;
snapshot pointers into both). `CheckpointCreated { checkpointID, seq }` records creation.

**Context creation is a pure function:** load checkpoint → active messages at their recorded
versions → filter excluded parts → build the LLM payload. This replaces today's "replay the
whole log" `buildMessages` once messages can be edited, archived or excluded.

## Why

Compaction (R208), message versions and branches (R209), exclusion (R210) and discussions
(R211) all change *which* content is in context without deleting history; the active set needs
one durable home.

## Open questions

- Checkpoint cadence: per turn, per step, on explicit user action?
- `GitState` shape and whether it is captured automatically.

## Constraints already decided

- `CheckpointID` is already a branded protocol ID — [[domains/core/current#^protocol-ids]].
- The message store is the single source of truth for content; checkpoints never duplicate it.

## History

- 2026-09-22 migrated from the archive
