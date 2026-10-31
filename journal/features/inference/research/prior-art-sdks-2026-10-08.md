---
title: Worst shapes in libraries that define a neutral model format — AI SDK, LiteLLM, LangChain
date: 2026-10-08
origin: ["conversation 2026-10-08"]
---

# Worst shapes in libraries that define a neutral model format

Task `research-sdks` of [[features/inference/plan]] (P06-I03). Adversarial by request: "the
point is to be adversarial; identify their worsst shappes so we can avoid them". A shape is a
structural choice (where a fact lives, what a type permits, who decides); a bug is cited only
as evidence of one. Nothing here is from memory.

How to read the references:

- `ai@` stands for `vercel/ai@5028fa4:packages/`, `ll@` for `BerriAI/litellm@8fc31b1:litellm/`,
  `lc@` for `langchain-ai/langchain@1f587e3:libs/`, `lcjs@` for
  `langchain-ai/langchainjs@824d07b:libs/`. What follows is the path and the line.
- `owner/repo#N` stands for `https://github.com/owner/repo/issues/N` (or `/pull/N` where it
  says pull request), read on 2026-10-08 through the GitHub REST API: title, state, labels and
  the body. Comment threads were not read. A root cause quoted from an issue is the
  reporter's unless the labels say the maintainers reproduced or merged it.
- CONFIRMED: the line or the page was opened and read for this file. INFERRED: reasoned from
  what was read. Counts name the command that produced them.
- Three read-only sub-agents searched the clones for candidates. Every `path:line` that is
  cited was then printed from the clone and read; what could not be checked was left out.

## What was read

| Subject | Where | Commit or date |
|---|---|---|
| AI SDK | `github.com/vercel/ai`, sparse clone of `packages/{provider,provider-utils,ai,anthropic,openai,openai-compatible,google,amazon-bedrock}` and `content/docs` | `vercel/ai@5028fa4`, committed 2026-10-08: `ai` 7.0.133, `@ai-sdk/provider` 4.0.25, `@ai-sdk/anthropic` 4.0.76, `@ai-sdk/openai-compatible` 3.0.66 |
| AI SDK, `LanguageModelV1` | `packages/provider/src/language-model/v1/` on branch `release-v4.3` (removed from main) | `vercel/ai@ca47b75`, six files fetched 2026-10-08 |
| AI SDK, release dates | `https://registry.npmjs.org/ai`, `https://registry.npmjs.org/@ai-sdk%2fprovider` (`time` field) | read 2026-10-08 |
| LiteLLM | `github.com/BerriAI/litellm`, sparse clone of `litellm/{llms,litellm_core_utils,types}`, `litellm/*.py`, `model_prices_and_context_window.json` | `BerriAI/litellm@8fc31b1`, committed 2026-10-07 |
| LangChain (Python) | `github.com/langchain-ai/langchain`, sparse clone of `libs/core/langchain_core`, `libs/partners/{anthropic,openai}`, `libs/langchain_v1/langchain/chat_models` | `langchain-ai/langchain@1f587e3`, committed 2026-10-07 |
| LangChain (JS) | `github.com/langchain-ai/langchainjs`, sparse clone of `libs/langchain-core/src`, `libs/providers/langchain-{anthropic,openai}/src`, `libs/langchain/src/chat_models` | `langchain-ai/langchainjs@824d07b`, committed 2026-10-07 |
| LangChain, the reasons for standard content | `https://www.langchain.com/blog/standard-message-content` (The LangChain Team, 2025-09-03) | read 2026-10-08 |
| Issue trackers | `vercel/ai`, `BerriAI/litellm`, `langchain-ai/langchain`, `langchain-ai/langchainjs`, `mastra-ai/mastra` | 41 issues and pull requests, read 2026-10-08 |
| Anthropic's OpenAI-compatible endpoint | `https://platform.claude.com/docs/en/api/openai-sdk` | read 2026-10-08 |
| Google's OpenAI-compatible endpoint | `https://ai.google.dev/gemini-api/docs/openai` | read 2026-10-08 |
| Amazon Bedrock Converse | `https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html`, `…/API_runtime_CachePointBlock.html`, `…/API_runtime_ReasoningContentBlock.html`, `…/API_runtime_SystemContentBlock.html`, `https://docs.aws.amazon.com/bedrock/latest/userguide/doc-history.html` | read 2026-10-08 |

Not read, and so not judged: `packages/gateway` of the AI SDK; LiteLLM's `proxy/`,
`integrations/` and `responses/`; the test suites beyond counting fixture files; TanStack AI
(search results only, see Unverified leads). Mastra's source was not cloned; one issue was
read.

## Worst shapes

Most severe for kuib first. Severity follows the brief: HIGH when the plan has the shape or
leaves it open, MEDIUM when a ruling avoids it but an item as written could bring it back, LOW
when it stands only as a warning. Fifteen shapes: eleven HIGH, four MEDIUM, none LOW (a shape
that did not bear on the plan was left in Per subject). A finding that touches a decision
carrying a ruling is written as the risk that ruling carries.

### W01 · HIGH · What a provider demands back unchanged is kept in an open record under a name, and the code that writes the name is not the code that reads it

- Subject and axis: AI SDK, D. Also LangChain D and E, LiteLLM D.
- Evidence (CONFIRMED). The type is `Record<string, JSONObject>`, "keyed by the provider
  name", and its stated purpose is speed: "This enables us to quickly ship provider-specific
  functionality without affecting the core AI SDK" (`ai@provider/src/shared/v4/
  shared-v4-provider-metadata.ts:10-24`; the same words in V1,
  `vercel/ai@ca47b75:packages/provider/src/language-model/v1/
  language-model-v1-provider-metadata.ts:3-26`). The name is derived four different ways:
  `config.provider.includes('azure') ? 'azure' : 'openai'`
  (`ai@openai/src/responses/openai-responses-language-model.ts:324-326`); `['googleVertex',
  'vertex']` or `['google']` (`ai@google/src/google-language-model.ts:169-173`);
  `this.config.provider.split('.')[0].trim()`
  (`ai@openai-compatible/src/chat/openai-compatible-chat-language-model.ts:161-163`); and a
  default of `providerOptionsKey = 'google'` in a package meant for any vendor
  (`ai@openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:182`,
  `:243-246`). The record rides on every stream part
  (`ai@provider/src/language-model/v4/language-model-v4-stream-part.ts:16-71`), so every
  transform between the provider and storage must know to carry it. LangChain's new standard
  block repeats the choice: `extras: NotRequired[dict[str, Any]]`
  (`lc@core/langchain_core/messages/content.py:491-492`), Claude's signature goes to
  `extras["signature"]` (`lc@core/langchain_core/messages/block_translators/anthropic.py:
  266-271`), the translator is found by the string `response_metadata["model_provider"]`
  (`lc@core/langchain_core/messages/ai.py:258-269`), and the JS implementation of the same
  standard puts `signature` at the top of the block instead
  (`lcjs@langchain-core/src/messages/block_translators/anthropic.ts:332-338`). Where a format
  has no slot at all, the payload is hidden in a neighbouring field: LiteLLM appends Gemini's
  signature to the tool-call id, `f"{tool_call_id}{THOUGHT_SIGNATURE_SEPARATOR}
  {thought_signature}"` with the separator `"__thought__"`
  (`ll@litellm_core_utils/prompt_templates/factory.py:75`, `:1242-1243`), and stores OpenAI's
  encrypted reasoning inside an Anthropic thinking block's `signature` behind the prefix
  `"litellm_encrypted_reasoning:"` (`ll@litellm_core_utils/prompt_templates/common_utils.py:
  2048-2058`).
- Harm (CONFIRMED). Written under one name, read under another: `vercel/ai#12351`
  ("@ai-sdk/google-vertex drops thoughtSignature in multi-step tool calls due to namespace
  desync", closed 2026-02-12, `merged-main`); `vercel/ai#18962` ("echoes Gemini
  `thought_signature` back to the upstream only when the provider is named `google`"; "the
  capture side and the echo side disagree on the providerOptions namespace", closed
  2026-08-19, `merged-main`). Dropped by a stage in between: `vercel/ai#11689` (`smoothStream`
  "only preserves `type`, `text`, and `id`", so the signature is lost and Anthropic answers
  "Expected 'thinking' or 'redacted_thinking', but found 'tool_use'", closed 2026-01-13);
  `vercel/ai#14840` (through the gateway "`providerMetadata.vertex.thoughtSignature` field is
  missing from `tool-call` events"). Present in one view of the answer and not the other:
  `vercel/ai#11602` ("`response.messages` reasoning parts are missing `providerMetadata` with
  signatures", opened 2026-01-07, closed 2026-10-02). Renamed between majors: "now uses
  `azure` as the key … instead of `openai`", "now uses `vertex` … instead of `google`"
  (`vercel/ai@5028fa4:content/docs/08-migration-guides/24-migration-guide-6-0.mdx:732`,
  `:810`). LangChain: `langchain-ai/langchainjs#10844` (the streaming converter "drops
  `encrypted_content`", open since 2026-05-07) and pull request
  `langchain-ai/langchainjs#11550` ("Concurrent items shared one `additional_kwargs.reasoning`
  object, so their `id` and `encrypted_content` fields got corrupted during merging, and
  OpenAI rejected the replayed request"; the fix changes the record's shape to an array).
  LiteLLM: `BerriAI/litellm#37849` (the id "ranges from **843 to 4423 characters**"; a client
  that normalises ids mangles the signature and Google answers "Base64 decoding failed";
  "There is no way to opt out"; open since 2026-08-21).
- kuib's plan: undecided. D011 rules "no open records", which removes the record itself. What
  replaces it is open: P02-I02 says only "the opaque provider payload", G006 (where it may
  sit) is open, and G007 recommends that plugin identities travel as "the enum's string value
  prefixed by the plugin's name", which is a name-derived key again.
- What kuib should do: rule G006 as one typed field on any model-authored part and one on the
  closed step, holding the provider's bytes untouched, with the offering that minted it beside
  it as enums (see W02). No lookup by name anywhere; only a translation writes or reads it.
  Make P05-I01 pass the part through every stage it will really cross (deltas, the fold, a
  stored step, the next step asked), so a stage that rebuilds a part instead of carrying it
  fails the proof.

### W02 · HIGH · A payload is good only for the model that minted it, yet nothing records who minted it, so on a cut or a change of model it is replayed, dropped or faked without anyone deciding

- Subject and axis: AI SDK, D and E. Also LiteLLM D, LangChain E.
- Evidence (CONFIRMED). Each adapter has its own silent rule. Anthropic in the AI SDK drops
  the reasoning part and pushes `message: 'unsupported reasoning metadata'`
  (`ai@anthropic/src/convert-to-anthropic-prompt.ts:807-817`). OpenAI drops it: "Non-OpenAI
  reasoning parts are not supported. Skipping reasoning part"
  (`ai@openai/src/responses/convert-to-openai-responses-input.ts:1251-1253`). Google invents a
  signature (`injectSkipSignature`, `ai@google/src/convert-to-google-messages.ts:548-551`).
  LangChain drops another provider's reasoning with a bare `continue`
  (`lc@partners/anthropic/langchain_anthropic/chat_models.py:774-779`). LiteLLM removes a
  thinking block that has no signature (`ll@litellm_core_utils/prompt_templates/
  common_utils.py:2116-2118`), fabricates `b"skip_thought_signature_validator"` for Gemini
  (`ll@litellm_core_utils/prompt_templates/factory.py:1321`, `:1394-1395`), and when history
  has tool calls without thinking blocks it removes `thinking` from the request only if
  `modify_params` is on; otherwise the request goes out to fail
  (`ll@llms/anthropic/chat/transformation.py:1991-2002`). On rebuilding a stream it discards
  thinking text that was not followed by a signature
  (`ll@litellm_core_utils/streaming_chunk_builder_utils.py:703-713`).
- Harm (CONFIRMED). `vercel/ai#18452` (closed 2026-08-05, reproduced, `merged-main`): a turn
  aborted mid-thinking stores reasoning with no signature; on replay the adapter drops it "but
  still emits the assistant message it belonged to"; the request carries `content: []`, the
  400 is not retryable, and "every subsequent turn replays it and the conversation is bricked
  permanently". `vercel/ai#7099` (49 comments) and `#10290`: OpenAI rejects replayed history,
  "Item 'rs_...' of type 'reasoning' was provided without its required following item",
  "Item with id 'rs_…' not found". `vercel/ai#11036` (open since 2025-12-10): the library's
  own `pruneMessages` removes reasoning or tool calls independently and OpenAI rejects either
  half. `BerriAI/litellm#15601`: "Expected `thinking` or `redacted_thinking`, but found
  `tool_use`" as soon as a tool is called through an OpenAI-shaped client.
  `BerriAI/litellm#42550` (open since 2026-09-22): signed thinking blocks with empty text "are
  stripped before dispatch", so a client "loses all of its prior reasoning on every turn …
  silently"; `BerriAI/litellm#42869`: two places "key on the thinking **text**".
- kuib's plan: partly. D009 rules that partial output is kept and "the translation decides
  what a provider accepts back"; the engine-design table says cut reasoning is stored without
  a payload and not sent back on Claude; P04-I02 already tests "thinking with an empty text
  and a signature". Not stated anywhere: what a translation emits when dropping a part leaves
  the turn empty (the `#18452` case, which D009's own table produces whenever a step is cut
  during thinking before any text); what it does with a payload minted by another offering
  (G006 recommends leaving "replay across turns to the engine"). P01-I02 has no capture of a
  step cut during thinking, and none where the second request goes to a different model.
- What kuib should do: every variant of "send reasoning back" states three rules and reports
  which one fired (W03): a payload from another offering; reasoning with no payload; a turn
  left with nothing sendable (omit the turn, never send it empty). Add captures: a request
  whose history holds a step cut during thinking; a Haiku-minted thinking block sent to Sonnet
  5.5 and the reverse. A part is never judged empty by its text.

### W03 · HIGH · An intent the provider cannot honour is changed quietly: a warning in free text outside the stored result, a debug log, or nothing

- Subject and axis: AI SDK, G. Also LiteLLM G and the OpenAI-compatible endpoints of Anthropic
  and Google.
- Evidence (CONFIRMED). The AI SDK degrades and warns: `warnings.push(` occurs 56 times in
  non-test `packages/anthropic/src`, 71 in openai, 51 in google, 28 in amazon-bedrock, 12 in
  openai-compatible (`grep -rnE "[wW]arnings\.push\(" … | grep -vE "test|__fixtures__|
  __snapshots__" | wc -l`). A warning names its subject in a free string, `feature: string`
  (`ai@provider/src/shared/v4/shared-v4-warning.ts:12-22`), and travels once, in
  the `stream-start` part (`ai@provider/src/language-model/v4/
  language-model-v4-stream-part.ts:82-86`), apart from the content parts an application keeps
  as history. Some changes do not warn at all: for tool choice `none`, "Anthropic does not
  support 'none' tool choice, so we remove the tools"
  (`ai@anthropic/src/anthropic-prepare-tools.ts:517-519`). LiteLLM with `drop_params` removes
  the parameter with no log in that block (`ll@utils.py:4555-4560`); other drops ignore the
  flag and log at debug level (`ll@llms/bedrock/chat/converse_transformation.py:1103-1106`).
  Anthropic documents its own compatibility layer the same way: "Most unsupported fields are
  silently ignored rather than producing errors"; `reasoning_effort`: "Ignored". Google: other
  parameters "will be silently ignored by the compatibility layer".
- Harm (CONFIRMED). `vercel/ai#20867` (open since 2026-09-16): asking for `reasoning: 'none'`
  on OpenAI "emits a warning and sets the effort to `undefined`. The request therefore uses
  the API default", the opposite of what was asked. `BerriAI/litellm#34105` (open since
  2026-07-21): `reasoning_effort` is discarded "with **no warning, no error, no
  pass-through**". `BerriAI/litellm#21912`: a parameter that one version "silently filtered
  out" is rejected in the next. The AI SDK's own 7.0 guide: provider options "can silently
  bypass your new top-level `reasoning` configuration"
  (`vercel/ai@5028fa4:content/docs/08-migration-guides/23-migration-guide-7-0.mdx:1443`).
- kuib's plan: yes, by ruling. D003: "that way requests won't fail"; the translation "renders
  each intent the best way its offering supports and reports what it did". The risk this
  ruling carries is exactly this shape, and the report is its only defence. No item's
  acceptance names the report: P02-I02 lists the closed step's contents (parts, ending, usage,
  payload) without it, and P04-I01 tests blocks by the bytes they build.
- What kuib should do: make the report a shape in P02-I02. The closed step and the first delta
  carry a list, one entry per intent asked: which intent (enum), what happened (as asked,
  rendered another way, not rendered), and how (an enum owned by the block). The path that
  builds a request without sending it (P03-I03) returns the same list, so an application that
  needs an intent honoured learns before the call and D003 stays intact. Each block's test
  asserts its report beside its bytes.

### W04 · HIGH · One neutral word for reasoning means something different on every model, and "off" does not exist on some

- Subject and axis: AI SDK, C and G. Also LiteLLM C and Google's OpenAI-compatible endpoint.
- Evidence (CONFIRMED). The AI SDK's V4 added `reasoning?: 'provider-default' | 'none' |
  'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'`
  (`ai@provider/src/language-model/v4/language-model-v4-call-options.ts:123-131`). Its
  Anthropic adapter: "Models that always run adaptive thinking cannot disable it. Use low
  effort to keep thinking short instead of sending a request that the API would reject"
  (`ai@anthropic/src/anthropic-language-model.ts:3519-3527`). Its table for
  `claude-sonnet-5-5` sets `rejectsThinkingDisabled: true`, `rejectsBudgetThinking: true`,
  `rejectsForcedToolUse: true`, `rejectsSamplingParameters: true` (`:3211-3224`); LiteLLM's
  price map says the same of that model (`"supports_forced_tool_use": false`,
  `"supports_sampling_params": false`, read with `jq '."claude-sonnet-5-5"'`), and LangChain
  lists it among models that do not accept forced tool choice
  (`lc@partners/anthropic/langchain_anthropic/chat_models.py:1161-1165`). The
  OpenAI-compatible package sends the neutral word to the wire unchecked
  (`ai@openai-compatible/src/chat/openai-compatible-chat-language-model.ts:322-324`). LiteLLM
  turns the word into a token budget from constants (minimal 128, low 1,024, medium 2,048,
  high 4,096, xhigh 8,192, max 16,384; `ll@constants.py:272-297`), clamps `minimal` to 1,024,
  the same as `low` (`ll@llms/anthropic/chat/transformation.py:1353-1356`), and on adaptive
  models returns one `thinking` object for every effort (`:1318-1324`). Google's table maps
  `minimal` to `low` on one model, `minimal` on two and a budget of `1,024` on a fourth, and
  states "Reasoning cannot be turned off for Gemini 2.5 Pro or 3 models".
- Harm (CONFIRMED). `vercel/ai#20867`: the same neutral value yields the API default on
  OpenAI and, on Gemini 2.5 Pro, "can produce an invalid request".
  `BerriAI/litellm#34301` (closed 2026-08-28): a table saying a model supports
  `reasoning_effort="none"` bypassed validation and the request failed upstream.
- kuib's plan: yes. D016 rules "the reasoning level is part of each step that is asked" and
  gives the case: "for the first turn it needs to start speaking very fast so most likely I
  will disable reasoning for that specific term". P02-I02 names "the reasoning level for this
  step" without a vocabulary; the proposed row for Claude Sonnet 5.5 is EFFORT, with variants
  "effort, budget, toggle, none". If the three subjects' tables are right about Sonnet 5.5
  (INFERRED: they are the subjects' claims, not Anthropic's), "none" and "budget" are both
  rejected on kuib's first row and the voice case of D016 cannot be rendered as asked there.
- What kuib should do: before P02 fixes the vocabulary, add to P01-I02 two captures on Sonnet
  5.5, thinking disabled and thinking with a budget, and keep the rejections as fixtures.
  Define the level as ordered intents (off, least, …, most), not provider words. Each row
  carries its mapping as data, including what "off" becomes where it is unavailable, and the
  rendering is reported (W03).

### W05 · HIGH · How a step ended is squeezed into a few words, and the provider's own reason is dropped or left optional

- Subject and axis: AI SDK, F. Also LiteLLM F, LangChain G, Bedrock Converse.
- Evidence (CONFIRMED). AI SDK for Anthropic: `pause_turn`, `end_turn` and `stop_sequence`
  become `stop`; `max_tokens` and `model_context_window_exceeded` become `length`; `refusal`
  becomes `content-filter`; `compaction` and anything else become `other`
  (`ai@anthropic/src/map-anthropic-stop-reason.ts:13-29`). V1 and V2 had no raw reason
  (`vercel/ai@ca47b75:packages/provider/src/language-model/v1/
  language-model-v1-finish-reason.ts:13-20`); V3 added `raw: string | undefined` and removed
  `unknown` ("It is now returned as `other`",
  `vercel/ai@5028fa4:content/docs/08-migration-guides/24-migration-guide-6-0.mdx:522-524`).
  LiteLLM maps `"compaction": "length"`, `"MALFORMED_FUNCTION_CALL": "stop"`,
  `"network_error": "stop"`, `"error": "stop"`, and anything unmapped: "defaulting to 'stop'"
  (`ll@litellm_core_utils/core_helpers.py:200-258`); a stream with no reason at all is
  reported as `"stop"` (`ll@litellm_core_utils/streaming_handler.py:1731-1735`); `pause_turn`
  appears nowhere (`grep -rn pause_turn litellm | wc -l` = 0). LangChain JS has four values
  and `default: return "stop"`
  (`lcjs@providers/langchain-anthropic/src/utils/stream_events.ts:178-190`); LangChain
  Python has no neutral type, and a core parser named for OpenAI tests Anthropic's key,
  `response_metadata.get("stop_reason") == "max_tokens"`
  (`lc@core/langchain_core/output_parsers/openai_tools.py:372-374`). Converse's `stopReason`
  enum has nine values and neither `pause_turn` nor `refusal` (API reference, read
  2026-10-08).
- Harm (CONFIRMED). `vercel/ai#19493` (reproduced, `merged-main`): "the finish reason is
  reported as `stop` even though the stream carried a completed `function_call` item. The
  caller cannot tell a dropped tool call apart from a model that simply chose not to call
  one". `vercel/ai#19063` (reproduced, merged to three majors): "Valid tool calls are
  auto-executed even when the enclosing model call terminates with `length`, `error`,
  `content-filter`, or `other`".
- kuib's plan: yes. D013 rules five endings: "completed, interrupted, failed, cut off by a
  limit, or abandoned". They say who ended the step. They have no member for a refusal, a
  filter, a pause that must be continued, or MiMo's `repetition_truncation`; and "cut off by a
  limit" joins the output limit to the context window, which call for opposite next moves
  (continue, or compact). The engine design says the stop reason travels in the stream;
  P02-I02 asks only for "one of five endings".
- What kuib should do: keep D013's five endings as kuib's own axis. Beside them, in P02-I02,
  require the provider's stop reason verbatim and a small neutral enum of why the model
  stopped, with an explicit unrecognised member. Say which ending a pause and a refusal
  produce. Add a capture that ends on the output limit.

### W06 · HIGH · The format is drawn against the simplest schema, and each richer provider feature then breaks it

- Subject and axis: AI SDK, J. Also LangChain E and J, LiteLLM C.
- Evidence (CONFIRMED unless marked). Four specifications in nineteen months
  (`@ai-sdk/provider` 1.0.0 on 2024-11-18, 2.0.0 on 2025-07-31, 3.0.0 on 2025-12-22, 4.0.0 on
  2026-06-25; npm registry). Every breaking change to the format found, with what forced it:

  | Change | Where | Forced by |
  |---|---|---|
  | V1 to V2: one open record split into `providerOptions` (in) and `providerMetadata` (out) | V1's own note, "TODO language model v2 separate provider metadata (output) from provider options (input)" (`vercel/ai@ca47b75:…/v1/language-model-v1-provider-metadata.ts:22`); 5.0 guide `:488-490` | one record used in both directions, its own example being `cacheControl` |
  | V1 to V2: `reasoning-signature` and `redacted-reasoning` stream parts and `signature?` on the reasoning part removed; the signature moves into `providerMetadata` | V1 `language-model-v1.ts:297-302`, `language-model-v1-prompt.ts:76-95`; V4 `language-model-v4-reasoning.ts:6-14` | INFERRED: other providers' payloads (OpenAI item ids, Gemini signatures) did not fit Anthropic's two fields |
  | V1 to V2: single deltas become `start`/`delta`/`end` with an id per block | 5.0 guide `:2287-2289` | INFERRED: interleaved blocks |
  | V1 to V2: usage `promptTokens`/`completionTokens` renamed, `cachedInputTokens` added | V1 `language-model-v1.ts:143-146`; `ai@provider/src/language-model/v2/language-model-v2-usage.ts:11-33` | cache reads; no count for cache writes yet |
  | V2 to V3: usage becomes `inputTokens: { total, noCache, cacheRead, cacheWrite }` with `raw` | `ai@provider/src/language-model/v3/language-model-v3-usage.ts:6-58`; 7.0 guide `:1846-1850` removes `providerMetadata.anthropic.cacheCreationInputTokens` | Anthropic's cache-write count |
  | V2 to V3: finish reason becomes `{ unified, raw }`, `unknown` removed | `ai@provider/src/language-model/v3/language-model-v3-finish-reason.ts:20-32`; 6.0 guide `:522-524` | INFERRED: the lossy mapping of W05 |
  | V2 to V3: the key inside the open record renamed for Azure and Vertex | 6.0 guide `:732`, `:810` | W01 |
  | V3 to V4: `reasoning` call option added | `ai@provider/src/language-model/v4/language-model-v4-call-options.ts:123-131`; 7.0 guide `:1439` ("the provider-agnostic way to control reasoning effort") | every provider's reasoning control, until then only in the open record |
  | V3 to V4: `reasoning-file` and `custom` parts added | 7.0 guide `:1427-1431` ("Update all exhaustive part handling") | models that return files inside reasoning |
  | 7.0: a system message inside `messages` rejected by default | 7.0 guide `:445-449` ("This can break older persisted chats") | W07 |

  LangChain has three message generations at once: `'v0'` "stores reasoning and tool outputs
  in `AIMessage.additional_kwargs`", `'responses/v1'` "accommodates multiple reasoning items",
  and `v1` standard blocks (`lc@partners/openai/langchain_openai/chat_models/_compat.py:5-8`,
  `:35-37`); its stated reason for the third: "compatibility layers— such as Chat Completions
  APIs offered by each provider— typically lag in supporting (or don’t support at all) the
  full set of provider-native features" (blog, 2025-09-03). LiteLLM has no versions; it bolts
  Anthropic's fields onto OpenAI's message (`cache_control`, `thinking_blocks`,
  `reasoning_items`; `ll@types/llms/openai.py:874-877`).
- What OpenAI's chat shape cannot represent (CONFIRMED from the workarounds and from
  Anthropic's own page): reasoning as a part with a payload (LiteLLM adds `thinking_blocks`,
  and deletes it again for other targets, `ll@litellm_core_utils/prompt_templates/
  common_utils.py:1796`); cache intent ("Prompt caching is not supported"); the order of
  text, thinking and tool calls inside one answer (all text is joined, `ll@main.py:9080`;
  when tools exist `content = None`, `:9119-9123`; the order is rebuilt by a guess, "Pattern:
  thinking[0], group[0], thinking[1], group[1], ...",
  `ll@litellm_core_utils/prompt_templates/factory.py:2692-2695`, although "Anthropic verifies
  thinking block signatures based on position", `:2640-2641`); the block index
  (`index: Final = 0`, `ll@llms/anthropic/chat/handler.py:814`); a payload on a tool call
  (W01); more than four endings (W05); cache counts apart from prompt tokens (W08); thinking
  returned at all through Anthropic's endpoint ("the OpenAI SDK doesn't return Claude's
  thinking").
- Harm (CONFIRMED). Each generation needs an adapter that loses something: "TODO this could
  break, we need to properly map v2 to v3" and `cacheWrite: undefined` for a V2 model
  (`ai@ai/src/model/as-language-model-v3.ts:25-26`, `:93-95`). In LangChain's `v0` a second
  reasoning item overwrites the first ("overwriting as in v0.3",
  `lc@partners/openai/langchain_openai/chat_models/_compat.py:101-107`), the cause of
  `langchain-ai/langchainjs#11550`; a core comment records that without a guard "string
  content would be returned directly, silently dropping tool calls"
  (`lc@core/langchain_core/messages/ai.py:452-457`).
- kuib's plan: yes. P02-I02: "The shapes are written against both Anthropic Messages and
  OpenAI chat on paper before code". OpenAI chat is the schema all three subjects outgrew; a
  format that fits it and Anthropic Messages has been checked against one rich schema only.
  D011 (optional additions only, Protobuf before release) turns every missed slot into a
  permanent wart or a breaking change. G005 and G010 keep two generations alive on purpose
  (`StepStarted`/`StepFinished`, `ModelRef`/`ModelConfig`).
- What kuib should do: in P02-I02, check the shapes on paper against OpenAI Responses and
  Gemini `generateContent` as well, using the table above as the checklist: a payload on text
  and on tool-call parts; a reasoning item that must travel with the item after it, several
  per answer; reasoning with no text; tools the provider runs itself, with their results
  inside the answer; files and sources in an answer; files inside reasoning; a cache-write
  count; a raw stop reason. Give G005 and G010 an end condition.

### W07 · HIGH · The type lets an instruction sit anywhere; where it really goes is decided later, differently, by each adapter

- Subject and axis: AI SDK, C. Also LangChain C, LiteLLM C, Anthropic's OpenAI-compatible
  endpoint, Bedrock Converse.
- Evidence (CONFIRMED). In the AI SDK a system message is an ordinary member of the prompt
  array (`ai@provider/src/language-model/v4/language-model-v4-prompt.ts:25-28`). Then three
  layers disagree: core throws unless the caller opts in
  (`ai@ai/src/prompt/standardize-prompt.ts:87-91`); the Anthropic adapter sends a later one in
  place with `betas.add('mid-conversation-system-2026-04-07')`
  (`ai@anthropic/src/convert-to-anthropic-prompt.ts:261-270`) but moves the first one it meets
  to the top when no leading one exists (`:217-220`, `:256`); the Google adapter throws
  (`ai@google/src/convert-to-google-messages.ts:309-313`). LangChain Python keeps it in place
  only for models in a prefix list (`lc@partners/anthropic/langchain_anthropic/
  chat_models.py:1146-1158`) and only when the previous turn is a user turn or an assistant
  turn ending in a server tool result (`_previous_turn_allows_system`, `:667-679`); otherwise
  it is hoisted with a warning that it "now applies to the entire conversation", or raises
  "Received multiple non-consecutive system messages." (`:647-652`, `:739-752`). LangChain JS
  has no gate (`lcjs@providers/langchain-anthropic/src/utils/message_inputs.ts:544-547`).
  LiteLLM turns it into a user turn with a note on models without a flag
  (`ll@litellm_core_utils/prompt_templates/mid_conversation_system.py:20-21`). Anthropic's own
  OpenAI-compatible layer: "System/developer messages are hoisted and concatenated to the
  beginning of the conversation". Converse has `system` only at the top level.
- Harm (CONFIRMED). `vercel/ai#15681` (2026-05-28, `ai` 6.0.191): "the AI SDK re-sorts the
  array to put system messages first", shown by the request body. LiteLLM's own comment:
  "hoisting it rewrites the cached prefix and re-bills the whole history at cache-write
  pricing (#36559)" (`ll@llms/anthropic/chat/transformation.py:2045-2047`).
  `BerriAI/litellm#42104` (open since 2026-09-20): for Gemini, "~0% cache hit rate in
  agent-style multi-turn traffic instead of ~77–93%". The 7.0 guide: the new default "can
  break older persisted chats".
- kuib's plan: partly. D016 rules "an instruction can sit anywhere in the conversation", and
  P04-I01 gives the step two variants, "system role, user text", one per offering. The
  evidence says acceptance depends on what precedes the instruction, which one enum per
  offering cannot say. P01-I02 captures "a system message in the middle of a conversation" at
  one position.
- What kuib should do: capture four positions on Sonnet 5.5 in P01-I02: after a user turn,
  after assistant text, after a tool result, and the effort-only form with empty content
  (D016's cache-preserving case). The block takes the position as input, states its fallback
  for a position the provider rejects, never moves an instruction earlier than it was asked,
  and reports what it did (W03).

### W08 · HIGH · Token counts are folded into one provider's arithmetic, and a count the provider did not send looks like zero

- Subject and axis: LiteLLM, F. Also LangChain G, AI SDK F and J.
- Evidence (CONFIRMED). LiteLLM adds Anthropic's cache counts into `prompt_tokens` and
  subtracts them again for the detail (`ll@llms/anthropic/chat/transformation.py:2468-2473`,
  `:2498`). LangChain defines `input_tokens` as "Sum of all input token types"
  (`lc@core/langchain_core/messages/ai.py:138-139`), adds the cache counts for Anthropic
  ("Anthropic's `input_tokens` excludes cached tokens, so we manually add",
  `lc@partners/anthropic/langchain_anthropic/chat_models.py:3313-3314`), zeroes one key "to
  avoid double counting" (`:3336-3338`), and for OpenAI renames the detail keys by service
  tier (`lc@partners/openai/langchain_openai/chat_models/base.py:4493-4494`). The AI SDK had
  no cache count in V1, a read count only in V2, and from V3 four fields that are each `number
  | undefined` plus `raw` (`ai@provider/src/language-model/v4/language-model-v4-usage.ts:
  10-30`, `:52-58`); for Anthropic `total` is a sum the adapter computes
  (`ai@anthropic/src/convert-anthropic-usage.ts:102-105`).
- Harm (CONFIRMED). `BerriAI/litellm#9812`: cache-creation tokens "get charged twice",
  $0.091311 reported against $0.05439 billed. `BerriAI/litellm#27191`: the cause as a table,
  OpenAI-compatible `prompt_tokens` "Includes cached_tokens", Anthropic "Excludes cache
  tokens"; a 67% overcharge in its example. `vercel/ai#21027` (reproduced, `merged-main`): the
  converter reads each count as `?? 0`, drops a fifth, and "the derived uncached input goes
  negative".
- kuib's plan: undecided. P02-I02 says "usage including cache read and write" and nothing on
  whether input includes cached tokens or how a missing count is written. The engine design
  already records that MiMo reports a cache read count and no cache write count.
- What kuib should do: in P02-I02, four disjoint counts (input not from cache, cache read,
  cache write, output), each optional with absence meaning "not reported"; no computed total
  in the format; the provider's usage object kept verbatim beside them.

### W09 · HIGH · Deltas carry values whose merge rule the accumulator cannot know

- Subject and axis: LangChain, E. Also AI SDK E.
- Evidence (CONFIRMED). In the AI SDK the signature arrives as a reasoning delta with `delta:
  ''` and the open record beside it (`ai@anthropic/src/anthropic-language-model.ts:
  2743-2755`); core appends the text and keeps only the last record it saw:
  `activeReasoning.providerMetadata = part.providerMetadata ??
  activeReasoning.providerMetadata` (`ai@ai/src/generate-text/stream-text.ts:1611-1613`).
  LangChain merges chunks by a generic rule over open dictionaries: a type mismatch raises
  `TypeError` (`lc@core/langchain_core/utils/_merge.py:39-44`); two strings are concatenated
  unless the key is one of a listed few and the values are equal (`:59-64`); two integers are
  summed unless the key is `index`, `created` or `timestamp` (`:83-88`). The provider package
  works around its own core: "Drop it here so the two events don't merge into a doubled
  string (blocks sharing an `index` are merged by concatenation)"
  (`lc@partners/openai/langchain_openai/chat_models/base.py:5579-5582`). The JS core has
  different rules for the same keys: the incoming value wins
  (`lcjs@langchain-core/src/messages/base.ts:512-521`) and an unsupported type warns where
  Python raises (`:541-543`).
- Harm (CONFIRMED). `langchain-ai/langchain#29116`: "Additional kwargs key prompt_tokens
  already exists in left dict and value has unsupported type <class 'int'>".
  `langchain-ai/langchain#40698` (closed 2026-09-21): a leftover `index` in a block's
  `extras` makes `merge_lists` raise. Pull request `langchain-ai/langchainjs#11550`: two
  reasoning items merged into one record, "corrupted during merging, and OpenAI rejected the
  replayed request". `vercel/ai#11689`: a transform that rebuilt deltas without the record
  lost the signature.
- kuib's plan: undecided. P02-I02: "The closed step can be built from the deltas alone"; the
  principle: "Everything a translation needs to build the closed step travels in the stream".
  Not stated: which part a delta belongs to (a provider's index, or kuib's own id), how the
  payload arrives (in pieces, or whole), and who folds. The structure note already flags
  `fold.frames` as "a streaming transform, not quite a fold". If any reader other than the
  translation folds deltas (the stream store, a host, a reader resuming after a cut), each
  delta kind needs one stated rule.
- What kuib should do: in P02-I02, a closed set of delta kinds, each with exactly one rule:
  text, reasoning and tool input append to the part named by kuib's own part id (D013:
  identity is ours); the payload is set once, whole, by the delta that closes its part;
  ending and usage are set once. One fold, in shared code, used by every reader, and proven by
  "fold of the deltas equals the closed step" on every fixture and at every cut point
  (extending the cut test of P04-I02 to the fold).

### W10 · HIGH · What the stream reader does not recognise disappears without a trace

- Subject and axis: AI SDK, E and J. Also LiteLLM E.
- Evidence (CONFIRMED). The AI SDK validates every event against a closed union
  (`ai@provider-utils/src/parse-json-event-stream.ts:31`; `ai@anthropic/src/anthropic-api.ts:
  1127-1131`, whose comment claims "this approach limits breakages when the API changes"), so
  for Anthropic an unknown event kind becomes an `error` part
  (`ai@anthropic/src/anthropic-language-model.ts:1971-1973`); its OpenAI Responses schema has
  a catch-all `unknown_chunk` instead (`ai@openai/src/responses/openai-responses-api.ts:
  1432-1440`). Two packages of one library, two policies. `finish` is emitted only on
  `message_stop` (`ai@anthropic/src/anthropic-language-model.ts:3054`, `:3104-3105`) and the
  transform has no flush (`grep -c flush` = 0), so a stream that stops yields no ending from
  the adapter. LiteLLM's Anthropic parser is an `if`/`elif` chain over seven event names with
  no `else` (`ll@llms/anthropic/chat/handler.py:815-1003`): an unknown event becomes an empty
  chunk, and a stream that ends with no reason is reported as `"stop"`
  (`ll@litellm_core_utils/streaming_handler.py:1731-1735`).
- Harm (CONFIRMED). `vercel/ai#19493` (reproduced, `merged-main`): "When a `@ai-sdk/openai`
  Responses stream event fails schema validation, it is discarded without any signal. Nothing
  is thrown, `warnings` on `stream-start` stays empty", and a completed tool call is lost. For
  LiteLLM the harm is INFERRED: a cut stream is indistinguishable from a finished answer.
- kuib's plan: partly. P04-I02 gets the ending right ("Cutting a fixture after any frame
  still yields a valid closed step marked as cut") and then says "It ignores frame kinds it
  does not know", with no record that it did. A known kind whose body has changed is not
  covered: treated as unknown, it is the `#19493` loss.
- What kuib should do: three outcomes in P04-I02 instead of one. An unknown kind is skipped
  and its name counted in the closed step. A known kind that does not parse ends the step as
  failed, with the frame kept. A stream that ends without the provider's terminal frame is
  cut, never completed.

### W11 · HIGH · Failures are told apart by reading message text, or in a layer that cannot know the provider

- Subject and axis: LiteLLM, F. Also LangChain G, AI SDK F.
- Evidence (CONFIRMED). LiteLLM: 91 occurrences of `in error_str` in a 2,802-line file
  (`grep -c`), for example `"prompt is too long" in error_str`
  (`ll@litellm_core_utils/exception_mapping_utils.py:539-540`); a bare "429" in the message
  counts as a rate limit when the status is unknown (`:65`); a mid-stream error is given an
  invented status, "default to 500" (`ll@llms/anthropic/chat/handler.py:1009-1011`).
  LangChain detects context overflow the same way: `if "prompt is too long" in e.message`
  (`lc@partners/anthropic/langchain_anthropic/chat_models.py:1280`). The AI SDK's neutral
  layer knows only the status: retryable means 408, 409, 429 or 5xx
  (`ai@provider/src/errors/api-call-error.ts:28-32`); what a mid-stream error means is
  decided inside the Anthropic adapter from the error's type string
  (`ai@anthropic/src/anthropic-language-model.ts:99-104`).
- Harm (CONFIRMED). `BerriAI/litellm#43013` (open since 2026-09-24): context overflow arrives
  "as plain `BadRequestError` rather than `ContextWindowExceededError`, so
  `context_window_fallbacks` do not trigger"; the checker "has no substring matching either
  message", and the provider's own `code: "context_length_exceeded"` "is not consulted".
- kuib's plan: undecided. P03-I02 gives classification to the transport ("classifies failures
  by kind, HTTP status, whether a retry can help and after how long"), a transport that
  "depends only on `fetch` and web streams", inside a package that "contains no knowledge of
  any provider" (P03-I01). The kinds an engine acts on (context overflow, overloaded, a
  rejected thinking block) are in the provider's error body and in mid-stream error frames,
  which only a translation can read. No block is named for it, and P01-I02 has one "rejected
  request".
- What kuib should do: split P03-I02. The transport reports status, headers and the delay a
  header asks for. A step of the translation reads the provider's error body and its
  mid-stream error frame and returns a neutral kind from the provider's typed code, never from
  message text, keeping the body verbatim. Captures: context overflow, an invalid signature,
  an overloaded error mid-stream.

### W12 · MEDIUM · The request rebuilt for the next step is not an extension of the one that was sent

- Subject and axis: AI SDK, I. Also LiteLLM I.
- Evidence (CONFIRMED). In the AI SDK the body reported to the caller is not the body sent:
  `body: this.transformRequestBody(args, betas)` goes to the wire and `request: { body: args
  }` to the result (`ai@anthropic/src/anthropic-language-model.ts:1242`, `:1762`). A tool
  choice of `none` removes the whole tool list from the request
  (`ai@anthropic/src/anthropic-prepare-tools.ts:517-519`), which changes the start of the
  prompt (INFERRED as a cache miss). LiteLLM joins the `anthropic-beta` header from an
  unsorted set (`ll@llms/anthropic/common_utils.py:1172`, `:1241`).
- Harm (CONFIRMED). `vercel/ai#21919` (open since 2026-10-01, reproduced): a saved turn is
  replayed in a different order from the one sent live, "because the tool part holds the call
  and the result together"; "every token after the call is written to the cache again. In
  long threads that's hundreds of thousands of tokens per turn". `vercel/ai#14170` (open
  since 2026-04-06): changing the active tools per step "invalidates the provider's prompt
  cache".
- kuib's plan: partly. The principles ("building it is a pure function", "the exact request
  is inspectable before it is sent") and P05-I01 avoid it for one tool round. Not proven:
  that request N+1 starts with the bytes of request N in the cases that move things (an
  instruction added, an effort change, a tool choice, a cut step). And the request half of a
  fixture is written by kuib (P01-I01: "sends one prepared request"), so byte equality proves
  the builder is deterministic, not that the provider accepts or caches what it builds.
- What kuib should do: add to P05 a prefix test over every fixture sequence: the bytes of
  request N up to its last cache mark are a prefix of request N+1, and the recorded second
  response shows a cache read. Fix the order of headers and of beta values.

### W13 · MEDIUM · Differences between models are tests on substrings of the model's name, and an unknown name inherits the newest behaviour

- Subject and axis: LiteLLM, B. Also AI SDK B, LangChain B.
- Evidence (CONFIRMED). LiteLLM: 535 occurrences of `custom_llm_provider == "`, 139 of
  `model.startswith(`, 27 of `"claude" in model` (`grep -rnE … litellm | wc -l`); one version
  spelt four ways in a condition (`ll@llms/bedrock/chat/converse_transformation.py:
  1780-1783`); where capability data exists the name list stays "as a fallback for
  provider-routed ids whose map entries predate the flag"
  (`ll@llms/anthropic/common_utils.py:621-622`). AI SDK: lines branching on a model id, by
  one `grep` over non-test source: anthropic 21, google 17, openai 14, amazon-bedrock 12;
  `if (modelId.includes('claude-sonnet-5-5'))` (`ai@anthropic/src/anthropic-language-model.
  ts:3211`); an unrecognised Claude id "is assumed to be newer than the known list"
  (`:3421-3427`), and Google's "intentionally inherit the newest supported behavior"
  (`ai@google/src/google-model-capabilities.ts:23-25`). LangChain: prefix tuples decide
  mid-conversation system support and forced tool choice
  (`lc@partners/anthropic/langchain_anthropic/chat_models.py:1146-1165`); even core branches
  on a name, `if "claude" not in message.response_metadata.get("model_name", "").lower()`
  (`lc@core/langchain_core/messages/block_translators/bedrock.py:76-77`).
- Harm (CONFIRMED). `BerriAI/litellm#34105`: any model that is not one of two named families
  "falls into the `else` branch and is assumed to be Anthropic", and its reasoning setting is
  discarded. `BerriAI/litellm#34301`: a wrong entry in the capability table let an invalid
  request through.
- kuib's plan: no, by ruling: D004 makes models enums and D006 makes behaviour rows of
  blocks. MEDIUM because of two items as written. P04-I01 fixes five steps, while the AI SDK
  needs ten flags for the same models (`ai@anthropic/src/anthropic-language-model.ts:
  3183-3209`). Two have no step in the plan (sampling settings rejected, forced tool choice
  rejected) and two are not expressible by the reasoning step's variants (a budget rejected,
  thinking that cannot be off). A difference with no step becomes an `if` inside a block. And
  P04-I03 demands that "the MiMo row's values come from its captures"; nothing asks the same
  of Claude's rows.
- What kuib should do: every value in every row cites the fixture that proves it, Claude's
  too. Add steps for tool choice and for sampling settings. Add rejection captures on Sonnet
  5.5 for a forced tool choice and for `temperature` (with W04's two, four in all).

### W14 · MEDIUM · A model is named by one string that code takes apart

- Subject and axis: LiteLLM, A. Also LangChain A, AI SDK A.
- Evidence (CONFIRMED). LiteLLM: `elif model.split("/", 1)[0] in litellm.provider_list:`
  (`ll@litellm_core_utils/get_llm_provider_logic.py:252-254`), then the base address
  (`:263-268`), then model lists, then a pattern rule (`:532-533`): 103 `if`/`elif` lines in
  one function. Its price map has 4,504 keys; Claude Sonnet 4.5 is 20 of them, and two
  spellings of that one model disagree: `supports_web_search` is set on
  `claude-sonnet-4-5-20250929` and absent on `claude-sonnet-4-5` (compared with `jq`).
  LangChain: the prefix is split off only if it is a known provider
  (`lc@langchain_v1/langchain/chat_models/base.py:626-632`); otherwise the provider is
  guessed from the name, "best-effort and not guaranteed" (`:266-268`), and one guess is
  scheduled to change: "This default will change to 'google_genai' in the next major release"
  (`:584-594`). The JS table is a different list
  (`lcjs@langchain/src/chat_models/universal.ts:292-300`). The two partner packages alias the
  same field in opposite directions: `model: str = Field(alias="model_name")` and
  `model_name: str = Field(default="gpt-3.5-turbo", alias="model")`
  (`lc@partners/anthropic/langchain_anthropic/chat_models.py:1394`,
  `lc@partners/openai/langchain_openai/chat_models/base.py:801`). AI SDK: ids are `| (string
  & {})` (`ai@anthropic/src/anthropic-language-model-options.ts:29`); a registry id is split
  at the first separator (`ai@ai/src/registry/provider-registry.ts:307`).
- Harm. CONFIRMED as data: the same model answers a capability question differently by
  spelling. CONFIRMED as text: a stored string will resolve to another provider after an
  upgrade. No issue was opened for either; the consequences are INFERRED.
- kuib's plan: no, by ruling: D004, "i want erverything to be defined as a proper enum".
  MEDIUM because G007's recommendation brings a compound string back on the wire ("the enum's
  string value prefixed by the plugin's name"), and because P02-I01 gives an offering one
  native slug without saying where a dated snapshot, a region or a speed tier lives: a second
  model, a second offering, or a field.
- What kuib should do: rule G007 as two fields (who defined it, which member), never one
  string to split. In P02-I01, say what a dated snapshot is.

### W15 · MEDIUM · Built-in providers reach the core by a path a third party is not given

- Subject and axis: LiteLLM, H. Also AI SDK H.
- Evidence (CONFIRMED). LiteLLM dispatches through 68 `if`/`elif` branches
  (`ll@main.py:5890-6097`); a custom provider is branch 66, `# Assume custom LLM provider`
  (`:6084-6086`), and the transformation pipeline the built-ins use is reserved to a closed
  enum of 166 members (`if … custom_llm_provider in [provider.value for provider in
  LlmProviders]`, `ll@utils.py:4515-4516`; `ll@types/utils.py:4110`). In the AI SDK, core
  imports the vendor's gateway as the default provider and names its error type in the retry
  rule (`ai@ai/src/model/resolve-model.ts:1`, `:272`; `ai@ai/src/util/
  retry-with-exponential-backoff.ts:83-86`); the Bedrock package builds on
  `@ai-sdk/anthropic/internal` (`ai@amazon-bedrock/src/anthropic/
  amazon-bedrock-anthropic-provider.ts:14-17`), whose config has hooks the public settings do
  not (`buildRequestUrl`, `transformRequestBody`, `supportsNativeStructuredOutput`,
  `supportsStrictTools`; `ai@anthropic/src/anthropic-language-model.ts:251-259`). The generic
  package offered to everyone else carries one vendor's field: "TODO: thoughtSignature should
  be abstracted once we add support for other providers"
  (`ai@openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:243`).
- Harm (CONFIRMED). `vercel/ai#18962`: with "any custom provider name — the normal setup for
  OpenAI-compatible gateways and proxies", the signature "is captured from the response but
  never re-serialized on the next turn".
- kuib's plan: no, by principle ("Nothing is privileged") and by D008. MEDIUM because G003 is
  open and its recommendation keeps the built-ins as folders inside `inference`, "each
  importing only what a plugin could", a rule that nothing enforces.
- What kuib should do: if G003 is ruled as recommended, back it with a check that built-in
  folders import only the package's public entry, and keep the fake translation of P03-I03
  outside the package so the public path is exercised by something that is not built in.

## Per subject

One paragraph per axis. A statement that repeats a shape points to it instead.

### AI SDK (`vercel/ai@5028fa4`)

Every line below was opened and read.

Paths are relative to `packages/`. `packages/gateway` is not in the sparse clone.

- **A. Identity.** A model is two free strings and a version tag: `readonly
  specificationVersion: 'v4'`, `readonly provider: string`, `readonly modelId: string`
  (`provider/src/language-model/v4/language-model-v4.ts:12-22`). Provider packages type ids as
  a literal list with an escape, `| (string & {})`
  (`anthropic/src/anthropic-language-model-options.ts:29`); the OpenAI-compatible package uses
  `string` (`openai-compatible/src/chat/openai-compatible-chat-language-model-options.ts:3`).
  Date and region are spelt inside the id; thinking and speed are provider options. A bare
  string goes to a global provider that defaults to the vendor's own gateway: `const provider
  = globalThis.AI_SDK_DEFAULT_PROVIDER ?? gateway` (`ai/src/model/resolve-model.ts:36-37`,
  `:272`).
- **B. Differences.** In code, on substrings of the id. Lines that branch on a model id,
  counted with one `grep` over non-test source: anthropic 21, openai 14, google 17,
  amazon-bedrock 12, openai-compatible 0. Anthropic's are one function,
  `getModelCapabilities(modelId)`, returning a maximum output and ten flags, five of them named
  after a rejection (`rejectsSamplingParameters`, `rejectsThinkingDisabled`,
  `rejectsBudgetThinking`, `rejectsForcedToolUse`, …;
  `anthropic/src/anthropic-language-model.ts:3183-3209`), chosen by `if
  (modelId.includes('claude-sonnet-5-5'))` (`:3211`). An unknown Claude id "is assumed to be
  newer than the known list" and gets the newest behaviour (`:3421-3427`); a non-Claude id
  behind the same schema gets `maxOutputTokens: 4096` (`:3438-3442`). Google does the same:
  "unrecognized Gemini IDs and aliases intentionally inherit the newest supported behavior"
  (`google/src/google-model-capabilities.ts:23-25`).
- **C. What is asked.** Neutral: tools, `toolChoice`, `maxOutputTokens`, sampling settings,
  and since V4 `reasoning?: 'provider-default' | 'none' | 'minimal' | 'low' | 'medium' |
  'high' | 'xhigh' | 'max'` (`provider/src/language-model/v4/language-model-v4-call-options.ts:
  123-131`); V2 and V3 had no reasoning field. No neutral cache field in any version: cache
  intent is `providerOptions.anthropic.cacheControl`, read from the literal key `anthropic` in
  two spellings and not validated ("The Anthropic API will validate the value",
  `anthropic/src/get-cache-control.ts:15-21`); a fifth breakpoint is dropped with a warning
  (`:49-58`). A system message is an ordinary member of the prompt array, so the type allows
  it anywhere. Three layers then disagree: the top-level API throws unless the caller opts in
  (`ai/src/prompt/standardize-prompt.ts:87-91`); the Anthropic adapter sends a later one in
  place as `role: 'system'` with `betas.add('mid-conversation-system-2026-04-07')`, carrying
  `clear_at` and `output_config: { effort }` (`anthropic/src/convert-to-anthropic-prompt.ts:
  261-270`), but hoists the first one it meets when there was no leading one (`:217-220`,
  `:256`); the Google adapter throws "system messages are only supported at the beginning of
  the conversation" (`google/src/convert-to-google-messages.ts:309-313`).
- **D. Opaque provider data.** In `Record<string, JSONObject>` keyed by provider name
  (`provider/src/shared/v4/shared-v4-provider-metadata.ts:24`), on every content part and
  every delta. Anthropic writes `providerMetadata.anthropic.signature` and reads
  `providerOptions.anthropic` (`anthropic/src/convert-to-anthropic-prompt.ts:775-778`). OpenAI
  writes under `openai` or `azure` chosen by `config.provider.includes('azure')`
  (`openai/src/responses/openai-responses-language-model.ts:324-326`, `:919-921`) and sends
  back only a reference, `{ type: 'item_reference', id: reasoningId }`
  (`openai/src/responses/convert-to-openai-responses-input.ts:1179`). Google writes under
  `google`, or under both `googleVertex` and `vertex` (`google/src/google-language-model.ts:
  169-173`). The OpenAI-compatible package derives the key from the caller's provider name
  (`provider.split('.')[0]`, `openai-compatible/src/chat/openai-compatible-chat-language-model.
  ts:161-163`) and carries a Google field: "TODO: thoughtSignature should be abstracted once
  we add support for other providers" (`openai-compatible/src/chat/
  convert-to-openai-compatible-chat-messages.ts:243`). A key that is absent or another
  provider's: Anthropic drops the reasoning with `message: 'unsupported reasoning metadata'`
  (`anthropic/src/convert-to-anthropic-prompt.ts:807-817`); OpenAI drops it with "Non-OpenAI
  reasoning parts are not supported. Skipping reasoning part"
  (`…/convert-to-openai-responses-input.ts:1251-1253`); Google fabricates a signature
  (`injectSkipSignature`, `google/src/convert-to-google-messages.ts:548-551`).
- **E. The stream.** Parts are `text-start/delta/end`, `reasoning-start/delta/end`,
  `tool-input-start/delta/end`, whole `tool-call`, `tool-result`, `file`, `source`,
  `stream-start`, `response-metadata`, `finish`, `raw`, `error`
  (`provider/src/language-model/v4/language-model-v4-stream-part.ts:14-110`); each carries
  `providerMetadata?`. The signature arrives as a reasoning delta with empty text
  (`anthropic/src/anthropic-language-model.ts:2743-2755`) and core keeps the last record it
  saw: `activeReasoning.providerMetadata = part.providerMetadata ??
  activeReasoning.providerMetadata` (`ai/src/generate-text/stream-text.ts:1611-1613`). Every
  event is validated against a closed union (`provider-utils/src/parse-json-event-stream.ts:
  31`, `anthropic/src/anthropic-api.ts:1129-1131`), so an unknown event kind becomes an
  `error` part (`anthropic/src/anthropic-language-model.ts:1971-1973`). `finish` is emitted
  only on `message_stop` (`:3054`, `:3104-3105`) and the transform has no flush (`grep -c
  flush` = 0): a cut stream ends with no finish from the adapter. On abort the callback
  receives "Details for all previously finished steps"
  (`ai/src/generate-text/generate-text-events.ts:309-310`), not the partial step. After a
  retry mid-stream, "Partial output from a failed attempt that was already emitted cannot be
  retracted" (`ai/src/generate-text/stream-text.ts:642-643`).
- **F. Endings, usage, errors.** `pause_turn`, `end_turn` and `stop_sequence` map to `stop`;
  `max_tokens` and `model_context_window_exceeded` to `length`; `refusal` to
  `content-filter`; `compaction` and anything else to `other`
  (`anthropic/src/map-anthropic-stop-reason.ts:13-29`). The raw string is kept beside it
  since V3. Usage since V3 is `inputTokens: { total, noCache, cacheRead, cacheWrite }`, each
  `number | undefined` (`provider/src/language-model/v4/language-model-v4-usage.ts:10-30`);
  for Anthropic `total` is a sum the adapter computes (`anthropic/src/
  convert-anthropic-usage.ts:102-105`). Retryable means status 408, 409, 429 or 5xx
  (`provider/src/errors/api-call-error.ts:28-32`); a mid-stream error is classified by its
  type string (`anthropic/src/anthropic-language-model.ts:99-104`). Core retries only the
  call that opens the stream (`ai/src/generate-text/stream-text.ts:2426-2431`).
- **G. Unsupported features.** Degrade and warn. `warnings.push(` occurs 56 times in
  non-test `anthropic/src`, 71 in openai, 51 in google, 28 in amazon-bedrock, 12 in
  openai-compatible (one `grep` each). The warning names the feature in a free string
  (`provider/src/shared/v4/shared-v4-warning.ts:12-22`) and travels in `stream-start`. Not all
  changes warn: for tool choice `none`, "Anthropic does not support 'none' tool choice, so we
  remove the tools" (`anthropic/src/anthropic-prepare-tools.ts:517-519`). `reasoning: 'none'`
  on a model that cannot turn thinking off becomes low effort with a `compatibility` warning
  (`anthropic/src/anthropic-language-model.ts:3519-3527`); the OpenAI-compatible package
  sends the neutral word verbatim as `reasoning_effort` with no check
  (`openai-compatible/src/chat/openai-compatible-chat-language-model.ts:322-324`).
- **H. Extension.** A third party implements `LanguageModelV4` or configures
  `createOpenAICompatible`. First-party packages take paths others are not offered: core
  imports the vendor gateway as the default provider and names its error type in the retry
  predicate (`ai/src/model/resolve-model.ts:1`, `ai/src/util/retry-with-exponential-backoff.
  ts:83-86`); the Bedrock package builds on `@ai-sdk/anthropic/internal`, whose config has
  `buildRequestUrl`, `transformRequestBody`, `supportsNativeStructuredOutput`,
  `supportsStrictTools` (`anthropic/src/anthropic-language-model.ts:251-259`), none of them in
  the public provider settings. The smallest unit a third party can add is a whole model
  class.
- **I. Control of the bytes.** No call builds a request without sending it in the
  specification; `static async prepareRequest` exists on the Anthropic class
  (`anthropic/src/anthropic-language-model.ts:302`) behind the internal entry point. The body
  reported back is not the body sent: `body: this.transformRequestBody(args, betas)` goes to
  the wire and `request: { body: args }` to the caller (`:1242`, `:1762`). Since 7.0 the body
  is not kept unless asked (`ai/src/generate-text/stream-text.ts:915`). A custom `fetch` is
  the only hook that sees the final bytes.
- **J. Evolution and cost.** Four specification versions; V2, V3 and V4 ship together
  (`provider/src/language-model/index.ts:1-3`) and core adapts downward through a proxy that
  converts only the prompt (`ai/src/model/as-language-model-v4.ts:27-40`) with "TODO this
  could break, we need to properly map v2 to v3" (`ai/src/model/as-language-model-v3.ts:
  25-26`); a V2 model's cache-write count becomes `undefined` (`:93-95`). Zod validates every
  stream event. Tests for the Anthropic adapter use 64 recorded files in
  `anthropic/src/__fixtures__` (`.chunks.txt` and `.json`) beside inline mocks. The breaking
  changes are listed in W06.

### LiteLLM (`BerriAI/litellm@8fc31b1`)

Every line below was opened and read.

Paths are relative to `litellm/` unless they start with another folder. Not in the sparse
clone and therefore not read: `litellm/proxy/`, `litellm/integrations/`, `litellm/responses/`.

- **A. Identity.** A model is one free string; the provider is whatever precedes the first
  slash if it is in a list: `elif model.split("/", 1)[0] in litellm.provider_list:`
  (`litellm_core_utils/get_llm_provider_logic.py:252-254`). Without a prefix the provider is
  guessed from the base address, and an environment key is attached as a side effect
  (`:263-268`), then from membership in per-provider model lists, then from a pattern rule
  (`:532-533`). `get_llm_provider` (`:161-565`) holds 103 `if`/`elif` lines (counted with
  `awk 'NR>=161 && NR<=566' | grep -cE '^\s*(if|elif) '`). `azure/<name>` is rerouted to
  `openai` when the name is not an OpenAI model (`:200-202`). Route, region and date are more
  segments of the same string: `bedrock/converse/…`, `us.`/`eu.`/`global.` prefixes,
  `@20250929`, `-v1:0`. The price map `model_prices_and_context_window.json` has 4,504
  top-level keys (`jq length`); Claude Sonnet 4.5 alone is 20 of them (`grep -cE '^
  "[^"]*claude-sonnet-4-5[^"]*": \{$'`), and each copy carries its own capability flags.
- **B. Differences.** In code, keyed on strings: 535 occurrences of `custom_llm_provider ==
  "`, 139 of `model.startswith(`, 27 of `"claude" in model` across `litellm/**/*.py` (`grep
  -rnE … | wc -l`). 461 classes named `…Config(` under `llms/` (same method). Version names
  are spelt four ways in one condition: `"opus-4.7" in model_lower or "opus_4.7" in
  model_lower or "opus-4-7" in model_lower or "opus_4_7" in model_lower`
  (`llms/bedrock/chat/converse_transformation.py:1780-1783`). Capabilities are also data
  (`supports_*` keys in the price map), but the name list stays as the fallback: "the name
  check remains only as a fallback for provider-routed ids whose map entries predate the
  flag" (`llms/anthropic/common_utils.py:621-622`). An unknown model answers `False`, not
  "unknown" (`utils.py:2848-2861`). `supports_audio_output` reads the key
  `supports_audio_input` (`utils.py:2963-2965`).
- **C. What is asked.** The OpenAI assistant message is extended with Anthropic's fields:
  `cache_control`, `thinking_blocks`, `reasoning_items` (`types/llms/openai.py:874-877`), and
  those are deleted again for other targets (`LITELLM_INTERNAL_MESSAGE_FIELDS`,
  `litellm_core_utils/prompt_templates/common_utils.py:1796`; `cache_control` filtered at
  `llms/openai/chat/gpt_transformation.py:412-416`). `reasoning_effort` becomes a token budget
  from constants read from the environment: minimal 128, low 1,024, medium 2,048, high 4,096,
  xhigh 8,192, max 16,384 (`constants.py:272-297`); `minimal` is then clamped to 1,024, the
  same as `low` (`llms/anthropic/chat/transformation.py:1353-1356`); on adaptive models every
  effort yields the same `thinking` object (`:1318-1324`). A system message later in the
  conversation now stays in place for Anthropic, with the reason in a comment: "hoisting it
  rewrites the cached prefix and re-bills the whole history at cache-write pricing (#36559)"
  (`:2045-2047`); on models without the flag it becomes a user turn with a note
  (`litellm_core_utils/prompt_templates/mid_conversation_system.py:20-21`).
- **D. Opaque provider data.** Three carriers for one thing: `thinking_blocks` on the message,
  `provider_specific_fields` (an open `dict[str, Any]`), and other fields in disguise. Gemini's
  signature is appended to the tool-call id: `return
  f"{tool_call_id}{THOUGHT_SIGNATURE_SEPARATOR}{thought_signature}"` with the separator
  `"__thought__"` (`litellm_core_utils/prompt_templates/factory.py:75`, `:1242-1243`), read
  back by splitting the id (`:1297-1301`), and a placeholder is fabricated when none survived
  (`b"skip_thought_signature_validator"`, `:1321`, `:1394-1395`). OpenAI's encrypted reasoning
  is stored inside an Anthropic thinking block's `signature` behind the prefix
  `"litellm_encrypted_reasoning:"` (`…/common_utils.py:2048-2058`). On a change of model the
  ids of every message are rewritten to strip signatures, and a failure there is only logged
  (`utils.py:1185-1203`). A thinking block without a signature is removed before sending
  (`…/common_utils.py:2116-2118`). When history has tool calls and no thinking blocks,
  `thinking` is removed from the request only if `modify_params` is on; otherwise the request
  goes out and fails (`llms/anthropic/chat/transformation.py:1991-2002`).
- **E. The stream.** `CustomStreamWrapper` is a 2,558-line file. Anthropic's block index is
  discarded: `index: Final = 0` (`llms/anthropic/chat/handler.py:814`). The event `if`/`elif`
  chain in `chunk_parser` (`:815-1003`) has no `else`: an unknown event becomes an empty
  chunk. A stream that ends with no finish reason is reported as `"stop"`
  (`litellm_core_utils/streaming_handler.py:1731-1735`). A mid-stream `error` event is raised
  with an invented status: "it looks like Anthropic API does not return a status code in the
  chunk error - default to 500" (`handler.py:1009-1011`). On rebuild, thinking text that was
  not followed by a signature is discarded
  (`litellm_core_utils/streaming_chunk_builder_utils.py:703-713`).
- **F. Endings, usage, errors.** `_FINISH_REASON_MAP` maps `"compaction": "length"`,
  `"MALFORMED_FUNCTION_CALL": "stop"`, `"MISSING_THOUGHT_SIGNATURE": "stop"`,
  `"network_error": "stop"`, `"error": "stop"`, and anything unmapped: "defaulting to 'stop'"
  (`litellm_core_utils/core_helpers.py:200-258`). `pause_turn` appears nowhere in the clone
  (`grep -rn pause_turn litellm | wc -l` = 0). Anthropic's cache counts are added into
  `prompt_tokens` (`llms/anthropic/chat/transformation.py:2468-2473`) and subtracted again
  for the detail (`:2498`). Errors are classified by text: 91 occurrences of `in error_str` in
  a 2,802-line `exception_mapping_utils.py`; a bare "429" in the message counts as a rate
  limit when the status is not known (`:65`).
- **G. Unsupported features.** By default an unsupported parameter raises
  `UnsupportedParamsError` with `status_code=500`; with `drop_params` it is removed with no
  log line in that block (`utils.py:4555-4560`). A provider with no list is validated against
  OpenAI's (`utils.py:4576-4577`). Some drops ignore the flag and log at debug level only:
  "Dropping unsupported `thinking` param for Bedrock model=%s; it reasons natively."
  (`llms/bedrock/chat/converse_transformation.py:1103-1106`).
- **H. Extension.** A third party registers a `CustomLLM` handler. The dispatch in
  `completion()` is a chain of 68 `if`/`elif` branches (`main.py:5890-6097`, counted with
  `grep -cE '^ {8}(if|elif) '`), and custom providers are branch 66: `elif
  custom_llm_provider in litellm._custom_providers:  # Assume custom LLM provider`
  (`main.py:6084-6086`). The `LlmProviders` enum has 166 members (`types/utils.py:4110`). The
  transformation pipeline built-ins use is keyed on that closed enum, so a custom provider
  does not get it.
- **I. Control of the bytes.** `return_raw_request` exists, is "currently in BETA", and works
  by running the real call path with `api_key="my-fake-api-key"` and a logging object that
  aborts (`utils.py:10400-10430`). The `anthropic-beta` header is joined from an unsorted set
  (`llms/anthropic/common_utils.py:1172`, `:1241`).
- **J. Evolution and cost.** `__init__.py` is 2,555 lines, `main.py` 9,435, `utils.py`
  10,495; importing the package imports `main`: "Lazy loading this is not straightforward,
  will leave it here for now." / `from .main import *` (`__init__.py:1354-1355`). Tests are
  not in the sparse clone: nothing found on how the layer is tested.

### LangChain (`langchain-ai/langchain@1f587e3`, `langchain-ai/langchainjs@824d07b`)

Every line below was opened and read. Python paths are under `lc@`, JS under `lcjs@`.

- **A. Identity.** `init_chat_model` takes one string; the prefix before `:` is a provider
  only if it is in a table of built-ins (`lc@langchain_v1/langchain/chat_models/base.py:
  626-632`), otherwise the provider is guessed from the model name, "best-effort and not
  guaranteed" (`:266-268`); `gemini…` resolves to Vertex with a warning that the guess "will
  change … in the next major release" (`:584-594`). JS has its own table
  (`lcjs@langchain/src/chat_models/universal.ts:292-300`). A stored message names its origin
  by the free string `response_metadata["model_provider"]`.
- **B. Differences.** Prefix tuples in the provider package
  (`_supports_mid_conversation_system_messages`, `_supports_forced_tool_choice`:
  `lc@partners/anthropic/langchain_anthropic/chat_models.py:1146-1165`) beside profile data
  "derived from the models.dev project" (`lc@partners/anthropic/langchain_anthropic/data/
  _profiles.py:1-9`). A constructor quietly edits what was asked: "For gpt-5 (non-chat), only
  temperature=1 is supported / So we remove any non-defaults"
  (`lc@partners/openai/langchain_openai/chat_models/base.py:1368-1378`). Core itself branches
  on a model name (`lc@core/langchain_core/messages/block_translators/bedrock.py:76-77`).
- **C. What is asked.** Nothing about cache or reasoning is neutral: Anthropic takes
  `cache_control` as a call argument that is top-level for the direct API and expanded into
  blocks elsewhere ("Only the direct Anthropic API accepts top-level `cache_control`",
  `lc@partners/anthropic/langchain_anthropic/chat_models.py:1912-1917`) and dropped with a
  warning when no block is eligible (`:1927-1933`). A system message that is not first is kept
  in place, hoisted with a warning, or rejected, by model and by what precedes it (`:667-679`,
  `:731-752`). Tool choice is a string: `"any"` and `"auto"` are kinds, any other string is
  taken as a tool's name (`:2819-2822`); a forced choice is deleted with a warning when
  thinking is on (`:2842-2850`).
- **D. Opaque provider data.** Three open places on every message: `content: str |
  list[str | dict[Any, Any]]`, `additional_kwargs: dict[Any, Any]` ("Reserved for additional
  payload data"), `response_metadata: dict[Any, Any]`, on a model with `extra="allow"`
  (`lc@core/langchain_core/messages/base.py:103-115`, `:142-144`). Claude's signature stays
  inside the native block in `content`, and only four keys of a thinking block are sent back
  (`lc@partners/anthropic/langchain_anthropic/chat_models.py:857-865`). For OpenAI the home
  depends on `output_version`: `additional_kwargs["reasoning"]` in `v0`, the content sequence
  in `responses/v1` (`lc@partners/openai/langchain_openai/chat_models/_compat.py:5-8`,
  `:35-37`, `:101-107`). A reserved key is declared twice, in the provider package and in
  core: `_FUNCTION_CALL_IDS_MAP_KEY = "__openai_function_call_ids__"` (`…/_compat.py:88`;
  `lc@core/langchain_core/messages/block_translators/openai.py:288`). In JS
  `additional_kwargs` is marked `/** @deprecated */`
  (`lcjs@langchain-core/src/messages/base.ts:74-76`) and the Anthropic package still copies
  the whole provider message into it (`const { content, usage, ...additionalKwargs } =
  data.message`, `lcjs@providers/langchain-anthropic/src/utils/message_outputs.ts:28`).
- **D, continued: the standard content blocks of version 1.** The stated reasons: providers
  "use distinct and incompatible API schemas" (`lc@core/langchain_core/messages/content.py:8-14`) and
  compatibility layers "typically lag in supporting (or don’t support at all) the full set of
  provider-native features" (blog, 2025-09-03). The stored message stays native: "The raw
  `.content` will pass through the provider-native format" (same post), and `content_blocks`
  is computed on reading by a translator found through `response_metadata["model_provider"]`
  (`lc@core/langchain_core/messages/ai.py:258-269`); with no translator it falls back to
  "best-effort parsing" (`lc@core/langchain_core/messages/block_translators/__init__.py:
  8-10`); an unknown block is wrapped as `{"type": "non_standard", "value": item}`
  (`lc@core/langchain_core/messages/base.py:236-239`). The standard reasoning block has no
  field for a payload: `reasoning`, `index`, and `extras: NotRequired[dict[str, Any]]`
  (`…/content.py:478-492`), with a stated plan to let provider fields sit outside `extras`
  later (`:42-46`). The signature goes into `extras` on the way in
  (`…/block_translators/anthropic.py:266-271`) and is taken back out only for messages whose
  provider string is `anthropic` (`lc@partners/anthropic/langchain_anthropic/_compat.py:
  178-184`); reasoning from any other provider is skipped with `continue`
  (`…/chat_models.py:774-779`). One OpenAI reasoning item is exploded into several blocks
  with invented indexes, `lc_rs_…` (`…/block_translators/openai.py:641-651`), and on the Chat
  Completions path reasoning blocks are discarded (`…/_compat.py:179-180`). The JS standard
  differs from the Python one: `signature` at the top of the block
  (`lcjs@langchain-core/src/messages/block_translators/anthropic.ts:332-338`),
  `server_tool_call_result` with `toolCallId` where Python has `ServerToolResult`
  (`lcjs@langchain-core/src/messages/content/tools.ts:138-142`; `…/content.py:425`).
- **E. The stream.** Chunks are whole messages added together by a generic merge
  (W09). Partial tool input is parsed as JSON on every chunk, and anything that is not an
  object, or any exception, becomes an `invalid_tool_call`
  (`lc@core/langchain_core/messages/ai.py:555-569`). Nothing found on rebuilding after a cut:
  the aggregate is whatever chunks arrived.
- **F. Endings, usage, errors.** No neutral ending in Python: the provider's reason "rides
  inside `metadata`" (`lc@core/langchain_core/language_models/_compat_bridge.py:550-553`)
  under `stop_reason` for Anthropic and `finish_reason` for OpenAI. JS has four values and a
  default of `"stop"` (`lcjs@providers/langchain-anthropic/src/utils/stream_events.ts:
  178-190`). Usage is W08. Errors: nine neutral classes exist
  (`lc@core/langchain_core/exceptions.py:68-123`), and context overflow is detected by
  message text (W11). Retries are the vendor SDK's.
- **G. Unsupported features.** A mixture with no rule: silent removal (`temperature`, above;
  `payload.pop("stop", None)` for the Responses API,
  `lc@partners/openai/langchain_openai/chat_models/base.py:4627-4629`), removal with a
  warning (forced tool choice, `cache_control`), and an exception (a second non-leading
  system message).
- **H. Extension.** A third party subclasses the chat model class; the smallest unit is a
  whole class. Standard-block translators are a string-keyed table inside core
  (`lc@core/langchain_core/messages/ai.py:258-269`), so a new provider's blocks are
  "best-effort" until core registers it.
- **I. Control of the bytes.** The method that builds the request is private in both
  packages (`def _get_request_payload(`,
  `lc@partners/anthropic/langchain_anthropic/chat_models.py:1868`); nothing public builds a
  request without sending it (searched for `dry run`, `request_payload`, `get_*payload` in
  both packages and in `langchain_core/language_models`: nothing found).
- **J. Evolution and cost.** Three message generations coexist (W06), selected by a setting
  that also selects the HTTP API: "Explicitly setting `output_version="responses/v1"`
  separately enables the Responses API"
  (`lc@partners/openai/langchain_openai/chat_models/base.py:5154-5158`, `:2003`). Tests:
  recorded cassettes exist for the Python packages (24 files under
  `libs/partners/anthropic/tests/cassettes`, 102 under `libs/partners/openai/tests/
  cassettes`); how much of the suite uses them was not measured.

### The brief's four questions

- **Every breaking change to each neutral format, and what forced it.** AI SDK: the table in
  W06 (ten changes across V1 to V4 and the 7.0 release). LangChain: `v0` to `responses/v1`
  ("accommodates multiple reasoning items") to `v1` standard blocks (provider features the
  Chat Completions layers "lag in supporting"); none of the three was removed, so the break
  is paid as three coexisting generations (W06). LiteLLM: nothing found that is versioned;
  the OpenAI message grew extra keys instead (`cache_control`, `thinking_blocks`,
  `reasoning_content`, `provider_specific_fields`, `reasoning_items`).
- **What rides in open records, and which bugs came from a key that was misspelt, moved or
  not sent back.** AI SDK: cache intent (`cacheControl`, also accepted as `cache_control`,
  `ai@anthropic/src/get-cache-control.ts:15-18`), the thinking `signature` and
  `redactedData`, OpenAI's `itemId` and `reasoningEncryptedContent`, Gemini's
  `thoughtSignature`, and every provider's reasoning setting until V4. Moved:
  `vercel/ai#12351`, and the renames of 6.0. Derived wrongly: `vercel/ai#18962`. Not carried:
  `vercel/ai#11689`, `#14840`, `#11602`. LangChain: `additional_kwargs["reasoning"]`,
  `"__openai_function_call_ids__"`, `response_metadata["model_provider"]`,
  `extras["signature"]`; `langchain-ai/langchainjs#10844`, pull request `#11550`. LiteLLM:
  `provider_specific_fields`, and two fields used as carriers (W01);
  `BerriAI/litellm#37849`.
- **Features a provider had for months before the neutral format could express them.** AI
  SDK, dated by npm: a cache-write count was not neutral in V2 (2025-07-31), which already
  had a neutral cache-read count, and became neutral in V3 (2025-12-22), five months; it
  rode in `providerMetadata.anthropic.cacheCreationInputTokens` until 7.0 removed that field
  (7.0 guide `:1846-1850`). A way to ask for reasoning was not neutral in V2, which already
  streamed reasoning, and became neutral in V4 (2026-06-25), eleven months. A system message
  inside the conversation was still re-sorted on 2026-05-28 (`vercel/ai#15681`) and is sent in
  place at `5028fa4`; the start and end of that lag were not established. OpenAI's chat shape
  in LiteLLM: `BerriAI/litellm#15601`, opened 2025-10-16 and closed as stale on 2026-05-20,
  shows clients that speak that shape still losing thinking blocks on a tool call. Converse:
  see Secondary subjects.
- **OpenAI's chat shape as the neutral format: what it cannot represent.** The list in W06,
  each item with the workaround that proves it.

### Secondary subjects, where a worst shape showed

- **Amazon Bedrock Converse** (a vendor's own neutral format; API reference and document
  history read 2026-10-08). It has the same escape hatch as the libraries,
  `"additionalModelRequestFields": JSON value`, "Additional inference parameters that the
  model supports, beyond the base set" (W01's open record at the top level). Its `stopReason`
  enum has no `pause_turn` and no `refusal` (W05). `system` is top-level only (W07). Cache
  intent is a separate `cachePoint` block with `ttl` `5m | 1h`, not a mark on a block. What
  it cannot carry of Anthropic Messages, in LiteLLM's words (CONFIRMED as LiteLLM's claims):
  "Prompt caching not supported in Converse API" as a beta header, "The compact beta feature
  is not currently supported on the Converse and ConverseStream APIs", "Tool search not
  supported in Converse API - skip it" (`ll@llms/bedrock/chat/converse_transformation.py:
  129-133`, `:1747-1748`); and `BerriAI/litellm#21912` (`context_management`),
  `BerriAI/litellm#26320` (a top-level `cache_control` "succeeds when sent directly to
  Anthropic's API but fails when routed through LiteLLM to Bedrock"). AWS introduced Converse
  on "May 30, 2024"; its entry of "August 15, 2026" reads: "Reordered the code sample tabs on
  the Quickstart page to lead with the Messages API, followed by the Responses, Chat
  Completions, Converse, and Invoke APIs". INFERRED: the vendor now leads with each lab's own
  schema ahead of its neutral one.
- **Anthropic's OpenAI-compatible endpoint** (its own page): "Prompt caching is not
  supported"; "the OpenAI SDK doesn't return Claude's thinking"; system and developer
  messages "are hoisted and concatenated"; "Most unsupported fields are silently ignored
  rather than producing errors"; `reasoning_effort`, `response_format`, `seed`, `strict`:
  "Ignored"; `usage.prompt_tokens_details`: "Always empty".
- **Google's OpenAI-compatible endpoint** (its own page): Gemini-only features go through an
  `extra_body` nested inside `extra_body` (for example `cached_content`); other parameters
  "will be silently ignored by the compatibility layer"; "Support for the OpenAI libraries is
  still in beta". The reasoning table is in W04.
- **Mastra** (one issue read, source not cloned). `mastra-ai/mastra#24431` (open since
  2026-09-19): provider options set for the primary model are deep-merged into every fallback
  entry and cannot be removed; "a vendor-specific routing option pinned at call time for the
  primary model was forwarded verbatim to a fallback entry on another vendor, which rejected
  the request". An option in one provider's vocabulary held at session level outlives a
  change of model: the same family as W02. kuib's plan does not share it for reasoning (D016
  makes the level neutral and per step); P02-I01's "block typed per format" belongs to the
  offering and so does not travel.
- **TanStack AI**: not read. See Unverified leads.

## What they do that this plan lacks

1. **The provider's own words kept beside the neutral ones.** Since V3 the AI SDK carries
   `raw: string | undefined` beside the unified finish reason and `raw?: JSONObject` beside
   the usage (`ai@provider/src/language-model/v4/language-model-v4-finish-reason.ts:28-32`,
   `ai@provider/src/language-model/v4/language-model-v4-usage.ts:52-58`). The plan's closed
   step has neither (W05, W08).
2. **Parts for tools the provider runs itself.** `providerExecuted?: boolean` on a tool call
   and tool results inside the model's own stream
   (`ai@provider/src/language-model/v4/language-model-v4-tool-call.ts:29`,
   `ai@provider/src/language-model/v4/language-model-v4-stream-part.ts:72-74`); LangChain's
   `ServerToolCall` and `ServerToolResult` (`lc@core/langchain_core/messages/content.py:372`,
   `:425`). P02-I02 does not mention a tool call that kuib does not execute.
3. **What was changed, before the first token.** The AI SDK's stream opens with
   `stream-start`, "stream start event with warnings for the call, e.g. unsupported settings"
   (`ai@provider/src/language-model/v4/language-model-v4-stream-part.ts:82-86`). Its content
   is the weak part (W03); the position is right, and the plan has no such first delta.
4. **Neutral failure kinds, with context overflow named.** `ModelRateLimitError`,
   `ModelTimeoutError`, `ContextOverflowError` and six more
   (`lc@core/langchain_core/exceptions.py:68-123`). The plan says "kind" and lists none (W11).
5. **The provider's raw frames in the stream, on request.** `includeRawChunks` adds `{ type:
   'raw'; rawValue: unknown }` parts beside the parsed ones
   (`ai@provider/src/language-model/v4/language-model-v4-stream-part.ts:101-104`,
   `ai@anthropic/src/anthropic-language-model.ts:1967-1968`). The plan makes the request
   inspectable before sending and says nothing of seeing the response frames of a live call.

## Unverified leads

Not evidence. Each is a claim that was not checked against a source that settles it.

- **Where a mid-conversation system message may sit on Claude.** `vercel/ai#21885` (open,
  labelled `task-bug-reproduction-cannot-reproduce`) quotes an Anthropic error: "role
  'system' must follow a 'user' message or an 'assistant' message ending in a server tool
  result; the directive-only form (content: [] with output_config) is accepted at any
  position". LangChain's code encodes the same rule (CONFIRMED as code, W07). Neither is
  Anthropic's documentation; P01-I02 can settle it with the four captures proposed in W07.
- **The beta header for it.** `mid-conversation-system-2026-04-07` appears in the AI SDK's
  source (`ai@anthropic/src/convert-to-anthropic-prompt.ts:262`) and in
  `BerriAI/litellm#42104`. Anthropic's page was not read; its OpenAI-compatibility page still
  says "Anthropic only supports a single initial system message".
- **A signature split across several `signature_delta` events.** `vercel/ai#19663` claims
  the AI SDK keeps only the last fragment; it is labelled
  `task-bug-reproduction-issue-invalid`. The replace-not-append line it points at is real
  (W09); whether Anthropic ever splits a signature is not established.
- **Key order and the prompt cache on Vertex.** Pull request `BerriAI/litellm#36079` claims
  that serialising `messages` before `system` and `tools` misses the cache; its author "did
  not run this against a live Vertex AI endpoint".
- **What Claude Sonnet 5.5 rejects.** Thinking disabled, a thinking budget, forced tool
  choice and sampling parameters, according to the tables of three subjects (W04, W13).
  Their tables, not Anthropic's statements, and not tested here.
- **Anthropic's automatic caching.** A top-level `cache_control` on the request is used in
  the body shown in `vercel/ai#15681` and handled by LangChain
  (`lc@partners/anthropic/langchain_anthropic/chat_models.py:1912-1917`). If it exists as
  described, the plan's "place cache marks" step (markers, implicit, none) lacks a variant.
- **A lag of weeks for mid-conversation system messages in the AI SDK.** The header's name
  carries 2026-04-07; `vercel/ai#15681` shows `ai` 6.0.191 still re-sorting on 2026-05-28.
  When support landed was not established.
- **AI Gateway billing on the V4 path.** `vercel/ai#20414` (cache-creation tokens not billed
  through `ai@7`) is labelled invalid for the open-source packages and out of scope.
- **Mastra.** Search results only: `mastra-ai/mastra#14559` (thinking signatures dropped from
  thread history), `#24438` (a router model id type that "ends in a catch-all string"),
  `#25516` (later thinking parts lost to a shared cache key).
- **TanStack AI.** Search results only: pull requests `TanStack/ai#1469` (signed thinking
  reordered around provider-run tools) and `#1579` (redacted thinking dropped when
  streaming), release `@tanstack/ai@0.61.0`.
- **`langchain-ai/langchain-google#2005`.** Search result only: thinking blocks rebuilt from
  deltas alone lose a signature-only block.
- **How LiteLLM is tested, and its proxy, cache-injection hook and Responses bridge.** Not in
  the sparse clone.
