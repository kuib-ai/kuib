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
