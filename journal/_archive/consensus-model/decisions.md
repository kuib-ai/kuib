---
title: "Consensus & Distributed Runtime"
type: implementation
status: in-progress
layer: architecture
created: 2026-06-30
tags:
  [
    consensus,
    mesh,
    raft,
    quorum,
    lease,
    fencing,
    leader-election,
    local-first,
    p2p,
  ]
depends-on:
  ["[[infrastructure-strategy]]", "[[protocol-design]]", "[[security-model]]"]
informs: ["[[multi-device-ux]]", "[[host-layer]]"]
---

# Consensus & Distributed Runtime

How the local-first P2P mesh stays correct. This is the load-bearing, highest-risk subsystem. The model below was reasoned out from first principles (session 2026-06-30); the **implementation substrate is NOT yet chosen** — see Open Questions.

## Frame

No hosted backend. Every node co-hosts the "server" P2P. Sessions + event logs are replicated across the user's own devices. A session survives as long as a quorum of its voter-set is alive. Keys live only in the user's secure storage, never elsewhere. Any device can reach every chat in the mesh.

**Scope vs [[distributed-mesh-state]] (important):** that entry covers **CRDT (Yjs) sync of config / model preferences / API keys** — mergeable, last-write-wins-ish state where multi-master CRDT is _correct_. THIS entry covers the **session event log**, where CRDT is _wrong_ because tool side effects (`rm -rf`) don't merge — hence single-active-engine + quorum + lease. Two different state classes, complementary, not competing.

## Core invariant: single active engine per session

You never want two engines driving one session's agent loop. Two reasons it must be single-writer:

1. The agent loop is inherently sequential (one LLM call at a time per session).
2. **Real-world side effects do not merge.** You can CRDT-merge two event logs; you cannot merge two `rm -rf` that already ran on two real disks. The filesystem/shell is un-mergeable shared state.

So the primitive is **replicated log + single active engine per session + explicit leadership handoff** — NOT multi-master CRDT. (Multi-writer CRDT was rejected: it would force throwing out the monotonic `seq` and offers no benefit, since concurrency is undesirable here.)

User-action events (phone + desktop both emitting `User*`) still merge conflict-free by funnelling to the one leader, which serializes them (`protocol-design` serial sequencer + `originDeviceID`).

## "One leader" is per-session-LOG, not global

The invariant is **one leader per session-log**, never one leader for the whole system. Split-brain = two nodes writing the **same** log. Two nodes leading **different** sessions is just normal parallelism (git analogy: two repos with two HEADs is fine; two authoritative copies of the _same_ repo diverging is the catastrophe).

- **Single-device session** (the common case): the device that owns it is the leader trivially — no election, no consensus machinery.
- **Replicated session**: that session's replica-set runs an election → exactly one leader for that log.

## viewing ≠ leading

A Host (TUI) is a **client**: it _submits_ user events to the leader and _subscribes_ to the leader's committed broadcast. It is not a writer. Opening the same session on a second device does **not** trigger an election — both TUIs submit to the one leader, which serializes and broadcasts to both; both frontends stay in sync because they're downstream of one committed log. Re-election is triggered by **leader death**, never by a viewer joining.

## Split-brain: where the boundary actually is

Split-brain requires ALL THREE at once:

1. a **replicated** session (single-node can't split-brain),
2. a **leadership transition**, and
3. the old leader **alive-but-unreachable** (partition / zombie) — NOT cleanly dead.

A cleanly powered-off leader is **safe** (it does nothing). The danger is "looks down but is secretly alive." **Sleep is the textbook case.** So the risk surface is narrow: replicated session + failover + zombie leader. Everywhere else (single-node sessions, clean shutdowns, normal operation) there is zero split-brain risk.

## The safety mechanism: quorum + lease + fencing

### Quorum makes the log unforkable

A node may only become leader if it wins a **majority** of the session's voter-set. Two majorities of an N-set must overlap in ≥1 node (pigeonhole), and that node won't vote for two leaders in one epoch → **at most one leader per epoch, ever.** Under partition, the minority side **cannot** elect (no majority) → it refuses to act. It never has to determine "are they dead or just unreachable" (provably indistinguishable) — it just declines because it lacks majority. This is the **CP choice** (consistency over availability), which is **mandatory** for a tool that runs destructive commands.

### Lease + fencing closes the zombie window

Quorum protects the **log**, not the **filesystem**. A deposed-but-unaware leader could still fire one stale `rm -rf` before realizing it lost. So:

- The active leader holds a **time-bounded lease** it must renew (renewal requires majority contact).
- Every leadership acquisition carries a monotonically increasing **fencing token = epoch**. Storage rejects any append with a stale epoch — the zombie's writes are fenced out.
- **A leader must stop acting the instant its lease lapses** (even if it can't reach anyone). The new leader may not be elected until the old lease provably expires → a quiescent gap where neither acts.
- Sleep handling falls out: a sleeping leader can't renew → lease expires → others elect → on wake it sees a dead lease → steps down to follower, re-syncs.

### `seq` becomes `(epoch, seq)`

`EventEnvelope.seq` (`protocol-design`) extends to **`(epoch, seq)`** — epoch = leadership generation, seq = position within it. Total order is lexicographic. Single-machine case is `epoch=0` forever. This survives leader handoff (new leader continues from last replicated event); it would NOT survive multi-master — concrete evidence the single-active model is right.

### Risk-gated freshness check

Only high-risk tools (operation × target, see [[security-model]]) need a pre-action lease-freshness check before dispatch. A double-`ls` is harmless; you pay the check only on destructive ops — exactly where the security tiering already focuses.

## Failover: new leader must have the latest log

A new leader MUST hold the most-complete log (Raft safety rule) — electing a node missing committed entries silently loses data. There is **no "merge"** in a single-writer model: the new leader **selects the longest valid log** (highest `(epoch, seq)`) and adopts it. If you ever genuinely needed to merge divergent logs, it would mean two leaders wrote concurrently = the lock failed = a bug, not a feature.

**Election priority** (decided): among candidates with the up-to-date log, prefer by **stability/uptime class** (homelab > desktop > laptop > phone), then capability, then user-designated. Priority breaks ties; it **never** overrides log-completeness. Leadership is **sticky** — no automatic failback (don't yank leadership back to a returning "preferred" node mid-flight; it causes churn and an extra risky transition).

## The two-regime model (quorum vs small mesh)

Quorum is correct for 3+ voters and **impossible** for 2 (majority of 2 is 2 → one dies → no failover). A 2-node mesh cannot distinguish death from partition, so **safe automatic failover at 2 nodes is a theorem-level impossibility** without a third vote.

- **≥3 voters**: real election with majority quorum. Automatic, safe failover. Tolerates ⌊(N−1)/2⌋ failures (5 voters tolerate 2; lose 3 → halts _safe_, pauses, resumes when a voter returns). Always odd voter counts.
- **1–2 voters**: no real consensus. 1 voter = trivially leader, zero overhead. 2 voters = **designated primary + a third vote**: a **witness** (a cheap always-on voter that holds no engine — phone/Pi/router) OR **human-confirmed takeover** ("node 1 unreachable 90s — promote node 2? it has the log to seq X [y/N]"). The human supplies the tiebreak with out-of-band knowledge.

## Voters ≠ mesh (critical)

Do NOT make every device a voter. Personal devices are mostly _asleep_ (unlike datacenter servers), so "majority of all my devices online" would constantly halt the system. Separate the roles:

- **Voters / log-replicas**: a small, stable set (your always-on box(es)) — 1–3.
- **Daemons + hosts**: every device, execute tools / render UI, connect to the voter-core but **don't vote.**

A sleeping laptop/phone (non-voter) doesn't touch quorum. "Keeps running unless ALL devices die" (the wish) is availability-maximal and unsafe; the achievable, safe version is **"keeps running while the stable voter-core holds a majority"** — made to _feel_ like the wish by keeping the voter-core on always-on hardware.

## Consensus is per-session, scoped — not one global group

Consensus is scoped to each session's replica-set, not a global 5-node group. Implementation likely shares one coordination/membership layer per voter-set that hands out **per-session leases** (one Raft group manages many keys), so leadership is logically per-session but the machinery is unified — no fragmentation.

## Session anchoring & the café case

A session is anchored where its work lives. At a café (minority side, partitioned from home):

- **Local work** → laptop is its own leader → fully usable, always.
- **Home-anchored session you didn't bring, home unreachable** → genuinely unreachable, but because the _data is behind a dead link_ (physics, not quorum). A cloud server would fix this — but that's the backend/trust cost deliberately rejected. The price of "always yours" is "only as reachable as your own devices."
- **Mitigation: claim / checkout** a session onto your laptop while still connected (clean leadership handoff, git-like) → work offline against the local replica → sync back on return. What you cannot safely do: hijack a home-anchored session from the minority side (that prohibition IS the split-brain protection working).

## Honest status

- The conceptual model is coherent and (we believe) correct.
- **The substrate is unvalidated.** We have not confirmed an embeddable library exists fitting the constraints (2–10 node sleepy trusted mesh, partition-safe/CP, lease+fencing, weighted/preferred election, tolerable small-N + witness, TS/Node-embeddable, no datacenter quorum assumptions).
- **Do NOT hand-roll consensus.** It is the canonical "experts ship subtle data-corrupting bugs" domain, and we run `rm -rf`. Spend the sovereignty budget on the domain (comprehension, agent loop, context control), not on re-deriving Raft.
- This subsystem is **years-class** at full fidelity. Strong recommendation: ship the **single-device slice first** ([[infrastructure-strategy]] phasing) — most of the value, zero consensus complexity, contained blast radius — and grow the mesh as v1.x onto a real core. The protocol is already mesh-_ready_; deferring the mesh _implementation_ loses no foresight.

## Replication is COPY, not merge (2026-07-01)

SQLite never "merges" across nodes — that would reintroduce the un-mergeable-side-effect bug. **Single writer + ordered append-only replication:** the leader appends to its `events` table, ships the entries in `(epoch, seq)` order, replicas append the **same entries in the same order** → every replica's log is **byte-identical by deterministic replay, not merge.** Catch-up: a behind node says "I have up to `(0,17)`," gets `(0,18…]`, appends (Raft `AppendEntries`). The `messages` snapshot is **not replicated** — folded locally per node. The thing that _does_ merge (config/prefs) is the **CRDT**, a different store ([[distributed-mesh-state]]), never SQLite.

## When election starts + how the zombie is handled (2026-07-01)

**Election is failure-triggered, not continuous.** The leader sends heartbeats + renews its lease; each follower runs an **election timeout**. Heartbeat in time → no election. Timeout with no heartbeat → that follower candidates → election starts (randomized timeouts prevent simultaneous candidacy). It does NOT start on host/viewer attach (viewing ≠ leading), and there is **no election at all on a single-device node**.

**"A remote engine picked up the log and executed" is _prevented_, not merely handled** — four interlocking guards:

1. **Quorum** — B can lead only by winning a majority; a partitioned A is in the minority → can't lead. Two majorities overlap (pigeonhole) → ≤1 legitimate leader per epoch.
2. **Fencing (epoch)** — every append carries the epoch; replicas reject stale-epoch writes. A (epoch 1) can't extend the log once B is elected (epoch 2).
3. **Lease + quiescent gap** (protects the _side effect_): A must renew via majority contact; partitioned → lease expires → **A self-stops dispatching the instant the lease lapses**, even unreachable. B **waits out A's lease** before acting → a gap where neither dispatches → no overlap.
4. **Risk-gated freshness check** — destructive tools re-verify "do I still hold a fresh lease?" immediately before dispatch.

So B can execute only after winning quorum (⇒ A lost it and self-stopped) AND A's lease provably expired. They never overlap. The dumb daemon won't dedupe a double-dispatch — which is _why_ these guards live in the engine layer ([[host-layer]] daemon boundary).

**v1 needs NONE of this** — single device, one engine, no election/quorum/lease/fencing. Entirely v1.x; v1 only keeps the `(epoch, seq)` field so the log format never changes.

## Unified event-log model — one log, two regions, one interface (2026-07-01)

Resolved a long design thread on how streaming, persistence, resume, and the mesh relate. The clean model (supersedes any "two channels" framing):

**The event log is the single, ordered, append-only sequence of all events for a session, keyed by `(epoch, seq)` — the one source of truth.** Everything (transcript render, resume, mesh) builds from this one logical log. It has **two regions, not two logs**:

- **Settled region** `[0 … lastCommitted]` — durable, persisted to local SQLite, replicated across nodes. History.
- **Unsettled tail** `(lastCommitted … head]` — the live edge the leader is producing now; streamed to attached viewers; not yet committed/replicated.

`EventLogPort.subscribe(sessionID, handler, afterSeq)` presents **both regions as one continuous ordered stream** — replay the settled part from `afterSeq`, then ride the live tail. Whether an event arrives from the local DB or a live stream is an **implementation detail the port hides.** So **"event log = localDB + streams"** behind one interface, with locality-specific impls:

- **`LocalEventLog`** (single-device, now): settled = local SQLite; live tail = local in-process / socket doorbell. Host reads the local DB directly.
- **`MeshEventLog`** (remote, later): settled = local _replicated_ SQLite; live tail = a **subscription to the remote leader's engine-service**. Same `subscribe`, host code unchanged.

### `(epoch, seq)` solves consistency; order by it, never timestamp

Because the **single leader assigns `(epoch, seq)`**, any node receiving an event — via live stream OR replication — appends it at its sequenced position. With `PRIMARY KEY(sessionID, epoch, seq)` the append is **idempotent + deterministic**: re-delivery is a no-op, order is total, every receiver converges to the same log **automatically**. Streaming and persistence are the _same sequenced events_; "streamed things settle into the DB" is literally true. **`createdAt` is display-only** — wall clocks skew across mesh devices, so the canonical total order is `(epoch, seq)`, never timestamp.

### Commit watermark + provisional tail (the resume/edge-case rule)

"Committed/durable" is a **watermark** over the one log, not a per-event class. The watermark advances at **coarse boundaries** (step / message / tool end) to keep consensus cheap.

- **Settled prefix** (`≤ lastCommitted`) — permanent; never truncated (Raft safety: on a majority ⇒ every future leader has it).
- **Tail above the watermark** — **provisional**: persist it freely (fast resume + live display), but a leadership change can **truncate/overwrite** it (standard Raft follower log-reconciliation: a follower truncates its uncommitted suffix on conflict, then re-syncs).
- **Resume has no gap** — a returning host subscribes **from its persisted cursor** (`afterSeq = lastSeqInLocalDB`), and the **leader's durable log** replays `[cursor+1 … head]` then goes live. Missing a region only happens if you subscribe "from now/head" instead of from your cursor — which we never do. So persisting the tail is an _optimization_, not required to avoid gaps.

### Author vs replicate — why a follower persisting the tail is NOT write access / NOT split-brain

Two distinct "writes," never to be conflated:

- **Authoring** — assign a _new_ `(epoch, seq)` and create a new authoritative entry. **Leader only** (single-writer). API: `append(sessionID, deviceID, event)` (computes next seq).
- **Local-copy write** — `INSERT` an _already-sequenced_ envelope received from the leader into your own SQLite. **Any replica/host.** API: `applyReplicated(envelope)` / idempotent insert of a given envelope.

A host/follower appending received entries is the **second** kind — replication into its own cache (like `git fetch` writing objects it didn't author, or a read-replica applying the primary's writes). It is **not** split-brain because the host **never invents `(epoch, seq)`** — split-brain needs _two authors_ at the same position, and there is still exactly one author (the leader). The API split (`append` = leader-only authoring vs `applyReplicated` = anyone) makes "host can store, host cannot author" explicit in the type system.

### Replication granularity — do NOT push tokens through consensus (correction)

Validated against rqlite/Raft: **the replicated log holds committed _operations_, not the token stream.** rqlite's Raft log stores "committed SQLite commands"; SQLite is the **state machine** that applies them. Each entry is a quorum round-trip — untenable per-token over DERP (100ms+ relayed links). So:

- **Replicate to all nodes** = the **coarse committed entries** (submissions, tool side-effects, `MessageCompleted`, checkpoints) — a handful per turn. Fills every node's local SQLite.
- **Fan out to attached viewers** = the **live token tail** (`TextDelta`/`ReasoningDelta`/`ToolCallOutputDelta`) — point-to-point, ephemeral, regenerable, **never consensus**.

**Realtime on every attached device is achievable with no tradeoff:** the leader fans the live tail to _all attached hosts_ (local socket + remote subscriptions). "Broadcast tokens" = to the few humans watching, NOT to every (sleeping) node's disk via quorum. A viewer that detaches loses nothing durable — the final message is the committed fact; on reattach it replays settled + re-streams the in-flight tail.

**No per-event durable/ephemeral _tag_ needed:** "committed" is the watermark (infra), and event **type** already distinguishes side-effects (`ToolCallCompleted`) from display deltas (`TextDelta`). The replication layer ships by class-derived-from-type; the log itself stays untagged. (Supersedes the earlier idea of stamping each event durable-vs-ephemeral.)

### Whose job is it to sync SQLite

A **dedicated replication/consensus layer** (à la rqlite's Raft layer) — a future `ReplicationPort` beneath `EventLogPort` — **not** the engine's agent loop and **not** the host. The engine emits committed operations; replication copies them; each node's SQLite is the **state machine**. A remote (leader) engine appends to **its own local log**; replication ships those committed entries to followers' local logs. Engine and host stay oblivious; both just speak `EventLogPort`.

### Substrate spectrum (so we don't over-commit to Raft) + 2-node

SQLite replication isn't one thing — `ReplicationPort` keeps it swappable like `Discovery`/`TransportFactory`:

- **rqlite / dqlite** — Raft, strong, odd node counts (3,5,7), auto-failover.
- **LiteFS** — FUSE, single-writer/multi-reader, leader election, transparent local reads.
- **Litestream** — async WAL-shipping, eventually consistent, manual failover.

**2-node ("custom consensus"):** Raft needs a majority — 2 can't form one (one dies → halt). Two options (both already noted, now research-confirmed): **(a)** add a cheap **witness/arbiter** (phone/Pi/router) → a genuine 3-member quorum for the _committed_ plane; **(b)** **primary-backup with async WAL-shipping + human-confirmed failover.** The **token stream is unaffected** either way (point-to-point, no quorum). So 2-node consensus governs only the coarse committed plane.

### Research grounding (2026-07-01)

- **WAL = unlimited readers + one writer concurrently** (readers don't block the writer, see a consistent snapshot) → host-reads-local-DB while the engine-service writes is safe by design.
- **`sqlite3_update_hook` is in-process only** — no cross-process change notification → cross-process liveness needs **poll + optional socket doorbell** ("notify, then read from store").
- **SQLite-as-durable-event-backbone is the proven pattern for local AI-agent orchestration** (goqite/sqliteq; "the queue is the backbone, everything else optional"). Polling cost is ~μs; the LLM call is the bottleneck.
- **rqlite/dqlite vs LiteFS vs Litestream** map the consensus↔async spectrum above.

## RESOLVED: coordinator-as-lease-authority (2026-07-01, author-agreed)

Leadership is arbitrated by the **always-present coordinator**, NOT by peer-majority Raft.

**Load-bearing architectural invariant:** the architecture _guarantees_ a Headscale coordinator for any mesh — it is **mandatory, not optional** (it's what registers nodes and allocates the per-user mesh IPs; see [[infrastructure-strategy]] "per-user-daemon = its own mesh node with its own IP"). Ensuring a coordinator always exists is the architecture's responsibility (self-hosted / you-host / BYO tiers all provide one). So the lease authority is **always provisioned and structurally present** — there is never a bare 2-party tie. **Existence ≠ reachability:** a guaranteed coordinator can still be _transiently unreachable_ under partition; that degraded case is the human-confirm fallback below, not a missing coordinator.

- **Mechanism:** per-session leadership = a **lease record on the coordinator** `{ sessionID, epoch, leaderID, expiry }`, acquired by **compare-and-swap**. The coordinator serializes → exactly one leader per epoch, no peer quorum round-trips. This is the WSFC Cloud-Witness / Spanner vote-only-witness pattern generalized to all N.
- **Dissolves the N=2 problem** and collapses the two-regime model: **1 device** = single-device, no consensus (coordinator irrelevant, `epoch=0`); **≥2 devices** = coordinator + devices, coordinator arbitrates. There is **no separate "witness" concept** — the coordinator _is_ the witness, by construction. (Supersedes the "1–2 voters / witness / weighted-quorum" framing above.)
- **Fencing** = the existing `(epoch, seq)` token; storage rejects stale-epoch appends. **Self-fencing watchdog:** a leader whose lease lapses (or that loses coordinator contact) **stops dispatching before** the new leader's takeover window — software STONITH on consumer hardware with no IPMI.
- **Human-confirm fallback** now applies only to the **coordinator-itself-unreachable** double fault (not to N=2): block auto-failover, prompt the user (who has out-of-band truth). Coordinator holds only a leadership _pointer_ (epoch/leaderID/expiry) — no session data or keys, so the dataless/no-honeypot invariant holds ([[security-model]]).
- **Substrate question resolved for small meshes:** no embedded peer-Raft is needed — leadership is CAS-on-coordinator, durability is point-to-point ordered log-shipping (COPY-not-merge, above). Peer-Raft (rqlite/dqlite/LiteFS) stays an _optional_ substrate behind `ReplicationPort` only for users with **3+ always-on voters**.
- **Tradeoff (accepted):** leadership _changes_ depend on coordinator reachability (a soft SPOF for _failover_, not steady-state — a healthy leader rides its unexpired lease through blips); coordinator-absent degrades to human-confirm. We already run the dataless coordinator, so this adds no new trust boundary.
- **v1 uses none of this** (single device, `epoch=0`); coordinator-lease + self-fence land in **v1.x**, behind the unchanged `TransportFactory`/`Discovery`/`ReplicationPort` seams.

## Open Questions

- Replicated **log storage** mechanism (hand-rolled epoch-fenced append log over tRPC vs embedded replicated store; NATS JetStream/Kafka rejected — quorum/datacenter misfit).
- **Coordinator lease store** — where the `{epoch, leaderID, expiry}` record lives (extend the wrapped Headscale service vs a small sidecar) and the CAS API surface.
- Failback policy details (explicit/idle-triggered only).
