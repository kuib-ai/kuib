---
title: The worst shapes in the model layers of Codex, Crush and Goose, set against the inference plan
date: 2026-10-08
origin: ["conversation 2026-10-08"]
---

# The worst shapes in the model layers of other agent harnesses

Task `research-harnesses`, plan item P06-I02. An adversarial reading: it looks for
structural mistakes and says for each whether `journal/features/inference/plan.md` shares
it. It is not a description of these systems and does not weigh what they do well.

How it was made: three sub-agents searched the cloned sources of the primary subjects; every
line cited below as CONFIRMED was then re-read by the author at the stated commit, or, for
an issue, read in full. What rests on a sub-agent's reading alone, or on reasoning from two
sites, is marked INFERRED or sits under "Unverified leads".

## What was read

All on 2026-10-08. Sources were cloned shallowly and only read.

| Subject | Repository and commit | Also read |
|---|---|---|
| Codex | `openai/codex@e974aad` (2026-10-08), `codex-rs/` | Issues #7051 (with the maintainers' comments), #17541, #19661, #35739, #35925, #36586, #37475, #38855, #44363; discussion #7782 |
| Crush | `charmbracelet/crush@140e8cb` (2026-10-06) | Issues #1206, #1464, #1590, #1698, #1860, #2489, #2696, #3050, #3178, #3741, #3788 |
| fantasy (Crush's model layer) | `charmbracelet/fantasy@b0fadc9` (2026-10-06) | Issues #80, #177, #217, #305, #330, #406, #411 |
| catwalk (Crush's catalogue) | `charmbracelet/catwalk@8eb2a29` (2026-10-08) | Issues #258, #558 |
| Goose | `block/goose@9560429` (2026-10-07); the repository now redirects to `aaif-goose/goose` | Issues #3054, #8642, #8807, #10032, #10807, #10821, #11019, #11051, #11975, #12090, #12164 |
| Cline (secondary) | `cline/cline@ae9e1ef` (2026-10-07), `sdk/packages/llms` | |
| Roo Code (secondary) | `RooCodeInc/Roo-Code@b867ec9` (2026-05-15), `src/api` | |
| Zed (secondary) | `zed-industries/zed@dc3fb21` (2026-10-08), `crates/language_model*` | |
| Aider (secondary) | `Aider-AI/aider@5dc9490` (2026-05-22), `aider/models.py`, `aider/resources/model-settings.yml` | |
| DeepSeek (lead) | no source | `https://api-docs.deepseek.com/guides/thinking_mode/` |

Gemini CLI was not read. The secondary subjects were sampled only where a shape of a primary
subject pointed at them.

References are shortened with one prefix per repository, each standing for the commit in the
table: `codex:` is `openai/codex@e974aad:codex-rs/`, `crush:` is `charmbracelet/crush@140e8cb:`,
`fantasy:` is `charmbracelet/fantasy@b0fadc9:`, `catwalk:` is `charmbracelet/catwalk@8eb2a29:`,
`goose:` is `block/goose@9560429:`, `cline:` is `cline/cline@ae9e1ef:`, `roo:` is
`RooCodeInc/Roo-Code@b867ec9:`, `zed:` is `zed-industries/zed@dc3fb21:crates/`, `aider:` is
`Aider-AI/aider@5dc9490:`. A reference is then `prefix:path:line`.

An issue is written `codex#17541`, `crush#2489`, `fantasy#406`, `catwalk#558` or
`goose#12090` and stands for `https://github.com/<owner>/<repo>/issues/<n>` in that
subject's repository (Goose's under `aaif-goose/goose`), read through the GitHub API or the
page itself on 2026-10-08.

## Worst shapes

The brief's four questions, in one line each; the shapes carry the evidence.

- What broke when a second provider arrived: for Codex, which stores OpenAI's own items, the
  second protocol was removed and other vendors must imitate the first (shape 14); for Crush
  and Goose, which store their own shape, the second provider's opaque state had no slot and
  the first provider's leaked into requests to the second (shapes 1 and 10).
- A file per provider against a file per format: both are copied. Goose has nine format
  files in two crates and `async fn stream(` in thirty files, with whole functions differing
  by one identifier; fantasy's two router adapters are about 1,100 lines each and have drifted
  (shape 12; per subject, Goose J).
- What survives a cut: Codex keeps finished items and retries the request; Crush keeps the
  text, rewrites an unfinished call to `{}` and invents a result; Goose keeps what arrived
  with no mark; fantasy returns nothing for the step (shape 9).
- What a catalogue cannot express: the wire API a model speaks, which parameters it accepts,
  its reasoning dialect and levels, cache behaviour, tool support, variants and what was
  actually served; each is made up for in code by tests on names (shapes 2, 6 and 11).

Most severe for kuib first. Severity follows the brief: HIGH when the plan has the shape or
leaves it open, MEDIUM when a ruling avoids it but an item as written could bring it back,
LOW when it does not apply. "The plan" is `journal/features/inference/plan.md`. A ruled
decision is never proposed for reversal here; where a finding touches one, it is the risk
that ruling carries.

### 1. Opaque provider data is stored without saying who produced it, and is sent to whoever is asked next — HIGH

- Subjects and axis: Codex, Goose, Crush; D.
- Evidence (CONFIRMED). Codex replays `encrypted_content` and item ids verbatim
  (`codex:protocol/src/models.rs:1059`, `codex:core/src/client.rs:1073-1076`); a
  `ResponseItem` carries neither model nor provider. Goose flattens a tool request's open
  metadata map into the next provider's call (`goose:PT/formats/openai.rs:221-222,354`) and
  decides whether thinking is replayable by comparing model strings
  (`goose:PT/formats/anthropic.rs:146-159`). Crush attaches three vendors' metadata to one
  part whatever the target (`crush:internal/message/content.go:596-612`). Each target then
  improvises: drop, send as its own reasoning, or rewrite into visible text (per subject,
  Crush D).
- Harm. `codex#17541`: switching model mid-conversation fails with
  `invalid_encrypted_content`. `codex#38855`: ids minted by a custom provider (`item_…`) are
  rejected by OpenAI, which "Expected an ID that begins with 'rs'". `goose#12090`: thinking
  stored with empty text and a signature makes a session unresumable, and the earlier fix
  covered the native Anthropic provider only. `goose#10807`: a tool name stored by one
  provider exceeds Anthropic's 200 characters and every later request fails. Goose's own
  recovery leaves the poison in place: "the rejected blocks stay in the session"
  (`goose:PV/anthropic.rs:227-228`).
- kuib: **undecided**. The closed step carries "the opaque provider payload" (P02-I02) and
  the offering has a switch for how reasoning can be replayed (P02-I01), but G006 is open
  and nothing says the payload records its producer, or what a translation does with a
  payload another offering produced. D004 lets a session change provider and model, so the
  case is reachable on day one. D013 keeps a provider's tool-call id as data, and that data
  has the same problem: its form is checked by the next provider.
- What kuib should do. Record on every opaque payload the offering that produced it
  (provider, model, format). Make "send reasoning back" take the producer as an input and
  give it exactly three outcomes: replay untouched, replay as plain text, withhold; each
  reported. Treat provider ids the same way: never sent to an offering other than their
  producer, with kuib's own id rendered instead. Add one fixture pair to P01 and one case to
  P05: a tool round begun on Claude and continued on MiMo, and the reverse.

### 2. Facts about models outgrow the table, and code beside the table starts testing identities — HIGH

- Subjects and axis: Crush with catwalk, Goose, fantasy, Cline; B, H.
- Evidence (CONFIRMED). catwalk's `Model` has thirteen fields
  (`catwalk:pkg/catwalk/provider.go:91-105`); what it cannot say lives in a switch by
  provider type, then provider id, then model prefix
  (`crush:internal/agent/coordinator.go:555-582,616-623,656-662`) and in tables of model ids
  that choose the wire API (`:75-78,94-98`). fantasy has three different tests for "a
  reasoning model" in one package (per subject, Crush B). Goose's declared providers are
  JSON, yet four lists in Rust name them to pick parameters, one naming a user's provider
  (`goose:PV/openai.rs:424-448`). Cline replaced a file per provider with 22 predicate rules
  whose default fans options out to every provider key, with further rules that exist only
  to suppress it (`cline:sdk/packages/llms/src/providers/routing/provider-option-rules.ts:217-229,479-488`).
- Harm. `goose#10821`, in the maintainers' words: reasoning support is decided by "explicit
  model metadata, canonical model metadata, hard-coded model-name checks, provider-specific
  exception lists, request parameters, legacy environment variables". `crush#3741`: a new
  model fails because the test for which token parameter to send did not know its name.
  `crush#2696` against `crush#1590`: under one schema DeepSeek requires `reasoning_content`
  to be sent back and Mistral rejects it. `catwalk#558`: a row listing effort levels the
  provider does not accept breaks every request at the default.
- kuib: **partly**. D006 puts behaviour in blocks and the offering picks one variant per
  step, which is the right answer to this shape. Three things in the plan leave the door
  open. Nothing forbids a block from reading the model or provider identity (P03-I01,
  P04-I01). The five steps are already too few for what the plan's own sources record:
  MiMo "silently removes" a tool choice other than automatic
  (`journal/features/engine-foundation/research/engine-design-2026-10-07.md`, MiMo section),
  effort level sets differ per model, the effort change of D016 needs a beta header, and
  none of tool choice, level set or extra headers is a step. And variants are bare names
  (`EFFORT`, `BUDGET`), so a difference in degree (which levels, what budget range) can only
  become a new variant or a test on the model.
- What kuib should do. Give a block only its own parameters and the neutral request, never
  the identity, and make that a type-level fact plus a lint rule: no comparison on the model
  or provider enum outside the registry. Let a variant carry parameters in the row
  (`EFFORT { levels }`, `BUDGET { min, max }`). Validate a row when it is registered, with
  each block declaring what it requires of the others. Before P04, list the steps from the
  fixtures, not from memory: tool choice, output limit, extra headers and stop sequences are
  missing from the picture in `research/structure-and-names-2026-10-08.md`.

### 3. An intent the provider cannot uphold is dropped or overwritten in silence, and where a report exists nobody reads it — HIGH

- Subjects and axis: Goose, fantasy with Crush, Codex; G.
- Evidence (CONFIRMED). Goose overwrites the caller's temperature with 2
  (`goose:PT/formats/databricks.rs:324`) and turns invalid tool arguments into `{}` before
  running the call (`goose:PT/formats/openai_responses.rs:882-885`). fantasy does return
  typed warnings (`fantasy:model.go:251-257`), and Crush logs one field of them and moves on
  (`crush:internal/agent/agent.go:1041-1042`). fantasy skips a non-leading system message
  with a TODO and no warning (`fantasy:providers/anthropic/anthropic.go:905-908`). Codex
  drops verbosity with a log line (`codex:core/src/client.rs:1019-1029`).
- Harm. `fantasy#177`: "no tools" was never sent to Anthropic, so the model went on calling
  tools, "the opposite of the intended behavior". `crush#3050`: a provider rejects a
  conversation with "System message must be at the beginning".
- kuib: **yes, as written**. D003 rules that a request does not fail for a missing feature
  and that the translation "reports what it did". No item gives that report a shape or a
  place: P02-I02 lists the parts, the ending, usage and the opaque payload, and P03-I03
  builds a request and returns it. The risk D003 carries is the one `fantasy#177` shows: a
  caller that asked for a forced or forbidden tool call acts on an answer that was produced
  without it.
- What kuib should do. Define the report in `protocol` as a typed list (which intent, what
  was rendered instead, why), returned by "build the exact request" and emitted as the first
  delta, so the closed step keeps it. That keeps D003 intact and lets the engine decide
  before sending. Record in a gap whether some intents (tool choice, output limit) should be
  refusable by the caller at build time; that is the owner's call.

### 4. The ending says too little: provider stop reasons collapse into a few values, or there is no ending at all — HIGH

- Subjects and axis: Codex, Goose, fantasy with Crush; F.
- Evidence (CONFIRMED). Codex has no stop reason, only `end_turn: Option<bool>` and
  "fallback logic" (`codex:codex-api/src/common.rs:104-106`); an incomplete response becomes
  a stream error and is retried (`codex:codex-api/src/sse/responses.rs:427-434`). Goose keeps
  provider strings on the usage object and one boolean
  (`goose:PT/conversation/token_usage.rs:17`, `goose:PT/conversation/message.rs:838`), which
  the Google format never sets. fantasy maps `pause_turn` to stop and
  `model_context_window_exceeded` to length (`fantasy:providers/anthropic/anthropic.go:1304-1316`),
  and Crush's default is a value commented "Should never happen"
  (`crush:internal/message/content.go:47-48`).
- Harm. `goose#11975`: an answer holding only thinking ends the turn with no output and no
  error. `goose#11051`: a run that failed mid-stream is recorded as a success.
- kuib: **yes**. P02-I02 gives "one of five endings" (D013: completed, interrupted, failed,
  cut off by a limit, abandoned). fantasy's mapping lists nine stop reasons on this schema, two
  of them Bedrock's;
  MiMo adds `content_filter` and `repetition_truncation` (engine design, MiMo section). In
  five values, a refusal has no home, a paused turn that must be continued looks completed,
  and the output cap and the context window are one "limit" although the remedies differ
  (ask again with a higher cap; compact). The plan does not say the raw reason is kept.
- What kuib should do. Keep D013's endings as kuib's own vocabulary and add beside them the
  provider's stop reason verbatim as data, plus a neutral detail that at least separates
  output limit, context limit, refusal and paused. Write the mapping table for Anthropic and
  MiMo from the P01 fixtures and review it with the owner before P02-I02 is closed.

### 5. Failures are classified by matching English text, and several layers retry without knowing about each other — HIGH

- Subjects and axis: Goose, fantasy with Crush, Codex; F.
- Evidence (CONFIRMED). Goose detects context overflow from a list of phrases
  (`goose:PV/http_status.rs:139-149`), detects a rejected signature from words in the message
  (`goose:PT/formats/anthropic.rs:909-912`) and retries a failed request by default
  (`goose:PT/retry.rs:41,113`). fantasy keeps five vendor regexes for one condition
  (`fantasy:providers/openai/error.go:19-23`) and Crush never reads the result. Codex treats
  an unknown failure code as retryable (`codex:codex-api/src/sse/responses_error.rs:98-101`)
  and retries an unexpected status (`codex:protocol/src/error.rs:427-434`). Six retry layers
  in Goose is the sub-agent's count: INFERRED.
- Harm. `goose#11051` (above). `codex#35925`: 15 failed attempts in one session, and the
  first request after a failed one missed the cache, 11% of the uncached cost. Goose's
  signature retry repeats on every later request because the cause stays stored
  (`goose:PV/anthropic.rs:227-228`).
- kuib: **undecided**. P03-I02 puts classification in the transport ("by kind, HTTP status,
  whether a retry can help and after how long"), and the transport knows no provider. The
  conditions that matter are in the body in a format's own vocabulary (an overloaded server,
  a context overflow, a rejected signature), and one of them arrives mid-stream after a 200.
  As written, either the transport learns Anthropic's error body or someone matches text
  later. Who retries is not stated anywhere in the plan.
- What kuib should do. Split it: the transport reports transport facts (status, headers,
  cut); a "classify failure" step of the translation, a block like the others, maps the
  body and a mid-stream error frame to a neutral kind with the provider's code kept
  verbatim. Rule in the plan that the inference layer never retries and the engine is the
  single retrier. Record a rejected request and a mid-stream error among the P01 fixtures
  (P01-I02 already asks for the first).

### 6. One flat row per model at a provider, with nothing shared between rows of the same model — HIGH

- Subjects and axis: catwalk with Crush, Aider, Goose, Codex; A, J.
- Evidence (CONFIRMED). catwalk lists Claude Sonnet 4.5 in nine files under six spellings
  and fills its two cache price fields in opposite senses in two of them
  (`anthropic.json:169-170`, `opencode-zen.json:213-214`). Aider's settings file has 357
  rows, twelve of them one model under twelve provider spellings, one row twice
  (`aider:aider/resources/model-settings.yml:187-345`, duplicate at 306 and 318), and a
  second path of substring tests for names not in the file (`aider:aider/models.py:438-587`).
  Codex and Goose guess instead: longest prefix against OpenAI's catalogue
  (`codex:models-manager/src/manager.rs:865-869`), suffix stripping by regex
  (`goose:PT/canonical/name_builder.rs:7-15`).
- Harm. `catwalk#558` (wrong levels in one row). `crush#1464`: catalogue defaults are merged
  only for the selected model, so switching model loses them and Claude rejects the request.
  `goose#10032`: one global context limit overrides every model's known window.
  `goose#3054`: parsing effort out of the name breaks slugs that end in `:free`.
- kuib: **partly**. D004 and D005 rule the offering keyed by provider and model, and the
  registry returns a typed error for an unknown pair (P03-I01), so there is no guessing.
  But P02-I01 puts everything in the offering, limits included, and G004 recommends no
  family identity. With two rows nothing shows; the shape is fixed in `protocol` now and
  D011 makes later reshaping a migration.
- What kuib should do. Split facts by what they are about: the model (context window, what
  it accepts as input, whether and how it reasons) is stated once on the model identity;
  the offering holds the slug, the format, the block choices and only the limits that this
  provider changes. Keep one direction of override, offering over model, as models.dev does
  (engine design, prior art section).

### 7. Usage is one set of numbers whose meaning changes with the provider — HIGH

- Subjects and axis: fantasy with Crush, catwalk, Codex, Goose; F.
- Evidence (CONFIRMED). fantasy's input count is net of cached tokens for OpenAI and gross
  for Google (`fantasy:providers/openai/language_model_hooks.go:245-246`,
  `fantasy:providers/google/google.go:1510-1516`); Crush adds input, cache read and cache
  write assuming the first convention (`crush:internal/agent/agent.go:2072-2077`). Codex
  estimates reasoning tokens from the length of ciphertext
  (`codex:core/src/context_manager/history.rs:1053-1058`). Crush substitutes a length-based
  estimate when a provider reports all zeros (`crush:internal/agent/usage_fallback.go:18-21,171-176`).
  That Google's total is therefore double-counted in Crush is INFERRED.
- Harm. `goose#8642`: "context limit reached" on sessions that have not filled the context,
  attributed in the report to the token counter. `codex#35925`: "counters can't show cached
  vs uncached".
- kuib: **undecided**. P02-I02 says "usage including cache read and write" and no more.
  MiMo reports a cache-read count and no cache-write count (engine design, MiMo section), so
  the first second provider already differs.
- What kuib should do. Define each number once in `protocol`: input excludes cached tokens,
  cache read and cache write are separate, and each count is either a number or "not
  reported", never zero by default. Keep the provider's usage object verbatim beside it.

### 8. What is sent is not what is stored: repairs run on every request, and the prompt cache pays — MEDIUM

- Subjects and axis: Goose, Codex, Crush with fantasy; I, C.
- Evidence (CONFIRMED). Goose runs nine repair functions per request and discards their
  report (`goose:PT/conversation.rs:274-284`, `goose:G/agents/reply_parts.rs:371-377`). Codex
  fabricates `"aborted"` outputs on a copy and never stores them
  (`codex:core/src/context_manager/normalize.rs:64,142-145`). Crush rebuilds each assistant message as trimmed text,
  then reasoning, then tool calls, whatever order they arrived in
  (`crush:internal/message/content.go:592-622`).
- Harm. `goose#11019`, the maintainers: placement of volatile content is "re-decided
  independently in ~11 request-assembly paths, of which 2 have tests", with three
  provider-specific fixes before it. `codex#35925`: cache misses after the prefix changed
  (the context shrank, or was altered at a new turn) were 14% and 12% of a session's
  uncached input. `goose#12164`: a repaired history ends in an
  assistant message and a provider without prefill rejects it. `crush#2489`: Anthropic
  refuses thinking blocks that "cannot be modified". `fantasy#330`: an empty
  `reasoning_content` whose position shifts each turn makes a prefix cache re-branch.
- kuib: **partly**. The principle (the request is inspectable and building it is a pure
  function) and stored results for calls that were not run (engine design, layer 1) avoid
  the invention of content at send time. But D009 rules that "the translation decides what
  a provider accepts back", which is a filter at send time, and its output depends on the
  offering and on what follows a step. P05-I01 proves one tool round; nothing proves that
  request N is a prefix of request N+1. D016's per-step reasoning level changes the top of
  an Anthropic request, a cost the plan itself records.
- What kuib should do. Add to P05 the property Goose tests
  (`goose:crates/goose-provider-types/tests/prefix_invariance.rs:1-8`): over a recorded
  session of several steps, the bytes of each request up to its last cache mark recur in the
  next. Make rendering of a stored step independent of later steps. Put every part the
  translation withholds into the report of shape 3.

### 9. The stream cannot rebuild the answer, so there are several rebuilders and they disagree — MEDIUM

- Subjects and axis: Goose, fantasy with Crush, Codex; E.
- Evidence (CONFIRMED). Goose's delta is a whole message (`goose:PT/base.rs:332-334`); the
  sub-agent found three reassembly routines with different rules: INFERRED. fantasy returns
  an empty step on a stream error (`fantasy:agent.go:1629-1630`), so Crush rebuilds from
  callbacks, sets unfinished tool input to `"{}"` and invents a result
  (`crush:internal/agent/agent.go:1165-1169,1193-1196`). Codex discards argument deltas and
  leaves the half-streamed item unreconciled (`codex:codex-api/src/sse/responses.rs:484-492`,
  `codex:core/src/session/turn.rs:2648`).
- Harm. `crush#3788`: aborting during reasoning leaves an assistant message with no content
  and the next request is rejected. `crush#1860` and `crush#1206`: an aborted tool leaves a
  call without a result and the session cannot continue.
- kuib: **partly**. P02-I02 requires that the closed step be buildable from the deltas
  alone, and P04-I02 that a cut after any frame yields a valid closed step; that is the
  answer. P02-I03 also has the port end "with exactly one closed step". Two sources of one
  truth follow: the translation's closed step, and whatever folds the deltas when the
  process dies before the end. Nothing requires them to be the same code or to agree.
- What kuib should do. One fold, neutral and pure, owned beside the shapes; the translation
  emits deltas only and the path closes the step with that fold. Add to P04-I02: for every
  fixture and every cut point, the fold of the deltas equals the closed step.

### 10. The neutral format takes the shape of the first provider, and the second provider's state has nowhere to go — MEDIUM

- Subjects and axis: Goose, Crush, Zed; D, J.
- Evidence (CONFIRMED). Goose's neutral thinking part is `{ thinking, signature }` and
  `{ data }`, Anthropic's two blocks (`goose:PT/conversation/message.rs:232-240`); Gemini's
  signature went into a tool request's map and a Responses reasoning item has no slot
  (`goose:PT/formats/openai_responses.rs:61-66`). Crush added a field per vendor
  (`crush:internal/message/content.go:55-63`). Zed's event enum grew `Thinking { signature }`,
  `RedactedThinking`, `ReasoningDetails(serde_json::Value)` and a message-level
  `reasoning_details` (`zed:language_model_core/src/language_model_core.rs:42-69`,
  `zed:language_model_core/src/request.rs:355-361`).
- Harm. `fantasy#406`: encrypted reasoning from Responses is dropped on replay.
  `fantasy#80`: Gemini rejects a call "missing a thought_signature in functionCall parts".
  `crush#1698`: "Corrupted thought signature" ends a session.
- kuib: **partly**. D003 rules a neutral intent and P02-I02 checks the shapes "against both
  Anthropic Messages and OpenAI chat on paper". D001 and D012 build only Anthropic. OpenAI
  chat is the weakest possible second check for this shape: it has no signed or encrypted
  reasoning and no typed item ids. The cases that broke the subjects are Responses and
  Gemini.
- What kuib should do. Extend the paper check of P02-I02 to Responses (reasoning items with
  encrypted content, item ids, item order) and to Gemini (signatures on tool-call parts,
  which G006 already cites), for the opaque payload and the delta vocabulary only.

### 11. Variants of a model hide in its name or pose as separate providers — MEDIUM

- Subjects and axis: Crush with catwalk, Goose, Codex; A.
- Evidence (CONFIRMED). catwalk: thinking as a second model id, region as a second provider
  with the region in application code, a route suffix appended at call time (per subject,
  Crush A). Goose strips an effort suffix from the name and rewrites it
  (`goose:PT/model.rs:369-382`). Codex decides who a provider is from its display name
  (`codex:model-provider-info/src/lib.rs:616-618`).
- Harm. `goose#3054` (above). `codex#35739`: with a proxy in front of Azure, the confirmed
  workaround was to rename the provider to exactly "azure". Goose's own note that the type
  does not survive serialisation (`goose:G/session/session_manager.rs:870`).
- kuib: **partly**. D004 rules typed identities and derived slugs, which removes the string
  games. The plan is silent on variants: a dated snapshot against its alias, a region, a
  speed tier, a larger context window behind a header. P02-I01 as written would make each a
  new member of the model or provider enum, which is catwalk's `bedrock-europe`.
- What kuib should do. Decide in a gap, before P02-I01, which variants are identities
  (probably the snapshot), which are fields of an offering (region, tier) and which are
  per-step intent (reasoning, per D016). Record on the closed step the model the server
  reports, as Goose does (`goose:PT/conversation/message.rs:768-775`).

### 12. A second host of the same schema becomes a near-copy of the first, and the copies drift — MEDIUM

- Subjects and axis: fantasy, Goose, Roo Code; B, J.
- Evidence (CONFIRMED). fantasy's OpenRouter and Vercel adapters are 1,073 and 1,105 lines,
  one function is identical in both, and a fix for empty user messages is in one only
  (`fantasy:providers/vercel/language_model_hooks.go:798-803`,
  `fantasy:providers/openrouter/language_model_hooks.go:751`). Goose renders Claude's
  thinking request in three format files for three hosts, and they disagree on the budget
  (`goose:PT/formats/anthropic.rs:843-844`, `goose:PT/formats/databricks.rs:315`,
  `goose:GP/formats/bedrock.rs:33-58`). Roo Code has 29 handler classes in a tree
  (`roo:src/api/providers/deepseek.ts:25`, `DeepSeekHandler extends OpenAiHandler`).
- Harm. `goose#12090`: the fix for replayed thinking reached the native Anthropic path and
  "explicitly excludes Databricks", which still fails.
- kuib: **no, with a way back**. D005, D006 and D014 put one translation per format and the
  differences in blocks. The five steps of P04-I01 cover what differs between Claude and
  MiMo on the same URL shape. A host that changes the envelope (where the model is named,
  how frames are delimited, how the request is signed) has no step to vary, so it would
  arrive as a new format made by copying this one.
- What kuib should do. Name the envelope as steps of the translation now, even with one
  variant each: build the URL, frame the response, sign the request. `authenticate` is
  already one of them.

### 13. Built-in providers take a private path that an added one cannot — MEDIUM

- Subjects and axis: Crush, Goose, Codex; H.
- Evidence (CONFIRMED). Crush's per-provider reasoning dialects are a switch on provider id
  with "TODO: Allow custom providers to specify how to set this?"
  (`crush:internal/agent/coordinator.go:658-659`). Goose's Rust lists name its JSON
  providers (`goose:PV/openai.rs:424-448`). Codex reserves its built-in ids and offers one
  wire protocol (`codex:config/src/config_toml.rs:942-943`,
  `codex:model-provider-info/src/lib.rs:107-111`).
- Harm. `fantasy#217`: the OpenAI-compatible options are closed, so DeepSeek's thinking
  toggle cannot be expressed by a user of the library. `codex#36586`: a provider that is
  not OpenAI drops an item only OpenAI understands, and a sub-agent receives an empty task.
- kuib: **no, with a way back**. D007 and D008 rule one registration path and single blocks
  from plugins. G003's recommendation keeps the built-ins in folders of `inference`
  "importing only what a plugin could", which is a convention, and Goose shows what a
  convention is worth once a fix is urgent.
- What kuib should do. Enforce G003 mechanically whichever packaging is chosen: a lint rule
  that the built-in folders import only the public entry, and a test that registers the
  Anthropic translation from outside the package.

### 14. One provider's wire item is the stored truth — LOW

- Subject and axis: Codex; D, H, J.
- Evidence (CONFIRMED). `ResponseItem` is the wire item, the history and the rollout
  payload (`codex:protocol/src/models.rs:1013-1015`, `codex:history/src/rollout_payload.rs:37-38`).
  Request controls are members of it (`:1240-1245`).
- Harm. The second protocol could not be kept alive beside it. The maintainers: chat
  completions "has increasingly hampered our ability to improve Codex", "added complexity,
  introduced regressions, and increased support overhead"
  (`https://github.com/openai/codex/discussions/7782`, read 2026-10-08), after
  `codex#7051`, where the maintainers name three separate regressions of that path between
  releases 0.59 and 0.66. It is now a parse error
  (`codex:model-provider-info/src/lib.rs:130`), and every other vendor must imitate
  Responses or sit behind a bridge. `codex#44363`: because the working context and the
  durable transcript are one file of these items, a compaction rewrote two months of
  history in place.
- kuib: **no**. D002 and D003 rule a neutral format in `protocol`. It stands as the warning
  behind shapes 1 and 10: the moment the stored step is allowed to hold a provider's item
  as anything but an opaque, attributed payload, this is where it leads.

## Per subject

### Codex

- **A. Identity.** Model and provider are free strings in configuration
  (`codex:config/src/config_toml.rs:168,175`). A session's rollout stores the provider id; a
  turn stores the model and no provider (`codex:protocol/src/protocol.rs:3224,3376`). Model
  facts are found by longest prefix against a catalogue (`codex:models-manager/src/manager.rs:865-869`),
  every provider starts from OpenAI's bundled one (`:353`), a catalogue fetched from a URL is
  matched exactly instead (`:470-477`), and an unknown slug gets invented facts
  (`codex:models-manager/src/model_info.rs:99`). Who serves a model is decided by comparing
  the "Friendly display name" (`codex:model-provider-info/src/lib.rs:140-142,616-618,639-642`).
  Variants are separate values: effort, a service tier where "fast" is sent as "priority"
  (`codex:protocol/src/config_types.rs:542`). All CONFIRMED.
- **B. Differences.** No slug sniffing in the core; the differences are 47 public fields on
  `ModelInfo` (`codex:protocol/src/openai_models.rs:406-513`) and switches on who the
  provider is: 15 call sites of `.is_openai()` outside tests, Azure recognised by name or six
  URL substrings (`codex:codex-api/src/provider.rs:4-25`). One model flag,
  `use_responses_lite`, changes the shape of the request: tools leave `tools` and become an
  input item, parallel tool calls are forced off (`codex:core/src/client.rs:972-985,1058`).
  Bedrock is built by copying OpenAI entries and patching them
  (`codex:model-provider/src/amazon_bedrock/catalog.rs:131-132,167-168`). CONFIRMED.
- **C. What is asked.** The internal request type is the Responses body
  (`codex:codex-api/src/common.rs:279-304`). `tool_choice` is the string `"auto"`, `store` is
  `false`, `include` is `["reasoning.encrypted_content"]` and `reasoning` is always sent, for
  every provider (`codex:core/src/client.rs:1018,1057-1060`). Base instructions are spliced
  into `input` as an item (`:988-998`). An effort change and a compaction trigger are items
  inside the conversation (`codex:protocol/src/models.rs:1240-1245`). No limit or sampling
  parameter exists. Nothing is neutral: there is one vocabulary. CONFIRMED.
- **D. Opaque provider data.** `ResponseItem` is at once the wire item, the history and the
  rollout payload (`codex:protocol/src/models.rs:1013-1015`,
  `codex:history/src/rollout_payload.rs:37-38`). Reasoning carries `encrypted_content` and is
  replayed verbatim (`codex:protocol/src/models.rs:1059`); ids go back unless they lack a
  prefix (`codex:core/src/client.rs:1073-1076`). For a provider that is not OpenAI, a private
  metadata field and encrypted function arguments are wiped on a copy (`:999-1010`). A model
  change runs a compaction on the previous model when a catalogue hash differs
  (`codex:core/src/session/turn.rs:1336-1344`). CONFIRMED. No code drops another model's
  reasoning: INFERRED from a search of `core/src` that found none.
- **E. The stream.** Function-call argument deltas are discarded and unknown kinds ignored
  (`codex:codex-api/src/sse/responses.rs:484-500`). An item that does not deserialise is
  dropped with a debug line (`:353-359`); unparseable frames are skipped (`:573-585`). An
  incomplete response becomes a string error (`:427-434`). After a cut, finished items stay
  and the request is rebuilt from history; the half-streamed item is not reconciled
  (`codex:core/src/session/turn.rs:2648`, a TODO). The WebSocket path repeats the loop with
  different semantics. CONFIRMED except the WebSocket comparison, which is the sub-agent's
  reading and was not re-read: INFERRED.
- **F. Endings, usage, errors.** There is no stop reason; the only signal is
  `end_turn: Option<bool>`, "Some providers do not set this, so we rely on fallback logic"
  (`codex:codex-api/src/common.rs:104-106`). Usage arrives only on completion, and a
  completion event that fails to parse turns a finished response into a stream error
  (`codex:codex-api/src/sse/responses.rs:457-460`), which is retried
  (`codex:protocol/src/error.rs:427-434`). Unknown failure codes default to retry
  (`codex:codex-api/src/sse/responses_error.rs:98-101`). Context overflow is recognised by a
  code in the stream (`:48`); an HTTP 400 is matched by substring for one image error and
  otherwise passed through (`codex:codex-api/src/api_bridge.rs:172-177`). Reasoning tokens in
  the context total are guessed from ciphertext length
  (`codex:core/src/context_manager/history.rs:1053-1058`). CONFIRMED.
- **G. Unsupported features.** Verbosity is dropped with a log line
  (`codex:core/src/client.rs:1019-1029`); effort-update items are filtered out of the request
  copy (`:959-963`); `reasoning`, `include`, `prompt_cache_key` and `store` are sent whoever
  the provider is (`:1053-1069`). Nothing is reported to the caller. CONFIRMED.
- **H. Extension.** A provider is a `[model_providers.<id>]` entry; built-in ids cannot be
  overridden (`codex:config/src/config_toml.rs:942-943`). The enum of wire protocols has one
  member and `"chat"` is rejected by a hand-written deserialiser with a link to the
  deprecation notice (`codex:model-provider-info/src/lib.rs:100,107-111,130`). The
  implementation is picked by a factory that tests the display name
  (`codex:model-provider/src/provider.rs:340`). The smallest unit a third party can add is a
  host that speaks Responses. CONFIRMED.
- **I. Control of the bytes.** The stored history is not what is sent: each send fabricates
  `"aborted"` outputs for calls without one and does not persist them, and cache reuse rests
  on a constant (`codex:core/src/context_manager/normalize.rs:18,64,142-145`). The proxy's
  dump re-serialises the body (`codex:responses-api-proxy/src/dump.rs:191-197`), so it is
  not the bytes. Field order of the request is itself load-bearing
  (`codex:codex-api/src/common.rs:280-281`). CONFIRMED.
- **J. Evolution and cost.** A rollout line has no version (`codex:history/src/lib.rs:362-369`);
  compatibility is by aliases and catch-alls (`#[serde(alias = "compaction_summary")]`,
  `#[serde(other)] Other` at `codex:protocol/src/models.rs:1230,1257-1258`), and an unknown
  item is never persisted (`codex:rollout/src/policy.rs:98`). Tests build SSE by hand
  against wiremock (`codex:core/tests/common/responses.rs:753`); no recorded traffic was
  found under `core/tests`. CONFIRMED.

### Crush, fantasy and catwalk

- **A. Identity.** A provider type is one of nine strings (`catwalk:pkg/catwalk/provider.go:7-17`);
  a model is a bare string inside one provider's file with no canonical id, vendor or alias
  (`:91-105`). Claude Sonnet 4.5 is in nine catalogue files under six spellings
  (`catwalk:internal/providers/configs/anthropic.json:165`, `bedrock-europe.json:53`,
  `bedrock-united-states.json:53`, `openrouter.json:365`, `vercel.json:392`,
  `aihubmix.json:605`, `opencode-zen.json:209`, `venice.json:263`, `vertexai.json:119`).
  Variants are encoded four ways: thinking as a second model id (`aihubmix.json:623`,
  `"claude-sonnet-4-5-think"`), region as a second provider whose region sits in a Go switch
  (`crush:internal/agent/coordinator.go:1262-1265`), a route suffix appended in code
  (`:1016-1017`, `largeModelID += ":exacto"`), and effort as a setting. Resuming a session
  reads the model back from the last assistant message (`crush:internal/app/app.go:491`).
  CONFIRMED.
- **B. Differences.** They live in three layers. The application: tables of model ids that
  decide the wire API (`crush:internal/agent/coordinator.go:75-78,94-98`) and a reasoning
  switch by provider type, then provider id, then model prefix (`:555-582,616-623,656-662`).
  The library: three different tests for "a reasoning model" in one package
  (`fantasy:providers/openai/language_model.go:777-781`,
  `fantasy:providers/openai/responses_language_model.go:121-126`,
  `fantasy:providers/openai/responses_options.go:303-314`); a Google provider that returns an
  Anthropic model when the id contains "claude" (`fantasy:providers/google/google.go:166`).
  The catalogue's generators. The sub-agent counted 45 substring tests on model ids in
  fantasy and 15 prefix tests in `coordinator.go`; the counts were not re-run: INFERRED. The
  rest CONFIRMED.
- **C. What is asked.** `Call` has twelve fields and none for cache, reasoning or stop
  sequences (`fantasy:model.go:215-234`); those go through `ProviderOptions`, an open map
  keyed by provider name (`fantasy:content.go:94`), where one key holds one value: "a single
  message cannot carry both" (`fantasy:providers/openaicompat/provider_options.go:138-140`).
  Tool choice shares one string namespace with tool names (`fantasy:model.go:198-212`). The
  application places cache marks, on the system message and the last two messages, under
  three provider keys for every provider (`crush:internal/agent/agent.go:900-905,1565-1575`).
  A system message that is not at the start is skipped without a warning on Anthropic
  (`fantasy:providers/anthropic/anthropic.go:905-908`, with a TODO). CONFIRMED.
- **D. Opaque provider data.** Crush stores reasoning in a closed struct with one field per
  vendor (`crush:internal/message/content.go:55-63`). `FinishThinking` rebuilds the part
  from the text and the Anthropic signature only (`:377-386`), and it runs straight after
  the setters for Google's signature and OpenAI's data
  (`crush:internal/agent/agent.go:942-960`); that those two are erased on the first
  reasoning end is INFERRED from the two sites, not run. On replay all three vendors'
  metadata are attached whatever the target (`content.go:596-612`). What the target does:
  Anthropic drops reasoning without its own metadata with a warning
  (`fantasy:providers/anthropic/anthropic.go:1113-1119`); Responses always drops reasoning,
  its own included (`fantasy:providers/openai/responses_language_model.go:596-603`);
  OpenAI-compatible sends any reasoning text as the new model's own `reasoning_content`
  (`fantasy:providers/openaicompat/language_model_hooks.go:494-496`); OpenRouter rewrites it
  into assistant text inside `<thoughts>` (`fantasy:providers/openrouter/language_model_hooks.go:823`).
  CONFIRMED except as marked.
- **E. The stream.** Sixteen part types (`fantasy:model.go:137-170`). A stream error returns
  an empty step: `return stepExecutionResult{}, part.Error` (`fantasy:agent.go:1629-1630`),
  and a retry "re-runs the entire step from scratch", so the consumer must undo what it
  accumulated (`fantasy:retry.go:104-108`). Unknown Anthropic events become keepalive parts
  (`fantasy:providers/anthropic/anthropic.go:1682-1686`). On cancel, Crush has already saved
  partial text through deltas, rewrites an unfinished tool call's input to `"{}"` and stores
  a synthetic result (`crush:internal/agent/agent.go:1165-1169,1193-1196`). CONFIRMED.
- **F. Endings, usage, errors.** Seven finish reasons (`fantasy:content.go:108-123`);
  Anthropic's `pause_turn` maps to stop and `model_context_window_exceeded` to length, the
  default to unknown (`fantasy:providers/anthropic/anthropic.go:1304-1316`). `Usage` means
  different things per provider: OpenAI's input is net of cached tokens
  (`fantasy:providers/openai/language_model_hooks.go:245-246`), Google's is passed through
  beside a cache-read count (`fantasy:providers/google/google.go:1510-1516`), and Crush sums
  input, cache read and cache write on the assumption that "the OpenAI-style providers
  already subtract" (`crush:internal/agent/agent.go:2072-2077`). Context overflow is five
  vendor regexes on English text (`fantasy:providers/openai/error.go:19-23`), and Crush
  never reads the result (no hit for `ContextTooLarge` in `crush/internal`, non-test).
  CONFIRMED.
- **G. Unsupported features.** fantasy returns `CallWarning`s (`fantasy:model.go:251-257`);
  Crush only logs their `Message` (`crush:internal/agent/agent.go:1041-1042`). Non-leading
  system messages are dropped without one (C), and so is reasoning on OpenAI chat, whose
  prompt builder has no case for it (no occurrence of a reasoning part in
  `fantasy:providers/openai/language_model_hooks.go`). CONFIRMED.
- **H. Extension.** A user's provider must be one of the known types or it is skipped
  (`crush:internal/config/load.go:464-469`). The reasoning dialects of the built-in
  providers are a switch on provider id that a custom provider cannot join:
  "TODO: Allow custom providers to specify how to set this?"
  (`crush:internal/agent/coordinator.go:658-659`). Media in tool results is allowed by
  provider id (`crush:internal/agent/agent.go:2296-2298`). CONFIRMED.
- **I. Control of the bytes.** No way to build a request without sending it: the model
  interface offers `Generate` and `Stream` only (`fantasy:model.go:260-269`); the body is
  visible in a debug log (`crush:internal/log/http.go:43-47`). Every request of a main
  agent starts with a fabricated user message wrapped in `<system_reminder>`
  (`crush:internal/agent/agent.go:1609-1614`). CONFIRMED.
- **J. Evolution and cost.** The catalogue's price fields are named so that its own
  generator calls them "confusing" (`catwalk:cmd/vercel/main.go:132-134`), and two files
  fill them in opposite senses for the same model (`anthropic.json:169-170` has 3.75 then
  0.3; `opencode-zen.json:213-214` has 0.3 then 3.75). A field removed from the struct is
  still in the data (`catwalk:internal/providers/configs/azure.json:93`,
  `has_reasoning_efforts`, read by no Go code). fantasy replays recorded HTTP: 350 cassettes
  under `providertests`. It imports the vendors' SDKs, one of them a fork
  (`fantasy:go.mod:8,10,13,24`). CONFIRMED.

### Goose

Paths: PT is `crates/goose-provider-types/src`, PV is `crates/goose-providers/src`, GP is
`crates/goose/src/providers`, G is `crates/goose/src`.

- **A. Identity.** Provider and model are free strings; `ModelConfig` is a name plus an
  untyped map of request parameters (`goose:PT/model.rs:41-60`). Effort is parsed out of the
  model name and the name is rewritten (`:369-382`), so the type does not survive its own
  serialisation: "TODO: Remove this workaround once ModelConfig guarantees
  deserialize(serialize(config)) == config" (`goose:G/session/session_manager.rs:870`). A
  slug is mapped to a canonical model by stripping suffixes by regex and "string matching
  magic" (`goose:PT/canonical/name_builder.rs:7-15,100`). Each message records the provider,
  the requested model and the model the server resolved
  (`goose:PT/conversation/message.rs:768-775`). CONFIRMED.
- **B. Differences.** In the name. Whether a model reasons is a chain of name tests
  (`goose:PT/model.rs:305-316`). Four lists of provider names hard-coded in Rust decide
  request parameters, and they name providers that are defined in JSON, one of them a
  user's (`"custom_deepseek"`, `goose:PV/openai.rs:424-448`). The cache contract is a match
  on about twenty provider names (`goose:PT/cache_semantics.rs:24-44`). The sub-agent counted
  about 80 tests on model or provider names in 19 files; not re-run: INFERRED. The rest
  CONFIRMED.
- **C. What is asked.** `stream(model_config, system: &str, messages, tools)`
  (`goose:PT/base.rs:517-523`): one system string, no tool choice, no cache or reasoning
  intent in the signature. Reasoning travels as magic keys in the parameter map (`"thinking_effort"`,
  `"budget_tokens"`, `goose:PT/model.rs:17-24`).
  The Anthropic format always marks the last two user messages
  (`goose:PT/formats/anthropic.rs:525-537`). Claude's thinking request is written in three
  format files that disagree: one clamps the budget under `max_tokens`
  (`goose:PT/formats/anthropic.rs:843-844`), one adds it on top
  (`goose:PT/formats/databricks.rs:315`). CONFIRMED.
- **D. Opaque provider data.** The neutral thinking part is Anthropic's shape
  (`goose:PT/conversation/message.rs:232-240`); the only other slot is an open JSON map on a
  tool request (`:83`). The OpenAI format captures unknown wire fields into that map and
  flattens the map back into the outgoing call (`goose:PT/formats/openai.rs:108-109,221-222,354`),
  so one provider's signature is posted to the next provider. Anthropic replays thinking only
  when the model string still matches (`goose:PT/formats/anthropic.rs:146-159,297-299`). A
  Responses reasoning item has no place for encrypted content
  (`goose:PT/formats/openai_responses.rs:61-66`). Google gets a made-up signature when none
  was stored (`goose:PT/formats/google.rs:24,146-153`). A rejected signature is recognised by
  the words in the error, the request is retried without thinking, and "the rejected blocks
  stay in the session" (`goose:PT/formats/anthropic.rs:909-912`, `goose:PV/anthropic.rs:220-239`).
  CONFIRMED.
- **E. The stream.** A delta is a whole `Message` paired with optional usage
  (`goose:PT/base.rs:332-334`); there is no start, stop or block event. Unknown Anthropic
  events are logged at debug and skipped (`goose:PT/formats/anthropic.rs:1296-1299`); that a
  mid-stream `error` event takes that path is INFERRED from the match arms. Invalid tool
  JSON on the Responses path becomes `{}` and the call proceeds
  (`goose:PT/formats/openai_responses.rs:882-885`). On cancel the loop breaks
  (`goose:G/agents/agent.rs:2842`) and what arrived is stored with no mark
  (`:3583-3585`). CONFIRMED except as marked.
- **F. Endings, usage, errors.** The stop reason is a list of provider strings on the usage
  object plus one boolean on message metadata (`goose:PT/conversation/token_usage.rs:17`,
  `goose:PT/conversation/message.rs:838`); the Google format never sets the boolean (no
  occurrence in `PT/formats/google.rs`). Context overflow is a list of English phrases
  (`goose:PV/http_status.rs:139-149`). A failed request that is not on a list of permanent
  phrases is retried by default (`goose:PT/retry.rs:41,113`). CONFIRMED.
- **G. Unsupported features.** With thinking on, the Databricks format overwrites the
  caller's temperature with 2 (`goose:PT/formats/databricks.rs:324`). The default output cap
  is 4,096 (`goose:PT/model.rs:355-361`), which the OpenAI format's own comment says
  "truncates non-trivial responses" (`goose:PT/formats/openai.rs:1810-1814`). Nothing is
  reported to the caller. CONFIRMED.
- **H. Extension.** A declared provider picks one of three engines
  (`goose:PV/declarative.rs:98-105`). What the schema cannot say is added as a per-vendor
  boolean on the shared schema ("Enables Z.AI's `clear_thinking` field, which Anthropic does
  not support", `:195-197`) or as a name list in Rust (B). Bundled JSON sets `max_tokens`
  (`goose:PV/declarative/definitions/meta.json:14`); that the struct has no such field and
  the value is ignored is the sub-agent's reading: INFERRED.
- **I. Control of the bytes.** Nine repair functions run on every request and their report
  is discarded: `let (filtered_messages, _) = fix_conversation(…)`
  (`goose:PT/conversation.rs:274-284`, `goose:G/agents/reply_parts.rs:371-377`). They remove
  a trailing assistant message and can insert the user message "Hello"
  (`goose:PT/conversation.rs:666-676`). The request log holds the payload and each parsed
  chunk, not the response bytes (`goose:PT/request_log.rs:81-84,110-113`). CONFIRMED.
- **J. Evolution and cost.** The message enum is closed and also carries interface concerns
  (`ToolConfirmationRequest`, `SystemNotification`, `goose:PT/conversation/message.rs:318-330`).
  The test provider replays whole messages keyed by a hash of the messages
  (`goose:GP/testprovider.rs:180`), so stream parsing is tested only with inline strings. A
  file per provider is paid for in copies: the stream pump exists twice in one file differing
  by one identifier (`goose:PV/openai_compatible.rs:237-259` and `:261-283`);
  `from_declarative_config` for OpenAI and for Anthropic differ in one line, the return type
  (`goose:PV/openai.rs:894-927`, `goose:PV/anthropic.rs:501-534`); `fn response_to_message`
  is defined in 8 files, `fn create_request` in 7, `async fn stream(` in 30. CONFIRMED.

## What they do that this plan lacks

1. **A declared cache contract, and a test of prefix stability.** Goose names four kinds:
   explicit breakpoints with a maximum count, implicit and tolerant ("the longest matching
   stored prefix is reused"), implicit and strict ("only extends a prompt reproduced
   byte-for-byte from the start") and uncached (`goose:PT/cache_semantics.rs:9-18`), and
   tests that consecutive requests keep their cached bytes
   (`goose:crates/goose-provider-types/tests/prefix_invariance.rs:1-8`). The plan's cache
   step has markers, implicit and none: no maximum, no strict against tolerant, no such
   test. (Goose then selects the kind by matching provider names, which is shape 2.)
2. **A typed account of what was not honoured, as part of the stream.** fantasy's first
   stream part type is `warnings`, a list of `CallWarning { Type, Setting, Tool, Details,
   Message }` (`fantasy:model.go:137,251-257`). The plan promises a report (D003) and
   defines none.
3. **Provenance on every stored answer.** Goose records the provider, the requested model
   and the model the server resolved on each message
   (`goose:PT/conversation/message.rs:768-775`); Codex records "producer compatibility for
   an opaque compaction item, never the currently selected model"
   (`codex:history/src/lib.rs:107`). The plan's closed step names neither.
4. **A limit on silence between frames.** Codex ends a stream after 300 seconds without a
   frame (`codex:model-provider-info/src/lib.rs:66`,
   `codex:codex-api/src/sse/responses.rs:565-568`); fantasy turns unknown events into a
   keepalive part so a consumer can tell slow from dead
   (`fantasy:providers/anthropic/anthropic.go:1682-1686`). `crush#3178` is the hang without
   one. The plan's transport honours cancellation only (P03-I02).
5. **Invalid tool input kept as what it was.** Zed has an event for a tool call whose input
   did not parse, carrying the raw text and the parse error
   (`zed:language_model_core/src/language_model_core.rs:57-62`). The plan covers input that
   is incomplete because of a cut (D009), not input that is complete and malformed; Goose
   shows the alternative, `{}` and run it (`goose:PT/formats/openai_responses.rs:882-885`).

## Unverified leads

- **The "deepseek harness".** Not identified. No harness published by DeepSeek was found.
  What was read: DeepSeek's thinking-mode guide
  (`https://api-docs.deepseek.com/guides/thinking_mode/`, 2026-10-08). When a request
  carries tools, "the `reasoning_content` must be fully passed back to the API in all
  subsequent requests", otherwise a 400; without tools it "will be ignored". A requested
  effort is remapped (medium to high, xhigh to high), and `temperature` in thinking mode
  "will not trigger an error but will also have no effect". That is a format whose replay
  rule depends on the request, and it is what `crush#2696`, `goose#8807` and `goose#9434`
  ran into. Names seen in search results and not opened: `Hmbown/DeepSeek-TUI` (a terminal
  agent built for DeepSeek), `deepseek-ai/awesome-deepseek-agent` (integration guides), and
  DeepSeek's Codex integration page with a setup script that writes a Codex model catalogue,
  which `codex#36586` calls "the official DeepSeek one-command setup". Roo Code has
  `src/api/transform/r1-format.ts` and Aider an `is_deepseek_r1` test
  (`aider:aider/models.py:925`); neither was read.
- Codex's WebSocket and SSE paths are said to differ in when a failed response is delivered
  and in what error is built (`codex:codex-api/src/endpoint/responses_websocket.rs`); only
  one line of it was re-read.
- Codex warns of flagged cyber activity whenever the server reports a model other than the
  one requested (`codex:core/src/session/mod.rs:4003-4011`, read); that the call site has no
  guard for other providers was not checked.
- Crush is said to give Vertex models and Responses-routed models on OpenAI-compatible
  providers no reasoning options at all, because the options are written under one key and
  read under another. Reasoned from several sites by a sub-agent, not run.
- fantasy's `toHeaderMap` is said to write header keys in a case the retry code does not
  look up, so `retry-after` may be missed. Not re-read.
- Crush is said to keep a cache mark under `bedrock` and `vercel` keys that no code reads
  (the writing side, `crush:internal/agent/agent.go:1565-1575`, was read; the absence of a
  reader was not checked).
- Goose accumulates OpenRouter's `reasoning_details` into a variable named `_metadata`
  (`goose:PT/formats/openai.rs:1451-1453`, read) that is said never to be read.
- Goose's bundled provider JSON sets `max_tokens`, said to be ignored because the struct has
  no such field.
- catwalk is said to hold a provider (`pioneer`) with a config file and a generator but no
  registration.
- Titles seen in issue listings and not opened: `codex#31718` (a transient "Item with id …
  not found" 400 is not retried), `crush#960` (an overloaded error ends the conversation),
  `goose#6013` and `goose#5792` (Gemini 400 for a missing thought signature).
