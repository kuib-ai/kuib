---
id: R302
title: UI host attaches to serve — log reads, doorbell, submit
state: shaped
horizon: next
domains: [host, core]
depends-on: ["[[roadmap/items/R200-message-materializer-and-crash-recovery]]"]
converges-with: ["[[roadmap/items/R313-host-protocol-contract]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/host-layer/decisions#Engine lifecycle & idempotent discovery]]", "[[_archive/host-layer/decisions#Control plane vs data plane]]", "[[_archive/host-layer/decisions#How the host gets read access]]", "[[_archive/host-layer/decisions#Current Decisions]]"]
touched: 2026-09-22
---

# R302 — UI host attaches to serve — log reads, doorbell, submit

## Idea

The client half of the engine/host split, wired into the UI host role. The mechanisms mostly
exist in core; nothing in `apps/host-tui` uses them yet because the host has no UI role.

- **Discovery / spawn:** on start the UI host probes the engine socket; if live it attaches,
  otherwise it spawns the same binary with the `serve` role, detached (not `fork` — the channel
  is the socket protocol, not Node IPC; and it is the same invocation an OS service unit runs).
  `connectOrSpawn` ([[domains/core/current#^connect-or-spawn]]) and `ensureDaemon`
  ([[domains/core/current#^ensure-daemon]]) already implement probe-then-spawn.
- **Data plane:** the host reads the local SQLite log directly through the read-only
  `EventLogPort` reader (WAL, concurrent with the single writer) with
  `subscribe(sessionID, handler, afterSeq)` — replay from cursor, then live tail
  ([[domains/core/current#^sqlite-reader]]). Reads never go through the service. The read path is
  replication-invariant: in the mesh, replication fills the same local DB.
- **Control plane:** `submit({sessionID, prompt})` and `interrupt` over the socket
  ([[domains/core/current#^service-socket]]).
- **Doorbell (unbuilt):** a one-line "new events for S" tick on the socket so the reader re-reads
  immediately instead of waiting out the 150 ms poll floor. Robust by construction — a missed
  tick is caught by the next poll because the DB is the truth.
- **Attach counts as liveness:** an attached host connection keeps the service from reaping
  ([[domains/core/current#^service-lifecycle]]); detaching (closing the UI) leaves an in-flight run finishing.
  Reopen → replay from cursor → resume.

## Why

Without this the host has no way to show or drive a session; it is the precondition for
[[roadmap/items/R301-session-screen]] and the path the web viewer and other hosts reuse.

## Open questions

- Doorbell framing: a new service-message variant vs a separate notify socket.
- Remote (mesh) reads: local replicated SQLite + a live-tail subscription to the remote
  engine-service — shape depends on the mesh event-log work.

## Constraints already decided

- [[domains/host/decisions#^D001]] — the engine never runs inside a UI host.
- [[domains/core/decisions#^D016]] — control on the socket, data in SQLite.
- [[domains/core/decisions#^D017]] — socket mutex, detached spawn, idle self-reap.
- [[domains/host/decisions#^D004]] — spawn uses the same binary with a role argument.

## History

- 2026-09-22 migrated from the archive
