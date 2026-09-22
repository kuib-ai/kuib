---
id: R201
title: Engine-side append validation, optimistic concurrency and edit locks
state: shaped
horizon: later
domains: [core]
depends-on: ["[[roadmap/items/R203-event-taxonomy-completion]]"]
converges-with: ["[[roadmap/items/R204-tool-approval-gate]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Architecture Pattern: Unified Event Log (2026-04-28)]]", "[[_archive/protocol-design/decisions#Atomic Commit Protocol (2026-04-28)]]", "[[_archive/protocol-design/decisions#Race Condition Handling (2026-04-28)]]"]
touched: 2026-09-22
---

# R201 — Engine-side append validation, optimistic concurrency and edit locks

## Idea

Today `append` accepts any event from any caller and only assigns `seq`. With multiple actors
(hosts on several devices plus the engine) the engine must be the **sole writer and
sequencer** that validates before committing. Every event passes, serially per session:

1. **Arrive** — the actor emits the event with `originDeviceID` (remote actors over the wire,
   local ones directly).
2. **Validate** — origin matches event kind (events split into `User*` user-actor and `Engine*`
   engine-actor variants; e.g. an engine `TextDelta` from a non-engine origin is rejected),
   schema, and state preconditions.
3. **Assign seq + commit** — one atomic durable append.
4. **Update in-memory materialized state** (messages, parts, sessions, discussions — R200).
5. **Broadcast** post-commit to live subscribers.

Conflict handling:

- **Concurrent actors** — serial processing, first arrival gets the lower `seq`; no concurrent
  mutation is possible.
- **Edit locks via persistent state** — e.g. phone emits `UserToolEditStarted(callID=1,
  byDevice=phone)` → engine commits a new pending part with `state: editing, by: phone`; a desktop
  `UserApprovalGranted(callID=1)` while the edit is active is rejected with
  `EngineEventRejected { reason: "callID=1 is being edited by phone" }`. Other hosts see the
  editing state through their subscription.
- **Optimistic concurrency** — submissions may carry `expectedSeq`; if state moved past it the
  engine rejects with `EngineEventRejected { reason: "stale", currentSeq }` and the client
  re-reads and retries.
- Most user actions (`UserMessageSubmitted`, `UserPartExcluded`, `UserDiscussionToggled`) are
  order-independent and need no lock (FCFS).

## Why

Multi-device control (approve on the phone while the desktop watches) needs a deterministic
answer to "who wins", surfaced to the loser instead of silently dropped.

## Open questions

- Is `EngineEventRejected` logged (durable) or only returned to the submitter?
- Does the engine-service control socket (`submit` / `interrupt`) become the carrier for all
  `User*` events, or does a separate append RPC appear?

## Constraints already decided

- One event union in a sequenced, origin-attributed envelope — [[domains/core/decisions#^D004]].
- Control plane on the socket, data plane in SQLite — [[domains/core/decisions#^D016]].
- One active turn per session; mid-run submits steer at step boundaries —
  [[domains/core/decisions#^D018]].

## History

- 2026-09-22 migrated from the archive
