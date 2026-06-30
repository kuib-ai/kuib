---
title: "Protocol Design"
type: implementation
status: in-progress
layer: protocol
created: 2026-04-22
tags: [protocol, types, zod, events, state-management, tsgo]
depends-on:
  [
    "[[architecture-overview]]",
    "[[provider-architecture]]",
    "[[security-model]]",
  ]
informs:
  [
    "[[discussions-ux]]",
    "[[host-layer]]",
    "[[context-bootstrap]]",
    "[[infrastructure-strategy]]",
    "[[consensus-model]]",
    "[[house-style-linting]]",
    "[[multi-device-ux]]",
  ]
---

# Protocol Design

## Current Decisions

### Package: `@kuib/protocol`

**Zod-first schema package** (decided 2026-06-30, supersedes the earlier proto-first draft). Lives at `packages/protocol/`. Zod schemas are the source of truth; TS types via `z.infer<>`; runtime validation at every transport boundary. Single runtime dep: `zod`.

**RPC: tRPC (Zod-native) for v1.** The mesh transports (host↔engine, engine↔daemon) use tRPC — no `.proto`, no codegen; the wire contract derives from the Zod schemas. The `TransportFactory` (in-process / WebSocket / mesh) is the seam that lets **proto/gRPC slot in later** as an alternative transport — justified _only_ by polyglot daemons (e.g. a future Go daemon that can't import Zod). This keeps the language-agnostic-IDL foresight without inverting the source of truth or re-authoring the protocol. See [[consensus-model]], [[infrastructure-strategy]].

### Tooling — tsgo only, no tsc

- **@typescript/native-preview 7.0.0-dev** (`tsgo`) — Go-based native TS compiler. Used for BOTH typechecking (`tsgo --noEmit`) and building (`tsgo -b`). Emits `.js`, `.d.ts`, `.d.ts.map`, `.js.map`. 10-100x faster than tsc.
- **No `tsc` dependency** in protocol package. `typescript` kept at workspace root only for `typescript-eslint` compatibility.
- **`composite: true`** in tsconfig — enables incremental builds via `.tsbuildinfo` (stored in `dist/`).
- **`--builders N`** flag available for parallel monorepo builds as packages grow.
- **Zod 4.3.6** for schema-first type definitions. Zod 4 supports native TS enums in `z.enum()` (replaces deprecated `z.nativeEnum()`), nested discriminated unions, and union/pipe discriminator values.
- **pnpm** workspaces + Nx (no Bun dependency anywhere).

**Dependency layout principle:**

- Build tools (`@typescript/native-preview`, `eslint`, `prettier`, `nx`) → workspace root `devDependencies`
- Runtime deps (`zod`) → each package's own `dependencies` with `catalog:` for version alignment
- pnpm deduplicates on disk automatically

### TS 7.0 Compatibility

Config uses `module: "NodeNext"`, `moduleResolution: "NodeNext"`. No deprecated options (`target: es5`, `moduleResolution: node`, `baseUrl` all removed in TS 7.0).

### Native TS Enums for All Discriminators

All discriminated union discriminator values use native TypeScript enums instead of hardcoded string literals. Provides autocomplete in switch statements, single source of truth for values, and IDE discoverability.

```ts
export enum PartTypeEnum {
  TEXT = "text",
  REASONING = "reasoning",
  // ...
}
z.literal(PartTypeEnum.TEXT)  // in schemas
case PartTypeEnum.TEXT:       // in consumers — autocomplete works
```

Zod 4's `z.enum()` accepts native TS enums directly. `z.literal(MyEnum.VALUE)` works in discriminated unions.

### Architecture Pattern: Unified Event Log (2026-04-28)

Supersedes SQ/EQ separation — see [[protocol-design/research/superseded]] for history.

- **One `Event` discriminated union**: `User*` (user-actor) and `Engine*` (engine-actor) variants
- **Engine is sole writer + sequencer** — validates origin, assigns `seq`, commits, broadcasts
- **`submission.ts` dropped** — user actions are events in `event.ts`

### Two Worlds: Events vs Messages

**Events** (`event.ts`) drive the TUI's real-time rendering. The TUI listens for events and updates its own view state. Events are ephemeral — fire to connected clients, then gone.

**Messages** (`message.ts`) are for persisted conversation history. Only final/stable states exist in messages. When a turn completes, the engine materializes events into a final message and stores it.

- `TextDelta` events accumulate into a `TextPart` on the message
- `ToolCallStarted` is an event only — "running" state never appears in persisted messages
- `StepStarted`/`StepFinished` events drive live TUI, `StepBoundaryPart` is the persisted record

### Event System: EventLog with Envelopes (revised 2026-04-28)

`EventEnvelope` carries every event flowing through the session log:

```ts
EventEnvelope {
  _version: z.literal(1),
  seq: number,                       // monotonic per sessionID, assigned by engine sequencer
  timestamp: number,                 // wall clock ms at engine commit
  sessionID: SessionID,
  originDeviceID: DeviceID,          // REQUIRED — multi-actor system, must know who emitted
  event: Event,
}
```

`originDeviceID` is reinstated (was dropped earlier when we assumed single-engine-as-sole-producer). The unified event log has multiple producers (user actors on any device + engine actor); origin attribution is mandatory.

No `causationID` — `seq + sessionID` is sufficient for ordering and lookup.

`seq` extends to **`(epoch, seq)`** per [[consensus-model]] — `epoch` = leadership generation (0 forever on single-device), `seq` = position within it. Total order is lexicographic. Built in from the start so the log format never changes when fencing/failover arrives.

### Versioning boundaries (2026-06-30)

`_version` is carried at **durable / wire aggregate boundaries only — never on every leaf schema.** Leaves inherit their container's version. The rule, locked from the start so migration is never retrofitted:

- **`EventEnvelope`** — `_version: z.literal(1)`. The log is the canonical recovery surface, so one version covers the **entire `Event` union**; individual event variants do NOT each carry a version.
- **Persisted aggregate roots** — `Message` (already has it), and `Discussion` / `Session` / `Checkpoint` when added — each `_version: z.literal(1)`.
- **Ordering** — `(epoch, seq)` on the envelope (leadership generation + position).
- **Content edits** — `version: number` + `MessageVersionCreated` events (domain versioning, distinct from schema version).

Explicitly NOT versioned: leaf schemas (`PartText`, `TokenUsage`, individual event variants) and transient never-persisted events (`ToolCallStarted`, `RetryAttempt`) — all covered by the envelope/aggregate `_version`. Over-versioning is its own drift smell. We control all mesh nodes and deploy together, so in-band `_version` (not proto field-numbers) is sufficient — see [[infrastructure-strategy]].

```ts
interface EventLog {
  append(sessionID, event): Promise<EventEnvelope>; // engine-only writer
  replay(sessionID, afterSeq, handler): void;
  subscribe(sessionID, afterSeq?, handler): Unsubscribe;
}
```

**v1 backing**: SQLite-backed durable event log per session (`MemoryEventLog` superseded — see [[protocol-design/research/superseded]]).

### Atomic Commit Protocol (2026-04-28)

The engine processes events serially per session. Each event passes through:

1. **Arrive** — actor emits event with `originDeviceID`. Remote actors send via wire transport; local actors call directly.
2. **Validate** — engine checks origin matches event kind (e.g., `EngineTextDelta` from non-engine origin → reject), schema, and any state preconditions (`expectedSeq` for optimistic concurrency).
3. **Assign seq + commit to event log** — single durable append, atomic.
4. **Update in-memory materialized state** — engine's view of messages, parts, sessions, discussions advances.
5. **Broadcast** — post-commit, push event to all live subscribers.

Persistence (messages, parts, sessions, discussions on disk) is **batched at checkpoint boundaries**, not per-event:

- Hot path writes only to event log (one durable append per event)
- A background materializer flushes accumulated state to persistence at checkpoint boundaries (step end, message end, configurable)
- Persistence cursor (durable per-session field) tracks "last persisted seq"
- If materializer is slow or fails, event log keeps accepting events; persistence catches up async

**Event log is canonical** for "what happened, in what order, by whom." Persistence (messages with parts) is a fast read view, derivable from event log replay. Both are durable; neither is full event-sourced derivation, but the event log is the recovery surface.

**Crash recovery**: on engine restart, read last seq from event log, read persistence cursor, replay events `(cursor, last]` into persistence to catch up, then resume. Atomic per-event commit means the event log is never torn.

### Materialization & resume — runtime model + mesh (2026-06-30)

Refines the materializer model above with the runtime/throughput and mesh-correctness details reasoned out this session.

**Two decoupled write paths** (neither blocks streaming):

- **Event-log append** — the hot path, every chunk. **Write-behind**: buffer in RAM, batch-flush to SQLite in **WAL** mode. Durability is a _tunable knob_; on a client machine we relax fsync (worst case: a hard crash loses the last ~second of unflushed chunks, which the user re-runs). High write throughput is the priority here.
- **Materializer** — folds events → `messages`, at a _coarse_ frequency, off the hot path.

**Materialize incrementally at step + tool-call boundaries — NOT after the query.** Boundaries = `PartStepBoundaryStop` **and** tool-call completion (a tool that ran a real side effect is a durable fact to persist immediately). Per-query-only materialization was rejected: it forces full-query replay on crash and strands long/abandoned queries. Incremental folds `(cursor, X]` — one step's chunks — so cost is O(chunks-in-step) + one UPSERT per affected message. Cheap because bounded, never a re-derivation.

**Resume = settled snapshot + unsettled tail.** Reopening the TUI mid-query reads (in parallel) the materialized `messages` snapshot (settled steps, fast) **plus** the event-log tail since `lastPersistedSeq` (the in-flight step's chunks), merged into exact state.

**Ordering is `(epoch, seq)`, never timestamp.** Wall clocks skew across mesh devices, so `createdAt` is **display-only**; the canonical total order for folding/merging is `(epoch, seq)` lexicographic. (Single-machine timestamp ordering happens to work but is a latent mesh bug — explicitly avoided.)

**Mesh: replicate the log, derive the snapshot.** Materialization is a **pure deterministic function of the log** (same `(epoch, seq)` sequence → identical `messages` on every node). Consequences:

- Only the **event log replicates** (via the consensus substrate / log-shipping, [[consensus-model]]). The `messages` snapshot is **never shipped** — each node rebuilds it locally from its log replica.
- **Failover is free**: the new leader already holds the most-complete log (Raft safety), re-materializes locally — no snapshot transfer, no snapshot-consistency protocol.
- **No divergence** by determinism; the snapshot is a local _cache_, not a source of truth.
- The materialization **cursor (`lastPersistedSeq`) is per-node local state**, NOT replicated — it tracks this node's snapshot progress; a new leader uses its own.

Net: the persistence layer adds **~zero new distributed edge cases**. The only edge cases are the consensus ones on the log itself (handoff, epoch fencing — owned by [[consensus-model]]); once the log is correct, every node's snapshot is correct by determinism.

### SQLite backing — `bun:sqlite` now, `node:sqlite` later (LOCKED 2026-07-01, supersedes runtime-adaptive)

The transcript DB is **SQLite**, zero native dependency. Earlier plan was a runtime-adaptive adapter (`bun:sqlite` under Bun / `node:sqlite` under Node behind one file). **Replaced** after research:

- **Bun does NOT implement `node:sqlite`** (compat matrix = 🔴 Not implemented), but **PR oven-sh/bun#32498** ("implement the module, pass the Node v26.3.0 test suite") is open and linked to close it. `node:sqlite` is Node **RC** (Stability 1.2), unflagged since v23.4/v22.13.
- **`bun:sqlite` is blessed for `bun build --compile`** (officially supported; can even embed a `.db`); WAL via `PRAGMA journal_mode=WAL`; sync, 3–6× better-sqlite3; `safeIntegers` for bigint.
- **`better-sqlite3` rejected** — native rebuild / node-gyp / per-platform `.node`; the ecosystem drops it on Bun.

**Decision:** use **`bun:sqlite`** in a **separate, Bun-quarantined package `@kuib-ai/event-log-sqlite`** — NOT inside `engine`, because importing `bun:sqlite` anywhere `engine`'s barrel pulls would crash every vitest-on-Node test and force `bun-types` into engine. `engine` stays runtime-agnostic with `memory.event.log` (vitest); the sqlite adapter is tested under `bun test` (like the OpenTUI host is Bun-quarantined). **Convergence:** when bun#32498 ships, the adapter swaps `bun:sqlite`→`node:sqlite` (one import) and stops being Bun-quarantined — zero `EventLogPort` change.

**`EventLogPort` lives in `@kuib-ai/protocol/event.log.port`** (the contract — protocol = "Zod schemas + behavioral interfaces"). Both the host (reader impl) and the engine-service (writer impl) depend on this one contract. (`memory.event.log` in engine + `@kuib-ai/event-log-sqlite` are the two impls; a redundant engine re-export shim should be deleted.)

Tables: `events(sessionID, epoch, seq, envelope TEXT, createdAt INT, PK(sessionID,epoch,seq))` canonical; `messages(messageID, sessionID, message JSON, PK)` materialized snapshot; `sessions`, `checkpoints`. `append` computes next `seq = MAX(seq)+1` in an `immediate` transaction (the **authoring** path, leader-only); replication will later add an `applyReplicated(envelope)` path that inserts the leader's already-assigned `(epoch,seq)` (see [[consensus-model]] author-vs-replicate).

### The event log is one log = localDB + streams (2026-07-01)

The full unified model — one ordered `(epoch,seq)` log presented through `EventLogPort.subscribe` as **settled (local DB) + unsettled tail (live stream)**, order-by-`(epoch,seq)`-never-timestamp, commit-watermark + provisional-tail, author-vs-replicate, and "replicate coarse committed entries / fan out the token tail to viewers" — lives in **[[consensus-model]]** (unified event-log model). The protocol stays clean: events are just sequenced log entries; **no per-event durable/ephemeral tag** — event _type_ already separates side-effects from display deltas.

### Reasoning is content, not a tool call (2026-07-01)

Native reasoning models (e.g. gemma4 on minerva) stream `reasoning` deltas _before_ the answer (AI SDK `fullStream` `reasoning-delta`, distinct from `tool-call`). **`REASONING_DELTA` mirrors `TEXT_DELTA` exactly** (`{messageID, partID, delta}`); `PartReasoning` mirrors `PartText`. Modeling reasoning as a tool call was rejected — it would fabricate a callID/input/output lifecycle that never happened, break the "every tool call has a daemon execution + result" invariant, and pollute the approval/security layer. Reasoning = _content the model generates_; tool calls = _actions the model requests_. The orchestrator consumes `fullStream` and emits both `TEXT_DELTA` and `REASONING_DELTA`. (The "think tool" pattern — giving a _non_-reasoning model a `think` tool — is a separate, future, additive thing; it would coexist, not replace `REASONING_DELTA`.)

### Terminal events — needed, not yet in the union (2026-07-01)

`runAgent` emits `MESSAGE_STARTED` + deltas and **nothing terminal** — the event union has no `MessageCompleted`/`MessageFailed`/interrupt boundary. Consequences: a clean finish is never marked done; an **interrupt** (Ctrl+C / host detach mid-run) leaves a perpetually-open turn on resume; errors are only surfaced as a `⚠️` text delta. **TODO:** add terminal events and emit them in `finally`/on-abort so **the stop itself is durable** ("ensure the engine has stopped and persist that"). Couples with the engine-service survive-detach work ([[host-layer]]).

### Context assembly gap — model has no memory across turns (2026-07-01)

Current `runAgent` passes the **single `prompt`** to `streamText`, never a `messages` history — so the model literally receives only the current turn ("I have no context from the previous turn"). Persistence ≠ memory: the event log persists everything, but nothing reads it back into the LLM payload. **Fix:** `buildMessages(log, sessionID) → ModelMessage[]` (fold prior user+assistant turns) and pass `messages`. Reasoning-in-context decision pending: (a) text-only history (default — providers usually discard prior reasoning) vs (b) include reasoning blocks. This is the "context creation: checkpoint → active messages → LLM payload" step, not yet wired.

### Three storage classes — do not conflate (2026-06-30)

| Class                    | Examples                                                  | Store                                                                                                                     | Merge semantics                                                           |
| ------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Chat transcript**      | event log (canonical) + materialized messages/checkpoints | **SQLite** (`kuib.db`)                                                                                                    | un-mergeable, single-writer, `(epoch, seq)` ordered — [[consensus-model]] |
| **Config / model prefs** | active model, UI prefs, device profiles                   | **CRDT (Yjs)** for mesh sync ([[distributed-mesh-state]]); **v1 = a local JSON/SQLite store** behind a `ConfigStore` seam | mergeable, multi-master                                                   |
| **API keys / secrets**   | provider keys                                             | **OS secure storage** (Keychain / libsecret / Cred Manager) — never a DB, never synced                                    | n/a — [[security-model]]                                                  |

The CRDT config layer is **deferred to v1.x** (single-device has nothing to merge); v1 ships a local `ConfigStore`, CRDT drops in behind it like SQLite behind `EventLogPort`. Keys never touch any database or the transcript.

### Race Condition Handling (2026-04-28)

**Concurrent actors**: events go through the engine's serial processor. First-arrival gets lower `seq`. No concurrent mutation possible.

**Semantic conflicts** (two actors target same `callID`):

- _Edit locks via persistent state machine_. Phone emits `UserToolEditStarted(callID=1, byDevice=phone)` → engine commits new pending part with `state: editing, by=phone`. Desktop emits `UserApprovalGranted(callID=1)` while edit is active → engine rejects with `EngineEventRejected { reason: "callID=1 is being edited by phone" }`. Desktop's UI reflects "phone is editing" (it sees the editing-state pending part via subscription).
- _Optimistic concurrency for fast non-locked actions_. Submissions can carry `expectedSeq: number`. If state has moved past `expectedSeq`, engine rejects with `EngineEventRejected { reason: "stale", currentSeq: M }`. Consumer reads fresh state and retries.
- Most user actions (`UserMessageSubmitted`, `UserPartExcluded`, `UserDiscussionToggled`) are independently safe in any order — engine processes FCFS, no locks needed.

### Event Taxonomy — Revised (2026-04-26)

Every event implies `sessionID` via the envelope. Architecture reflects message.ts persistence primitives — events accumulate INTO messages and parts.

**Message lifecycle** (replaces "Turn lifecycle" — the message IS the turn for assistants):

- `MessageStarted { messageID }` — creates `MessageAssistant` skeleton, no parts yet, status not yet set
- `MessageCompleted { messageID, completedAt }` — finalizes status: "success"
- `MessageFailed { messageID, error: MessageAssistantError, completedAt }` — finalizes status: "error", carries the discriminated union variant directly

**Why we keep message lifecycle events** (not pure derivation from step boundaries):

1. API errors before any step starts (auth, context overflow rejected upfront) — no step ever happens, but a failed MessageAssistant must be created
2. Persistence finalization signal — "this message is sealed, set completedAt, no more parts coming." Step boundaries can't carry this (multiple steps per message)
3. Cleaner mental model — TUI cares about "message started/completed/failed"; steps are internal structure

**Step lifecycle** (within a message):

- `StepStarted { messageID, partID }` — appends `PartStepBoundaryStart` to the parts array
- `StepFinished { messageID, partID, reason: StepBoundaryStopReasonEnum, model: ModelRef, tokens: TokenUsage }` — appends `PartStepBoundaryStop`

**Streaming content deltas**:

- `TextDelta { messageID, partID, delta }` — accumulates into `PartText`. partID created on first delta; subsequent deltas target same partID
- `ReasoningDelta { messageID, partID, delta }` — accumulates into `PartReasoning`

**Tool call lifecycle** (events have transient "running" state; persisted parts only have pending/completed/error):

- `ToolCallRequested { messageID, partID, callID, tool, input, title, startedAt, verdict }` — appends `PartToolCall(pending)` with security verdict
- `ToolApprovalRequired { callID, verdict, explanation? }` — TUI prompt (transient — verdict already on the persisted pending part)
- `ToolApprovalGranted { callID }` — user approved; engine proceeds with execution
- `ToolApprovalDenied { callID }` — user denied; pending → `PartToolCall(error, reason: rejected)` appended
- `ToolCallStarted { callID }` — execution began (transient running spinner, never persisted)
- `ToolCallOutputDelta { callID, delta }` — streaming output (long shell commands, subagent streams)
- `ToolCallCompleted { messageID, partID, callID, output, completedAt, kind, model?, tokens? }` — appends `PartToolCall(completed)`. Subagent variant carries model+tokens
- `ToolCallFailed { messageID, partID, callID, reason: ToolCallErrorReasonEnum, error, completedAt, kind, model?, tokens? }` — appends `PartToolCall(error)`. Reason drives TUI rendering (cancelled/rejected/interrupted/failed)

**Retries** (ephemeral, never persisted):

- `RetryAttempt { messageID, attempt, maxAttempts, waitMs }` — TUI shows "Retrying... (attempt 2/5)". Future enhancement: persist as paired step boundaries with reason: aborted if needed

**Session/persistence**:

- `SessionUpdated { sessionID, status: SessionStatus }`
- `MessageUpdated { messageID, message: Message }` — full message embedded (TUI doesn't fetch separately)
- `MessageVersionCreated { messageID, version }` — explicit version event for edit/exclude tracking
- `CheckpointCreated { checkpointID, seq }`
- `ModelSwitched { from: ModelRef, to: ModelRef }`
- `CompactionPerformed { archivedMessageIDs: MessageID[], summaryMessageID: MessageID }`

**Discussions** (cross-session shareable model):

- `DiscussionCreated { discussion: Discussion }` — full embed
- `DiscussionUpdated { discussionID }` — content changed
- `DiscussionDeleted { discussionID }`
- `DiscussionLinked { sessionID, discussionID, snapshotVersion }` — session referenced a discussion
- `DiscussionToggled { sessionID, discussionID, included: boolean }`
- `DiscussionPartsAdded { discussionID, partIDs: PartID[] }`
- `DiscussionPartsRemoved { discussionID, partIDs: PartID[] }`

**Part exclusion** (transparency/control):

- `PartExcluded { messageID, partID }` — user toggled `excluded: true`
- `PartIncluded { messageID, partID }` — user toggled `excluded: false`

**Dropped from event system:**

- `TurnAborted` — derivable from last `StepBoundaryStopPart.reason === INTERRUPTED`
- `PartUpdated` / `PartRemoved` — parts are append-only within a message version. Edits create a new version (`MessageVersionCreated`)
- `PartFinalized` — redundant. Step boundary or terminal tool events imply finalization
- `originDeviceID` on envelope — single engine per session, single ordering domain
- `causationID` on envelope — `seq + sessionID` is sufficient

### Pending Approval State Persistence (2026-04-26)

**Hole in current message.ts**: `ToolCallPending` has no field for security verdict or approval state. If the user closes the TUI while approval is pending, that state is lost on reload — the TUI can't tell "is this still waiting on me?"

**Fix** (deferred to security.ts rebuild): extend `ToolCallPending` with two fields:

```ts
ToolCallPending = {
  status: "pending",
  input,
  title,
  startedAt,
  verdict: SecurityVerdict, // from security.ts
  approval: ApprovalState, // pending | approved | denied
};
```

When the engine emits `ToolCallRequested`, it includes the verdict. The pending part persists with `approval: "pending"`. The TUI reads the persisted state to show approval prompt across reloads. User approves → `ToolApprovalGranted` event → engine updates `approval: "approved"` → tool executes.

The pending → completed/error transition is unchanged — once approved, execution proceeds and a new `PartToolCall` is appended.

**Status**: TODO. Blocked on `security.ts` (`SecurityVerdict`, `ApprovalState` schemas not yet built). Note in progress.md.

### Message Format — Finalized (v3, 2026-04-25)

kuib messages are NOT AI SDK messages. Engine translates kuib messages → AI SDK `ModelMessage` at the provider boundary.

**MessageBase** (non-exported): shared fields inherited by all message types via `.extend()`.

```ts
MessageBase { _version: 1, id: MessageID, sessionID: SessionID, discussionID: DiscussionID, parts: Part[], createdAt: number }
```

**MessageUser**: extends MessageBase. `parts: PartUser[]` (TextPart | FilePart only). No `ModelRef` (user doesn't use a model).

**MessageAssistant**: discriminated union on `status`:

- `success` — has `completedAt`
- `error` — discriminated union on `kind`:
  - `api` — has `statusCode: number` + `error: string`
  - `context_overflow` — has `error: string`
  - `unknown` — has `error: string`

`parts: PartAssistant[]` (TextPart | ReasoningPart | FilePart | ToolCallPart | StepBoundaryPart).

No `finishReason`, `tokens`, `cost`, or `model` on AssistantMessage — per-step on `StepBoundaryStopPart`. No `parentID` — implicit from ordering within discussions. No `MessageError` schema — error kinds inlined as discriminated union variants.

`ABORTED` removed from error kinds — derivable from `StepBoundaryStopPart(reason: INTERRUPTED)`. Not an error, it's a user action.

`OUTPUT_LENGTH` removed — not an error. API returns 200 OK with `finishReason: "length"`. Mapped to `StepBoundaryStopReasonEnum.LENGTH`.

`retryable` removed — derived function: `isRetryable(error) → boolean` based on error kind + statusCode. Engine handles retries internally; emits `RetryAttempt` events for TUI visibility.

### MessageUser.originDeviceID (2026-04-25)

`MessageUser` carries `originDeviceID: DeviceID` — the device the user typed from.

- Required field, not optional (strictness from day one, no later migration)
- Semantics: typing device (TUI's device), NOT engine home device
- v1 single-device: typing device == home device always
- When mesh ships: TUI on phone → `originDeviceID = phone`, even though engine runs on Mac mini
- TUI renders flavor: `> hey check the dotfiles\n  — you, MacBook Pro · 2:34 PM`
- Model can read the device context

`MessageAssistant` does NOT carry `originDeviceID` — assistant device is implicit (session's home device, where the engine runs). Asymmetric but correct: user can type from anywhere; assistant always replies from the engine.

### Schema Versioning

`_version: z.literal(N)` on `MessageBase`. Version at the persistence boundary, not on nested schemas.

- Latest schema is the only one the engine creates. `z.literal(2)` means all new messages are v2 — compile error if code still references `1`.
- Old data migrated on read via discriminated union of versions + migration chain:
  ```ts
  MessageAnyVersion = z.discriminatedUnion("_version", [MessageV1, MessageV2])
  migrateToLatest(raw) → switch on _version → chain migrations → return latest
  ```
- **Local files**: eager migration on load, write back.
- **Postgres JSONB**: lazy migration at app layer, background batch cleanup.
- Old schemas live in `migrations/` folder, not in main code. Main code always has latest.
- **Schema snapshot test** in CI: `z.toJSONSchema(Message)` compared against committed snapshot. Schema change without version bump = CI failure.

### Compaction — Just a Regular Message

Context compaction replaces N old messages with a single summary message. No `synthetic` flag, no special part type, no `ContextCompacted` event. The summary is a regular `MessageUser`.

Pre-compaction messages are **archived**, not deleted. The checkpoint's `activeMessages` list determines what's in context — archived messages are not in the list. TUI greys them out. User can revert compaction = re-activate originals, archive the summary.

### Command Editing — Cache-Safe (Option B)

When user edits a tool call's input before approving:

- `ToolCallPart(pending)` keeps the LLM's **original** request
- `ToolCallPart(completed)` carries `executedInput` (optional, present only when user modified)
- `tool_result` sent to API includes the edit context

Cache-safe: the edit is at the tail of the conversation (current turn), after the cache breakpoint. Cached prefix is never modified. LLM learns from the correction.

Editing past messages (mid-conversation) DOES invalidate cache — intentional tradeoff. TUI shows cost delta using `TokenUsage` + `ModelRef` data before user confirms.

### Checkpoint Model — Bookmarks, Not Snapshots

Checkpoints are lightweight pointers into existing data, not full state copies:

```ts
Checkpoint {
  id: CheckpointID,
  sessionID: SessionID,
  seq: number,                    // event sequence at this point
  model: ModelRef,
  discussions: Array<{ id: DiscussionID, included: boolean }>,
  git?: GitState,
  activeMessages: Array<{ messageID: MessageID, version: number }>,
  createdAt: number,
}
```

No state duplication. The message store is the single source of truth. Checkpoints just record which messages at which versions were active.

**Context creation** is a pure function: load checkpoint → get active messages at recorded versions → filter out excluded parts → build LLM context.

### Part Types — Content + Step Boundaries

All parts extend `PartBase` (non-exported):

```ts
PartBase { partID: PartID, excluded: z.boolean() }
```

`partID` — stable identity for discussion references, event targeting, TUI rendering. `excluded` — per-part exclusion from LLM context (user toggles in TUI, part still rendered but dimmed/struck-through, not sent to LLM).

Naming convention: `Part` prefix — `PartText`, `PartReasoning`, `PartFile`, `PartToolCall`, `PartStepBoundary`.

**Role-specific part unions** (enforced by type system):

- `PartUser` = PartText | PartFile
- `PartAssistant` = PartText | PartReasoning | PartFile | PartToolCall | PartStepBoundary

`Part` = union of both (for migrations, utilities, role-agnostic operations).

`MessageUser.parts: PartUser[]`, `MessageAssistant.parts: PartAssistant[]` — a ToolCallPart in a user message is a compile error.

### Tool Call Parts — Append-Only, No Mutation

Tool call lifecycle is tracked by appending separate `ToolCallPart` entries in the parts array, not by mutating a single part:

```
StepBoundaryStartPart
  TextPart("let me check")
  ToolCallPart(pending, callID=1)
  ToolCallPart(pending, callID=2)
StepBoundaryStopPart(reason: tool-call-request)
ToolCallPart(completed, callID=1)               ← between steps
ToolCallPart(completed, callID=2)               ← between steps
StepBoundaryStartPart
  TextPart("I see...")
StepBoundaryStopPart(reason: normal)
```

Tool results always land between a `StopPart` and the next `StartPart`. Step boundaries bracket LLM inference only — tool execution happens between steps.

Both pending and completed/error parts are linked by `callID`. Current state = last ToolCallPart with that callID. Revert = pop the last entry.

**Three persisted statuses** — `pending`, `completed`, `error`. No `running` status in messages — it's a transient event-only state (`ToolCallStarted` event drives TUI spinners).

`ToolCallPart` is `{ type, callID, tool, state }` — identity only. All request data (`input`, `title`, `startedAt`) lives on `ToolCallPending` state. Completed/error states carry only outcomes. No duplication.

**`ToolCallPending`**: `{ status, input, title, startedAt }` — the request data. `title` is the human-readable display label (e.g., "Run: ls -la"), distinct from `tool` (programmatic name). `startedAt` is justified — the pending part IS the start moment.

**`ToolCallCompleted`**: `{ status, kind, output, completedAt }` — outcome only. Subagent variant adds `model` + `tokens`.

**`ToolCallError`**: `{ status, reason, kind, error, completedAt }` — outcome + reason enum. `error: z.string()` always required (transparency, debugging, issue reports). Subagent variant adds `model` + `tokens`.

**No `metadata` on any schema.** No `input`/`title` on completed/error states. No `startedAt` on completed/error (derivable via `callID` lookup to pending part).

### Tool Call Error — Reason Enum

`ToolCallError` carries a machine-readable `reason` enum for behavior tracking and TUI rendering:

```ts
enum ToolCallErrorReasonEnum {
  CANCELLED = "cancelled", // user cancelled before execution started ("changed my mind")
  REJECTED = "rejected", // user denied approval at the security gate
  INTERRUPTED = "interrupted", // user interrupted mid-execution (ctrl+c while running)
  FAILED = "failed", // tool itself errored (exception, timeout, etc.)
}
```

Each tells the TUI how to render: cancelled=grey, rejected=red badge, interrupted=amber with wall time, failed=red with error details. Without the enum, the TUI would have to parse the error string.

At the provider adapter layer, all four map to `is_error: true` + `tool_result` — the API doesn't distinguish, but the protocol and TUI do.

**Every pending tool call MUST get a resolution** (completed or error). No dangling pendings. Validated by research into codex (synthetic `AbortedToolOutput`), opencode (cleanup marks pending→error + safety net in serialization), and claude-code (5-layer defense-in-depth with `ensureToolResultPairing()` as final safety net). All three codebases converge on the same invariant.

### Interrupt Handling in the Parts Array

**Interrupt mid-stream** (user ctrl+c during LLM generation):

```
StepBoundaryStartPart
  TextPart("here's the ans")           ← partial, whatever was streamed
  ToolCallPart(pending, callID=1)      ← fully formed before interrupt
                                        ← callID=2 was mid-JSON, dropped
StepBoundaryStopPart(reason: interrupted)
ToolCallPart(error, callID=1, reason: interrupted)  ← never executed
```

Half-formed tool calls (incomplete input JSON) are dropped — never a real request. Fully-formed pendings get an error(interrupted) resolution.

**Interrupt during tool execution:**

```
StepBoundaryStopPart(reason: tool-call-request)
ToolCallPart(completed, callID=1)                    ← finished before interrupt
ToolCallPart(error, callID=2, reason: interrupted)   ← was running, killed
ToolCallPart(error, callID=3, reason: interrupted)   ← never started
```

**Invariant:** the parts array is an exact, append-only log of what actually happened. Nothing synthesized beyond error resolutions for pending tool calls. The provider adapter translates to API-required `tool_result` blocks at the boundary.

### Tool Call Kind — Normal vs Subagent

Both `ToolCallCompleted` and `ToolCallError` are discriminated unions on `kind` via `ToolCallKindEnum`:

- **normal** — standard tool (file read, shell exec). No model, no tokens.
- **subagent** — tool that internally calls an LLM. Required `ModelRef` + `TokenUsage`.

Split applied symmetrically: a subagent that errors still consumed tokens. Type system enforces: subagent variants always carry model/tokens, normal variants never do. Fields kept independent (not shared via base) — if completed-subagent and error-subagent diverge later, no coupling to break.

### Step Boundaries — Per-Step Model Tracking

`StepBoundaryPart` has `type: "step-boundary"` for the Part union, discriminated on `kind` internally:

- **step-start** — minimal, marks beginning of an LLM call
- **step-stop** — carries `tokens: TokenUsage`, `reason: StepBoundaryStopReasonEnum`, `model: ModelRef`. Stop reasons: `NORMAL` (model finished), `LENGTH` (hit max_tokens — not an error), `TOOL_CALL_REQUEST`, `INTERRUPTED` (user ctrl+c), `CONTENT_FILTER`. Maps 1:1 to AI SDK's `finishReason`.

Per-step `ModelRef` handles model switches between steps. Cost = `sum(step.tokens * step.model.pricing) + sum(subagentToolCall.tokens * subagentToolCall.model.pricing)`.

Nested discriminated unions work in Zod 4 — the outer Part union dispatches on `type`, the inner StepBoundary dispatches on `kind`.

### Persistence Model — Three Layers (revised 2026-04-28)

| Layer             | What                                                     | Update cadence                      | Role                                         |
| ----------------- | -------------------------------------------------------- | ----------------------------------- | -------------------------------------------- |
| **Event log**     | All events, sequenced with EventEnvelope                 | Per-event durable append (hot path) | Canonical for "what happened, when, by whom" |
| **Message store** | All messages, all versions, never deleted                | Batched at checkpoint boundaries    | Fast read view for cold loads                |
| **Checkpoints**   | Bookmarks: session state + active message IDs + versions | Created, never modified             | Snapshot pointers into both layers           |

Event log is canonical. Message store is a fast-read derivable view, kept in sync via batched materializer at step boundaries. If message store is corrupted/stale/missing, it can be rebuilt from event log replay (slower cold load, correct result).

Cursor-based replay: persistence has a `lastPersistedSeq` field per session. Materializer reads events `(cursor, latestCheckpointEvent]`, applies to message store, advances cursor.

### State Management: LangGraph-inspired reducers (no LangGraph dependency)

Stole two patterns from LangGraph research (reducer-annotated state, checkpointing):

1. **Reducer-annotated state fields** — `StateField<T>` = Zod schema + default factory + reducer function. Each field defines how partial updates merge (messages append, status overwrites, usage accumulates).
2. **Thread-keyed checkpointing** — `thread_id → serialized state` as first-class concept.

`validateState()` runs each field through its Zod schema — used when deserializing checkpoints from disk or over the wire.

### XState v5 — Rejected

See [[protocol-design/research/superseded]].

### Provider Interface

Two layers in `provider.ts`:

- **Zod schemas** for data: `ModelInfo`, `ModelCapabilities`, `AuthModel`, `ModelResponse`, `StreamChunk`, `ModelContentPart`, `ModelMessage`
- **TS interfaces** for behavior: `LanguageModel` (generate + stream), `Provider`, `ProviderRegistry`

Our `LanguageModel` interface mirrors AI SDK's `LanguageModelV3` shapes so adapters are thin, but is independently implementable without touching AI SDK. `StreamChunk` discriminated union maps ~1:1 to AI SDK's `fullStream` event types.

### Discussion Clustering

Messages belong to Discussions (logical clusters). Discussions can be included/excluded from the LLM context window at runtime. **UX undecided — schema-only in protocol; see [[discussions-ux]].**

### Mesh Architecture — Built-In, 3-Tier Model (2026-06-30)

The entire architecture is built as a mesh from day one, not as an afterthought.

- **Server/Engine**: Hosts the Engine, Session Store, and Event Log. **NOT centralized** — runs on the elected leader among the user's own nodes (P2P, see [[consensus-model]]); the replicated log makes sessions resumable from anywhere.
- **Daemons**: Run on every device (including local). They expose `fs`, `shell`, and tool execution over **tRPC**.
- **Host (TUI/Web)**: A thin client that connects to the Server.

WireGuard (or Tailscale/Tailnet) forms the secure transport for these tRPC connections.
Cross-device workspace continuity is inherent: from the TUI, you can dispatch tools to any daemon on your mesh, guarded by the per-device [[security-model]].

Deferred infrastructure detail: [[infrastructure-strategy]] holds the control-plane details for deploying this, but the protocol assumes this topology natively.

### Mesh Protocol, 3-Tier Runtime in v1 (2026-06-30)

Protocol carries mesh fields natively, and the runtime fully embraces the 3-tier Server-Daemon-Host model:

- `ToolCallPending.device?: DeviceID` — which daemon the tool ran on
- `ToolSpec.executionTargets: "local" | "remote-allowed" | "remote-only"` — what the tool supports
- `Session.peerDevices: Device[]` — visible mesh daemons
- `MessageUser.originDeviceID: DeviceID` — typing device, required field
- `Device { id: DeviceID, owner: string, name: string, profile: SecurityProfile }` schema in `session.ts`

The "local" machine is the same RPC contract over a **unix socket** — a separate daemon process, not in-process (isolation from day one). The engine dispatches to it over the TransportFactory like any remote daemon.

**Consensus consequences (2026-06-30, see [[consensus-model]]):** sessions are **single-active-engine** (one leader per session-log; viewing ≠ leading — hosts submit to the leader, which is sole writer/sequencer). `EventEnvelope.seq` extends to **`(epoch, seq)`** — epoch = leadership generation (single-machine = `epoch=0` forever) — so it survives leader handoff under quorum + lease + fencing. The earlier "engine never moves / one session = one home device / ResumptionStrategy dropped" stance is **superseded**: sessions are replicated and resumable, with one _active_ leader at a time elected per the [[consensus-model]] rules.

### Per-Device Security Profiles (2026-04-25)

`SecurityProfile` is per-device, not per-session. Risk score:

```
risk = commandRisk × deviceProfile[targetDevice]
```

Same command (`rm -rf node_modules`) has different blast radius on home laptop vs Mac mini vs production server. Approval flow includes target device prominently:

> Run `rm -rf node_modules` on `prod-server`? [approve / deny / explain]

See [[security-model]] for full risk/approval semantics.

### Security: Operation x Target Risk Matrix

From [[security-model]]. Commands decomposed into `CommandEffect[]` — each effect is `operation x target`. Risk score = max across effects. Three tiers based on configurable thresholds per `SecurityProfile` (development/production/readonly).

Approval flow: `pending → approved|denied|explaining`. The `explaining` state handles async background LLM call that contextually explains what a command does.

### Module Structure

```
src/
  id.ts          — branded ID types via z.string().brand() (SessionID, MessageID, etc.)
  message.ts     — content parts, tool call lifecycle states, user/assistant messages
  session.ts     — sessions, discussions, checkpoints, devices
  provider.ts    — model info schemas + LanguageModel/Provider/ProviderRegistry interfaces
  event.ts       — unified Event union (User* and Engine* variants) + EventEnvelope + EventLog interface
  tool.ts        — tool specs (JSON Schema input), executor/registry interfaces
  io.ts          — filesystem, shell, network interfaces (pure DI contracts)
  security.ts    — operation/target enums, risk scoring, profiles, approval state
  state.ts       — reducer-annotated state fields, apply/create/validate utilities
  transport.ts   — transport interface (in-process, WebSocket, mesh)
  index.ts       — barrel export
```

`submission.ts` removed (2026-04-28). User-actor events live in `event.ts`.

### Design Principles

- **Zod schemas for data, TS interfaces for behavior** — if it has methods, it's an interface. If it crosses a boundary (wire, disk, process), it's a Zod schema.
- **Native TS enums for all discriminators** — autocomplete in switch statements, single source of truth, no hardcoded strings.
- **Nested discriminated unions** — Zod 4 supports inner unions as members of outer unions when all inner members share the outer discriminator value.
- **Discriminated unions everywhere** — exhaustive matching in consumers. Error handling is a union variant, not an optional field.
- **No AI SDK types in the protocol** — protocol owns its types. Adapters translate.
- **ID branding** — can't pass `MessageID` where `SessionID` is expected.
- **Append-only parts** — tool call lifecycle tracked by appending new parts, not mutating existing ones. History is implicit in the array.
- **Events for real-time, messages for persistence** — two separate worlds. Events are ephemeral deltas. Messages are accumulated final state.
- **`Record<string, unknown>` for tool inputs** — protocol validates shape (it's an object), tools validate content. Decouples protocol from tool schema evolution.
- **`.extend()` for schema inheritance** — base schemas shared across variants, no field duplication.

### Performance Strategy

- **No Zod validation on the hot path** (streaming). Validate at transport boundaries only (WebSocket, disk, process boundary). In-process, TypeScript's type system guarantees shape at compile time.
- **No EventEnvelopes in-process.** In the **single-device collapsed case** (the 3-tier physically reduced to one process — see [[consensus-model]], [[architecture-overview]]), TUI + engine + local daemon run together; events flow as plain typed objects via callback. Envelopes (`(epoch, seq)`, timestamp) are for the persistent EventLog and remote transport (host↔engine, engine↔daemon) only. The logical 3-tier contract is unchanged; only the transport collapses to in-process.
- **TUI renders from events, not messages.** Events are surgical deltas applied to an in-memory `Map<ToolCallID, ...>`. No parts array scanning. Messages are for persistence only.
- **Lazy materialization.** Message with its Parts only built when step ends (cold path). TUI never waits for message materialization.
- **Provider adapter is thin field mapping.** AI SDK stream chunks map ~1:1 to kuib Events. Same string references, minimal allocation.
- **Token counting on interrupt:** approximate. Input tokens exact (we built the context). Output tokens counted from received deltas. Neither opencode nor claude-code warn users. kuib: TUI shows "~" prefix on interrupted step's token count, derived from `StepBoundaryStopPart.reason === INTERRUPTED`.

### Discussion Model — PartID[] Overlay (Updated 2026-04-25)

A discussion is an ordered sequence of `PartID`s, stored on the discussion entity in `session.ts`:

```ts
Discussion { id: DiscussionID, partIDs: PartID[], ... }
```

**Parts are oblivious to discussion membership.** Parts have stable `partID` but no back-reference. Discussions are an overlay maintained externally — no structural invariants on the parts array to maintain.

**TUI rendering:** linear render of `Message[]` is the base. Discussion view is built by:

1. Loading the discussion's `partIDs`
2. Building `Set<PartID>` for O(1) lookup
3. For each part in linear render, check membership and render with appropriate styling (in-discussion = highlighted, excluded = dimmed)

**Mutations are surgical events** (`DiscussionPartsAdded`, `DiscussionPartsRemoved`) that just update the `partIDs` list. No invariants to break.

**Cross-session sharing** (still TBD in detail): discussions are shareable entities. A session references discussions via `SessionDiscussionRef` (discussionID + included + snapshotVersion). Mutations to a discussion don't propagate to other sessions automatically — snapshot semantics. Sessions explicitly "update" to latest when ready.

**Step boundaries** are not included in discussions — they're internal tracking, never sent to the LLM. Same for transient event-only states (running tool calls, approval flow).

## Open Questions

- Host boundary vs engine: see [[host-layer]]
- Project-map bootstrap: see [[context-bootstrap]]
- Should `ToolSpec.inputSchema` use Zod's `z.toJSONSchema()` output type instead of `Record<string, unknown>`?
- Discussion schema details — `session.ts` redesign; cross-session snapshot semantics
- User/org/team model and its impact on discussions and permissions

## Resolved Questions

See [[protocol-design/research/superseded]] for archived bulk list. Key current resolutions:

- Unified event log (User* + Engine*); SQ/EQ superseded
- SQLite event log; MemoryEventLog superseded
- 3-tier Mesh architecture; Zod-first protocol with tRPC (Proto-first IDL / gRPC / ConnectRPC superseded — proto is a future TransportFactory option for polyglot daemons)
- Discussion model: `Discussion { partIDs: PartID[] }` overlay; parts oblivious to membership
- `PartBase { partID, excluded }` on every part
- Append-only tool call parts; three persisted statuses: pending, completed, error
- Checkpoints are bookmarks, not snapshots
- Context creation: checkpoint → active messages → filter excluded parts → LLM payload
- Command editing option B (cache-safe)
- Mesh built-in natively, 3-tier runtime from v1
