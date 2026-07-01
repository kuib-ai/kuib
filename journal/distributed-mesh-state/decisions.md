---
title: Distributed P2P Mesh State Architecture
type: implementation
layer: architecture
status: decided
created: 2026-06-30
tags: [mesh, tailscale, crdt, yjs, zero-trust]
depends-on: []
informs: []
---

## Context

We need a secure, distributed way to store user configuration, AI model preferences, and API keys across multiple devices in a Tailscale mesh network without relying on a central server. A central server poses a major security liability and acts as a honeypot for sensitive API keys.

## Decision

We will adopt a Peer-to-Peer (P2P) Distributed Mesh architecture using CRDTs (Conflict-free Replicated Data Types) such as Yjs.
The `kuib` daemon will act as a Local-First Server across all user devices.

- **Discovery**: via the `Discovery` contract (v1.x: the Headscale coordinator is the node registry — see [[infrastructure-strategy]], [[multi-device-ux]]), not the raw `tailscale` CLI.
- **State Sync**: A `SyncState` **tRPC** endpoint on the `DaemonService` will broadcast and merge CRDT state vectors between nodes. The state is persisted locally on the filesystem.
- **Inference Execution**: LLM inference requests will be made locally from whichever node is executing the task, pulling API keys and configuration dynamically from the locally synchronized CRDT store.

## Scope

This entry covers **config / model preferences / API-key** state only — mergeable, so CRDT (Yjs) multi-master is _correct_ here. The **session event log** is a different state class (un-mergeable tool side effects) handled by [[consensus-model]] via single-active-engine + quorum + lease — explicitly NOT CRDT. RPC aligns to **tRPC** (see [[protocol-design]]); the `SyncState` endpoint rides the same transport.

## Consequences

- **Positive**: Zero central trust boundary. API keys never leave the user's trusted Tailnet. The system scales horizontally with the user's own hardware without managing infrastructure.
- **Negative**: Requires robust CRDT integration, ensuring eventual consistency when nodes reconnect after periods of offline usage. Network edge cases must be handled gracefully in the sync loop.

## Implementation status — Layer 1 (node resolution seam) — DONE

Built the composable seam so an engine addresses a daemon by **node identity**, not a raw URL. Headscale/CRDT deliberately deferred; nothing above the `DiscoveryPort` changes when they arrive.

**Layer 0 — transport (prior):** `Protocol.Endpoint` (unix|tcp discriminated union), dual-bind daemon (`createDaemonServer(socketPath, port?)` — TCP `listen(port)` binds all interfaces, reachable on the tailscale IP), and `Engine.DaemonClient.createDaemonClient(endpoint)`.

**Layer 1 — node resolution (this change):**

- `protocol`: `ID.NodeID` (branded), `Node.NodeDescriptor` (Zod-first, the full contract shape `{ nodeID, osUser, machineID, capabilities (default []), endpoint?: AnyEndpoint }` — matches [[multi-device-ux]] / [[infrastructure-strategy]]; `endpoint` optional because a discovered node may be known before its transport is), `DiscoveryPort` (behavioral TS interface — `listNodes(): Promise<NodeDescriptor[]>` + `resolve(nodeID): Promise<NodeDescriptor>`; named `DiscoveryPort` for consistency with `EventLogPort`/`FileSystemPort`; `resolve` returns the descriptor, not a bare `Endpoint`; subpath-imported like the other `*.port` contracts).
- `engine/mesh`: `MeshConfig` (Zod), `loadMeshConfig(path)` (reads TOML via `Bun.TOML.parse`, validates, returns descriptors — empty if file absent), `createStaticDiscovery(descriptors)`, `createLocalOnlyDiscovery(self: NodeDescriptor)`, `createTransportFactory(discovery) → (nodeID) → Promise<DaemonClient>` (throws if the resolved descriptor has no `endpoint`).
- `env`: `resolveMeshConfigPath` (`$XDG_CONFIG_HOME/kuib/mesh.config.toml`, override `KUIB_MESH_CONFIG`), `resolveNodeLabel` (`user@hostname`), new env keys `KUIB_NODE_LABEL`, `KUIB_MESH_CONFIG`, `KUIB_TARGET_NODE`.
- `host-tui`: `resolve.daemon.client` selects transport — if `KUIB_TARGET_NODE` is set and ≠ local label, resolve it through `StaticDiscovery` → TCP client; otherwise fall back to the local unix daemon (auto-spawn, unchanged). A top-right **device badge** shows the target (or local) label.

**Switching (current, env-routed):** `mesh.config.toml` (identical on every device) maps each `nodeID` → its tailscale-IP TCP endpoint. On a device, `KUIB_TARGET_NODE=rs10@minerva` points the local engine's file tools at minerva's daemon over the tailnet — the remote-execution "money shot." The interactive `<leader>rd` picker is deferred (will use `@opentui/keymap` + a `DialogSelect`-style overlay, per the opencode study).

**Deferred → next:** Headscale-backed `DiscoveryPort` (dynamic registry replacing the static TOML), CRDT config/key `SyncState`, and the `@opentui/keymap` device switcher.
