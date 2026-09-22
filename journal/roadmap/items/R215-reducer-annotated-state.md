---
id: R215
title: Reducer-annotated session state and thread-keyed checkpointing
state: idea
horizon: maybe
domains: [core]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#State Management: LangGraph-inspired reducers (no LangGraph dependency)]]", "[[_archive/protocol-design/decisions#Module Structure]]", "[[_archive/protocol-design/plan#Phase 2: Engine]]", "[[_archive/protocol-design/progress#Rebuild list]]"]
touched: 2026-09-22
---

# R215 — Reducer-annotated session state and thread-keyed checkpointing

## Idea

Two patterns borrowed from LangGraph, without the dependency, for a protocol `state` module:

1. **Reducer-annotated fields** — `StateField<T>` = Zod schema + default factory + reducer.
   Each field defines how partial updates merge (messages append, status overwrites, usage
   accumulates). An earlier version had five built-in reducers, a `SESSION_STATE` definition and
   `applyUpdate` / `createState` / `validateState` utilities; `validateState()` runs each field
   through its schema when deserializing from disk or the wire.
2. **Thread-keyed checkpointing** — `thread_id → serialized state` as a first-class concept
   (`ThreadID` is already a protocol ID).

## Why

A declared merge rule per field would give the materializer (R200) and checkpoints (R207) one
generic fold instead of hand-written per-event cases.

## Open questions

- Is this still wanted now that state is a fold over the event log? It may be absorbed by R200.

## Constraints already decided

- No LangGraph or XState dependency; the loop is the AI SDK's `streamText` —
  [[domains/core/decisions#^D020]].

## History

- 2026-09-22 migrated from the archive
