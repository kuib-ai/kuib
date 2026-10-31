---
title: Engine design as reasoned on 2026-10-07
date: 2026-10-07
origin: ["conversation 2026-10-07"]
---

# Engine design as reasoned on 2026-10-07

The single current description of the engine design. It replaces the engine proposals in
[[features/engine-foundation/research/continuation-2026-10-06]], which stay there as history
(see "Superseded" below). Nothing here is built. Each statement is marked by where it stands:
**ruled** (the owner's explicit words), **agreed** (the owner accepted it in discussion) or
**proposed** (reasoned, awaiting the owner).

The owner asked on 2026-10-07 to reason first and record afterwards ("don't just store things
blindly"; "do reason with me first please"), then: "please record everything of our
discussions"; "let us get started with the inference".

## The model in three sentences (agreed)

Persistence is the truth, written at boundaries by the one engine that holds the session. The
stream is an append-only preview copied between nodes, and it doubles as the recovery source
for a step that is still open. Engines are workers that hold nothing of their own.

## Layers

Each layer treats the content of the layer above it as opaque.

| Layer | Defines | Needed for the inference slice |
|---|---|---|
| 1. Format | Parts, records, and the chunks a step arrives in | Yes |
| 2. Engine loop | Reconciling asked and answered operations | No |
| 3. Stream store | Sequence numbers, hashes, following a stream | No |
| 4. Persistence | Records at boundaries, the lease | No |
| 5. Node communication | Copying streams, pulling the longest copy | No |

A translation only produces chunks; how chunks are copied or stored never changes what is
inside one. The owner asked whether the neutral format depends on all of this ("i know we are
building the provider but the neutral format; it depends on all of these discussions right?").
Answer given: only on layer 1.

## Properties and mechanisms

The owner asked "how do we keep track of all these things; main point is to primarily identify
how changing a property somewhere affect all the other system properties". Proposed: this map,
plus executable checks (the real engine run against a fake store, provider and daemon under a
scheduler that kills, sleeps and cuts connections; each property a named check). A formal
model was named as the heavier alternative.

| | Property | Standing |
|---|---|---|
| P1 | Partial output survives an engine death, up to what its stream copy holds | agreed |
| P2 | All consumers are treated alike; streaming continues across sleep and takeover | ruled |
| P3 | Tool results are never stranded | ruled |
| P4 | Where the engine runs does not matter | agreed |
| P5 | Storage is independent of its implementation | ruled |
| P6 | Neutral intent, provider truth; requests do not fail | ruled |
| P7 | Simple, non-duplicated, performant, easy to reason with | ruled |
| P8 | One source of truth for files | ruled (plan D005) |
| P9 | Streams and persistence are separate things | ruled |

| | Mechanism | Exists for | Assumes |
|---|---|---|---|
| M1 | The stream is an append-only log outside the engine, copied between nodes | P1, P2, P4, P9 | M3 |
| M2 | Writes to the stream are batched at the store's pace | P5, P7 | |
| M3 | A stream has one writer and is identified by session and lease epoch | P1, P4 | M6 |
| M4 | Every operation is an asked-and-answered pair with our own id | P1, P3, P7 | |
| M5 | The loop only reconciles committed records | P4, P7 | M4 |
| M6 | Ownership is a lease in persistence: claim, then fenced writes | P4 | |
| M7 | Persistence wins over any stream copy | P1, P9 | M6 |
| M8 | A performer never repeats an effect for the same id | P3 | M4 |
| M9 | The engine has no hands; tools sit behind a daemon on a named device | P4, P8 | |
| M10 | A translation renders stored parts per provider | P6 | |
| M11 | A consumer's text for an attempt always ends equal to its closed record | P2 | M4 |

## Owner's words (verbatim) and where each stands

- Partial output: "why can't partial steps be provided to teh model?"; "i think outputs that
  are still incomplete can be sent back"; "tool calls should be stripped maybe; even
  incorrect/partial ones; however the outputs can be there if i interrupted in the middle; the
  agent also gets a sense that some interruption happened"; "but even at those boundaries;
  those deltas can be accumulated i think"; "because there will be at least some event that
  will mark the end of that boundary/set of deltas". **Ruled.** It corrected an earlier claim
  of mine that a partial step is unusable.
- Consumers: "another one of my requirements however was to stream back the tokens to all other
  consumers subscribed/watching the same session"; "for that we need to make one point and fan
  out all of the streams so all consumers are treated alike"; "well consumers can be browsers
  and terminal ui in the same machine"; "should be a first class property for correctness";
  "also late jooiners after starting off a session"; "suppose i put my laptop to sleep and came
  back"; "that shouldn't stop streaming". **Ruled.**
- Engine death: "yeah it can simply handle interruptions as an engine died; and then retry;
  same as connection cutoffs"; "a new engine gets elected somehow through however we define the
  raft or whatevre mechanism we shall use"; "shouldn't be any difference; a new engine gets
  elected and the session starts streaming back; however here if we tie the stream with the
  host; the laptop has to now find the new engine again and subscribe back". **Ruled.**
- Tool results: "the tool results also must never be left stranded"; "teh tool results
  generally will run on daemons". **Ruled.**
- Both dying: "yeah so what about when daemon and engine both die?"; "let's say they were the
  same node". Answer accepted: "yeah got it".
- One solution: "i hope we are not missing any correct solution where we can handle this
  together; not separately". Answer: the asked-and-answered loop below.
- The step as a pair: "yeah we should go through with this i think; talking about the same
  machine engine case right? if the engine itself dies; there is no way to assume that the step
  is finished or send an event for an end-delta"; "something has to pick this up separately and
  mark it as completed". **Agreed.**
- The stream leaves the engine: "yeah but if the steps were saved inthe engine node ram then it
  won't be found"; "that means the stream must go to some common place; which makes the
  separation of stream with persistence kind of moot"; later "the main point is that stream and
  persistance may be different; the persistance throughput ishte blockign thing for us; so we
  may use a more throughputty mechanism in hte middle"; "my main point was to remove the stream
  from the engine itself; that way maybe fan out will also become simpler". **Ruled.**
- What holds the stream: "yeah i meant a distributed system for temporary logging; sqlite is
  the solution for that"; "sqlite with proper raft"; then, after the reasoning on Raft: "no i
  think streams and persistence must not be confused; postgres will be the persistence engine;
  the stream engine will report after boundaries and offload to storage; that storage may in
  turn be the same sqlite or maybe postgres"; "the stream however must be append only; that way
  we may fan out and commit acknowledgements from other nodes; then whichever engine picks it
  up; it gets the latest stream from its own stream; if it lags behind more than the others;
  maybe we'd have to accept that and move on; the engine sees the latest state of teh stream;
  if it's ongoing; it stops the delta with a boundary; moves that off to the persistence".
  **Ruled.**
- Checking the model: "is this an alright mental model?"; "does this introduce new cases that i
  am missing?"; "the only thing i am fiddly about yet is that engines now will have a link with
  the session"; "despite them being separate things"; "is this a smelly sign?". Answer below
  under "The lease".
- The interface after a takeover: "the UI sees a new token; however the engine has died because
  of let's say a network hiccup; new engine picks up"; "how do we update the UI? because the
  new token will now be incorrect; we'll have to send some sort of dirty mechanism to refresh
  the text nodes in the UI too on such events?". Answer: M11.
- Pulling the longest copy: "your earlier suggestion of the new engine requesting the longest
  copy mitigates this; however will that introduce any overhead?"; "or rather incorrectness is
  the word". Answer below.
- Communication: "who responds; how does the communication work"; "we'd have to define all of
  that". Layer 5, deferred.
- Focus: "yeah well the engine is what i'm excited about that is why spending most time doing
  that".
- Spawning sessions: "i think this could be through tools or through the kuib cli itself; i use
  tmux for the orchestra; that part lands later; however it may be that there could be
  dependencies on hte engine format that may change how that works". **Deferred.**
- Context control: "they should be managed separately as a checkpointer"; "basically the
  context window reads from a checkpointer; which in turns populates itself from the
  persistence; similar to langgraph". **Ruled as direction; shape open.**
- A tool on a sleeping device: "it means that there is a timeout for the tool with a lease that
  the daemon holds; as soon as it loses that; maybe we declare it as unknown; however this is
  dangerous since hte daemon can proceed and mutate things in the bg; let us discuss this;
  however it seems this is a daemon level thing". **Open.**
- MCP: "mcps can also expose file system things; then the engine fs will get exposed to the
  agent as separate from the daemon"; "that would mean problems for stateful mcps right? let's
  say i run the mcp that depends on a previous state but in another daemon; that much should be
  clear to the agent right?"; "for now let's keep it simple; mcps generally hjave some opinion
  over the context window right? basically prompts or some other things; everything else is
  basically tools"; "so we may take this up later; i was just clarifying how it would be
  handled". **Deferred.**
- The schema package's name: "is protocol a good name for the schema package? or should i
  rename it as schema?"; after the reasoning that it holds ports and rules as well as shapes:
  "if protocol itself imports schema"; "there is no reason to differentiate them". **Ruled:**
  one package, and it stays `protocol`.
- First translation: "yeah let us nail down the anthropic messages first". **Ruled.** Asked
  with it: "will the xiaomi anthropic format be a good test case? or do i need an actual
  anthropic model?" (see "MiMo's Anthropic-compatible endpoint" below).
- Per provider or per format (2026-10-07): "that means we have to implement on a per provider
  basis right?"; "format may be different of the messages, family may be different or similar".
  Reasoned: the translation is chosen by format alone; behaviour switches belong to the served
  model (a host, a format and a family together); tagging the opaque payload by format alone is
  wrong, and whether a model may be sent earlier reasoning is a lookup on the model that
  produced it, which a step already records.
- Identity and plugins (2026-10-08). **Ruled as requirements; the design is under discussion:**
  "do we follow a model like openrouter? i want enums everywhere; as well as expose those apis
  as plugins"; "the plugin part should also be discussed beforehand sicne it shall play a part
  in the shape of the inference engine"; "i want each and every section of every part of the
  runtime to be configurable through plugins"; "adding new provider integrations for people
  should be easy as pi; howveer it may be; can be their own implemetnation too; i want to make
  the protocol in such a way that it's easy for plugins to exist"; "i also do NOT like the
  free-form method of model proviosioning such as \"openai.gpt-astra-6\" and \"gpt-astra-6\" ;
  these are bedrock and openai native model slugs"; "i want erverything to be defined as a
  proper enum; of course that will be translated to the actual model slug name before ifnerence
  calls"; "we make provider and model a first class property and then derive how to implement
  them; and for this i want a scalable way to define the different implemetnations across
  anthropic/xiaomi/openai/bedrock or whatever proviuder may be"; "the format and schema must
  also handle the differences between streaming internally also in propviders; anthropic itself
  have some basic differences in how they handle older and newer models".
- One format per offering (2026-10-08): asked whether an offering names one format or the
  format joins the identity, "yeah keep one format; we do test which covers more features of
  the endpoint and choose that for it". **Ruled.** Also "regarding hte format; the
  implemnetation on a provider/model config is also different per format right?", answered
  yes: an offering holds neutral switches plus a block typed per format.
- Context assembly per application (2026-10-08, dictated): "the engine … should be responsible
  for basically streams stream generation and assembly of the context window however I was
  thinking that in the coding agent the assembly of the context window it would be very
  different than the voice system"; "for the voice system I may major use the made conversation
  system call messages and switching between reasoning on and off between turns because for the
  first turn it needs to start speaking very fast so most likely I will disable reasoning for
  that specific term however subsequently I will enable it Im not sure yet how it affects
  cache"; "the engine how it will assemble context will be different on a per application
  basis"; "we are still not building the engine we are building the inference currently but
  that is a point I think which we should record". **Recorded as a requirement on the engine**,
  for when it is built: the engine assembles context, and how it does so is the application's
  to decide. What it asks of inference is in [[features/inference/plan]] decision D016. Known
  fact for the cache question: on Anthropic a change of thinking or effort at the top of a
  request invalidates the cached messages; the cache-preserving form is an effort change
  carried by a system message inside the conversation, on newer Claude models behind a beta
  header.
- Inference graduated (2026-10-08): "i hope now you have more or less a lot of idea about the
  inference shape?"; "acn you /journal-graduate the plan for this?". Done as roadmap item R020
  and [[features/inference/plan]].
- The owner's work system: "in our own system we use redis for the durable execution and then
  at boundaries; persist it to postgres"; "yeah figr.design is fundamentally differnet; it is a
  single machine".

## Layer 1: what the format must support (agreed)

- A step can be cut at any chunk and still be valid, so each part records whether it is
  complete.
- A step ends in one of five ways: completed, interrupted by the user, failed, cut off by a
  limit, or abandoned (written by a different engine than the one that asked).
- The closed record is buildable from the chunks alone, so the opaque provider payload, the
  stop reason and the usage all travel in the stream.
- Identity is ours. A provider's tool-call id is kept as data and is never the key, because it
  is not unique per execution.
- A step is a pair: what was asked, and what was answered. "Step asked" is committed before
  the provider is called.
- A step's context is everything committed before it was asked. Input that arrives during a
  step is committed at once and belongs to the next step. When rendering, a step's answer sits
  where it was asked and later input follows its tool results.

What can go back to the model after a cut (the translation decides what a provider accepts):

| Cut off during | Stored | Sent back |
|---|---|---|
| Text | The partial text, marked cut off | Yes |
| Reasoning | The partial text, no payload | Not on Claude: the signature arrives only at the end |
| A tool call, input incomplete | What arrived, marked cut off | No |
| A complete tool call, not yet run | The call, plus a result saying it was not run | Yes, both |
| A tool already running | The call, plus a result saying it was interrupted | Yes, both |

Open: whether complete tool calls of an interrupted step are kept with an "interrupted" result
(proposed) or stripped as the owner first suggested. Untested: that Claude accepts cut-off
assistant text followed by a user message when thinking is on.

## Layer 2: operations and the loop (agreed in outline)

| Operation | Performer | When asked again with the same id |
|---|---|---|
| Model step | A provider, through a translation | Generates again; there is no effect to repeat |
| Tool call | A daemon on a named device | Returns the stored result, or attaches to the run |
| User input | The interface | Resends; the engine ignores a duplicate |
| Approval or question | A person, from any device | Stays open and visible until answered |

The loop, as rules over committed records:

1. An open step asked under an earlier lease: recover it from the stream, then persist it.
2. Open tool calls: ask each one's daemon with our id, and persist each result as it arrives.
3. All tool calls of the latest step answered: ask the next step.
4. The latest step completed with no tool calls: if there is newer input, ask the next step;
   otherwise the session is idle.
5. An interrupt was committed: tell the performers to stop, and answer what is open as
   "interrupted".

Starting, continuing, waking from sleep, restarting a machine and taking over are the same
rules over the same input. This is the durable-execution pattern.

## Layers 3 and 4: stream, persistence and the lease

- **Persistence** (ruled): Postgres for the owner, SQLite otherwise. It holds closed records
  and the lease, and is what a session is loaded from. Its contract is append, claim and load,
  with reads by position or range.
- **Stream** (ruled): append-only, one writer, copied to other nodes, which acknowledge how far
  they have it. The copy belongs to the node; the engine is a client of its node's stream
  store. Every consumer follows the stream on its own node and never looks for the engine.
- **The lease** (agreed): the only link between an engine and a session. Any engine can take
  any session. Test to keep applying: kill the engine at any instant; the loss must be at most
  the last unwritten batch. The one thing bound to the engine process by nature is the open
  provider connection, which is why an attempt dies with its engine.
- **Takeover** (agreed): claim first, which raises the epoch so the old engine's writes are
  refused; read persistence; recover only what persistence still shows open; persist the cut
  before announcing it; then continue. Marking the old step abandoned is safe without assuming
  the old engine is dead, because after the claim it cannot commit. The only separate component
  a single machine needs is something that restarts the engine process.
- **Lag** (ruled): a new engine uses its own copy; if it lags, the tail is lost. Safe because
  every copy is a prefix of the writer's.

Cases the model introduces, each with its guard:

| Case | Guard |
|---|---|
| The old engine persisted a step the new engine's copy still shows open | Persistence wins |
| A zombie engine keeps appending | A stream is identified by session and epoch; consumers switch to the higher epoch |
| Viewers on the old engine's side see text that is later discarded | Previews are provisional until persisted |
| Copying between nodes breaks while persistence advances | A consumer falls back to reading persistence |
| A copy has a gap | Nodes copy by cursor, strictly in order; the acknowledgement is that cursor |
| The stream holds a finished step that was never persisted | The new engine persists it as completed |

Pulling the longest copy before cutting (proposed) adds no incorrectness if three things hold:
"longest" means the highest writer-assigned sequence number, stored only directly after the
previous one; every chunk carries a running hash so the pulled tail provably extends the local
copy; and the takeover order above is kept. What remains is trust in a node that lies, which
needs writer signatures (open), and a bounded wait.

Consumers (agreed): a preview belongs to one attempt and is provisional. When the attempt's
closed record arrives, the interface makes its text equal to the record. The record can carry
a length and hash so a match costs nothing; on a mismatch that one step is re-rendered. Open:
whether shrinking text is simply shown, shown as tentative until another node confirms it, or
avoided by delaying display.

## Daemons and tools

- **Never stranded** (ruled): the daemon runs each call once by our id, writes "started" to a
  durable local journal before running, and keeps the result until an engine acknowledges
  having committed it. A committed call records which device it was sent to. Proposed: the
  daemon writes a running tool's output to a local file so an interrupted call returns what it
  had.
- **Engine and daemon on one node dying** (accepted): no new mechanism. If the node returns,
  the loop asks again with the same ids. While it is down another engine can run model steps
  but tool calls bound to that node wait. If it never returns, someone declares the device gone
  and the open calls get "device lost, outcome unknown". A tool with an effect outside the
  machine stays truly unknown in that case.
- **A tool on a device that lost contact** (open, owner: daemon-level): proposed principle,
  only the party controlling the effect may end it. The daemon holds a lease from the engine
  and freezes the tool when it lapses, neither killing nor continuing it; once the lease has
  surely expired the engine may answer the call as "detached, frozen on that device"; resume
  or kill is decided when the device returns. Weak spot: a machine put to sleep while the
  lease is valid thaws the tool a moment before the daemon can check.
- **The engine has no hands** (proposed, MCP deferred by the owner): the engine runs no tools,
  touches no files and starts no processes. An MCP server is attached to a device and reached
  through its daemon, which is the only MCP client. A tool's identity includes its device, the
  engine never re-routes a call, a change of device is an explicit recorded instruction, and a
  restarted server instance says so in its result. A server contributes to context in three
  places: tool declarations, optional instructions, tool results.

## The checkpointer

Direction ruled by the owner: context control lives in a separate checkpointer that the
context window reads from and that fills itself from persistence. How harnesses do it, read on
2026-10-07 (LangGraph and Claude Code from their docs, Codex at commit `5b0b253`, opencode at
`ecc4916`, Aider from source):

| Harness | Truth | How an edit is recorded | What the model sees |
|---|---|---|---|
| LangGraph | A full state snapshot per step, chained to its parent | The message list in the state is rewritten | The latest snapshot |
| Codex | An append-only file of the provider's own items | A `Compacted` record carrying the whole replacement history, or an opaque provider checkpoint tied to the model | The replacement history, then everything after |
| opencode | Messages and parts in a store | A summary plus a marker for where the kept tail starts; old tool outputs flagged, newest 40k tokens protected | From the last compaction on, flagged outputs as placeholders |
| Claude Code | An append-only file, each record naming its parent | A summary is inserted, originals stay; rewind and branch start a new path; files snapshotted per prompt | The active path, the summary standing in for what it replaced |
| Aider | An in-memory list | The older half is summarised recursively | Summary plus tail |
| Provider-side | The provider | A compaction block sent back, or results cleared on their side | The provider decides |

Codex in detail: while a session runs, history is an in-memory list; a compaction swaps it and
appends the record. On resume the file is read newest to oldest and stops at the newest
compaction that carries a replacement history; a compaction without one forces a full replay.
The user-visible transcript is a separate reader over all records, where a compaction is a
marker and earlier turns stay visible. Codex's rollback is a marker applied by a forward pass,
which its own code calls legacy and migrates away from, because two readers had to agree.

Three shapes: a reducer over stored operations; a snapshot plus suffix; a view by reference.
Proposed for kuib: the checkpointer applies an operation once and stores the resulting view by
reference (ranges of records plus any summaries), names its parent, and is itself a record in
persistence. A new checkpoint exists only when the view changes by something other than
appending, so an ordinary step costs nothing. The model reads the latest view plus what was
appended since; interfaces read all records and show a checkpoint as a marker.

## Research: what could hold the stream

Asked by the owner as "the serverless distributed equivalent" of Redis streams, meaning "a
distributed system for temporary logging". Nothing found is an embeddable TypeScript library,
distributed, with those semantics.

| Candidate | What it is | Runs as |
|---|---|---|
| NATS JetStream | Streams with replay, per-message expiry, deduplication by message id, conditional publish on expected sequence; Deno and browser clients | A small server binary |
| Durable Streams (Electric) | An open HTTP protocol: append, read from an offset, live tail, close, expiry, fork, idempotent writers, fencing; MIT, beta | A server, or hosted |
| S2 / s2-lite | A stream store API with an open-source single-node server; every append durable before acknowledgement | Hosted, or one binary |
| Hypercore | A peer-to-peer append-only log, one writer, signed Merkle tree, live replication; native Node modules, Deno support unchecked | A library in the process |
| rqlite | SQLite with Raft as one binary per node; read replicas, queued writes, change capture | A sidecar |
| dqlite | An embeddable C library with Raft; Linux only | A library |

On Raft for the stream: it gives availability and local reads, not throughput; it needs a
majority of always-on voters (one voter gains nothing, two is worse than one); writing our own
was advised against. The owner then ruled the stream is append-only copying with
acknowledgements and accepted lag, which needs replication and a stale-writer fence, not a
vote per write. Proposed: define the stream as our own small contract (append, follow from an
offset, close, expire, one stream per attempt) so what holds it can change; the Durable Streams
protocol is prior art for that contract.

## Identity, offerings and how format behaviour is switched

Agreed 2026-10-08. The owner on the steps-and-rows picture: "got it got it"; "this seems good;
basically we define the individual lego blocks and arrange and plug them in".

- **Identities** are enums: the model (what it is), the provider (who serves it) and the format
  (which HTTP schema the endpoint speaks). A session stores provider and model only; the
  native slug is derived at the call.
- **An offering** is one model at one provider: its slug, exactly one format (ruled), neutral
  switches the engine itself needs (how reasoning can be replayed, where a system message may
  sit, what kind of caching exists, limits) and a block typed per format.
- **A translation** exists once per format and is built from steps. Each step has variants,
  each written once. An offering picks one variant per step. Columns are code, rows are data.
  A new model on a known format is a new row; a new behaviour is a new variant in one column.
- For Anthropic Messages the steps identified so far, with their variants: ask for reasoning
  (effort, budget, toggle, none); send reasoning back (signed, plain, none); place cache marks
  (markers, implicit, none); place an instruction (system role, user text); authenticate
  (`x-api-key`, `api-key`, bearer). Rows: Claude Sonnet 5.5 takes effort, signed, markers,
  system role, `x-api-key`; Claude Haiku 4.5 takes budget, signed, markers, user text,
  `x-api-key`; MiMo 2.6 at Xiaomi takes toggle, plain, implicit, an untested instruction
  placement and `api-key` (from its documentation, untested).
- **Not a class tree.** Extending a generic adapter per model was considered and set aside:
  the differences cut across each other, so shared code would sit in parents that children
  override and every new mixture would need a subclass. What is generic is the port in
  `protocol` and plain shared helper functions.
- **Plugins** (requirements ruled, design open): no privileged path, so built-in providers
  would register the way a third party's do; a ladder of integration sizes (an offering as
  data, a provider with its own authentication, a new format, a whole implementation of the
  port); what a plugin implements is the port, with plain-data requests and deltas. **Ruled:**
  a plugin may contribute a single block, one variant of one step of an existing format, such
  as an unusual way to authenticate, without writing a whole format ("yes this is absolutely
  what is intended"). Open: whether plugins run inside the process, as separate processes, or
  either; how identities authored as enums by
  separate plugins stay unique on the wire (proposed: the enum's string value prefixed by the
  plugin's name, and a reader without the plugin still loads the session).

## MiMo's Anthropic-compatible endpoint

From `mimo.mi.com/docs/en-US/api/chat/anthropic-api` (page dated 2026-09-20), read 2026-10-07.
Not yet called.

- Address `https://api.xiaomimimo.com/anthropic/v1/messages`; authentication by an `api-key`
  header or a bearer token, not `x-api-key`. kuib's configured MiMo host is the token-plan one
  (`token-plan-sgp.xiaomimimo.com/v1`, OpenAI-compatible); whether that key works on the
  Anthropic path is unchecked.
- Same request skeleton (`system`, `messages`, `tools`, `max_tokens`, `stream`) and the same
  six stream events; delta types are `text_delta`, `thinking_delta` and `input_json_delta`.
- Differences documented: no `signature_delta` and no signature on thinking blocks; thinking
  is only `enabled` or `disabled`; `tool_choice` other than `auto` is silently removed; stop
  reasons add `content_filter` and `repetition_truncation`; usage has `cache_read_input_tokens`
  but no cache-write count; `system` is listed as a message role. Not documented at all:
  `cache_control`, `ping` and `error` stream events, error bodies, beta headers.
- Reading: a good second provider on the same translation, and a cheap way to iterate on the
  common path. It cannot stand in for Anthropic on signed thinking, cache placement, the
  thinking-binding check, mid-conversation system semantics or error shapes.

## Prior art for model identity and provider plugins

Read 2026-10-08.

- **OpenRouter** separates a model from who serves it. Its catalogue entry for
  `anthropic/claude-sonnet-4.5` lists seven endpoints (Anthropic, Amazon Bedrock in two
  regions, Azure, Google Vertex, Claude Platform on AWS and one more), each with its own
  context length (200k on Azure, 1M elsewhere), price, supported parameters (ten or eleven),
  tool-choice support and caching flag. Its API, by contrast, puts every model behind one
  OpenAI-style format.
- **pi** (`badlogic/pi-mono`, coding-agent docs) offers a ladder and says to choose the
  smallest rung: a `models.json` entry for a model behind a supported API; a provider extension
  registered with `pi.registerProvider()` for custom authentication or model discovery; a
  provider with its own `stream` for an unsupported wire protocol. Extensions run in the
  process as trusted code. Its docs warn that compatibility settings "should describe verified
  differences" and not be enabled on an endpoint's claim alone.
- **opencode** (`packages/plugin`, commit `ecc4916`) exposes hooks that mutate an output
  object: `auth`, `provider`, `tool`, `chat.params`, `chat.headers`, `chat.message`,
  `permission.ask`, `tool.execute.before` and `.after`, `shell.env`, `event`, `config`. Also
  in-process.
- The "deepseek harness" the owner mentioned was not identified.
- **OpenRouter is not open source.** Its GitHub organisation has forty public repositories:
  SDKs for TypeScript, Python and Go, a provider for the AI SDK, examples and tools, mostly
  Apache-2.0. None is the router. Its catalogue is readable through a public API.
- **models.dev** is the open-source catalogue opencode uses: TOML files in a repository. Facts
  about an underlying model live once under `models/<lab>/<model>.toml`; a provider's entry
  names it with `base_model` and keeps only what differs (cost, limits, reasoning options, the
  name of the field reasoning arrives in), and "provider fields win over model metadata". A
  provider names an AI SDK package and a base address, which is where kuib's
  `ModelConfig.npm` came from.

## Lessons from the owner's work system

Read from the owner's own notes on the system they built at work, at their direction. Kept
generic here:

- Lifecycle events ride the same stream as content, so replay order is the same for live
  viewers and late joiners.
- The stream schema, not the transport, is the stable interface; it survived three transport
  changes.
- Recovery cannot live in the client; the replay buffer is shared and clients rejoin from
  their last id.
- Check-then-start is not enough; two starts milliseconds apart produced two runs.
- A provider's tool-call id is not unique per execution.
- A full state snapshot per step amplified writes by two orders of magnitude.
- Tool-call arguments were coalesced by size or time before being written.
- That system is a single machine, so its Redis is always on; kuib's stream must also work
  where devices sleep and where there is no extra server.

## Approvals, edits before a run, and several devices

Reasoned with the owner on 2026-10-09. Everything here is **proposed**; nothing is built, and
the engine is not to be touched yet.

The owner's words: "so basically if let's say the agent calls a tool like shell and puts in
some arguments"; "can i not modify the tool call args myself before the tool result is
returned by the harness?"; "why do they not allow to peek and modify it; instead if the agent
got something wrong; i have to stop the tool call and then manually ask it to correect the
command"; "this should be resistant to race conditions"; "we are allowing fan out; late
joiners to also participate in the session; if i have it open in two machines"; "which of the
amendments take precedence; what happens if i say no and yes to each call"; "we will also
have to handle these conditions right?".

- **Edit before run.** An approval has three answers: approve, reject, or run with changed
  arguments. The model's call stays as it wrote it. The owner's version runs, and the tool
  result tells the model what ran. Nothing stored is rewritten, so signed reasoning and the
  cached prefix stay valid. After a tool has run its arguments cannot be changed.
- **What exists elsewhere.** Claude Code and opencode can replace a call's arguments from
  code written in advance (a `PreToolUse` hook's `updatedInput`, the Agent SDK's permission
  callback, opencode's `tool.execute.before`). No harness known to us lets a person edit the
  arguments at the prompt; Claude Code's "amend" attaches a note for the model.
- **One answer per call.** An approval is an asked-and-answered pair with our own id. Devices
  submit answers; only the engine holding the lease commits. An answer is accepted only while
  the approval is open, so the first committed answer wins whole and a later one is refused
  and shown what won. Amendments are never merged, and device clocks play no part.
- **Nothing runs before the commit**, so an answer that lost cannot cause a run.
- **Cases.** Yes and no from two devices: the first committed is the answer; a "no" after a
  committed "yes" can only be an interrupt, which is its own committed operation. A stale
  screen or a late joiner: its answer is refused and the screen refreshes. The same answer
  sent twice carries one submission id and counts once. The engine dies: a committed answer
  is continued by the next engine and the daemon runs a call once per id; an uncommitted one
  leaves the approval open.
- **Open, the owner's:** whether a late "no" becomes an interrupt automatically (proposed:
  yes, so that stopping wins whenever it still can) or is only offered.
- **What it asks of the inference format:** a tool result that can say "not run",
  "interrupted" and "ran with different input than asked".
- **How it is proven.** Each case is a named test over the real engine, log and daemon with
  two hosts attached.

## Superseded by this file

From [[features/engine-foundation/research/continuation-2026-10-06]]: the three-area proposal
(wire format, stream, log); "deltas are never stored" with fan-out from the engine's memory;
the commit boundary being the whole step with nothing written earlier; a local engine as every
consumer's gateway; the store as the only live path; capability pinning; holding a mid-step
input back; the suggestion to build engine and session before the provider.

## Open, awaiting the owner

- Complete tool calls of an interrupted step: kept with an "interrupted" result, or stripped.
- After a restart: resume sessions automatically, or wait for the owner.
- When displayed text shrinks: shrink, show as tentative, or delay display.
- Writer signatures on chunks, or the hash alone.
- The checkpoint as a view by reference; whether operations or the resulting view are stored.
- The daemon rule "freeze, never continue unattended".
- Layer 5 in full: who copies which streams, discovery, transport.
- How long a daemon keeps a result nobody collects.
- From earlier and still unanswered: store-enforced ownership without a coordinator lease;
  whether the opaque payload may sit on any model part; whether reasoning is replayed across
  turns (core D011); which translation is built first; where the format's schemas live.
