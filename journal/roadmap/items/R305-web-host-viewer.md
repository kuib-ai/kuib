---
id: R305
title: Web host as a pure viewer over SSE
state: shaped
horizon: later
domains: [host, core]
depends-on: ["[[roadmap/items/R302-ui-host-attach]]", "[[roadmap/items/R313-host-protocol-contract]]", "[[roadmap/items/R214-replicated-session-log]]"]
converges-with: ["[[roadmap/items/R408-web-host-auth]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/host-layer/decisions#Web host (`kuib web`) + SSE catch-up protocol (2026-07-01)]]", "[[_archive/host-layer/decisions#The catch-up / no-staleness protocol (the load-bearing part)]]", "[[_archive/host-layer/decisions#Run-liveness detection (co-viewing a TUI-started stream)]]", "[[_archive/host-layer/decisions#host-web parity gaps vs host-tui (audited 2026-07-02)]]"]
touched: 2026-09-22
---

# R305 — Web host as a pure viewer over SSE

## Idea

A browser cannot open the SQLite file or the unix socket, so the web host is not standalone: a
local `kuib` process is compulsory and the browser is a pure viewer (viewing ≠ leading). The
browser gets a `RemoteEventLog` whose `subscribe()` rides HTTP/SSE instead of SQLite; host code
shape is unchanged, only the transport differs. Later the same client can point at a mesh node.

**`kuib web`** — a long-lived process serving the web bridge. Endpoints: `POST /api/submit`,
`GET /api/events` (SSE live tail), `GET /api/events/since` (pull reconcile), `GET /api/status`
(liveness). Binds loopback + this node's tailnet IP, never `0.0.0.0`. Auth and threat model:
[[_archive/security-model/decisions]] (web host auth).

**Catch-up / no-staleness protocol** (the load-bearing part). Total order is `(epoch, seq)` and
`seq` is contiguous per session/epoch, so gaps are provable. Three overlapping layers:

1. **Live push** — SSE with `id: epoch:seq`; `EventSource` reconnects with `Last-Event-Id`, the
   server replays `afterSeq` from the durable log then rides the tail.
2. **Pull reconcile** — `/api/events/since?afterSeq` on load, `visibilitychange→visible`,
   `online`, and on detected gap. Backstop for backgrounded tabs (suspended without `onerror`),
   proxy buffering, laptop sleep.
3. **Contiguity gap-heal** — any `seq ≠ lastSeq+1` triggers reconcile from `lastSeq`.

Client applies only `key > cursor`, deduped by `(epoch, seq)`, so layers overlap freely and
converge.

**Latency:** if the bridge holds the writer event log in-process, `subscribe()` fans out
synchronously on append (zero-latency tail). When reader and writer are different processes
(detached `serve`, the mesh), the bridge is a poll reader and wants the doorbell from
[[roadmap/items/R302-ui-host-attach]] to beat the 150 ms floor.

**Run liveness when co-viewing a TUI-started stream** (one engine + one log per device ⇒ TUI and
web are co-viewers): derive from the log tail (a submit with no terminal message event, or a
trailing text delta, is in flight) plus the authoritative `activeRuns` via `/api/status`, which
covers the submit→first-token window.

**Parity rule** (the old host-web lagged the TUI because it assembled its own engine graph):
submit must go through the engine-service (turn queue + steering), daemon resolution must use
the node-identity seam, and the device badge must show. Resolution: one shared host bootstrap
(model, daemon client, event log, telemetry, submit path) consumed by every host.

## Why

Phone and other mesh devices can watch and drive a session without a terminal.

## Open questions

- Whether the bridge embeds engine + daemon in-process (the old design) or attaches to `serve`
  like the TUI — the latter matches [[domains/host/decisions#^D001]].
- Client stack for the browser view on Deno (the old Vite + Solid-DOM client was deleted).

## Constraints already decided

- [[domains/host/decisions#^D001]] — the engine runs in `serve`.
- [[domains/core/decisions#^D004]] — sequenced, origin-attributed envelope.
- [[domains/core/decisions#^D018]] — one active turn per session.
- [[domains/core/decisions#^D019]] — the transcript fold is a shared package.
- [[domains/host/decisions#^D005]] — daemons are addressed by node identity.

## History

- 2026-09-22 migrated from the archive
