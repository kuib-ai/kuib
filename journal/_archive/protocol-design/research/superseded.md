# Superseded Protocol Decisions

Historical decisions and rejected approaches. **Current truth** is in [[protocol-design/decisions]].

## SQ/EQ Separation (Superseded 2026-04-28)

**Was:** Separate submission queue (SQ) and event queue (EQ) — codex-inherited asymmetric 1-user-1-engine model.

**Why superseded:** Bakes in asymmetric model; awkward for multi-device / multi-actor coordination.

**Replaced by:** Unified event log — one `Event` union with `User*` and `Engine*` variants. Engine is sole writer + sequencer. `submission.ts` dropped; user-actor events live in `event.ts`.

## MemoryEventLog (Superseded 2026-04-28)

**Was:** In-memory event log for v1.

**Why superseded:** Multi-consumer coordination and crash recovery require durability from day one.

**Replaced by:** SQLite-backed durable event log per session. Event log is canonical recovery surface.

## ResumptionStrategy Enum (Superseded 2026-04-25)

**Was:** Three strategies — `remote`, `recover`, `context-only` — for continuing sessions across devices.

**Why superseded:** Protocol overreach; git workflow + model orchestration handles workspace continuity.

**Rejected approaches:**

- ~~`recover`~~ — checkout same git state on new device
- ~~`context-only`~~ — resume from conversation, accept different file state
- ~~Engine migration between devices~~
- ~~Cross-device event replay / multi-device TUI observation~~

**Replaced by:** Mesh as tool execution transport only. One session = one home device. "Continue from phone" = TUI connects to home engine. See [[protocol-design]] Mesh Architecture section.

## Event Envelope Evolution

**Interim (dropped):** `EventEnvelope` without `originDeviceID`; `causationID` considered.

**Current:** `originDeviceID: DeviceID` REQUIRED on envelope — multi-actor system. No `causationID` — `seq + sessionID` sufficient.

## Event Taxonomy — Dropped Items

- `TurnAborted` — derivable from `StepBoundaryStopPart.reason === INTERRUPTED`
- `PartUpdated` / `PartRemoved` — append-only; edits create new message version
- `PartFinalized` — redundant with step boundaries / terminal tool events

## XState v5 — Rejected

Agent loop is fundamentally a while loop. XState adds ceremony for linear flow. Persistence trivially implementable with Zod (~50 lines). `@statelyai/agent` near-zero adoption.

## Archived Resolved Questions (Bulk)

Earlier resolved items retained for archaeology. Current resolved list in [[protocol-design/decisions]] is authoritative.

- ToolCallPart uses Anthropic content-block approach (not OpenAI `tool_calls` array)
- `CompactionPart`, `ContextCompacted` event removed
- `ToolCallRunning` event-only, not persisted
- `parentID`, `finishReason`, `tokens`, `cost` removed from AssistantMessage
- `MessageWithParts` removed; checkpoints are bookmarks not snapshots
- `metadata` removed from all schemas
- Command editing option B (cache-safe)
- Part prefix / Message prefix naming convention
- Event taxonomy locked (24 events) — see current event.ts for latest
- Tool approval flow: one event with nested `kind` discriminator

## Contradiction Note

Some older resolved bullets in the original monolithic `decisions.md` referenced envelope fields since reinstated (`originDeviceID`). This file preserves history; **decisions.md current sections override**.
