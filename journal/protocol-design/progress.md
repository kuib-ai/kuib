# Progress: Protocol Design

## Status: IN PROGRESS

## Completed

- [x] Research: XState v5 assessment → rejected (overkill, agent loop is a while loop)
- [x] Research: LangGraph type system → stole reducer-annotated state + checkpoint patterns
- [x] Research: Vercel AI SDK provider architecture → LanguageModelV3, streamText, fullStream events, tool system
- [x] Research: OpenCode codebase → provider schema, message-v2 (Zod), transform layer, llm.ts, processor
- [x] Research: OpenTUI → Zig native core, SolidJS/React reconcilers, powers OpenCode in production
- [x] Research: TS 7.0 beta (`tsgo`) → supports `-b` build mode, `--builders` for parallel, full JS emit
- [x] Package setup: `packages/protocol/` with pnpm, tsconfig (`composite`, `NodeNext`), `tsgo -b` build
- [x] Dependency layout: `zod` in package deps, `@typescript/native-preview` at workspace root only
- [x] `id.ts` — 10 branded ID types via `z.string().brand()`
- [x] `message.ts` v1 — initial implementation of all types
- [x] `session.ts` — Discussion, Session, GitState, Checkpoint, CheckpointState, ResumptionStrategy (3 modes)
- [x] `provider.ts` — AuthModel, ModelCapabilities, ModelLimits, ModelInfo, ModelContentPart, ModelMessage, StreamChunk + LanguageModel/Provider/ProviderRegistry interfaces
- [x] `submission.ts` — 14 submission types in discriminated union
- [x] `event.ts` — 22 event types in discriminated union
- [x] `tool.ts` — ToolSpec, ToolCall, ToolResult, ToolError schemas + ToolExecutor/ToolRegistry interfaces
- [x] `io.ts` — FileSystem, Shell, Network, IOContext interfaces (pure DI contracts)
- [x] `security.ts` — Operation/Target enums, score matrices, CommandEffect, RiskAssessment, SecurityVerdict, SecurityProfile, ApprovalState, 3 built-in profiles
- [x] `state.ts` — Reducer type, 5 built-in reducers, StateField<T> with Zod schema, SESSION_STATE definition, applyUpdate/createState/validateState utilities
- [x] `transport.ts` — Transport, TransportFactory (in-process/WebSocket/mesh), SessionTransport interfaces
- [x] `index.ts` — barrel export of all schemas + types + interfaces
- [x] Typecheck passes: both `tsc` and `tsgo`
- [x] Build passes: `tsgo -b` emits `.js` + `.d.ts` + `.d.ts.map` + `.js.map`
- [x] Dropped `tsc` from build — protocol uses `tsgo` exclusively
- [x] tsbuildinfo moved to `dist/` (build artifact, not source)
- [x] Full design rationale documented for all 11 modules

## In Progress — Protocol Review & Refinement (2026-04-23)

- [x] `message.ts` v2 — major redesign:
  - [x] Native TS enums for all discriminators (PartTypeEnum, ToolCallStatusEnum, etc.)
  - [x] Removed `ToolCallRunning` from persisted state (event-only)
  - [x] Split `ToolCallCompleted` into normal/subagent via discriminated union on `kind`
  - [x] Split `AssistantMessage` into success/error via discriminated union on `status`
  - [x] Base schema with `.extend()` for AssistantMessage variants — no field duplication
  - [x] `StepBoundaryPart` with nested discriminated union (start/stop on `kind`)
  - [x] `ModelRef` on `StepBoundaryStopPart` for per-step model tracking
  - [x] Removed `CompactionPart` and `StepBoundary` as separate Part types → `StepBoundaryPart` stays, `CompactionPart` gone
  - [x] Removed `parentID`, `finishReason`, `tokens`, `cost`, `model` from AssistantMessage
  - [x] Removed `model` from UserMessage
  - [x] Removed `MessageWithParts` (redundant)
  - [x] Removed `variant` field (unclear purpose)
  - [x] Added `StepBoundaryStopReasonEnum.NORMAL` for normal LLM completion
- [x] `message.ts` v2 review decisions (2026-04-23):
  - [x] Decided: remove `metadata` from all 6 schemas (no consumer, bypasses Zod)
  - [x] Decided: remove `input` from state variants (keep only on ToolCallPart)
  - [x] Decided: remove `startedAt` from ToolCallError (contradicts append-only)
  - [x] Decided: NOT add `startedAt` to ToolCallCompleted (same reason)
  - [x] Decided: remove `title` from ToolCallCompletedBase (tool name on ToolCallPart.tool)
  - [x] Decided: `RUNNING` was never in ToolCallStatusEnum — stale TODO
  - [x] Decided: `ToolCallErrorReasonEnum` with 4 values (cancelled/rejected/interrupted/failed)
  - [x] Decided: no dangling pendings — every pending gets completed or error resolution
  - [x] Decided: tool results land between StepBoundaryStopPart and next StepBoundaryStartPart
  - [x] Documented: interrupt handling patterns (mid-stream + mid-execution) with parts array examples
  - [x] Researched: codex/opencode/claude-code all converge on synthetic error for interrupted tool calls
- [x] `message.ts` v3 — finalized (2026-04-24):
  - [x] Renamed `ToolCallCompletedKindEnum` → `ToolCallKindEnum` (shared between completed/error)
  - [x] `ToolCallErrorReasonEnum` added to code (cancelled/rejected/interrupted/failed)
  - [x] ToolCallError split into normal/subagent (mirrors ToolCallCompleted for token tracking on errored subagents)
  - [x] `input`/`title` moved to `ToolCallPending` state, off `ToolCallPart`
  - [x] `ToolCallPart` is now `{ type, callID, tool, state }` — clean
  - [x] `metadata` removed from all schemas
  - [x] `synthetic` removed from TextPart (use `excluded` or checkpoint active set instead)
  - [x] `MessageError` removed — error kinds inlined as discriminated union on `AssistantMessageError`
  - [x] `AssistantMessageErrorKindEnum`: API (with statusCode), CONTEXT_OVERFLOW, UNKNOWN
  - [x] `ABORTED` removed — derivable from StepBoundaryStopPart reason
  - [x] `OUTPUT_LENGTH` removed — not an error, derivable from stop reason LENGTH
  - [x] `retryable` removed — derived function, not stored
  - [x] `error: z.string()` required on all error variants (transparency, debugging, issue reports)
  - [x] `StepBoundaryStopReasonEnum` expanded: added LENGTH, CONTENT_FILTER (maps to AI SDK finishReason)
  - [x] `MessageBase` for shared fields, `MessageUser`/`MessageAssistantBase` extend it
  - [x] Base schemas non-exported, only variants exported
  - [x] Type exports co-located with schemas
  - [x] `_version: z.literal(1)` on MessageBase — schema versioning at persistence boundary
  - [x] `excluded: z.boolean()` on PartBase — per-part exclusion (all parts, not just TextPart)
  - [x] `PartBase { partID, excluded }` — every part extends it, stable identity for discussions
  - [x] `PartUser` / `PartAssistant` separation — implemented, type-enforced
  - [x] Naming: Part prefix (PartText, PartFile), Message prefix (MessageUser, MessageAssistant)
  - [x] All other files deleted — rebuilding one at a time from message.ts foundation

## Next — Rebuild Protocol Files (2026-04-25)

All files except `id.ts` and `message.ts` were deleted. Rebuilding deliberately, one at a time. Design decisions captured in `decisions.md` first, then code.

### Mesh decisions affecting the rebuild (2026-04-25)

- Mesh is **tool dispatch only**, not session migration. Engine never moves; one session = one home device.
- `ResumptionStrategy` machinery **dropped entirely** from `session.ts`. Cross-device continuity = git + model orchestration.
- Protocol carries mesh-ready fields from day one (zero cost). Mesh runtime ships in v1.x — agent loop must be solid first.
- Per-device `SecurityProfile`. Risk = commandRisk × deviceProfile[targetDevice]. Approval shows target device.

### Rebuild list

- [x] `event.ts` design v1 — 24 events, four reference scopes
- [x] `event.ts` design v2 (2026-04-26) — revised after message.ts review:
  - [x] Replaced "Turn lifecycle" with "Message lifecycle" (MessageStarted/MessageCompleted/MessageFailed) — message IS the turn for assistants
  - [x] Added approval lifecycle events: `ToolApprovalGranted`, `ToolApprovalDenied` (separate from `ToolApprovalRequired`)
  - [x] Added `MessageVersionCreated` event for explicit version tracking
  - [x] Dropped `PartUpdated`/`PartRemoved` — parts append-only within a version, edits create new version
  - [x] `ToolCallRequested` carries `verdict` to persist on the pending part
  - [x] Confirmed: `RetryAttempt` ephemeral; future enhancement to persist as paired step boundaries with reason: aborted
- [x] `event.ts` design v3 (2026-04-28) — unified event log architecture, supersedes SQ/EQ:
  - [x] Single `Event` union with `User*` (was Submissions) + `Engine*` variants
  - [x] `EventEnvelope.originDeviceID` REQUIRED — multi-actor producers
  - [x] Engine = sole writer + sequencer; validates origin against event kind
  - [x] Atomic commit: per-event durable append to event log; persistence batched at checkpoint boundaries
  - [x] Event log canonical; messages = fast-read derivable view
  - [x] `MemoryEventLog` superseded — v1 uses SQLite-backed durable log
  - [x] Race conditions: serial processor + edit locks via persistent state machine + `EngineEventRejected` for stale/conflict
  - [x] Collapsed `MessageStarted`/`MessageCompleted`/`MessageFailed` into single `EngineMessageFinalized` (success/error union)
- [x] `message.ts` amendment — `originDeviceID: DeviceID` added to `MessageUser` (commit 5065581)
- [x] Approval state persistence design (2026-04-28) — `ApprovalState` on `ToolCallPending` (append-on-state-change). Cross-consumer durability via `counting-down { expiresAt }` + `editing { by, since }` + `awaiting` + `approved`. Denied/cancelled materialize as terminal error parts. Blocked on `security.ts` for `SecurityVerdict` schema.
- [ ] `event.ts` code — write Zod schemas matching the revised v3 taxonomy
- [ ] `session.ts` — `Discussion { id, partIDs: PartID[], ... }` overlay model; drop `ResumptionStrategy` (superseded). `SessionDiscussionRef` snapshot semantics TBD.
- [ ] Discussions UX — schema-only in protocol; UX spec in [[discussions-ux]]
- [ ] Journal restructure (2026-06-18) — superseded content moved to [[protocol-design/research/superseded]]
- [x] ~~`submission.ts`~~ — **superseded** (2026-04-28). User-actor events live in `event.ts`. No separate module.
- [ ] `provider.ts` — rebuild (may be unchanged from v1)
- [ ] `tool.ts` — rebuild with `ToolSpec.executionTargets: "local" | "remote-allowed" | "remote-only"`
- [ ] `io.ts` — rebuild local impls only; remote impls deferred to v1.x mesh runtime
- [ ] `security.ts` — per-device profiles, target-device-aware risk score and approval prompt
- [ ] `state.ts` — rebuild aligned with new checkpoint/message model
- [ ] `transport.ts` — `EventEnvelope`, `EventLog` interface, `MemoryEventLog`. Mesh transport deferred to v1.x.
- [ ] `index.ts` — barrel export after all files rebuilt

## Remaining

- [ ] Finalize TUI framework decision (OpenTUI + SolidJS reconciler vs custom)
- [ ] Build engine package (`packages/engine/`) — agent loop, state management
- [ ] Build provider adapters (`packages/providers/`) — Anthropic, OpenAI, OpenRouter wrapping AI SDK
- [ ] Build tools package (`packages/tools/`) — file read/write, shell exec, search, etc.
- [ ] Build TUI package (`packages/tui/`) — vim keybindings, modal navigation
- [ ] Build CLI entry point (`apps/cli/`)
