---
title: The worst shapes in other model layers, set against the inference plan
date: 2026-10-08
origin: ["conversation 2026-10-08", "[[features/inference/plan]]"]
---

# The worst shapes in other model layers, set against the inference plan

The owner asked for an adversarial survey before the inference plan is settled: "the point is
to be adversarial; identify their worsst shappes so we can avoid them". Four workers read
eleven model layers at recorded commits, with their issue trackers and migration guides, and
sampled several more:

- [[features/inference/research/prior-art-opencode-pi-2026-10-08]] — opencode and pi (15 shapes);
- [[features/inference/research/prior-art-harnesses-2026-10-08]] — Codex, Crush with fantasy
  and catwalk, Goose (14 shapes);
- [[features/inference/research/prior-art-sdks-2026-10-08]] — the AI SDK, LiteLLM, LangChain
  (15 shapes);
- [[features/inference/research/prior-art-routers-2026-10-08]] — OpenRouter, the Portkey
  gateway, models.dev (14 shapes).

This file merges their 58 shapes into twelve, ranked by how many of the four found the shape
independently and by what it costs the plan. A shape is cited as `opencode-pi 2`,
`harnesses 1`, `sdks W01`, `routers W01`: the number it has in its own file, where the
evidence is. Nothing here is decided. Every proposal is a question for the owner, recorded in
the plan as a gap.

## What the orchestrator checked

Each HIGH finding of the four reports was checked with a read of its leading source at the
commit the report names (opencode `663fbd7`, pi `1cedd32`, Codex `e974aad`, Crush `140e8cb`,
fantasy `b0fadc9`, catwalk `8eb2a29`, Goose `9560429`, AI SDK `5028fa4`, LiteLLM `8fc31b1`,
LangChain `1f587e3`, Portkey `669825c`, OpenRouter's AI SDK provider `1b22b05`, models.dev
`85302cc`). All the lines read say what the reports say. Issues were checked where they could
be opened: Portkey #1579, OpenRouter's provider #491, and six issues from the harnesses
worker's cache (Goose #10821, #11019, #12090; Codex #17541, #35925; fantasy #177).

Not confirmed by the orchestrator:

- the maintainer's words quoted from the comments of OpenRouter's provider #491 (the issue and
  its failure were read; the comments could not be loaded);
- the sentence that requests to an `:extended` slug "have no endpoints to route to": it is not
  on the page `routers W03` cites;
- every MEDIUM and LOW finding, and each report's "Unverified leads".

Read from Anthropic's own pages on 2026-10-08, because two shapes turn on it
(`platform.claude.com/docs/en/about-claude/models/overview`): the current models are Fable
5.1, Opus 5.5, Sonnet 5.5 and Haiku 5.5; Haiku 4.5 is a legacy model that is still available;
thinking with a token budget is "deprecated on Claude Opus 4.6 and Claude Sonnet 4.6 and not
accepted on later models".

## The twelve shapes

### 1 · The opaque payload has no producer

Found by all four: `opencode-pi 2`, `harnesses 1`, `sdks W01` and `W02`, `routers W01` and
`W06`.

Signatures, encrypted reasoning and provider item ids are stored without a record of what
produced them, in open records that writer and reader agree on by convention, and reachable
from more than one place. They are valid only where they were issued. When a session changes
model, or a router changes the provider underneath, the next request fails or the data is
silently stripped: Codex "Model switch mid-conversation fails" (#17541, open); opencode drops
reasoning when the model differs (`message-v2.ts:376-383`); pi keeps a signature only when
provider, format and model all match (`transform-messages.ts:95-134`); OpenRouter's client
read the same data from the message, the first tool call and the first reasoning part and
broke three times on the duplication.

The plan: undecided, and the drafted answer makes it worse. G006 recommends "Allow the
payload on any model-authored part"; P02-I02 names "the opaque provider payload" with no
producer; D004 lets a session change provider and model between two steps.

Proposed: one typed payload, a union keyed by format with named fields, on exactly one part;
the offering that produced it is recorded beside it. Each "send reasoning back" variant states
what it does with a payload from another offering, with reasoning that has no payload, and
never emits an empty turn. Captures: a tool round begun on one offering and continued on
another, in both directions.

### 2 · An intent that cannot be honoured disappears

Found by all four: `opencode-pi 4`, `harnesses 3`, `sdks W03`, `routers W02`.

Every subject drops, overwrites or re-renders what a provider cannot do, and the trace is a
log line, a free-text warning or nothing. Portkey copies only the parameters its table knows
and answers 200 (`transformToProviderRequest.ts:83-92`); prompt caching for Claude on Vertex
has been silently off since 2026-03-25 (#1579, open). fantasy never sent "no tools" and the
model kept calling them (#177). Goose overwrites the temperature when thinking is on
(`formats/databricks.rs:324`).

The plan: it has the right ruling and no shape for it. D003 says a translation "reports what
it did"; no item of P02, P03 or P04 carries that report. As written, kuib would degrade as
silently as the others.

Proposed: a typed list, one entry per intent, saying honoured, rendered another way, or
dropped. It is returned when the request is built without sending, travels as the first delta,
and is kept on the closed step. Question for the owner, raised by two reports as a risk D003
carries: may a step mark an intent as required, so the call fails instead of degrading?

### 3 · Endings are a closed list and the provider's reason is thrown away

Found by all four: `opencode-pi 6`, `harnesses 4`, `sdks W05`, `routers W04`.

pi throws on a stop reason it does not know, under a comment that says "Handle unknown stop
reasons gracefully" (`anthropic-messages.ts:1635-1637`). opencode and the AI SDK map a refusal
to "content-filter" and a pause to "stop". Portkey maps anything unknown to a normal stop
(`providers/utils.ts:77-82`). The results: a lost tool call reported as a normal stop, tools
run after a truncated answer, a failed run recorded as a success.

The plan: P02-I02 gives the closed step "one of five endings" (D013) and nothing else. The
five say who ended the step. They have no place for why the model stopped, and "abandoned" is
written by an engine, never by a translation.

Proposed: keep D013's five. Beside them, the provider's stop reason verbatim and a neutral
"why the model stopped" enum with a member for a reason not recognised, which never reads as
completed. The owner to say where a refusal, a content filter and a pause belong.

### 4 · Two fields of identity for a thing that varies on more

Found by all four: `opencode-pi 1`, `harnesses 6` and `11`, `sdks W14`, `routers W03`.

Who serves a model also means an address, a region, a billing plan and an account, and a model
also means a dated snapshot and a tier. With nowhere to go, those facts end up in the name.
pi lists `xiaomi`, `xiaomi-token-plan-cn`, `-ams` and `-sgp` as four providers and made a
breaking change moving `xiaomi` between addresses (`types.ts:43-86`, `CHANGELOG.md:1077`);
models.dev does the same. OpenRouter's documentation warns clients "Do not strip every
suffix". Portkey strips seven region prefixes by regular expression. catwalk keeps one flat
row per model at each provider, and the rows drift: the same Claude model has its two cached
prices swapped between `anthropic.json:169-170` and `opencode-zen.json:213-214`.

The plan: it has the case already. kuib's MiMo key belongs to the token-plan host in
Singapore; the documented Anthropic endpoint is on another host. D005 keys an offering by
provider and model; nothing holds an address or a credential, and G004 asks only about the
word "provider".

Proposed: an endpoint under a provider (address, region, plan), kept on the machine with its
credential; a decision on whether one provider and model may have several offerings; model
facts stated once on the model, the offering holding only what the provider changes; identity
on the wire as two fields, never one string to split; a ruling on what a dated snapshot is.

### 5 · One word for reasoning, and "off" does not exist everywhere

Found by three: `sdks W04`, `routers W05`, `harnesses 2`.

A neutral reasoning level means a different thing on every model. The AI SDK's table for
`claude-sonnet-5-5` and `claude-opus-5-5` says thinking cannot be disabled, a token budget is
rejected, a forced tool choice is rejected and sampling settings are rejected; where "none" is
asked it sends low effort and a warning (`anthropic-language-model.ts:3211-3238,3519-3527`).
For `claude-haiku-5-5` the same table says thinking can be turned off. LiteLLM turns the word
into a budget from constants; OpenRouter converts effort and budget by fixed shares.

The plan: D016's own case is at stake. "for the first turn it needs to start speaking very
fast so most likely I will disable reasoning for that specific term". The first row is Sonnet
5.5 with the variants "effort, budget, toggle, none". If the AI SDK's table is right, "none"
and "budget" are both rejected there. That table is the SDK's claim, not Anthropic's, so it is
a thing to capture, not to believe.

Proposed: capture thinking disabled, a budget, a forced tool choice and a temperature on
Sonnet 5.5 and keep the rejections as fixtures. Define the neutral level and the cache hint in
the paper check, with the mapping as data per row. Record Haiku 5.5 as the row for the voice
case and Haiku 4.5 as the row for the budget block.

### 6 · Signed reasoning is bound to everything above it

Found by three: `opencode-pi 3`, `harnesses 8`, `sdks W12`.

On current Claude models a thinking signature binds to the system text, the tools and every
earlier message. A layer that re-renders its prefix gets a permanent 400, or pays for the
cache again. opencode asks the API to drop the affected blocks because it "re-renders parts of
that prefix between turns" (`provider/transform.ts:703-709`). Goose's placement of cache marks
is "re-decided independently in ~11 request-assembly paths, of which 2 have tests" (#11019).
One Codex session measured prompt-cache misses at 94% of its uncached cost (#35925).

The plan: D016 changes the top of the request by design when reasoning changes between steps,
and its consequences speak of the cache only. No block and no capture covers signed thinking
under a changed prefix, and no test proves that a rebuilt request extends the one before it.

Proposed: a block for a changed prefix; two captures of signed thinking with a changed system
text, with and without the binding control; in P05, a prefix test over every fixture sequence
with the recorded cache read as proof.

### 7 · The table decays into code beside it

Found by all four: `opencode-pi 8` and `14`, `harnesses 2`, `12` and `13`, `sdks W13`,
`routers W09`.

Every subject began with rows and ended with code that tests identities. Crush switches on
provider ids under "TODO: Abstract this in Fantasy somehow?" (`coordinator.go:656-662`). pi
has 52 optional compatibility flags with defaults guessed from the address. opencode decides
behaviour by substrings of model ids. Of models.dev's 9,100 commits, 1,434 are corrections.
A second host of one schema becomes a near-copy that drifts.

The plan: D006 and D007 rule blocks, and nothing yet keeps a block honest. The five steps
drawn for Anthropic Messages already miss tool choice, the output limit, sampling settings,
extra headers, the address, framing and signing. P03 builds the registry before P04 has shown
what a block needs.

Proposed: a block never receives the model or provider identity, by type and by lint rule;
every step is a required choice in every row; a variant is named for behaviour and may carry
parameters; a row is validated when registered and each of its values cites the fixture that
shows it; the steps are listed from the fixtures before the registry is built; G003 is
enforced by a lint rule and a test that registers the translation from outside.

### 8 · Failures read by their English text, and retried by several layers

Found by three: `harnesses 5`, `sdks W11`, `routers W11`.

Goose recognises a context overflow by nine phrases (`http_status.rs:139-149`); fantasy has a
regular expression per provider; LiteLLM matches "prompt is too long". Gateways classify by
HTTP status while many failures arrive inside a 200 stream, so they reach neither retry nor
fallback. Where several layers retry, each failed attempt costs a cache miss.

The plan: P03-I02 puts classification in a transport that "contains no knowledge of any
provider", which cannot read an error body; P04-I02 handles the error in mid-stream
separately.

Proposed: the transport reports transport facts only; a "classify failure" step of the
translation reads the error body and the mid-stream frame into one failure shape in
`protocol`; inference never retries.

### 9 · Usage numbers that mean different things

Found by all four: `opencode-pi 7`, `harnesses 7`, `sdks W08`, and `routers` under Portkey F.

Input includes cached tokens at one provider and excludes them at another. A count the
provider did not report is stored as zero. Usage is lost when a step does not finish. The
results: double charging, negative uncached input, a false "context limit reached".

The plan: P02-I02 says "usage including cache read and write" and no more.

Proposed: four disjoint counts, each optional, no computed total, the provider's usage kept
verbatim, and usage carried as a delta so a cut step keeps what arrived.

### 10 · A stream that cannot rebuild its own answer

Found by all four: `opencode-pi 10`, `harnesses 9`, `sdks W09` and `W10`, `routers W08`.

A payload rides only on a part that has text, so a signature with empty text is lost. Deltas
carry values whose merge rule the accumulator cannot know. A frame the reader does not
recognise vanishes. Several rebuilders disagree, and an abort during reasoning makes the next
request malformed.

The plan: it rules the right property ("The closed step can be built from the deltas alone")
without the rules that make it hold.

Proposed: a closed set of delta kinds with one merge rule each; kuib's own part id on every
delta; a payload delta that can open a part; redacted reasoning as its own kind of part; one
fold shared by the path and every reader, tested at every cut point; an unknown frame kind
skipped and counted, a known kind that does not parse fails the step, a stream without its
terminal frame is cut.

### 11 · Instructions and tools live outside the conversation

Found by three: `opencode-pi 5`, `sdks W07`, `routers W10`.

pi broke every custom provider to move system text and tool declarations into the
conversation. fantasy skips a system message that follows a user or assistant message, under
"TODO: see if we need to send error here?". Portkey drops a system message that is not first
for Gemini and answers 200. LangChain needs a function to decide whether a system message may
follow the previous turn.

The plan: D016 rules that an instruction can sit anywhere. P02-I02 lists tool declarations
beside the parts, so a tool added or removed in mid-conversation has no form, and the rule for
an instruction between a tool call and its result is unstated.

Proposed: decide tool changes in mid-conversation and the rule between a call and its result
before the paper check; the placement block takes the position as input, never moves an
instruction earlier, and reports any other placement; capture a system message at four
positions.

### 12 · A format drawn against the simplest schema

Found by two: `sdks W06`, `harnesses 10`.

The AI SDK has had four provider specifications in nineteen months, with a compatibility shim
that says "TODO this could break" (`as-language-model-v3.ts:25-26`). LangChain carries three
generations of message content. Each break was forced by a provider feature the first shape
could not hold.

The plan: P02-I02 checks the shapes "against both Anthropic Messages and OpenAI chat on
paper". OpenAI chat has no reasoning to send back, so it tests the easy case.

Proposed: add OpenAI Responses and Gemini `generateContent` to the paper check for the opaque
payload, the order of parts and the delta vocabulary.

## Risks that rulings carry

Reported, not reopened.

- **D009** (partial output is sent back). opencode and pi both stopped replaying unfinished
  steps because it broke providers; an aborted turn in the AI SDK left `content: []` and "the
  conversation is bricked permanently" (#18452). The ruling stands on one fixture per kind of
  cut per format.
- **D015** (enums everywhere). A closed set of a provider's own values goes stale faster than
  the layer ships. Closed enums suit what kuib authors; what it reads from a provider needs a
  member for a value not recognised. This widens G007.
- **D004** with G007. A model enum compiled into the core creates the pressure to sniff ids
  when a new model appears before a release.
- **D005** (one format per offering). pi renamed Azure when one provider gained a second
  format.
- **D012** and the non-goals. opencode runs two runtimes behind one event vocabulary:
  features exist on one path only and typed failures are thrown away. This is a warning for
  the feature that later moves the engine.

## What was learned about MiMo (G008)

- pi moved every direct Xiaomi row from the Anthropic-compatible address to Chat Completions
  after sessions with thinking and tool calls over several turns failed (pi #4505,
  `CHANGELOG.md:1015`). Whether MiMo can be the second row of the Anthropic translation
  (P04-I03) is therefore in doubt until P01-I03 records it.
- The token-plan hosts do serve an `/anthropic` path: pi used
  `token-plan-ams.xiaomimimo.com/anthropic`.
- pi marks Xiaomi's Anthropic-format rows as taking `signature: ""` on replay; the plan's row
  says PLAIN.
- models.dev lists `mimo-v2.6-pro` under `xiaomi-token-plan-sgp` and no `mimo-v2.5-pro`
  there. kuib's `.env` and live test name `mimo-v2.5-pro`.

## Where this meets the orchestrator's own review

The review given to the owner before the research named seven problems. The research supports
six with evidence: the registry built before the translation (shape 7); promises without an
item (shapes 2, 3 and 4); one fact in two places (shape 4); authentication, framing and error
bodies filed in the wrong layer (shapes 7 and 8); identity enums in `protocol` against
"nothing is privileged" (the D004 risk); the paper check against the easy second format
(shape 12). The seventh, missing captures, grew: the reports propose about fourteen requests
beyond D017's envelope.
