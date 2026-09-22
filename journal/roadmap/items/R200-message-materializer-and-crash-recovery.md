---
id: R200
title: Messages snapshot materializer, persistence cursor and crash recovery
state: shaped
horizon: next
domains: [core]
depends-on: []
converges-with: ["[[roadmap/items/R214-replicated-session-log]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Two Worlds: Events vs Messages]]", "[[_archive/protocol-design/decisions#Atomic Commit Protocol (2026-04-28)]]", "[[_archive/protocol-design/decisions#Materialization & resume — runtime model + mesh (2026-06-30)]]", "[[_archive/protocol-design/decisions#SQLite backing — `bun:sqlite` now, `node:sqlite` later (LOCKED 2026-07-01, supersedes runtime-adaptive)]]", "[[_archive/protocol-design/decisions#Persistence Model — Three Layers (revised 2026-04-28)]]", "[[_archive/protocol-design/decisions#Tool Call Parts — Append-Only, No Mutation]]", "[[_archive/protocol-design/decisions#Open Questions]]"]
touched: 2026-09-22
---

# R200 — Messages snapshot materializer, persistence cursor and crash recovery

## Idea

Today the event log is the only store: the model context (`buildMessages`) and the transcript
(`foldTranscript`) both re-fold the whole session log on every read. The design adds a second,
derived layer — a **materialized `messages` snapshot** — kept in step with the log by a
background materializer.

- **Tables** (next to the existing `events` table): `messages(messageID, sessionID, message
  JSON, PK(messageID))` — the materialized snapshot, one row per message holding the
  `MessageUser` / `MessageAssistant` aggregate with its `parts[]`; plus `sessions` and
  `checkpoints` (see R207).
- **Fold rules** (events → message): `MESSAGE_STARTED` creates an assistant skeleton with no
  parts; `STEP_STARTED` appends `PartStepBoundary(step-start)`; `TEXT_DELTA` /
  `REASONING_DELTA` accumulate into the `PartText` / `PartReasoning` named by `partID` (created
  on the first delta); `STEP_FINISHED` appends `PartStepBoundary(step-stop)` with reason, model
  and tokens; tool-call events append `PartToolCall` entries (pending, then completed/error) —
  append-only, the current state of a call is the last part with its `callID`, and results land
  between a step-stop and the next step-start; `MESSAGE_COMPLETED` / `MESSAGE_FAILED` seal the
  message (`status`, `completedAt`, error kind). `ToolCallStarted` ("running") is event-only and
  never appears in the snapshot.
- **Materialize incrementally at boundaries, not after the query.** Boundaries are
  step-stop **and** tool-call completion (a tool that ran a side effect is a durable fact).
  Each flush folds `(cursor, X]` — one step's chunks — so cost is O(chunks-in-step) plus one
  UPSERT per affected message. Per-query-only materialization was rejected: it forces full-query
  replay on crash and strands long/abandoned queries. Materialization is lazy/cold-path: hosts
  render from events and never wait on it.
- **Persistence cursor** — a durable per-session `lastPersistedSeq`. The materializer reads
  `(cursor, latest boundary]`, applies it, advances the cursor. If the materializer is slow or
  fails, the log keeps accepting events and persistence catches up asynchronously.
- **Crash recovery** — on engine restart: read the last seq in the log, read the cursor, replay
  `(cursor, last]` into the snapshot, then resume. Per-event atomic append means the log is
  never torn.
- **Resume = settled snapshot + unsettled tail.** Reopening a host mid-query reads, in
  parallel, the `messages` snapshot (settled steps) plus the log tail since `lastPersistedSeq`
  (the in-flight step), merged into exact state.
- **Ordering is `(epoch, seq)`, never timestamp** — `createdAt` is display-only.
- The snapshot is a **cache**: corrupt/stale/missing → rebuild from log replay (slower, correct).

## Why

Cold loads and context assembly currently cost a full replay of the session; long sessions get
slower linearly. A snapshot also gives message-level operations (versions, checkpoints,
compaction, discussions) a stable aggregate to point at.

## Open questions

- `Protocol.Message` (`MessageUser` / `MessageAssistant` / `AnyMessage`) has no consumer
  outside the protocol today. It is the natural schema for the snapshot rows — decide when the
  materializer lands; do not delete it blindly.
- Does `buildMessages` switch to reading the snapshot + tail, or stay a pure log fold?
- Flush cadence knob: step end, message end, or configurable.

## Constraints already decided

- The event log is canonical; the snapshot is derivable and never a source of truth —
  [[domains/core/decisions#^D004]], [[domains/core/decisions#^D011]].
- Snapshot tables live in the same SQLite file behind the event-log package —
  [[domains/core/decisions#^D010]].
- Aggregates carry `_version: 1`; leaves do not — [[domains/core/decisions#^D005]].
- Tool-call parts are append-only — [[domains/core/decisions#^D008]].
- Materialization must be a pure deterministic function of the `(epoch, seq)` log so every mesh
  node rebuilds an identical snapshot; the cursor is per-node local state (see R214).

## History

- 2026-09-22 migrated from the archive
