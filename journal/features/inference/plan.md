---
owner: roysupriyo10
lifecycle: draft
summary: "kuib's own model layer end to end: the two formats in use broken into pieces, a neutral format in protocol, translations for Anthropic Messages and OpenAI chat built from blocks and proven against recorded traffic, and the existing model path repaired onto it."
topics: [inference, providers, models, plugins, protocol]
supersedes: []
superseded-by: []
roadmap: R020
context:
  - "[[domains/core/current#^package-barrels]]"
  - "[[domains/core/current#^provider-factories]]"
  - "[[domains/core/current#^provider-options]]"
  - "[[domains/core/current#^provider-errors]]"
  - "[[domains/core/current#^live-provider-tests]]"
  - "[[domains/core/current#^model-config]]"
  - "[[domains/core/current#^model-ref-usage]]"
  - "[[domains/core/current#^protocol-parts]]"
  - "[[domains/core/current#^protocol-events]]"
  - "[[domains/core/current#^protocol-ports]]"
  - "[[domains/core/current#^protocol-enums]]"
  - "[[domains/core/current#^finish-reasons]]"
  - "[[domains/core/current#^message-replay]]"
  - "[[domains/core/decisions#^D011]]"
  - "[[domains/core/decisions#^D022]]"
  - "[[domains/core/decisions#^D023]]"
  - "[[domains/infra/current#^house-structure-rules]]"
  - "[[domains/core/current#^agent-turn]]"
  - "[[domains/core/current#^turn-terminal-events]]"
  - "[[domains/core/current#^mid-run-submits]]"
  - "[[domains/core/current#^agent-tools]]"
  - "[[domains/core/current#^build-tools]]"
  - "[[domains/core/current#^transcript-fold]]"
  - "[[domains/core/current#^sqlite-schema]]"
  - "[[domains/infra/current#^start-telemetry]]"
  - "[[domains/infra/current#^config-schema]]"
checkpoint:
  summary: "The evidence is complete. 709 real exchanges are recorded as fixtures for Claude Sonnet 5.5, Haiku 5.5 and Haiku 4.5, MiMo 2.6 Pro on both of its endpoints and Meta, filed by message format, provider and model (D026 to D029); the recorder lives in packages/inference (D031); the variants of every piece are read from the fixtures (P07-I02). Next: name the case folders by piece and variant, then the format on paper, which goes to the owner before any code."
  next: ["P01-I09", "P01-I08", "P02-I01"]
  blockers: ["The owner's word on MiMo's format, the 76 cases that show nothing, the further captures and the words of G014", "Nothing is committed; the owner has not asked for a commit", "Whether 'don't touch the engine now' covers the turn-loop repair of P09 or only the redesign (D023)", "Open gaps for the owner, one at a time: G002, G003, G006, G007, G011 to G018, G020, G021, G024"]
  note: |-
    2026-10-25, orchestrator: P01-I09 (D032) waits on the owner's go on the literal tree put to the owner (src/capture/<subject>/<unit>, two levels). The owner asked: at the end of this round, report whether the journal and orchestra tools spared reasoning or cost it, with the concrete frictions met.

    Orchestrator handoff, written 2026-10-14 at 10:44 IST, read from the system clock. NOTHING IS RUNNING. The orchestra repairs of agent-harness P04 are done and accepted; the orchestrate skill describes their new commands (orchestra diff, the test-title guard on accept, handoff with a prompt). Window `4 bash` is the owner's, leave it. Every task of this round is accepted. Nothing is committed since 2026-10-06; commit only when the owner asks.

    LAST CHECK, by the orchestrator at 02:53: check:base green; typecheck, lint and tests green for 18 projects with the cache skipped (53 s at Nx parallelism 1, set once in nx.json); `pnpm run check` green and 53 of 53 from the cache; no file rewritten; 123 of 123 claims fresh; all 709 request bodies match the capture ledger's hashes and all 707 response bodies their recorded hash. The only skipped test in the workspace is the engine's gated live test.

    WHAT IS BUILT. The evidence of P01 and P07: 709 recorded exchanges under packages/inference/fixtures/<messageFormat>/<provider>/<model>/<case>/, each with fixture.json, request.json (messageFormat, provider, model, name, method, url, authHeader, headers, and replay when built from another fixture), request.body, response.json, response.body and transport.json. The enums MessageFormatEnum, ProviderEnum and ModelEnum are in packages/protocol; fixturePath in packages/inference builds a case's folder; a tree test fails the gate when a folder or envelope disagrees with them. The recorder lives in packages/inference as units, out of the barrel (a test guards that), with the command `inference`; the root script `capture` calls it. research/variants-per-piece-2026-10-14.md gives each of the 41 pieces on six rows with its fixture, and the task research-variants holds case-names.json. The test runner is in packages/testing (feature test-system).

    NEXT, on the owner's word: P01-I08, rename the case folders from case-names.json (the 76 cases that show nothing need his ruling first); then P02, the format on paper, which goes to the owner before any code.

    WAITING ON THE OWNER: (1) a commit. (2) MiMo's format under D005: the research recommends Anthropic Messages, with one capture owed first, two or more tool rounds with reasoning in one turn. (3) Whether to make the twelve further captures of the research's section 5. (4) The 76 cases. (5) The words of G014. (6) Names: two folders named `fixtures` inside units (validate.request holds a symlink a sandboxed test cannot create; scan.response a child script that must resolve the package's imports), check:base, the commands testing and inference, the three new enums at the root of protocol/src while the thirteen older ones sit under subject folders, the bin/ convention. (7) The investigation in journal/features/agent-harness/research/deviations-review-2026-10-14.md: its rule changes are adopted on the owner's word (agent-harness D007) and are in AGENTS.md ("One home for each concern", "Existing tests are proof"), the orchestrate skill (literal-lines review at the plan gate, rulings not extended, briefs cite decisions, acceptance reads the whole report and compares tests) and WORKER.md (Tests and Deviations sections); its tool changes are task repair-orchestra. (8) tooling/journal.ts and tooling/orchestra.ts are large and stand against his ruling that tooling holds only bare scripts.

    HOW TO WORK, learned this round (the investigation's main finding: the orchestrator itself specified or approved most of the shape the owner rejected). At the plan gate, hold every new path, script line, folder name and command name against AGENTS.md and its siblings, and show the owner those literal lines, not a summary; names without a sibling go to him there. A ruling about one thing is not a ruling about another. Before sending a rule to a worker, read the code it applies to; tie every stop condition to the one item it belongs to; say when a message changes an earlier one. At acceptance: read the whole report; for every unit a worker edited, compare its tests, titles and bodies, before and after; count tests across every *.test.ts; run `pnpm journal check` before `pnpm orchestra accept`, and after accepting cut the Refs it writes back to a few paths that will still exist. Read the time with `date`; never copy a worker's timestamps. When the watch ends without an outcome line, look at `pnpm orchestra status`.

    AGENTS (test-system D010): implementers on codex, `choom -n 800 -- codex --dangerously-bypass-approvals-and-sandbox -m gpt-6-sol -c model_reasoning_effort="high" -c service_tier="default"`; reasoning and high-caution reviews on Claude Code with Opus 5.5 at max, launched by --cmd with --mcp-config before --strict-mcp-config (the other order swallows the prompt). The owner asked for more agents at once and less parallelism per run: split work so tasks running together edit different files.

    THIS MACHINE (eos) has 8 GB and /tmp is RAM: scratch under /var/tmp; every multi-process run through `/var/tmp/kuib-guard.sh 30 1500 -- <command>`; workers under `choom -n 800`; `deno` with `--no-lock`, never a jsr: or npm: import from the repository root; never wrap a check in `bash -c`. Never close a tmux window you did not spawn.

    MIMO KEY: replaced on 2026-10-13 everywhere it was stale, on the owner's instruction (G023); it is a token-plan key, answered on the Singapore host, refused on the pay-as-you-go host.

    HOW THE OWNER WORKS: no question tool; decisions in prose one at a time; rulings recorded verbatim the moment given; a passing remark is not a ruling; a fact or what follows from his rulings is not a question; reason first, record when asked; commit only when asked.
---

# Plan — inference

## Objective

Give kuib its own model layer, end to end, and repair what exists onto it:

- the two HTTP schemas kuib talks today, Anthropic Messages and OpenAI chat, are broken into
  pieces: each thing a request says and each thing a response carries, listed once with what
  each format has for it;
- a neutral format in `protocol` is derived from those pieces: what is asked of a model and
  what comes back, in a form that can be cut at any point, stored, and sent back without loss;
- each piece has one implementation per format, with variants where served models differ; an
  offering is a row that picks variants;
- a provider and a model are typed identities, and a session never holds a native slug;
- both translations are proven against recorded traffic;
- the existing model path is repaired onto the new layer: `protocol`'s model-facing shapes
  now, and the engine's provider folder, its turn loop, the readers of their events and the
  removal of the AI SDK when the owner releases the engine (D023);
- providers, models, offerings, formats and single blocks are all added through one
  registration path, which the built-in ones use too.

The design this rests on is
[[features/engine-foundation/research/engine-design-2026-10-07]]; what other model layers got
wrong is in [[features/inference/research/prior-art-synthesis-2026-10-08]].

## Non-goals

- The engine as designed: the stream store, persistence at boundaries, the lease and takeover,
  the checkpointer and daemon leases. The turn loop is repaired only as far as the new port
  requires.
- Context assembly per application (D016). The loop sends the whole session, as today.
- A third translation (OpenAI Responses, Gemini), although the format is checked against both
  on paper.
- Images and files, tools a provider runs itself, structured output, batches.
- Loading plugins from outside the workspace, or running them as separate processes.
- Prices, a full model catalogue, and automatic choice between providers.
- Migrating stored sessions. Local logs written before the event shapes change are discarded.

## Principles

- Neutral intent goes in; what actually happened comes out. A request does not fail because a
  provider lacks a feature; the translation renders the intent the best available way and
  reports what it did.
- A piece is listed before it is built. The table of pieces is the source for the neutral
  format and for the blocks.
- Columns are code and rows are data. A behaviour is written once as a block; an offering is a
  row that picks blocks, and every value in a row cites the fixture that shows it.
- One vocabulary. A shape that is replaced is removed in the item that moves its last reader.
  While the engine is untouched (D023), the shapes it reads stay.
- Nothing is privileged. The built-in support enters the same way a third party's would.
- Everything a translation needs to build the closed step travels in the stream, so a step
  can be cut at any frame and still be valid.
- The exact request is inspectable before it is sent, and building it is a pure function.
- Low overhead: provider bytes become deltas in one step, nothing is validated between layers
  inside the process, and a translation is loaded only when first used.
- Tests use the real modules. Nothing the codebase implements gets a second implementation
  for tests. The only stand-ins are for what kuib does not implement and cannot run offline: a
  provider's traffic, replayed as recorded bytes where `fetch` is called, and time and
  randomness, passed in as values.
- The workspace is green after every item.
- Names mirror their siblings; every item ends by listing the names it introduced.

## What exists today, and what is wrong with it

Read in the code on 2026-10-08. The source is small: `protocol` 1,481 lines, `engine` 920,
`config` 412, `engine-service` 362, the terminal host 278, `event-log-sqlite` 237,
`transcript` 132, `telemetry` 52.

- The AI SDK is imported in six files: the engine's model factory, provider options, tool
  conversion, `build.messages` and the orchestrator, and telemetry's start-up.
  `@ai-sdk/openai` is declared and never imported.
- The SDK owns the tool loop. `streamText` runs tools itself, so a call is logged after the
  SDK has started it, and the provider's tool-call id and the SDK's part id are used as kuib's
  own keys.
- A provider error is written into the answer as a text delta and is sent back to the model
  as its own words on the next turn.
- An aborted run is recorded as completed. A finish reason that is not known is recorded as
  interrupted. A usage count the provider did not report is recorded as 0.
- A tool input that does not parse is sent back as `{}`. A call without a result is dropped
  from the request, and a result whose call is not known is rewritten as a user message.
- `buildMessages` replays the whole session log twice on every run: 36 ms at 10,000 events
  and 212 ms at 50,000, measured 2026-10-07.
- Every delta awaits its own durable append: 68 µs on SQLite, measured 2026-10-07, and one
  round trip on a networked store.
- No base instructions are sent, and the tools are fixed in code.
- Reasoning is logged as text with no payload and is never sent back.
- `ModelRef` is two free strings. `ModelConfig` names an npm package and has an open
  `options` catch-all and an open `providerOptions` record. The engine picks a provider by a
  chain of string comparisons, and the model is chosen by one string split at its first slash.
- `protocol` holds shapes nothing outside it reads: `MessageUpdated`, `ToolCallOutputDelta`,
  `PartStepBoundary`, the message views, and the checkpoint, thread and discussion ids.
- Telemetry's spans come from the AI SDK's own instrumentation.

Testing, as found on 2026-10-08:

- `pnpm run check` does not run tests. It was green while `pnpm test` was red: in
  `packages/env` the two `findWorkspaceRoot` steps fail whenever the package's tests run
  together, because `tmpdir()` is undefined by then, and pass when their file runs alone.
- Every test runs with `deno test -A`, so nothing keeps a unit test off the network. The one
  live test is reached by a root script that names its file in the engine.
- `protocol` (93 units), `cli` and `tooling` have no test script and no tests.
- There is no fixture or snapshot convention, no shared test helper, no coverage report, no
  benchmark target, no CI and no git hook.
- Two stand-ins exist. The engine's in-memory event log is a second implementation of the log
  used by five test files and by no production code, while the SQLite log opens in memory in
  its own tests. One engine test drives the loop with the AI SDK's mock model.
- What is sound: tests sit beside their unit, are type-checked by `tsgo`, use one runner and
  one assertion library, and are cached per project by Nx. The whole suite runs cold in 8.5
  seconds.

## The pieces

A piece is one thing a request says or a response carries. Each piece gets one implementation
per format, and variants where served models differ. The table is in [[features/inference/research/format-pieces-2026-10-08]]: every cell cites
the reference page or source line it rests on, with the rules each piece carries, the special
cases three existing translations needed, and what each piece needs said neutrally. It
replaced a first cut drawn partly from memory, of which sixteen cells were wrong.

What a request says (23): address and slug; authentication; version and feature switches;
base instructions; instruction inside the conversation; what the user said; what the model
said; reasoning sent back; tool declarations; tool choice; parallel tool calls; tool call sent
back; tool result; turn order; asking for reasoning; effort; whether reasoning text is
returned; cache marks; output limit; sampling; stop sequences; stream switch; cut output sent
back.

What a response carries (18): framing; step opens; part boundaries; text; reasoning; tool
call; opaque payload; why it stopped; which stop sequence matched; refusal detail; usage;
keep-alive and unknown frames; failure before the stream; failure inside the stream; step
ends; who answered; rate-limit state; what the server changed.

Four facts from the references that the first cut had wrong, each checked by the orchestrator
in the saved pages:

- Asking for reasoning is a mode and a separate effort on Anthropic. Sonnet 5.5 rejects
  `disabled` and a budget; its lowest setting is `between_tools`, at effort `high` or below.
  Haiku 5.5 takes `disabled`. Haiku 4.5 takes a budget or `disabled` and rejects `adaptive`.
- OpenAI chat has explicit cache marks (`prompt_cache_breakpoint`), four a request. Caching
  there is not only implicit.
- Sonnet 5.5 answers 400 to a forced tool choice and to any sampling setting. MiMo removes a
  forced tool choice and overrides sampling without an error.
- MiMo's Anthropic page lists a `signature` on thinking blocks and no `signature_delta`.

Two of these four were then set against recorded traffic and do not hold as written
([[features/inference/research/variants-per-piece-2026-10-14]], section 2). Sonnet 5.5 does not
reject every sampling setting: it accepts `temperature: 1` and `top_p: 0.99`
(`S/temperature-default`, `S/top-p-boundary`). And whatever MiMo's page lists, its Anthropic
endpoint sends a `signature_delta` in every closed reasoning part of a stream, 54 of 54,
holding an empty string (`MA/reasoning-stream`).

## What is repaired

Decided under D019. Each line is removed or rewritten in place; nothing is kept beside its
replacement once its last reader has moved. Every line whose item is in P09 waits for the
owner's word (D023).

| Today | After | Item |
|---|---|---|
| `ModelRef`, two free strings | provider and model identities | P02-I01, P09-I07 |
| `ModelConfig` with an npm package and open records | an offering as shared data, an endpoint and its key on the machine | P02-I01, P09-I04 |
| `StepStarted`, `StepFinished`, `PartStepBoundary`, the stop-reason enum | a step asked and a step answered, with endings and the provider's reason | P02-I02, P09-I07 |
| `TokenUsage`, counts required | counts that can say "not reported", the provider's usage kept | P02-I02 |
| Parts without a completeness mark or a payload; tool input held two ways | parts that record complete or cut and carry a payload; tool input held once, as received | P02-I02 |
| `MessageFailed` with one string | a failure shape: kind, status, whether a retry can help | P02-I04 |
| Shapes nothing reads | removed | P02-I05 |
| The engine's provider folder: model factory, provider options, the string chain | deleted; `inference` resolves an offering | P09-I03 |
| `streamText` owning the tool loop | the engine asks a step, commits its tool calls, runs them, asks the next; ids are kuib's own | P09-I01 |
| An abort recorded as completed, an error written as answer text | an interrupted step; a failed step with its failure | P09-I01 |
| `buildMessages`, two passes and repairs on every request | one pass from the log to a step that is asked; nothing is repaired on the way out | P09-I02 |
| The model chosen by one slash-separated string | a provider identity and a model identity, checked against the registry | P09-I04 |
| The transcript fold, the terminal host, the SQLite log, the engine service reading the old events | reading the new ones | P09-I05 |
| Spans from the AI SDK's instrumentation | spans built from the facts of a step | P09-I06 |
| `ai` and five `@ai-sdk` packages | gone from every manifest and the catalog | P09-I03, P09-I06 |

Left for the engine feature (R019), named so they are not lost: a durable append per delta;
the synchronous `EventLogPort`; an event envelope that rejects a version it does not know;
context assembly per application; the tool list fixed in code.

## Order of work

Proposed, for the owner to confirm round by round.

1. The table of pieces (P07-I01), and the captures (P01), which need the owner's go.
2. Variants per piece from the captures (P07-I02), then the format on paper (P02), which goes
   to the owner before any code.
3. The format in `protocol` (P02) and transport (P03-I02).
4. The Anthropic Messages translation (P04) together with the path (P03-I03), which is tested
   through it, then the OpenAI chat translation (P08).
5. The registry, drawn from two working translations (P03-I01, see G016).
6. The repair (P09): the engine moves onto the port and the old path is deleted. Not
   scheduled until the owner releases the engine (D023).
7. Proof (P05) and one review of the whole feature.

## P01 — Evidence: recorded traffic

### P01-I01 — A capture tool and a fixture format

- Acceptance: A script sends one prepared request and writes a fixture holding the request
  body and headers with credentials removed, the response status and headers, and the raw
  response bytes exactly as received. Re-running it against a fixture's request reproduces the
  same file layout. No key is ever written to disk outside `.env`.
- State: implemented
- Addresses: G001
- Refs:
  - `packages/inference/src/record.exchange/index.ts` — the recorder, one exchange
  - `packages/inference/bin/inference` — the command
  - `packages/engine/src/provider/live.test.ts` — how keys are read today
  - `packages/inference/package.json` — changed
  - `packages/inference/src/index.ts` — changed

### P01-I02 — Captures from Claude

- Acceptance: Fixtures exist from Claude Sonnet 5.5 at Anthropic for: a plain answer; a tool
  round with signed thinking (two requests, the second sending the first response back); the
  same request twice with cache marks (a write, then a read); a system message in the middle
  of a conversation; cut-off assistant text followed by a user message; a rejected request;
  an effort change carried inside the conversation. Fixtures also exist from a Claude Haiku
  model for a plain answer, an answer with thinking and a tool round, so the blocks an older
  model selects are exercised. If Sonnet 5.5 rejects the system message in the middle of a
  conversation, the rejection is kept as a fixture and the case is recorded on a Claude model
  that accepts it. Each fixture names what it demonstrates.
- State: implemented
- Decisions: D016, D017
- Addresses: G001, G009
- Refs:
  - `packages/inference/fixtures` — the recorded exchanges
  - `packages/inference/package.json` — changed
  - `packages/inference/src/index.ts` — changed

### P01-I03 — Captures from MiMo's Anthropic endpoint

- Acceptance: Fixtures exist from MiMo 2.6 Pro for: a plain answer; an answer with thinking; a
  tool round with the thinking block sent back; a system message in the middle of a
  conversation; a tool choice other than automatic. A note records which host and key worked
  and every difference from the Claude fixtures.
- State: implemented
- Decisions: D017
- Addresses: G001, G008
- Refs:
  - `packages/inference/fixtures` — the recorded exchanges
  - `packages/inference/package.json` — changed
  - `packages/inference/src/index.ts` — changed

### P01-I04 — Captures from MiMo's OpenAI-compatible endpoint

- Acceptance: Fixtures exist from MiMo 2.6 Pro on the endpoint kuib uses today for: a plain
  answer; an answer with reasoning; a tool round with the reasoning sent back; a tool choice
  other than automatic; an answer that ends on the output limit; usage in the last chunk. A
  note says which of MiMo's two endpoints covers more, as D005 asks.
- State: implemented
- Decisions: D005, D017, D018, D019
- Addresses: G008
- Refs:
  - `packages/inference/fixtures` — the recorded exchanges
  - `packages/inference/package.json` — changed
  - `packages/inference/src/index.ts` — changed

### P01-I05 — Captures across configurations

- Acceptance: For every provider kuib holds a key for (Anthropic, MiMo on both endpoints,
  Meta), fixtures exist for the matrix approved in the task's plan: each setting the table of
  pieces lists as varying is recorded at each of its values on each model recorded, together
  with the combinations the pieces file says interact and the requests G019 lists. A rejection
  is kept as a fixture. A note per provider states the matrix, the number of requests made and
  what they cost.
- State: implemented
- Decisions: D017, D026
- Addresses: G014, G015, G019, G020
- Refs:
  - `packages/inference/fixtures` — the recorded exchanges
  - `packages/inference/package.json` — changed
  - `packages/inference/src/index.ts` — changed

### P01-I06 — Fixtures are filed by format, provider and model

- Acceptance: Every recorded exchange sits at
  `packages/inference/fixtures/<format>/<provider>/<model>/<case>/`, each level named by the
  string value of its enum member. The three enums, format, provider and model, are defined
  once in `protocol` and the capture tool imports them. A test fails the gate when a folder or
  an envelope disagrees with the enums, and the tool can refile the tree and rename a value in
  one command each. The files of a case are named symmetrically for
  request and response and carry no step prefix. The envelope states message format, provider
  and model as three fields. One unit in `packages/inference` builds the folder of a case from
  those identities, and the tool and the tests use it. The ledger of the capture run is
  history and keeps the names of its time; the tool holds no table of old names. The capture tool writes, reads and audits this layout, and its tests
  cover it. Every request body and response body is byte for byte what it was before the
  move, shown by hash; the audit is clean; every fixture loads through `loadFixture`; the
  claims on the fixtures and the tool are rewritten and stamped. Case names are left as they
  are, apart from the one misspelt separator; they are renamed by piece and variant in
  P07-I02.
- State: implemented
- Decisions: D015, D029
- Refs:
  - `packages/inference/fixtures` — the recorded exchanges, filed by message format, provider and model
  - `packages/inference/src/fixture.path/index.ts` — changed
  - `packages/protocol/src/message.format.enum/index.ts` — changed
  - `packages/protocol/src/model.enum/index.ts` — changed
  - `packages/protocol/src/provider.enum/index.ts` — changed

### P01-I07 — The recorder lives in the inference package

- Acceptance: Everything about recording an exchange lives in `packages/inference`, beside the
  fixtures it makes: preparing and recording, sequences, the ledger and its reviews, the
  audit, refiling and renaming, as units of that package, each with one test file beside it.
  Nothing the product loads imports them. There is no `packages/capture` and `tooling/` holds
  no capture code. The command is reached the way the test runner is, and its permissions are
  written once. Every proof the old tool's suite gave is given by a test that runs in the
  gate. The claims say where the recorder is.
- State: implemented
- Decisions: D030
- Refs:
  - `packages/inference/bin/inference` — changed
  - `packages/inference/package.json` — changed
  - `packages/inference/src/audit.fixture/index.ts` — changed
  - `packages/inference/src/index.test.ts` — changed
  - `packages/inference/src/record.exchange/index.ts` — changed
  - `packages/inference/src/resolve.capture.permissions/index.ts` — changed
  - `packages/inference/src/run.capture.command/index.ts` — changed
  - `packages/testing/src/create.loopback.server/index.ts` — changed
  - `packages/testing/src/resolve.test.permissions/index.ts` — changed

### P01-I08 — Case folders are named by piece and variant

- Acceptance: Every recorded case folder takes the name `case-names.json` of the task
  research-variants gives it, piece and variant, one word each, the same name for the same
  request on every row. The cases that show nothing a piece needs are handled as the owner
  rules. Every request body still matches the capture ledger's hash and every response body its
  recorded hash; the replay links and the research file's citations follow the new names; the
  tree test and the gate pass.
- State: planned
- Decisions: D015, D029

### P01-I09 — The recorder's units are nested by subject

- Acceptance: No recorder unit sits at the top of `packages/inference/src`; they live under
  `src/capture/` in the tree the owner approves, each unit moved with its test, its name, its
  claim line and its behaviour unchanged. Every test title that existed before exists after,
  the test count is the same, and no assertion changes. The command, its permissions and its
  child start as before; every fixture body still matches its hash. The claims tied to the
  moved files are re-verified and stamped, and the gate passes.
- State: planned
- Decisions: D031, D032

## P02 — The format in `protocol`

### P02-I01 — Identities and the offering

- Acceptance: `protocol` holds enums for model, provider and format, and the shape of an
  offering: model, provider, native slug, one format, the neutral switches (how reasoning can
  be replayed, where an instruction may sit, what kind of caching exists, limits) and a block
  typed per format. Each switch is an enum, never a boolean. An endpoint (address, region,
  plan) is its own shape and holds no secret. `ModelRef` and `ModelConfig` stay until P09
  moves their last reader.
- State: planned
- Decisions: D004, D005, D015, D019, D020
- Addresses: G004, G007, G013
- Refs:
  - `packages/protocol/src/model.ref/index.ts` — the identity it will later replace
  - `packages/protocol/src/provider/model.config/index.ts` — the config it will later replace

### P02-I02 — What is asked and what comes back

- Acceptance: `protocol` holds the shapes for a step that is asked (base instructions, tool
  declarations, the ordered parts, hints for caching and instruction lifetime, the reasoning
  level for this step), for the deltas a translation emits, and for the closed step (its parts
  with a complete-or-cut mark, one of five endings, usage including cache read and write, and
  the opaque provider payload, the provider's own stop reason, and the report of what the
  translation did). The closed step can be built from the deltas alone. Every shape is derived
  from the table of pieces (P07) and written on paper against Anthropic Messages and OpenAI
  chat, and checked against OpenAI Responses and Gemini, before code. The paper goes to the
  owner.
- State: planned
- Decisions: D003, D009, D011, D013, D016, D020
- Addresses: G006, G011, G012, G014, G018
- Refs:
  - `packages/protocol/src/part/part.reasoning/index.ts` — the part that gains a payload
  - `packages/protocol/src/event/step.finished/index.ts` — today's step end

### P02-I03 — The model port

- Acceptance: `protocol` holds the interface a model implements: given a step that is asked
  and a cancel signal, it yields deltas and ends with exactly one closed step. Requests and
  deltas are plain data with no functions in them.
- State: planned
- Decisions: D008
- Addresses: G002
- Refs:
  - `packages/protocol/src/event.log.port/index.ts` — the sibling port it mirrors

### P02-I04 — Failures

- Acceptance: `protocol` holds one failure shape: its kind, the HTTP status when there is one,
  whether a retry can help and after how long, and the provider's body as received. It is
  filled the same way for a failure before the stream and one inside it.
- State: planned
- Addresses: G017

### P02-I05 — Shapes nothing reads are removed

- Acceptance: `MessageUpdated`, `ToolCallOutputDelta`, `PartStepBoundary`, the message views
  and the unused ids leave `protocol`, each only after a search shows no reader. The claims
  that describe them are rewritten and stamped.
- State: planned
- Decisions: D019

## P03 — The inference core

### P03-I01 — The registry

- Acceptance: A new package `inference` lets a caller register providers, models, offerings,
  formats and single blocks, and resolves a provider and a model to an offering, its format
  and its blocks. It contains no knowledge of any provider. An unknown identity yields a typed
  error, not a throw from deep inside. It is built after two translations work, from what
  their blocks turned out to need.
- State: planned
- Decisions: D006, D007, D008
- Addresses: G003, G016

### P03-I02 — Transport

- Acceptance: The package sends a prepared request with `fetch`, honours cancellation, splits
  the response into frames without buffering the whole body, and classifies failures by kind,
  HTTP status, whether a retry can help and after how long. It depends only on `fetch` and web
  streams.
- State: planned
- Decisions: D010

### P03-I03 — The path from an offering to a closed step

- Acceptance: Given a registered offering and a step that is asked, the package builds the
  exact request without sending it, and separately runs it to deltas and a closed step. A
  translation is loaded on first use. It is tested through a real translation fed recorded
  fixtures where `fetch` is called; no stand-in translation exists.
- State: planned
- Decisions: D003, D010, D012, D025

## P04 — The Anthropic Messages translation

### P04-I01 — Request blocks

- Acceptance: Every request piece of the table (P07) has a block. The translation builds a
  request from blocks for: asking for reasoning (effort,
  budget, toggle, none, an effort change carried inside the conversation); sending reasoning
  back (signed, plain, none); placing cache marks (markers, implicit, none); placing an
  instruction (system role, user text) with its lifetime; authenticating (`x-api-key`,
  `api-key`, bearer). Each block is one small unit with its own test. For every Claude and
  MiMo fixture, the request it builds equals the recorded request byte for byte.
- State: planned
- Decisions: D001, D006, D014, D016

### P04-I02 — Frames into deltas and the closed step

- Acceptance: The translation turns recorded frames into deltas and a closed step for every
  fixture, including thinking with an empty text and a signature, tool input streamed in
  pieces, and a provider error mid-stream. It ignores frame kinds it does not know. Cutting a
  fixture after any frame still yields a valid closed step marked as cut.
- State: planned
- Decisions: D009, D013, D014

### P04-I03 — Two rows

- Acceptance: Offerings for Claude Sonnet 5.5 at Anthropic and MiMo 2.6 Pro at Xiaomi are
  registered as data alone and both pass the fixture tests. The MiMo row's values come from
  its captures, not from its documentation.
- State: planned
- Decisions: D004, D005
- Addresses: G008

## P05 — Proof

### P05-I01 — The round trip

- Acceptance: For each tool-round fixture, the closed step built from the first response,
  placed in the next step that is asked, produces the recorded second request byte for byte.
- State: planned
- Decisions: D003

### P05-I02 — An opt-in live test

- Acceptance: A test that runs only when asked sends one real request per registered offering
  and checks that it ends with a closed step. The default test run stays offline.
- State: planned
- Refs:
  - `packages/engine/src/provider/live.test.ts` — the test it mirrors

### P05-I03 — Overhead

- Acceptance: A measurement records the cost per delta through the translation, and the
  import time and memory of the `inference` package next to the AI SDK path, on the same
  machine. The numbers are written into this feature's research.
- State: planned
- Decisions: D010

### P05-I04 — Truth and names

- Acceptance: The new package belongs to the core domain's `code` globs, every module carries
  its `@claim` line, claims describing the built behaviour are stamped, and the names
  introduced are listed with the sibling each mirrors. `pnpm run check` passes.
- State: planned

### P05-I05 — The repaired engine, end to end

- Acceptance: A test drives a turn with a tool round through the engine from recorded
  fixtures, offline, for one offering of each format, and the events it leaves fold into the
  expected transcript. The opt-in live test does the same against Claude and MiMo. Waits with
  P09.
- State: planned
- Decisions: D019, D023

## P06 — Evidence: prior art

Asked by the owner on 2026-10-08: "i also want you to /orchestrate a research about how
everyone else is doing this"; "openrouter/opencode and all"; "the point is to be adversarial;
identify their worsst shappes so we can avoid them".

### P06-I01 — opencode and pi

- Acceptance: A research file names the worst shapes of the model layers of opencode and pi on
  the axes of the brief, each with a source at a commit or a URL read on a stated date, the
  harm it caused, and whether this plan shares it.
- State: implemented
- Refs:
  - `journal/features/engine-foundation/research/opencode-llm-2026-10-07.md` — the earlier, neutral reading
  - `journal/features/inference/research/prior-art-opencode-pi-2026-10-08.md` — changed
  - `journal/features/inference/tasks/research-opencode-pi/brief.md` — changed
  - `journal/features/inference/tasks/research-opencode-pi/log.md` — changed
  - `journal/features/inference/tasks/research-opencode-pi/plan.md` — changed
  - `journal/features/inference/tasks/research-opencode-pi/report.md` — changed

### P06-I02 — Other agent harnesses

- Acceptance: The same for Codex, Crush, Goose, Cline or Roo Code, and Zed.
- State: implemented
- Refs:
  - `journal/features/inference/research/prior-art-harnesses-2026-10-08.md` — changed
  - `journal/features/inference/tasks/research-harnesses/brief.md` — changed
  - `journal/features/inference/tasks/research-harnesses/log.md` — changed
  - `journal/features/inference/tasks/research-harnesses/plan.md` — changed
  - `journal/features/inference/tasks/research-harnesses/report.md` — changed

### P06-I03 — Libraries that define a neutral format

- Acceptance: The same for the AI SDK, LiteLLM, LangChain, Bedrock Converse and the
  OpenAI-compatible endpoints that Anthropic and Google serve.
- State: implemented
- Refs:
  - `journal/features/inference/research/prior-art-sdks-2026-10-08.md` — changed
  - `journal/features/inference/tasks/research-sdks/brief.md` — changed
  - `journal/features/inference/tasks/research-sdks/log.md` — changed
  - `journal/features/inference/tasks/research-sdks/plan.md` — changed
  - `journal/features/inference/tasks/research-sdks/report.md` — changed

### P06-I04 — Routers, gateways and catalogues

- Acceptance: The same for OpenRouter, the Portkey gateway, models.dev, and the Vercel and
  Helicone gateways.
- State: implemented
- Refs:
  - `journal/features/inference/research/prior-art-routers-2026-10-08.md` — changed
  - `journal/features/inference/tasks/research-routers/brief.md` — changed
  - `journal/features/inference/tasks/research-routers/log.md` — changed
  - `journal/features/inference/tasks/research-routers/plan.md` — changed
  - `journal/features/inference/tasks/research-routers/report.md` — changed

### P06-I05 — The worst shapes, set against this plan

- Acceptance: One research file ranks the worst shapes found by P06-I01 to I04, each checked
  against its source by the orchestrator, and names for each the decision, gap or item of this
  plan it bears on and the change proposed to the owner.
- State: implemented
- Refs:
  - `journal/features/inference/research/prior-art-synthesis-2026-10-08.md` — synthesis

### P06-I06 — How plugins are cut across the workspace

- Acceptance: One research file, asked by the owner on 2026-10-25, recommends how kuib's
  plugins are cut: who owns an extension contract (each package, one general plugin, or
  another arrangement), how contracts, plugins and registries are named against the
  workspace's siblings, whether kuib's own functionality registers through the same public
  path, how a plugin is loaded and isolated in one compiled Deno executable, how identities
  stay unique, and what this feature builds now and what waits. Every statement about prior
  art cites its source; every statement about Deno is measured on the workspace's Deno or
  cited.
- State: implemented
- Decisions: D002, D007, D008, D010, D011
- Addresses: G002, G003, G007
- Refs:
  - `journal/features/inference/tasks/research-plugins/report.md` — report
  - `journal/features/inference/research/plugin-architecture-2026-10-25.md` — research

## P07 — The pieces of the two formats

### P07-I01 — The table of pieces

- Acceptance: A research file lists every piece of Anthropic Messages and of OpenAI chat: each
  thing a request says and each thing a response carries, with what each format has for it. It
  is taken from the two API references and checked against three existing translations (the
  AI SDK, pi and opencode, at the commits of the prior-art files). Every cell cites its
  source. Pieces this feature leaves out are listed with the reason.
- State: implemented
- Decisions: D020
- Refs:
  - `journal/features/inference/research/format-pieces-2026-10-08.md` — changed
  - `journal/features/inference/tasks/research-pieces/brief.md` — changed
  - `journal/features/inference/tasks/research-pieces/log.md` — changed
  - `journal/features/inference/tasks/research-pieces/plan.md` — changed
  - `journal/features/inference/tasks/research-pieces/report.md` — changed

### P07-I02 — Variants per piece

- Acceptance: For each piece, the variants served models need, each marked measured (with its
  fixture), documented (with its reference) or assumed. Rows are filled for Claude Sonnet 5.5,
  Claude Haiku 5.5, Claude Haiku 4.5, MiMo 2.6 Pro on both of its endpoints and Meta Muse
  Spark 1.1. Every recorded case is assigned the piece and the variant it shows, in words fit
  to be enum values, as the name its case folder will take (D029).
- State: implemented
- Decisions: D006, D014, D018, D020
- Addresses: G008, G014
- Refs:
  - `journal/features/inference/research/variants-per-piece-2026-10-14.md` — changed
  - `journal/features/inference/tasks/research-variants/brief.md` — changed
  - `journal/features/inference/tasks/research-variants/case-names.json` — changed
  - `journal/features/inference/tasks/research-variants/log.md` — changed
  - `journal/features/inference/tasks/research-variants/report.md` — changed

## P08 — The OpenAI chat translation

### P08-I01 — Request blocks

- Acceptance: Every request piece of the table has a block for OpenAI chat, each one small
  unit with its own test. For every fixture of this format, the request it builds equals the
  recorded request byte for byte.
- State: planned
- Decisions: D006, D019, D020, D021

### P08-I02 — Frames into deltas and the closed step

- Acceptance: The translation turns recorded frames into deltas and a closed step for every
  fixture of this format: parts that the stream never closes, tool-call fragments joined by
  index, reasoning in a field outside the schema, usage in the last chunk, and a stream that
  ends without its terminal line, which is a cut step. Cutting a fixture after any frame still
  yields a valid closed step marked as cut.
- State: planned
- Decisions: D009, D013, D019

### P08-I03 — Rows

- Acceptance: An offering for MiMo 2.6 Pro at Xiaomi is registered as data on whichever of its
  endpoints covers more, and passes the fixture tests. Rows for the other providers kuib
  serves through this format today are registered with every value marked measured,
  documented or assumed.
- State: planned
- Decisions: D004, D005, D018, D019
- Addresses: G020

## P09 — Repair: the existing model path moves onto the port

Not scheduled. The owner on 2026-10-08: "don't touch the engine now" (D023). Nothing under
`packages/engine` changes, and no item of this phase starts, until the owner says so.

### P09-I01 — The turn loop

- Acceptance: The orchestrator calls the model port. The engine asks a step, commits its tool
  calls before any of them runs, runs them through the daemon, and asks the next step. Every
  id is kuib's own; a provider's id is data. An abort leaves an interrupted step, a failure
  leaves a failed step with its failure, and neither is written as answer text. Input
  submitted during a run and the step limit behave as they do today. The claims on the turn
  are rewritten and stamped.
- State: planned
- Decisions: D013, D019
- Refs:
  - `packages/engine/src/orchestrator/index.ts` — the loop that is rewritten

### P09-I02 — From the log to a step that is asked

- Acceptance: One pass over the session log builds the step that is asked. Nothing is repaired
  on the way out: a cut part and a call without a result are stored as what they are, and the
  translation decides what a provider accepts. Base instructions come from configuration and
  are empty by default. `build.messages` is gone.
- State: planned
- Decisions: D009, D019
- Refs:
  - `packages/engine/src/build.messages/index.ts` — the fold it replaces

### P09-I03 — The provider folder and the AI SDK are removed

- Acceptance: `packages/engine/src/provider` is deleted. Tools are declared to the port from
  the specs in `@kuib-ai/tools`. `ai` and every `@ai-sdk` package leave the engine, the engine
  service and the catalog.
- State: planned
- Decisions: D019

### P09-I04 — Choosing a model

- Acceptance: Configuration names a provider identity and a model identity, checked against
  the registry at start. An endpoint and its key are read per machine and never enter the
  session. The single slash-separated string is gone.
- State: planned
- Decisions: D004, D019
- Addresses: G013

### P09-I05 — Readers of the events follow

- Acceptance: The transcript fold, the terminal host, the SQLite log and the engine service
  read the new events. The envelope's version rises, and a log written before it is discarded
  with a message, not migrated.
- State: planned
- Decisions: D019, D022

### P09-I06 — Spans from the facts of a step

- Acceptance: Telemetry builds one span per step and per tool call from the events of a turn,
  with usage on the step's span. `@ai-sdk/otel` and `ai` leave the package.
- State: planned
- Decisions: D019

### P09-I07 — The shapes that were replaced are removed

- Acceptance: `ModelRef`, `ModelConfig`, `StepStarted`, `StepFinished`, the stop-reason enum
  and the old `TokenUsage` leave `protocol` once no reader remains. The claims that describe
  them are rewritten and stamped.
- State: planned
- Decisions: D019

## Decisions

### D001 — Anthropic Messages is the first translation

- Status: accepted
- Ruling: "yeah let us nail down the anthropic messages first" (owner, 2026-10-07)
- Context: It has the hardest constraints: signed thinking, cache placement, the thinking
  binding and system messages in the middle of a conversation.
- Decision: Build Anthropic Messages completely before any other format.

### D002 — The format lives in `protocol`, which stays one package

- Status: accepted
- Ruling: "if protocol itself imports schema"; "there is no reason to differentiate them"
  (owner, 2026-10-07)
- Context: The owner asked whether `protocol` should be renamed `schema`.
- Decision: One package named `protocol` holds the format's shapes and the model port;
  `inference` holds behaviour. Placing the format there is the reading given to the owner with
  the ruling and not contradicted.

### D003 — Neutral intent is translated to provider truth

- Status: accepted
- Ruling: "i think we should define the neutral intent path in such a way where if later
  providers come in with the support they can now uphold it; however the actual truth of what
  will happen should remain at the provider level; that way requests won't fail"; "basically a
  translation of teh neutral intent path --> truth" (owner, 2026-10-07)
- Decision: The request names intents, never provider features. A translation renders each
  intent the best way its offering supports and reports what it did.

### D004 — Provider and model are first-class enums; slugs are derived

- Status: accepted
- Ruling: "i also do NOT like the free-form method of model proviosioning such as
  \"openai.gpt-astra-6\" and \"gpt-astra-6\" ; these are bedrock and openai native model
  slugs"; "i want erverything to be defined as a proper enum; of course that will be
  translated to the actual model slug name before ifnerence calls"; "we make provider and
  model a first class property and then derive how to implement them" (owner, 2026-10-08)
- Decision: A session holds a provider and a model. An offering maps the pair to a native
  slug at the moment of the call.

### D005 — One format per offering

- Status: accepted
- Ruling: "yeah keep one format; we do test which covers more features of the endpoint and
  choose that for it" (owner, 2026-10-08)
- Decision: An offering is keyed by provider and model and names exactly one format.

### D006 — Behaviour is assembled from blocks, not extended from a generic adapter

- Status: accepted
- Ruling: "this seems good; basically we define the individual lego blocks and arrange and plug
  them in" (owner, 2026-10-08)
- Context: A class tree was considered. The differences between models cut across each other,
  so shared code would sit in parents that children override.
- Decision: A translation is a set of steps, each with variants written once; an offering
  picks one variant per step.

### D007 — A plugin may contribute a single block

- Status: accepted
- Ruling: "yes this is absolutely what is intended" (owner, 2026-10-08)
- Decision: One variant of one step of an existing format can be registered without writing a
  format.

### D008 — Every part is reachable by plugins

- Status: accepted
- Ruling: "i want each and every section of every part of the runtime to be configurable
  through plugins"; "adding new provider integrations for people should be easy as pi; howveer
  it may be; can be their own implemetnation too; i want to make the protocol in such a way
  that it's easy for plugins to exist" (owner, 2026-10-08)
- Decision: What a plugin implements is the port in `protocol`. Integration comes in sizes: an
  offering as data, a provider with its own authentication, a single block, a new format, a
  whole implementation of the port.
- Ruling, after the orchestrator pointed to the ports `protocol` already holds
  (`event.log.port`, `file.system.port`, `discovery.port`, implemented by packages such as
  `event-log-sqlite`) and recommended that plugins implement ports of that shape, named like
  them, with kuib's own functionality registered through the same path: "i do agree with your
  earlier point on refining/reusing the existing shape of the protocol as the plugins"; "the
  protocol point i agree that that is the simplest place to add configurability from outside"
  (owner, 2026-10-25). Read as agreement with that direction; the cut itself, the names and loading
  are settled with P06-I06.

### D009 — Partial output is kept and can be sent back

- Status: accepted
- Ruling: "i think outputs that are still incomplete can be sent back"; "tool calls should be
  stripped maybe; even incorrect/partial ones; however the outputs can be there if i
  interrupted in the middle; the agent also gets a sense that some interruption happened"
  (owner, 2026-10-07)
- Decision: Each part records whether it is complete. A closed step records how it ended. The
  translation decides what a provider accepts back.

### D010 — Low overhead, and a shape that is simple and not duplicated

- Status: accepted
- Ruling: "i want to keep it as low overhead as possible as well"; "i want the shape to be
  simple; non-duplicated; performant and easy to reason with" (owner, 2026-10-07)

### D011 — Zod now, Protobuf before release

- Status: accepted
- Ruling: "for the iteration phase; we shall keep to zod; but i am planning to replace
  everything with protobuf before i release so as to practice realtime migration and backward
  compat in production from that point onwards" (owner, 2026-10-06)
- Decision: New shapes use one discriminator per union, optional additions only, and no open
  records.

### D012 — The slice stands alone

- Status: accepted
- Ruling: "do we first create the whole provider in entirety?"; "yeah by entirety that is what
  i meant"; "let us get started with the inference" (owner, 2026-10-07)
- Decision: One translation is built completely and is not wired into the engine.
- Superseded by: D019, for the part that says it is not wired into the engine

### D013 — A step is a pair with our own identity

- Status: accepted
- Ruling: "yeah we should go through with this i think" (owner, 2026-10-07)
- Decision: A step is asked, then answered. It ends as completed, interrupted, failed, cut off
  by a limit, or abandoned. A provider's tool-call id is data and never the key.

### D014 — One format covers a provider's older and newer models

- Status: accepted
- Ruling: "the format and schema must also handle the differences between streaming internally
  also in propviders; anthropic itself have some basic differences in how they handle older
  and newer models" (owner, 2026-10-08)
- Decision: Such differences are blocks chosen by the offering, inside one translation.

### D015 — Enums everywhere

- Status: accepted
- Ruling: "i want enums everywhere" (owner, 2026-10-08)

### D016 — Context is assembled per application, and reasoning is set per step

- Status: accepted
- Ruling: "the engine how it will assemble context will be different on a per application
  basis"; "for the voice system I may major use the made conversation system call messages and
  switching between reasoning on and off between turns because for the first turn it needs to
  start speaking very fast so most likely I will disable reasoning for that specific term
  however subsequently I will enable it Im not sure yet how it affects cache"; "we are still
  not building the engine we are building the inference currently but that is a point I think
  which we should record" (owner, 2026-10-08)
- Context: A coding agent and a voice assistant assemble context differently. That belongs to
  the engine and the application, not to this feature.
- Decision: What this feature owes it: the reasoning level is part of each step that is asked,
  not a fixed property of a session or an offering, and an instruction can sit anywhere in the
  conversation.
- Consequences: On Anthropic, changing thinking or effort at the top of the request
  invalidates the cached messages. The cache-preserving form is an effort change carried by a
  system message inside the conversation, which newer Claude models accept behind a beta
  header. The "ask for reasoning" step therefore needs a variant for that form.

### D017 — Real traffic is recorded inside a stated envelope

- Status: accepted
- Ruling: "yaeh anthropic also released haiku which is cheaper"; "we shall do all of that that
  is not the problem" (owner, 2026-10-08); "yeah you may spend dollars for testing" (owner,
  2026-10-12)
- Context: Asked as G001. The second ruling answers whether the captures may spend about a
  dollar of the Anthropic API credit, which the owner had kept back from running work; the
  extra requests of G019 were asked in the same message and are not settled by it. The envelope put to the owner: up to 20 requests per provider,
  retries included, with `max_tokens` capped near 2,000; `KUIB_ANTHROPIC_API_KEY` and
  `KUIB_MIMO_API_KEY` read by name and never printed, the MiMo key tried on both Xiaomi hosts;
  synthetic prompts; credentials and headers that identify the account removed from fixtures;
  every request listed in the worker's plan and approved by the orchestrator before any call.
  Three additions were put with it: captures from Claude Haiku for the blocks an older model
  selects, one capture of an effort change carried inside the conversation (D016), and a
  second Claude model for the system message in the middle of a conversation if Sonnet 5.5
  rejects it.
- Decision: Recording goes ahead inside that envelope with the three additions; anything
  outside it returns to the owner. Which Haiku is recorded is named in the worker's plan after
  checking Anthropic's current model list. The remark on Haiku is read as agreement to those
  captures, not as replacing Sonnet 5.5.

### D018 — MiMo 2.6 Pro is the model recorded

- Status: accepted
- Ruling: "use 2.6 pro please; that was an old env model" (owner, 2026-10-08)
- Context: The plan named MiMo 2.6 Pro while `.env` and the live test named `mimo-v2.5-pro`.
- Decision: Captures and rows use MiMo 2.6 Pro. The old name leaves the code when P09 changes
  how a model is chosen; `.env` is the owner's to change.

### D019 — What exists is repaired, not built beside

- Status: accepted
- Ruling: "and we are to repair everything that is currently present inh te codebase";
  "nothing as of now is canonical so everything is open to refactoring"; "there are a lot of
  inefficiencies too"; "please do decide that" (owner, 2026-10-08)
- Context: D012 had the slice stand alone and unwired, and the first draft added new shapes
  beside `ModelRef`, `ModelConfig` and the step events. The owner asked the orchestrator to
  decide what is repaired.
- Decision: Decided by the orchestrator at the owner's request. This feature owns the model
  path end to end: the model-facing shapes of `protocol` are rewritten in place; the engine's
  provider folder and `build.messages` are deleted and its turn loop moves onto the model
  port; the readers of the changed events follow; the AI SDK is removed. The table "What is
  repaired" lists each line. The engine as designed (stream store, persistence at boundaries,
  lease, checkpointer) stays with the engine feature.
- Consequences: A second translation is needed, because kuib's own default model is served
  through OpenAI chat. The engine takes tool dispatch over from the SDK. Stored local sessions
  are discarded.
- Supersedes: D012, for the part that says the slice is not wired into the engine

### D020 — The format is drafted from the pieces of the two formats

- Status: accepted
- Ruling: "i think the better way to draft would be to find what the 2 formats have; break
  them into individual pieces so that we can write differnet implementations for all of them"
  (owner, 2026-10-08)
- Decision: The pieces are listed first (P07). The neutral format (P02) and the blocks (P04,
  P08) are derived from that table, and a piece is the unit a block implements. "The 2
  formats" is read as Anthropic Messages and OpenAI chat, the two kuib talks today.

### D021 — The OpenAI chat translation is in scope

- Status: accepted
- Ruling: "yeah second translation should be in scope while we make the seams i think?"
  (owner, 2026-10-08)
- Context: The orchestrator had read "the 2 formats" of D020 as Anthropic Messages and OpenAI
  chat and put the second translation in scope under D019, then asked the owner to confirm.
- Decision: OpenAI chat is built in this feature (P08), and the seams between pieces are drawn
  with both translations in view.

### D022 — Local sessions may be deleted

- Status: accepted
- Ruling: "all local sessions can be deleted no issues" (owner, 2026-10-08)
- Decision: Stored sessions are not migrated. A log written before the event shapes change is
  discarded.

### D023 — The engine is not touched now

- Status: accepted
- Ruling: "don't touch the engine now" (owner, 2026-10-08)
- Context: Under D019 the orchestrator had decided that the engine's turn loop moves onto the
  model port in this feature (P09). The owner's words came in answer to a summary that also
  said the engine's redesign stays out, so they may mean the redesign alone; the strict
  reading is taken until the owner says which.
- Decision: Nothing under `packages/engine` changes until the owner says so. P09 stays in the
  plan and is not scheduled. The shapes the engine reads stay in `protocol` until then, and the
  engine keeps running on the AI SDK.

### D024 — Testing is first class

- Status: accepted
- Ruling: "before that though"; "please check the shape"; "of the repo"; "i want testing to be
  first class"; "so make sure the setup is optimal and scalable" (owner, 2026-10-08)
- Context: Said when the owner had given the go to build. The audit is under "What exists
  today, and what is wrong with it".
- Decision: The test setup of the workspace is settled before the first implementation round.
  What it becomes is put to the owner first.

### D025 — Tests use the real modules

- Status: accepted
- Ruling: "And I don't want mock-ups of most of the things for which we are already make
  creating implementations at the code base. This is a completely local first thing without a
  lot of dependencies on infrastructure, right? So I think most of the things we can implement
  tests in such a way that it uses the exact same modules in the code." (owner, 2026-10-08,
  dictated)
- Decision: A test exercises the module the product runs. Nothing the codebase implements gets
  a second implementation for tests. Stand-ins exist only for what kuib does not implement and
  cannot run offline: a provider's traffic, replayed as recorded bytes where `fetch` is
  called, and time and randomness, passed in as values.
- Consequences: The path of P03-I03 is tested through a real translation, so it lands with
  P04. The engine's in-memory event log and its test with the AI SDK's mock model go when the
  engine is released (D023).

### D026 — The captures cover the configurations of every provider

- Status: accepted
- Ruling: "yeah proceed to capture"; "you may try the differnet configurations"; "for getting
  the data from all providers on all PnCs" (owner, 2026-10-12)
- Context: Asked as G019, after the owner was told what a capture is and that D017's envelope
  and G019's extra requests together cost about a dollar. D017's second ruling allows the
  spend.
- Decision: G019's requests are allowed, and the captures go wider than D017's 20 requests per
  provider: for every provider kuib holds a key for, each setting the table of pieces lists as
  varying is recorded at each of its values, on each model recorded, with rejections kept as
  fixtures (P01-I05). The orchestrator's reading, put to the owner with the list: "all
  providers" is Anthropic, MiMo on both endpoints, and Meta, whose key is in `.env`; "all PnCs"
  is every value of every setting at least once per model and the combinations the pieces file
  says interact, not the full product of all settings. The rest of D017 holds: keys read by
  name and never printed, synthetic prompts, `max_tokens` capped, account headers removed, and
  every request listed with a count and a cost estimate in the worker's plan, which the owner
  sees before the first call.

### D027 — The capture list is approved, cost is not a limit, and Meta is the orchestrator's call

- Status: accepted
- Ruling: "yeah this is fine no issues"; "no issues about cost"; "proceed with everything";
  "also if you want to use meta you may check there too" (owner, 2026-10-13)
- Context: The worker's list came to 667 requests over six offerings, about 2.73 USD and 4.62
  USD at worst. The owner asked what the number meant and "how is meta relevant here? are we
  building for all providers right away?". The orchestrator explained that 667 is the count
  of calls, about 110 per offering, each changing one setting; recommended the full list for
  Claude Sonnet 5.5, Haiku 5.5, Haiku 4.5 and MiMo 2.6 Pro on both endpoints and dropping Meta
  until the repair of P09 is scheduled; and asked whether the probes above the output ceiling
  may go ahead. The first words answered the recommendation; the rest came while the go was
  being written.
- Decision: The whole list of the task capture-traffic is approved. The five probes above the
  output ceiling go ahead, which is the orchestrator's reading of "no issues about cost" and
  "proceed with everything": cost was the only objection to them. Meta is recorded as well,
  last, on `muse-spark-1.1`, by the orchestrator's choice under "if you want": a second
  provider on OpenAI chat shows which behaviour is MiMo's and which is the format's (G020);
  if that model is refused, Meta stops at its first call. The tool's 5 USD guard stays as a
  safety and is not the owner's limit.

### D028 — The organization id inside a Haiku 4.5 signature may be in the repository

- Status: accepted
- Ruling: "Yeah, you may allow the id in the repo, it's not a it's not that big of an issue,
  it's fine, you can add it." (owner, 2026-10-13, dictated)
- Context: Asked as G022. Three ways were put to the owner: replace the id in place with
  filler of the same length (recommended), allow it, or leave those rows out.
- Decision: The fixtures keep Haiku 4.5 signatures exactly as received, organization id
  included. The capture tool stops treating the value of `anthropic-organization-id` as a
  reason to refuse a response body; the header itself is still not stored. A fixture whose
  body carries the id says so in its own data, and the audit accepts the id only there. Keys
  are refused as before.

### D029 — The provider of MiMo is Xiaomi, and fixtures follow the seams of the design

- Status: accepted
- Ruling: "should we not make the fixture names match the enum formatting that we had
  planned?"; "for the provider?"; "yeah basically whatever we have made the seams on";
  "message_format"; "provider"; "model"; "or whatever it may be"; "i think every part of the
  codebase must be uniform"; "maybe rethink how to put the fixtures"; "yeah mimo provider is
  xiaomi" (owner, 2026-10-14)
- Context: The capture task filed its fixtures under one joined name per offering, such as
  `mimo-chat-mimo-v2-6-pro`: the provider slot held the model's family, the format was
  shortened to `chat` and `messages`, Haiku 4.5 sat under its dated native slug, and three
  identities were glued into one string. The orchestrator put a layout to the owner: one folder
  level per identity, format then provider then model, each named by the string value of its
  enum member; cases renamed by piece and variant in P07-I02; request and response files named
  symmetrically without a step prefix. The owner answered the one direct question, the
  provider of MiMo.
- Decision: A provider is who serves a model; for MiMo that is Xiaomi, written `xiaomi`.
  Fixtures are filed along the identities the design is cut on. The rest of the layout is the
  orchestrator's proposal, carried out in P01-I06 and open to the owner's correction: the
  order format, provider, model; the format words `anthropic-messages` and `openai-chat`;
  model words without dates or dots (`claude-haiku-4-5`, `mimo-v2-6-pro`, `muse-spark-1-1`).
  The three enums are defined once in `protocol` as part of P01-I06, after the owner said of
  the first plan, in which the tool kept its own copy of the words: "if we change the schema or
  anything this will get old/stale"; "incorrect" (2026-10-14). P02-I01 builds the offering on
  them.

### D030 — The capture tool becomes a package

- Status: accepted
- Ruling: "yeah the tooling is for very bare bones basic scripts; all the other things should
  be a proper package that owns everything; not broken into pieces like this?" (owner,
  2026-10-14)
- Context: Said of the test runner, which the task test-setup had put in `tooling/` beside the
  repository's scripts (test-system D011). The capture tool is the same case: 1,800 lines in
  one file under `tooling/`, with the fixtures it serves in `packages/inference`.
- Decision: The capture tool moves into a package of its own (P01-I07), after the task
  rename-fixtures has landed. It is not put inside `packages/inference`, which is production
  code, while the tool reads keys and calls providers.
- Superseded by: D031

### D031 — The recorder belongs inside the inference package

- Status: accepted
- Ruling: "what is capture package? not sure about this"; "why is a package requird for that
  thing? because we want to isolate it from the inference package?"; "yeah"; "it should belong
  inside the packages/inference only"; "the fixtures are all part of test suites only;
  otherwise they are not rleevant right?" (owner, 2026-10-14)
- Context: Under D030 the task move-capture built `packages/capture`. Asked why it needed a
  package, the orchestrator gave two reasons and withdrew the second: `packages/inference`
  will itself hold credentials and call the same providers at runtime, so the recorder is the
  same act plus writing the result to disk, not a different kind of code. A package of its own
  split one concern in two, with the fixtures, their path unit and their tree test in
  `packages/inference` and the thing that makes them elsewhere, and it kept a second way to
  call a provider.
- Decision: The recorder's units move into `packages/inference`, beside the fixtures, and
  `packages/capture` goes. Fixtures and recorder are test-side only: no code the product loads
  reads a fixture or imports the recorder. When the inference transport exists (P03-I02),
  recording goes through it and the recorder's own HTTP code is removed.
- Supersedes: D030

### D032 — The recorder's units are nested by subject

- Status: accepted
- Ruling: "and let us too start /orchestrate and do the proper refactor"; "aren't they more
  arrangable in proper nestings? i understand if you are trying to maintain the one function
  one file rule" (owner, 2026-10-25)
- Context: The 57 recorder units lie flat in `packages/inference/src` beside where the model
  layer will go, told apart only by their claim line and a barrel test. The flat layout came
  from the brief of move-capture, on a false premise (agent-harness D008), not from D031, which
  placed the recorder in this package and said nothing of its layout.
- Decision: The recorder's units move under `src/capture/`, grouped by subject (P01-I09). One
  unit per folder with its test stays. The tree is put to the owner, literally, before the task
  starts.
- Supersedes: —
- Superseded by: —

## Gaps

### G001 — Recording real traffic needs the owner's go-ahead

- Status: resolved
- Recommendation: Allow about a dozen small calls on Claude Sonnet 5.5 and about as many on
  MiMo 2.6 Pro, using the keys in `.env`. The cost is a few cents.
- Context: The translation is built against fixtures. Nothing has been called yet.

### G002 — Where a plugin runs

- Status: open
- Recommendation: Keep the port plain data so a plugin can later run inside the process or as
  a separate process, and build only the in-process form in this feature.
- Context: The application is to ship as one compiled Deno executable. Whether that executable
  can load third-party code at runtime has not been verified.

### G003 — How the built-in providers are packaged

- Status: open
- Recommendation: Register them through the public path from folders inside `inference`, each
  importing only what a plugin could, and split them into packages when a plugin from outside
  the workspace first exists. Enforce the boundary with a lint rule and a test that registers
  the Anthropic translation from outside the package.
- Context: Separate packages would enforce the boundary by construction, at the price of
  several small packages for one slice. In every layer surveyed, built-ins reached the core by
  a path a third party was not given ([[features/inference/research/prior-art-synthesis-2026-10-08]], shape 7).

### G004 — The word for who serves a model, and whether a family is an identity

- Status: resolved
- Recommendation: "Provider" means who serves the model; add no "family" enum now.
- Context: Resolved on 2026-10-14. The word is "provider" and it means who serves the model:
  the owner, on being told the word had been listed as open, "the should be \"provider\"
  right?", after "yeah mimo provider is xiaomi" (D029). No family enum is added now; that half
  is the orchestrator's call under the recommendation above and is reopened if a model's
  maker ever has to be told apart from who serves it. Today's `providerID` covers both who
  serves a model and who made it. The owner said
  "format may be different of the messages, family may be different or similar". G013 asks
  the wider question the research raised: an address, a region and a plan under a provider.

### G005 — "Asked and answered" beside "started and finished"

- Status: resolved
- Recommendation: Name the new step shapes "asked" and "answered" and leave the existing
  `StepStarted` and `StepFinished` events alone until the engine moves.
- Context: Two word pairs for one idea will coexist until then. Resolved by D019: the step
  events are replaced in place, so the pairs do not coexist once P09 is done.

### G006 — Where the opaque payload may sit, and whether reasoning is replayed across turns

- Status: open
- Recommendation: One typed payload, a union keyed by format with named fields, on exactly one
  part of any model-authored kind, with the offering that produced it recorded beside it. Each
  "send reasoning back" variant states what it does with a payload from another offering and
  with reasoning that has no payload, and never emits an empty turn. Leave the choice to
  replay across turns to the engine.
- Context: Gemini attaches signatures to tool-call parts (seen in opencode's source). Core
  decision D011 currently says reasoning is not replayed. The first draft recommended "Allow
  the payload on any model-authored part"; all four research reports found that a payload
  without its producer, reachable from several places, is what broke the layers surveyed
  ([[features/inference/research/prior-art-synthesis-2026-10-08]], shape 1).

### G007 — Keeping identities unique when plugins author their own enums

- Status: open
- Recommendation: An identity travels as two fields, the plugin's name and the enum's string
  value, never as one string to split, and a reader without that plugin still loads the
  session. What kuib reads from a provider gets a member for a value not recognised.
- Context: An enum compiled into the core cannot be extended by a plugin. The first draft
  recommended one prefixed string; the research found that a model named by one string that
  code takes apart is a worst shape of its own, and that the same question applies to values
  read from a provider and to core values newer than the build that reads a stored session
  ([[features/inference/research/prior-art-synthesis-2026-10-08]], shape 4 and the risks D004 and D015 carry).

### G008 — What MiMo's Anthropic endpoint really does

- Status: resolved
- Context: Its documentation names a host other than the one kuib uses, lists `system` as a
  message role without saying what it means mid-conversation, and shows no signature on
  thinking. P01-I03 settles it. The plan names MiMo 2.6 Pro while `.env` and the live test use
  `mimo-v2.5-pro`; which one is recorded was asked on 2026-10-08 and is unanswered. Research
  of 2026-10-08: pi moved its Xiaomi rows off the Anthropic-compatible address after tool
  rounds with thinking failed, the token-plan hosts serve an `/anthropic` path, and models.dev
  lists `mimo-v2.6-pro` for the Singapore token plan ([[features/inference/research/prior-art-synthesis-2026-10-08]], "What was learned about MiMo").
  The pieces file adds: MiMo documents an `/anthropic` path on all three token-plan hosts; its
  Anthropic page lists an optional `signature`; its OpenAI endpoint takes a top-level
  `thinking` field and `max_completion_tokens` only. For D005 this points at the OpenAI
  endpoint as the one that covers more, until the captures measure it. Answered from recorded traffic in section 3 of
  [[features/inference/research/variants-per-piece-2026-10-14]]: the endpoint lives on the
  Singapore token-plan host under `/anthropic/v1/messages`, admits `api-key`, `Authorization`
  and `x-api-key`, rejects almost nothing and does little of what it accepts. Measured, the
  endpoint that covers more is Anthropic Messages, not the OpenAI one this gap first pointed
  at; section 4 of the same file recommends it for D005, with one capture owed first (two or
  more tool rounds with reasoning in one turn). That choice is the owner's and is not made.

### G009 — Whether Claude accepts cut-off text with thinking on

- Status: resolved
- Context: Expected from Anthropic's guidance on truncated turns, not yet tested. P01-I02
  settles it. Answered yes from recorded traffic: Sonnet 5.5, Haiku 5.5, Haiku 4.5 and MiMo's
  Anthropic endpoint each accept cut text sent back as an assistant turn followed by a user
  turn, with reasoning on, and go on from where the text stopped (`S/cut-text-user`,
  `H/cut-text-user`, `L/cut-text-user`, `MA/cut-text-user`). Text that ends in whitespace was
  not tried ([[features/inference/research/variants-per-piece-2026-10-14]], section 3).

### G010 — The existing identity and config shapes

- Status: resolved
- Recommendation: Add the new shapes beside `ModelRef` and `ModelConfig` and change neither in
  this feature.
- Context: 57 files import `protocol`, and the engine reads both shapes today. Resolved by
  D019: both shapes are replaced, and removed once their last reader has moved (P09-I07).

### G011 — Where the report of what a translation did lives

- Status: open
- Recommendation: A typed list in `protocol`, one entry per intent, saying honoured, rendered
  another way, or dropped. It is returned when the request is built without sending, travels
  as the first delta and is kept on the closed step. No mark that makes an intent required:
  the report exists before anything is sent, so the caller can decline to send.
- Context: D003 says a translation "reports what it did" and no item carries the report. All
  four research reports found unsupported intents dropped in silence. Two of them ask whether
  a step may mark an intent as required, so the call fails instead of degrading; that is a
  risk D003 carries ([[features/inference/research/prior-art-synthesis-2026-10-08]], shape 2).

### G012 — The provider's stop reason beside the five endings

- Status: open
- Recommendation: Keep D013's five endings. Beside them, keep the provider's stop reason
  verbatim and a neutral enum for why the model stopped, with a member for a reason not
  recognised that never reads as completed.
- Context: The five endings say who ended a step, and "abandoned" is written by an engine,
  never by a translation. Where a refusal, a content filter and a pause belong is the owner's
  to say ([[features/inference/research/prior-art-synthesis-2026-10-08]], shape 3).

### G013 — An endpoint under a provider, and where model facts live

- Status: open
- Recommendation: An endpoint (address, region, plan) is machine configuration under a
  provider and holds the credential; a session stores provider and model only (D004) and an
  offering stays keyed by provider and model (D005) until a capture shows two endpoints of one
  provider behaving differently. Facts about a model are stated once on the model; an offering
  holds only what the provider changes.
- Context: kuib has the case already: the MiMo key belongs to the Singapore token-plan host
  and the documented Anthropic endpoint is on another. pi and models.dev list Xiaomi as four
  providers for this reason. A dated snapshot has no definition yet ([[features/inference/research/prior-art-synthesis-2026-10-08]], shape 4).

### G014 — The neutral words for a reasoning level and a cache hint

- Status: open
- Recommendation: Settle both in the paper of P02-I02 after capturing thinking disabled, a
  token budget, a forced tool choice and a temperature on Sonnet 5.5, with the mapping held as
  data per row. Record Claude Haiku 5.5 as the row for the voice case of D016 and Claude Haiku
  4.5 as the row for the budget block.
- Context: The AI SDK's table says Sonnet 5.5 and Opus 5.5 reject thinking disabled, budgets,
  forced tool choice and sampling settings, and that Haiku 5.5 can turn thinking off; that is
  the SDK's claim, not Anthropic's. Anthropic's model page, read 2026-10-08, lists Haiku 5.5
  as current and Haiku 4.5 as legacy and available, and says a thinking budget is "not accepted
  on later models" than Opus 4.6 and Sonnet 4.6 ([[features/inference/research/prior-art-synthesis-2026-10-08]], shape 5).
  Anthropic's own table, read for the pieces file, confirms it: Sonnet 5.5 has no `disabled`
  and no budget and uses `between_tools`; Haiku 5.5 takes `disabled`; a change of the thinking
  setting between steps invalidates the cached messages, and an effort change carried in a
  `system`-role message does not. The words differ more than first drawn: Anthropic has a mode
  and a separate effort, OpenAI has effort alone, and cache lifetimes are `5m` and `1h` against
  `30m`.

### G015 — Signed reasoning when the text above it changes

- Status: open
- Recommendation: A block for a changed prefix, two captures of signed thinking with a changed
  system text (with and without the binding control), and in P05 a test that every rebuilt
  request extends the one before it, with the recorded cache read as proof.
- Context: A thinking signature binds to the system text, the tools and every earlier message.
  D016 changes the top of the request by design and its consequences speak of the cache only
  ([[features/inference/research/prior-art-synthesis-2026-10-08]], shape 6). Answered for Sonnet 5.5, Haiku 5.5, Haiku 4.5 and MiMo's
  Anthropic endpoint in section 3 of
  [[features/inference/research/variants-per-piece-2026-10-14]]. Two halves stay open: a
  changed earlier message, and an account created on or after 2026-08-31.

### G016 — What a block may see, what a row must state, and what is built first

- Status: open
- Recommendation: A block never receives the model or provider identity, by type and by lint
  rule. Every step is a required choice in every row; a variant is named for behaviour and may
  carry parameters; a row is validated when registered and each value cites the fixture that
  shows it. The steps are listed from the fixtures and the translation written before the
  block registration of P03-I01 is built.
- Context: Every layer surveyed began with rows and ended with code beside them that tests
  identities. The five steps drawn so far miss tool choice, the output limit, sampling
  settings, extra headers, the address, framing and signing. D006 and D007 stand; this is
  about what keeps them true and about the order of P03 and P04 ([[features/inference/research/prior-art-synthesis-2026-10-08]], shape 7).

### G017 — Who classifies a failure and who retries

- Status: open
- Recommendation: The transport reports transport facts only. A "classify failure" step of the
  translation reads the error body and the error frame in mid-stream into one failure shape in
  `protocol`. Inference never retries; the engine does.
- Context: P03-I02 puts classification in a transport that knows no provider and so cannot
  read an error body. The layers surveyed classify by English text and retry in several
  places, each failed attempt costing a cache miss ([[features/inference/research/prior-art-synthesis-2026-10-08]], shape 8).

### G018 — What the paper of P02-I02 must settle

- Status: open
- Recommendation: The paper states, before any code: four disjoint usage counts, each
  optional, with no computed total and the provider's usage kept verbatim; a closed set of
  delta kinds with one merge rule each, kuib's own part id on every delta, and one fold shared
  by every reader and tested at every cut; whether tool declarations and instructions sit
  inside the conversation, and the rule between a tool call and its result. It checks the
  shapes against OpenAI Responses and Gemini as well as OpenAI chat.
- Context: Discussed with the owner on 2026-10-08 and 2026-10-09, proposed and not ruled: the
  closed step is the stored record of an answer, kept as the translation produced it; the
  history in a step that is asked is made of the same stored shapes, so the paper also defines
  user input, an instruction with its position, and a tool result that can say "not run",
  "interrupted" and "ran with different input than asked"
  ([[features/engine-foundation/research/engine-design-2026-10-07]], "Approvals, edits before a
  run, and several devices"); part and tool-call ids are derived from the step id and position.
  P02-I02 names usage, deltas and tool declarations without these rules, and checks
  against OpenAI chat alone, which has no reasoning to send back ([[features/inference/research/prior-art-synthesis-2026-10-08]], shapes 9 to 12).

### G019 — Captures beyond the envelope of D017

- Status: resolved
- Recommendation: Allow about fifteen more requests on Anthropic: thinking disabled, a budget,
  a forced tool choice and a temperature on Sonnet 5.5, with rejections kept as fixtures; a
  system message at four positions; signed thinking under a changed system text; a tool round
  begun on one offering and continued on another, both ways; an answer that ends on the output
  limit; a step cut during thinking. Failures that cannot be provoked (an overloaded error in
  mid-stream, an exhausted balance) are written by hand and marked synthetic.
- Context: D017 allows 20 requests per provider. The research reports propose these captures
  across shapes 1, 5, 6, 10 and 11 of [[features/inference/research/prior-art-synthesis-2026-10-08]].
  The pieces file lists more under "Unverified": a fifth cache mark, `max_tokens` above the
  ceiling, an empty text block, a `system`-role message to Haiku 4.5, and on MiMo a thinking
  block sent back without a signature, with an empty one and with one from Claude. Resolved by
  D026, which allows these and widens the captures to the configurations of every provider.

### G020 — Which of today's providers must keep working

- Status: open
- Recommendation: Keep a row for each provider kuib serves today through OpenAI chat: Meta,
  Groq and the generic endpoint. Capture Meta with the key already in `.env`, a handful of
  requests; mark Groq and the generic endpoint as assumed until someone records them.
- Context: The repair removes the AI SDK, through which kuib reaches Meta, Groq and any
  OpenAI-compatible address today. Only Anthropic and MiMo have captures planned, so rows for
  the others would rest on documentation alone. While the engine is untouched (D023) all three
  keep working through the AI SDK, so this can wait for P09.

### G021 — What OpenAI chat cannot say

- Status: open
- Recommendation: The neutral format keeps the order in which text and tool calls were
  produced and an error flag on a tool result. The OpenAI chat translation renders what it can
  and reports what it lost (G011). Tool choice "none" is rendered as a choice and never by
  removing the tool declarations, which would change the cached prefix.
- Context: In OpenAI chat `content` and `tool_calls` are separate fields, so their order is
  not stated, and a tool result has no error flag. The AI SDK and opencode render "none" on
  Anthropic by dropping the tools ([[features/inference/research/format-pieces-2026-10-08]]).

### G022 — A Haiku 4.5 signature carries the organization id

- Status: resolved
- Recommendation: Replace the id inside the stored signature with filler of the same length,
  say so in the fixture, and keep the real signature outside the repository only while the
  follow-up calls of that capture run need it. The translation treats a signature as opaque,
  so no test depends on those bytes.
- Context: Found by the capture tool on 2026-10-13 (ledger ordinals 120 and 121 of the task
  capture-traffic): the response to a Haiku 4.5 tool round with thinking was refused twice,
  and the second refusal diagnosed itself as the value of the response header
  `anthropic-organization-id`, 36 characters, found as base64 inside the response body. The
  signature of a Haiku 4.5 thinking block therefore carries the account's organization id in
  clear. Nothing of either response was written. D017 says headers that identify the account
  are removed from fixtures; an id inside an opaque payload was not foreseen. The other ways:
  allow the id in the fixtures, which keeps the bytes exact (it is an identifier, not a
  credential); or leave out the Haiku 4.5 rows that return or send back reasoning, which loses
  the evidence for signed reasoning on the older model. No UUID was found inside base64 in the
  Sonnet 5.5 and Haiku 5.5 fixtures recorded so far (four signatures, checked at every
  alignment). For the format: an opaque payload can carry account identity, which bears on
  G006. Resolved by D028: the owner allows the id in the repository.

### G023 — MiMo refuses the key

- Status: resolved
- Recommendation: The owner checks `KUIB_MIMO_API_KEY` and the token plan; with a working key
  the 222 MiMo rows run as approved under D027.
- Context: On 2026-10-13 the key was refused with 401 "Invalid API Key" three times: the
  Messages route on the Singapore host with `api-key`, the chat route there with
  `Authorization: Bearer`, which is the route and header the engine uses today, and the chat
  route on the pay-as-you-go host. The calls named `mimo-v2.6-pro`; `.env` runs
  `mimo-v2.5-pro`. A key exported in the shell would be used before `.env`. Resolved on 2026-10-13
  on the owner's instruction ("the key might have been changed"; "Don't view the ENv, but
  scrape the ENV and request for from all of them and you will eventually find the correct
  key"; "once you find the correct key, please replace all of the keys with that key"): the
  orchestrator read the MiMo variables of the env files on eos, minerva and statice into a
  script's memory, tested each distinct key on both hosts without printing any, and found two
  keys: a refused one in four files and a working one in
  `~/dotfiles/.local/bin/mimo-codex.env` on eos, which answers on the Singapore token-plan
  host and is refused on the pay-as-you-go host. The refused key was replaced by the working
  one in `.env` of this repository on eos and on minerva, in `~/developer/ana/.env` on
  minerva and in `~/developer/misc/firecrawl/.env` on statice; every place was read back and
  tested again. No env file exists under /tmp on any of the three.

### G024 — An answer the provider calls finished that holds nothing

- Status: open
- Recommendation: Settle it in the paper of P02-I02, with G012: a stop reason of "finished"
  does not by itself make a step complete.
- Context: Found in recorded traffic ([[features/inference/research/variants-per-piece-2026-10-14]]).
  Meta ends ten answers with `stop`, an empty delta and no usage. MiMo's chat endpoint ends one
  with `stop` and no content after a stop sequence matched inside its reasoning
  (`MO/stop-four`). Claude can end with `end_turn` and no part. The orchestrator checked the
  first two against the recorded bodies.

### G025 — The name of the registry an extension point keeps

- Status: open
- Recommendation: Settle it with the plugin decisions the research proposes; the units that
  write and read it are `register.*` and `resolve.*`.
- Context: The research found no sibling: the workspace has no `*.registry` or `*.store`
  unit, and the nearest is `FACTORIES` inside `packages/engine/src/provider/model`
  ([[features/inference/research/plugin-architecture-2026-10-25]], Names). `PROTOCOL_VERSION`
  has no sibling either.
