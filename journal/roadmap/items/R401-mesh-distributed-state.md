---
id: R401
title: Mesh node composition and distributed state
state: idea
horizon: later
domains: [core, infra]
depends-on: ["[[roadmap/items/R400-headscale-derp-control-plane]]"]
converges-with: ["[[roadmap/items/R219-config-store-and-secret-storage]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/infrastructure-strategy/decisions#Current Decisions]]", "[[_archive/infrastructure-strategy/decisions#Mesh Topology (3-Tier)]]", "[[_archive/infrastructure-strategy/decisions#Phasing (decided 2026-06-30)]]", "[[_archive/infrastructure-strategy/decisions#Detailed build roadmap (2026-07-01)]]", "[[_archive/infrastructure-strategy/decisions#Build progress + revised seams (2026-07-01)]]", "[[_archive/infrastructure-strategy/decisions#Open Questions]]", "[[_archive/distributed-mesh-state/decisions#Context]]", "[[_archive/distributed-mesh-state/decisions#Decision]]", "[[_archive/distributed-mesh-state/decisions#Scope]]", "[[_archive/distributed-mesh-state/decisions#Consequences]]", "[[_archive/distributed-mesh-state/decisions#Implementation status — Layer 1 (node resolution seam) — DONE]]"]
touched: 2026-09-22
---

# R401 — Mesh node composition and distributed state

## Idea

kuib as a secure mesh orchestrator over the user's own devices — the mesh is core architecture,
not a bolt-on. Three tiers:

1. **Engine** — holds the engine, event log and session store. Not centralized: it runs on the
   elected leader among the user's own nodes, and sessions are resumable from anywhere via the
   replicated log.
2. **Daemons** — one per OS user on every device, each its own mesh node (`user@device`), pure
   fs/shell executors.
3. **Hosts** — TUI or web front ends that attach to the engine, render the log and emit events;
   they own nothing.

State is split into **storage classes** with different replication:

- **Config / model preferences / non-secret settings** are mergeable, so they replicate
  multi-master through a **CRDT store (Yjs)** behind the `ConfigStore` seam. A `SyncState`
  tRPC procedure on the daemon service broadcasts and merges CRDT state vectors between nodes;
  state persists on the local filesystem. Inference runs on whichever node executes the task,
  pulling config from the locally synced store (keys come from secure storage —
  [[roadmap/items/R407-os-secure-storage]]).
- **The session event log** is NOT CRDT: tool side effects are un-mergeable, so it needs
  single-active-engine + quorum + lease + fencing (consensus model, owned elsewhere).

Named mesh-deferred seams: `ReplicationPort` beneath `EventLogPort` (ships coarse committed
entries; swappable rqlite/Raft vs LiteFS/Litestream vs witness-2-node), `MeshEventLog` (host
read = local replicated DB + remote leader subscription), and live-tail fan-out to remote
viewers. The seams (`EventLogPort`, `DiscoveryPort`, transport factory, `ConfigStore`) are meant
to let consensus, replication, Headscale, CRDT config and the web host drop in with zero
contract changes.

Deferred UX from the node-resolution work: an interactive device switcher (`<leader>rd`
picker, now owned by kuib's own terminal UI library) and a device badge showing the target node.

## Why

A central server holding config and API keys is a honeypot. P2P state keeps the zero-central-
trust boundary and scales with the user's own hardware.

## Open questions

- The session-log half is [[roadmap/items/R105-replicated-session-log]] and [[roadmap/items/R214-replicated-session-log]]; this item keeps the CRDT config store and node composition.
- The consensus substrate is the gating unknown: research an embeddable library first.
  **Do not hand-roll consensus.**
- Robust CRDT sync after long offline periods; graceful handling of network edge cases in the
  sync loop.

## Constraints already decided

- Phasing: single-device first; the protocol stays mesh-ready. Daemons addressed by node
  identity: [[domains/core/decisions#^D028]].
- The daemon is always a separate process: [[domains/core/decisions#^D014]].
- Event log on SQLite behind `EventLogPort`: [[domains/core/decisions#^D010]].
- The engine runs in the serve process, never inside a UI host: [[domains/host/decisions#^D001]].

## History

- 2026-09-22 migrated from the archive
