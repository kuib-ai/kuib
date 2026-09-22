---
id: R105
title: Multi-device sessions — replicated event log with coordinator-lease leadership
state: shaped
horizon: later
domains: [core, infra]
depends-on: ["[[roadmap/items/R400-headscale-derp-control-plane]]"]
converges-with: ["[[roadmap/items/R214-replicated-session-log]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/consensus-model/decisions#Frame]]", "[[_archive/consensus-model/decisions#Core invariant: single active engine per session]]", "[[_archive/consensus-model/decisions#viewing ≠ leading]]", "[[_archive/consensus-model/decisions#Split-brain: where the boundary actually is]]", "[[_archive/consensus-model/decisions#The safety mechanism: quorum + lease + fencing]]", "[[_archive/consensus-model/decisions#Quorum makes the log unforkable]]", "[[_archive/consensus-model/decisions#Lease + fencing closes the zombie window]]", "[[_archive/consensus-model/decisions#Risk-gated freshness check]]", "[[_archive/consensus-model/decisions#Failover: new leader must have the latest log]]", "[[_archive/consensus-model/decisions#The two-regime model (quorum vs small mesh)]]", "[[_archive/consensus-model/decisions#Voters ≠ mesh (critical)]]", "[[_archive/consensus-model/decisions#Consensus is per-session, scoped — not one global group]]", "[[_archive/consensus-model/decisions#Session anchoring & the café case]]", "[[_archive/consensus-model/decisions#Honest status]]", "[[_archive/consensus-model/decisions#Replication is COPY, not merge (2026-07-01)]]", "[[_archive/consensus-model/decisions#When election starts + how the zombie is handled (2026-07-01)]]", "[[_archive/consensus-model/decisions#Unified event-log model — one log, two regions, one interface (2026-07-01)]]", "[[_archive/consensus-model/decisions#Commit watermark + provisional tail (the resume/edge-case rule)]]", "[[_archive/consensus-model/decisions#Author vs replicate — why a follower persisting the tail is NOT write access / NOT split-brain]]", "[[_archive/consensus-model/decisions#Replication granularity — do NOT push tokens through consensus (correction)]]", "[[_archive/consensus-model/decisions#Whose job is it to sync SQLite]]", "[[_archive/consensus-model/decisions#Substrate spectrum (so we don't over-commit to Raft) + 2-node]]", "[[_archive/consensus-model/decisions#Research grounding (2026-07-01)]]", "[[_archive/consensus-model/decisions#RESOLVED: coordinator-as-lease-authority (2026-07-01, author-agreed)]]", "[[_archive/consensus-model/decisions#Open Questions]]", "[[_archive/vision/decisions#Repo structure (2026-07-01)]]"]
touched: 2026-09-22
---

# R105 — Multi-device sessions — replicated event log with coordinator-lease leadership

## Idea

A session's event log is replicated across the user's own devices with no hosted backend; any
device can view and drive any session. This is the load-bearing, highest-risk subsystem of the
mesh. Scope is the **session event log** only — mergeable config/preferences/keys are a
separate CRDT store, where multi-master is correct.

**Core invariant: one active engine per session log.** The agent loop is sequential and real
side effects do not merge (two `rm -rf` on two disks cannot be reconciled), so the primitive is
replicated log + single active engine per session + explicit leadership handoff — never
multi-writer CRDT. Leadership is **per session log**, not global: two nodes leading different
sessions is normal parallelism. A single-device session's owner is trivially leader, with no
election.

**Viewing ≠ leading.** A host submits user events to the leader and subscribes to its committed
broadcast; opening a session on a second device never triggers an election. User events from
several devices merge by funnelling to the one leader, which serializes them.

**Split-brain boundary.** It needs all three at once: a replicated session, a leadership
transition, and an old leader that is alive-but-unreachable (sleep is the textbook case). A
cleanly dead leader is safe.

**Leadership: coordinator as lease authority (resolved 2026-07-01).** The always-present mesh
coordinator (Headscale, mandatory for any mesh — it registers nodes and allocates IPs) holds a
per-session lease record `{ sessionID, epoch, leaderID, expiry }` acquired by compare-and-swap.
It serializes → exactly one leader per epoch with no peer quorum. This dissolves the N=2
problem: 1 device = no consensus (`epoch=0`); ≥2 devices = coordinator arbitrates; the
coordinator *is* the witness. It holds only a leadership pointer — no session data or keys — so
the dataless coordinator invariant holds. If the coordinator itself is unreachable, block
automatic failover and ask the user ("node 1 unreachable 90s — promote node 2? it has the log
to seq X [y/N]"). Peer Raft (rqlite/dqlite/LiteFS) stays an optional substrate only for users
with 3+ always-on voters. (Superseded framing, kept as rationale: majority quorum among a small
stable voter set, voters ≠ mesh because personal devices sleep, and a witness or human
tiebreak at 2 voters.)

**Safety guards against a zombie leader executing:**

1. Single arbiter (coordinator CAS, or majority quorum where peer Raft is used) → ≤1 leader per epoch.
2. **Fencing** — every append carries the epoch; stale-epoch appends are rejected.
3. **Lease + quiescent gap** — the leader renews a time-bounded lease; it stops dispatching the
   instant the lease lapses, even unreachable (self-fencing watchdog, software STONITH); a new
   leader waits out the old lease before acting.
4. **Risk-gated freshness check** — destructive tools (operation × target risk tier) re-verify
   the lease immediately before dispatch; harmless reads skip it.

Election is failure-triggered (heartbeat + randomized election timeout), never on attach.
Failover must pick a node holding the most complete log — select the longest valid
`(epoch, seq)` log, never merge; election priority among up-to-date candidates is
stability class (homelab > desktop > laptop > phone), then capability, then user designation.
Leadership is sticky: no automatic failback.

**Replication is COPY, not merge.** The leader appends, then ships committed entries in
`(epoch, seq)` order; replicas append the same entries idempotently (`PRIMARY KEY(sessionID,
epoch, seq)`) so logs are byte-identical by replay. Catch-up is "I have up to (0,17), send
(0,18…]". The folded `messages` snapshot is local per node and not replicated.

**One log, two regions, one interface.** Settled region `[0 … lastCommitted]` is durable and
replicated; the unsettled tail is the live edge streamed to attached viewers. A commit
**watermark** advances at coarse boundaries (step / message / tool end). The provisional tail
may be persisted but can be truncated on leadership change (Raft follower reconciliation).
`EventLogPort.subscribe(sessionID, handler, afterSeq)` presents both regions as one stream;
`LocalEventLog` (today) and a future `MeshEventLog` (settled = local replicated SQLite, tail =
subscription to the remote leader) implement it, so host code is unchanged. Resume always
subscribes from the persisted cursor, never from head.

**Author vs replicate.** `append(sessionID, deviceID, event)` assigns a new `(epoch, seq)` and
is leader-only; a future `applyReplicated(envelope)` idempotently inserts an already-sequenced
envelope and is allowed anywhere. Hosts may store, never author.

**Granularity.** Consensus/replication carries coarse committed operations (submissions, tool
side effects, `MessageCompleted`, checkpoints); token deltas fan out point-to-point to attached
viewers and never go through consensus. No per-event durable/ephemeral tag: the watermark plus
event type decide what ships.

**Who syncs.** A dedicated `ReplicationPort` beneath `EventLogPort`, not the agent loop or the
host. Substrate spectrum kept swappable: rqlite/dqlite (Raft), LiteFS (single writer,
leader election), Litestream (async WAL shipping, manual failover). Two-node without a
coordinator: witness, or primary-backup + human-confirmed failover.

**Session anchoring (café case).** Local work always works. A home-anchored session with home
unreachable is unreachable by physics, not quorum. Mitigation: **claim/checkout** a session onto
the laptop while connected (clean handoff), work offline, sync back. Hijacking from the minority
side is exactly what the protections forbid.

Research grounding: WAL allows unlimited readers + one writer; `sqlite3_update_hook` is
in-process only, so cross-process liveness is poll + optional socket doorbell; SQLite as the
durable event backbone is the proven pattern for local agent orchestration.

## Why

"Any device reaches every chat" without a hosted backend, while never letting two engines run
destructive tools for the same session. Do **not** hand-roll consensus — spend the sovereignty
budget on the domain; ship the single-device slice first.

## Open questions

- Replicated log storage: hand-rolled epoch-fenced append log over tRPC vs an embedded
  replicated store (NATS JetStream / Kafka rejected — datacenter quorum misfit).
- Coordinator lease store: extend the wrapped Headscale service vs a small sidecar; the CAS API.
- Failback policy details (explicit or idle-triggered only).
- Whether any embeddable library fits: 2–10 node sleepy trusted mesh, CP, lease + fencing,
  weighted election, TS-embeddable.

## Constraints already decided

- The envelope already carries `(epoch, seq)`; total order is `(epoch, seq)`, never timestamp: [[domains/core/decisions#^D004]], [[domains/core/current#^C007]].
- SQLite log keyed `(sessionID, epoch, seq)` in WAL mode; single-device append uses epoch 0: [[domains/core/current#^C020]], [[domains/core/current#^C021]].
- `subscribe` with `afterSeq` replays then goes live: [[domains/core/current#^C019]].
- Control plane on the socket, data plane in SQLite: [[domains/core/decisions#^D016]].
- The engine runs only in `serve`, the single writer; UI hosts are attachable clients: [[domains/host/decisions#^D001]].
- Daemons are addressed by node identity through a discovery port: [[domains/core/decisions#^D028]].

## History

- 2026-09-22 migrated from the archive
