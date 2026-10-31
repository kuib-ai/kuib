---
title: The worst shapes in the model layers of opencode and pi, set against the inference plan
date: 2026-10-08
origin: ["conversation 2026-10-08"]
---

# The worst shapes in the model layers of opencode and pi

Written for [[features/inference/plan]] item P06-I01. A shape is a structural choice: where a
fact lives, what a type permits, who decides. Bugs are cited as evidence of a shape. Nothing
here is a kuib decision; the last line of each shape is a proposal for the owner.

## What was read

All on 2026-10-08. Both repositories have moved; the old names redirect (HTTP 301).

| Subject | Repository and commit | Prefix used below |
|---|---|---|
| opencode, the application | `anomalyco/opencode@663fbd7` (was `sst/opencode`), 2026-10-07, under `packages/opencode/src/` | `oc:` |
| opencode, the native package and its `DESIGN.md` | same commit, under `packages/llm/` | `llm:` |
| opencode, repository root (`patches/`, `package.json`, `packages/plugin/`) | same commit | `ocr:` |
| pi, the model layer | `earendil-works/pi@1cedd32` (was `badlogic/pi-mono`), 2026-10-08, under `packages/ai/` | `pi:` |
| pi, the coding agent | same commit, under `packages/coding-agent/` | `pica:` |
| pi, the published model catalogue | npm `@earendil-works/pi-ai@1.1.0`, `dist/providers/data/*.json` (the catalogue is not in git: `earendil-works/pi@1cedd32:.gitignore:11`) | "catalogue 1.1.0" |

So `oc:session/llm.ts:316` means `anomalyco/opencode@663fbd7:packages/opencode/src/session/llm.ts:316`.

Issues are written `oc#N` for `https://github.com/anomalyco/opencode/issues/N` and `pi#N` for
`https://github.com/earendil-works/pi/issues/N`, each opened and read on 2026-10-08:
oc#16748, oc#39291, oc#22813, oc#51481, oc#24097, oc#18108, oc#37745, oc#52225, oc#23926,
oc#18099, oc#13838; pi#4505, pi#4678, pi#1870, pi#978, pi#6167, pi#10324, pi#9048, pi#7067,
pi#9508, pi#2946, pi#6445, pi#9335, pi#4342.

Read in full: `oc:session/llm.ts`, `oc:session/llm/{ai-sdk,native-runtime,native-request,request}.ts`,
`oc:session/llm/AGENTS.md`, `llm:src/protocols/anthropic-messages.ts`,
`llm:src/protocols/utils/lifecycle.ts`, `llm:src/schema/{messages,events,ids}.ts`,
`pi:src/api/transform-messages.ts`. Read in part: `oc:provider/transform.ts` (1,922 lines),
`oc:provider/provider.ts`, `oc:session/{message-v2,processor,retry}.ts`, `llm:DESIGN.md`,
`llm:src/schema/errors.ts`, `pi:src/types.ts`, `pi:src/api/anthropic-messages.ts`,
`pi:src/api/openai-completions.ts`, `pi:scripts/generate-models.ts`, `pi:CHANGELOG.md`,
`pica:docs/{models,custom-provider}.md`, the eight `ocr:patches/@ai-sdk*.patch`.

Three read-only sub-agents searched the clones (patch contents; pi's compatibility settings in
the changelog; pi's checks on ids, provider names and addresses). Every line cited from them
was reopened in the source. Where a number is a sub-agent's manual classification it says so.

CONFIRMED means the cited source or issue was read. INFERRED means reasoned from what was read.

## Worst shapes

Severity is for kuib: HIGH when the plan has the shape or leaves it open, MEDIUM when a ruling
avoids it but an item as written could bring it back, LOW when it does not apply.

### 1 · HIGH · The name of who serves a model also carries the address, the region and the contract

- **Shape:** One identifier answers "who serves it", "at which address", "under which billing
  plan" and sometimes "in which format", so a change in any of them is a new or a renamed identity.
- **Subject and axis:** pi and opencode, A.
- **Evidence (CONFIRMED):** pi's provider list has `xiaomi`, `xiaomi-token-plan-cn`,
  `xiaomi-token-plan-ams`, `xiaomi-token-plan-sgp`, three `qwen-token-plan*`, and `-cn` twins
  for zai, minimax and moonshotai (`pi:src/types.ts:43-86`). The four Xiaomi rows differ only
  in `baseUrl` (`pi:scripts/generate-models.ts:2461-2478`). Catalogue 1.1.0 holds 1,563 chat
  entries for 1,101 distinct model ids under 41 provider ids. In opencode a session's model is
  the string `provider/model` split at the first slash (`oc:provider/provider.ts:2080-2081`);
  the Bedrock slug is computed at the call from the region's prefix and a list of model-name
  substrings (`oc:provider/provider.ts:412-440`); an Anthropic slug is made by
  `replaceAll(".", "-")` on a catalogue id (`oc:provider/provider.ts:903-908`).
- **Harm:** pi shipped a breaking change when `xiaomi` moved from the Token Plan address to the
  API-billing one: "Users still on Token Plan must move to the appropriate
  `xiaomi-token-plan-*` provider and set the corresponding env var" (`pi:CHANGELOG.md:1077`).
  One missing fact about MiMo had to be repaired on all four ids (pi#4678). Azure was renamed
  from `azure-openai-responses` to `azure` "since it now serves Chat Completions as well"
  (`pi:CHANGELOG.md:47`).
- **Does kuib's plan share it:** yes. D004, D005 and P02-I01 make an offering a model, a
  provider, one slug and one format; nothing holds an address, a region, a plan or an account.
  kuib's own MiMo key belongs to `token-plan-sgp.xiaomimimo.com` while the documented Anthropic
  address is `api.xiaomimimo.com` (G008), which is pi's Xiaomi history exactly. G004 asks only
  about the word "provider".
- **What kuib should do:** Keep "provider" as who serves. Add a separate typed endpoint under a
  provider (address, region, plan, the name of the credential), make the slug a function of the
  offering and the endpoint, and decide whether a session stores the endpoint. Settle it before
  P02-I01, as a new gap beside G004.

### 2 · HIGH · Opaque reasoning data is kept with no record of what produced it

- **Shape:** A signature or ciphertext is stored beside the text as if it belonged to the
  conversation, when it belongs to one model at one endpoint; a later request decides what to
  do with it by comparing id strings.
- **Subject and axis:** opencode and pi, D.
- **Evidence (CONFIRMED):** opencode compares `providerID/modelID` as strings; when they differ
  it drops every part's provider data and turns reasoning into a text part
  (`oc:session/message-v2.ts:255,293,376-383`). pi compares provider, api and id; it drops
  redacted thinking, turns thinking into text and deletes `thoughtSignature`
  (`pi:src/api/transform-messages.ts:95-134`). pi's payload fields are single strings whose
  meaning depends on who wrote them: `textSignature` is a "legacy id string or TextSignatureV1
  JSON" (`pi:src/types.ts:401-431`). opencode's native package reads a signature from
  `part.encrypted ?? signatureFromMetadata(part.providerMetadata)` with no check of origin
  (`llm:src/protocols/anthropic-messages.ts:453`).
- **Harm:** oc#22813 (the signature is stripped "when the message was produced by a different
  model" and Anthropic rejects the request); pi#9048 (a session moved from Codex to Claude fails
  with 400 on tool ids and signatures); pi#6167, still open (thinking is inlined into the
  assistant's text "with no delimiters or control tokens", then the target's required reasoning
  field is empty); pi#7067 (a model change breaks the session in three ways); oc#18099 (opaque
  reasoning from earlier turns is sent after thinking was turned off, and the model writes
  `<thinking>` as plain text).
- **Does kuib's plan share it:** undecided. G006 leaves replay "to the engine", P02-I02 says
  only "the opaque provider payload", and D004 lets a session change provider and model.
  Nothing says the payload records the offering that produced it, or what "send reasoning back"
  does with a payload from another offering.
- **What kuib should do:** Stamp every closed step with the offering and endpoint that answered.
  Give the "send reasoning back" step the origin as an input, with two outcomes only: verbatim,
  or dropped and reported. Never turn reasoning into assistant text without saying so. Add a
  fixture: a history answered by MiMo sent to Claude, and the reverse.

### 3 · HIGH · Signed reasoning is treated as content, though it is bound to the bytes above it

- **Shape:** The layer may re-render, trim or regroup an assistant turn and the request above
  it, while the provider verifies that both are unchanged since the signature was made.
- **Subject and axis:** opencode and pi, D and I.
- **Evidence (CONFIRMED):** opencode's own words: the model "binds each thinking signature to
  the system prompt, tool list, and messages above it … opencode re-renders parts of that
  prefix between turns (system prompt, tools, compaction), so ask the API to drop the affected
  blocks instead of failing the request" (`oc:provider/transform.ts:703-709`). The control is
  sent through a patched SDK (`ocr:patches/@ai-sdk%2Fanthropic@3.0.111.patch:133`). An empty
  text part is rewritten to a space to keep signed blocks in position, with the note "It is
  unclear whether this shape originates in our stream processing, a proxy, or a lower-level
  library" (`oc:session/message-v2.ts:272-289`). pi decides the same control on Bedrock by
  substrings of the model id (`pi:src/api/bedrock-converse-stream.ts:798-803`).
- **Harm:** oc#16748 (dropping an empty text part between two signed blocks made Anthropic
  reject the turn); oc#39291 (compaction replayed a thinking block with empty text and its old
  signature: the same 400 "dozens of times over roughly an hour"); oc#51481 and pi#10324 (the
  Bedrock route lacked the control the Anthropic route had: "The `system` prompt differs from
  the one this block was created with").
- **Does kuib's plan share it:** partly. P05-I01 proves the unchanged round trip. D016 makes
  the prefix change by design (reasoning per step, instructions anywhere, context assembled per
  application) and its Consequences speak of the cache only. P04-I01 has no block for what
  happens to signed thinking when the request above it changed, and P01-I02 has no such capture.
- **What kuib should do:** Add a step to P04-I01, "reasoning whose prefix changed" (fail, drop
  and report, none). Keep an assistant turn's blocks verbatim and in order, including empty
  ones: no trimming and no regrouping. Add two captures to P01-I02: signed thinking in history
  with a changed system text, with and without the binding control.

### 4 · HIGH · An intent the provider cannot honour is dropped, and the only trace is a log line

- **Shape:** The translation decides alone what to do with an unsupported request, and the
  caller cannot learn what was sent in its place.
- **Subject and axis:** opencode and pi, G.
- **Evidence (CONFIRMED):** opencode's native Anthropic translation ignores a thinking request
  unless `type === "enabled"` (`llm:src/protocols/anthropic-messages.ts:493-504`), while the
  session's default for current Claude models is `{ type: "adaptive" }`
  (`oc:provider/transform.ts:726`). Cache marks beyond four are dropped with a log warning
  (`llm:src/protocols/anthropic-messages.ts:234-251,534-538`). The other runtime writes "ERROR:
  Cannot read … Inform the user." into the prompt in place of an unsupported file
  (`oc:provider/transform.ts:436-440`). pi documents options as "Providers that do not support
  this option ignore it" (`pi:src/types.ts:217,228`) and replaces images with "(image omitted:
  model does not support images)" (`pi:src/api/transform-messages.ts:12-13`).
- **Harm:** pi#9335 (changing effort rewrites the top of the request and misses the cache, and
  nothing reports it); oc#18108, still open (a tool call cut by the output limit is treated as
  an invalid tool call, "provides no truncation signal to the model", and the session loops).
  pi#9508, still open, is the opposite failure: unsupported fields are sent and the endpoint
  answers 400 or 422.
- **Does kuib's plan share it:** partly. D003 rules that a translation "reports what it did".
  P02-I02 lists parts, an ending, usage and a payload for the closed step and has no place for
  that report; P03-I03 builds the exact request without returning what was degraded. MiMo
  removes a tool choice other than automatic without saying so (engine design, MiMo section).
- **What kuib should do:** Make the report a shape in P02-I02: a list of intent and outcome
  (honoured, rendered another way, dropped), returned when the request is built, so it is known
  before sending, and kept on the closed step. Each MiMo fixture names its degradations.

### 5 · HIGH · Instructions and tool declarations sit outside the conversation, so a change in the middle has no neutral form

- **Shape:** The request has a privileged slot for the base instruction and the tools; when a
  provider lets either change mid-conversation the format has to be rebuilt around it.
- **Subject and axis:** pi and opencode, C.
- **Evidence (CONFIRMED):** pi moved the prompt and the tools into system messages of the
  transcript, with `sections`, `toolsAdded` and `toolsRemoved` (`pi:src/types.ts:519-544`). A
  system message that lands between a tool call and its results is held back and emitted after
  them (`pi:src/api/transform-messages.ts:163-166,216-221`). opencode sends a native system role
  only when the model id is exactly `claude-opus-4-8` and placement rules hold; otherwise the
  text is merged into a user turn, and a system message that would split a tool call from its
  result is an error (`llm:src/protocols/anthropic-messages.ts:356-423`).
- **Harm:** pi's change broke every custom provider: "custom providers must read them with
  `getCurrentSystemPrompt()` and `getCurrentTools()`" (`pi:CHANGELOG.md:200`). opencode's
  rewrite already carries a gate on one exact model id.
- **Does kuib's plan share it:** partly. D016 lets an instruction sit anywhere, but P02-I02
  still names "base instructions, tool declarations, the ordered parts" as three things. A tool
  added or removed mid-conversation cannot be expressed, and what a translation does with an
  instruction between a tool call and its result is unstated.
- **What kuib should do:** Decide before P02-I02 whether tool declarations may change inside
  the ordered parts or are fixed per step. State the rule for an instruction between a call and
  its result (an error, or moved and reported). Add that capture to P01-I02.

### 6 · HIGH · A closed set of endings with no place for the provider's own reason

- **Shape:** Provider stop reasons are mapped onto a small fixed set; a value outside the map
  throws or collapses, and the original is not kept.
- **Subject and axis:** pi and opencode, F.
- **Evidence (CONFIRMED):** pi throws on an unknown reason, under a comment that says "Handle
  unknown stop reasons gracefully" (`pi:src/api/anthropic-messages.ts:1635-1637`); a refusal
  becomes `error` and `pause_turn` becomes `stop` (`pi:src/api/anthropic-messages.ts:1624-1630`);
  errored messages are skipped on replay (`pi:src/api/transform-messages.ts:201`), so a refusal
  leaves the history. opencode has six finish reasons (`llm:src/schema/ids.ts:39`), maps
  `pause_turn` to `stop`, `refusal` to `content-filter` and the rest to `unknown`, and keeps no
  raw value (`llm:src/protocols/anthropic-messages.ts:558-564`).
- **Harm:** pi#978 (Claude began returning `sensitive`: "Error: Unhandled stop reason:
  sensitive"); pi#1870 (`model_context_window_exceeded` crashed frameworks built on pi, which
  added their own workarounds); oc#18108.
- **Does kuib's plan share it:** partly. D013's five endings describe the step, and the
  complete-or-cut mark of D009 covers truncation. P02-I02 has no field for the provider's raw
  reason and no place for "stopped to call tools", "paused, send again" or "refused". MiMo adds
  `content_filter` and `repetition_truncation` (engine design, MiMo section).
- **What kuib should do:** Keep the five endings. Carry the raw reason as text on every closed
  step, plus a second small enum for why the model stopped that has an explicit "unknown"
  member. Rule: an unknown reason never throws and never becomes "failed".

### 7 · HIGH · Usage that cannot say "not reported" and is lost when a step does not finish

- **Shape:** Token counts are numbers that arrive with the final event, so an absent count
  reads as zero and an unfinished step has none.
- **Subject and axis:** opencode and pi, F.
- **Evidence (CONFIRMED):** pi's `Usage` is required numbers, with cost computed inside it
  (`pi:src/types.ts:433-454`). opencode's native counts are optional
  (`llm:src/schema/events.ts:51-60`) but arrive only on the step's finish, and the session
  substitutes `new Usage({})` when none came (`oc:session/processor.ts:452-459`).
- **Harm:** oc#37745, still open (OpenAI cache writes are shown as 0 since they became
  billable); pi#6445 (a failed or aborted run records all-zero usage: "tokens already consumed
  are dropped").
- **Does kuib's plan share it:** undecided. P02-I02 says "usage including cache read and
  write". MiMo reports no cache-write count (engine design, MiMo section). Nothing says a cut
  step keeps the usage that had arrived, or that "unknown" differs from zero.
- **What kuib should do:** In P02-I02 a count is absent when the provider did not report it,
  and usage is a delta, so a cut step holds what arrived. P04-I02 asserts usage on a fixture
  cut after its first frame.

### 8 · MEDIUM · Compatibility as a growing bag of optional flags, with defaults guessed from the address

- **Shape:** Each difference between endpoints becomes an optional field on a per-format
  record; the field's default is derived from the provider's name or the host in the address.
- **Subject and axis:** pi, B.
- **Evidence (CONFIRMED):** 52 fields in five interfaces: 27 for Chat Completions, 10 for
  Responses, 13 for Anthropic Messages, one each for Bedrock and Mistral
  (`pi:src/types.ts:810-988`). It began with four on 2025-12-09 (`pi:CHANGELOG.md:2266`). In
  catalogue 1.1.0, 1,305 of 1,563 chat entries carry a `compat` object. Defaults come from
  `detectCompat`, "Auto-detect compatibility settings from provider name and baseUrl"
  (`pi:src/api/openai-completions.ts:1589-1690`); the generator holds a second copy that already
  differs (`pi:scripts/generate-models.ts:749-750` against `pi:src/api/openai-completions.ts:1642`).
  One field has opposite defaults in APIs that share its interface: `?? true`
  (`pi:src/api/openai-codex-responses.ts:537`) and `?? false` (`pi:src/api/openai-responses.ts:88`).
  Fields carry vendor names: `zaiToolStream`, `vllmPriority`, `openRouterRouting`, and a
  `thinkingFormat` whose eleven values are mostly vendors (`pi:src/types.ts:832-886`).
- **Harm:** pi#4678 (the four built-in MiMo providers shipped without the needed flag: 400 on
  the second turn); pi#2946 (a flag was ignored for reasoning models: 400). Two flags were
  removed with breaking changes, a boolean for an enum (`pi:CHANGELOG.md:625`) and
  `compat.reasoningEffortMap` for a field on the model (`pi:CHANGELOG.md:1096`).
- **Does kuib's plan share it:** partly. D006 and D015 avoid it. P02-I01's "a block typed per
  format" on the offering is the same slot as pi's `compat` typed per API; a switch with a
  default, or a variant named after a vendor, brings the bag back.
- **What kuib should do:** Every step is a required choice in every row, so a row that omits
  one does not compile. Variants are named for the behaviour. The per-format block holds values
  only (a budget, a header value), never a switch. Write that into P02-I01's acceptance.

### 9 · MEDIUM · Provider data in open records, where writer and reader agree on a key by convention

- **Shape:** A map keyed by provider name carries whatever a translation needs back; nothing
  types the key or the value, so each reader guesses.
- **Subject and axis:** opencode, D and C.
- **Evidence (CONFIRMED):** Three open records on parts and messages: `metadata`,
  `providerMetadata`, `native` (`llm:src/schema/messages.ts:25-31,183-189`). The stored key is
  renamed from the provider id to the SDK's key at send time (`oc:provider/transform.ts:486-499`)
  through a table of 25 package names (`oc:provider/transform.ts:42-98`). One cache marker is
  written under six keys at once (`oc:provider/transform.ts:362-381`); Azure options under two
  (`oc:provider/transform.ts:1472-1477`). Continuation data has two homes
  (`oc:session/llm/native-request.ts:45-48`). Two spellings of one key are accepted
  (`llm:src/protocols/anthropic-messages.ts:497-500`). The whole record is dropped when one entry
  fails the schema (`oc:session/llm/ai-sdk.ts:26-29`).
- **Harm:** oc#23926 (Bedrock Claude thinking was rewritten into
  `providerOptions.openaiCompatible[...]`: "thinking.signature: Field required"); oc#18099. The
  maintainers' redesign replaces `providerOptions: { openai: ... }` with "Model-typed
  `provider: ...`" (`llm:DESIGN.md:1088`).
- **Does kuib's plan share it:** no, by D011. P02-I02's "the opaque provider payload" and
  G006's "on any model-authored part" could still be written as an untyped value.
- **What kuib should do:** The payload is a union keyed by format with named fields (signature,
  redacted data, item id, encrypted content). No map keyed by a provider's name in `protocol`.

### 10 · MEDIUM · The stream attaches a payload only to a part that has text, and yields a result only after a final event

- **Shape:** The delta vocabulary is built around visible text; opaque data and unfinished
  parts have no delta of their own.
- **Subject and axis:** opencode and pi, E.
- **Evidence (CONFIRMED):** opencode's native translation emits a signature through
  `reasoningEnd`, which does nothing unless a text delta opened the part
  (`llm:src/protocols/anthropic-messages.ts:686,717,728-742`,
  `llm:src/protocols/utils/lifecycle.ts:51-57`): a thinking block with empty text and a
  signature loses the signature. `redacted` does not occur in `llm:src/protocols/`. A response
  exists only after a finish or an error event (`llm:src/schema/events.ts:594-602`), and tool
  input in flight never becomes content (`llm:src/schema/events.ts:526-529`). pi's events share
  one mutable `partial`, "not an event-time snapshot", and no event carries a signature
  (`pi:src/types.ts:781-804`).
- **Harm:** oc#39291; oc#52225, which describes an earlier fix for "unsigned reasoning blocks
  left behind by a stream that died mid-thinking". pi broke custom stream functions in 1.1.0
  (`pi:CHANGELOG.md:9`).
- **Does kuib's plan share it:** no. P04-I02 names both cases. P02-I02 has not drawn the deltas
  yet.
- **What kuib should do:** Add to P02-I02's acceptance: a payload delta can open a part by
  itself; redacted reasoning is its own kind of part; a delta is a plain value with no shared
  object.

### 11 · MEDIUM · Both stopped sending unfinished steps back, because it broke providers (a risk D009 carries)

- **Shape:** Whether a cut step may be replayed is decided once for all providers.
- **Subject and axis:** pi and opencode, E.
- **Evidence (CONFIRMED):** pi: "Skip errored/aborted assistant messages entirely … Replaying
  them can cause API errors (e.g., OpenAI "reasoning without following item")"
  (`pi:src/api/transform-messages.ts:195-203`); unsigned thinking from an aborted stream is sent
  as text (`pi:src/api/anthropic-messages.ts:1416-1431`). opencode skips an assistant message
  that has an error unless it was aborted and holds something besides reasoning
  (`oc:session/message-v2.ts:258-266`).
- **Harm:** oc#52225; pi#6445.
- **Does kuib's plan share it:** D009 rules the opposite, and the engine design's table says
  what goes back per kind of cut. G009 is untested. The risk is that the table is true for one
  format only.
- **What kuib should do:** One fixture per row of that table: add "cut during thinking" and
  "cut during tool input" to P01-I02. What a translation withholds appears in the report of
  shape 4.

### 12 · MEDIUM · Closed sets of a provider's own values go stale faster than the layer ships (a risk D015 carries)

- **Shape:** The layer validates a provider's vocabulary against a list compiled into it.
- **Subject and axis:** opencode, B and J.
- **Evidence (CONFIRMED):** Three of opencode's patches turn a closed `reasoningEffort` enum
  into a string (`ocr:patches/@ai-sdk%2Fgroq@3.0.31.patch:47-48`,
  `ocr:patches/@ai-sdk%2Fxai@3.0.139.patch:93-94`,
  `ocr:patches/@ai-sdk%2Fmistral@3.0.51.patch:75-77`); a fourth removes a per-model gate on
  `serviceTier` (`ocr:patches/@ai-sdk%2Fopenai@3.0.88.patch:9-12`). opencode's native package
  keeps a closed list of efforts (`llm:src/schema/ids.ts:29`). pi holds the mapping as data:
  `thinkingLevelMap`, a neutral level to the provider's string or null (`pi:src/types.ts:91,1144`).
- **Harm:** Eight provider packages are patched (`ocr:package.json:148-168`), and "Bumping the
  dependency without regenerating the patch … the runtime silently loses whatever the patch
  fixed" (`ocr:packages/opencode/test/patched-dependencies.test.ts:4-8`).
- **Does kuib's plan share it:** D015 rules "enums everywhere". The risk is applying it to a
  provider's words: effort values, beta names, stop reasons, service tiers.
- **What kuib should do:** Enums for kuib's own concepts and switches. A provider's values are
  data in the offering's row, so a new value is a row edit or a plugin's row, not a core
  release. Say so in P02-I01 and in G007.

### 13 · MEDIUM · Two runtimes behind one event vocabulary (a risk D012 and the non-goals carry)

- **Shape:** The new layer runs beside the old one, chosen per request, and the old one's
  stream is adapted into the new events.
- **Subject and axis:** opencode, J.
- **Evidence (CONFIRMED):** The native path is chosen by provider id and package name
  (`oc:session/llm/native-runtime.ts:55-59`) and still consumes messages shaped for the AI SDK
  and the same transform (`oc:session/llm/native-runtime.ts:94,100`). Present on the AI SDK path
  only: tool-call repair (`oc:session/llm.ts:296-312`), telemetry (`oc:session/llm.ts:344-352`),
  adaptive thinking and the binding control (`oc:provider/transform.ts:711-739`), the list of
  dropped thinking blocks (`oc:session/processor.ts:441-443`). Present on the native path only:
  typed failures (`llm:src/schema/errors.ts:34-190`), which the session discards: a provider
  error event becomes `throw new Error(value.message)` (`oc:session/processor.ts:421-422`),
  `fromError` knows only the AI SDK's error classes (`oc:session/message-v2.ts:619-747`), and
  retry falls back to patterns on the message text (`oc:session/retry.ts:148-154`).
- **Harm (INFERRED from the source; no issue naming the native runtime was found):** the native
  path stays opt-in for three providers (`oc:session/llm/AGENTS.md:85-90`), and its package is
  already marked for a "clean break; do not preserve compatibility aliases" (`llm:DESIGN.md:8-14`).
- **Does kuib's plan share it:** partly. The engine stays on the AI SDK until a later feature
  (non-goals), and G005 and G010 keep two word pairs and two identity shapes side by side.
- **What kuib should do:** When the engine moves: no adapter from the AI SDK stream into the
  new deltas, one offering at a time with no fallback per request, and the engine reads the new
  failure kinds from the first day. Record it on the feature that wires the engine.

### 14 · MEDIUM · Behaviour decided by substrings of ids, because the facts live in someone else's catalogue (a risk D004 carries)

- **Shape:** The model list comes from outside; what the list does not say is recovered by
  testing the text of ids, package names and addresses.
- **Subject and axis:** opencode and pi, B and H.
- **Evidence (CONFIRMED):** 271 lines of `oc:provider/transform.ts` test a model id, a provider
  id or a package name (table under "Per subject"). The rewrite has three already
  (`llm:src/protocols/anthropic-messages.ts:356`, `llm:src/providers/github-copilot.ts:19-24`,
  `llm:src/providers/openai-options.ts:49,60`). pi has 120 such string tests at run time and
  about 310 more, by a sub-agent's count, in `pi:scripts/generate-models.ts`, which fetches
  four catalogues at build time (`pi:scripts/generate-models.ts:1295,1315,1365,1744`).
- **Harm:** oc#24097 (a user had to rename the model key to `deepseek-reasoner` to get the
  reasoning behaviour); oc#23926; pi's fix "moving built-in adaptive-thinking selection out of
  provider id substring checks" (`pi:CHANGELOG.md:979`).
- **Does kuib's plan share it:** no, by D004, D006 and P04-I03. A model enum compiled into the
  core (G007) means a model released today needs a release or a plugin, and that pressure is
  what produced the substring tests in both subjects.
- **What kuib should do:** Decide in G007 how a row for an unknown model is added without a
  core release. State in P03-I01 that nothing in `inference` reads the text of a slug.

### 15 · LOW · A vendor's client library underneath brings behaviour the layer did not ask for

- **Shape:** The layer builds parameters and a vendor library builds the HTTP request.
- **Subject and axis:** pi, I and J.
- **Evidence (CONFIRMED):** pi depends on four vendor libraries (`pi:package.json:69-80`) and
  sends through `client.beta.messages.create(params, requestOptions).asResponse()`
  (`pi:src/api/anthropic-messages.ts:650`). A token is recognised by its text and tools are
  renamed to another product's names (`pi:src/api/anthropic-messages.ts:124,979,1443`).
- **Harm:** pi#4342 (the library read `ANTHROPIC_AUTH_TOKEN` from the environment and sent it
  beside the Xiaomi key: 401).
- **Does kuib's plan share it:** no. P03-I02 uses `fetch` only and authentication is a block.
- **What kuib should do:** Nothing new. The fixtures of P04-I01 already prove the headers byte
  for byte; keep credentials out of every ambient source.

## Per subject

### opencode

**A. Identity.** A model is `provider/model`, split at the first slash
(`oc:provider/provider.ts:2080-2081`); each assistant message stores both ids
(`oc:session/message-v2.ts:255`). Slugs come from models.dev and are repaired in code: region
prefixes for Bedrock (`oc:provider/provider.ts:412-440`), dots to dashes for Anthropic
(`oc:provider/provider.ts:903-908`). Thinking and speed are "variants": named bags of provider
options typed `Record<string, Record<string, any>>` (`oc:provider/provider.ts:1142`). In the
native package ids are branded strings (`llm:src/schema/ids.ts:14-18`).

**B. Differences.** In code, by text. `oc:provider/transform.ts`, 271 lines with a test on a
model id, a provider id or a package name (search: the union of the patterns in the task log,
grouped by line range):

| What the tests decide | Lines | Data that would replace them |
|---|---|---|
| How reasoning is asked for: accepted efforts, budget or effort or toggle (577-1218, 1781-1922) | 146 | The offering's choice for "ask for reasoning" and its list of values |
| Request defaults: store, thinking on, cache key, verbosity (1220-1413) | 49 | Values on the offering |
| The key under which options are filed (42-98, 1415-1479) | 32 | Nothing: an artefact of open records |
| Sampling defaults (530-575) | 18 | Values on the offering |
| Cache marks and key renaming (358-518) | 13 | The offering's choice for "place cache marks" |
| Tool-call id rules, empty content, required reasoning field (101-356) | 7 | Limits on the offering |
| Tool schema rewriting (1481-1780) | 6 | A schema dialect per format |

By kind, counting lines: 96 test a model id, 22 a provider id, 57 a package name, and 103
`case` arms are keyed on a package name. Other files: `oc:provider/provider.ts` 36 lines,
`oc:session/system.ts` 10, `oc:session/llm/request.ts` 8, `oc:session/message-v2.ts` 8,
`oc:session/llm/native-request.ts` 7, `oc:session/llm/native-runtime.ts` 4. The native package
has three sites (shape 14).

**C. What is asked.** The native request keeps `system` apart from `messages`, with a `system`
role inside messages too (`llm:src/schema/messages.ts:271-284`). Tool choice is neutral: auto,
none, required, tool (`llm:src/schema/messages.ts:241-244`). Cache intent is neutral. Reasoning
intent is not: it is read from `providerOptions.anthropic.thinking`
(`llm:src/protocols/anthropic-messages.ts:491-504`). The output limit defaults to 4096 when the
model record has none (`llm:src/protocols/anthropic-messages.ts:510`).

**D. Opaque provider data.** In open records, shape 9. Keys the native package writes and
reads: `anthropic.signature`, `anthropic.blockType`, `anthropic.stopSequence`
(`llm:src/protocols/anthropic-messages.ts:255-259,644,789`), `openai.itemId`,
`openai.reasoningEncryptedContent` (`llm:src/protocols/openai-responses.ts:285-297,642`),
`google.thoughtSignature` (`llm:src/protocols/gemini.ts:193-196`), `bedrock.signature`
(`llm:src/protocols/bedrock-converse.ts:255-256`). Keys the application reads:
`anthropic.signature`, `anthropic.redactedData` (`oc:provider/transform.ts:185-186`),
`anthropic.inputTransformations` (`oc:session/processor.ts:441-443`), written only by the
patched SDK (`ocr:patches/@ai-sdk%2Fanthropic@3.0.111.patch:142,168`). Item ids are stripped
before sending unless `store` is set (`oc:provider/transform.ts:501-515`). On a model change:
shape 2.

**E. The stream.** Sixteen event kinds (`llm:src/schema/events.ts:209-226`). The final message
can be folded from events, but only after a terminal one (shape 10). Unknown frame kinds are
ignored (`llm:src/protocols/anthropic-messages.ts:821`). An error frame becomes an event with a
message and one optional classification, and no finish follows
(`llm:src/protocols/anthropic-messages.ts:804-812`). The AI SDK adapter emits nothing on abort
(`oc:session/llm/ai-sdk.ts:270-275`).

**F. Endings, usage, errors.** Six finish reasons, raw value lost (shape 6). Usage has
inclusive totals and a breakdown that does not overlap (`llm:src/schema/events.ts:8-60`).
Failures: shape 13. The session owns retries; the SDK is called with `maxRetries: 0`
(`oc:session/llm.ts:323`).

**G. Unsupported features.** Mixed: a typed error for content a format cannot carry
(`llm:src/protocols/anthropic-messages.ts:436,465`), a log line for cache marks, silence for
adaptive thinking, and an instruction to the model for unreadable files (shape 4).

**H. Extension.** Plugins are hooks that mutate an `output` object: `chat.params`,
`chat.headers`, `experimental.chat.system.transform` and others
(`ocr:packages/plugin/src/index.ts:234-334`); after the system hook the application re-joins
the text to keep two parts (`oc:session/llm/request.ts:68-78`). A custom provider is a config
entry naming an AI SDK package (the config in oc#24097). Built-ins are privileged: the native
gate names three providers (`oc:session/llm/native-runtime.ts:55-59`).

**I. Control of the bytes.** On the AI SDK path there is none, which is why eight packages are
patched. The native package compiles a request without sending it, with the body typed
`unknown` (`llm:src/schema/events.ts:297-304`). Tools are sorted by name before sending
(`oc:session/llm/request.ts:184`). The application re-renders the prefix between turns by its
own account (`oc:provider/transform.ts:703-706`). Raw overrides are planned as an overlay of
headers, query and body (`llm:DESIGN.md:780-803`).

**J. Evolution and cost.** The native package is to be replaced by a "clean break"
(`llm:DESIGN.md:8-14`); the table of what changes names open options, the single error wrapper
and the single event union (`llm:DESIGN.md:1071-1092`). Every frame is decoded through a schema
(`llm:src/route/protocol.ts:82`). Tests replay recorded HTTP for eleven route folders under
`llm:test/fixtures/recordings/`, cache behaviour included.

### pi

**A. Identity.** A model record holds `id`, `api`, `provider` and `baseUrl`
(`pi:src/types.ts:1118-1123`). Provider ids and api ids are open strings with a known subset
(`pi:src/types.ts:29,86`). Region and billing plan are provider ids (shape 1); speed is a model
id (`mimo-v2.6-pro-ultraspeed` in catalogue 1.1.0). Thinking is separate from the model: a
level per request and a per-model map to the provider's values (`pi:src/types.ts:89-91,1144`).
Each assistant message records api, provider, model and the model the provider reported
(`pi:src/types.ts:552-563`).

**B. Differences.** Compatibility settings (shape 8) plus tests on text. At run time, outside
the generated catalogue and the OAuth code: 120 string tests, of which 55 on a model id, 40 on
a provider name and 25 on an address (searches in the task log; reproduced). A sub-agent's
reading groups them into 66 decision points: 20 in `pi:src/api/openai-completions.ts`, 14 in
`pi:src/api/bedrock-converse-stream.ts`, 7 in `pi:src/api/openai-responses.ts`. The Bedrock and
Google ones have no field that could replace them: `compat` is typed `never` for Google and
has one field for Bedrock (`pi:src/types.ts:979-982,1154-1164`).

How many catalogue 1.1.0 entries set each setting (of 1,563; script
`count-compat.mjs`, task log):

| Format | Setting: entries |
|---|---|
| Chat Completions (719 entries) | `supportsStrictMode` 699 · `supportsDeveloperRole` 582 · `thinkingFormat` 527 (385 `openrouter`) · `sendSessionAffinityHeaders` 451 · `supportsStore` 232 · `supportsReasoningEffort` 156 · `maxTokensField` 149 · `supportsLongCacheRetention` 113 · `requiresReasoningContentOnAssistantMessages` 47 · `supportsMidConvoSystemMessages` 26 · `supportsUsageInStreaming` 22 · `cacheControlFormat` 19 · `zaiToolStream` 11 · `chatTemplateArgs` 10 · `supportsMidConvoToolAdditions` 6 · twelve fields in no entry |
| Anthropic Messages (355) | `allowEmptySignature` 270 · `forceAdaptiveThinking` 81 · `supportsTemperature` 38 · `sendSessionAffinityHeaders` 27 · `supportsMidConvoSystemMessages` 20 · `supportsStrictTools` 17 · `supportsEagerToolInputStreaming` 15 · `supportsCacheControlOnTools` 14 · `supportsLongCacheRetention` 14 · `supportsMidConvoEffort` 9 · `supportsMidConvoToolChanges` 7 · `allowedFallbackModels` 1 · `sessionAffinityFormat` 0 |
| Responses, three APIs (185) | `supportsOpenAIGrammarTools` 112 · `supportsStrictMode` 69 · `supportsMidConvoSystemMessages` 42 · `supportsAdditionalTools` 41 · `sessionAffinityFormat` 36 · `supportsToolSearch` 19 · `supportsExplicitPromptCacheMode` 9 · `supportsLongCacheRetention` 4 · `supportsDeveloperRole` 0 · `supportsMaxOutputTokens` 0 |
| Bedrock (193) | `supportsStrictMode` 95 |
| Mistral (40) | `supportsMidConvoSystemMessages` 0 |

One Responses entry sets `supportsReasoningEffort`, which its interface does not declare
(`pi:src/types.ts:890-911`).

Added after a bug report, each read in the changelog: `thinkingFormat`
(`pi:CHANGELOG.md:1936`), `requiresReasoningContentOnAssistantMessages` (`pi:CHANGELOG.md:1198`),
`cacheControlFormat` (`pi:CHANGELOG.md:1262`), `sendSessionAffinityHeaders`
(`pi:CHANGELOG.md:1260`), `supportsLongCacheRetention` (`pi:CHANGELOG.md:1213`),
`supportsEagerToolInputStreaming` (`pi:CHANGELOG.md:1215`), `forceAdaptiveThinking`
(`pi:CHANGELOG.md:979`), `allowEmptySignature` (`pi:CHANGELOG.md:956`), and `supportsDeveloperRole`
for Responses (`pi:CHANGELOG.md:908`). A sub-agent's full pass: of 27 settings whose
introducing entry names them, 10 sit under "Fixed" and 5 more cite an issue; 22 of the 52 have
no entry that names them.

**C. What is asked.** System messages are part of the transcript and can replace named sections
and add or remove tools (`pi:src/types.ts:519-544`). The neutral tool choice has two values,
`"auto" | "none"` (`pi:src/types.ts:88`). Cache intent is a retention level
(`pi:src/types.ts:220-224`). Reasoning is one of six levels plus budgets
(`pi:src/types.ts:89,356-364`). Three open records pass through: `samplingParams`, `metadata`
("Providers extract the fields they understand and ignore the rest") and the options type
itself (`pi:src/types.ts:207-213,238-245`).

**D. Opaque provider data.** Typed fields on the parts: `textSignature`, `thinkingSignature`,
`redacted`, `thoughtSignature` (`pi:src/types.ts:401-431`). The type is closed and the content
is not (shape 2). On a model change: thinking becomes text, redacted thinking and Google's
signatures are dropped, tool-call ids are rewritten by a callback per API
(`pi:src/api/transform-messages.ts:95-145`). Unsigned thinking for the same model is sent as
text unless the model is marked `allowEmptySignature` (`pi:src/api/anthropic-messages.ts:1416-1431`).

**E. The stream.** Twelve event kinds; every one carries the shared `partial`, and the final
message arrives whole on `done` or `error` (`pi:src/types.ts:773-804`). A cut yields an
assistant message with what arrived and a stop reason of `aborted`; that message is then left
out of later requests (shape 11). An observer receives raw provider frames typed `unknown`
(`pi:src/types.ts:200-204`).

**F. Endings, usage, errors.** Seven stop reasons, with the raw one kept beside them
(`pi:src/types.ts:456,569`); an unknown one throws (shape 6). Usage has required numbers and a
cost (`pi:src/types.ts:433-454`). A failure is an assistant message with `stopReason: "error"`
and a text (`pi:src/types.ts:372-376`); context overflow is recognised by 28 patterns in two
lists on that text (`pi:src/utils/overflow.ts:37,76`).

**G. Unsupported features.** Ignored without a report for options, replaced by a placeholder
for images, folded into the leading system text for mid-conversation instructions (shape 4).

**H. Extension.** A ladder, smallest first: a `models.json` entry, a provider extension, a
provider with its own `stream` (`pica:docs/custom-provider.md:7-16`). Extensions are trusted
code in the process (`pica:docs/custom-provider.md:5`). The docs warn that settings "should
describe verified differences" (`pica:docs/models.md:127`). The interface for a custom stream
broke twice in three weeks (`pi:CHANGELOG.md:9,200`).

**I. Control of the bytes.** A callback may inspect or replace the payload, typed `unknown`
(`pi:src/types.ts:155-159`). The HTTP request is built by a vendor library (shape 15). A
placeholder tool is declared from the first request so that later tool changes keep the cache:
"measured: full miss without it" (`pi:src/api/anthropic-messages.ts:196-209`).

**J. Evolution and cost.** 214 versions, 27 with a "Breaking Changes" section, 485 "Fixed"
bullets against 234 "Added" (counted over `pi:CHANGELOG.md`). The global registry was replaced
by explicit collections (`pi:CHANGELOG.md:738`). The model catalogue is fetched at build time
and is not in git. Tests use mocks and a fake provider (`pi:src/providers/faux.ts`); no recorded
provider traffic is in the repository (`pi:test/data/` holds one image).

**MiMo, as pi found it.** Bearing on G008 and P01-I03. pi first served MiMo through the
Anthropic-compatible address, then moved every direct Xiaomi row to Chat Completions, "restoring
multi-turn thinking/tool-call sessions" (`pi:CHANGELOG.md:1015`, pi#4505), with
`requiresReasoningContentOnAssistantMessages` and `thinkingFormat: "deepseek"`
(`pi:scripts/generate-models.ts:2457-2460`, pi#4678). For Anthropic-format rows its generator
marks Xiaomi `allowEmptySignature`, that is, thinking sent back with `signature: ""`
(`pi:scripts/generate-models.ts:1243-1245`). The plan's row says "send reasoning back: PLAIN".

## What they do that this plan lacks

1. **A last-resort override of the built request.** opencode plans an overlay of headers, query
   and body that can be stored (`llm:DESIGN.md:780-803`); pi has a payload callback
   (`pi:src/types.ts:155-159`). The plan lets the request be inspected and says nothing about
   changing it when a provider ships a field before a block exists.
2. **The model the provider says it served.** pi records `responseModel` when it differs from
   the one asked for, and the provider's own effort value (`pi:src/types.ts:558-561`).
3. **A budget for cache marks.** opencode spends Anthropic's four marks in the order the cache
   invalidates (tools, system, messages) and counts the ones it could not place
   (`llm:src/protocols/anthropic-messages.ts:234-251,511-514`).
4. **Measures that keep the prefix still.** opencode sorts tools by name
   (`oc:session/llm/request.ts:184`); pi declares a placeholder tool from the first request
   (`pi:src/api/anthropic-messages.ts:196-209`).
5. **A stated rule for what the token counts include.** opencode fixes inclusive totals and a
   breakdown that does not overlap, with the arithmetic per provider
   (`llm:src/schema/events.ts:8-50`).

## Unverified leads

- opencode retries the whole stream (`oc:session/processor.ts:674-688`). Whether parts written
  before a failure in mid-stream are duplicated by the retry was not traced.
- The native package says usage metadata "always carries the provider's raw usage payload"
  (`llm:src/schema/events.ts:46-49`), yet stores the decoded struct of four fields
  (`llm:src/protocols/anthropic-messages.ts:173-178,586`). Whether unknown fields survive depends
  on the schema library's defaults, not checked.
- The native Anthropic translation omits tools when tool choice is "none"
  (`llm:src/protocols/anthropic-messages.ts:516`), which would change the cached prefix. Not
  measured.
- Issues seen in search results and not opened: oc#11546, oc#24190, oc#24722, oc#20698,
  oc#42935, oc#45620 (quoted inside oc#52225); pi#8166, pi#3636, pi#9502, pi#9773, pi#10267,
  pi#3208.
- No issue was found that names opencode's native runtime; the search of the tracker was by
  keyword and the GitHub API then rate-limited this address.
- pi's 66 decision points are a sub-agent's manual classification; only the raw counts of
  string tests were reproduced.
- pi's `allowEmptySignature` rule for Xiaomi may be dead for direct rows, since catalogue 1.1.0
  serves them through Chat Completions; whether MiMo's Anthropic address accepts
  `signature: ""` is for kuib's own capture.
- Whether any opencode release has made the native path the default was not checked.
