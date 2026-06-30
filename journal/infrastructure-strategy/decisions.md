---
title: "Infrastructure Strategy"
type: vision
status: decided
layer: infrastructure
created: 2026-04-13
tags: [infrastructure, cluster, deployment, mesh, remote, trpc]
depends-on: ["[[vision]]", "[[architecture-overview]]"]
informs: ["[[security-model]]", "[[protocol-design]]", "[[consensus-model]]"]
---

# Infrastructure Strategy

## Current Decisions

**Status: Core Architecture.** The mesh is core architecture, not a deferred v1.x feature. The system is a secure mesh orchestrator for AI agents.

### Mesh Topology (3-Tier)

1. **Server/Engine**: Holds the Engine, Event Log, and Session Store. **NOT centralized** — P2P, runs on the elected leader among the user's own nodes (see [[consensus-model]]); sessions resumable from anywhere via the replicated log.
2. **Daemons**: One per **OS user** on every device (user-scoped, runs as its own user — see [[security-model]], [[multi-device-ux]]). Pure executors (fs/shell). Each is its own mesh node (`user@device`).
3. **Host**: The frontend (TUI or Web). **Attaches to** the Engine to render the log and emit events; owns nothing.

### Transport & RPC

- **tRPC (Zod-native)** is the chosen RPC for v1 — no `.proto`, the wire contract derives from the protocol's Zod schemas. proto/gRPC is a deferred future option behind the `TransportFactory`, justified only by polyglot (non-TS) daemons. See [[protocol-design]].
- **WireGuard** (or a Tailnet) forms the underlying secure tunnel connecting the Daemons, Server, and Hosts.
- The "local" case (single machine) is the **same architecture over a unix socket** instead of the network — identical contracts (`TransportFactory`/`Discovery`), collapsed to loopback. Isolation is preserved from day one (engine↔daemon stay separate processes even locally — see [[host-layer]], [[architecture-overview]]).

### Distributed Correctness

The mesh runtime's safety model (single-active-engine per session, quorum + lease + fencing, epoch'd `seq`, two-regime election, voter/mesh split, per-session leadership, partition/CAP handling, session claim/checkout) lives in **[[consensus-model]]**. The multi-device working-context UX lives in **[[multi-device-ux]]**.

### Phasing (decided 2026-06-30)

Security/hardening is deliberately **light for v1** (acknowledged, not yet built — see [[security-model]] threat model + future nsjail sandboxing).

- **v1 = single-device slice.** One machine, local daemon in-process, no mesh, no consensus, no WireGuard. Delivers agent + comprehension TUI + context control with zero distributed complexity and a contained blast radius. The protocol stays mesh-_ready_.
- **v1.x = the mesh.** Grow consensus/replication/WireGuard onto a working core, _after_ the consensus-substrate research validates a fitting embeddable library. **Do not hand-roll consensus.**
- The consensus **substrate is the gating unknown** — research pass pending (see [[consensus-model]] open questions).

### Detailed build roadmap (2026-07-01)

**Done (foundation, tsc + lint + 12 tests green):** `@kuib-ai/protocol` (Zod state + event schemas, `_version`/`(epoch,seq)`), `@kuib-ai/std` (`asyncWithError`), `@kuib-ai/env` (config bootstrap), `@kuib-ai/daemon` (tRPC executor, user-scoped, `.output()`-validated, tuple errors), `@kuib-ai/engine` (in-memory `EventLogPort`, HTTP `DaemonClient`/`TransportFactory`, orchestrator emitting events, config-driven provider). Connect/proto + hardcoded provider fully removed.

**v1 (single-device, no mesh/consensus):**

1. **Persistence** — `sqlite.event.log` behind `EventLogPort` (runtime-adaptive `node:sqlite`/`bun:sqlite`, WAL, write-behind) + **materializer** (deterministic fold → `messages` at step+tool boundaries, persistence cursor) + resume (settled snapshot ∥ unsettled tail, `(epoch,seq)`-ordered). See [[protocol-design]].
2. **Local transport + lifecycle** — unix sockets (`~/.kuib/{engine,daemon}.sock`); `TransportFactory(nodeID)`→local socket; socket-mutex idempotent spawn, self-reap-idle, spawn-by-role; `LocalOnly` `Discovery`. See [[host-layer]].
3. **The binary `apps/kuib`** — multi-role entry (`kuib`/`daemon`/`serve`/`up`); wire env→provider→engine→daemon; one `bun build --compile` target. First runnable end-to-end.
4. **Host (TUI) rewrite** — OpenTUI+Solid; subscribe to committed log, render, submit `UserMessageSubmitted`; fix host→engine boundary; nvim-flavored. See [[host-layer]].
5. **Context control** — transparency (see-before-send), per-part exclusion, discussion clustering ([[discussions-ux]], [[vision]]).
6. **Packaging** — per-platform `bun build --compile`; `kuib service install` (**join** mode only); `.env`/`~/.kuib/config`.
   → **Bootstrap milestone:** use kuib to build kuib, then hand-author the sovereign core.

**v1.x (mesh):** 7. consensus substrate research→adopt · 8. replicated log + election · 9. Headscale+DERP behind `Discovery`/`TransportFactory` · 10. CRDT config ([[distributed-mesh-state]]) + secure-storage keys · 11. Web host, nsjail hardening, managed-mesh tier.

Seams (`EventLogPort`, `Discovery`, `TransportFactory`, `ConfigStore`) mean 7–11 drop in with **zero contract changes**.

### Network Substrate & Control Plane — self-hosted Headscale + DERP (2026-07-01)

**WireGuard-vs-Tailscale question: CLOSED → self-hosted Headscale + DERP, BYO-configurable.** Reasoning from a live test of the author's tailnet (2026-07-01): cross-internet peers **bootstrap on DERP and only sometimes upgrade to direct**; under CGNAT/symmetric NAT (endemic in India) the upgrade frequently never happens → **permanent relay**. So a relay is mandatory; pure-serverless P2P does not survive real NATs.

The mesh therefore needs **two dataless server roles**:

1. **Coordinator (Headscale)** — node registration, WG key exchange, IP allocation, ACLs.
2. **DERP relay(s)** — connection bootstrap + permanent fallback when hole-punching fails.

**Control plane vs data plane split (load-bearing):** the coordinator + DERP are a **CONTROL plane — they never see chats, sessions, or API keys.** User data stays **P2P** (per-node SQLite event log; keys in user secure storage). So operating a coordinator does NOT violate the no-user-data-backend principle. The sensitive part stays distributed; only the cheap, dataless networking is centralized — exactly how Tailscale itself works.

**Per-user-daemon = its own mesh node with its own IP.** This dissolves the multi-user port-conflict: alice@desktop and bob@desktop bind the _same_ port on _distinct_ mesh IPs. You can't get reliable per-user IPs from Tailscale's account/device model — which is _why_ you own the coordinator (Headscale): you control node registration + IP allocation.

**Three hosting tiers** (the coordinator+DERP endpoint is configurable network config, in `ConfigStore`, not a secret):

- **Tier 1 — you-host** a small Headscale+DERP (dataless VPS / a public-IP node): zero-config onboarding.
- **Tier 2 — self-host**: the kuib binary wraps Headscale+DERP on a user's **public-IP** node (homelab/VPS). Fully sovereign. **Caveat: a CGNAT user can't self-host the relay** (same NAT problem) — needs a public IP.
- **Tier 3 — BYO**: point kuib at any Headscale/DERP endpoint.

`kuib service install` gets two modes: **join** (enroll this node in a coordinator) and, on a public node, **host** (run the wrapped Headscale+DERP).

**Cost reality:** relay _bandwidth_ is the cost driver, not coordination (coordination is cheap chatter; a relayed session ships all its traffic through DERP). This is what pushes to cloud at scale. Bootstrap infra = public-IP nodes (cornelius/statice) — fragile (dynamic residential IP, uptime), move to cloud when scaled. The coordinator/DERP should run **isolated** from personal data nodes (internet-exposed relay ≠ box holding sessions/keys — see [[security-model]]).

### Keep the substrate behind a contract — do NOT double down on Headscale (2026-07-01)

The network substrate is a **swappable seam**, like `EventLogPort` and `ConfigStore`. Four contracts make Headscale a late-bound impl that swaps without touching engine/host/daemon:

1. **`NodeID`** — abstract node identity (= the per-user-daemon `DeviceID`); address by NodeID, never by IP/coordinator specifics.
2. **`NodeDescriptor`** — `{ nodeID, osUser, machineID, capabilities, endpoint? }` (endpoint substrate-opaque).
3. **`Discovery`** — `listNodes(): NodeDescriptor[]`, `resolve(nodeID): Endpoint`. Impls: `LocalOnly` (v1 — self + local socket), `Headscale` (v1.x).
4. **`TransportFactory(nodeID)`** — resolves via `Discovery`, connects (unix socket local-same-user, mesh IP remote).

DERP/relay never leaks into these contracts (direct-vs-relayed is handled below the transport) — the proof the abstraction holds. Headscale is the _intended first_ `Discovery`+network impl, not a v1 commitment; if it's wrong, zero contracts change. See [[multi-device-ux]].

### Build progress + revised seams (2026-07-01)

**Done & verified (typecheck + lint clean; vitest 13, bun 7):**

- `@kuib-ai/protocol/event.log.port` — `EventLogPort` contract (moved here from engine).
- `@kuib-ai/event-log-sqlite` — `bun:sqlite` write adapter (WAL, `(epoch,seq)` PK, persist-across-reopen), Bun-quarantined, `bun test`. See [[protocol-design]].
- `@kuib-ai/engine` — orchestrator now consumes `fullStream` → emits `TEXT_DELTA` + `REASONING_DELTA` + `USER_MESSAGE_SUBMITTED`; stream errors surface as `⚠️`. Provider → `@ai-sdk/openai-compatible` (see [[provider-architecture]]).
- `apps/host-tui` — OpenTUI+Solid: `transcript` (house-style enum + entry + fold + barrel), `App` subscribes `EventLogPort` and renders, `db.path` resolver (dev `./dist/kuib.db`, prod `~/.local/share/kuib/`), entry wires env→provider→sqlite-log→daemon→`runAgent`. **Verified live end-to-end against minerva** (real stream → events → sqlite → reconstructed transcript).
- `@kuib-ai/env` — root-resolving `bootstrapEnv`, `KUIB_SESSION_ID` for resume.
- Removed stale `apps/tui` spike + ConnectRPC/buf catalog residue.

**DONE (2026-07-01, verified — typecheck + lint clean, bun 5+6+4, vitest 13):**

1. ✅ **`@kuib-ai/engine-service`** (Bun-quarantined / `kuib serve`) — separate process owning the sqlite writer + unix socket (liveness/mutex + submit) + lifecycle (survive host death, self-reap when idle+detached, single-instance). Fixes "engine dies with the TUI → appends stop." Host reads its local DB via `createSqliteReader` (poll). 5 tests green: survive-detach, reap, single-instance, resume-from-cursor, WAL concurrency. Built via an ultracode workflow + 4 adversarial-review fixes (reap accept-race, close-hang, unhandled-socket-error crash, per-epoch→rowid cursor). See [[host-layer]], [[consensus-model]].
2. ✅ **Terminal events** — `MessageCompleted`/`MessageFailed` in the protocol; orchestrator emits on success/error. See [[protocol-design]].

**Next — v1 UX phase ("all the works"):** 3. **Context assembly** — `buildMessages(log)→ModelMessage[]` so the model has memory across turns (pending; reasoning-in-context decision open). See [[protocol-design]]. 4. **Sessions** — create/list/switch; session picker (the stable `KUIB_SESSION_ID` is the seed; many sessions coexist in one db). See [[multi-device-ux]]. 5. **Discussions** — runtime include/exclude clusters, per-part exclusion, transparency (see-before-send). See [[discussions-ux]], [[vision]]. 6. **Tool calling UX** — approval flow + risk tiering surfaced in the TUI; make all three tools emit events; step-boundary visibility. Needs the daemon running. See [[security-model]], [[host-layer]]. 7. **Subagents** — `ToolCallKind.subagent` (model+tokens) rendering + nested loops. 8. **Multiple providers** — a real provider seam (`KUIB_MODEL_PROVIDER` switch / registry) beyond the single openai-compatible client. See [[provider-architecture]].

**New mesh-deferred seams (named now, built v1.x):** `ReplicationPort` (beneath `EventLogPort` — ships coarse committed entries; swappable rqlite/Raft vs LiteFS/Litestream vs witness-2-node — see [[consensus-model]]); `MeshEventLog` (host read impl = local replicated DB + remote leader subscription); live-tail fan-out to remote viewers.

## Open Questions

- Consensus substrate (the gating unknown) — see [[consensus-model]].
- Coordinator/DERP: you-hosted default vs self-host default (both shipped; which leads onboarding).
