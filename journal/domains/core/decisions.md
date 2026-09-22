---
domain: core
---

# Core — decisions

### D001 — Zod-first protocol package over a proto-first IDL

- Status: accepted
- Context: Every process boundary (host ↔ engine-service, engine ↔ daemon, disk) needs one wire and storage contract. An earlier draft made `.proto` the source of truth, which meant codegen and a second schema language in an all-TypeScript product.
- Decision: `@kuib-ai/protocol` holds Zod schemas as the source of truth, with TS types from `z.infer`, and depends only on `zod`. RPC is tRPC, which derives its wire contract from the same Zod schemas, so there is no codegen. The `.proto` files stay in the package as reference only; proto/gRPC is kept as a future transport for polyglot daemons that cannot import Zod.
- Consequences: A schema change is one TS edit. Nothing generates code from, reads, or checks the `.proto` files, so they can drift from the Zod schemas.
- Supersedes: —
- Superseded by: —
- From: [[_archive/protocol-design/decisions#Package: `@kuib/protocol`]]

^D001

### D002 — Native TS enums for every discriminator

- Status: accepted
- Context: Discriminated unions spread string literals across schemas and consumers, with nothing to autocomplete and no single source for the values.
- Decision: Every discriminator value is a member of a native TS enum (`EventTypeEnum`, `PartTypeEnum`, …). Schemas use `z.literal(Enum.X)` and `z.enum(Enum)`, and consumers `switch` on the same enum members.
- Consequences: Renaming a value is a one-place edit, and hardcoded strings in consumers count as drift. Zod 4 is required, because it accepts native enums in `z.enum`.
- Supersedes: —
- Superseded by: —
- From: [[_archive/protocol-design/decisions#Native TS Enums for All Discriminators]]

^D002

### D003 — Zod for data, TS interfaces for behaviour; branded IDs

- Status: accepted
- Context: Protocol has two kinds of content: shapes that cross a process or disk boundary, and contracts that implementations fulfil (event log, file system, discovery).
- Decision: Anything that crosses a boundary is a Zod schema. Anything with methods is a type-only interface in a `*.port` module (`EventLogPort`, `FileSystemPort`, `DiscoveryPort`). IDs are branded Zod strings, so passing a `MessageID` where a `SessionID` is expected fails to compile. The protocol contains no AI SDK types.
- Consequences: Ports have no runtime cost and can be implemented anywhere, for example a memory or SQLite event log, or a daemon-backed file system. Every ID value has to be minted through `schema.parse`.
- Supersedes: —
- Superseded by: —
- From: [[_archive/protocol-design/decisions#Design Principles]]

^D003

### D004 — One event union in a sequenced, origin-attributed envelope

- Status: accepted
- Context: Separate submission and event queues split one conversation into two ordering domains. Several actors (users on any device, and the engine) produce entries into the same session.
- Decision: There is one `AnyEvent` discriminated union, and user actions are events too. Every stored event is wrapped in an `EventEnvelope` with `(epoch, seq)`, `sessionID`, a required `originDeviceID` and `createdAt`. `epoch` is the leadership generation and is `0` on a single device. Total order is `(epoch, seq)`, never the timestamp.
- Consequences: The log format already fits leader handoff, so it will not change when fencing arrives. `createdAt` is for display only.
- Supersedes: —
- Superseded by: —
- From: [[_archive/protocol-design/decisions#Architecture Pattern: Unified Event Log (2026-04-28)]], [[_archive/protocol-design/decisions#Event System: EventLog with Envelopes (revised 2026-04-28)]]

^D004

### D005 — `_version` only at durable aggregate boundaries

- Status: accepted
- Context: Versioning every leaf schema is its own source of drift. But leaving versions off makes later migration a retrofit.
- Decision: `_version: z.literal(1)` appears on `EventEnvelope`, where it covers the whole event union, and on persisted aggregate roots (`MessageBase`). Leaf schemas and individual event variants are unversioned.
- Consequences: One version bump per aggregate. In-band `_version` is enough because every mesh node is deployed together.
- Supersedes: —
- Superseded by: —
- From: [[_archive/protocol-design/decisions#Versioning boundaries (2026-06-30)]]

^D005

### D006 — Reasoning is content, not a tool call

- Status: accepted
- Context: Reasoning models stream `reasoning-delta` parts before the answer. One option was to model them as a tool call.
- Decision: `REASONING_DELTA` mirrors `TEXT_DELTA` (`messageID`, `partID`, `delta`), and `PartReasoning` mirrors `PartText`.
- Consequences: The engine never fabricates a call ID, input or result for reasoning, and the rule that every tool call has a real execution still holds.
- Supersedes: —
- Superseded by: —
- From: [[_archive/protocol-design/decisions#Reasoning is content, not a tool call (2026-07-01)]]

^D006

### D007 — Assistant messages end with explicit terminal events

- Status: accepted
- Context: A run that emitted only `MESSAGE_STARTED` and deltas left no record of a clean finish, an error or an interrupt. On resume, every turn looked open. Step boundaries cannot carry this because a message has many steps, and some errors happen before any step starts.
- Decision: Every run ends with `MESSAGE_COMPLETED` or `MESSAGE_FAILED` (which carries the error string). An interrupted run is recorded as completed.
- Consequences: The log records that the run stopped. Readers can tell an in-flight turn from a finished one without guessing.
- Supersedes: —
- Superseded by: —
- From: [[_archive/protocol-design/decisions#Terminal events — needed, not yet in the union (2026-07-01)]], [[_archive/protocol-design/decisions#Event Taxonomy — Revised (2026-04-26)]]

^D007

### D008 — Tool-call state is append-only with reason and kind discriminators

- Status: accepted
- Context: The protocol has to record the tool-call lifecycle truthfully, including interrupts, rejections and subagent cost, without mutating parts.
- Decision: `ToolCallState` has three persisted statuses: `pending` (request data), `completed` and `error` (outcome only). A transient "running" state exists only as the `TOOL_CALL_STARTED` event. Errors carry a `ToolCallErrorReasonEnum` (`failed | interrupted | cancelled | rejected`). Completed and error states are discriminated on `kind`, and the `subagent` variant must carry `model` and `tokens`.
- Consequences: The UI can render each error reason differently without parsing strings. Subagent cost is enforced by the type system.
- Supersedes: —
- Superseded by: —
- From: [[_archive/protocol-design/decisions#Tool Call Parts — Append-Only, No Mutation]], [[_archive/protocol-design/decisions#Tool Call Error — Reason Enum]], [[_archive/protocol-design/decisions#Tool Call Kind — Normal vs Subagent]]

^D008

### D009 — Parts carry identity and exclusion; role-specific unions; per-step model

- Status: accepted
- Context: Parts need a stable identity for event targeting and for user exclusion. A tool call inside a user message should be a type error. Models can change between steps.
- Decision: Every part extends `PartBase { partID, excluded }`. `PartUser` is text | file, and `PartAssistant` adds reasoning, tool-call and step-boundary. Step boundaries are a nested union on `kind`, and a stop boundary carries its stop reason, `ModelRef` and `TokenUsage`.
- Consequences: Cost is computed per step, not per message. The outer union dispatches on `type` and the inner one on `kind`.
- Supersedes: —
- Superseded by: —
- From: [[_archive/protocol-design/decisions#Part Types — Content + Step Boundaries]], [[_archive/protocol-design/decisions#Step Boundaries — Per-Step Model Tracking]], [[_archive/protocol-design/decisions#Message Format — Finalized (v3, 2026-04-25)]]

^D009

### D010 — SQLite event log in its own package on `node:sqlite`

- Status: accepted
- Context: The event log must survive the process that writes it. The engine library should not own a database. `bun:sqlite` went away with Bun, and FFI-based SQLite hurt startup because of `dlopen`.
- Decision: `@kuib-ai/event-log-sqlite` implements `EventLogPort` using the built-in `node:sqlite` `DatabaseSync` in WAL mode. `append` computes `MAX(seq)+1` inside a prepared `BEGIN IMMEDIATE` transaction. The engine keeps an in-memory implementation behind the same port.
- Consequences: No native library loads at startup, and the adapter runs under both Deno and Node. `EventLogPort` did not change. Deno ≥ 2.9.7 rejects symlinked database paths.
- Supersedes: —
- Superseded by: —
- From: [[_archive/protocol-design/decisions#SQLite backing — `bun:sqlite` now, `node:sqlite` later (LOCKED 2026-07-01, supersedes runtime-adaptive)]], [[features/deno-runtime/plan]]

^D010

### D011 — Model context is rebuilt by replaying the event log

- Status: accepted
- Context: The first orchestrator sent only the current prompt, so the model forgot earlier turns even though the log had persisted them.
- Decision: `buildMessages(eventLog, sessionID)` folds the whole session log into AI SDK `ModelMessage[]` on every run. The fold covers user text, assistant text, and tool calls and results that have a recorded resolution.
- Consequences: The prompt prefix is an append-only replay with no volatile header, so it stays byte-stable and hits provider prefix caches. Reasoning is not replayed into context.
- Supersedes: —
- Superseded by: —
- From: [[_archive/protocol-design/decisions#Context assembly gap — model has no memory across turns (2026-07-01)]], [[_archive/provider-architecture/decisions#Meta caching is automatic; reasoning is not visible (2026-08-12)]]

^D011

### D012 — Tools defined once; protocol, tools, daemon and engine each hold one role

- Status: accepted
- Context: Tool input schemas were declared twice: in inline AI SDK `tool()` blocks in the orchestrator and in per-tool daemon procedures.
- Decision: The protocol owns tool I/O schemas and `FileSystemPort`. `@kuib-ai/tools` defines each tool once through `defineTool`, and its `execute` calls only `ctx.fs`. The daemon exposes generic fs/shell primitives. The engine converts specs into AI SDK tools and injects a daemon-backed `FileSystemPort`. Tool lifecycle events are emitted by the orchestrator's stream loop, not by the tools.
- Consequences: A tool built from existing primitives is one file in `@kuib-ai/tools`. Only a new capability needs a port method and a daemon procedure.
- Supersedes: —
- Superseded by: —
- From: [[_archive/tool-system/decisions#The model — single source of truth, three roles]], [[_archive/tool-system/decisions#Tool lifecycle events come from the stream, not the tool]], [[_archive/protocol-design/decisions#Tool-call backends — where the pieces live (2026-07-01)]]

^D012

### D013 — Agent tools are read-only; write and exec stay daemon primitives

- Status: accepted
- Context: The security layer that would gate side effects does not exist yet.
- Decision: The agent gets only read tools (`readFile`, `readDir`). The daemon's `writeFile` and `executeCommand` procedures are kept as dormant primitives and are not exposed to the model.
- Consequences: Each dormant primitive becomes an agent tool by adding one file in `@kuib-ai/tools`.
- Supersedes: —
- Superseded by: —
- From: [[_archive/tool-system/decisions#v1 scope]], [[_archive/tool-system/decisions#Open / follow-ups]]

^D013

### D014 — The daemon is always a separate process, even locally

- Status: accepted
- Context: Local and remote execution should run the same code path, so nothing has to be unwound when the mesh arrives.
- Decision: The engine reaches the daemon over HTTP tRPC in every case: a unix socket locally, TCP remotely. The daemon is a stateless fs/shell executor that knows nothing about logs, sessions or LLMs. It is started idempotently (probe the socket, else spawn it detached), and the socket file acts as the mutex. The in-process tRPC caller is used only to unit-test the daemon.
- Consequences: Process isolation is in place from the start. Only the engine calls the daemon.
- Supersedes: —
- Superseded by: —
- From: [[_archive/architecture-overview/decisions#Package Dependency Flow]], [[_archive/host-layer/decisions#Node composition + corrected lifecycle (2026-07-01, supersedes "detached-child default")]]

^D014

### D015 — Engine library and engine-service process are separate packages

- Status: accepted
- Context: A host that ran the agent loop in-process killed the run, and stopped log appends, when the user closed it. Appends survive the host only if the appending process survives.
- Decision: `@kuib-ai/engine` is the agent-loop library (orchestrator, providers, daemon client, event-log port use) with no sockets, spawning or database writer. `@kuib-ai/engine-service` is the long-lived process body: unix socket, turn scheduling and lifecycle. It receives the engine's run function as an injected `runTurn`.
- Consequences: The split rests on keeping I/O separate from the library, not on runtimes: both run on Deno. The code that wires the two together lives in the host application.
- Supersedes: —
- Superseded by: —
- From: [[_archive/host-layer/decisions#Engine vs engine-service (brain vs body)]]

^D015

### D016 — Control plane on the socket, data plane in SQLite

- Status: accepted
- Context: Hosts need live reads of the session and a way to submit prompts. Streaming data through the service would duplicate what the log already holds.
- Decision: The engine-service socket carries only small newline-delimited JSON control frames (`submit`, `interrupt`). The SQLite log is the data plane. Readers open it read-only through a polling `EventLogPort` reader (WAL allows concurrent readers alongside one writer).
- Consequences: A reader that misses a notification catches up on its next poll, because the database is the truth. The read path stays the same when mesh replication fills the local database.
- Supersedes: —
- Superseded by: —
- From: [[_archive/host-layer/decisions#Control plane vs data plane]], [[_archive/host-layer/decisions#How the host gets read access]]

^D016

### D017 — Engine-service lifecycle: socket mutex, detached spawn, idle self-reap

- Status: accepted
- Context: A device should run at most one engine. It must outlive the host to finish a run, and it must not linger when nothing is happening.
- Decision: Binding the socket is the single-instance mutex, and a live socket makes a second start fail with `EADDRINUSE`. Clients connect or spawn the service detached. The service reaps itself (closes and unlinks the socket) only after an idle timer, when there is no active run and no attached connection.
- Consequences: Durability across quitting comes from the SQLite log, not from a process kept alive. Idle cost is one timer.
- Supersedes: —
- Superseded by: —
- From: [[_archive/host-layer/decisions#Lifecycle (single-device)]], [[_archive/host-layer/decisions#Engine lifecycle & idempotent discovery]]

^D017

### D018 — One active turn per session; mid-run submits steer at step boundaries

- Status: accepted
- Context: A submit that arrived mid-run started a second concurrent `runAgent` on the same session, which interleaved the transcript and corrupted context snapshots.
- Decision: The engine-service keeps a `{ running, pending[] }` entry per session. A submit that arrives during a run is queued and not written to the log. The orchestrator drains the queue in `prepareStep` before each step: it emits `USER_MESSAGE_SUBMITTED` and appends the text to the step messages. Anything still queued when the run ends becomes the next turn's prompt.
- Consequences: A message enters the log when it enters the conversation, so the log records what the model actually saw. Sessions are serialised independently of each other.
- Supersedes: —
- Superseded by: —
- From: [[_archive/host-layer/decisions#Turn scheduling — per-session queue + step-boundary steering (2026-07-02)]]

^D018

### D019 — Transcript fold is a shared package and segments at boundaries

- Status: accepted
- Context: Each host had its own copy of the log-to-display fold. Accumulating by message ID alone rendered tool results after all of the assistant text.
- Decision: `@kuib-ai/transcript` exports one pure `foldTranscript`. Assistant and reasoning accumulation breaks at user-message and tool-result events, and each new segment gets an entry ID of the form `<messageID>:<segment>`.
- Consequences: The transcript shows events in the order they happened (text → tool → text, with injected user messages in place) for every host.
- Supersedes: —
- Superseded by: —
- From: [[_archive/host-layer/decisions#Turn scheduling — per-session queue + step-boundary steering (2026-07-02)]], [[_archive/tool-system/decisions#Open / follow-ups]]

^D019

### D020 — Vercel AI SDK as the LLM client; kuib owns the loop and events

- Status: accepted
- Context: kuib needs a streaming, provider-agnostic LLM client without handing over the agent loop.
- Decision: The engine uses `ai` (`streamText`, `tool`) and `@ai-sdk/*` provider packages. The orchestrator consumes `fullStream` itself and translates stream parts into protocol events. Protocol types never reference AI SDK types.
- Consequences: The SDK is confined to `@kuib-ai/engine`.
- Supersedes: —
- Superseded by: —
- From: [[_archive/provider-architecture/decisions#LLM Client Layer]]

^D020

### D021 — OpenAI-compatible endpoints use `@ai-sdk/openai-compatible`

- Status: accepted
- Context: `@ai-sdk/openai` defaults to the Responses API. ollama and other compatible servers only speak Chat Completions, so requests to them failed silently.
- Decision: Every OpenAI-compatible endpoint is the same `createOpenAICompatible` client, named `kuib`, pointed at a different `baseURL`. `baseURL` is required.
- Consequences: Features that exist only in the Responses API (such as Meta's reasoning continuity) are out of reach.
- Supersedes: —
- Superseded by: —
- From: [[_archive/provider-architecture/decisions#v1 provider = OpenAI-compatible client, config-driven via env (2026-07-01)]]

^D021

### D022 — Flat `ModelConfig` plus a factory map keyed by npm package

- Status: accepted
- Context: A discriminated union of per-provider configs would make every new provider a breaking protocol change. What actually varies is which SDK package to use.
- Decision: `ModelConfig` is flat: `npm`, `providerID`, `modelID`, an open `options` record passed verbatim to `create*(options)`, and `providerOptions`. `createModel` looks up a factory by `npm`, and an unknown package throws with the supported list. The selector is `"<providerID>/<modelID>"`, split at the first `/`.
- Consequences: Adding a provider package means adding one map entry. A provider that is only a new base URL is one resolver branch.
- Supersedes: —
- Superseded by: —
- From: [[_archive/provider-architecture/decisions#Provider contract v2 — flat config + factory map, NOT a discriminated union (2026-07-02)]]

^D022

### D023 — Provider IDs map onto packages; provider-scoped settings ignore generic transport vars

- Status: accepted
- Context: Meta and MiMo are OpenAI-compatible and have no `@ai-sdk` package of their own. The generic base URL usually points at a local ollama and must not redirect their traffic.
- Decision: `meta/` and `mimo/` resolve onto `@ai-sdk/openai-compatible`, each with its own API key. Meta's base URL is fixed. MiMo defaults to the token-plan host, can be overridden by a MiMo-specific base URL, and always enables `thinking`, because MiMo leaves reasoning off unless asked. `groq/` and `anthropic/` likewise require their own keys.
- Consequences: Several providers can be configured side by side. Switching between them means changing one selector.
- Supersedes: —
- Superseded by: —
- From: [[_archive/provider-architecture/decisions#Meta Model API = a provider ID, not a new npm package (2026-08-12)]], [[_archive/provider-architecture/decisions#MiMo (Xiaomi) — the first provider that actually streams plaintext reasoning (2026-08-12)]]

^D023

### D024 — Per-request provider options are separate from client options

- Status: accepted
- Context: A hardcoded `reasoningEffort: "none"` sent on every request broke providers that reject it.
- Decision: `ModelConfig.options` configures the client. `ModelConfig.providerOptions` is per request and is nested under the SDK provider name by `buildProviderOptions`. An empty record omits the key entirely. Only the generic `openai-compatible` branch sets `reasoningEffort: "none"`.
- Consequences: Providers use their own defaults unless a resolver branch opts in. `ProviderOptions` is typed structurally from `streamText` so the engine does not depend on `@ai-sdk/provider`.
- Supersedes: —
- Superseded by: —
- From: [[_archive/provider-architecture/decisions#Per-request provider options are a second axis, separate from client options (2026-08-12)]]

^D024

### D025 — The agent loop has no step limit by default

- Status: accepted
- Context: A demo `stepCountIs(5)` ended real tasks silently. Simply removing the parameter would fall back to the SDK default of one step.
- Decision: `stopWhen` returns false unless the caller passes `maxSteps`, so the loop ends only when the model stops calling tools. Tests pass `maxSteps` so they terminate.
- Consequences: A model that never stops will burn tokens until the run is interrupted through `onAbort`.
- Supersedes: —
- Superseded by: —
- From: [[_archive/provider-architecture/decisions#Agent loop is unguarded — `stopWhen` removed (2026-08-12)]]

^D025

### D026 — Live provider tests are opt-in

- Status: accepted
- Context: The provider bugs that mattered were all wire-level, and no mocked unit test could have caught them.
- Decision: `provider/live.test.ts` runs the real orchestrator against the configured provider only when `KUIB_LLM_TESTS=1`. Otherwise the suite is ignored.
- Consequences: The default test run stays hermetic and offline. Live checks cover answer streaming, token usage and reasoning for MiMo.
- Supersedes: —
- Superseded by: —
- From: [[_archive/provider-architecture/decisions#Live provider tests are opt-in (2026-08-12)]]

^D026

### D027 — Engine packages take configuration as parameters

- Status: accepted
- Context: kuib ships as one binary with one root config. Packages that each read the environment would scatter configuration.
- Decision: The engine never reads the environment. `resolveModelConfig` receives the model selector, keys and base URLs as parameters. Only an application entry point bootstraps configuration and passes values down. The daemon's own entry point (`start.daemon`) is the one core module that calls `Config.bootstrapConfig`.
- Consequences: Engine units can be tested with plain parameters and no environment set-up.
- Supersedes: —
- Superseded by: —
- From: [[_archive/architecture-overview/decisions#Config & Env Resolution (`@kuib-ai/env`, 2026-07-01)]]

^D027

### D028 — Daemons are addressed by node identity through a discovery port

- Status: accepted
- Context: Remote execution needs the engine to target a daemon by node, not by raw URL, while the dynamic registry (Headscale) and CRDT sync are deferred.
- Decision: The protocol defines `NodeID`, `NodeDescriptor` (with an optional endpoint) and `DiscoveryPort`. The engine's mesh module provides static discovery from `mesh.config.toml`, local-only discovery, and `createTransportFactory(discovery)` from a `NodeID` to a daemon client.
- Consequences: A dynamic `DiscoveryPort` implementation can replace static discovery without changing anything above the port.
- Supersedes: —
- Superseded by: —
- From: [[_archive/distributed-mesh-state/decisions#Implementation status — Layer 1 (node resolution seam) — DONE]]

^D028

### D029 — Failures become log events, never silence

- Status: accepted
- Context: Swallowed stream errors produced empty turns lasting milliseconds. Tool failures never reached the transcript. Daemon start-up could resolve without a reachable socket.
- Decision: A `tool-error` stream part becomes `TOOL_CALL_FAILED` (reason `FAILED`). A stream `error` part is rethrown and becomes a `⚠️` text delta plus `MESSAGE_FAILED`. `ensureDaemon` throws after its probe deadline.
- Consequences: Every failure the log can observe is recorded durably.
- Supersedes: —
- Superseded by: —
- From: [[_archive/tool-system/decisions#Open / follow-ups]]

^D029

### D030 — Core tests inject fakes and assert on log events

- Status: accepted
- Context: Patching the module registry leaked mocks across test files. Tests that inspected internals broke on refactors.
- Decision: Units take their collaborators as parameters or ports. Tests pass fakes, or stand up small real fixtures: temp sockets, temp SQLite files, and an in-process tRPC caller. Orchestrator tests drive `MockLanguageModelV3` streams and assert on the events in a memory event log.
- Consequences: Suites run under `deno test` with no module mocking.
- Supersedes: —
- Superseded by: —
- From: [[_archive/testing-strategy/decisions#Hermeticity rules (each learned from a real failure)]], [[_archive/testing-strategy/decisions#Package-specific idioms]]

^D030
