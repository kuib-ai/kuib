---
id: R214
title: Replicated session log — leader-authored, epoch-fenced, snapshot derived per node
state: idea
horizon: maybe
domains: [core, infra]
depends-on: ["[[roadmap/items/R213-mesh-protocol-fields]]", "[[roadmap/items/R201-append-validation-and-conflicts]]", "[[roadmap/items/R400-headscale-derp-control-plane]]"]
converges-with: ["[[roadmap/items/R200-message-materializer-and-crash-recovery]]", "[[roadmap/items/R105-replicated-session-log]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Materialization & resume — runtime model + mesh (2026-06-30)]]", "[[_archive/protocol-design/decisions#SQLite backing — `bun:sqlite` now, `node:sqlite` later (LOCKED 2026-07-01, supersedes runtime-adaptive)]]", "[[_archive/protocol-design/decisions#The event log is one log = localDB + streams (2026-07-01)]]", "[[_archive/protocol-design/decisions#Mesh Architecture — Built-In, 3-Tier Model (2026-06-30)]]", "[[_archive/protocol-design/decisions#Mesh Protocol, 3-Tier Runtime in v1 (2026-06-30)]]", "[[_archive/architecture-overview/decisions#Monorepo Structure (kuib repo)]]", "[[_archive/architecture-overview/decisions#Package Dependency Flow]]"]
touched: 2026-09-22
---

# R214 — Replicated session log — leader-authored, epoch-fenced, snapshot derived per node

## Idea

The 3-tier model — engine (server), daemons on every device, thin hosts — without a central
server: the engine runs on the **elected leader** among the user's own nodes, and a replicated
log makes sessions resumable from anywhere.

- **Single active engine per session:** one leader per session log; viewing ≠ leading. Hosts
  submit to the leader, the sole writer and sequencer.
- **`(epoch, seq)` ordering:** `epoch` = leadership generation (0 forever on one machine), `seq`
  = position within it; total order is lexicographic. Survives leader handoff under quorum +
  lease + fencing.
- **Author vs replicate:** `append` computes `seq = MAX(seq)+1` in an immediate transaction —
  the authoring path, leader-only. Replication adds `applyReplicated(envelope)`, inserting the
  leader's already-assigned `(epoch, seq)`.
- **One log = local DB + streams:** `subscribe` presents the settled local rows plus an
  unsettled live tail, ordered by `(epoch, seq)`, never timestamp; commit watermark +
  provisional tail. Replicate coarse committed entries; fan out the token tail to viewers only.
  No per-event durable/ephemeral tag — event type already separates side effects from display
  deltas.
- **Replicate the log, derive the snapshot:** only the event log ships (log shipping over the
  consensus substrate). The messages snapshot (R200) is a pure deterministic fold rebuilt
  locally on each node; its cursor is per-node, not replicated. Failover is free — the new
  leader already holds the most complete log and re-materializes locally. The only distributed
  edge cases are the consensus ones on the log itself (handoff, epoch fencing).
- Transport: tRPC over WireGuard/Tailscale; proto/gRPC is a future transport option only for
  polyglot daemons. An `apps/server`-style role co-hosted on every node was the original
  packaging sketch.

## Why

Resume a session from any device, survive the leader machine going away, and keep one
unambiguous order of events across devices.

## Open questions

- Consensus substrate choice (Raft library vs lease-based leader with log shipping).
- How a host discovers the current leader for a session.

## Constraints already decided

- `EventEnvelope` already carries `epoch` and `seq`; `replay` orders by `epoch, seq` —
  [[domains/core/current#^C007]], [[domains/core/current#^C021]].
- Daemons addressed by node identity — [[domains/core/decisions#^D028]]; daemon always a
  separate process — [[domains/core/decisions#^D014]].
- Zod-first protocol; proto only as a later transport — [[domains/core/decisions#^D001]].

## History

- 2026-09-22 migrated from the archive
