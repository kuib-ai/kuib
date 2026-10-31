---
title: Continuation — 2026-10-06
date: 2026-10-06
origin: ["conversation 2026-10-06"]
---

# Continuation — 2026-10-06

Handoff from the session that reviewed the namespace research, discussed the engine shape with
the owner, and ran the first live orchestra round. Read this after
`pnpm journal handoff engine-foundation`. Nothing below is an approved design unless it is
marked as the owner's ruling.

> The engine proposals in this file were reasoned further on 2026-10-07 and several were
> replaced. Read [[features/engine-foundation/research/engine-design-2026-10-07]] for the
> current design; its "Superseded by this file" section lists what no longer holds here. The
> owner's rulings, the measurements and the provider constraints below remain valid.

## How the owner works

- No question tool; every open decision is laid out in prose and answered in the owner's words.
- "do not take decisions for me"; plan before implementation.
- A review by the owner follows every iteration. Names must be symmetric with their siblings
  (`AGENTS.md` working rule, added this session); every task ends with the list of names it
  introduced.
- The owner will run `/journal-graduate` once the discussion ends and a goal is defined. The
  feature stays `draft` until then.

## Owner rulings from this session

- Focus: "let us first focus on getting the shape of the llm abstraction right".
- Telemetry: "we also need to think about OTEL from the getgo"; "i want proper spans".
- Caching: "i think it's better if we manage our own right?"; "new agents that can be based on
  an already cached context window can always start off with work".
- Language, binary size and memory: "best to not care about this too much"; "not worrying about
  all of this any further". The engine stays TypeScript on Deno.
- Protocol: "for the iteration phase; we shall keep to zod; but i am planning to replace
  everything with protobuf before i release so as to practice realtime migration and backward
  compat in production from that point onwards".
- Naming: "i will run a review after every iteration in any case"; the working rule in
  `AGENTS.md` was approved as written.
- Orchestration always starts from a feature; implementation of this initiative will run
  through `/orchestrate` once the shape is agreed.
- Naming (2026-10-07): "wire format" is the neutral format, not a provider's HTTP schema: "to
  all the other consumers that neutral format is the wire; that's why i called it that". Text
  in this file written before that ruling uses "wire format" for the provider-side layer
  (`prepare`, `parse`) and "port" for the neutral one; the provider-side layer has no name yet.
- Overhead (2026-10-07), on the wire format: "i want to keep it as low overhead as possible as
  well".
- Intent and provider truth (2026-10-07): "i think we should define the neutral intent path in
  such a way where if later providers come in with the support they can now uphold it; however
  the actual truth of what will happen should remain at the provider level; that way requests
  won't fail"; "basically a translation of teh neutral intent path --> truth". Context: how
  provider-specific features such as mid-conversation system
  messages, their turn-scoped clearing and cache placement appear in the wire format; findings
  on opencode's approach are in [[features/engine-foundation/research/opencode-llm-2026-10-07]].
- Criteria for the shape (2026-10-07): "i want the shape to be simple; non-duplicated;
  performant and easy to reason with"; "i know some of these are opposites but that is what i
  want"; "now let us reason with that in mind".
- Storage independence (2026-10-07): "the stream shape may be influenced by the requirement
  that the log will not always be sqlite"; "it should be implementation independent"; "i am
  thinking of making hte local sqlite sync based option; but for me i will use a postgres
  database that i have provisioned in my tialnet as athena"; "i will have both implementations
  for the storage of everything".
- Engine and stores are separate (2026-10-07): "so that means by definition we are separating
  out the engine and the stores"; "even if hte sqlite dbs are in hte nodes; we have to separate
  them to handle the pg implementation right?"; "their raft logic may be similar; but sessions
  are only relevant to the engine and the engine then talks to the storage mechanism; then how
  writes and read replicas are made is solely a property of the storage mechanism that we
  create".
- Start and focus (2026-10-07): on the engine and store boundary, "good"; "that means we can
  get started with the engine and the session right away?"; "the storage/selection of nodes was
  not that big of a concern"; "it was about how we shall store the session; and how does that
  translate back to the provider specific parts". The two confirmations asked with the
  boundary (store-enforced ownership without a coordinator lease, opaque records) were not
  answered explicitly.
- Context control and cost, asked 2026-10-07 and not yet ruled: "should we include anything
  about the context control requirements with visible cache control and mechanics about cost;
  how much cost would be broken and all those; can those simply be application specific logic
  over the engine that we create? or do they have to baked in as first class properties?".
- Shared configuration (2026-10-07), on the settings record of a session: "do you mean the
  configuration and everything as well? i am thinking those should be shared as well"; "no
  reason to keep it machine specific"; "i always have issues in separating those out". Ruled
  after the proposed split: "okay then let's keep it separate"; "settings can be shared but the
  provider config would be left and kept in the machine itself". Reading: shared settings name
  a model by `ModelRef` (provider id and model id); each machine resolves the provider id to its
  own endpoint and key, so no secret or machine-relative address enters the store.
- Sequencing (2026-10-07): "do we first create the whole provider in entirety?"; on the reading
  "one wire format built completely and standing alone, not wired into the engine": "yeah by
  entirety that is what i meant".

## Engine shape proposed, not yet ruled on

Layers: application (tools and context policy) → engine loop (owns continuation, records then
dispatches tools) → model (`invoke(request, signal)` returns a stream of events for one provider
request) → wire format (`prepare(request)` gives the exact HTTP payload, `parse` turns the
stream into events) → provider (base URL, auth, quirks as data). Adapters depend only on `fetch`
and web streams. Spans are a fold over lifecycle facts, like `transcript` is a fold over the log.

Six points wait for the owner:

1. Tool execution moves from the SDK into the engine loop (the call is logged before it runs).
2. Timing facts for spans live in the durable event log, or in a side stream. Recommended: log.
3. `ModelConfig.npm` becomes a wire-format id plus provider data.
4. Reasoning is stored as text plus an opaque provider payload on the part (recommended), or
   with the raw provider response kept as well.
5. First adapter: the AI SDK behind the boundary, or straight to an own Anthropic adapter.
6. A cached base context is created deliberately, or derived by the engine.

Point 4 was narrowed on 2026-10-07 into four questions, all open: the durable shape (text plus a
payload tagged with its wire format, or raw kept as well); whether the payload sits on reasoning
parts only or on any assistant part; how it enters the log (a part-closing event or a field on
the delta, since a Claude reasoning part can have no text); and whether reasoning is replayed
across turns, which core D011 currently excludes.

Proposed on 2026-10-07 for the provider slice, not ruled on: wire formats are the HTTP schemas
of the endpoints in use (Anthropic Messages for `anthropic`; OpenAI chat completions for the
generic endpoint, `meta`, `mimo` and `groq`), and providers are data on top. The neutral port
holds only what the engine acts on. Everything else goes to one of three places: a block the
provider wants echoed becomes an opaque part tagged with its wire format and replayed in
position; request settings are typed options per wire format; a neutral intent (operator
instruction, cache breakpoint) is rendered by `prepare` according to capabilities declared as
data. A concept is promoted into the port only when the engine acts on it or a second wire
format has it. Open: an in-process hook that patches the prepared payload, which wire format is
implemented first, where the code lives, and point 5 as a formal ruling.

Also proposed on 2026-10-07, not ruled on. Design method for the wire format: derive fields
from what each consumer does with them, test the round trip against recorded provider traffic
(captures from Anthropic and MiMo await the owner's approval because they spend on the keys),
and compare prior art. Low-overhead rules: provider bytes become wire events in one step;
validation happens only where bytes enter the process; the adapter buffers nothing; only the
appended tail is rendered per step; an adapter loads when its provider is first used; cache
hits outweigh processor savings. Mid-conversation operator instructions as the worked example:
a system-role message at a position in one ordered message list, the leading ones being the
base prompt; each adapter renders it natively or as a user-turn block, decided by capabilities
frozen for the session; the log needs its own event for it so replay keeps the position.

## Package structure and the existing protocol package (2026-10-07)

Owner's direction, as asked: "i think engine and inference should be different right?";
"something like an llm package that opencode has"; "underneath that package; how do we define
hte adapters? are they part of the package itself? or are they separate packages?". Not yet
ruled.

Assessment of `packages/protocol` against intent → translation → truth:

- It holds the durable half only: log events, the folded message and part views, service
  messages, ids and ports. Its conventions (one discriminator per union, enums with wire
  strings, a unit per folder, `_version` on the envelope) already match the Protobuf rules.
- The model-facing half does not exist in it: no request, no base instructions, no tool
  declarations, no tool result as model input, no instruction message, no hints, no stream
  events for one provider request, no report of what a translation did. Today that half is the
  AI SDK's types inside `packages/engine`.
- No consumer outside the package was found for `Protocol.Message` and its variants,
  `MessageUpdated`, `ToolCallOutputDelta`, `PartStepBoundary`, `ToolCallState`, or the
  checkpoint, thread and discussion ids.
- Open shapes to close before Protobuf: `ModelConfig.options` catch-all, `providerOptions`
  record, `ToolCallPending.input` record (the event keeps tool input as a string).

Proposed, not ruled on:

- Three areas in `protocol`, sharing ids, part kinds, usage and stop reasons: the wire format
  (intent, rebuilt every step, never stored), the stream of one provider request (including
  the report of what the translation did), and the log (durable truth, what exists today).
- A separate inference package that implements the model port from `protocol`. The engine
  depends on the port only; the process entry hands it a model.
- Adapters inside that one package: a translation per HTTP schema (code), providers as data
  (endpoint, auth, capabilities, which translation), one shared transport. Each translation is
  its own unit, absent from the package barrel and loaded by literal dynamic import on first
  use; it moves to its own package only when it needs a dependency the others should not carry.
- Consequences of the intent ruling: the translation reports what it actually did and the log
  records it; the capability set a session started with is pinned so that a later adapter
  upgrade does not change the bytes of a running session's prefix.

Stream proposal (2026-10-07, not ruled on; the owner asked "how will the stream work?"):

- One provider request gives one stream. Stages: `prepare` (pure) gives the exact HTTP request;
  a shared transport fetches; shared framing turns bytes into provider frames; the translation
  is a state machine, `step(state, frame)` giving the next state and zero or more neutral
  events, with a final flush. opencode uses the same form (`initial`, `step`, `terminal`,
  `onHalt` in `packages/llm/src/route/protocol.ts`), which is what lets recorded frames drive
  tests and benchmarks without a network.
- Events: a first event carrying the report of what the translation did with the intent; the
  provider's response start (request id, served model); a start, deltas and an end for every
  part (text, reasoning, tool call), the end carrying the opaque payload or the complete raw
  tool input; usage, possibly more than once and cumulative; then exactly one terminal event,
  finished with an open-ended stop reason or failed with kind, status, retryable and delay.
- The stream never executes tools, retries or continues. The loop appends a log event per
  stream event, logs a tool call before dispatching it, and builds the next request from
  memory once results are in. Retry belongs to the loop and only before anything was emitted.
- Assumed: inference runs in the same process as the loop, so stream events are not validated
  between the two and need no compatibility rules of their own. Because they map almost one to
  one onto log events, their vocabulary still follows the additive rules.
- Open: per-kind events mirroring `text.delta` and `reasoning.delta` or one generic part
  start/delta/end; whether an abort also ends with a terminal event (today an aborted run is
  logged as `MessageCompleted`).

One-unit proposal (2026-10-07, not ruled on), reasoned from the owner's four criteria and
storage independence; it would replace the three-area proposal above:

- What the criteria rule out: three parallel vocabularies for the same content (stream events,
  log events, request parts); the two vocabularies `packages/protocol` already has (delta
  events, and `Part`/`Message` with no consumers) joined by two separate folds (`transcript`
  and `build.messages`); a durable write per delta; re-reading the log on every step.
- The part is the one unit. A session is an ordered list of parts, each with one author: the
  user or application, the model, or a tool. Storage holds completed parts only, append-only.
  The model's context is that list. A translation's stream is the model's parts as they form:
  live deltas, then the completed part, which is the same object that is stored and shown.
  Deltas are never stored.
- A tool call and its result are two immutable parts, so a call is stored before it runs and a
  call without a result is visibly unresolved.
- Rule for waiting: deltas never wait on storage; a completed part is written before the loop
  acts on it (runs the tool or sends the next request).
- Storage port: small and asynchronous (append parts, load a session), with SQLite and
  Postgres behind it. Live delivery to hosts comes from the running session in the engine
  process, not from storage.
- Costs: a part still forming when the process dies is lost; another device cannot follow live
  text through the database; it changes `protocol`, `engine`, `transcript` and the log adapter
  rather than adding beside them.

Single committer (2026-10-07). The owner, on the one-unit proposal: "that means the committer
and hte engine that is running must live in the same host/node"; "how shall we uphold that
assumption?". Proposed answer, not ruled on, and part of G005:

- The invariant is the one [[roadmap/items/R105-replicated-session-log]] already states as
  intent: one active engine per session log, and viewing is not leading (a host submits to the
  owner and subscribes to what it commits). Only the loop and the commit must be together;
  the store and the devices that run tools may be elsewhere.
- Enforce it at the store instead of assuming it: a session is claimed by compare-and-set on
  an ownership record carrying an epoch; every append carries the writer's epoch and expected
  position and is refused when stale. Other devices never append; they submit to the owner.
- The waiting rule doubles as the safety guard: a tool-call part must be committed before the
  tool runs, so a stale engine is refused before it can cause a side effect. A tool already
  running when ownership changes is not covered by this and stays with G005.
- With Postgres the database can arbitrate, with the ownership check and the append in one
  transaction. R105 placed the lease at the mesh coordinator at a time when no shared database
  was planned. With one local SQLite file the owner is trivially the only writer.
- Today nothing enforces it: `packages/event-log-sqlite` writes a constant `EPOCH = 0`.
- Open: whether SQLite replicated across devices is still a case, and what "sync based" meant
  for the local option; whether takeover is an explicit user action or automatic on expiry.

Engine and store boundary, proposed 2026-10-07 after the owner's ruling that they are
separate (the boundary itself is not ruled on):

- The engine owns sessions, parts, the loop, the decision to claim or take over, and live
  delivery to hosts. Only engines talk to a store; hosts talk to an engine.
- A store owns durability, ordering, replication, read replicas and any consensus among its
  own nodes. It does not know what a session or a part is: it keeps named append-only logs of
  opaque records.
- Contract every store meets: append to a log conditionally on the expected position and the
  writer's token, refused when either is stale; claim a log, which issues a new token and
  invalidates the old one; load a log from a position. A successful append is durable and
  ordered, and a load after a successful claim returns everything committed, so a store with
  lagging replicas must serve that read itself.
- Two guarantees stay distinct: replicas agreeing on a log is the store's; which engine may
  append now is decided by the engine and enforced by the store's conditional append. Under
  this reading the mesh coordinator holds no lease, which departs from R105 and is the
  comparison G005 asks for.
- Structure today already has the seam: `EventLogPort` in `packages/protocol`, the adapter in
  `packages/event-log-sqlite`, an in-memory log in `packages/engine`. The port is what changes
  (asynchronous, conditional append, no session knowledge), and Postgres becomes a second
  adapter.

Stored session and its translation back (2026-10-07, proposed, not ruled on; names
illustrative):

- The stored session is one ordered list of parts. From the application or user: settings
  (base instructions, tools, model), text, file, instruction (with a lifetime), exclusion (a
  record naming earlier parts, since stored parts never change). From the model: step start
  (what the translation did, request id, served model), reasoning, text, tool call (raw input
  string), step end (stop reason, usage with cache read and write) or step failure. From a
  tool: tool result. A model-authored part may carry an opaque payload tagged with the
  translation that wrote it. Messages are not stored; a translation groups parts into them.
- Rendering to Anthropic Messages: settings to `system` and `tools`; user parts to `user`
  blocks; instruction to a `role: "system"` entry or wrapped user text, lifetime to `clear_at`;
  reasoning to a `thinking` block with the payload as signature; tool call to `tool_use`; tool
  results of one step to `tool_result` blocks in one `user` message; cache marks from hints.
- Rendering to OpenAI chat completions: settings to the leading `system` message and `tools`;
  instruction to a `system` message in place or wrapped user text; reasoning to
  `reasoning_content` where the provider wants it back, else omitted; text and tool calls to
  one `assistant` message (`arguments` takes the raw input string as is); tool result to a
  `tool` message.
- A payload written by another translation is ignored, so a session can continue on another
  provider without migration.

Context control and cost, proposed split (not ruled on): first class only when the engine
must act on it to build the request, or when it is provider truth that cannot be recomputed
later. That makes first class: the operations that change what the model sees (exclude,
compact, fork), stored as parts; per-request usage including cache read and write; where
cache marks were placed and with what lifetime; request times. Application logic, or shared
pure functions over those facts: cost in money and price tables, a preview of what an edit
would break (cache from that position, and later reasoning on a model with thinking binding),
budgets, policies for when to exclude or compact, and what is shown. Input tokens reported at
each step end give the exact prefix size at step granularity; inside a step it is an estimate.

Shared configuration, proposed split (2026-10-07, not ruled on):

- Test for one value: would it be the same if the owner sat at another of their devices? If
  yes it is shared. It is machine-specific only when it describes the machine itself or is
  needed to reach the store.
- Machine (bootstrap, a small local file or environment): where the store is and how to reach
  it, local paths and sockets, this device's identity and label, this process's log level.
  From today's `packages/config`: `KUIB_DB_PATH`, `KUIB_DAEMON_SOCKET`, `KUIB_ENGINE_SOCKET`,
  `KUIB_DAEMON_PORT`, `KUIB_DAEMON_URL`, `KUIB_LOG_PATH`, `KUIB_LOG_LEVEL`, `KUIB_NODE_LABEL`,
  `KUIB_CONFIG`.
- Shared (in the store, as one more named log under the same contract): default model,
  provider definitions, base instructions, tool settings, preferences, mesh membership. From
  today: `KUIB_MODEL`, `KUIB_MIMO_BASE_URL`, `KUIB_MODEL_BASE_URL`, `KUIB_MESH_CONFIG`,
  `KUIB_TRACE_ENDPOINT`.
- Session: the settings record is a snapshot of the shared values a session actually ran
  with, kept because shared configuration changes later while a session must stay
  reproducible and its prefix byte-stable.
- Two awkward cases: secrets (`KUIB_*_API_KEY`) are shared in meaning but must not sit
  readable in the store; an address relative to a machine (a provider at `localhost`) is not
  shareable as written and belongs to the device that serves it.
- Open: whether a machine may override a shared value; how secrets are shared; what a device
  uses when it cannot reach the store.

Engine shape, refined 2026-10-07 after the owner deferred the configuration wiring ("well let
us plan these later; should be easy to wire in"; "let us think of the engine please"; "what
are the still open things with the shape"; "do we store the deltas in memory and commit at a
boundary? is that your desired shape?"). Proposed, not ruled on; it refines the flat part list
above:

- Deltas are not kept. Each one is added to the part forming in memory and forwarded to
  hosts. The commit boundary is the model step, not the part: a whole step is committed as one
  record when it ends. A partial step cannot be continued with a provider anyway, so nothing
  the model could use is lost by not storing it earlier.
- Stored records, each committed whole and once: settings, input (user text and files),
  instruction, exclusion, step (the model's parts: reasoning, text, tool calls, with what the
  translation did, stop reason, usage and times on the record itself), tool result. A step as
  one record removes the paired start and end markers and makes "only whole steps are stored"
  structural. This is close to `Message` and `Part` as they already exist in
  `packages/protocol` with no consumers; the delta events are what goes away.
- Commit points, each before the engine acts: input when submitted, a step when it ends,
  each tool result when it completes. Tools run only after their step is committed, which
  rules out starting a tool while the model is still streaming.
- Open: a step as one nested record or a flat list with markers; how an aborted step and a
  failed step are stored, and whether a retried attempt leaves a record; one record per tool
  result or one per step; where an input submitted during a step is ordered (proposed: held
  and committed right after that step); payload placement and reasoning replay; the formal
  ruling that tool execution moves into the loop; records for compaction and forks.
- The owner on this (2026-10-07): "that still feels like duplication of things; however it's
  right that storing all of the delta is inefficient storage and consumption of memory"; "can
  we use someting like merkle trees to cache the resolution of the deltas after a particular
  point?". Answer given, not ruled on: the saving comes from storing the resolved result once,
  which the step record already is, and a hash structure adds nothing to that; a delta is the
  content in transit and is never kept, so nothing is stored twice. Hashing does pay one level
  up, as a chain like git commits rather than a tree: each record names its parent and carries
  a hash of everything before it. That gives forks that share a prefix without copying it, a
  stable name for "the context up to here" (to match a provider cache entry, reuse rendered
  bytes, detect a changed prefix), and fits the append-only prefix the providers require. A
  balanced Merkle tree serves comparing replicas, which is the store's concern.

## Protocol changes identified

Required by an engine-owned loop:

- `ToolCallStarted` needs `messageID`, `partID`, and required `name` and `input`.
- `MessageFailed` carries only `error: string`; failures need a kind, HTTP status and whether
  they are retryable.
- Stop reasons lack `refusal`, and unknown reasons are mapped to `interrupted`.
- Reasoning parts need a provider-opaque payload so they can be replayed.
- `ModelConfig.npm` names an SDK package.

Dependent on the rulings above: timing fields or events, `SubmitMessage` taking parts instead
of `prompt: string`, and whether a cached base is a protocol entity (`CheckpointID` exists and
is unused). New area: request, stream events, tool declarations and the model port, kept
separate from log events.

For the Protobuf move: avoid open-ended shapes on the wire (`ModelConfig.options` catch-all,
free-form `providerOptions`), only add optional fields, keep unions discriminated by one field.
`z.toJSONSchema` already converts the event envelope, submit message and model config.

## Constraints found

- On current Claude models a thinking block's signature binds it to the system prompt, the
  tools and every earlier message. Editing, excluding or removing an earlier turn invalidates
  every later thinking block (a 400 on accounts created from 2026-08-31 unless the request asks
  for the blocks to be dropped). Exclusion, message editing and keep-tail compaction all count
  as edits. Documented, not yet tested live: with
  `thinking.block_binding.prefix_mismatch_behavior: "drop_block"` (beta header
  `thinking-binding-controls-2026-08-01`) the API drops the first mismatched block and every
  thinking block after it, keeps the earlier ones, and lists each drop in
  `input_transformations`; stripping the same blocks client-side is the recovery without the
  beta. Server-side compaction and context editing do not count as edits.
- Thinking blocks on those models carry no raw reasoning: the text is a summary, and under the
  default `display: "omitted"` it is an empty string, so the signature is the reasoning. Blocks
  go back exactly as received, including empty ones. A block is also bound to its model: a
  model that cannot read it has it dropped by the API, unbilled. On Opus 5.5, Sonnet 5.5 and
  Fable 5.1 the notes between tool calls arrive as thinking blocks too, readable only with
  `display: "updates"` or `"summarized"`.
- A mid-conversation `role: "system"` message is append-only: it keeps the cached prefix and
  later thinking blocks valid, and is the documented way to change instructions mid-session. It
  is a candidate carrier for a worker's role on a shared base (not supported on Sonnet 5).
  Launched 2026-05-28 on Opus 4.8 with no beta header; it must directly follow a user turn
  (tool results count), cannot be the first message, and is Anthropic-only
  (`platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages`).
- Source for the three points above: Anthropic's model-migration guide, preserved-thinking
  sections, read 2026-10-06.
- Prompt caching is an exact prefix match over tools, system and messages; caches are per
  model; entries live 5 minutes (1 hour at double write cost) and reads refresh them; an entry
  is readable only once the first response starts streaming. A shared base must be byte
  identical for every fork, so a worker's role cannot live in the system prompt. Compaction as
  written in R208 rewrites the prefix; a frozen base with an appended handoff does not. File
  staleness in a base is unsolved.
- Bearing on point 5, read 2026-10-07 from the installed `@ai-sdk/anthropic` 4.0.54
  (`dist/index.js`): it already sends mid-conversation `role: "system"` messages with
  `clear_at`, per-message effort and tool changes, places `cache_control`, round-trips thinking
  signatures, sets `thinking.block_binding`, and returns `input_transformations`. Feature
  access is therefore not an argument for an own Anthropic adapter. Exact control of the bytes,
  the SDK's weight (not measured on its own), its open option records and own spans remain.
- Phoenix accepts only `application/x-protobuf` on `POST /v1/traces` (gzip or deflate allowed).
- Daemon: Deno 2.9.6 has no pseudo-terminal API; terminals, sandboxing and process-tree control
  need native code whichever language the daemon is in. Parked by the owner.

## Measurements and review

All in [[features/engine-foundation/research/deno-namespace-bundling/review]]: the citation
audit, the `import defer` findings (blocked today: plain compile fails on the pnpm layout,
bundled compile and tsgo under `NodeNext` reject the syntax), binary size (100 MB, 73.8 MB with a
stripped runtime), and the `--engine quickjs` crash. Memory per loaded package, measured this
session and not yet in that file: Deno floor 38.9 MB resident, protocol 53.3, config 62.6,
daemon 64.9, engine 77.1, telemetry 93.7, everything `serve` imports 103.3 (unbundled
`deno run`, after GC, Linux arm64).

Cost of rebuilding the model context from the log, measured 2026-10-07 on eos (Linux arm64,
workspace Deno, median of five, throwaway script) with a synthetic session of forty text
deltas and one 2,000-character tool result per step:

| | 9,893 events, about 190k tokens | 49,883 events, about 970k tokens |
|---|---|---|
| Read rows from SQLite | 10.7 ms | 54.3 ms |
| Rows plus `JSON.parse` | 18.6 ms | 95.2 ms |
| `replay` with the Zod parse, one pass | 18.8 ms | 100.3 ms |
| `buildMessages` on SQLite as it is today (two passes) | 36.1 ms | 212.5 ms |
| `buildMessages` on the in-memory log (fold only) | 1.1 ms | 5.2 ms |
| `JSON.stringify` of the result (0.77 MB and 3.87 MB) | 0.5 ms | 2.6 ms |

Reading and parsing rows is nearly the whole cost; the fold and the serialisation are
negligible, and the Zod parse on replay adds little. Schema finding from the same pass: replay
runs `EventEnvelope.parse`, whose `_version: z.literal(1)` and discriminated union reject an
envelope or event type they do not know, so an older reader fails on a newer log.

Cost of appending one event, measured 2026-10-07 on eos (2,000 `TextDelta` appends,
microseconds per event): SQLite log as it is today on ext4/NVMe 68.3; the same on tmpfs 16.9;
in-memory log 2.1; a bare insert with a commit each at `synchronous = FULL` 85.7 and at
`NORMAL` 15.3; a bare insert inside one transaction 2.9. The orchestrator awaits every append
before reading the next stream part, so on a networked store each delta would cost at least
one round trip. Latency to the owner's Postgres was not measured. Also noted: `EventLogPort`
has a synchronous `replay` and `subscribe`, which a networked store cannot satisfy.

Owner's comments on the three areas (2026-10-07): on the wire format, "are we sure this is low
overhead? if we rebuild it on every turn? it is because then we can handle migrations and
updates in the inference provisioning by just updating the code"; on the stream, "this also
needs to handle migrations and updates in the schema very fluently without challenging us"; on
the log, "why are we considering this different? is this an application wide log?".

## Smaller items waiting for the owner

- Four naming asymmetries in the protocol: `StepFinished` against `MessageCompleted` and
  `ToolCallCompleted`; `ToolCallFailed` (event) against `ToolCallError` (state);
  `STEP_START`/`STEP_STOP` against `Started`/`Finished`; `ServiceMessageAny` against `AnyEvent`.
- `@ai-sdk/openai` is declared by the engine and not imported; `@trpc/server` is also listed in
  the root manifest.
- Plan G002 still says pnpm inclusion is unverified; the review shows it fails.

## Orchestra work done in this session

Recorded on the agent-harness checkpoint note. In short: the first live round ran with claude,
codex, agy and opencode; spawn, restart, resume after a closed window, steering while stopped
and while busy, and `watch --match` all work on the four. Deferred by the owner ("let us handle
all of that later"): resuming through each agent's own session id, surviving killed sessions and
reboots, pre-execution tool-call interception through agent hooks, and an automated test.

## First five minutes

1. `pnpm journal handoff engine-foundation`, then this file.
2. `git status`: the orchestra changes after commit `bfb2ed6` are uncommitted
   (`tooling/orchestra.ts`, the orchestrate guides, `journal/domains/infra/current.md`, the
   agent-harness plan and the four `live-*` task records). `pnpm run check` was green.
3. Ask the owner which of the six points to settle first; reasoning storage (point 4) was the
   one under discussion.
