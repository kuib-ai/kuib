---
domain: core
summary: Agent loop, protocol schemas, event log, tools, daemon and engine-service.
code: ["packages/{engine,engine-service,protocol,transcript,tools,event-log-sqlite,daemon}/**"]
---

# Core

## Packages and boundaries

Core is seven workspace packages. `@kuib-ai/protocol` holds the schemas and port interfaces.
`@kuib-ai/tools` holds the tool definitions. `@kuib-ai/engine` is the agent-loop library:
orchestrator, providers, context building, the daemon client, an in-memory event log and mesh
discovery. `@kuib-ai/engine-service` is the long-lived process that runs turns behind a unix
socket. `@kuib-ai/event-log-sqlite` is the durable event log. `@kuib-ai/daemon` is the node-local
fs/shell executor served over tRPC. `@kuib-ai/transcript` folds the event log into display
entries. Dependencies point one way. Protocol depends only on `zod`. Tools depend on protocol.
The daemon depends on protocol, config and std. The engine depends on protocol, tools and std,
and uses the daemon only for its router type. engine-service imports protocol and std, and
receives the engine through an injected `runTurn`. ^core-packages

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/package.json` › "schemas, events, and interfaces"
> - `packages/tools/package.json` › "single source of truth, backed by protocol interfaces"
> - `packages/engine/package.json` › "agent loop, event log, daemon dispatch"
> - `packages/engine-service/package.json` › "process host for the agent loop"
> - `packages/event-log-sqlite/package.json` › "@kuib-ai/event-log-sqlite"
> - `packages/daemon/package.json` › "kuib node-local fs/shell executor (tRPC)"
> - `packages/transcript/package.json` › "display entries, shared by host adapters"
> - `packages/engine/src/daemon.client/transport.factory/index.ts` › "import type { DaemonRouter } from "@kuib-ai/daemon/daemon.router";"
> - why: [[domains/core/decisions#^D001]]
> - why: [[domains/core/decisions#^D015]]
> - from: [[_archive/architecture-overview/decisions#Package Dependency Flow]]

Each package has a barrel at `src/index.ts` that default-exports one namespace object:
`Protocol`, `Engine`, `EngineService`, `EventLogSqlite`, `Daemon`, `Tools` or `Transcript`.
Sub-barrels group related units, for example `Engine.Provider`, `Engine.Mesh`,
`Engine.EventLog` and `Engine.DaemonClient`. Every unit lives in its own dot-case directory as
`index.ts`. The `"./*": "./src/*/index.ts"` export lets a consumer import a single unit or type
by subpath. ^package-barrels

> [!sources]- structure · verified 2026-09-23
> - `packages/daemon/src/index.ts` › `Daemon` · #cee1fafa
> - `packages/engine-service/src/index.ts` › `EngineService` · #7873c5ec
> - `packages/engine/src/daemon.client/index.ts` › `DaemonClient` · #854366ac
> - `packages/engine/src/event.log/index.ts` › `EventLog` · #d4997298
> - `packages/engine/src/index.ts` › `Engine` · #ccb30404
> - `packages/engine/src/mesh/index.ts` › `Mesh` · #28bc6363
> - `packages/engine/src/provider/index.ts` › `Provider` · #0477c345
> - `packages/event-log-sqlite/src/index.ts` › `EventLogSqlite` · #79e1f38f
> - `packages/protocol/src/index.ts` › `Protocol` · #70cedeed
> - `packages/tools/src/index.ts` › `Tools` · #544fdf91
> - `packages/transcript/src/index.ts` › `Transcript` · #62871a58
> - `packages/engine/package.json` › ""./*": "./src/*/index.ts""

Every core package except protocol runs its tests with `deno test -A --no-check` and
typechecks with `tsgo --noEmit`. Tests sit next to their unit as `index.test.ts`, import from
`@std/testing/bdd` and `@std/expect`, and pass fakes as parameters rather than mocking modules.
Orchestrator tests drive `MockLanguageModelV3` streams and assert on events in a memory event
log. ^core-tests-typecheck

> [!sources]- structure · verified 2026-09-23
> - `packages/engine/package.json` › ""test": "deno test -A --no-check""
> - `packages/daemon/package.json` › ""typecheck": "tsgo --noEmit""
> - `packages/engine/src/orchestrator/index.test.ts` › "import { MockLanguageModelV3, simulateReadableStream } from "ai/test";"
> - why: [[domains/core/decisions#^D030]]
> - from: [[_archive/testing-strategy/decisions#Package-specific idioms]]

## Protocol: identifiers and enums

The protocol defines 11 IDs, each a branded, non-empty Zod string: `SessionID`, `MessageID`,
`PartID`, `ThreadID`, `DiscussionID`, `ToolCallID`, `ProviderID`, `ModelID`, `DeviceID`,
`CheckpointID` and `NodeID`. The engine mints them with `newID(schema)`, which parses a
`randomUUID()` through the schema. ^protocol-ids

> [!sources]- structure · verified 2026-09-23
> - `packages/engine/src/new.id/index.ts` › `newID` · #680187bf
> - `packages/protocol/src/id/checkpoint.id/index.ts` › `CheckpointID` · #ec2699a3
> - `packages/protocol/src/id/device.id/index.ts` › `DeviceID` · #3fa2d873
> - `packages/protocol/src/id/discussion.id/index.ts` › `DiscussionID` · #37476c00
> - `packages/protocol/src/id/index.ts` › `ID` · #627c4d07
> - `packages/protocol/src/id/message.id/index.ts` › `MessageID` · #385fafad
> - `packages/protocol/src/id/model.id/index.ts` › `ModelID` · #ec0cfb90
> - `packages/protocol/src/id/node.id/index.ts` › `NodeID` · #7ed8c150
> - `packages/protocol/src/id/part.id/index.ts` › `PartID` · #6c577ff3
> - `packages/protocol/src/id/provider.id/index.ts` › `ProviderID` · #372ec0fb
> - `packages/protocol/src/id/session.id/index.ts` › `SessionID` · #67b11e01
> - `packages/protocol/src/id/thread.id/index.ts` › `ThreadID` · #4ad21818
> - `packages/protocol/src/id/tool.call.id/index.ts` › `ToolCallID` · #c8b87e1f
> - test: `packages/engine/src/new.id/index.test.ts` › "returns a schema-valid UUID"
> - why: [[domains/core/decisions#^D003]]
> - from: [[_archive/protocol-design/decisions#Design Principles]]

Every discriminator value is a native TS enum member. Schemas use `z.literal(Enum.X)` or
`z.enum(Enum)`, and consumers switch on the same enums. ^protocol-enums

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/endpoint/endpoint.kind.enum/index.ts` › `EndpointKindEnum` · #cea19557
> - `packages/protocol/src/error/error.code.enum/index.ts` › `ErrorCodeEnum` · #3c35f4cf
> - `packages/protocol/src/event/event.type.enum/index.ts` › `EventTypeEnum` · #ea7dcf2c
> - `packages/protocol/src/message/message.role.enum/index.ts` › `MessageRoleEnum` · #56351590
> - `packages/protocol/src/part/part.type.enum/index.ts` › `PartTypeEnum` · #5f9f952f
> - `packages/protocol/src/service.message/service.message.type.enum/index.ts` › `ServiceMessageTypeEnum` · #29f593f7
> - why: [[domains/core/decisions#^D002]]
> - from: [[_archive/protocol-design/decisions#Native TS Enums for All Discriminators]]

## Protocol: events and envelope

`AnyEvent` is a union discriminated on `type` with 13 variants:

- **Message lifecycle:** `user-message-submitted` (with `PartUser[]`), `message-started`,
  `message-updated` (embeds an `AnyMessage`), `message-completed`, `message-failed` (with an
  error string).
- **Steps:** `step-started`, and `step-finished` (with stop reason, `ModelRef` and `TokenUsage`).
- **Deltas:** `text-delta` and `reasoning-delta`, both `{ messageID, partID, delta }`.
- **Tool calls:** `tool-call-started` (optional name and JSON input string),
  `tool-call-output-delta`, `tool-call-completed` and `tool-call-failed`. Completed and failed
  carry a `kind` plus optional model and tokens, and failed also carries a reason enum.

The engine never emits `message-updated` or `tool-call-output-delta`. ^protocol-events

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/event/event.any/index.ts` › `AnyEvent` · #d3e84a2b
> - `packages/protocol/src/event/index.ts` › `Event` · #29dcc93c
> - `packages/protocol/src/event/message.completed/index.ts` › `MessageCompleted` · #69cf4f8b
> - `packages/protocol/src/event/message.failed/index.ts` › `MessageFailed` · #6628da95
> - `packages/protocol/src/event/message.started/index.ts` › `MessageStarted` · #9ff67b64
> - `packages/protocol/src/event/message.updated/index.ts` › `MessageUpdated` · #0994b479
> - `packages/protocol/src/event/reasoning.delta/index.ts` › `ReasoningDelta` · #5d527549
> - `packages/protocol/src/event/step.finished/index.ts` › `StepFinished` · #e1c24446
> - `packages/protocol/src/event/step.started/index.ts` › `StepStarted` · #ac67c8d6
> - `packages/protocol/src/event/text.delta/index.ts` › `TextDelta` · #e6efe746
> - `packages/protocol/src/event/tool.call.completed/index.ts` › `ToolCallCompleted` · #e3222f43
> - `packages/protocol/src/event/tool.call.failed/index.ts` › `ToolCallFailed` · #fc52f1f4
> - `packages/protocol/src/event/tool.call.output.delta/index.ts` › `ToolCallOutputDelta` · #903564c1
> - `packages/protocol/src/event/tool.call.started/index.ts` › `ToolCallStarted` · #39a7f8dd
> - `packages/protocol/src/event/user.message.submitted/index.ts` › `UserMessageSubmitted` · #7a6514f1
> - why: [[domains/core/decisions#^D004]]
> - why: [[domains/core/decisions#^D006]]
> - why: [[domains/core/decisions#^D007]]
> - from: [[_archive/protocol-design/decisions#Event Taxonomy — Revised (2026-04-26)]]

Every stored event is wrapped in an `EventEnvelope` with `_version: 1`, integer `epoch` and
`seq`, `sessionID`, `originDeviceID` and `createdAt`. The envelope is the only versioned layer
of the event stream; event variants carry no version of their own. ^event-envelope

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/event/event.envelope/index.ts` › `EventEnvelope` · #849657c4
> - why: [[domains/core/decisions#^D004]]
> - why: [[domains/core/decisions#^D005]]
> - from: [[_archive/protocol-design/decisions#Versioning boundaries (2026-06-30)]]

## Protocol: parts, tool-call state and messages

Every part extends `PartBase { partID, excluded }`. `PartUser` is text | file. `PartAssistant` is
text | reasoning | file | tool-call | step-boundary. `AnyPart` is the union of both. A
step-boundary part is a nested union on `kind`. `step-start` is bare. `step-stop` carries a
`StepBoundaryStopReasonEnum` (`interrupted | tool-call-request | normal | length |
content-filter`), a `ModelRef` and `TokenUsage`. A tool-call part is `{ callID, tool, state }`. ^protocol-parts

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/part/index.ts` › `Part` · #d5409962
> - `packages/protocol/src/part/part.any/index.ts` › `AnyPart` · #752f30a5
> - `packages/protocol/src/part/part.assistant/index.ts` › `PartAssistant` · #3fef1056
> - `packages/protocol/src/part/part.base/index.ts` › `PartBase` · #4a1fce8e
> - `packages/protocol/src/part/part.file/index.ts` › `PartFile` · #0dc730e3
> - `packages/protocol/src/part/part.reasoning/index.ts` › `PartReasoning` · #cc323eac
> - `packages/protocol/src/part/part.step.boundary/index.ts` › `PartStepBoundary` · #43bcb1e2
> - `packages/protocol/src/part/part.text/index.ts` › `PartText` · #e8f7449f
> - `packages/protocol/src/part/part.tool.call/index.ts` › `PartToolCall` · #7327ed33
> - `packages/protocol/src/part/part.user/index.ts` › `PartUser` · #4c9c5f4e
> - `packages/protocol/src/part/step.boundary.kind.enum/index.ts` › `StepBoundaryKindEnum` · #84d3e946
> - `packages/protocol/src/part/step.boundary.stop.reason.enum/index.ts` › `StepBoundaryStopReasonEnum` · #cdc0ae1b
> - why: [[domains/core/decisions#^D009]]
> - from: [[_archive/protocol-design/decisions#Part Types — Content + Step Boundaries]]

`ToolCallState` is discriminated on `status`:

- **`pending`:** carries the input record, a title and `startedAt`.
- **`completed`:** carries output and `completedAt`, and is discriminated on `kind`.
- **`error`:** carries an error string, a `ToolCallErrorReasonEnum` (`failed | interrupted |
  cancelled | rejected`) and `completedAt`, and is discriminated on `kind`.

For completed and error states, `kind` is `normal` or `subagent`, and the `subagent` variants
also require a `ModelRef` and `TokenUsage`. ^tool-call-states

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/tool.call/index.ts` › `ToolCall` · #117912bb
> - `packages/protocol/src/tool.call/tool.call.completed/index.ts` › `ToolCallCompleted` · #3862b2c1
> - `packages/protocol/src/tool.call/tool.call.error.reason.enum/index.ts` › `ToolCallErrorReasonEnum` · #50011f65
> - `packages/protocol/src/tool.call/tool.call.error/index.ts` › `ToolCallError` · #28914167
> - `packages/protocol/src/tool.call/tool.call.kind.enum/index.ts` › `ToolCallKindEnum` · #12d542ec
> - `packages/protocol/src/tool.call/tool.call.pending/index.ts` › `ToolCallPending` · #7cde566b
> - `packages/protocol/src/tool.call/tool.call.state/index.ts` › `ToolCallState` · #51fc4d59
> - `packages/protocol/src/tool.call/tool.call.status.enum/index.ts` › `ToolCallStatusEnum` · #7e81f4b9
> - why: [[domains/core/decisions#^D008]]
> - from: [[_archive/protocol-design/decisions#Tool Call Parts — Append-Only, No Mutation]]
> - from: [[_archive/protocol-design/decisions#Tool Call Error — Reason Enum]]
> - from: [[_archive/protocol-design/decisions#Tool Call Kind — Normal vs Subagent]]

`MessageBase` has `_version: 1`, `id`, `sessionID`, `discussionID` and `createdAt`. `MessageUser`
adds `PartUser[]` and a required `originDeviceID`. `MessageAssistant` is discriminated on
`status`. A `success` message has `completedAt`. An `error` message is further discriminated on
`kind`: `api` (with `statusCode`), `context_overflow` or `unknown`. `AnyMessage` is discriminated
on `role`. No code outside the protocol uses them. Inside it, the never-emitted
`message-updated` event embeds `AnyMessage`, and `llm.failed` reuses the assistant error-kind
enum. ^protocol-messages

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/message/index.ts` › `Message` · #157b5f05
> - `packages/protocol/src/message/message.any/index.ts` › `AnyMessage` · #d7fde7e3
> - `packages/protocol/src/message/message.assistant.error.kind.enum/index.ts` › `MessageAssistantErrorKindEnum` · #e60703b6
> - `packages/protocol/src/message/message.assistant.error/index.ts` › `MessageAssistantError` · #c7bf79cc
> - `packages/protocol/src/message/message.assistant.status.enum/index.ts` › `MessageAssistantStatusEnum` · #e764b385
> - `packages/protocol/src/message/message.assistant/index.ts` › `MessageAssistant` · #402f3e5a
> - `packages/protocol/src/message/message.base/index.ts` › `MessageBase` · #6c1e579c
> - `packages/protocol/src/message/message.user/index.ts` › `MessageUser` · #37b270c4
> - why: [[domains/core/decisions#^D005]]
> - from: [[_archive/protocol-design/decisions#Message Format — Finalized (v3, 2026-04-25)]]
> - from: [[_archive/protocol-design/decisions#MessageUser.originDeviceID (2026-04-25)]]

`ModelRef` is `{ providerID, modelID }`. `TokenUsage` is `{ input, output, reasoning?, cache?:
{ read, write } }`, all integers. ^model-ref-usage

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/model.ref/index.ts` › `ModelRef` · #03d7393d
> - `packages/protocol/src/token.usage/index.ts` › `TokenUsage` · #6d6eddd3
> - from: [[_archive/protocol-design/decisions#Step Boundaries — Per-Step Model Tracking]]

`AnyError` is a union discriminated on `code`. Every variant extends `ErrorBase { message,
details? }`. The variants are `unknown`, `config.invalid` (optional `key`),
`daemon.unreachable` (optional `endpoint`), `tool.failed` (reason enum, optional `callID`) and
`llm.failed` (optional assistant error kind and `statusCode`). `@kuib-ai/std` uses `AnyError` as
the default error type of its `Result` tuples and to decode errors in its logging. ^protocol-errors

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/error/error.any/index.ts` › `AnyError` · #d1ec9af2
> - `packages/protocol/src/error/error.base/index.ts` › `ErrorBase` · #5d539d49
> - `packages/protocol/src/error/error.config.invalid/index.ts` › `ErrorConfigInvalid` · #6b811bd5
> - `packages/protocol/src/error/error.daemon.unreachable/index.ts` › `ErrorDaemonUnreachable` · #218d11d9
> - `packages/protocol/src/error/error.llm.failed/index.ts` › `ErrorLlmFailed` · #76d628d6
> - `packages/protocol/src/error/error.tool.failed/index.ts` › `ErrorToolFailed` · #1ff00d1d
> - `packages/protocol/src/error/error.unknown/index.ts` › `ErrorUnknown` · #17db8b6f
> - `packages/protocol/src/error/index.ts` › `Error` · #b89ab825

## Protocol: ports, transport shapes and config

Behavioural contracts are type-only interfaces in `*.port` modules:

- **`EventLogPort`:** `append(sessionID, originDeviceID, event) → Promise<EventEnvelope>`,
  `replay(sessionID, afterSeq, handler)`, and `subscribe(sessionID, handler, afterSeq?) →
  Unsubscribe`.
- **`FileSystemPort`:** `readFile` and `readDir`.
- **`DiscoveryPort`:** `listNodes` and `resolve(nodeID)`. ^protocol-ports

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/discovery.port/index.ts` › `DiscoveryPort` · #5816f32b
> - `packages/protocol/src/event.log.port/index.ts` › `EventLogPort` · #26bb2d3d
> - `packages/protocol/src/file.system.port/index.ts` › `FileSystemPort` · #8020f1bc
> - why: [[domains/core/decisions#^D003]]
> - from: [[_archive/protocol-design/decisions#Design Principles]]

The file-system I/O schemas are `ReadFileInput` and `ReadDirInput` (`{ path }`, non-empty), and
`ReadFileOutput` and `ReadDirOutput` (`{ content }`). The tools, the port and the daemon's read
procedures all share these schemas. ^fs-io-schemas

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/file.system/index.ts` › `FileSystem` · #00d50cc6
> - `packages/protocol/src/file.system/read.dir.input/index.ts` › `ReadDirInput` · #d47809a9
> - `packages/protocol/src/file.system/read.dir.output/index.ts` › `ReadDirOutput` · #74d41f4e
> - `packages/protocol/src/file.system/read.file.input/index.ts` › `ReadFileInput` · #f6e1bb1b
> - `packages/protocol/src/file.system/read.file.output/index.ts` › `ReadFileOutput` · #9cb8fd74
> - why: [[domains/core/decisions#^D012]]
> - from: [[_archive/protocol-design/decisions#Tool-call backends — where the pieces live (2026-07-01)]]

`AnyEndpoint` is a union discriminated on `kind`: `unix` (`socketPath`) or `tcp` (`url`).
`NodeDescriptor` is `{ nodeID, osUser, machineID, capabilities (default []), endpoint? }`. ^endpoints

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/endpoint/endpoint.any/index.ts` › `AnyEndpoint` · #cb452e4d
> - `packages/protocol/src/endpoint/index.ts` › `Endpoint` · #0615d556
> - `packages/protocol/src/endpoint/tcp.endpoint/index.ts` › `TcpEndpoint` · #aae9c9f7
> - `packages/protocol/src/endpoint/unix.endpoint/index.ts` › `UnixEndpoint` · #9404edf2
> - `packages/protocol/src/node/index.ts` › `Node` · #d8e51903
> - `packages/protocol/src/node/node.descriptor/index.ts` › `NodeDescriptor` · #66de7148
> - why: [[domains/core/decisions#^D028]]
> - from: [[_archive/distributed-mesh-state/decisions#Implementation status — Layer 1 (node resolution seam) — DONE]]

The engine-service control protocol is `ServiceMessageAny`, a union discriminated on `type`:
`submit { sessionID, prompt }` and `interrupt { sessionID }`. ^service-control-protocol

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/service.message/index.ts` › `ServiceMessage` · #9d7ce17a
> - `packages/protocol/src/service.message/interrupt.message/index.ts` › `InterruptMessage` · #e5d7000c
> - `packages/protocol/src/service.message/service.message.any/index.ts` › `ServiceMessageAny` · #7fc56fe7
> - `packages/protocol/src/service.message/submit.message/index.ts` › `SubmitMessage` · #f89be124
> - why: [[domains/core/decisions#^D016]]

`ModelConfig` is flat: `npm`, `providerID`, `modelID`, `options` (optional `apiKey`, optional URL
`baseURL`, and any other keys), and `providerOptions` (a JSON record, default `{}`). ^model-config

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/src/provider/index.ts` › `Provider` · #b2b8069b
> - `packages/protocol/src/provider/model.config/index.ts` › `ModelConfig` · #ca507b61
> - why: [[domains/core/decisions#^D022]]
> - why: [[domains/core/decisions#^D024]]

`proto/kuib/v1/` holds proto3 definitions: a `DaemonService` with `ExecuteCommand`, `ReadFile`
and `WriteFile`, and message types that mirror the parts, tool-call states and messages. No
code generates from them, imports them or validates against them. The Zod schemas are the
contract. ^proto-definitions

> [!sources]- structure · verified 2026-09-23
> - `packages/protocol/proto/kuib/v1/daemon.proto` › "service DaemonService {"
> - `packages/protocol/proto/kuib/v1/message.proto` › "message ToolCallState {"
> - `packages/protocol/package.json` › ""zod": "catalog:""
> - why: [[domains/core/decisions#^D001]]
> - from: [[_archive/protocol-design/decisions#Package: `@kuib/protocol`]]

## Event log

The memory event log (`Engine.EventLog.createMemoryEventLog`) keeps one envelope array per
session. It assigns `seq` from the array length with `epoch` 0 and parses each envelope through
the schema. After each append it calls subscribers synchronously. `replay` delivers envelopes
with `seq > afterSeq`. `subscribe` with `afterSeq` replays first, then delivers live appends. ^memory-event-log

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/event.log/memory.event.log/index.ts` › `createMemoryEventLog` · #d0aad02a
> - test: `packages/engine/src/event.log/memory.event.log/index.test.ts` › "assigns monotonic seq from 0 with epoch 0 and stamps the envelope"
> - test: `packages/engine/src/event.log/memory.event.log/index.test.ts` › "subscribe with afterSeq replays past events then delivers live ones"
> - test: `packages/engine/src/event.log/memory.event.log/index.test.ts` › "stops delivering after unsubscribe"

The SQLite schema is one `events` table (`sessionID`, `epoch`, `seq`, `envelope` JSON text,
`createdAt`) with primary key `(sessionID, epoch, seq)`, created idempotently in WAL journal
mode. ^sqlite-schema

> [!sources]- structure · verified 2026-09-23
> - `packages/event-log-sqlite/src/schema/index.ts` › "PRAGMA journal_mode = WAL;"
> - `packages/event-log-sqlite/src/schema/index.ts` › "PRIMARY KEY (sessionID, epoch, seq)"
> - test: `packages/event-log-sqlite/src/schema/index.test.ts` › "creates the events table and is idempotent across repeated calls"
> - why: [[domains/core/decisions#^D010]]

The SQLite writer, `createSqliteEventLog(path)`, opens a `node:sqlite` `DatabaseSync`. Each
`append` runs inside a prepared `BEGIN IMMEDIATE` transaction: it computes the next `seq` as
`MAX(seq)+1` for the session at epoch 0, inserts the serialised envelope and commits. If
anything fails it rolls back and rethrows. Subscribers in the same process are notified only
after the commit. `replay` reads rows with `seq > afterSeq`, ordered by `epoch, seq`. ^sqlite-writer

> [!sources]- behaviour · verified 2026-09-23
> - `packages/event-log-sqlite/src/sqlite.event.log/index.ts` › `createSqliteEventLog` · #a2a4fc80
> - `packages/event-log-sqlite/src/sqlite.event.log/index.ts` › "BEGIN IMMEDIATE"
> - `packages/event-log-sqlite/src/sqlite.event.log/index.ts` › "SELECT COALESCE(MAX(seq), -1) + 1 AS next FROM events WHERE sessionID = ? AND epoch = ?"
> - test: `packages/event-log-sqlite/src/sqlite.event.log/index.test.ts` › "assigns monotonic seq from 0 and notifies subscribers"
> - test: `packages/event-log-sqlite/src/sqlite.event.log/index.test.ts` › "replays only events after the seq cursor in order"
> - test: `packages/event-log-sqlite/src/sqlite.event.log/index.test.ts` › "subscribe with afterSeq replays then delivers live appends"
> - why: [[domains/core/decisions#^D010]]
> - from: [[_archive/protocol-design/decisions#SQLite backing — `bun:sqlite` now, `node:sqlite` later (LOCKED 2026-07-01, supersedes runtime-adaptive)]]

The SQLite reader, `createSqliteReader(path, pollIntervalMs = 150)`, opens the database
read-only, and its `append` always rejects. `subscribe` polls rows by `rowid` on an interval.
With `afterSeq`, it starts from the highest rowid at or below that `seq` and drains
immediately. Without it, it starts at the current maximum rowid, so only new rows arrive.
Unsubscribing clears the interval. ^sqlite-reader

> [!sources]- behaviour · verified 2026-09-23
> - `packages/event-log-sqlite/src/read.sqlite.event.log/index.ts` › `createSqliteReader` · #a8f43ba1
> - `packages/event-log-sqlite/src/read.sqlite.event.log/index.ts` › "new DatabaseSync(path, { readOnly: true })"
> - test: `packages/event-log-sqlite/src/read.sqlite.event.log/index.test.ts` › "rejects append with a read-only error"
> - test: `packages/event-log-sqlite/src/read.sqlite.event.log/index.test.ts` › "subscribe without afterSeq only delivers events appended after subscription"
> - test: `packages/event-log-sqlite/src/read.sqlite.event.log/index.test.ts` › "subscribe with afterSeq replays from floor then tails new rows"
> - test: `packages/event-log-sqlite/src/read.sqlite.event.log/index.test.ts` › "cancel clears the interval so no further events arrive"
> - why: [[domains/core/decisions#^D016]]
> - from: [[_archive/host-layer/decisions#How the host gets read access]]

## Orchestrator

`runAgent` runs one turn inside a `Std.withScope` scope tagged with `sessionID`, `deviceID` and
`messageID`. The steps are:

1. Emit `USER_MESSAGE_SUBMITTED` for the prompt, then `MESSAGE_STARTED` for a new assistant
   `messageID`.
2. Build the tool map from `readFile` and `readDir`, bound to a daemon-backed `FileSystemPort`.
3. Rebuild the context from the log with `buildMessages`.
4. Call `streamText` with the model, messages, tools, an abort signal, telemetry and the
   caller's `providerOptions`.

Every event goes through `eventLog.append(sessionID, deviceID, event)`. ^agent-turn

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/orchestrator/index.ts` › `RunAgentParams` · #8459c56d
> - `packages/engine/src/orchestrator/index.ts` › `runAgent` · #8f87c989
> - `packages/engine/src/orchestrator/index.ts` › "telemetry: { isEnabled: true, functionId: "runAgent" }"
> - test: `packages/engine/src/orchestrator/index.test.ts` › "emits user-submitted -> started -> text-delta -> completed in order"
> - why: [[domains/core/decisions#^D020]]
> - why: [[domains/core/decisions#^D011]]

The orchestrator translates the AI SDK `fullStream` into events:

| Stream part | Event emitted |
| --- | --- |
| `start-step` | `STEP_STARTED` with a new `partID` |
| `finish-step` | `STEP_FINISHED` with the mapped stop reason, the caller's `modelRef`, and token usage (input, output, reasoning, cache read and write) |
| `text-delta` | `TEXT_DELTA` |
| `reasoning-delta` | `REASONING_DELTA` |
| `tool-call` | `TOOL_CALL_STARTED` with the tool name and JSON-encoded input |
| `tool-result` | `TOOL_CALL_COMPLETED` (`kind: normal`) |
| `tool-error` | `TOOL_CALL_FAILED` (`reason: failed`) |
| `error` | rethrown |

Finish reasons map as `stop` → `normal`, `tool-calls` → `tool-call-request`, `length` →
`length` and `content-filter` → `content-filter`. Any other reason maps to `interrupted`. ^finish-reasons

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/orchestrator/index.ts` › `STOP_REASONS` · #8ad37349
> - `packages/engine/src/orchestrator/index.ts` › `stopReason` · #1b9a3e31
> - test: `packages/engine/src/orchestrator/index.test.ts` › "maps a tool-call chunk to TOOL_CALL_STARTED carrying the call id"
> - test: `packages/engine/src/orchestrator/index.test.ts` › "maps reasoning-delta chunks to REASONING_DELTA events"
> - test: `packages/engine/src/orchestrator/index.test.ts` › "emits TOOL_CALL_FAILED when a tool execution fails"
> - why: [[domains/core/decisions#^D006]]
> - why: [[domains/core/decisions#^D012]]
> - from: [[_archive/tool-system/decisions#Tool lifecycle events come from the stream, not the tool]]

Every turn ends with a terminal event. A clean stream ends with `MESSAGE_COMPLETED`. A stream
error ends with a `⚠️ <message>` `TEXT_DELTA` followed by `MESSAGE_FAILED`, and no
`MESSAGE_COMPLETED`. `onAbort` gives the caller an abort function wired to the stream's
`AbortController`. An error that follows an abort is recorded as `MESSAGE_COMPLETED`, not as a
failure. ^turn-terminal-events

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/orchestrator/index.ts` › "⚠️ ${streamError.message}"
> - `packages/engine/src/orchestrator/index.ts` › "if (streamError && controller.signal.aborted) {"
> - test: `packages/engine/src/orchestrator/index.test.ts` › "on stream error emits a ⚠️ text-delta and MESSAGE_FAILED, then returns without MESSAGE_COMPLETED"
> - why: [[domains/core/decisions#^D007]]
> - why: [[domains/core/decisions#^D029]]
> - from: [[_archive/protocol-design/decisions#Terminal events — needed, not yet in the union (2026-07-01)]]

The loop has no step limit unless the caller passes `maxSteps`: `stopWhen` returns false when
it is omitted. ^step-limit

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/orchestrator/index.ts` › "if (params.maxSteps === undefined) {"
> - why: [[domains/core/decisions#^D025]]
> - from: [[_archive/provider-architecture/decisions#Agent loop is unguarded — `stopWhen` removed (2026-08-12)]]

Before each step, `prepareStep` drains `takePending()`. For each queued text it emits
`USER_MESSAGE_SUBMITTED` and appends a `{ role: "user" }` message to that step's messages. A
message typed mid-run therefore reaches the model at the next step boundary of the same
turn. ^mid-run-submits

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/orchestrator/index.ts` › "const pending = params.takePending?.() ?? [];"
> - test: `packages/engine/src/orchestrator/index.test.ts` › "drains pending user messages into the log and the step messages"
> - why: [[domains/core/decisions#^D018]]
> - from: [[_archive/host-layer/decisions#Turn scheduling — per-session queue + step-boundary steering (2026-07-02)]]

`buildMessages(eventLog, sessionID)` replays the session log twice. The first pass collects the
call IDs that have a completed or failed event. The second pass builds `ModelMessage[]`:

- User text parts are joined into a `user` message.
- Assistant text deltas accumulate per `messageID`. The accumulated text becomes an `assistant`
  message when a user message, tool call, message end or `messageID` switch interrupts it; empty
  text is dropped.
- A named tool call becomes an assistant `tool-call` only if it was resolved.
- A tool result becomes a `tool` message: `text` output when completed, `error-text` when
  failed.
- A completed result whose call was never replayed becomes a user message prefixed
  `[earlier tool result]`.

Reasoning deltas are not replayed. ^message-replay

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/build.messages/index.ts` › `buildMessages` · #2e95e113
> - `packages/engine/src/build.messages/index.ts` › "[earlier tool result]"
> - test: `packages/engine/src/build.messages/index.test.ts` › "folds a user message then accumulated text deltas into user/assistant messages"
> - test: `packages/engine/src/build.messages/index.test.ts` › "does not flush an assistant accumulator that has no text"
> - test: `packages/engine/src/build.messages/index.test.ts` › "flushes the current assistant when the messageID switches mid-stream"
> - why: [[domains/core/decisions#^D011]]
> - from: [[_archive/protocol-design/decisions#Context assembly gap — model has no memory across turns (2026-07-01)]]

## Providers

`resolveModelConfig` parses the selector `"<provider>/<model>"`, splitting at the first `/`, and
each provider ID maps to a package and credentials:

| Provider ID | Package | Credentials and base URL | Provider options |
| --- | --- | --- | --- |
| `groq` | `@ai-sdk/groq` | `KUIB_GROQ_API_KEY` | none |
| `anthropic` | `@ai-sdk/anthropic` | `KUIB_ANTHROPIC_API_KEY` | none |
| `meta` | openai-compatible | fixed `https://api.meta.ai/v1` + `KUIB_META_API_KEY` | none |
| `mimo` | openai-compatible | `mimoBaseURL`, else the token-plan host, + `KUIB_MIMO_API_KEY` | `{ thinking: { type: "enabled" } }` |
| `openai-compatible` | openai-compatible | required `baseURL` + optional API key | `{ reasoningEffort: "none" }` |

A missing or empty key, a selector with no slash, or an unknown provider ID throws a message
naming what is missing. Provider-scoped branches ignore the generic `baseURL`. ^provider-errors

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/provider/resolve.model.config/index.ts` › `requireKey` · #e9f11867
> - `packages/engine/src/provider/resolve.model.config/index.ts` › `resolveModelConfig` · #71182a64
> - `packages/engine/src/provider/resolve.model.config/index.ts` › "const META_BASE_URL = "https://api.meta.ai/v1";"
> - `packages/engine/src/provider/resolve.model.config/index.ts` › "const MIMO_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";"
> - test: `packages/engine/src/provider/resolve.model.config/index.test.ts` › "ignores KUIB_MODEL_BASE_URL when meta is selected"
> - test: `packages/engine/src/provider/resolve.model.config/index.test.ts` › "resolves mimo/<model> onto the token-plan base URL with thinking enabled"
> - test: `packages/engine/src/provider/resolve.model.config/index.test.ts` › "lets KUIB_MIMO_BASE_URL override the plan region"
> - test: `packages/engine/src/provider/resolve.model.config/index.test.ts` › "keeps reasoningEffort none for generic openai-compatible endpoints"
> - test: `packages/engine/src/provider/resolve.model.config/index.test.ts` › "treats an empty KUIB_ANTHROPIC_API_KEY as missing"
> - test: `packages/engine/src/provider/resolve.model.config/index.test.ts` › "throws on an unknown provider id"
> - why: [[domains/core/decisions#^D022]]
> - why: [[domains/core/decisions#^D023]]
> - why: [[domains/core/decisions#^D027]]
> - from: [[_archive/provider-architecture/decisions#Meta Model API = a provider ID, not a new npm package (2026-08-12)]]
> - from: [[_archive/provider-architecture/decisions#MiMo (Xiaomi) — the first provider that actually streams plaintext reasoning (2026-08-12)]]

`createModel(config)` looks up a factory by `config.npm`. The supported packages are
`@ai-sdk/openai-compatible` (named `kuib`, and `options.baseURL` is required),
`@ai-sdk/anthropic` and `@ai-sdk/groq`. `options` are spread into the `create*` call. An
unknown package throws with the supported list. ^provider-factories

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/provider/model/index.ts` › `openAICompatibleFactory` · #b96d97c7
> - `packages/engine/src/provider/model/index.ts` › `FACTORIES` · #87bd3191
> - `packages/engine/src/provider/model/index.ts` › `createModel` · #967609f2
> - test: `packages/engine/src/provider/model/index.test.ts` › "throws on an unknown provider package"
> - test: `packages/engine/src/provider/model/index.test.ts` › "throws when openai-compatible is missing baseURL"
> - why: [[domains/core/decisions#^D021]]
> - why: [[domains/core/decisions#^D022]]
> - from: [[_archive/provider-architecture/decisions#Provider contract v2 — flat config + factory map, NOT a discriminated union (2026-07-02)]]

`buildProviderOptions(config)` nests `config.providerOptions` under the SDK provider name
(`kuib`, `anthropic` or `groq`). It returns `{}` when the record is empty or the package is
unknown. `ProviderOptions` is typed structurally from `streamText`'s parameters. ^provider-options

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/provider/build.provider.options/index.ts` › `ProviderOptions` · #babc06ca
> - `packages/engine/src/provider/build.provider.options/index.ts` › `buildProviderOptions` · #94133293
> - test: `packages/engine/src/provider/build.provider.options/index.test.ts` › "nests providerOptions under the sdk provider name"
> - test: `packages/engine/src/provider/build.provider.options/index.test.ts` › "returns an empty record when there are no providerOptions"
> - why: [[domains/core/decisions#^D024]]
> - from: [[_archive/provider-architecture/decisions#Per-request provider options are a second axis, separate from client options (2026-08-12)]]

`provider/live.test.ts` runs `runAgent` against the provider configured in the environment
only when `KUIB_LLM_TESTS=1`; otherwise the suite is ignored. When enabled, it loads the
repository `.env` without overriding variables that are already set, and asserts that an answer
streams, that a step reports token usage, and that reasoning streams when the provider exposes
it. ^live-provider-tests

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/provider/live.test.ts` › "const ENABLED = process.env["KUIB_LLM_TESTS"] === "1";"
> - test: `packages/engine/src/provider/live.test.ts` › "streams reasoning when the provider exposes it"
> - why: [[domains/core/decisions#^D026]]
> - from: [[_archive/provider-architecture/decisions#Live provider tests are opt-in (2026-08-12)]]

## Tools

`defineTool({ name, description, input, execute })` returns an existential `ToolSpec`: `name`,
`description`, and `use(consume)`, which hands the original typed definition to a consumer.
`execute(input, ctx)` receives a `ToolContext` whose only member is `fs: FileSystemPort`. ^define-tool

> [!sources]- structure · verified 2026-09-23
> - `packages/tools/src/tool.spec/index.ts` › `ToolContext` · #e0eb494e
> - `packages/tools/src/tool.spec/index.ts` › `ToolSpec` · #363a16d5
> - `packages/tools/src/tool.spec/index.ts` › `defineTool` · #246dc66f
> - test: `packages/tools/src/tool.spec/index.test.ts` › "use invokes consume with the original definition and returns its result"
> - why: [[domains/core/decisions#^D012]]
> - from: [[_archive/tool-system/decisions#The model — single source of truth, three roles]]

The agent has exactly two tools, `readFile` and `readDir`. Each takes its protocol input schema
and delegates to `ctx.fs`. The daemon's `writeFile` and `executeCommand` are not exposed as
tools. ^agent-tools

> [!sources]- behaviour · verified 2026-09-23
> - `packages/tools/src/read.dir/index.ts` › `readDir` · #0153d3d9
> - `packages/tools/src/read.file/index.ts` › `readFile` · #b21ecace
> - `packages/engine/src/orchestrator/index.ts` › "Provider.buildTools([Tools.readFile, Tools.readDir], {"
> - test: `packages/tools/src/read.file/index.test.ts` › "delegates input to ctx.fs.readFile and returns its result"
> - why: [[domains/core/decisions#^D013]]
> - from: [[_archive/tool-system/decisions#v1 scope]]

`buildTools(specs, ctx)` turns specs into an AI SDK tool record keyed by `spec.name`. Each
tool's `execute` parses its input through the tool's Zod schema before calling the definition
with `ctx`. The orchestrator's `ctx.fs` is `createDaemonFileSystem(client)`, which forwards
`readFile` and `readDir` to the daemon's tRPC queries. ^build-tools

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/daemon.file.system/index.ts` › `createDaemonFileSystem` · #3318dd00
> - `packages/engine/src/provider/build.tools/index.ts` › `buildTools` · #6ef2bfaa
> - test: `packages/engine/src/provider/build.tools/index.test.ts` › "builds a record keyed by spec.name"
> - test: `packages/engine/src/provider/build.tools/index.test.ts` › "parses input before calling definition.execute with ctx"
> - why: [[domains/core/decisions#^D012]]
> - from: [[_archive/protocol-design/decisions#Tool-call backends — where the pieces live (2026-07-01)]]

## Daemon

The daemon is a tRPC router with four procedures: the queries `readFile` and `readDir`, and the
mutations `writeFile` and `executeCommand`. `Trpc` wraps a single `initTRPC.create()`.
`createDaemonCaller` is its in-process caller factory, and the daemon's own tests are its only
user. ^daemon-router

> [!sources]- structure · verified 2026-09-23
> - `packages/daemon/src/daemon.caller/index.ts` › `createDaemonCaller` · #9eab7e4b
> - `packages/daemon/src/daemon.router/index.ts` › `daemonRouter` · #65fef5ba
> - `packages/daemon/src/trpc/index.ts` › `Trpc` · #6aa47dcc
> - test: `packages/daemon/src/daemon.router/index.test.ts` › "writeFile then readFile round-trips content"
> - why: [[domains/core/decisions#^D014]]

The file procedures expand `~` and `~/…` to the home directory; `~user` is left as is. They use
`node:fs/promises` and turn any failure into a `TRPCError` with `INTERNAL_SERVER_ERROR` and the
underlying message. `readFile` returns `{ content }` as UTF-8, `readDir` returns the directory
entries joined with newlines, and `writeFile` returns `{ success: true }`. `writeFile` has its
own input and output schemas in the daemon package. ^daemon-file-procedures

> [!sources]- behaviour · verified 2026-09-23
> - `packages/daemon/src/expand.home.path/index.ts` › `expandHomePath` · #bea38a73
> - `packages/daemon/src/io/write.file.input/index.ts` › `WriteFileInput` · #284e2960
> - `packages/daemon/src/io/write.file.output/index.ts` › `WriteFileOutput` · #d68c9635
> - `packages/daemon/src/procedure/read.dir/index.ts` › `readDirProcedure` · #49e3c8bd
> - `packages/daemon/src/procedure/read.file/index.ts` › `readFileProcedure` · #f3e097c2
> - `packages/daemon/src/procedure/write.file/index.ts` › `writeFileProcedure` · #4be5f2ab
> - test: `packages/daemon/src/procedure/read.file/index.test.ts` › "throws a TRPCError INTERNAL_SERVER_ERROR when the read fails"
> - test: `packages/daemon/src/procedure/write.file/index.test.ts` › "writes the content and returns success"
> - test: `packages/daemon/src/expand.home.path/index.test.ts` › "returns non-tilde paths unchanged, including '~user'"

`executeCommand` runs `{ command, cwd?, env? }` through `child_process.exec`. `cwd` defaults to
the daemon's working directory, and `env` is merged over the daemon's environment. It never
throws. A failure returns the captured stdout and stderr with the process's exit code, falling
back to `error.message` and exit code 1. ^daemon-exec

> [!sources]- behaviour · verified 2026-09-23
> - `packages/daemon/src/io/execute.command.input/index.ts` › `ExecuteCommandInput` · #93ad47a5
> - `packages/daemon/src/io/execute.command.output/index.ts` › `ExecuteCommandOutput` · #f57fb370
> - `packages/daemon/src/procedure/execute.command/index.ts` › `executeCommand` · #62c6d309
> - test: `packages/daemon/src/procedure/execute.command/index.test.ts` › "maps a failing command to its exit code with captured stdout/stderr"
> - test: `packages/daemon/src/procedure/execute.command/index.test.ts` › "falls back to exitCode 1 and error.message for a non-existent command"
> - test: `packages/daemon/src/procedure/execute.command/index.test.ts` › "honours cwd and merges provided env over process defaults"

`createDaemonServer(socketPath, port?)` removes any stale socket file and serves the router over
HTTP on the unix socket. If a valid port is given, it also starts a second standalone server on
that TCP port and ignores its errors. The `start.daemon` entry point reads
`Config.bootstrapConfig()`, ensures the app paths exist, starts the server on the configured
socket and optional port, prints `kuib daemon → <socket>[ + tcp :<port>]`, and exits 0 on a
server error. ^daemon-server

> [!sources]- behaviour · verified 2026-09-23
> - `packages/daemon/src/server/index.ts` › `createDaemonServer` · #5397d661
> - `packages/daemon/src/start.daemon/index.ts` › `main` · #0e1bade8
> - test: `packages/daemon/src/server/index.test.ts` › "removes a stale socket, listens on socketPath, and returns the server"
> - test: `packages/daemon/src/server/index.test.ts` › "starts a second TCP server when a valid port is provided"
> - test: `packages/daemon/src/start.daemon/index.test.ts` › "coerces KUIB_DAEMON_PORT to a number and appends the tcp suffix"
> - why: [[domains/core/decisions#^D014]]
> - why: [[domains/core/decisions#^D027]]

`ensureDaemon(socketPath)` connects to the socket to check for a live daemon. If none answers,
it spawns `start.daemon` with the current executable, detached with ignored stdio and
`KUIB_DAEMON_SOCKET` set. It then re-probes every 50 ms and throws after 5 s.
`ensureLocalDaemon(socketOverride?)` resolves the socket through `Config.resolveAppPaths`,
ensures the daemon is running and returns a `unix` endpoint. `resolveDaemonEndpoint(remoteUrl,
socketOverride)` returns a `tcp` endpoint when a remote URL is given, and otherwise falls back to
the local daemon. ^ensure-daemon

> [!sources]- behaviour · verified 2026-09-23
> - `packages/daemon/src/ensure.daemon/index.ts` › `ensureDaemon` · #5f8b48cc
> - `packages/daemon/src/ensure.local.daemon/index.ts` › `ensureLocalDaemon` · #ad06f33c
> - `packages/daemon/src/resolve.daemon.endpoint/index.ts` › `resolveDaemonEndpoint` · #0847601e
> - test: `packages/daemon/src/ensure.daemon/index.test.ts` › "returns without spawning when the socket is already alive"
> - test: `packages/daemon/src/ensure.daemon/index.test.ts` › "rejects after the timeout when the socket never becomes reachable"
> - test: `packages/daemon/src/ensure.local.daemon/index.test.ts` › "threads socketOverride through resolve+ensure and returns a UNIX endpoint with the resolved socketPath"
> - test: `packages/daemon/src/resolve.daemon.endpoint/index.test.ts` › "returns a TCP endpoint carrying the remoteUrl when one is provided"
> - why: [[domains/core/decisions#^D014]]
> - why: [[domains/core/decisions#^D029]]
> - from: [[_archive/host-layer/decisions#Node composition + corrected lifecycle (2026-07-01, supersedes "detached-child default")]]

The engine's `createDaemonClient(endpoint)` builds a typed tRPC client over `httpBatchLink`. For
a `tcp` endpoint it uses `endpoint.url`. For a `unix` endpoint it creates a `Deno.createHttpClient`
with a unix-socket proxy and sends requests to `http://daemon` through it. ^daemon-client

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/daemon.client/transport.factory/index.ts` › `createDaemonClient` · #ae74a546
> - `packages/engine/src/daemon.client/transport.factory/index.ts` › "proxy: { transport: "unix", path: endpoint.socketPath },"
> - test: `packages/engine/src/daemon.client/transport.factory/index.test.ts` › "routes the TCP branch through endpoint.url with no unix socket init"
> - test: `packages/engine/src/daemon.client/transport.factory/index.test.ts` › "routes the unix branch through a unix-socket Deno.HttpClient"
> - why: [[domains/core/decisions#^D014]]

## Engine-service

`startEngineService({ socketPath, eventLog, runTurn, reapIdleMs? })` listens on a unix socket and
reads newline-delimited JSON frames. Each frame is decoded with `ServiceMessageAny`, and
malformed or schema-invalid frames are silently dropped. `interrupt` calls the abort function
stored for that session. `submit` starts a turn through the injected `runTurn({ sessionID,
prompt, takePending, onAbort })`. The service never imports the engine itself. ^service-socket

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine-service/src/start.engine.service/index.ts` › `RunTurn` · #4fa9f468
> - `packages/engine-service/src/start.engine.service/index.ts` › `startEngineService` · #6fb4b8d6
> - test: `packages/engine-service/src/start.engine.service/index.test.ts` › "invokes runTurn with sessionID/prompt on a valid SUBMIT and reaps after idle"
> - test: `packages/engine-service/src/start.engine.service/index.test.ts` › "ignores malformed JSON and schema-invalid frames without invoking runTurn"
> - why: [[domains/core/decisions#^D015]]
> - why: [[domains/core/decisions#^D016]]
> - from: [[_archive/host-layer/decisions#Control plane vs data plane]]

The service keeps a `{ running, pending[] }` entry per session. A `submit` that arrives while a
turn is running is queued; nothing is written to the log. A turn's `takePending` splices out the
whole queue. When a turn ends, errors included, the next queued prompt starts a new turn, until
the queue is empty. Sessions run independently. ^turn-queue

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine-service/src/start.engine.service/index.ts` › `SessionTurnState` · #94915db0
> - `packages/engine-service/src/start.engine.service/index.ts` › "prompt = state.pending.shift();"
> - test: `packages/engine-service/src/start.engine.service/index.test.ts` › "queues submits arriving mid-turn and runs them in order without overlap"
> - test: `packages/engine-service/src/start.engine.service/index.test.ts` › "hands queued prompts to the running turn via takePending"
> - why: [[domains/core/decisions#^D018]]
> - from: [[_archive/host-layer/decisions#Turn scheduling — per-session queue + step-boundary steering (2026-07-02)]]

The service refuses to start with `EADDRINUSE` if another process is already listening on the
socket. It unlinks a stale socket file and binds. When there are no active runs and no attached
connections, it starts a reap timer (`reapIdleMs`, default 5000). A new connection or run
cancels the timer. When the timer fires, the service closes: it destroys all sockets, closes the
server and unlinks the socket file. ^service-lifecycle

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine-service/src/start.engine.service/index.ts` › "const DEFAULT_REAP_IDLE_MS = 5000;"
> - `packages/engine-service/src/start.engine.service/index.ts` › "engine-service already running at ${params.socketPath}"
> - test: `packages/engine-service/src/start.engine.service/index.test.ts` › "rejects with EADDRINUSE while a live server owns the socket"
> - test: `packages/engine-service/src/start.engine.service/index.test.ts` › "unlinks a stale socket file and rebinds when nothing is listening"
> - why: [[domains/core/decisions#^D017]]
> - from: [[_archive/host-layer/decisions#Lifecycle (single-device)]]

`connectOrSpawn({ socketPath, spawnArgv })` connects to a live engine-service socket. If there
is none, it spawns the current executable with `spawnArgv`, detached with ignored stdio, and
polls every 50 ms for up to 5 s before rejecting. The client writes `submit` and `interrupt`
frames as one JSON object per line. ^connect-or-spawn

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine-service/src/engine.client/index.ts` › `EngineServiceClient` · #1db61804
> - `packages/engine-service/src/engine.client/index.ts` › `connectOrSpawn` · #fa840687
> - test: `packages/engine-service/src/engine.client/index.test.ts` › "connects to an already-listening socket and submits framed JSON"
> - test: `packages/engine-service/src/engine.client/index.test.ts` › "rejects when no server exists and the spawned child never becomes reachable"
> - why: [[domains/core/decisions#^D017]]
> - from: [[_archive/host-layer/decisions#Engine lifecycle & idempotent discovery]]

## Transcript

`foldTranscript(envelopes)` turns an envelope list into `TranscriptEntry { id, role, text }[]`
with roles `user`, `assistant`, `reasoning` and `tool`:

- User text parts are joined into one entry per user message.
- Text and reasoning deltas accumulate per `messageID`, with IDs `<messageID>:<segment>` and
  `<messageID>:reasoning:<segment>`.
- User messages and tool results start a new segment.
- Tool results become entries keyed by `callID`, prefixed `✓ ` for completed and `✗ ` for
  failed.
- All other events are ignored. ^transcript-fold

> [!sources]- behaviour · verified 2026-09-23
> - `packages/transcript/src/fold.transcript/index.ts` › `foldTranscript` · #30c3babd
> - `packages/transcript/src/transcript.entry/index.ts` › `TranscriptEntry` · #10fafe15
> - `packages/transcript/src/transcript.role.enum/index.ts` › `TranscriptRoleEnum` · #2f1838d0
> - test: `packages/transcript/src/fold.transcript/index.test.ts` › "segments assistant text around tool results preserving chronology"
> - test: `packages/transcript/src/fold.transcript/index.test.ts` › "segments assistant text around an injected mid-turn user message"
> - test: `packages/transcript/src/fold.transcript/index.test.ts` › "prefixes completed tool output with ✓ and failed with ✗, ignoring unknown events"
> - why: [[domains/core/decisions#^D019]]

## Mesh discovery

`loadMeshConfig(path)` returns `[]` when the file is missing. Otherwise it parses the file as
TOML with `@std/toml` and validates it against `MeshConfig` (`nodes: NodeDescriptor[]`, default
`[]`); an invalid config throws. ^mesh-config

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/mesh/load.mesh.config/index.ts` › `loadMeshConfig` · #dcb91da4
> - `packages/engine/src/mesh/mesh.config/index.ts` › `MeshConfig` · #bdb0f8d9
> - test: `packages/engine/src/mesh/load.mesh.config/index.test.ts` › "returns [] when the path does not exist"
> - test: `packages/engine/src/mesh/load.mesh.config/index.test.ts` › "throws when the config is invalid"
> - why: [[domains/core/decisions#^D028]]

There are two `DiscoveryPort` implementations. `createStaticDiscovery(descriptors)` indexes
descriptors by `nodeID`, so a later duplicate replaces an earlier one, and rejects an unknown ID
with `unknown node`. `createLocalOnlyDiscovery(self)` lists only itself and resolves any ID to
itself. `createTransportFactory(discovery)` maps a `NodeID` to a daemon client: it resolves the
descriptor and throws if the descriptor has no endpoint. ^discovery

> [!sources]- behaviour · verified 2026-09-23
> - `packages/engine/src/mesh/local.only.discovery/index.ts` › `createLocalOnlyDiscovery` · #2d9870b3
> - `packages/engine/src/mesh/static.discovery/index.ts` › `createStaticDiscovery` · #fe1d9d6c
> - `packages/engine/src/mesh/transport.factory/index.ts` › `createTransportFactory` · #c0a1e1b1
> - test: `packages/engine/src/mesh/static.discovery/index.test.ts` › "resolve rejects with 'unknown node' for an unknown id"
> - test: `packages/engine/src/mesh/local.only.discovery/index.test.ts` › "resolves any nodeID to self"
> - test: `packages/engine/src/mesh/transport.factory/index.test.ts` › "throws when the resolved descriptor has no endpoint"
> - why: [[domains/core/decisions#^D028]]
> - from: [[_archive/distributed-mesh-state/decisions#Implementation status — Layer 1 (node resolution seam) — DONE]]
