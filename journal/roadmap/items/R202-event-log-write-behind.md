---
id: R202
title: Hot-path throughput — write-behind event log and validation only at boundaries
state: shaped
horizon: later
domains: [core]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Materialization & resume — runtime model + mesh (2026-06-30)]]", "[[_archive/protocol-design/decisions#Performance Strategy]]"]
touched: 2026-09-22
---

# R202 — Hot-path throughput — write-behind event log and validation only at boundaries

## Idea

Today every streamed chunk is a synchronous `BEGIN IMMEDIATE` → insert → `COMMIT` in SQLite and
every envelope is Zod-parsed. The design keeps two decoupled write paths, neither blocking
streaming:

- **Event-log append (hot path, every chunk) — write-behind.** Buffer in RAM, batch-flush to
  SQLite in WAL mode. Durability is a tunable knob: on a client machine fsync is relaxed (worst
  case a hard crash loses the last ~second of unflushed chunks, which the user re-runs). Write
  throughput is the priority.
- **Materializer** — folds events into the snapshot at coarse boundaries, off the hot path (R200).

Performance rules from the same design:

- **No Zod validation on the streaming hot path.** Validate at transport boundaries only
  (socket, disk, process boundary); in-process the type system guarantees shape.
- **No envelopes in-process** in the collapsed single-process case: events flow as plain typed
  objects via callback; `(epoch, seq)` envelopes are for the persistent log and remote transport.
- **Hosts render from events, not messages** — surgical deltas into an in-memory
  `Map<ToolCallID, …>`, no parts-array scanning.
- **Provider adapter is thin field mapping** — AI SDK stream parts map ~1:1 to events.

## Why

A per-chunk transaction with fsync bounds token throughput by disk latency; batching restores it
at the cost of a bounded, user-recoverable loss window.

## Open questions

- Flush trigger: size, time (~1 s), boundary events (always flush on terminal and tool-result
  events?), or all three.
- How in-process subscribers see buffered-but-unflushed events while cross-process readers
  (which poll SQLite) do not — acceptable skew?

## Constraints already decided

- SQLite on `node:sqlite` in WAL mode, separate package — [[domains/core/decisions#^D010]].
- Cross-process readers see the log only through SQLite — [[domains/core/decisions#^D016]].
- Order is `(epoch, seq)`, assigned at commit; batching must not reorder.

## History

- 2026-09-22 migrated from the archive
