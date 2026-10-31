---
title: The pieces of Anthropic Messages and OpenAI chat
date: 2026-10-08
origin: ["conversation 2026-10-08"]
---

# The pieces of Anthropic Messages and OpenAI chat

The owner asked for the two formats to be broken into pieces before the neutral format is
drafted (D020). A piece is one thing a request says or one thing a response carries. This
file lists what the two formats have for each piece. It does not design kuib's format.

How to read a citation. `[A3]` is a reference page listed under Sources, read on 2026-10-08.
`ai:`, `pi:` and `oc:` are source lines in the three translations at the commits listed
there, written `ai:packages/…:123`. Nothing in this file is from memory; what could not be
found is under "Unverified".

## Sources

Every page was fetched on 2026-10-08 between 13:55 and 14:05 UTC and saved as served under
`/var/tmp/kuib-prior-art/research-pieces/`, so each cell can be checked against a file.

How far each page was read. Read section by section: A1, A2, A6, A12, A19, A20, O1, O2, M1,
M2. Read in the parts a cell cites, found by searching the saved file: A3, A4, A5, A7, A8, A9,
A13, A14, A21, A25, A26, O3, O5, O6, O7, O8, M3, M8. Searched for single facts only: A11,
A18, A22, A27, A28, A29, A35 to A39, O4, O11, M4. Saved and not opened: A10, A15, A16, A17,
A23, A24, A30 to A34, O9, O10, M5, M6, M7. No cell rests on a page that was not opened.

### Anthropic — `https://platform.claude.com/docs/en/<path>` (the `.md` form of each page)

| Key | Path | What it is |
|---|---|---|
| A1 | `api/messages/create` | the Messages reference: headers, body, the `Message` object, stream events |
| A2 | `build-with-claude/streaming` | event flow, delta types, raw streams, error recovery |
| A3 | `manage-claude/authentication` | the key headers |
| A4 | `api/versioning` | `anthropic-version`, what may change within a version |
| A5 | `api/beta-headers` | `anthropic-beta` |
| A6 | `api/errors` | statuses, error shape, request id, common validation errors |
| A7 | `api/rate-limits` | limits, `retry-after`, the `anthropic-ratelimit-*` headers |
| A8 | `api/overview` | features and response headers |
| A9 | `models/overview` | model ids and their limits |
| A10 | `about-claude/models/model-ids-and-versions` | aliases and snapshots |
| A11 | `build-with-claude/working-with-messages` | message shapes by example |
| A12 | `build-with-claude/thinking` | adaptive thinking, display, preserving thinking blocks |
| A13 | `build-with-claude/extended-thinking` | the legacy budget form |
| A14 | `build-with-claude/effort` | `output_config.effort` |
| A15 | `build-with-claude/thinking-steering-and-cost` | steering and cost of thinking |
| A16 | `build-with-claude/thinking-tool-workflows` | thinking with tools and across turns |
| A17 | `build-with-claude/thinking-troubleshooting` | the thinking errors by symptom |
| A18 | `build-with-claude/preserved-thinking` | thinking blocks bound to model and conversation |
| A19 | `build-with-claude/prompt-caching` | `cache_control`, limits, what invalidates |
| A20 | `build-with-claude/mid-conversation-system-messages` | a `system` role inside `messages`, tool changes |
| A21 | `build-with-claude/handling-stop-reasons` | each stop reason and what to do |
| A22 | `build-with-claude/refusals-and-fallback` | refusals, `stop_details`, server-side fallback |
| A23 | `agents-and-tools/tool-use/overview` | tool use |
| A24 | `agents-and-tools/tool-use/how-tool-use-works` | the loop |
| A25 | `agents-and-tools/tool-use/define-tools` | declarations, `tool_choice` |
| A26 | `agents-and-tools/tool-use/handle-tool-calls` | results, order rules |
| A27 | `agents-and-tools/tool-use/parallel-tool-use` | several calls in one turn |
| A28 | `agents-and-tools/tool-use/strict-tool-use` | `strict` |
| A29 | `agents-and-tools/tool-use/fine-grained-tool-streaming` | `eager_input_streaming` |
| A30 | `agents-and-tools/tool-use/tool-use-with-prompt-caching` | cache marks on tools |
| A31 | `agents-and-tools/tool-use/tool-reference` | the tools Anthropic defines |
| A32 | `agents-and-tools/tool-use/server-tools` | tools Anthropic runs |
| A33 | `agents-and-tools/tool-use/troubleshooting-tool-use` | tool errors by symptom |
| A34 | `cli-sdks-libraries/libraries/openai-sdk` | Anthropic's own OpenAI-compatible endpoint |
| A35 | `build-with-claude/structured-outputs` | left out: `output_config.format` |
| A36 | `build-with-claude/vision`, `pdf-support`, `files`, `citations`, `search-results` | left out: images, documents, files |
| A37 | `build-with-claude/batch-processing` | left out: batches |
| A38 | `build-with-claude/context-editing`, `compaction`, `task-budgets`, `fast-mode`, `token-counting`, `context-windows`, `api/service-tiers` | left out: other request features |
| A39 | `test-and-evaluate/strengthen-guardrails/handle-streaming-refusals` | a refusal in mid-stream |

### OpenAI — `https://developers.openai.com/api/<path>` (the `.md` form of each page)

`platform.openai.com/docs/api-reference/chat/create` answers 403 to a plain HTTP client and
redirects a browser to `developers.openai.com/api/reference/…`, where the same reference is
served as markdown.

| Key | Path | What it is |
|---|---|---|
| O1 | `reference/resources/chat` | the Chat resource: create, its body, the returned object, the domain types |
| O2 | `reference/resources/chat/subresources/completions/streaming-events` | the chunk object |
| O3 | `reference/overview` | authentication, headers, request ids |
| O4 | `docs/guides/function-calling` | tools |
| O5 | `docs/guides/reasoning` | reasoning models |
| O6 | `docs/guides/prompt-caching` | implicit caching, `prompt_cache_key` |
| O7 | `docs/guides/error-codes` | statuses and error types |
| O8 | `docs/guides/rate-limits` | limits and the `x-ratelimit-*` headers |
| O9 | `docs/guides/streaming-responses` | streaming |
| O10 | `docs/guides/structured-outputs` | left out: `response_format` |
| O11 | `openai/openai-openapi@498c71d` (branch `manual_spec`), `openapi.yaml` | the OpenAPI document, used only to check a field the pages leave unclear |

### MiMo — `https://mimo.mi.com/static/docs/<path>.md`

`mimo.mi.com/docs/en-US/…` is an application shell; `mimo.mi.com/llms.txt` lists the same
pages as markdown under `/static/docs/`.

| Key | Path | What it is |
|---|---|---|
| M1 | `api/chat/anthropic-api` | the Anthropic-compatible endpoint |
| M2 | `api/chat/openai-api` | the OpenAI-compatible endpoint |
| M3 | `api/guidance/error-codes` | errors |
| M4 | `api/guidance/rate-limit` | limits |
| M5 | `api/guidance/model-hyperparameters` | sampling defaults |
| M6 | `quick-start/summary/model` | model ids |
| M7 | `quick-start/usage-guide/text-generation/deep-thinking` | thinking |
| M8 | `quick-start/faq/api-integration`, `tokenplan/Token Plan/quick-access` | hosts and keys |

### Translations, read only

| Key | Repository | Commit | Read |
|---|---|---|---|
| ai | `vercel/ai` | `5028fa4` | `packages/anthropic/src`, `packages/openai-compatible/src`, `packages/openai/src` (the chat implementation and what it imports), `packages/provider-utils/src` |
| pi | `badlogic/pi-mono` | `1cedd32` | `packages/ai/src/api/anthropic-messages.ts`, `openai-completions.ts`, `transform-messages.ts`, what they import from `packages/ai/src/utils`, `compat.ts`, `types.ts`, `packages/ai/scripts/generate-models.ts`, `packages/ai/CHANGELOG.md` |
| oc | `sst/opencode` | `663fbd7` | `packages/llm/src/protocols`, `packages/llm/src/route`, `packages/llm/src/providers`, and `packages/opencode/src/provider/transform.ts` |

The three commits were checked with `git rev-parse` before the sweep and the clones are
unchanged after it. `ai:path:123` stands for `vercel/ai@5028fa4:path:123`, and so for `pi:`
and `oc:`.

## What a request says

Twenty-three pieces. Five are not in the plan's first cut and are marked (new): they are things
both formats say separately from the piece the first cut folded them into. The Claude rows of
P07-I02 are Sonnet 5.5 (`claude-sonnet-5-5`), Haiku 5.5 (`claude-haiku-5-5`) and Haiku 4.5
(`claude-haiku-4-5`, snapshot `claude-haiku-4-5-20251001`) [A1][A9]; MiMo 2.6 Pro is
`mimo-v2.6-pro` on both of its endpoints [M1][M2].

| Piece | Anthropic Messages | OpenAI chat | Differs between served models | Sources |
|---|---|---|---|---|
| Address and slug | `POST https://api.anthropic.com/v1/messages`; `model` in the body, a string | `POST https://api.openai.com/v1/chat/completions`; `model` in the body, a string | Host and path prefix. MiMo: `https://api.xiaomimimo.com/anthropic/v1/messages` and `https://api.xiaomimimo.com/v1/chat/completions`; its token-plan hosts are `https://token-plan-{cn,sgp,ams}.xiaomimimo.com/anthropic` and `…/v1`. Bedrock prefixes Claude ids with `anthropic.` | [A1] [A6] [A9] [O1] [M1] [M2] [M8] |
| Authentication | `Authorization: Bearer <key>`, or the legacy `x-api-key: <key>`; `anthropic-workspace-id` when a key spans workspaces | `Authorization: Bearer <key>`; optional `OpenAI-Organization`, `OpenAI-Project` | MiMo, both endpoints: `api-key: <key>` or `Authorization: Bearer <key>`; `x-api-key` is not listed. A token-plan key (`tp-…`) and a pay-as-you-go key (`sk-…`) each work only on their own hosts | [A3] [A8] [O3] [M1] [M2] [M8] |
| Version and feature switches (new) | `anthropic-version: 2023-06-01`, required; `anthropic-beta: <name>,<name>`; `content-type: application/json`, required | No version header is sent; the response reports `openai-version: 2020-10-01`. `Content-Type: application/json` | MiMo's Anthropic page lists neither `anthropic-version` nor `anthropic-beta` | [A4] [A5] [A8] [O3] [M1] |
| Base instructions | Top-level `system`: a string, or an array of `{type: "text", text, cache_control?, citations?}`; `text` has a minimum length of 1 | A message `{role: "developer", content, name?}` or `{role: "system", content, name?}`; `content` is a string or an array of `{type: "text", text, prompt_cache_breakpoint?}` | The role name: "With o1 models and newer, `developer` messages replace the previous `system` messages". MiMo's OpenAI page lists both roles; its Anthropic page has `system` as a string or text blocks | [A1] [O1] [M1] [M2] |
| Instruction inside the conversation | A message `{role: "system", content}` inside `messages`; `content` is a string or blocks of type `text`, `tool_addition`, `tool_removal`; under betas it may carry `output_config.effort` and `clear_at: "next_user_message"` | A `developer` or `system` message at any index of `messages`; the reference gives no rule about position | Claude: accepted on Fable 5.1, Mythos 5.1, Fable 5, Mythos 5, Opus 5.5, Opus 5, Opus 4.8, Sonnet 5.5, Haiku 5.5; "not available on Claude Sonnet 5"; Haiku 4.5 is not in the list. MiMo's Anthropic page lists `system` as a message role and says nothing of placement | [A1] [A20] [O1] [M1] |
| What the user said | `{role: "user", content}`; `content` is a string or blocks; text is `{type: "text", text, cache_control?}` with `text` of minimum length 1 | `{role: "user", content, name?}`; `content` is a string or parts; text is `{type: "text", text, prompt_cache_breakpoint?}` | Nothing found | [A1] [O1] |
| What the model said | `{role: "assistant", content}`; text is `{type: "text", text, cache_control?, citations?}` | `{role: "assistant", content?, refusal?, name?}`; `content` is a string, null, or an array of `{type: "text", text}` or exactly one `{type: "refusal", refusal}`; "Required unless `tool_calls` or `function_call` is specified" | MiMo's OpenAI page: text parts only, no `refusal` | [A1] [O1] [M2] |
| Reasoning sent back | Blocks in the assistant message, unmodified and in their original order: `{type: "thinking", thinking, signature}` and `{type: "redacted_thinking", data}` | Nothing. The assistant message has no reasoning field; `reasoning_content` and `reasoning` do not occur in the reference. Encrypted reasoning items exist only in the Responses API | Claude: which model reads whose blocks; whether the API keeps earlier turns' blocks (Opus 4.5 and later, Sonnet 4.6 and later, Haiku 5.5) or strips all but the last turn's (Haiku 4.5); the block is bound to its model and to everything sent before it on Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5, and on Sonnet 5.5 and Haiku 5.5 also to the account. MiMo's Anthropic page: `thinking` block with `thinking` required and `signature` optional. MiMo's OpenAI page: "recommended to keep all previous `reasoning_content` in the messages array", yet its assistant message schema lists no such field | [A1] [A6] [A12] [A18] [O1] [O5] [M1] [M2] |
| Tool declarations | `tools[]`: `{type?: "custom", name, description?, input_schema: {type: "object", properties?, required?}, strict?, cache_control?, eager_input_streaming?, input_examples?, defer_loading?, allowed_callers?}`; `name` matches `^[a-zA-Z0-9_-]{1,128}$` | `tools[]`: `{type: "function", function: {name, description?, parameters?, strict?}}`; `name` is letters, digits, `_`, `-`, at most 64 long. Also `{type: "custom", custom: {name, description?, format?}}` | Name length 128 against 64. OpenAI: "Chat Completions does not support function calling with GPT-6 Astra or GPT-6.1 Sol". MiMo's Anthropic page lists only `type: custom`, `name`, `description`, `input_schema` | [A1] [A25] [O1] [O5] [M1] [M2] |
| Tool choice | `tool_choice`: `{type: "auto"}`, `{type: "any"}`, `{type: "tool", name}`, `{type: "none"}` | `tool_choice`: `"none"`, `"auto"`, `"required"`, `{type: "function", function: {name}}`, `{type: "allowed_tools", allowed_tools: {mode, tools}}`, `{type: "custom", custom: {name}}`; default `none` without tools and `auto` with them | Claude: `any` and `tool` return 400 on Opus 5.5, Sonnet 5.5, Fable 5.1, Mythos 5.1; accepted on Haiku 5.5 with thinking on; not accepted with `thinking.type: "enabled"` (Haiku 4.5 with a budget). MiMo, both endpoints: any value other than `auto` is removed by the backend and the call behaves as `auto` | [A1] [A6] [A12] [A25] [O1] [M1] [M2] |
| Parallel tool calls (new) | `disable_parallel_tool_use: boolean` inside `tool_choice` of type `auto`, `any` or `tool` | Top-level `parallel_tool_calls: boolean` | MiMo's Anthropic page lists `disable_parallel_tool_use`; its OpenAI page does not list `parallel_tool_calls` | [A1] [O1] [M1] [M2] |
| Tool call sent back | A block in the assistant message: `{type: "tool_use", id, name, input, cache_control?, caller?}`; `input` is an object; `id` matches `^[a-zA-Z0-9_-]+$`; `name` is 1 to 200 long | On the assistant message: `tool_calls[]: {id, type: "function", function: {name, arguments}}`; `arguments` is a string of JSON | Nothing found | [A1] [O1] |
| Tool result | A block in a `user` message: `{type: "tool_result", tool_use_id, content?, is_error?, cache_control?}`; `content` is a string or blocks (`text`, `image`, `document`, `search_result`, `tool_reference` and one more kind) | A message `{role: "tool", tool_call_id, content}`; `content` is a string or an array of `{type: "text", text}`; no error flag | MiMo's OpenAI page: a tool message may also carry image, audio and video parts | [A1] [A26] [O1] [M2] |
| Turn order | `user` and `assistant` alternate; consecutive turns of one role are combined; every `tool_result` sits in the user message right after the assistant message that holds its `tool_use`, before any text | The reference states no order rule for `tool` messages or for roles | With a budget (Haiku 4.5, `thinking.type: "enabled"`) the final assistant turn must begin with a thinking block | [A1] [A13] [A26] [A27] [O1] |
| Asking for reasoning | `thinking`: `{type: "adaptive", display?}`, `{type: "enabled", budget_tokens, display?}`, `{type: "disabled"}`, `{type: "between_tools"}`; under a beta, `block_binding.prefix_mismatch_behavior` | No on/off field; `reasoning_effort: "none"` is the nearest | Sonnet 5.5: `adaptive` or none sent (adaptive), `between_tools` as the off switch at `high` effort or below, `disabled` and `enabled` are 400. Haiku 5.5: `adaptive`, or `disabled` at `high` or below. Haiku 4.5: `enabled` with a budget, or `disabled`; `adaptive` is 400. MiMo, both endpoints: `thinking: {type: "enabled"}` or `"disabled"`, default `enabled`; on its OpenAI endpoint this is a top-level field OpenAI's schema does not have | [A1] [A6] [A12] [O1] [M1] [M2] |
| Effort (new) | `output_config.effort`: `low`, `medium`, `high`, `xhigh`, `max`; per message, inside a `system`-role message, under a beta | `reasoning_effort`: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`. Separately `verbosity`: `low`, `medium`, `high` | Claude: default `high`, but `medium` on Opus 5.5 and Haiku 5.5; Haiku 4.5 is not among the models that support effort. OpenAI: "Not all reasoning models support every value"; GPT-6 Astra answers 400 to `none`. MiMo: neither page has an effort field | [A1] [A14] [A20] [O1] [O5] [M1] [M2] |
| Whether reasoning text is returned (new) | `thinking.display`: `summarized`, `omitted`, and `updates` under a beta | Nothing; chat returns no reasoning text | Claude: default `omitted` on Sonnet 5.5 and Haiku 5.5, `summarized` on Opus 4.6, Sonnet 4.6 and earlier models. MiMo returns its thinking text with no switch | [A1] [A12] [O2] [M1] [M2] |
| Cache marks | `cache_control: {type: "ephemeral", ttl?: "5m" or "1h"}` on a tool, a `system` text block, or a message block (`text`, `image`, `document`, `tool_use`, `tool_result`); top-level `cache_control` marks the last cacheable block | `prompt_cache_breakpoint: {mode: "explicit"}` on a content part; `prompt_cache_options: {mode: "implicit" or "explicit", ttl: "30m"}`; `prompt_cache_key`; `prompt_cache_retention` (deprecated) | OpenAI: explicit breakpoints are "Supported for `gpt-5.6` and later models"; earlier ones cache implicitly only. Claude: the shortest prefix that caches is 512 tokens on Sonnet 5.5 and Haiku 5.5 and 4,096 on Haiku 4.5. MiMo: neither page has a cache field, yet both report cached tokens in usage | [A1] [A19] [O1] [O6] [M1] [M2] |
| Output limit | `max_tokens`, required, minimum 0 (0 warms the cache without output) | `max_completion_tokens`, covering visible and reasoning tokens; `max_tokens` is deprecated and "not compatible with o-series models" | Claude ceilings: 128K on Sonnet 5.5 and Haiku 5.5, 64K on Haiku 4.5. MiMo's Anthropic page: `max_tokens` not required, default 131072, range 1 to 131072. MiMo's OpenAI page lists only `max_completion_tokens` | [A1] [A12] [O1] [M1] [M2] |
| Sampling | `temperature` (0 to 1), `top_p` (0 to 1), `top_k`; all three marked deprecated | `temperature` (0 to 2), `top_p`, `frequency_penalty`, `presence_penalty`, `seed`, `logit_bias`, `n`, `logprobs`, `top_logprobs` | Claude models after Opus 4.6 (Sonnet 5.5, Haiku 5.5): only `temperature` 1.0 and `top_p` of 0.99 or more are accepted, `top_k` never; anything else is 400. Haiku 4.5: accepted, but with thinking on `temperature` and `top_k` are incompatible and `top_p` must be 0.95 to 1. MiMo: `temperature` 0 to 1.5, `top_p` 0.01 to 1; with thinking on both are overridden to 1.0 and 0.95 without an error | [A1] [A12] [O1] [M1] [M2] |
| Stop sequences (new) | `stop_sequences: string[]` | `stop`: a string or up to 4 strings; "Not supported with latest reasoning models `o3` and `o4-mini`" | MiMo: `stop_sequences` on the Anthropic page, `stop` (up to 4) on the OpenAI page | [A1] [O1] [M1] [M2] |
| Stream switch | `stream: true`. Per tool, `eager_input_streaming` changes how the tool's input streams | `stream: true`; `stream_options: {include_usage?, include_obfuscation?}` | MiMo's OpenAI page does not list `stream_options` | [A1] [A29] [O1] [M2] |
| Cut output sent back | A last message of role `assistant` is a prefill: the response "will continue immediately from the content in that message". Guidance for an interrupted stream: on Claude 4.5 and earlier, the partial text as an assistant message; on 4.6 and later, a user message holding the partial text and an instruction to continue | Nothing found: the reference does not describe continuing a partial assistant message (`prefill` does not occur in it) | Claude 4.6 and later (Sonnet 5.5, Haiku 5.5) answer 400 to a prefilled last assistant message; Haiku 4.5 accepts one, but not with thinking on | [A1] [A2] [A6] [A12] [O1] |

## What a response carries

Eighteen pieces; four are not in the first cut (new).

| Piece | Anthropic Messages | OpenAI chat | Differs between served models | Sources |
|---|---|---|---|---|
| Framing | Server-sent events, each with `event: <name>` and `data: <json>`; the JSON repeats the name in `type`. No `[DONE]`: version `2023-06-01` removed it | Server-sent events with `data: <json>` lines and no event names; the last line is `data: [DONE]` | Nothing found | [A2] [A4] [O1] |
| Step opens | `message_start`: `message: {id, type: "message", role: "assistant", model, content: [], stop_reason: null, stop_sequence: null, usage}` | The first chunk: `{id, object: "chat.completion.chunk", created, model, system_fingerprint?, choices: [{index, delta: {role: "assistant", content: ""}, finish_reason: null}]}`; every chunk repeats `id`, `created` and `model` | Nothing found | [A1] [A2] [O1] [O2] |
| Part boundaries | `content_block_start: {index, content_block}` and `content_block_stop: {index}`; `index` is the block's position in the final `content` | None. A part is implied by the `delta` field that is filled; tool calls are told apart by `tool_calls[].index`; choices by `choices[].index` | Nothing found | [A1] [A2] [O2] |
| Text | `content_block_delta` with `delta: {type: "text_delta", text}` | `choices[].delta.content`, a string or null | Nothing found | [A1] [O2] |
| Reasoning | A block opened as `{type: "thinking", thinking: "", signature: ""}`, then `delta: {type: "thinking_delta", thinking}`. With `display: "omitted"` one `thinking_delta` with an empty string | No field: the chunk's `delta` has `audio`, `content`, `function_call`, `refusal`, `role`, `tool_calls` | MiMo's OpenAI page: `delta.reasoning_content` and `message.reasoning_content`. MiMo's Anthropic page: `thinking_delta` | [A1] [A2] [O2] [M1] [M2] |
| Tool call | `content_block_start` with `{type: "tool_use", id, name, input: {}}`, then `delta: {type: "input_json_delta", partial_json}` fragments, to be joined and parsed at `content_block_stop`; the first fragment may be `""` | `choices[].delta.tool_calls[]: {index, id?, type?: "function", function?: {name?, arguments?}}`; `arguments` fragments are joined per `index` | Nothing found in the references | [A1] [A2] [O2] |
| Opaque payload | `delta: {type: "signature_delta", signature}`, sent just before the block's `content_block_stop`; a `redacted_thinking` block arrives whole, with `data`, in its `content_block_start` | None | MiMo's Anthropic page: the stream's delta types are `text_delta`, `thinking_delta`, `input_json_delta`, with no `signature_delta`; the non-streaming thinking block does list `signature` | [A1] [A2] [O2] [M1] |
| Why it stopped | `message_delta.delta.stop_reason`: `end_turn`, `max_tokens`, `stop_sequence`, `tool_use`, `pause_turn`, `refusal`, `model_context_window_exceeded`; null in `message_start` | `choices[].finish_reason`: `stop`, `length`, `tool_calls`, `content_filter`, `function_call` (deprecated); null until the last chunk that has a choice | MiMo's Anthropic page: `end_turn`, `max_tokens`, `tool_use`, `content_filter`, `repetition_truncation`, and no `stop_sequence`. MiMo's OpenAI page: `stop`, `length`, `tool_calls`, `content_filter`, `repetition_truncation`. Claude models before Sonnet 4.5 return `model_context_window_exceeded` only with a beta header | [A1] [A21] [O2] [M1] [M2] |
| Which stop sequence matched (new) | `message_delta.delta.stop_sequence`, a string or null | None: `finish_reason` is `stop` for a natural stop and for a stop sequence alike, and the text does not contain the sequence | MiMo's Anthropic page lists no `stop_sequence` field | [A1] [O1] [O2] [M1] |
| Refusal detail (new) | `message_delta.delta.stop_details: {type: "refusal", category, explanation}`; `category` is `cyber`, `bio`, `frontier_llm`, `reasoning_extraction`, `general_harms` or null | `choices[].delta.refusal`, a string; `finish_reason: "content_filter"` when content was omitted | MiMo: `content_filter` as a stop reason on both pages, no detail field | [A1] [A39] [O2] [M1] [M2] |
| Usage | In `message_start.message.usage`, then cumulative in every `message_delta.usage`: `input_tokens` (cached tokens not included), `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens`, `cache_creation.{ephemeral_5m_input_tokens, ephemeral_1h_input_tokens}`, `output_tokens_details.thinking_tokens`, `server_tool_use`, `service_tier`, `inference_geo`. "Total input tokens … is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`" | Only when `stream_options.include_usage` is set: one extra chunk before `[DONE]` with `choices: []` and `usage: {prompt_tokens, completion_tokens, total_tokens, prompt_tokens_details: {cached_tokens, cache_write_tokens, audio_tokens, image_tokens, text_tokens}, completion_tokens_details: {reasoning_tokens, text_tokens, audio_tokens, accepted_prediction_tokens, rejected_prediction_tokens}}`; `usage` is null on every other chunk, and the final chunk may never come if the stream is interrupted | MiMo's Anthropic page: `input_tokens`, `output_tokens`, `cache_read_input_tokens`, and no cache-write count. MiMo's OpenAI page: `prompt_tokens`, `completion_tokens`, `total_tokens`, `completion_tokens_details.reasoning_tokens`, `prompt_tokens_details.{cached_tokens, audio_tokens, image_tokens, video_tokens}` | [A1] [A2] [O1] [O2] [M1] [M2] |
| Keep-alive and unknown frames | `ping` events, any number, anywhere; "new event types may be added, and your code should handle unknown event types gracefully" | Not described. A chunk may have empty `choices`; a chunk may carry an `obfuscation` padding field | MiMo's Anthropic page lists six event names and no `ping` | [A2] [A4] [O1] [O2] [M1] |
| Failure before the stream | A status and `{type: "error", error: {type, message}, request_id}`. `error.type`: `invalid_request_error` 400, `authentication_error` 401, `billing_error` 402, `permission_error` 403, `not_found_error` 404, `conflict_error` 409, `request_too_large` 413, `rate_limit_error` 429, `api_error` 500, `timeout_error` 504, `overloaded_error` 529. `retry-after` in seconds, absent on a spend-cap 429 | A status and `{error: {message, type, param, code}}`. `Retry-After` in seconds on some 429 and 503 answers | MiMo: a table of statuses (400, 401, 402, 403, 404 read); the body's shape is not documented | [A6] [A7] [O7] [O8] [O11] [M3] |
| Failure inside the stream | After a 200: `event: error` with `data: {"type": "error", "error": {"type": "overloaded_error", "message": "Overloaded"}}` | Not described for chat completions in the reference | MiMo: not documented on either page | [A2] [A6] [O1] [O2] |
| Step ends | `message_stop` | `data: [DONE]` | MiMo's OpenAI page does not mention `[DONE]` | [A2] [O1] [M2] |
| Who answered | Header `request-id`; `message.id` and `message.model` in `message_start`; headers `anthropic-organization-id`, `anthropic-workspace-id` | Header `x-request-id`; `id`, `model`, `system_fingerprint`, `service_tier` on each chunk; headers `openai-organization`, `openai-processing-ms`, `openai-version`; the client may send `X-Client-Request-Id` | Nothing found | [A6] [A8] [O2] [O3] |
| Rate-limit state (new) | Headers `anthropic-ratelimit-{requests,tokens,input-tokens,output-tokens}-{limit,remaining,reset}`, `reset` in RFC 3339; `retry-after` | Headers `x-ratelimit-{limit,remaining,reset}-{requests,tokens}` and the same for `project-tokens`; `Retry-After` | MiMo's limits page describes requests and tokens per minute for an account and a 429; it lists no headers | [A7] [O3] [O8] [M4] |
| What the server changed (new) | Under the `thinking-binding-controls-2026-08-01` beta, `input_transformations` in `message_start`: the thinking blocks the API dropped or let through | None | Tied to the beta header; the pages read do not list the models that return it | [A2] [A12] [A18] |

## Rules a piece carries

Only what a reference states. Where a reference names a limit and not the answer to breaking
it, that is said, and the open half is under "Unverified". An answer quoted in full is the
message the page prints.

### Address, authentication, version

- Anthropic requires `anthropic-version` and `content-type: application/json`, and
  `Authorization` "unless `x-api-key` is set" [A8]. A bad key is 401 `authentication_error`
  [A6].
- An unknown `anthropic-beta` name, or one the organisation cannot use, is 400
  `invalid_request_error`: "Unexpected value(s) `invalid-beta-name` for the `anthropic-beta`
  header." Several names go in one header, separated by commas [A5].
- A Messages request over 32 MB is 413 `request_too_large`; "Cloudflare returns this error
  before the request reaches the API servers" [A6].
- MiMo: a token-plan key used on the pay-as-you-go host, or the reverse, is 401 [M3] [M8].

### Messages and turn order

- Anthropic: each message has `role` and `content`; at most 100,000 messages; a text block's
  `text` has a minimum length of 1; "Consecutive `user` or `assistant` turns in your request
  will be combined into a single turn" [A1]. The reference does not say the first message must
  be of role `user`.
- OpenAI: an assistant message's `content` is "Required unless `tool_calls` or `function_call`
  is specified"; a content array holds "one or more of type `text`, or exactly one of type
  `refusal`" [O1].

### Instruction inside the conversation (Anthropic)

- A `system` message that carries content "must immediately follow a `user` turn (including a
  `user` turn that carries `tool_result` blocks) or an `assistant` turn ending in a server tool
  result, and must precede an `assistant` turn or end the array". It cannot be the first entry
  and "cannot sit between a `tool_use` block and its `tool_result`". "Placing it elsewhere
  returns a 400 error" [A20].
- A message with empty `content` that only sets `output_config.effort` "is accepted anywhere
  in `messages`". Consecutive `system` messages "are judged together" [A20].
- Later system messages take precedence over earlier ones, and over the top-level `system`,
  "for the turns that follow them" [A20].
- `clear_at` without its beta header "is rejected as an unknown field"; a turn-scoped message
  is text only and, once cleared, "must stay in `messages` byte-for-byte" [A20].
- A tool added by `tool_addition` under a name that belongs to another type of tool is 400
  with `error.details.error_code` `tool_name_conflict`; too many tools is 400 with
  `available_tools_limit_exceeded` [A20].

### Reasoning sent back (Anthropic)

- "Required: within a tool-use turn, pass thinking blocks back. Recommended: across turns,
  pass everything back. Allowed: outside tool use, omit prior turns' thinking" [A12].
- In the latest assistant message the `thinking` and `redacted_thinking` blocks may not be
  edited, reordered or partly dropped, "including blocks whose `thinking` field is empty".
  Breaking it is 400 `invalid_request_error`, the message starting with the block's position
  (`messages.1.content.0`): "`thinking` or `redacted_thinking` blocks in the latest assistant
  message cannot be modified. These blocks must remain as they were in the original response."
  One exception: text placed in the empty `thinking` field of an omitted block "is ignored
  rather than rejected" [A6] [A12].
- A block from a model the target model cannot read "is dropped rather than rejected", without
  billing [A6] [A12].
- On Fable 5.1, Opus 5.5, Sonnet 5.5 and Haiku 5.5 a replayed block is valid "only while the
  `system` prompt, `tools`, and messages that preceded it are unchanged". For accounts created
  on or after 2026-08-31, and for any request that sets
  `thinking.block_binding.prefix_mismatch_behavior: "error"`, a changed prefix is 400:
  "messages.{i}.content.{j}: Invalid `signature` in `thinking` block. The block is bound to a
  different conversation." With `"drop_block"` the block is dropped and the request succeeds.
  `block_binding` without the `thinking-binding-controls-2026-08-01` header is 400 ending in
  "block_binding: Extra inputs are not permitted" [A6].
- A thinking block cannot carry `cache_control` [A19].

### Tool declarations

- Anthropic: `name` must match `^[a-zA-Z0-9_-]{1,128}$`; `input_schema.type` is `"object"`
  [A1] [A25]. An `input_examples` entry that does not fit the schema is 400 [A25]. An
  Anthropic-defined tool type the model lacks is 400: "'claude-opus-5-5' does not support tool
  types: computer_20251124." [A6].
- OpenAI: `function.name` is letters, digits, underscores and dashes, at most 64 long [O1].
  With `strict: true`, `additionalProperties` must be `false` on every object and every
  property must be `required`; otherwise "the request will be rejected with details about the
  missing constraints" [O4].

### Tool choice

- Anthropic: `any` or `tool` on Opus 5.5, Sonnet 5.5, Fable 5.1 or Mythos 5.1 is 400:
  "tool_choice: type "tool" and "any" are not supported for this model." The same on the token
  counting endpoint. `any` and `tool` are also refused with `thinking.type: "enabled"` [A6]
  [A25].
- With `any` or `tool` "the API prefills the assistant message", so no text comes before the
  `tool_use` block [A25]. Changing `tool_choice` invalidates the cached message blocks [A19].
- MiMo, both endpoints: "When a value other than `auto` is passed … the backend will remove
  this field by default, and the model response behavior will still be equivalent to the
  `auto` mode" [M1] [M2]. No error.

### Tool result

- Anthropic: "Tool result blocks must immediately follow their corresponding tool use blocks
  in the message history. You cannot include any messages between the assistant's tool use
  message and the user's tool result message." In that user message "the tool_result blocks
  must come FIRST in the content array. Any text must come AFTER all tool results." Breaking
  it is 400; the message contains "tool_use ids were found without tool_result blocks
  immediately after" [A26].
- "return one `tool_result` for each `tool_use` block, all together in the next user message"
  [A27].
- A failed tool is a `tool_result` with `is_error: true` and the error text in `content`
  [A26]. OpenAI's tool message has no such flag [O1].
- OpenAI: the reference gives `tool_call_id` and no rule about where a `tool` message sits
  [O1].

### Asking for reasoning, effort, display

The answers Anthropic's errors page prints [A6], with the table of [A12]:

| Sent | To | Answer |
|---|---|---|
| `thinking: {type: "enabled"}` | Claude 4.7 and later (Sonnet 5.5, Haiku 5.5) | 400: ""thinking.type.enabled" is not supported for this model. Use "thinking.type.adaptive" and "output_config.effort" to control thinking behavior." |
| `thinking: {type: "adaptive"}` | Claude 4.5 and earlier (Haiku 4.5) | 400: "adaptive thinking is not supported on this model" |
| `thinking: {type: "disabled"}` | Sonnet 5.5 | 400: "To turn thinking off on this model, send "thinking": {"type": "between_tools"} instead of {"type": "disabled"}." |
| `thinking: {type: "disabled"}` | Opus 5.5, Fable 5.1, Fable 5, Mythos 5.1, Mythos 5 | 400: ""thinking.type.disabled" is not supported for this model." |
| `thinking: {type: "between_tools"}` | any model but Sonnet 5.5 | 400: ""thinking.type.between_tools" is not supported for this model." |
| `between_tools` (Sonnet 5.5) or `disabled` (Haiku 5.5) with effort `xhigh` or `max` | | 400: "output_config.effort 'xhigh' is not supported when thinking is disabled on this model. Use effort 'high' or below, or enable thinking." |
| a per-message `output_config.effort` that differs, with thinking off | Sonnet 5.5, Haiku 5.5 | 400: "messages.N: output_config.effort 'low' differs from the 'high' in effect before it; effort cannot change when thinking is disabled on this model." |

- No `thinking` field: adaptive thinking on Sonnet 5.5 and Haiku 5.5; thinking off on Haiku
  4.5 [A12].
- A budget is at least 1,024 ("The API rejects smaller values") and less than `max_tokens`
  [A13].
- `display` is invalid with `type: "disabled"` [A12].
- Changing the thinking configuration or the top-level effort between requests invalidates the
  cached message blocks, and on some models the tool and system caches too; an effort change
  carried in a `system`-role message does not [A19].
- OpenAI: `reasoning_effort: "none"` to GPT-6 Astra "returns HTTP 400"; GPT-6.1 Sol "does not
  support `none` or `minimal`" [O5].
- MiMo: with thinking on, `temperature` and `top_p` "will be forcibly overridden" to 1.0 and
  0.95 [M1] [M2]. No error.

### Cache marks

- Anthropic: "up to 4 cache breakpoints"; a top-level `cache_control` "uses one of the 4
  available breakpoint slots". With 4 explicit marks and the top-level one, "the API returns a
  400 error". A last block already marked with a different TTL, plus the top-level mark, is
  400 [A19].
- "Cache entries with longer TTL must appear before shorter TTLs" [A19].
- The prefix is hashed in the order `tools`, `system`, `messages`; a change at one level
  invalidates it and the levels after it [A19].
- A lookup checks at most 20 block positions back from a mark [A19].
- A prefix shorter than the model's minimum (512 tokens on Sonnet 5.5 and Haiku 5.5, 4,096 on
  Haiku 4.5) "will be processed without caching, and no error is returned" [A19].
- "Empty text blocks cannot be cached" [A19].
- OpenAI: "Each request can write up to four breakpoints"; in `implicit` mode one of the four
  is OpenAI's own; `ttl` accepts only `30m`; in `explicit` mode with no breakpoint "the
  request does not use prompt caching"; the shortest prefix that caches is 1,024 tokens on
  GPT-5.6 and later [O1] [O6].

### Output limit, sampling, stop sequences

- Anthropic: `max_tokens` is required, and thinking tokens count toward it [A1] [A13].
- Anthropic, models after Opus 4.6: a `temperature` other than 1.0, a `top_p` under 0.99, or
  any `top_k` "will be rejected with a 400 error" [A1].
- OpenAI: `stop` holds up to 4 sequences; `max_tokens` "is not compatible with o-series
  models" [O1].
- MiMo: the output limit must be within 1 to 131072; `stop` up to 4 [M1] [M2].

### Cut output sent back

- Anthropic, Claude 4.6 and later: a last message of role `assistant` is 400: "This model
  does not support assistant message prefill. The conversation must end with a user message."
  [A6]. "You can't prefill the assistant response while thinking is on" [A12].
- For an interrupted stream: "Tool use and extended thinking blocks cannot be partially
  recovered. You can resume streaming from the most recent text block" [A2].
- If a response ends on `max_tokens` inside a tool call, "retry the request with a higher
  `max_tokens` value to get the full tool use" [A21].

### The stream

- Anthropic: the order is `message_start`, then blocks (`content_block_start`, deltas,
  `content_block_stop`), then "one or more `message_delta` events", then `message_stop`.
  "The token counts shown in the `usage` field of the `message_delta` event are cumulative"
  [A2]. `stop_reason` is "`null` in the initial `message_start` event" and "Provided in the
  `message_delta` event" [A21].
- OpenAI: `stream_options` is set "Only … when you set `stream: true`"; the usage chunk comes
  "before the `data: [DONE]` message" with `choices` "always … an empty array" [O1].

### Why it stopped

- `refusal` is "a normal HTTP 200 response, not an error" [A21]; after it "you must reset the
  conversation context before continuing" [A39].
- `pause_turn`: "Send the assistant content back to continue" [A21]. It only arises with
  tools Anthropic runs.
- `end_turn` can come with no content, "particularly after tool results"; "Sending the empty
  response back won't help" [A21].

### Failures

- Anthropic: 429 `rate_limit_error` carries `retry-after` in seconds, except when the cause is
  the tier's spend cap; "an error can occur after the API returns a 200 response", as an
  `error` event [A6] [A7].
- OpenAI: `Retry-After` "may be present on `429` responses caused by a temporary rate limit
  and `503` responses caused by temporary model overload"; "If `Retry-After` is missing,
  increase the delay between retries and add a small random delay" [O8].
- MiMo's statuses: 400, 401, 402, 403, 404, 421 (content filter), 429, 500, 503 [M3].

## What three translations needed that the references do not say

How this was compiled. Three read-only sub-agents each read one translation in full and wrote
every special case with one cited line and the text of that line: 342 for the AI SDK, 269 for
pi, 257 for opencode (61 of those from its older runtime, `packages/opencode/src/provider/transform.ts`,
which the brief did not name and which holds most of opencode's per-model workarounds). A
script printed each of the 868 cited lines from the clone and compared it with the quoted
text: all match. I read every entry as a row of the tables below, and opened the source
around 71 of them, which are the ones the summary below rests on. What an entry says the code does
is otherwise the sub-agent's reading. The sub-agents' longer explanation of each entry is in
`/var/tmp/kuib-prior-art/research-pieces/findings/{ai-sdk,pi,opencode}.md`, outside the
repository.

A `:123` after a full path is another line of the same file.

### Where a translation and a reference disagree

- **Unknown frames.** Anthropic: "handle unknown event types gracefully" [A2]. The AI SDK
  validates each frame against a closed union, so an unknown event type becomes an error part
  (`ai:packages/anthropic/src/anthropic-api.ts:1131`). pi skips unknown event names
  (`pi:packages/ai/src/api/anthropic-messages.ts:547`) but throws on a stop reason it does not
  know, under the comment "Handle unknown stop reasons gracefully" (`:1637`). opencode ignores
  unknown events and maps an unknown stop reason to `unknown`
  (`oc:packages/llm/src/protocols/anthropic-messages.ts:821`, `:563`). Believed: the
  reference. A reader has to pass over what it does not know.
- **A beta for the `system` role.** [A20]: "No beta header is required". The AI SDK adds
  `mid-conversation-system-2026-04-07` (`ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:262`).
  opencode sends the role only to the exact id `claude-opus-4-8`
  (`oc:packages/llm/src/protocols/anthropic-messages.ts:356`); pi only where a flag that
  defaults to false is set (`pi:packages/ai/src/types.ts:966`). Believed: [A20], read today,
  for the header and for the list of models. A capture settles it.
- **Cache writes on OpenAI.** pi's comment: "OpenAI does not document or emit
  cache_write_tokens" (`pi:packages/ai/src/api/openai-completions.ts:1539`). [O2] documents
  `prompt_tokens_details.cache_write_tokens`, and the AI SDK subtracts it from the prompt
  count (`ai:packages/openai/src/chat/convert-openai-chat-usage.ts:37`). Believed: [O2].
- **Tool choice `none`.** [A1] lists `{type: "none"}`. The AI SDK and opencode instead remove
  the `tools` array, the AI SDK under the comment "Anthropic does not support 'none' tool
  choice" (`ai:packages/anthropic/src/anthropic-prepare-tools.ts:518`,
  `oc:packages/llm/src/protocols/anthropic-messages.ts:516`). Believed: [A1]; removing the
  tools also changes the cached prefix.
- **The output limit on OpenAI.** [O1]: `max_tokens` is deprecated. opencode always sends
  `max_tokens` (`oc:packages/llm/src/protocols/openai-chat.ts:361`); the AI SDK sends
  `max_completion_tokens` for reasoning models
  (`ai:packages/openai/src/chat/openai-chat-language-model.ts:325`) and always `max_tokens` to
  compatible hosts (`ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:287`);
  pi sends `max_completion_tokens` except to a list of hosts
  (`pi:packages/ai/src/api/openai-completions.ts:843`). The field name is a fact of the host.
- **The key header.** All three send `x-api-key` by default
  (`ai:packages/anthropic/src/anthropic-provider.ts:162`,
  `oc:packages/llm/src/providers/anthropic.ts:17`); [A8] now calls it the legacy fallback.
  Both are accepted.

### Request pieces

- **Base instructions.** All three send Anthropic's `system` as an array of text blocks,
  never as a string (`ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:256`,
  `pi:packages/ai/src/api/anthropic-messages.ts:1185`,
  `oc:packages/llm/src/protocols/anthropic-messages.ts:528`). On OpenAI the role is
  `developer` only for reasoning models (`ai:packages/openai/src/chat/openai-chat-language-model.ts:166`,
  `pi:packages/ai/src/api/openai-completions.ts:1233`); opencode always sends `system`
  (`oc:packages/llm/src/protocols/openai-chat.ts:295`).
- **Instruction inside the conversation.** Where the model does not take it, three different
  fallbacks: fold it into the leading system text (`pi:packages/ai/src/api/anthropic-messages.ts:577`,
  `pi:packages/ai/src/api/openai-completions.ts:1199`); hoist it to `system` if none was set
  yet (`ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:219`); wrap it as escaped
  `<system-update>` user text and merge it into the user message before it
  (`oc:packages/llm/src/protocols/anthropic-messages.ts:416`,
  `oc:packages/llm/src/protocols/openai-chat.ts:304`). Where it is sent natively, pi moves it
  to just before the next assistant message and behind any tool results
  (`pi:packages/ai/src/api/anthropic-messages.ts:1320`,
  `pi:packages/ai/src/api/transform-messages.ts:217`); opencode fails locally when one sits
  between a call and its result (`oc:packages/llm/src/protocols/anthropic-messages.ts:411`).
- **Text.** Whitespace-only or empty text is not sent
  (`pi:packages/ai/src/api/anthropic-messages.ts:1357`, `:1399`,
  `oc:packages/opencode/src/provider/transform.ts:180`). The AI SDK trims the last assistant
  text "because Anthropic does not allow trailing whitespace in pre-filled assistant
  responses" (`ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:759`). Unpaired
  UTF-16 surrogates are removed or replaced (`pi:packages/ai/src/utils/sanitize-unicode.ts:24`,
  `oc:packages/opencode/src/provider/transform.ts:134`). An OpenAI assistant message with only
  tool calls has `content: null`, or `""` on hosts that reject null
  (`pi:packages/ai/src/api/openai-completions.ts:1295`).
- **Reasoning sent back.** The piece with the least agreement.
  - Reasoning that has no signature: the AI SDK drops it with a warning
    (`ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:810`); pi sends it as plain
    text, or as `thinking` with `signature: ""` on hosts marked for it
    (`pi:packages/ai/src/api/anthropic-messages.ts:1416`, `:1425`); opencode sends `thinking`
    with no signature key (`oc:packages/llm/src/protocols/anthropic-messages.ts:449`).
  - Reasoning from another model: pi turns it into text and drops redacted blocks whenever
    provider, format or model id differ (`pi:packages/ai/src/api/transform-messages.ts:98`,
    `:105`, `:115`). opencode's older runtime and pi's newest rows ask the API to drop
    mismatched blocks with `prefix_mismatch_behavior: "drop_block"`, opencode because it
    "re-renders parts of that prefix between turns"
    (`oc:packages/opencode/src/provider/transform.ts:709`,
    `pi:packages/ai/src/api/anthropic-messages.ts:1239`).
  - Redacted reasoning: the AI SDK and pi send it back
    (`ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:795`,
    `pi:packages/ai/src/api/anthropic-messages.ts:1409`); opencode's new protocol drops it on
    arrival and has no way to send one (`oc:packages/llm/src/protocols/anthropic-messages.ts:697`,
    `:121`).
  - On OpenAI chat: sent back as `reasoning_content`
    (`ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:274`,
    `oc:packages/llm/src/protocols/openai-chat.ts:259`); under the field name it arrived in
    (`pi:packages/ai/src/api/openai-completions.ts:1347`); never, by the AI SDK's
    implementation for api.openai.com
    (`ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:265`). Hosts that demand
    the field get `reasoning_content: ""` on every assistant message
    (`pi:packages/ai/src/api/openai-completions.ts:1391`).
- **Tool declarations.** `strict` is sent only where the host is known to take it, and is
  otherwise dropped (`ai:packages/anthropic/src/anthropic-prepare-tools.ts:102`,
  `pi:packages/ai/src/api/openai-completions.ts:1513`). Schemas are rewritten for OpenAI
  (`oc:packages/llm/src/protocols/utils/tool-schema.ts:52`,
  `ai:packages/openai/src/normalize-openai-json-schema.ts:63`). The AI SDK and pi set
  `eager_input_streaming: true` on every tool by default
  (`ai:packages/anthropic/src/anthropic-language-model.ts:1051`,
  `pi:packages/ai/src/api/anthropic-messages.ts:1605`). pi sends `tools: []` to OpenAI hosts
  when the history has calls and no tool is active, because "Anthropic (via LiteLLM/proxy)
  requires tools param when conversation has tool_calls/tool_results"
  (`pi:packages/ai/src/api/openai-completions.ts:861`).
- **Tool choice.** "Must call some tool" is `any` on Anthropic
  (`ai:packages/anthropic/src/anthropic-prepare-tools.ts:511`,
  `oc:packages/llm/src/protocols/anthropic-messages.ts:272`). On model ids containing
  `claude-sonnet-5-5`, `claude-opus-5-5` or `claude-fable-5-1` the AI SDK turns a forced
  choice into `auto` with a warning, and for a named tool sends only that tool
  (`ai:packages/anthropic/src/anthropic-prepare-tools.ts:490`, `:531`).
- **Tool call sent back.** Ids are rewritten to `[a-zA-Z0-9_-]` and 64 characters when the
  call came from another model (`pi:packages/ai/src/api/anthropic-messages.ts:1291`,
  `oc:packages/opencode/src/provider/transform.ts:225`), to 40 for OpenAI
  (`pi:packages/ai/src/api/openai-completions.ts:1224`), to nine alphanumerics for Mistral
  (`oc:packages/opencode/src/provider/transform.ts:261`). Input that is not an object is sent
  as `{}` (`pi:packages/ai/src/api/anthropic-messages.ts:1444`,
  `ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:17`). The AI SDK moves
  `tool_use` blocks behind the other blocks of the turn
  (`ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:1450`).
- **Tool result.** `is_error` is sent always (`pi:packages/ai/src/api/anthropic-messages.ts:1299`)
  or only when true (`ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:675`,
  `oc:packages/llm/src/protocols/anthropic-messages.ts:481`). OpenAI has no flag: a failure is
  wrapped as `{"error": …}` (`ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:329`)
  or sent as a plain string (`oc:packages/llm/src/protocols/openai-chat.ts:271`). An image in
  a tool result on OpenAI travels in an added user message after the results
  (`pi:packages/ai/src/api/openai-completions.ts:1463`,
  `oc:packages/llm/src/protocols/openai-chat.ts:300`).
- **Turn order.** Consecutive tool results are merged into one user message
  (`ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:290`,
  `pi:packages/ai/src/api/anthropic-messages.ts:1463`); opencode's new protocol sends one user
  message each and repairs nothing (`oc:packages/llm/src/protocols/anthropic-messages.ts:485`,
  `:469`). A call without a result gets an invented error result, "No result provided"
  (`pi:packages/ai/src/api/transform-messages.ts:175`). On OpenAI, each result is its own
  `tool` message after the assistant message
  (`ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:313`),
  and some hosts need an assistant message between tool results and a user message: pi
  inserts "I have processed the tool results." (`pi:packages/ai/src/api/openai-completions.ts:1244`),
  opencode "Done." for Mistral (`oc:packages/opencode/src/provider/transform.ts:288`).
- **Asking for reasoning and effort.** Each translation carries a table keyed by substrings
  of the model id. The AI SDK's rows for `claude-sonnet-5-5`, `claude-haiku-5-5` and
  `claude-haiku-4-5` agree with Anthropic's table [A12]
  (`ai:packages/anthropic/src/anthropic-language-model.ts:3211`, `:3239`, `:3332`). It turns
  `disabled` into `between_tools` on Sonnet 5.5 (`:601`), a budget into adaptive thinking
  where budgets are rejected (`:622`), and effort `xhigh` or `max` into `high` when thinking
  is off (`:646`). A budget defaults to 1,024 (`:905`,
  `pi:packages/ai/src/api/anthropic-messages.ts:1257`). OpenAI-compatible hosts take thinking
  in at least eight shapes besides `reasoning_effort`
  (`pi:packages/ai/src/api/openai-completions.ts:885`, `:894`, `:904`, `:931`, `:946`, `:958`,
  `:984`, `:1073`).
- **Whether reasoning text is returned.** pi and opencode send `display: "summarized"`
  because the default of newer models returns none
  (`pi:packages/ai/src/api/anthropic-messages.ts:1246`,
  `oc:packages/opencode/src/provider/transform.ts:1064`).
- **Cache marks.** All count marks and drop the fifth
  (`ai:packages/anthropic/src/get-cache-control.ts:51`,
  `oc:packages/llm/src/protocols/anthropic-messages.ts:245`). Placement is each layer's own:
  system blocks, the last tool, the last block of the last user message
  (`pi:packages/ai/src/api/anthropic-messages.ts:1189`, `:1608`, `:1486`); three marks by
  default (`oc:packages/llm/src/cache-policy.ts:34`). A mark on a thinking block is refused
  (`ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:783`). On OpenAI the session id
  is sent as `prompt_cache_key` (`pi:packages/ai/src/api/openai-completions.ts:827`); the AI
  SDK already passes `prompt_cache_options` and explicit breakpoints
  (`ai:packages/openai/src/chat/openai-chat-language-model.ts:237`).
- **Output limit.** With a budget, the budget is added on top of `max_tokens`
  (`ai:packages/anthropic/src/anthropic-language-model.ts:944`,
  `pi:packages/ai/src/api/anthropic-messages.ts:974`). The default comes from a table of
  model maxima (`ai:packages/anthropic/src/anthropic-language-model.ts:702`,
  `pi:packages/ai/src/api/anthropic-messages.ts:1162`) or is 4,096
  (`oc:packages/llm/src/protocols/anthropic-messages.ts:510`).
- **Sampling.** Dropped by model row, and whenever thinking is on
  (`ai:packages/anthropic/src/anthropic-language-model.ts:426`, `:921`,
  `pi:packages/ai/src/api/anthropic-messages.ts:1194`); on OpenAI reasoning models too
  (`ai:packages/openai/src/chat/openai-chat-language-model.ts:265`).
- **Stream switch.** Usage is asked for always
  (`ai:packages/openai/src/chat/openai-chat-language-model.ts:501`,
  `oc:packages/llm/src/protocols/openai-chat.ts:360`), unless the host rejects the field
  (`pi:packages/ai/src/api/openai-completions.ts:834`), or only when the host opted in
  (`ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:460`).
- **Cut output sent back.** pi removes assistant turns that ended in an error or an abort
  from the request, "incomplete turns that shouldn't be replayed", and keeps their tool
  results (`pi:packages/ai/src/api/transform-messages.ts:201`); a thinking block cut before
  its signature is sent as text (`pi:packages/ai/src/api/anthropic-messages.ts:1419`). The AI
  SDK and opencode have nothing for a cut turn.

### Response pieces

- **Framing.** `[DONE]` is skipped and does not end anything; the step ends when the HTTP
  body ends (`ai:packages/provider-utils/src/parse-json-event-stream.ts:27`,
  `oc:packages/llm/src/protocols/shared.ts:247`). pi dispatches Anthropic frames by the SSE
  `event:` name and drops a frame without one (`pi:packages/ai/src/api/anthropic-messages.ts:546`);
  the other two read only `data` and its `type`.
- **Part boundaries on OpenAI.** One text part and one reasoning part per response, with
  fixed ids (`ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:647`,
  `pi:packages/ai/src/api/openai-completions.ts:685`,
  `oc:packages/llm/src/protocols/openai-chat.ts:424`); reasoning is closed by the first
  content or tool-call delta (`oc:packages/llm/src/protocols/openai-chat.ts:427`).
- **Reasoning on OpenAI.** Read from `reasoning_content` then `reasoning`
  (`ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:688`);
  from `reasoning_content`, `reasoning`, `reasoning_text`, the first non-empty one
  (`pi:packages/ai/src/api/openai-completions.ts:611`); from `reasoning_content` only
  (`oc:packages/llm/src/protocols/openai-chat.ts:419`).
- **Tool call.** Anthropic: input in the start frame is used only when it is not `{}`
  (`ai:packages/anthropic/src/anthropic-language-model.ts:2130`); empty fragments are skipped
  and an empty total is `{}` (`:2779`, `:2654`,
  `oc:packages/llm/src/protocols/shared.ts:156`). OpenAI: fragments are matched by `index`
  first, then `id` (`pi:packages/ai/src/api/openai-completions.ts:502`); a missing id is generated
  (`ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:455`) or fails the stream
  (`oc:packages/llm/src/protocols/utils/tool-stream.ts:127`); no call is final before the
  stream ends, since "a parsable argument buffer can still be the prefix of a longer argument
  string" (`ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:429`,
  `oc:packages/llm/src/protocols/openai-chat.ts:467`). pi repairs malformed JSON
  (`pi:packages/ai/src/utils/json-parse.ts:79`).
- **Opaque payload.** A signature can arrive in several deltas and is appended
  (`pi:packages/ai/src/api/anthropic-messages.ts:780`). In opencode the signature of a
  thinking block that had no text is lost (`oc:packages/llm/src/protocols/utils/lifecycle.ts:57`),
  which is the case of `display: "omitted"`.
- **Why it stopped.** `pause_turn` is reported as a normal stop by all three
  (`ai:packages/anthropic/src/map-anthropic-stop-reason.ts:14`,
  `pi:packages/ai/src/api/anthropic-messages.ts:1629`,
  `oc:packages/llm/src/protocols/anthropic-messages.ts:559`). `refusal` is a content filter
  (`ai:packages/anthropic/src/map-anthropic-stop-reason.ts:18`,
  `oc:packages/llm/src/protocols/anthropic-messages.ts:562`) or an error
  (`pi:packages/ai/src/api/anthropic-messages.ts:1633`). On OpenAI, `stop` is corrected to
  "tool calls" when calls were made (`oc:packages/llm/src/protocols/openai-chat.ts:465`). The
  AI SDK keeps the provider's word beside its own
  (`ai:packages/anthropic/src/anthropic-language-model.ts:1759`).
- **Usage.** Anthropic's total input is computed as input plus cache creation plus cache read
  (`ai:packages/anthropic/src/convert-anthropic-usage.ts:102`,
  `oc:packages/llm/src/protocols/anthropic-messages.ts:578`); `message_delta` overwrites only
  the fields it carries (`pi:packages/ai/src/api/anthropic-messages.ts:827`). OpenAI's prompt
  count includes the cached tokens, which are subtracted, and are read from three places
  (`pi:packages/ai/src/api/openai-completions.ts:1532`,
  `oc:packages/llm/src/protocols/openai-chat.ts:395`). Usage can arrive on any chunk and the
  last one wins (`ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:626`);
  Moonshot puts it inside the choice (`pi:packages/ai/src/api/openai-completions.ts:577`).
- **Failure before the stream.** The provider's text is matched to tell a context overflow
  (`pi:packages/ai/src/utils/overflow.ts:38`, `oc:packages/llm/src/route/executor.ts:262`);
  opencode classifies a body that mentions "safety" before it looks at the status
  (`oc:packages/llm/src/route/executor.ts:233`). The wait before a retry is read from
  `retry-after-ms`, then `retry-after` (`pi:packages/ai/src/utils/provider-retry.ts:63`,
  `oc:packages/llm/src/route/executor.ts:346`).
- **Failure inside the stream.** Anthropic: "The Anthropic API returns 200 responses when
  there are overloaded errors"; a first frame that is an error is thrown as an HTTP error, a
  later one becomes an error part with a status inferred from its type
  (`ai:packages/anthropic/src/anthropic-language-model.ts:3144`, `:83`, `:103`). OpenAI: an
  `error` object in a data line of a 200 stream is recognised by its key
  (`ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:599`), in
  three shapes (`ai:packages/openai/src/openai-stream-error.ts:220`); opencode does not
  understand it and fails on an invalid frame
  (`oc:packages/llm/src/protocols/openai-chat.ts:157`).
- **Step ends.** Anthropic: the AI SDK emits its finish only on `message_stop`, so a body
  that ends without it finishes nothing
  (`ai:packages/anthropic/src/anthropic-language-model.ts:3105`); opencode finishes on
  `message_delta` (`oc:packages/llm/src/protocols/anthropic-messages.ts:785`); pi makes a
  missing `message_stop` an error (`pi:packages/ai/src/api/anthropic-messages.ts:567`).
  OpenAI: a body that ends without `finish_reason` is an error
  (`pi:packages/ai/src/api/openai-completions.ts:702`) or the ending "other"
  (`ai:packages/openai/src/chat/openai-chat-language-model.ts:534`).
- **Who answered.** pi records the served model only when it differs from the one asked for
  (`pi:packages/ai/src/api/anthropic-messages.ts:670`,
  `pi:packages/ai/src/api/openai-completions.ts:565`). opencode reads the request id from six
  header names, and only for errors (`oc:packages/llm/src/route/executor.ts:82`).

### MiMo in the three translations

- pi is the only one with code for it. Its four Xiaomi providers (`xiaomi`,
  `xiaomi-token-plan-cn`, `-ams`, `-sgp`) all use OpenAI chat, with two settings: an empty
  `reasoning_content` on every assistant message, and thinking asked as `thinking: {type}`
  plus `reasoning_effort` (`pi:packages/ai/scripts/generate-models.ts:2458`, `:2492`;
  `pi:packages/ai/src/api/openai-completions.ts:931`, `:1391`).
- Its changelog gives the reason: "Fixed Xiaomi MiMo model metadata to use the
  OpenAI-compatible endpoints and `openai-completions` API, restoring multi-turn
  thinking/tool-call sessions" (`pi:packages/ai/CHANGELOG.md:1015`), and "to replay assistant
  tool-call messages with `reasoning_content` for thinking-mode multi-turn requests"
  (`:1006`).
- An Anthropic-format Xiaomi row would be marked as taking `signature: ""`
  (`pi:packages/ai/scripts/generate-models.ts:1243`).
- MiMo "can return "length" with zero output" when the prompt overflows: it truncates the
  input to the window and stops (`pi:packages/ai/src/utils/overflow.ts:163`).
- The AI SDK packages read and opencode's `packages/llm` and `transform.ts` contain neither
  `mimo` nor `xiaomi` (my own search).

### Every case, by piece

`A` is Anthropic Messages, `O` is OpenAI chat, `both` is code that both pass through.
"(older runtime)" marks opencode's `transform.ts`. The pieces follow the sweep's buckets,
which fold "Version and feature switches" into authentication, "Parallel tool calls" into
tool choice, and effort and display into "Asking for reasoning".

#### Address and slug (27)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:1156` | A | The URL is `<baseURL>/messages` unless the host supplies a builder | always |
| `ai:packages/anthropic/src/anthropic-provider.ts:37` | A | The bare host `https://api.anthropic.com` gets `/v1` appended | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:650` | A | Request goes through the SDK's beta messages resource and the raw Response is taken | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:1157` | A | Base URL and model id are passed through untouched | always |
| `pi:packages/ai/scripts/generate-models.ts:2185` | A | The base URL of an Anthropic-format row stops before `/v1`; the SDK adds `/v1/messages` | OpenCode rows whose models.dev entry names `@ai-sdk/anthropic` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:29` | A | Base URL already carries /v1, path is only /messages | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:540` | A | Model id is sent unchanged | always |
| `oc:packages/llm/src/providers/anthropic.ts:22` | A | Provider facade lets baseURL be replaced, default kept when undefined | `baseURL` option given to `Anthropic.configure` |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:356` | O | The request goes to `<baseURL>/chat/completions`, built by a host-supplied url function | always |
| `ai:packages/openai-compatible/src/openai-compatible-provider.ts:168` | O | Base URL: trailing slash stripped, query parameters replace the search string | always |
| `ai:packages/openai/src/openai-provider.ts:225` | O | Base URL from option or OPENAI_BASE_URL, default https://api.openai.com/v1 | always |
| `pi:packages/ai/src/api/openai-completions.ts:376` | O | Request goes through the OpenAI SDK's chat completions resource; the SDK owns the URL and the SSE parsing | always |
| `pi:packages/ai/src/providers/azure.ts:21` | O | Azure: the deployment name replaces `model` in the body and the base URL is forced to `/openai/v1` | provider `azure` with api `openai-completions` |
| `pi:packages/ai/scripts/generate-models.ts:2214` | O | OpenCode Go rows that models.dev lists as Anthropic are forced onto chat completions | provider `opencode-go` and those model ids |
| `oc:packages/llm/src/protocols/openai-chat.ts:28` | O | Base URL already carries /v1, path is /chat/completions | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:350` | O | Model id is sent unchanged | always |
| `oc:packages/llm/src/protocols/openai-compatible-chat.ts:20` | O | The openai-compatible route has a path but no base URL | route id `openai-compatible-chat` |
| `oc:packages/llm/src/providers/openai-compatible-profile.ts:9` | O | A provider profile is a name and a base URL, nothing else | baseten, cerebras, deepinfra, deepseek, fireworks, groq, openrouter, togetherai, xai |
| `oc:packages/llm/src/providers/openai.ts:34` | O | Extra query parameters on the OpenAI endpoint | `queryParams` option on `OpenAI.configure` |
| `oc:packages/llm/src/providers/openai.ts:50` | O | The OpenAI and xAI facades default to Responses, chat must be asked for | provider facades `openai`, `xai` |
| `oc:packages/llm/src/providers/github-copilot.ts:24` | O | GitHub Copilot picks chat or Responses from the model id | provider `github-copilot` |
| `oc:packages/llm/src/providers/azure.ts:42` | O | Azure chat: resource URL, api-version query, no deployment in the path | provider `azure` |
| `oc:packages/llm/src/providers/cloudflare.ts:39` | O | Cloudflare base URLs for the OpenAI-compatible route | providers `cloudflare-ai-gateway`, `cloudflare-workers-ai` |
| `pi:packages/ai/scripts/generate-models.ts:2492` | both | Four Xiaomi providers, all on the OpenAI chat completions format | providers `xiaomi`, `xiaomi-token-plan-cn`, `xiaomi-token-plan-ams`, `xiaomi-token-plan-sgp` |
| `oc:packages/llm/src/route/endpoint.ts:48` | both | Trailing slashes trimmed from the base URL, then the path is concatenated | always |
| `oc:packages/llm/src/route/client.ts:97` | both | A route without a base URL cannot produce a model | route with no configured base URL |
| `oc:packages/llm/src/route/transport/http.ts:92` | both | Per-request query parameters override endpoint ones | `request.http.query` or route/model default `http.query` set |

#### Authentication, version and feature switches (64)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:978` | A | Beta `mcp-client-2025-04-04` is added for MCP servers | provider option `mcpServers` non-empty |
| `ai:packages/anthropic/src/anthropic-language-model.ts:985` | A | Beta `dangerous-tool-use-2026-09-03` is added for safeguards | provider option `safeguards` non-empty |
| `ai:packages/anthropic/src/anthropic-language-model.ts:993` | A | Betas for compaction and context management | provider option `compaction` or `contextManagement` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1007` | A | Three betas are added when a container has skills | `container.skills` non-empty |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1026` | A | Betas for task budget, fast mode, thinking display, thinking binding, server-side fallbacks | the named provider option |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1097` | A | Betas from four origins are merged into one set | always |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1129` | A | The `anthropic-beta` header is rebuilt as one comma-joined value | at least one beta |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:133` | A | Beta `structured-outputs-2025-11-13` is added as soon as one function tool is declared | `supportsStructuredOutput === true` and at least one function tool (it is passed as false when the JSON response tool is in use, anthropic-language-model.ts:1065) |
| `ai:packages/anthropic/src/anthropic-provider.ts:162` | A | Authentication is `x-api-key`, or `Authorization: Bearer` when an auth token is given | always |
| `ai:packages/anthropic/src/anthropic-provider.ts:173` | A | `anthropic-version: 2023-06-01` and a user-agent suffix are always sent | always |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1141` | A | The caller's beta header is found only under the exact key `anthropic-beta` | caller passes its own beta header |
| `pi:packages/ai/src/api/anthropic-messages.ts:304` | A | Default User-Agent `pi (<platform> <release>; <arch>)` on every client | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:297` | A | Headers are merged case-sensitively, so `User-Agent` and `user-agent` can both be present | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:321` | A | Auth counts as present when a key or any of three headers is set | no `options.client` was injected and no workload identity federation config was resolved |
| `pi:packages/ai/src/api/anthropic-messages.ts:336` | A | SDK's own credential chain is switched off | always (all clients are `PiAnthropic`) |
| `pi:packages/ai/src/api/anthropic-messages.ts:355` | A | Workload identity federation only for provider `anthropic` and only without other auth | `model.provider === "anthropic"` and no key and no auth header |
| `pi:packages/ai/src/api/anthropic-messages.ts:979` | A | OAuth tokens are recognised by substring | `apiKey` contains `sk-ant-oat` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1025` | A | OAuth mode sends Bearer auth with Claude Code identity headers | `apiKey` contains `sk-ant-oat` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1106` | A | OAuth mode adds two betas | `apiKey` contains `sk-ant-oat` and no `anthropic-beta` header was configured by the model or caller |
| `pi:packages/ai/src/api/anthropic-messages.ts:995` | A | GitHub Copilot uses Bearer auth on the Anthropic format | `model.provider === "github-copilot"` |
| `pi:packages/ai/src/api/github-copilot-headers.ts:7` | A | Copilot dynamic headers: X-Initiator, Openai-Intent, Copilot-Vision-Request | `model.provider === "github-copilot"` (anthropic-messages.ts:616) |
| `pi:packages/ai/src/api/anthropic-messages.ts:1046` | A | `accept: application/json` and the browser-access header on every request | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:1050` | A | Header precedence: defaults, session affinity, model headers, caller headers | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:1040` | A | Session-affinity header name depends on the host | `sessionId` is set, cache retention is not `none`, `compat.sendSessionAffinityHeaders` is true, and the client is the API-key/header-auth/federation branch (not OAuth, not Copilot) |
| `pi:packages/ai/src/api/anthropic-messages.ts:625` | A | Session id is withheld when caching is off | `cacheRetention === "none"` |
| `pi:packages/ai/src/api/anthropic-messages.ts:216` | A | OpenRouter is detected by provider name or base URL | `model.provider === "openrouter"` or base URL contains `openrouter.ai` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1090` | A | A configured `anthropic-beta` header replaces every computed beta | `anthropic-beta` present in model or caller headers |
| `pi:packages/ai/src/api/anthropic-messages.ts:1164` | A | Betas travel as the SDK `betas` body parameter and only when non-empty | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:1538` | A | `fine-grained-tool-streaming-2025-05-14` only for hosts without eager tool input streaming | tools present and `compat.supportsEagerToolInputStreaming === false` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1112` | A | `interleaved-thinking-2025-05-14` only for budget-thinking models | `model.reasoning && options.thinkingEnabled === true && (options.interleavedThinking ?? true) && compat.forceAdaptiveThinking !== true` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1116` | A | `server-side-fallback-2026-07-01` beta when fallback models are allowed | `compat.allowedFallbackModels` is non-empty (:212) |
| `pi:packages/ai/src/api/anthropic-messages.ts:1118` | A | Two betas for effort-only system messages | `compat.supportsMidConvoEffort === true` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1120` | A | `inline-tools-2026-09-15` beta when tool changes are sent in place | `compat.supportsMidConvoSystemMessages && compat.supportsMidConvoToolChanges` and the leading system message declares at least one tool (:1141-1142) |
| `pi:packages/ai/src/types.ts:932` | A | compat `sendSessionAffinityHeaders` (documented default false; code default true for OpenRouter) | flag true |
| `pi:packages/ai/src/types.ts:934` | A | compat `sessionAffinityFormat` (`"openrouter"` or unset) | flag set, or OpenRouter detected |
| `pi:packages/ai/src/providers/anthropic.ts:38` | A | `ANTHROPIC_AUTH_TOKEN` is sent as a caller-owned `Authorization: Bearer` header, not as an API key | provider `anthropic` and `ANTHROPIC_AUTH_TOKEN` set, no stored key |
| `pi:packages/ai/src/api/anthropic-messages.ts:609` | A | An injected SDK client turns OAuth handling off | `options.client` is set |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:852` | A | anthropic-version pinned as the only protocol header | always |
| `oc:packages/llm/src/providers/anthropic.ts:17` | A | Key goes in x-api-key, not Authorization | provider facade `Anthropic.configure`/`Anthropic.model` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:850` | A | The bare route has no auth at all | route used without the provider facade |
| `oc:packages/opencode/src/provider/transform.ts:708` | A | The binding control needs a beta header, added outside this file (older runtime) | `blockBinding` set |
| `ai:packages/openai-compatible/src/openai-compatible-provider.ts:156` | O | `Authorization: Bearer` only when an api key is given; custom headers override it | always |
| `ai:packages/openai/src/openai-provider.ts:240` | O | Authorization Bearer plus optional OpenAI-Organization and OpenAI-Project headers | always |
| `pi:packages/ai/src/api/openai-completions.ts:89` | O | A placeholder API key is used when the caller owns the Authorization header | no `apiKey` and one of the two headers is set |
| `pi:packages/ai/src/api/openai-completions.ts:766` | O | Default headers: pi User-Agent, then model headers, then caller headers | always |
| `pi:packages/ai/src/api/openai-completions.ts:767` | O | GitHub Copilot gets X-Initiator / Openai-Intent / Copilot-Vision-Request | `model.provider === "github-copilot"` |
| `pi:packages/ai/src/api/openai-completions.ts:777` | O | Session-affinity headers come in three host-specific sets | `sessionId` set, cache retention not `none` (:348) and `compat.sendSessionAffinityHeaders` (default: OpenRouter only, :1680) |
| `pi:packages/ai/src/types.ts:875` | O | compat `sendSessionAffinityHeaders` and `sessionAffinityFormat` | flag true |
| `oc:packages/llm/src/providers/openai.ts:24` | O | Bearer key with OPENAI_API_KEY fallback | provider `openai` |
| `oc:packages/llm/src/protocols/openai-chat.ts:502` | O | The bare chat route has no auth | route used without a provider facade |
| `oc:packages/llm/src/providers/openai-compatible.ts:29` | O | Generic and family compatible providers have no env fallback and require a key | `OpenAICompatible.configure`, baseten, cerebras, deepinfra, deepseek, fireworks, groq, togetherai, github-copilot |
| `oc:packages/llm/src/providers/openrouter.ts:84` | O | OpenRouter and xAI: bearer with their own env var, no attribution headers | providers `openrouter`, `xai` |
| `oc:packages/llm/src/providers/azure.ts:70` | O | Azure sends the key in api-key and strips Authorization | provider `azure` |
| `oc:packages/llm/src/providers/cloudflare.ts:50` | O | Cloudflare AI Gateway uses a second, differently named bearer header | provider `cloudflare-ai-gateway` |
| `ai:packages/provider-utils/src/post-to-api.ts:34` | both | `Content-Type: application/json` and a user-agent suffix on every request | always |
| `pi:packages/ai/src/models.ts:383` | both | Auth headers and request headers are merged case-insensitively one layer above the adapters | requests made through `Models.stream` |
| `pi:packages/ai/src/providers/opencode-headers.ts:14` | both | OpenCode needs a per-conversation routing header | provider `opencode` / `opencode-go` and `sessionId` set |
| `pi:packages/ai/src/providers/cloudflare-auth.ts:93` | both | Cloudflare AI Gateway authenticates with its own header and suppresses the vendor ones | provider `cloudflare-ai-gateway` |
| `pi:packages/ai/scripts/generate-models.ts:164` | both | GitHub Copilot rows carry fixed editor headers | provider `github-copilot` |
| `pi:packages/ai/src/compat.ts:229` | both | The legacy entry point injects an API key from the environment | calls through `@earendil-works/pi-ai/compat` |
| `oc:packages/llm/src/route/transport/http.ts:102` | both | Header precedence: route headers, then caller headers, then auth | always |
| `oc:packages/llm/src/protocols/shared.ts:322` | both | content-type is forced after caller headers; nothing else is added | always |
| `oc:packages/llm/src/route/auth.ts:72` | both | Empty-string key counts as missing; missing key fails before any request | always |
| `oc:packages/llm/src/route/auth-options.ts:48` | both | Key precedence in the bearer helper | facades using `AuthOptions.bearer` |

#### Base instructions (16)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:256` | A | The system prompt is sent as an array of text blocks, one per system message | the system block is the first block of the prompt, or the condition of :219 |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:219` | A | A system message that is not first is still hoisted to `system` when none was set yet | `i !== 0`, `system == null`, no message-level controls |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:174` | A | An empty system text is sent as an empty text block unless the message only carries controls | system message with `content === ''` |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:225` | A | Tool changes, clearAt and effort on the initial system message are ignored with a warning | the system block that becomes the top-level `system` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1185` | A | System prompt is always an array of text blocks, never a string | non-OAuth and system text is non-empty |
| `pi:packages/ai/src/api/anthropic-messages.ts:1172` | A | OAuth requires the Claude Code identity as the first system block | `apiKey` contains `sk-ant-oat` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:528` | A | System prompt is always an array of text blocks, one per neutral part | always |
| `ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:194` | O | System messages are sent where they are, with role `system` | always |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:166` | O | System messages use role `developer` on reasoning models, `system` otherwise | always |
| `ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:89` | O | Mode `remove` drops every system message with a warning | `providerOptions.openai.systemMessageMode === 'remove'` |
| `ai:packages/openai/src/openai-language-model-capabilities.ts:45` | O | Which model ids count as reasoning models | always |
| `pi:packages/ai/src/api/openai-completions.ts:1233` | O | Instructions use the `developer` role only for reasoning models on hosts that accept it | `developer` if `model.reasoning && compat.supportsDeveloperRole` |
| `pi:packages/ai/src/types.ts:814` | O | compat `supportsDeveloperRole` (default: auto-detected) | flag true and `model.reasoning` |
| `oc:packages/llm/src/protocols/openai-chat.ts:295` | O | One `system` message, parts joined with newlines; never `developer` | always |
| `pi:packages/ai/src/utils/transcript.ts:32` | both | `systemPrompt` and `tools` are folded into a leading system message before any adapter runs | always |
| `oc:packages/opencode/src/provider/transform.ts:134` | both | Lone surrogates in the system prompt replaced by U+FFFD (older runtime) | always |

#### Instruction inside the conversation (24)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:262` | A | A system message inside the conversation is sent as a `role: 'system'` message under a beta | system block not first and a top-level `system` already exists, or the block carries tool changes / clearAt / effort |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:242` | A | An effort-only system message becomes a `role: 'system'` message with empty content | system message with empty text and provider option `effort` |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:275` | A | Three more betas follow from what a mid-conversation system message carries | mid-conversation system message with the matching provider option |
| `pi:packages/ai/src/api/anthropic-messages.ts:577` | A | Later system messages are folded into the leading one unless the exact model accepts them | `compat.supportsMidConvoSystemMessages` is false (default) |
| `pi:packages/ai/src/api/anthropic-messages.ts:1354` | A | A system message inside the conversation is sent as a `system`-role message with blocks | `compat.supportsMidConvoSystemMessages === true` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1320` | A | Mid-conversation system messages are moved to just before the next assistant message | `compat.supportsMidConvoSystemMessages === true` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1351` | A | Tool changes inside the conversation are `tool_removal` / `tool_addition` blocks | native tool changes (`supportsMidConvoSystemMessages && supportsMidConvoToolChanges` and initial tools non-empty) |
| `pi:packages/ai/src/types.ts:966` | A | compat `supportsMidConvoSystemMessages` (default false) | flag true |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:356` | A | Native system-role message inside `messages` only for one exact model id | `request.model.id === "claude-opus-4-8"` and the position test of the next finding passes |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:369` | A | Position test for a native system message | `claude-opus-4-8` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:411` | A | System message between a tool call and its result is a hard error | a `system` role message appears while a non-provider-executed tool call is unanswered |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:416` | A | Fallback: system message becomes escaped `<system-update>` user text | model id is not `claude-opus-4-8`, or the position test fails |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:420` | A | Fallback text is appended to the previous user message | fallback path and previous wire message has role user |
| `ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:72` | O | A system message inside the conversation is sent in place, with the same role as the first | system message that is not first |
| `pi:packages/ai/src/api/openai-completions.ts:1199` | O | Later system messages are folded into the first one unless the exact model accepts them | `compat.supportsMidConvoSystemMessages` is false (default, :1677) |
| `pi:packages/ai/src/api/openai-completions.ts:1257` | O | An in-place system message uses the same instruction role and a framed text | `compat.supportsMidConvoSystemMessages === true` (generator: Moonshot Kimi K2.6/K2.7/K3, Kimi K3 on Fireworks/OpenCode/Copilot, deepseek-v4-pro on `deepseek`, listed `openai/` ids on OpenRouter, packages/ai/scripts/generate-models.ts:919-940) |
| `pi:packages/ai/src/api/openai-completions.ts:1251` | O | Tools added mid-conversation are sent as a `system` message with a `tools` field | `compat.supportsMidConvoSystemMessages && compat.supportsMidConvoToolAdditions`, not the first message, and no non-additive tool change (generator: Kimi K3 on Moonshot, Fireworks, OpenCode, packages/ai/scripts/generate-models.ts:921-924, :939) |
| `pi:packages/ai/src/types.ts:867` | O | compat `supportsMidConvoSystemMessages` and `supportsMidConvoToolAdditions` (default false) | flag true |
| `oc:packages/llm/src/protocols/openai-chat.ts:304` | O | Mid-conversation system message becomes escaped `<system-update>` user text | any `system` role message in `request.messages` |
| `oc:packages/llm/src/protocols/openai-chat.ts:310` | O | The wrapped text is merged into the preceding user message | system-update lowering |
| `oc:packages/llm/src/protocols/openai-chat.ts:306` | O | With tool-result images pending, they and the wrapper share one user message | system message directly after tool messages whose results contained images |
| `pi:packages/ai/src/api/transform-messages.ts:217` | both | A system message between a tool call and its results is moved behind the results | a system message sits between an assistant tool call and its results |
| `oc:packages/llm/src/protocols/shared.ts:134` | both | Mid-conversation system messages are text only | `system` role message in `request.messages` |
| `oc:packages/llm/src/protocols/shared.ts:112` | both | Wrapper format and escaping of the fallback | fallback path on either format |

#### What the user said (9)

| Where | Format | What the code does | When |
|---|---|---|---|
| `pi:packages/ai/src/api/anthropic-messages.ts:1357` | A | Whitespace-only user text is not sent | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:1360` | A | User text has unpaired surrogates removed | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:436` | A | User content is always a block array; only text and images | always |
| `ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:199` | O | A user message with exactly one text part is sent as a plain string | single text part |
| `ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:107` | O | A user message with one text part and no breakpoint is sent as a string | single text part |
| `pi:packages/ai/src/api/openai-completions.ts:1269` | O | Empty text parts are dropped from a multi-part user message; an empty user string is still sent | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:227` | O | All-text user content collapses to one string with no separator | user message with no media part |
| `pi:packages/ai/src/utils/sanitize-unicode.ts:24` | both | Unpaired UTF-16 surrogates are removed from outgoing text | always, on every text field both adapters send (not on tool-call arguments or on OpenAI raw reasoning fields) |
| `oc:packages/opencode/src/provider/transform.ts:143` | both | Lone surrogates in user text replaced (older runtime) | always |

#### What the model said (12)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:759` | A | The last assistant text is trimmed when the prompt ends with an assistant turn | `isLastBlock && isLastMessage && isLastContentPart` and the part is text |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:737` | A | Assistant text marked as compaction is sent back as a `compaction` block | `providerOptions.anthropic.type === 'compaction'` on an assistant text part |
| `pi:packages/ai/src/api/anthropic-messages.ts:1399` | A | Whitespace-only assistant text blocks are skipped | always |
| `oc:packages/opencode/src/provider/transform.ts:180` | A | Empty text parts are removed from every message (older runtime) | `model.api.npm === "@ai-sdk/anthropic"` |
| `ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:235` | O | All assistant text parts are concatenated into one string | always |
| `ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:273` | O | Assistant content is null when there are tool calls and no text, otherwise a string (possibly empty) | always |
| `ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:300` | O | Assistant text is concatenated; content is null when only tool calls are present | always |
| `pi:packages/ai/src/api/openai-completions.ts:1295` | O | Assistant `content` is `null` by default and `""` for hosts that reject null | `""` if `compat.requiresAssistantAfterToolResult` |
| `pi:packages/ai/src/api/openai-completions.ts:1332` | O | Assistant text is always one plain string, never an array of text parts | always, except the `requiresThinkingAsText` branch, which does send a part array (:1328) |
| `oc:packages/llm/src/protocols/openai-chat.ts:255` | O | Assistant text joined with newlines; `content: null` when there is none | always |
| `pi:packages/ai/src/api/transform-messages.ts:123` | both | Different model: text blocks lose their signature | not same model |
| `oc:packages/opencode/src/provider/transform.ts:156` | both | Lone surrogates in assistant text and reasoning replaced (older runtime) | always |

#### Reasoning sent back (39)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:560` | A | Reasoning of earlier steps is sent back by default | always |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:782` | A | Reasoning with a signature is sent back as a `thinking` block | `sendReasoning` and `providerOptions.anthropic.signature` present |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:795` | A | Reasoning with redacted data is sent back as `redacted_thinking` | no signature but `providerOptions.anthropic.redactedData` present |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:810` | A | Reasoning without signature or redacted data is dropped with a warning | reasoning part lacking both fields |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:823` | A | With sendReasoning off every reasoning part is dropped | `providerOptions.anthropic.sendReasoning === false` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1409` | A | Redacted thinking is replayed as `redacted_thinking` with the stored payload | `block.redacted` is true |
| `pi:packages/ai/src/api/anthropic-messages.ts:1415` | A | A thinking block with no text and no signature is dropped | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:1416` | A | Thinking without a signature is replayed as plain text | signature missing/empty and `compat.allowEmptySignature` is false (default) |
| `pi:packages/ai/src/api/anthropic-messages.ts:1425` | A | Hosts that accept it get `signature: ""` instead | `compat.allowEmptySignature === true` (generator: providers `xiaomi`, `xiaomi-token-plan-*`, Fireworks Anthropic rows, and `qwen3.8-flash` on `opencode`/`opencode-go`, packages/ai/scripts/generate-models.ts:1243-1248, :1664) |
| `pi:packages/ai/src/api/anthropic-messages.ts:1435` | A | Signed thinking text is surrogate-sanitized before replay | always |
| `pi:packages/ai/src/types.ts:960` | A | compat `allowEmptySignature` (default false) | flag true |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:453` | A | Thinking replay reads the signature from two places | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:449` | A | Reasoning with no signature or from another provider is still sent as thinking | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:121` | A | No redacted_thinking block can be sent back | always |
| `oc:packages/opencode/src/provider/transform.ts:185` | A | A reasoning part survives only with visible text, a signature or redacted data (older runtime) | `model.api.npm === "@ai-sdk/anthropic"` |
| `oc:packages/opencode/src/provider/transform.ts:493` | A | Reasoning metadata stored under the provider id is re-keyed for the SDK (older runtime) | `sdkKey(model.api.npm)` exists and differs from `model.providerID` |
| `oc:packages/opencode/src/provider/transform.ts:709` | A | Thinking-signature binding: ask the API to drop blocks instead of failing (older runtime) | `anthropicBindsThinking(model.api.id)` and npm `@ai-sdk/anthropic` or `@ai-sdk/google-vertex/anthropic` (:722-730), thinking type adaptive or enabled, no explicit `blockBinding` |
| `oc:packages/opencode/src/provider/transform.ts:700` | A | Which model ids are treated as binding (older runtime) | always evaluated for Anthropic and Bedrock SDK packages |
| `oc:packages/opencode/src/provider/transform.ts:715` | A | OpenCode-only opt-out is consumed before the SDK sees it (older runtime) | user config sets `blockBinding: false` |
| `ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:274` | O | Reasoning is sent back as `reasoning_content` on the assistant message | assistant message with reasoning parts |
| `ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:265` | O | Reasoning parts of earlier turns are silently not sent | assistant message with reasoning parts |
| `pi:packages/ai/src/api/openai-completions.ts:1347` | O | Reasoning is sent back under the same field name it arrived in | thinking present, `requiresThinkingAsText` false and no `reasoning_details` to replay |
| `pi:packages/ai/src/api/openai-completions.ts:1343` | O | OpenCode Go: reasoning received as `reasoning` must be replayed as `reasoning_content` | `model.provider === "opencode-go"` and recorded field is `reasoning` |
| `pi:packages/ai/src/api/openai-completions.ts:1384` | O | `reasoning_details` are replayed verbatim and replace the raw reasoning field | a thinking block of the message carries serialized reasoning details |
| `pi:packages/ai/src/api/openai-completions.ts:1316` | O | Legacy sessions: encrypted reasoning stored on tool calls is still replayed | no signed details on thinking blocks and tool calls carry such a signature |
| `pi:packages/ai/src/api/openai-completions.ts:1324` | O | Hosts that cannot take reasoning fields get thinking as leading plain text | `compat.requiresThinkingAsText` (default false, :1654) |
| `pi:packages/ai/src/api/openai-completions.ts:1391` | O | Every replayed assistant message gets an empty `reasoning_content` on hosts that demand the field | `compat.requiresReasoningContentOnAssistantMessages && model.reasoning` (default: DeepSeek, :1655; generator also sets it for Xiaomi MiMo and Kimi K3 rows) |
| `pi:packages/ai/src/types.ts:828` | O | compat `requiresThinkingAsText` (documented "auto-detected", detected value is always false) | flag true |
| `pi:packages/ai/src/types.ts:830` | O | compat `requiresReasoningContentOnAssistantMessages` (default: DeepSeek) | flag true and `model.reasoning` |
| `oc:packages/llm/src/protocols/openai-chat.ts:259` | O | Reasoning is replayed as `reasoning_content` on every route | assistant message has at least one reasoning part |
| `oc:packages/llm/src/protocols/openai-chat.ts:260` | O | Fallback to a stashed native `reasoning_content` | assistant message without reasoning parts |
| `oc:packages/opencode/src/provider/transform.ts:304` | O | DeepSeek: every assistant message is given a reasoning part (older runtime) | api id contains `deepseek` |
| `oc:packages/opencode/src/provider/transform.ts:345` | O | Reasoning is moved out of content into a named field on the message (older runtime) | `model.capabilities.interleaved` is an object with `field`, and npm is not `@openrouter/ai-sdk-provider` (:321-325); applies to assistant messages with array content |
| `pi:packages/ai/src/api/transform-messages.ts:98` | both | "Same model" means provider, api and model id all match the message's origin | always |
| `pi:packages/ai/src/api/transform-messages.ts:105` | both | Redacted thinking is dropped when the model differs | `block.redacted` and not same model |
| `pi:packages/ai/src/api/transform-messages.ts:109` | both | Same model: a signed thinking block is kept even with empty text | same model and signature present |
| `pi:packages/ai/src/api/transform-messages.ts:115` | both | Different model: thinking becomes a plain text block | not same model and thinking text non-empty |
| `pi:packages/ai/scripts/generate-models.ts:2458` | both | Xiaomi rows set exactly two compat flags | all four Xiaomi providers |
| `pi:packages/ai/scripts/generate-models.ts:1243` | both | On the Anthropic format, Xiaomi providers are marked as accepting empty signatures | provider `xiaomi` or `xiaomi-token-plan-*` with api `anthropic-messages` |

#### Tool declarations (44)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:460` | A | Strict tools are allowed only when both the host config and the model allow structured output | always |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1051` | A | Tools get `eager_input_streaming` by default when streaming | `stream === true` and `providerOptions.anthropic.toolStreaming !== false` |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:70` | A | An empty tools array is not sent | no tools declared |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:113` | A | Function tools are declared as given: name, description, schema untouched | always |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:95` | A | `eager_input_streaming` is sent only as true and only on function tools | function tool |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:102` | A | `strict` is dropped with a warning where strict tools are unsupported | model row without structured output (claude-sonnet-4, claude-opus-4, claude-3-haiku, legacy, non-Claude) or `config.supportsStrictTools === false` |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:125` | A | Extra tool fields: defer_loading, allowed_callers, input_examples | the option is set on a function tool |
| `pi:packages/ai/src/api/anthropic-messages.ts:124` | A | OAuth mode renames tools to Claude Code's canonical casing | `apiKey` contains `sk-ant-oat` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1589` | A | `input_schema` is rebuilt from `properties` and `required` only | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:1605` | A | `eager_input_streaming: true` on every tool | `compat.supportsEagerToolInputStreaming` is true (default); false in the generator for `github-copilot` claude-haiku-4.5 / claude-sonnet-4 / claude-sonnet-4.5 and Fireworks (packages/ai/scripts/generate-models.ts:268-272, :1666) |
| `pi:packages/ai/src/api/anthropic-messages.ts:1541` | A | Strict tools fall back to non-strict when the schema uses keywords Anthropic rejects | tool has `constrainedSampling.type === "json_schema"` and `compat.supportsStrictTools` is true (generator sets it for provider `anthropic` only, packages/ai/scripts/generate-models.ts:870-871) |
| `pi:packages/ai/src/api/anthropic-messages.ts:1222` | A | `tools` is omitted when there are none | tool changes are not native |
| `pi:packages/ai/src/api/anthropic-messages.ts:205` | A | A never-activated deferred tool is declared to keep the cached prefix stable | native tool changes (`supportsMidConvoSystemMessages && supportsMidConvoToolChanges` and initial tools non-empty) |
| `pi:packages/ai/src/types.ts:922` | A | compat `supportsEagerToolInputStreaming` (default true) | flag false |
| `pi:packages/ai/src/types.ts:962` | A | compat `supportsStrictTools` (default false) | flag true |
| `pi:packages/ai/src/types.ts:968` | A | compat `supportsMidConvoToolChanges` (default false) | flag true |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:264` | A | Tool declaration carries four fields only | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:522` | A | Input schema is rewritten only on a model compatibility flag | `request.model.compatibility?.toolSchema` is set |
| `ai:packages/openai-compatible/src/chat/openai-compatible-prepare-tools.ts:32` | O | An empty tools array is not sent; provider tools are dropped with a warning | always |
| `ai:packages/openai/src/chat/openai-chat-prepare-tools.ts:37` | O | Tool schemas are normalised before sending; non-function tools are dropped | always |
| `ai:packages/openai/src/normalize-openai-json-schema.ts:63` | O | `propertyNames` is removed from schemas, or the call is refused | tool schema or response schema containing `propertyNames` |
| `ai:packages/openai/src/normalize-openai-json-schema.ts:79` | O | A `pattern` using regex lookaround is removed | schema with such a pattern |
| `ai:packages/openai/src/normalize-openai-json-schema.ts:188` | O | A one-item `allOf` holding only a `$ref` is rewritten to the `$ref` | schema with `allOf: [{ $ref }]` |
| `pi:packages/ai/src/api/openai-completions.ts:861` | O | An empty `tools: []` is sent when the history has tool calls but no tools are active | no request tools and `hasToolHistory(messages)` |
| `pi:packages/ai/src/api/openai-completions.ts:1513` | O | `strict` is only present on hosts marked as supporting it, and then always (true or false) | `compat.supportsStrictMode !== false` |
| `pi:packages/ai/src/api/openai-completions.ts:858` | O | z.ai needs `tool_stream: true` to stream tool-call deltas | tools present and `compat.zaiToolStream` (generator: z.ai models except glm-4.5, glm-4.5-air, glm-4.5-flash, glm-4.5v, packages/ai/scripts/generate-models.ts:259, :1480) |
| `pi:packages/ai/src/api/openai-completions.ts:1490` | O | Grammar-constrained tools are sent as `custom` tools | `compat.supportsOpenAIGrammarTools` and the tool has a grammar variant |
| `pi:packages/ai/src/types.ts:853` | O | compat `zaiToolStream` (default false) | flag true |
| `pi:packages/ai/src/types.ts:865` | O | compat `supportsOpenAIGrammarTools` (default false) | flag true |
| `pi:packages/ai/src/types.ts:871` | O | compat `supportsStrictMode` (default false) | flag true |
| `oc:packages/llm/src/protocols/openai-chat.ts:184` | O | Every tool schema goes through an OpenAI projection, for all providers | always |
| `oc:packages/llm/src/protocols/utils/tool-schema.ts:52` | O | Root schema forced to type object | always |
| `oc:packages/llm/src/protocols/utils/tool-schema.ts:60` | O | Root-level anyOf is flattened into one object | root schema has `anyOf` containing at least one record |
| `oc:packages/llm/src/protocols/utils/tool-schema.ts:14` | O | Null variants are stripped from every anyOf | always |
| `oc:packages/opencode/src/provider/transform.ts:1497` | O | OpenAI tool schemas: boolean schemas become string (older runtime) | npm `@ai-sdk/openai` or `@ai-sdk/azure` (:1594) |
| `oc:packages/opencode/src/provider/transform.ts:1505` | O | OpenAI tool schemas: keyword allowlist, const turned into enum (older runtime) | npm `@ai-sdk/openai` or `@ai-sdk/azure` |
| `oc:packages/opencode/src/provider/transform.ts:1570` | O | OpenAI tool schemas: missing types inferred, empty shapes filled (older runtime) | npm `@ai-sdk/openai` or `@ai-sdk/azure` |
| `oc:packages/opencode/src/provider/transform.ts:1672` | O | Gemini models behind chat-compatible transports get the Gemini schema rewrite (older runtime) | `model.providerID === "google" \|\| model.api.id.includes("gemini")` (:1618) |
| `pi:packages/ai/src/utils/transcript.ts:62` | both | The current tool set is the replay of every system message's additions and removals | always |
| `pi:packages/ai/src/api/constrained-sampling.ts:119` | both | Strict tool schemas are rewritten: every property required, optional ones made nullable | tool has `constrainedSampling.type === "json_schema"` and the host supports strict tools |
| `pi:packages/ai/src/api/constrained-sampling.ts:239` | both | A tool only becomes strict if it asked for it; `require` turns the fallback into an error | always |
| `oc:packages/llm/src/protocols/utils/tool-schema.ts:29` | both | "moonshot" projection: a $ref node keeps nothing but the $ref | `request.model.compatibility.toolSchema === "moonshot"` |
| `oc:packages/llm/src/protocols/utils/tool-schema.ts:32` | both | "moonshot" projection: tuple schemas collapsed, unevaluatedItems removed | `request.model.compatibility.toolSchema === "moonshot"` |
| `oc:packages/opencode/src/provider/transform.ts:1604` | both | Moonshot / Kimi: $ref siblings stripped, tuple items reduced to the first (older runtime) | `model.providerID === "moonshotai"` or api id contains `kimi` (:1599) |

#### Tool choice and parallel tool calls (15)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:502` | A | `disableParallelToolUse: false` is overridden when the JSON tool is in use | JSON response tool in use |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:469` | A | Without a tool choice, `tool_choice` is sent only to carry disable_parallel_tool_use | `toolChoice == null` |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:511` | A | `required` is sent as `any` | `toolChoice.type === 'required'` |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:490` | A | `required` falls back to `auto` on models that reject forced tool use | model id contains `claude-sonnet-5-5`, `claude-opus-5-5` or `claude-fable-5-1` |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:518` | A | `none` is done by removing the tools | `toolChoice.type === 'none'` |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:531` | A | A named tool choice on a model that rejects forcing sends only that tool, with `auto` | `toolChoice.type === 'tool'` and model id contains `claude-sonnet-5-5`, `claude-opus-5-5` or `claude-fable-5-1` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1275` | A | String tool choice is wrapped into `{ type }` | `options.toolChoice` is set |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:516` | A | toolChoice none removes the whole tools array | `request.toolChoice.type === "none"` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:272` | A | required maps to any; no parallel-tool switch exists | always |
| `ai:packages/openai-compatible/src/chat/openai-compatible-prepare-tools.ts:80` | O | Tool choice strings pass through; a named tool becomes a function object | `toolChoice` given |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:203` | O | `parallel_tool_calls` is sent only from a provider option | `providerOptions.openai.parallelToolCalls` set |
| `ai:packages/openai/src/chat/openai-chat-prepare-tools.ts:72` | O | Tool choice strings pass through; a named tool becomes a function object | `toolChoice` given |
| `pi:packages/ai/src/api/openai-completions.ts:870` | O | Tool choice is passed through untouched | `options.toolChoice` set |
| `oc:packages/llm/src/protocols/openai-chat.ts:191` | O | Tool choice: strings and a named function; tools stay when choice is none | always |
| `oc:packages/llm/src/protocols/shared.ts:279` | both | A named tool choice without a name is a local error | `toolChoice.type === "tool"` |

#### Tool call sent back (16)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:1669` | A | Tool call input that is not an object is wrapped | tool-call part whose `input` is not a plain object |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:1464` | A | `caller` is removed from tool calls whose code-execution parent is no longer in the history | `caller.type` not `direct` and `caller.tool_id` not among the converted code_execution calls |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:1666` | A | `caller` is sent back only in two recognised shapes | tool-call part with `providerOptions.anthropic.caller` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1291` | A | Tool-call ids are rewritten to `[a-zA-Z0-9_-]` and 64 characters | the assistant message that holds the call was not produced by the same provider, api and model id |
| `pi:packages/ai/src/api/anthropic-messages.ts:1444` | A | Replayed `tool_use` input defaults to `{}` | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:280` | A | tool_use is replayed with input passed through as a value | always |
| `oc:packages/opencode/src/provider/transform.ts:225` | A | Tool-call ids scrubbed to [a-zA-Z0-9_-] for Claude models (older runtime) | `model.api.id.includes("claude")` (:224), whatever the SDK package |
| `ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:252` | O | Tool calls are sent with `type: 'function'` and arguments re-serialised | always |
| `ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:245` | O | A thought signature is put back under extra_content.google | tool-call part carrying `thoughtSignature` |
| `ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:17` | O | Tool-call arguments that are not an object are sent as `{}` | always |
| `pi:packages/ai/src/api/openai-completions.ts:1210` | O | Pipe-separated Responses-API ids are flattened to at most 40 characters | id contains `\|` and the assistant message came from a different provider/api/model |
| `pi:packages/ai/src/api/openai-completions.ts:1224` | O | Ids longer than 40 are cut only for provider `openai` | `model.provider === "openai"`, cross-model message |
| `pi:packages/ai/src/api/openai-completions.ts:1378` | O | Tool-call arguments are re-serialized from the parsed object | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:201` | O | Tool-call arguments are re-serialised to a JSON string | always |
| `oc:packages/opencode/src/provider/transform.ts:261` | O | Mistral: tool-call ids rewritten to exactly nine alphanumerics (older runtime) | `model.providerID === "mistral"` or the api id contains mistral, devstral, codestral, pixtral or mixtral (:254-257) |
| `pi:packages/ai/src/api/transform-messages.ts:136` | both | Different model: tool calls lose `thoughtSignature` and get their id normalized | not same model |

#### Tool result (24)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:502` | A | `tool-approval-response` parts are skipped | tool message part of that type |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:659` | A | Tool result content: string for text, JSON string for everything structured | always |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:654` | A | A denied tool call is answered with a fixed sentence and no error flag | tool output type `execution-denied` |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:675` | A | `is_error` is sent only as true, never as false | always |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:606` | A | Unsupported items inside a tool result are dropped with a warning | tool output of type `content` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1299` | A | `is_error` is always sent on tool results | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:153` | A | Text-only tool-result content is collapsed to one string | tool result has no image block |
| `pi:packages/ai/src/api/anthropic-messages.ts:179` | A | An image-only tool result gets a placeholder text block in front | tool result content contains images and no text block |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:485` | A | Each tool message becomes its own user message of tool_result blocks | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:481` | A | is_error is written only when true | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:347` | A | tool_result content is a string unless the result is typed "content" | always |
| `oc:packages/opencode/src/provider/transform.ts:243` | A | The same scrub on tool results keeps pairs matched (older runtime) | `model.api.id.includes("claude")` |
| `ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:313` | O | Each tool result is its own `role: 'tool'` message | always |
| `ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:304` | O | Multi-part tool output is flattened to a JSON string unless the host allows parts | tool output type `content` |
| `ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:329` | O | Error results are wrapped as `{"error": ...}` | always |
| `pi:packages/ai/src/api/openai-completions.ts:1422` | O | Tool results are text only, with placeholders for empty output | always |
| `pi:packages/ai/src/api/openai-completions.ts:1430` | O | `name` on tool messages for hosts that require it | `compat.requiresToolResultName` (default false, :1652) and the result has a tool name |
| `pi:packages/ai/src/api/openai-completions.ts:1463` | O | Images of tool results travel in a separate user message after the run of results | tool results contain images and `model.input` includes `image` |
| `pi:packages/ai/src/types.ts:824` | O | compat `requiresToolResultName` (documented "auto-detected", detected value is always false) | flag true |
| `oc:packages/llm/src/protocols/openai-chat.ts:271` | O | Tool result is a string; errors carry no flag | result type text, json or error |
| `oc:packages/llm/src/protocols/openai-chat.ts:276` | O | Structured tool content: text joined with newlines, files split off | result type `content` |
| `oc:packages/llm/src/protocols/openai-chat.ts:300` | O | Images returned by tools are re-sent in a synthetic user message | tool result content includes file items |
| `oc:packages/llm/src/protocols/shared.ts:220` | both | How a tool result is turned into a string | tool result type text, json or error |
| `oc:packages/opencode/src/provider/transform.ts:108` | both | Lone surrogates in tool results replaced (older runtime) | always |

#### Turn order (19)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:290` | A | Consecutive user and tool messages are merged into one user message | always |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:1570` | A | A tool message opens or joins a user block | always |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:691` | A | The merged user message is pushed even when its content is empty | user/tool block that converts to no content |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:697` | A | Consecutive assistant messages are merged into one | always |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:1447` | A | An assistant turn that converts to nothing is left out | assistant block with no convertible content |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:1450` | A | tool_use blocks are moved behind the other blocks of an assistant turn | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:1463` | A | Consecutive tool results are merged into one user message | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:1448` | A | An assistant message left with no blocks is not sent | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:466` | A | Client tool-result or media inside an assistant message is rejected | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:469` | A | No role merging, empty-message filtering or orphan repair | always |
| `oc:packages/opencode/src/provider/transform.ts:174` | A | Messages with empty content are removed (older runtime) | `model.api.npm === "@ai-sdk/anthropic"` (:170; the Vertex Anthropic package is not included) |
| `ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:309` | O | A tool message with several results becomes several `tool` messages; nothing else is reordered | always |
| `pi:packages/ai/src/api/openai-completions.ts:1244` | O | A synthetic assistant message bridges tool results and a following user message | `compat.requiresAssistantAfterToolResult` (default false, :1653) |
| `pi:packages/ai/src/api/openai-completions.ts:1402` | O | An assistant message with neither content nor tool calls is not sent | always |
| `pi:packages/ai/src/types.ts:826` | O | compat `requiresAssistantAfterToolResult` (documented "auto-detected", detected value is always false) | flag true |
| `oc:packages/llm/src/protocols/openai-chat.ts:327` | O | No role merging, empty-message filtering or orphan repair | always |
| `oc:packages/opencode/src/provider/transform.ts:288` | O | Mistral: an assistant "Done." is inserted between a tool message and a user message (older runtime) | Mistral family as above |
| `pi:packages/ai/src/api/transform-messages.ts:73` | both | Missing message content is normalized to an empty array | always |
| `pi:packages/ai/src/api/transform-messages.ts:175` | both | Tool calls without a result get a synthetic error result | a kept assistant message has unanswered tool calls |

#### Asking for reasoning, effort, display (97)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:571` | A | The generic `reasoning` setting is translated only when no provider `effort` is given | top-level `reasoning` is set to something other than the provider default |
| `ai:packages/anthropic/src/anthropic-language-model.ts:601` | A | `thinking: disabled` becomes `between_tools` on models that cannot disable thinking but support it | model id contains `claude-sonnet-5-5` (the only row with both `rejectsThinkingDisabled` and `supportsBetweenToolsThinking`) |
| `ai:packages/anthropic/src/anthropic-language-model.ts:610` | A | `thinking: disabled` is removed on models that always think adaptively | model id contains `claude-opus-5-5`, `claude-fable-5-1` or `claude-fable-5` (rows with `rejectsThinkingDisabled` and no between_tools) |
| `ai:packages/anthropic/src/anthropic-language-model.ts:622` | A | Budget-based thinking is rewritten to adaptive thinking | model id contains `claude-sonnet-5-5`, `claude-opus-5-5`, `claude-haiku-5-5`, `claude-fable-5-1` or `claude-fable-5` (rows with `rejectsBudgetThinking`) |
| `ai:packages/anthropic/src/anthropic-language-model.ts:646` | A | Effort xhigh/max is lowered to high when thinking is disabled | `thinking.type === 'disabled'` and effort `xhigh` or `max`, on rows with the flag: `claude-sonnet-5-5`, `claude-opus-5-5`, `claude-haiku-5-5`, `claude-opus-5`, any unlisted `claude-` id |
| `ai:packages/anthropic/src/anthropic-language-model.ts:664` | A | Effort xhigh/max is lowered to high with `between_tools` thinking | thinking type `between_tools` and effort `xhigh` or `max`, any model |
| `ai:packages/anthropic/src/anthropic-language-model.ts:687` | A | `thinking: { type: 'disabled' }` is sent explicitly, not omitted | thinking option present |
| `ai:packages/anthropic/src/anthropic-language-model.ts:718` | A | A thinking object without `type` is sent for binding-only requests | always |
| `ai:packages/anthropic/src/anthropic-language-model.ts:736` | A | Effort is sent as `output_config.effort`, not inside `thinking` | `effort` set (by provider option or derived from `reasoning`) |
| `ai:packages/anthropic/src/anthropic-language-model.ts:905` | A | Enabled thinking without a budget gets 1024 tokens | `thinking.type === 'enabled'` and `budgetTokens` missing |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3211` | A | Capability row: claude-sonnet-5-5 | model id contains `claude-sonnet-5-5` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3225` | A | Capability row: claude-opus-5-5 | model id contains `claude-opus-5-5` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3239` | A | Capability row: claude-haiku-5-5 | model id contains `claude-haiku-5-5` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3254` | A | Capability row: claude-opus-5 | model id contains `claude-opus-5` and not `claude-opus-5-5` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3268` | A | Capability row: claude-fable-5-1 | model id contains `claude-fable-5-1` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3282` | A | Capability row: claude-fable-5 | model id contains `claude-fable-5` and not `claude-fable-5-1` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3299` | A | Capability row: claude-opus-4-8, claude-opus-4-7, claude-sonnet-5 | model id contains one of the three |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3315` | A | Capability row: claude-sonnet-4-6, claude-opus-4-6 | model id contains `claude-sonnet-4-6` or `claude-opus-4-6` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3332` | A | Capability row: claude-sonnet-4-5, claude-opus-4-5, claude-haiku-4-5 | model id contains one of the three |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3349` | A | Capability row: claude-opus-4-1 | model id contains `claude-opus-4-1` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3363` | A | Capability row: claude-sonnet-4 | `/claude-sonnet-4(?:-\|@)/` and none of the 4-5 / 4-6 rows above |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3377` | A | Capability row: claude-opus-4 | `/claude-opus-4(?:-\|@)/` and none of the rows above |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3391` | A | Capability row: claude-3-haiku | model id contains `claude-3-haiku` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3406` | A | Capability row: legacy Claude ids | claude-instant, claude-2 / claude-v2, other claude-3 ids |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3421` | A | Capability row: any other id containing `claude-` is assumed to be a newer model | id contains `claude-` and matched no row above |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3439` | A | Capability row: non-Claude ids get conservative defaults | id does not contain `claude-` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3522` | A | Generic reasoning `none`: between_tools, or effort low, or disabled | top-level `reasoning === 'none'` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3550` | A | Generic reasoning levels on adaptive models: effort plus `display: 'summarized'` | top-level `reasoning` set and model row has `supportsAdaptiveThinking` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3558` | A | Generic reasoning levels on older models: a token budget derived from the model maximum | top-level `reasoning` set and model row lacks `supportsAdaptiveThinking` |
| `ai:packages/anthropic/src/anthropic-language-model-options.ts:200` | A | The thinking option also accepts an object with no `type`, only `blockBinding` | provider option `thinking` without `type` |
| `ai:packages/provider-utils/src/map-reasoning-to-provider.ts:60` | A | Budget for a generic reasoning level is a fixed share of the model's max output tokens | generic `reasoning` level on a Claude model without adaptive thinking (4-5 family, opus-4-1, sonnet-4, opus-4, claude-3-haiku and older) |
| `ai:packages/provider-utils/src/map-reasoning-to-provider.ts:49` | A | A generic reasoning level that maps to another effort raises a compatibility warning | generic `reasoning` set |
| `pi:packages/ai/src/api/anthropic-messages.ts:950` | A | Adaptive or budget thinking is chosen by a compat flag set from the model id at catalog build time | `compat.forceAdaptiveThinking === true` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1261` | A | No reasoning level means thinking is explicitly disabled, not omitted | `model.reasoning` and `thinkingEnabled === false` and `model.thinkingLevelMap?.off !== null` |
| `pi:packages/ai/src/api/anthropic-messages.ts:924` | A | Effort mapping: minimal becomes low, anything unmapped becomes high | adaptive-thinking models via `streamSimple` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1250` | A | `output_config.effort` is only sent when an effort was given | `thinkingEnabled` and `compat.forceAdaptiveThinking === true` and not `supportsMidConvoEffort` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1257` | A | Budget thinking defaults to 1024 tokens | `thinkingEnabled` and not `forceAdaptiveThinking` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1246` | A | `thinking.display` defaults to `summarized` against the API default of newer models | thinking enabled |
| `pi:packages/ai/src/api/anthropic-messages.ts:1239` | A | Managed-effort models: thinking is always adaptive, with `block_binding` set to drop mismatched blocks | `compat.supportsMidConvoEffort === true` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1526` | A | Effort is carried by empty system messages with `output_config` | `compat.supportsMidConvoEffort === true` |
| `pi:packages/ai/src/types.ts:958` | A | compat `forceAdaptiveThinking` (default false) | flag true |
| `pi:packages/ai/src/types.ts:964` | A | compat `supportsMidConvoEffort` (default false) | flag true |
| `pi:packages/ai/scripts/generate-models.ts:1115` | A | Which efforts exist is decided by model-id substrings at catalog build time | catalog generation |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:495` | A | Only `thinking.type === "enabled"` is forwarded | `providerOptions.anthropic.thinking` present |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:499` | A | Budget read under camelCase or snake_case, missing budget is an error | `thinking.type === "enabled"` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:551` | A | Thinking is added without touching max_tokens, sampling or tool_choice | always |
| `oc:packages/opencode/src/provider/transform.ts:726` | A | Binding injection switches thinking on as adaptive when none was configured (older runtime) | binding model on the Anthropic SDK packages |
| `oc:packages/opencode/src/provider/transform.ts:665` | A | Adaptive thinking is decided by parsing a version out of the model id (older runtime) | reasoning-capable model on `@ai-sdk/anthropic` / `@ai-sdk/google-vertex/anthropic` |
| `oc:packages/opencode/src/provider/transform.ts:674` | A | Effort ladders: five steps from 4.7, four on 4.6 (older runtime) | adaptive models |
| `oc:packages/opencode/src/provider/transform.ts:1064` | A | display forced to "summarized" from 4.7 so thinking text is not empty (older runtime) | `anthropicUsesModernAdaptiveThinking(model.api.id)` |
| `oc:packages/opencode/src/provider/transform.ts:1082` | A | Older models: two fixed budgets derived from the output limit (older runtime) | Anthropic SDK packages, no adaptive ladder, not Opus 4.5 |
| `oc:packages/opencode/src/provider/transform.ts:669` | A | Opus 4.5: effort together with an enabled budget (older runtime) | Opus 4.5 on the Anthropic SDK packages |
| `oc:packages/opencode/src/provider/transform.ts:1056` | A | Claude through GitHub Copilot on the Anthropic wire: ladder cut down (older runtime) | `model.providerID === "github-copilot"` with an Anthropic SDK package |
| `oc:packages/opencode/src/provider/transform.ts:1750` | A | Metadata-driven budgets are capped at 31999 (older runtime) | `reasoning_options` of type `budget_tokens` |
| `oc:packages/opencode/src/provider/transform.ts:1305` | A | Kimi / Moonshot on the Anthropic wire: adaptive + summarized + effort high by default (older runtime) | Anthropic SDK packages, `isKimiFamily(model)`, reasoning-capable |
| `oc:packages/opencode/src/provider/transform.ts:1295` | A | MiniMax M3 on the Anthropic wire: thinking must be switched on (older runtime) | model id contains `minimax-m3` and npm `@ai-sdk/anthropic` |
| `oc:packages/opencode/src/provider/transform.ts:829` | A | GLM-5.2 on the Anthropic wire: bare effort, two values (older runtime) | id contains `glm-5.2` / `glm-5-2` / `glm-5p2` and npm `@ai-sdk/anthropic` |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:324` | O | A generic reasoning level is sent verbatim as `reasoning_effort` | provider option or top-level `reasoning` set |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:122` | O | reasoning_effort: provider option first, else the generic reasoning level unchanged | either is set |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:130` | O | An effort the model does not list is dropped with a warning | `gpt-6-sol` / `gpt-6-luna` (list none, low, medium, high, xhigh, max) and every other id parsed as gpt major 6 or later (list low, medium, high, xhigh, max); older models have no list and are never checked |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:151` | O | `reasoningSummary` given to the chat model only raises a warning | `providerOptions.openai.reasoningSummary` set |
| `ai:packages/openai/src/openai-language-model-capabilities.ts:63` | O | Effort lists per model family | always |
| `pi:packages/ai/src/api/openai-completions.ts:747` | O | The reasoning level is clamped to what the model lists before any field is built | `streamSimple` |
| `pi:packages/ai/src/api/openai-completions.ts:974` | O | Default format: `reasoning_effort`, omitted when off unless the model maps `off` to a value | `thinkingFormat === "openai"`, `model.reasoning` and `compat.supportsReasoningEffort` |
| `pi:packages/ai/src/api/openai-completions.ts:885` | O | z.ai: `thinking: { type, clear_thinking: false }` | `compat.thinkingFormat === "zai"` and `model.reasoning` (detected for providers `zai`, `zai-coding-cn`, hosts `api.z.ai`, `open.bigmodel.cn`, :1597-1601) |
| `pi:packages/ai/src/api/openai-completions.ts:894` | O | Qwen/DashScope: top-level `enable_thinking` | `compat.thinkingFormat === "qwen"` and `model.reasoning` |
| `pi:packages/ai/src/api/openai-completions.ts:904` | O | Qwen chat template: `chat_template_kwargs` with `preserve_thinking: true` | `compat.thinkingFormat === "qwen-chat-template"` and `model.reasoning` |
| `pi:packages/ai/src/api/openai-completions.ts:1073` | O | Generic chat template and Baseten: configurable kwargs with pi variables | `compat.thinkingFormat` is `chat-template` or `baseten`, and `model.reasoning` |
| `pi:packages/ai/src/api/openai-completions.ts:931` | O | DeepSeek format: `thinking: { type }` plus `reasoning_effort` | `compat.thinkingFormat === "deepseek"` and `model.reasoning` (detected for provider `deepseek` or host containing `deepseek.com`, :1611; generator also uses it for Xiaomi MiMo, Moonshot and OpenCode Kimi K2.6) |
| `pi:packages/ai/src/api/openai-completions.ts:946` | O | OpenRouter format: nested `reasoning: { effort }`, with `none` when off | `compat.thinkingFormat === "openrouter"` and `model.reasoning` (detected by provider `openrouter` or host `openrouter.ai`, :1605) |
| `pi:packages/ai/src/api/openai-completions.ts:958` | O | Together: `reasoning: { enabled }`; ant-ling: `reasoning: { effort }` only for mapped levels; string-thinking: `thinking: "<level>"` | `compat.thinkingFormat` is `together`, `ant-ling` or `string-thinking`, and `model.reasoning` |
| `pi:packages/ai/src/api/openai-completions.ts:984` | O | A reasoning token budget is sent under a host-specific top-level name | `compat.thinkingTokenBudgetField` (or `supportsThinkingTokenBudget`), a reasoning level is set, `model.reasoning`, and the clamped budget is above 0 |
| `pi:packages/ai/src/types.ts:816` | O | compat `supportsReasoningEffort` (default: auto-detected) | flag true |
| `pi:packages/ai/src/types.ts:832` | O | compat `thinkingFormat` (default `openai`; detected deepseek / zai / together / ant-ling / openrouter) | always, for `model.reasoning` |
| `pi:packages/ai/src/types.ts:845` | O | compat `chatTemplateKwargs` and `chatTemplateArgs` | matching `thinkingFormat` |
| `pi:packages/ai/src/types.ts:861` | O | compat `thinkingTokenBudgetField` and its alias `supportsThinkingTokenBudget` | set |
| `pi:packages/ai/scripts/generate-models.ts:1159` | O | A model that breaks when reasoning is switched off gets `off: null`, so the reasoning field is omitted | `openrouter` ids starting `inception/mercury-2`; `moonshotai`/`moonshotai-cn` kimi-k2.7-code; `opencode` grok-build-0.1 |
| `pi:packages/ai/scripts/generate-models.ts:2206` | O | OpenCode Kimi K2.6 takes a thinking object but rejects a string or a combined `reasoning_effort` | providers `opencode` / `opencode-go`, model `kimi-k2.6` |
| `oc:packages/llm/src/protocols/utils/openai-options.ts:46` | O | reasoning_effort is read from providerOptions.openai for every provider | `providerOptions.openai.reasoningEffort` set |
| `oc:packages/llm/src/protocols/openai-chat.ts:336` | O | Effort "max" is a local error; unknown strings vanish | `reasoningEffort` given |
| `oc:packages/llm/src/providers/openai-options.ts:49` | O | gpt-5 ids get reasoning_effort "medium" by default through the facade | model id contains `gpt-5`, not `gpt-5-chat`, not `gpt-5-pro`; provider facade openai / azure / github-copilot |
| `oc:packages/llm/src/providers/openrouter.ts:64` | O | OpenRouter takes a free-form `reasoning` object | provider `openrouter` |
| `oc:packages/opencode/src/provider/transform.ts:1002` | O | reasoning_effort ladder for OpenAI-compatible packages (older runtime) | those SDK packages |
| `oc:packages/opencode/src/provider/transform.ts:843` | O | Model families that get no effort control at all (older runtime) | those id substrings |
| `oc:packages/opencode/src/provider/transform.ts:857` | O | grok-3-mini: only low and high (older runtime) | id contains `grok-3-mini` |
| `oc:packages/opencode/src/provider/transform.ts:876` | O | OpenRouter: effort travels in a `reasoning` object (older runtime) | npm `@openrouter/ai-sdk-provider` |
| `oc:packages/opencode/src/provider/transform.ts:589` | O | GPT-5 effort values depend on id version and release date (older runtime) | OpenAI-family ids |
| `oc:packages/opencode/src/provider/transform.ts:1355` | O | reasoning_effort "medium" by default for gpt-5 ids (older runtime) | as stated |
| `oc:packages/opencode/src/provider/transform.ts:1347` | O | Azure chat-completion URLs: no reasoning effort from gpt-5.5 up (older runtime) | npm `@ai-sdk/azure` and `providerOptions.useCompletionUrls` |
| `oc:packages/opencode/src/provider/transform.ts:1429` | O | OpenAI SDK told to treat the model as a reasoning model (older runtime) | npm `@ai-sdk/openai`, `@ai-sdk/azure` or `@ai-sdk/amazon-bedrock/mantle` |
| `oc:packages/opencode/src/provider/transform.ts:1262` | O | chat_template_args.enable_thinking for Baseten and two opencode-hosted models (older runtime) | provider id `baseten`, or provider id `opencode` with api id `kimi-k2-thinking` or `glm-4.6` (:1258-1261) |
| `oc:packages/opencode/src/provider/transform.ts:1271` | O | Z.ai / Zhipu: thinking enabled with clear_thinking false (older runtime) | provider id contains `zai` or `zhipuai` and npm `@ai-sdk/openai-compatible` (:1265-1268) |
| `oc:packages/opencode/src/provider/transform.ts:1320` | O | DashScope needs enable_thinking to return reasoning_content (older runtime) | provider id `alibaba-cn`, reasoning-capable, npm `@ai-sdk/openai-compatible`, id not containing `kimi-k2-thinking` (:1314-1319) |
| `oc:packages/opencode/src/provider/transform.ts:803` | O | MiniMax M3 on chat: thinking toggled per host (older runtime) | api id contains `minimax-m3` and npm `@ai-sdk/openai-compatible` (or `@ai-sdk/anthropic`) |
| `oc:packages/opencode/src/provider/transform.ts:1169` | O | Other per-provider effort sets (older runtime) | as listed |
| `pi:packages/ai/src/api/simple-options.ts:78` | both | Thinking budgets per level, with xhigh and max treated as high | budget-based thinking (Anthropic budget models; OpenAI hosts with a thinking token budget field) |
| `oc:packages/llm/src/route/transport/http.ts:58` | both | `thinking` cannot be supplied through the body overlay | `request.http.body` contains `thinking` |

#### Cache marks (47)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:525` | A | One breakpoint counter is shared by tools and messages | always |
| `ai:packages/anthropic/src/anthropic-language-model.ts:772` | A | A top-level `cache_control` can be put on the request body | provider option `cacheControl` set |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:185` | A | A cache mark on a system message lands on that message's text block | `providerOptions.anthropic.cacheControl` (or `cache_control`) on a system message |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:315` | A | Cache mark precedence on user parts: the part first, then the message for its last part | always |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:526` | A | Cache mark precedence on tool results: part, then output, then the message for the last part | tool result |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:783` | A | A cache mark on a thinking block is refused | cache mark on a reasoning part |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:1194` | A | Result fields are rebuilt in a fixed key order for cache stability | provider-run bash code execution result in the history |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:86` | A | A cache mark on a tool definition lands on that tool | function tool with `providerOptions.anthropic.cacheControl` |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:144` | A | Provider-run tools cannot carry a cache mark | provider tool |
| `ai:packages/anthropic/src/get-cache-control.ts:8` | A | At most 4 cache breakpoints per request | always |
| `ai:packages/anthropic/src/get-cache-control.ts:51` | A | The fifth and later marks are dropped with a warning | more than 4 marks in one request |
| `ai:packages/anthropic/src/get-cache-control.ts:18` | A | A mark is read under two spellings and passed through unvalidated | always |
| `ai:packages/anthropic/src/get-cache-control.ts:44` | A | A mark where caching is not possible is refused with a warning | `context.canCache === false` |
| `ai:packages/anthropic/src/anthropic-api.ts:220` | A | Items nested in a tool result cannot carry a cache mark | tool result with content items |
| `pi:packages/ai/src/api/anthropic-messages.ts:73` | A | Cache retention defaults to `short`; an env var can make it `long` | `options.cacheRetention` is unset |
| `pi:packages/ai/src/api/anthropic-messages.ts:88` | A | `ttl: "1h"` only for long retention on hosts that support it | `retention === "long"` and `compat.supportsLongCacheRetention` (default true; false in the generator for Fireworks and other rows, e.g. packages/ai/scripts/generate-models.ts:1668) |
| `pi:packages/ai/src/api/anthropic-messages.ts:1189` | A | System blocks each get a breakpoint (two under OAuth) | cache retention is not `none` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1608` | A | Only the last tool carries `cache_control`, and only where tools accept it | cache retention is not `none` and `compat.supportsCacheControlOnTools` (default true; false for Fireworks, packages/ai/scripts/generate-models.ts:1667) |
| `pi:packages/ai/src/api/anthropic-messages.ts:1486` | A | One breakpoint on the last block of the last message, only if it is a user or system message | cache retention is not `none` |
| `pi:packages/ai/src/types.ts:924` | A | compat `supportsLongCacheRetention` (default true) | flag false: no `ttl` is ever sent |
| `pi:packages/ai/src/types.ts:942` | A | compat `supportsCacheControlOnTools` (default true) | flag false |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:238` | A | At most four cache_control markers per request | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:245` | A | Markers over the cap are dropped silently, with one warning log | more than four cache hints reach the lowering |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:511` | A | Budget is spent in the order tools, system, messages | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:250` | A | TTL collapses to two buckets | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:244` | A | Hint type "persistent" is sent as ephemeral | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:433` | A | Hints on image, tool_use and thinking parts are ignored | cache hint on a media, tool-call or reasoning part |
| `oc:packages/llm/src/cache-policy.ts:34` | A | Caching is on by default: three markers injected before lowering | `request.cache` undefined or `"auto"` |
| `oc:packages/llm/src/cache-policy.ts:100` | A | Auto placement is keyed on the route id, not the protocol | always |
| `oc:packages/llm/src/cache-policy.ts:91` | A | "Latest user message" means neutral role user, not the last wire user message | default policy |
| `oc:packages/llm/src/cache-policy.ts:72` | A | Marker goes on the last text part, else the last part; manual hints win | policy placing a message marker |
| `oc:packages/llm/src/protocols/shared.ts:146` | A | Wrapped system update keeps only the last part's cache hint | system-update fallback path |
| `oc:packages/opencode/src/provider/transform.ts:359` | A | Marks go on the first two system messages and the last two other messages (older runtime) | caching applies (next finding) |
| `oc:packages/opencode/src/provider/transform.ts:475` | A | When the caching pass runs (older runtime) | as listed |
| `oc:packages/opencode/src/provider/transform.ts:385` | A | Message-level mark for Anthropic, last-part mark for everyone else (older runtime) | caching applies |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:237` | O | Prompt cache fields: prompt_cache_key, prompt_cache_options, prompt_cache_retention | the option is set |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:255` | O | prompt_cache_retention is removed for models with an effort list | gpt-6 and later with `promptCacheRetention` |
| `ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:62` | O | An explicit cache breakpoint turns string content into a one-item text array | the provider option is present |
| `pi:packages/ai/src/api/openai-completions.ts:827` | O | `prompt_cache_key` is the session id, sent to api.openai.com or with long retention | see condition; CHANGELOG.md:1259 |
| `pi:packages/ai/src/api/openai-completions.ts:831` | O | `prompt_cache_retention: "24h"` for long retention | `cacheRetention === "long" && compat.supportsLongCacheRetention` (detected false for Together, Cloudflare Workers AI / AI Gateway, NVIDIA, ant-ling, :1682-1688) |
| `pi:packages/ai/src/api/openai-completions.ts:1081` | O | Anthropic-style `cache_control` marks on an OpenAI-format request | `compat.cacheControlFormat === "anthropic"` (detected for provider `openrouter` with model id starting `anthropic/`, :1642; generator: OpenCode rows served by `@ai-sdk/alibaba`, packages/ai/scripts/generate-models.ts:2190-2193) |
| `pi:packages/ai/src/types.ts:873` | O | compat `cacheControlFormat` (`"anthropic"` or unset) | `"anthropic"` |
| `pi:packages/ai/src/types.ts:879` | O | compat `supportsLongCacheRetention` (default: auto-detected) | flag false: none of the three is sent |
| `oc:packages/llm/src/cache-policy.ts:42` | O | No cache markers on chat; the policy pass is skipped | always |
| `oc:packages/llm/src/providers/openrouter.ts:65` | O | prompt_cache_key only through the OpenRouter options | provider `openrouter` |
| `oc:packages/opencode/src/provider/transform.ts:373` | O | Cache marks for Claude behind chat-compatible endpoints (older runtime) | caching applies (model id contains `claude` / `anthropic`, …) on a non-Anthropic provider id |
| `oc:packages/opencode/src/provider/transform.ts:1325` | O | Prompt cache key is the session id, under two spellings (older runtime) | as listed |

#### Output limit (14)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:415` | A | Unknown model: max_tokens is still sent, from a fallback, with a warning | model id not in the known rows of `getModelCapabilities` and no `maxOutputTokens` given |
| `ai:packages/anthropic/src/anthropic-language-model.ts:702` | A | max_tokens is always sent; the default comes from the per-model table | `maxOutputTokens` not given |
| `ai:packages/anthropic/src/anthropic-language-model.ts:944` | A | The thinking budget is added on top of max_tokens | thinking is on (comment :943 "adjust max tokens to account for thinking") |
| `ai:packages/anthropic/src/anthropic-language-model.ts:960` | A | max_tokens is clamped to the model's maximum for known models | `isKnownModel` rows only; unknown ids are never clamped |
| `pi:packages/ai/src/api/anthropic-messages.ts:1162` | A | `max_tokens` defaults to the model's maximum output | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:974` | A | With budget thinking, `max_tokens` grows by the budget and the budget keeps 1024 for the answer | `streamSimple` with a reasoning level on a model without `forceAdaptiveThinking` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:510` | A | max_tokens always sent, defaulting to 4096 | always |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:287` | O | The output limit is always sent as `max_tokens` | always |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:325` | O | The limit is sent as `max_tokens`, and as `max_completion_tokens` for reasoning models | reasoning model = `forceReasoning` option, or id matching `^o<digits>(-\|$)`, or `^gpt-<major>...` with major >= 5 that is not a `-chat` variant without minor version |
| `pi:packages/ai/src/api/openai-completions.ts:843` | O | The output limit is omitted unless the caller set one, and its name depends on the host | `max_tokens` for hosts chutes.ai, DeepSeek, Moonshot, Cloudflare AI Gateway, Together, NVIDIA, ant-ling, z.ai (:1629-1637) or `compat.maxTokensField` |
| `pi:packages/ai/src/types.ts:822` | O | compat `maxTokensField` (default: auto-detected) | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:361` | O | Always `max_tokens`, never `max_completion_tokens`, and no default | always |
| `pi:packages/ai/src/api/simple-options.ts:20` | both | The output limit is clamped to what is left of the context window | `streamSimple`; skipped when `model.contextWindow <= 0` (:19) |
| `oc:packages/opencode/src/provider/transform.ts:1482` | both | Output limit capped at 32000 (older runtime) | always |

#### Sampling and stop sequences (21)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:334` | A | frequencyPenalty, presencePenalty and seed are never sent | the option is set |
| `ai:packages/anthropic/src/anthropic-language-model.ts:349` | A | Temperature is clamped into 0..1 | `temperature > 1` or `temperature < 0` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:426` | A | temperature, top_k and top_p are dropped for models that reject sampling parameters | model id contains `claude-sonnet-5-5`, `claude-opus-5-5`, `claude-haiku-5-5`, `claude-opus-5`, `claude-fable-5-1`, `claude-fable-5`, `claude-opus-4-8`, `claude-opus-4-7`, `claude-sonnet-5`, or is any other unlisted `claude-` id |
| `ai:packages/anthropic/src/anthropic-language-model.ts:921` | A | temperature, top_k and top_p are removed whenever thinking is on | thinking type is `enabled`, `adaptive` or `between_tools` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:949` | A | top_p is dropped when temperature is also set, but only for Claude models | thinking off, both `topP` and `temperature` set, `isKnownModel \|\| modelId.includes('claude-')` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1194` | A | Temperature is dropped whenever thinking is on or the model rejects it | dropped if `options.thinkingEnabled` or `compat.supportsMidConvoEffort === true` or `compat.supportsTemperature === false` (generator: ids containing opus-4-7/4.7, opus-4-8/4.8, opus-5, sonnet-5-5/5.5, haiku-5-5/5.5, packages/ai/scripts/generate-models.ts:643-656) |
| `pi:packages/ai/src/types.ts:948` | A | compat `supportsTemperature` (default true) | flag false |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:550` | A | stop renamed; penalties and seed silently dropped | always |
| `oc:packages/opencode/src/provider/transform.ts:533` | A | No temperature default for Claude (older runtime) | model id contains `claude` |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:247` | O | topK is not sent | `topK` set |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:197` | O | logprobs option is split into `logprobs` and `top_logprobs` | provider option `logprobs` |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:265` | O | Reasoning models: temperature, top_p and logprobs are removed unless effort is `none` on a 5.1+ model | reasoning model; exception for gpt major 5 with minor >= 1 (not gpt 6 or later) and effort `none` |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:293` | O | Reasoning models: frequency_penalty, presence_penalty, logit_bias, top_logprobs are always removed | reasoning model |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:333` | O | Search-preview models: temperature is removed | model id starts with `gpt-4o-search-preview` or `gpt-4o-mini-search-preview` (and is not a reasoning model) |
| `ai:packages/openai/src/openai-language-model-capabilities.ts:53` | O | Which models keep sampling parameters at effort `none` | always |
| `pi:packages/ai/src/api/openai-completions.ts:1006` | O | Temperature is sent whenever given; arbitrary sampling fields are merged last | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:367` | O | Six sampling fields passed as given; topK dropped | always |
| `oc:packages/llm/src/route/client.ts:170` | both | Generation options resolved per field: request over model over route | always |
| `oc:packages/opencode/src/provider/transform.ts:541` | both | Temperature defaults by model id (older runtime) | id substring match, whatever the wire |
| `oc:packages/opencode/src/provider/transform.ts:553` | both | top_p defaults by model id (older runtime) | id substring match |
| `oc:packages/opencode/src/provider/transform.ts:568` | both | top_k defaults by model id (older runtime) | id contains `minimax-m2` |

#### Stream switch (9)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:1090` | A | `stream` is left out of the body when not streaming | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:642` | A | `stream: true` is forced even after a caller hook replaced the payload | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:545` | A | Streaming is the only mode | always |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:460` | O | `stream_options` is sent only when the host opted in | `includeUsage` provider setting |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:501` | O | Streaming always asks for usage | stream |
| `pi:packages/ai/src/api/openai-completions.ts:834` | O | `stream_options.include_usage` unless the host rejects it | `compat.supportsUsageInStreaming !== false` |
| `pi:packages/ai/src/types.ts:818` | O | compat `supportsUsageInStreaming` (default true) | flag false: field omitted |
| `oc:packages/llm/src/protocols/openai-chat.ts:360` | O | stream_options.include_usage is always sent | always |
| `oc:packages/llm/src/route/transport/http.ts:53` | both | `stream` and `stream_options` are protocol-owned | `request.http.body` contains `stream` / `stream_options` |

#### Cut output sent back (2)

| Where | Format | What the code does | When |
|---|---|---|---|
| `pi:packages/ai/src/api/anthropic-messages.ts:1419` | A | A thinking block cut off before its signature is replayed as text | thinking block without signature in a replayed assistant message |
| `pi:packages/ai/src/api/transform-messages.ts:201` | both | Assistant messages that ended in error or abort are removed from the request | `stopReason` is `error` or `aborted` |

#### Other request fields (26)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:516` | A | `compaction` and `contextManagement` cannot both be set | both provider options present |
| `ai:packages/anthropic/src/anthropic-language-model.ts:767` | A | `fallbacks` is sent only when it is `'default'` or a non-empty list | provider option `fallbacks` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:775` | A | The user id is sent as `metadata.user_id` | `providerOptions.anthropic.metadata.userId != null` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:889` | A | An unknown context-management edit is dropped with a warning | provider option `contextManagement.edits` holds an unknown type |
| `ai:packages/anthropic/src/anthropic-language-model-options.ts:319` | A | A task budget below 20000 tokens is rejected before the request | provider option `taskBudget` |
| `ai:packages/anthropic/src/anthropic-language-model-options.ts:358` | A | A `fallbacks` list is written in wire shape by the caller and passed through | provider option `fallbacks` as an array |
| `pi:packages/ai/src/api/anthropic-messages.ts:1268` | A | `metadata` carries only `user_id`, and only when it is a string | `options.metadata.user_id` is a string |
| `pi:packages/ai/src/api/anthropic-messages.ts:1283` | A | `fallbacks` lists the models allowed for server-side fallback | `compat.allowedFallbackModels` non-empty (generator: claude-fable-5 and claude-opus-5, packages/ai/scripts/generate-models.ts:273-276) |
| `pi:packages/ai/src/types.ts:975` | A | compat `allowedFallbackModels` (default absent) | list non-empty |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:156` | A | Closed body: no metadata, service tier or other top-level field | always |
| `oc:packages/opencode/src/provider/transform.ts:1231` | A | toolStreaming switched off for non-Claude models on the Anthropic SDK (older runtime) | npm `@ai-sdk/google-vertex/anthropic`, or npm `@ai-sdk/anthropic` with an api id that does not contain `claude` (:1227-1230) |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:312` | O | Any other key under the provider's options is copied into the request body | always |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:349` | O | service_tier is removed when the model is not known to support it | provider option `serviceTier` |
| `ai:packages/openai/src/chat/openai-chat-language-model-options.ts:132` | O | Request metadata is length-checked before sending | provider options given |
| `pi:packages/ai/src/api/openai-completions.ts:839` | O | `store: false` on hosts that know the field | `compat.supportsStore` |
| `pi:packages/ai/src/api/openai-completions.ts:989` | O | Gateway routing fields: `provider` (OpenRouter) and `providerOptions.gateway` (Vercel) | `model.compat.openRouterRouting` / `vercelGatewayRouting` / `vllmPriority` set |
| `pi:packages/ai/src/types.ts:812` | O | compat `supportsStore` (default: auto-detected) | flag true |
| `pi:packages/ai/src/types.ts:849` | O | compat `openRouterRouting` and `vercelGatewayRouting` | set on the model |
| `pi:packages/ai/src/types.ts:886` | O | compat `vllmPriority` | set |
| `oc:packages/llm/src/providers/openai-options.ts:70` | O | `store: false` injected by default through the OpenAI-family facades | provider facade openai / azure / github-copilot |
| `oc:packages/llm/src/providers/openrouter.ts:60` | O | OpenRouter: `usage: {include: true}` and an open body | provider `openrouter` |
| `oc:packages/llm/src/protocols/openai-chat.ts:91` | O | Closed body: no user, service_tier, metadata, logit_bias, n | always |
| `oc:packages/opencode/src/provider/transform.ts:1242` | O | store: false wherever the OpenAI-family packages are used (older runtime) | provider id `openai`, or npm `@ai-sdk/openai`, `@ai-sdk/github-copilot`, `@ai-sdk/amazon-bedrock/mantle`, `@ai-sdk/xai`, `@ai-sdk/azure` |
| `oc:packages/opencode/src/provider/transform.ts:1250` | O | OpenRouter: usage accounting requested on every call (older runtime) | npm `@openrouter/ai-sdk-provider` or `@llmgateway/ai-sdk-provider` |
| `oc:packages/llm/src/route/transport/http.ts:82` | both | Extra body fields via a deep-merged overlay, minus a denylist | `request.http.body` set |
| `oc:packages/llm/src/route/client.ts:350` | both | The lowered body is checked against the protocol schema before sending | always |

#### Framing (13)

| Where | Format | What the code does | When |
|---|---|---|---|
| `pi:packages/ai/src/api/anthropic-messages.ts:461` | A | Own SSE decoder: any of CR, LF, CRLF ends a line | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:429` | A | Only `event` and `data` fields are read; one leading space is stripped; data lines are joined with a newline | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:521` | A | A stream that ends without a final blank line still yields its last event | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:546` | A | Events are dispatched by the SSE `event:` name, not by the JSON `type` | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:551` | A | Event JSON is parsed with a repair pass | always |
| `pi:packages/ai/src/api/openai-completions.ts:560` | O | Anything that is not an object chunk is skipped | always |
| `ai:packages/provider-utils/src/parse-json-event-stream.ts:25` | both | The SSE stream is split by the eventsource-parser library and only `data` is used | every streamed response |
| `ai:packages/provider-utils/src/parse-json-event-stream.ts:27` | both | `[DONE]` is skipped, it does not end the stream | every streamed response |
| `ai:packages/provider-utils/src/parse-json-event-stream.ts:31` | both | Each data payload is JSON-parsed and validated without throwing | every streamed response |
| `ai:packages/provider-utils/src/secure-json-parse.ts:57` | both | JSON containing a `__proto__` key is rejected | always |
| `oc:packages/llm/src/protocols/shared.ts:247` | both | SSE frames: empty data and [DONE] are dropped | always |
| `oc:packages/llm/src/protocols/shared.ts:248` | both | Only the data field is kept; the SSE event name is discarded | always |
| `oc:packages/llm/src/protocols/shared.ts:246` | both | SSE retry control is swallowed | server sends an SSE `retry:` field |

#### Step opens (10)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:2862` | A | A repeated message_start with the same id is ignored | `message_start` received before `message_stop` |
| `pi:packages/ai/src/api/anthropic-messages.ts:658` | A | `start` is emitted on the HTTP response, before any stream frame | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:209` | A | message_start: only usage is read | `type === "message_start"` |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:613` | O | Response metadata is taken from the first chunk that has any | stream |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:911` | O | An empty-string role is tolerated in deltas | always |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:583` | O | Response metadata comes from the first chunk that has any; Azure may send an empty one first | stream |
| `ai:packages/openai/src/chat/openai-chat-api.ts:129` | O | Only the role `assistant` is accepted in a delta | always |
| `pi:packages/ai/src/api/openai-completions.ts:564` | O | The response id is taken from the first chunk that has one | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:156` | O | A chunk is decoded as `choices` and `usage` only | always |
| `oc:packages/llm/src/protocols/utils/lifecycle.ts:13` | both | step-start is lazy and always index 0 | always |

#### Part boundaries (16)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:2018` | A | Text and reasoning parts are identified by the block index; tool parts by the tool_use id | stream |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2573` | A | A content block type outside the known list throws inside the stream transform | unknown `content_block.type` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2581` | A | content_block_stop is acted on only for a block that was opened | stream |
| `ai:packages/anthropic/src/anthropic-api.ts:804` | A | Non-stream: one content block of an unknown type rejects the whole response | non-stream response with a new block type |
| `pi:packages/ai/src/api/anthropic-messages.ts:739` | A | Blocks are found by the wire `index`, not by array position | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:692` | A | A `fallback` content block is skipped at the start and fatal later | `event.content_block.type === "fallback"` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:681` | A | Part ids are built from the block index; a missing index becomes 0 | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:678` | A | Text or thinking carried on content_block_start is emitted | `content_block_start` with non-empty `text` / `thinking` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:774` | A | content_block_stop does not know the block type | `type === "content_block_stop"` |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:647` | O | One text part `txt-0` and one reasoning part `reasoning-0`, opened and closed by switching | stream |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:636` | O | One text part with id `0`, opened by the first non-null content, closed at the end | stream |
| `pi:packages/ai/src/api/openai-completions.ts:685` | O | One text block and one thinking block per response; every block ends only when the stream ends | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:424` | O | One text part and one reasoning part per response, with fixed ids | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:427` | O | Reasoning ends at the first content delta or tool-call delta | always |
| `oc:packages/llm/src/protocols/utils/lifecycle.ts:23` | both | A text part starts with its first non-empty delta | always |
| `oc:packages/llm/src/protocols/utils/lifecycle.ts:75` | both | Parts still open at finish are closed then, reasoning before text | finish emitted with parts open |

#### Text (9)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:1328` | A | A compaction block is surfaced as text tagged `type: 'compaction'` | response contains a `compaction` block |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2065` | A | A compaction block may arrive complete in content_block_start | `content_block_start` of type `compaction` |
| `ai:packages/anthropic/src/anthropic-api.ts:1176` | A | Text or thinking carried by content_block_start itself is not emitted | `content_block_start` of type text or thinking |
| `pi:packages/ai/src/api/anthropic-messages.ts:699` | A | Text block start tolerates a missing `text` | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:709` | A | Empty text deltas are discarded | always |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:839` | O | Content may be a string or an array of typed parts | always |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:433` | O | Non-stream text falls back to the audio transcript | non-stream |
| `pi:packages/ai/src/api/openai-completions.ts:595` | O | Null, missing and empty `content` deltas are ignored | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:422` | O | Empty or null content is skipped; only choices[0] is read | always |

#### Reasoning (12)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:2737` | A | Thinking arrives as its own block; deltas map one to one onto reasoning deltas | stream |
| `pi:packages/ai/src/api/anthropic-messages.ts:708` | A | Thinking block start tolerates missing `thinking` and `signature` | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:717` | A | Thinking arrives only as thinking_delta / block-start thinking | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:728` | A | signature_delta is treated as the end of the reasoning part | always |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:383` | O | Non-stream reasoning is read from `reasoning_content`, then `reasoning` | always |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:688` | O | Stream reasoning is read from `delta.reasoning_content`, then `delta.reasoning`, and emitted before text | stream |
| `ai:packages/openai/src/chat/openai-chat-api.ts:130` | O | The api.openai.com chat implementation reads no reasoning at all | always |
| `pi:packages/ai/src/api/openai-completions.ts:611` | O | Reasoning is read from three delta fields; only the first non-empty one counts | always |
| `pi:packages/ai/src/api/openai-completions.ts:628` | O | The name of the reasoning field is remembered as the block's signature | always |
| `pi:packages/ai/src/api/openai-completions.ts:674` | O | `reasoning_details` deltas open a thinking block even without text | `choice.delta.reasoning_details` is an array |
| `oc:packages/llm/src/protocols/openai-chat.ts:419` | O | Only `delta.reasoning_content` is read as reasoning | always |
| `oc:packages/llm/src/providers/openrouter.ts:53` | O | OpenRouter reuses the same stream parser | provider `openrouter` |

#### Tool call (53)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:1384` | A | Non-stream tool input is re-serialised to a JSON string | always (non-stream) |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2130` | A | Tool input present in content_block_start is used only if it is not `{}` | `content_block_start` of type `tool_use` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2654` | A | The complete tool call is emitted at content_block_stop, and empty input becomes `{}` | `content_block_stop` of a tool_use / server_tool_use block |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2779` | A | Empty input_json_delta frames are skipped | `partial_json === ''` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2794` | A | An input_json_delta for a block that is not a tracked tool call is dropped | stream |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2933` | A | Tool calls already present in message_start.content are emitted as complete calls | `message_start.message.content != null` (programmatic tool calling) |
| `ai:packages/anthropic/src/anthropic-api.ts:1143` | A | message_start content may only hold tool_use blocks | `message_start` |
| `ai:packages/anthropic/src/anthropic-api.ts:1205` | A | A server_tool_use with an unrecognised name is accepted and produces nothing | `server_tool_use` with a new name |
| `pi:packages/ai/src/api/anthropic-messages.ts:767` | A | Tool-call arguments are re-parsed from the accumulated JSON on every delta and at the end | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:806` | A | The scratch buffer is removed before the message is stored | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:128` | A | OAuth mode maps tool names back to the caller's casing | `apiKey` contains `sk-ant-oat` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:669` | A | Tool id falls back to the block index, name to empty string | `content_block_start` of type `tool_use` or `server_tool_use` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:661` | A | A tool_use start without index is ignored | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:188` | A | `input` on the start block is never used | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:751` | A | Empty partial_json skipped; delta for an unknown index fails the stream | `delta.type === "input_json_delta"` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:768` | A | Tool call is emitted at content_block_stop of its block | always |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:398` | O | A tool call without an id gets a generated one | `toolCall.id` falsy |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:490` | O | Tool-call deltas are buffered per index until the function name arrives | stream tool-call delta with an `index` whose name is not yet known |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:500` | O | A tool-call delta without `index` bypasses the buffer | `tool_calls[].index` null or missing |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:729` | O | Tool-call deltas that never got a name are pushed to the tracker at the end so it fails | a tool call whose `function.name` never arrived |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:920` | O | Tool-call fields are all optional in stream chunks | always |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:442` | O | Non-stream: a tool call without an id gets a generated one | `toolCall.id` falsy |
| `ai:packages/openai/src/chat/openai-chat-api.ts:134` | O | Stream tool-call deltas must carry `index`; id, type, name and arguments are optional | always |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:88` | O | One tracker assembles tool calls from deltas for every OpenAI-style provider | stream with `delta.tool_calls` |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:491` | O | Blank ids and blank names count as missing | always |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:150` | O | A delta that repeats a blank name is a continuation, or is ignored | `function.name` is an empty or whitespace string |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:144` | O | A delta that cannot be attributed to one call is dropped silently | ambiguous correlation |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:197` | O | How a delta is matched to a call: id, then index and name, then structure of the arguments | always |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:247` | O | The same id on a different index with a name is a new call | known `id`, named delta, index with no matching call |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:277` | O | A new id on a known index is not automatically a new call | unseen `id`, index already tracked |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:293` | O | A different name on a known index starts a new call | no `id`, index already tracked |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:338` | O | A fresh `{` after a call's arguments are complete means another call | several deltas share index / name / id |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:387` | O | A new call must have a function name | first fragment of a call lacks `function.name` |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:376` | O | `type` on a new call is checked according to the provider's setting | new call |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:455` | O | A missing or already used id is replaced by a generated one | new call |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:420` | O | A call that arrives whole in one chunk is emitted as start plus one delta | new call with `function.arguments` |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:429` | O | No tool call is finalised before the stream ends | always |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:180` | O | Calls are finalised in index order only if every call had an index | flush |
| `ai:packages/provider-utils/src/streaming-tool-call-tracker.ts:528` | O | Arguments are handed on as the raw concatenated string | flush |
| `pi:packages/ai/src/api/openai-completions.ts:502` | O | Tool-call fragments are matched by `index` first, then by `id` | always |
| `pi:packages/ai/src/api/openai-completions.ts:514` | O | Id and name default to empty strings and are filled by whichever later fragment has them | always |
| `pi:packages/ai/src/api/openai-completions.ts:656` | O | Arguments are re-parsed leniently after every fragment and once more at the end | always |
| `pi:packages/ai/src/api/openai-completions.ts:510` | O | Custom (grammar) tool calls stream a raw `input` string that is wrapped into JSON | fragment has `custom` and no `function` |
| `oc:packages/llm/src/protocols/openai-chat.ts:139` | O | A tool-call delta must carry a numeric index | always |
| `oc:packages/llm/src/protocols/utils/tool-stream.ts:127` | O | First fragment without id or name fails the stream | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:434` | O | An empty-string id or name in a later fragment also fails | later tool-call delta with `id: ""` or `function.name: ""` |
| `oc:packages/llm/src/protocols/utils/tool-stream.ts:126` | O | A later non-empty id or name replaces the stored one; names are not concatenated | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:446` | O | All calls are parsed when the first finish_reason arrives; bad JSON fails the stream | first non-empty `finish_reason` |
| `oc:packages/llm/src/protocols/openai-chat.ts:467` | O | tool-call events are held back until the HTTP stream ends | always |
| `pi:packages/ai/src/utils/validation.ts:264` | both | Optional arguments the model sent as `null` are deleted before validation | `validateToolArguments` is called on a received tool call |
| `pi:packages/ai/src/utils/json-parse.ts:79` | both | JSON repair: raw control characters and invalid backslash escapes inside strings | `JSON.parse` failed |
| `pi:packages/ai/src/utils/json-parse.ts:105` | both | Streaming argument parser never throws and never returns a non-object for empty input | always |
| `oc:packages/llm/src/protocols/shared.ts:156` | both | Empty argument text parses as {}; anything else must be valid JSON | always |

#### Opaque payload (12)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:1301` | A | A thinking block's signature is carried as provider metadata of the reasoning part | always |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1313` | A | redacted_thinking becomes a reasoning part with empty text | always |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2745` | A | signature_delta is accepted only on thinking blocks and emitted as an empty reasoning delta | stream |
| `ai:packages/anthropic/src/anthropic-api.ts:813` | A | Non-stream thinking blocks must carry a signature string | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:716` | A | Redacted thinking is stored as a thinking block with a fixed text and the payload as its signature | `event.content_block.type === "redacted_thinking"` |
| `pi:packages/ai/src/api/anthropic-messages.ts:780` | A | Signatures arrive in pieces and are appended | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:737` | A | Signature kept as provider metadata on the reasoning part | always |
| `oc:packages/llm/src/protocols/utils/lifecycle.ts:57` | A | Signature of a thinking block that has no text is lost | `signature_delta` for an index with no prior non-empty thinking |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:187` | A | `signature` on content_block_start is decoded but unused | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:697` | A | redacted_thinking blocks are dropped | `content_block_start` of an unrecognised type |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:395` | O | Gemini thought signatures on tool calls are kept as provider metadata | the field is present (Google Gemini through its OpenAI-compatible endpoint, per comment :883) |
| `pi:packages/ai/src/api/openai-completions.ts:336` | O | Streamed `reasoning_details` are merged and serialized into the thinking signature | any valid `reasoning_details` delta was seen |

#### Why it stopped (27)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:1759` | A | The raw stop reason is kept beside the mapped one | always |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2904` | A | A stop_reason already present in message_start is used | `message_start.message.stop_reason != null` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3008` | A | The stop reason comes from message_delta | `message_delta` |
| `ai:packages/anthropic/src/map-anthropic-stop-reason.ts:14` | A | `pause_turn`, `end_turn` and `stop_sequence` all map to `stop` | always |
| `ai:packages/anthropic/src/map-anthropic-stop-reason.ts:18` | A | `refusal` maps to `content-filter` | always |
| `ai:packages/anthropic/src/map-anthropic-stop-reason.ts:21` | A | `tool_use` maps to `stop` when the call was the JSON response tool | stop reason `tool_use` |
| `ai:packages/anthropic/src/map-anthropic-stop-reason.ts:23` | A | `max_tokens` and `model_context_window_exceeded` both map to `length` | always |
| `ai:packages/anthropic/src/map-anthropic-stop-reason.ts:25` | A | `compaction`, null and any unknown stop reason map to `other` | always |
| `ai:packages/anthropic/src/anthropic-message-metadata.ts:85` | A | A refusal may arrive with no stop_details at all | stop reason `refusal` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1629` | A | Stop-reason map, with `pause_turn` and `stop_sequence` treated as a normal stop | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:1633` | A | `refusal` and the untyped `sensitive` reason become errors | `stop_reason` is `refusal` or `sensitive` |
| `pi:packages/ai/src/api/anthropic-messages.ts:1637` | A | An unknown stop reason fails the step | `stop_reason` not in end_turn, max_tokens, tool_use, refusal, pause_turn, stop_sequence, sensitive |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:559` | A | pause_turn is reported as a normal stop | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:562` | A | refusal maps to content-filter | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:563` | A | Any other or missing stop_reason becomes "unknown" | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:789` | A | Matched stop sequence kept as provider metadata | `message_delta.delta.stop_sequence` truthy |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:632` | O | The finish reason is recorded when a chunk carries one; the stream goes on | stream |
| `ai:packages/openai-compatible/src/chat/map-openai-compatible-finish-reason.ts:13` | O | Finish reason mapping; `function_call` counts as tool calls; anything else is `other` | always |
| `ai:packages/openai/src/chat/map-openai-finish-reason.ts:13` | O | Finish reason mapping, identical to the compatible implementation | always |
| `pi:packages/ai/src/api/openai-completions.ts:1569` | O | Finish-reason map with `end`, `function_call`, `content_filter` and `network_error` | `choice.finish_reason` truthy |
| `pi:packages/ai/src/api/openai-completions.ts:1583` | O | An unknown finish reason becomes an error carrying the raw value | finish reason outside stop, end, length, function_call, tool_calls, content_filter, network_error |
| `pi:packages/ai/src/api/openai-completions.ts:696` | O | Hosts that never send a finish reason get one inferred | `compat.supportsFinishReason === false` (default true, :1650) and no finish reason seen |
| `pi:packages/ai/src/types.ts:820` | O | compat `supportsFinishReason` (default true) | flag false |
| `oc:packages/llm/src/protocols/openai-chat.ts:382` | O | function_call and tool_calls both map to tool-calls; the rest to unknown | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:465` | O | "stop" is corrected to tool-calls when calls were made | finish reason `stop` and at least one tool call |
| `oc:packages/llm/src/protocols/openai-chat.ts:412` | O | finish_reason is sticky across chunks | always |
| `pi:packages/ai/src/utils/overflow.ts:163` | both | MiMo reports an overflowing prompt as `length` with zero output | caller passes `contextWindow`; `stopReason === "length"` and `usage.output === 0` |

#### Usage (40)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:1774` | A | The untouched usage object and stop_sequence are exposed as provider metadata | always |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2884` | A | message_start supplies input and cache token counts; missing cache counts are 0 | `message_start` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2984` | A | message_delta can replace the input token count | `message_delta` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2989` | A | output_tokens is taken from message_delta as a total, not summed | `message_delta` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3048` | A | Raw usage is message_start usage overlaid with message_delta usage | `message_delta` |
| `ai:packages/anthropic/src/convert-anthropic-usage.ts:102` | A | Total input tokens = input_tokens + cache creation + cache read | always |
| `ai:packages/anthropic/src/convert-anthropic-usage.ts:78` | A | With `iterations`, input and output are summed over executor iterations | `usage.iterations` non-empty and no `fallback_message` iteration |
| `ai:packages/anthropic/src/convert-anthropic-usage.ts:72` | A | A turn served by a server-side fallback uses the top-level counts as they are | an iteration of type `fallback_message` is present |
| `ai:packages/anthropic/src/convert-anthropic-usage.ts:110` | A | Reasoning tokens come from output_tokens_details.thinking_tokens; text tokens are the difference | always |
| `ai:packages/anthropic/src/anthropic-api.ts:1059` | A | Usage objects are loose: unknown keys survive into the raw usage | always |
| `ai:packages/anthropic/src/anthropic-api.ts:1488` | A | message_delta usage: output_tokens required, input_tokens optional | `message_delta` |
| `pi:packages/ai/src/api/anthropic-messages.ts:679` | A | Usage is taken from `message_start` first so an aborted stream still has input counts | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:827` | A | `message_delta` usage only overwrites fields that are present | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:685` | A | Total tokens are computed locally; cached tokens are added, not subtracted | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:841` | A | Vercel AI Gateway sends the cache TTL breakdown in deltas | field present in `message_delta` |
| `pi:packages/ai/src/api/anthropic-messages.ts:849` | A | Thinking tokens are a subset of output tokens | field present in `message_delta` |
| `pi:packages/ai/src/models.ts:1217` | A | A 1-hour cache write is priced at twice the input rate | `usage.cacheWrite1h` set (only the Anthropic adapter sets it) |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:578` | A | inputTokens is the sum of three Anthropic fields | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:570` | A | No reasoning token count; total is computed | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:598` | A | Usage from message_start and message_delta merged field by field, later wins | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:176` | A | Cache counters may be null | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:586` | A | Raw usage object kept under providerMetadata.anthropic | always |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:421` | O | Prediction token counts are exposed as provider metadata | present in usage |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:626` | O | Usage is taken from whichever chunk carries it, the last one winning | stream |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:787` | O | The usage object is validated loosely and kept whole | always |
| `ai:packages/openai-compatible/src/chat/convert-openai-compatible-chat-usage.ts:32` | O | Usage normalisation: cached tokens are a subset of prompt tokens | always |
| `ai:packages/openai-compatible/src/chat/convert-openai-compatible-chat-usage.ts:38` | O | Text output tokens are completion minus reasoning, floored at 0 | always |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:596` | O | Usage is taken from any chunk that carries it; the last one wins | stream |
| `ai:packages/openai/src/chat/convert-openai-chat-usage.ts:37` | O | Usage normalisation subtracts cache reads and cache writes from prompt tokens | always |
| `pi:packages/ai/src/api/openai-completions.ts:568` | O | Usage is replaced by every chunk that carries it, including chunks with no choices | always |
| `pi:packages/ai/src/api/openai-completions.ts:577` | O | Moonshot puts usage inside the choice | `choice.usage` present and `chunk.usage` absent |
| `pi:packages/ai/src/api/openai-completions.ts:1532` | O | Cached tokens are read from three places and subtracted from input | always |
| `pi:packages/ai/src/api/openai-completions.ts:1554` | O | Reasoning tokens are a subset of output; the total is computed locally | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:395` | O | prompt_tokens is inclusive; the non-cached part is derived with a clamp | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:402` | O | Provider total wins, else input + output | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:410` | O | Usage may arrive on any chunk; the last one wins | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:403` | O | Only OpenAI's usage field names are understood; raw object stored under "openai" | always |
| `pi:packages/ai/src/utils/overflow.ts:155` | both | A successful response whose input exceeds the context window is treated as overflow | caller passes `contextWindow` and `stopReason === "stop"` |
| `oc:packages/llm/src/protocols/shared.ts:86` | both | Token sums never invent a zero | always |
| `oc:packages/llm/src/schema/events.ts:374` | both | The response's usage is the last usage-bearing event | always |

#### Keep-alive and unknown frames (12)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:1980` | A | `ping` is ignored | always |
| `ai:packages/anthropic/src/anthropic-api.ts:1131` | A | A stream event of an unknown type fails validation and is surfaced as an error part | stream |
| `pi:packages/ai/src/api/anthropic-messages.ts:547` | A | `ping` and every unknown event name are skipped silently | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:775` | A | Unknown delta kinds are ignored | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:821` | A | ping, message_stop and unknown event types are ignored | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:760` | A | Unknown delta types are ignored | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:207` | A | A frame without a string `type` fails the stream | always |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:639` | O | A chunk with no choice or no delta is ignored after usage and finish reason are read | stream |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:628` | O | Chunks without a choice or without a delta are skipped | stream |
| `pi:packages/ai/src/api/openai-completions.ts:573` | O | Chunks with no choices are skipped after their usage is read | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:413` | O | A chunk with empty `choices` is harmless | always |
| `oc:packages/llm/src/route/client.ts:237` | both | A frame that does not fit the event schema fails the whole stream | always |

#### Failure before the stream (35)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:3144` | A | An error as the first frame of a 200 stream is thrown as an API call error | first SSE event is `error` (or the first frame fails to parse with a provider stream error) |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3151` | A | A first-frame error that is not a provider stream error throws a plain Error | first frame is not valid against the chunk schema |
| `ai:packages/anthropic/src/anthropic-error.ts:25` | A | HTTP error bodies are read as `{ type: 'error', error: { type, message } }` | non-2xx response |
| `pi:packages/ai/src/api/anthropic-messages.ts:647` | A | SDK retries are disabled and replaced by an abortable retry loop | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:894` | A | A failed request ends as an error message whose text is the SDK error message | any throw |
| `ai:packages/openai-compatible/src/openai-compatible-error.ts:6` | O | The error body needs only `error.message`; the rest is loose | non-2xx response, or error object in a stream |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:522` | O | An error frame before the first output chunk is thrown as an API call error | stream |
| `ai:packages/openai/src/openai-stream-error.ts:105` | O | The early-error check drains the stream instead of cancelling it | error frame before output |
| `pi:packages/ai/src/api/openai-completions.ts:373` | O | SDK retries are disabled and replaced by the shared abortable retry loop | always |
| `pi:packages/ai/src/api/openai-completions.ts:719` | O | HTTP error bodies the SDK could not fold into the message are recovered | any throw |
| `pi:packages/ai/src/api/openai-completions.ts:724` | O | OpenRouter's `error.metadata.raw` is appended to the error text | the thrown error has `error.metadata.raw` |
| `ai:packages/provider-utils/src/post-to-api.ts:111` | both | A non-2xx response always becomes a thrown API call error | always |
| `ai:packages/provider-utils/src/response-handler.ts:126` | both | An empty error body is tolerated | non-2xx with blank body |
| `ai:packages/provider-utils/src/response-handler.ts:142` | both | An error body that is not JSON or not the expected shape falls back to the status text | non-2xx |
| `ai:packages/provider/src/errors/api-call-error.ts:28` | both | Retryability comes from the status code alone unless the provider supplies a rule | non-2xx |
| `ai:packages/ai/src/util/retry-with-exponential-backoff.ts:28` | both | Retry delay honours `retry-after-ms`, then `retry-after`, within limits | retryable API call error with response headers |
| `ai:packages/provider-utils/src/response-handler.ts:218` | both | A 2xx body that is not valid for the response schema is an error | non-stream |
| `ai:packages/provider-utils/src/response-handler.ts:186` | both | A streaming response without a body is an error | stream |
| `pi:packages/ai/src/utils/provider-retry.ts:27` | both | Retry rule: `x-should-retry` header first, then status 408, 409, 429, 5xx or no status | request failed before the stream started |
| `pi:packages/ai/src/utils/provider-retry.ts:63` | both | Retry delay: `retry-after-ms`, then `retry-after` (seconds or HTTP date), else capped backoff | a retry is due |
| `pi:packages/ai/src/utils/provider-retry.ts:47` | both | A server-requested delay above the cap fails immediately | `retry-after` / `retry-after-ms` exceeds the cap |
| `pi:packages/ai/src/utils/provider-retry.ts:116` | both | Each retry is a fresh SDK call, so the SDK's retry counter header stays zero | always |
| `pi:packages/ai/src/utils/overflow.ts:38` | both | Context overflow is detected by matching provider error texts | `stopReason === "error"` |
| `pi:packages/ai/src/utils/overflow.ts:65` | both | Cerebras signals overflow with a bodyless 400 or 413 | `message.provider === "cerebras"` |
| `pi:packages/ai/src/api/lazy.ts:57` | both | Failures before the request (auth resolution, module load) end the stream with a bare error event | setup rejects |
| `oc:packages/llm/src/route/executor.ts:281` | both | Only status >= 400 is an error | always |
| `oc:packages/llm/src/route/executor.ts:232` | both | Error bodies are classified by regular expressions on the raw text, not parsed | status >= 400 |
| `oc:packages/llm/src/route/executor.ts:233` | both | A body mentioning content policy or "safety" wins over the status code | status >= 400 and body matches |
| `oc:packages/llm/src/route/executor.ts:240` | both | 401 is "invalid", 403 is "insufficient-permissions" | status 401 / 403 |
| `oc:packages/llm/src/route/executor.ts:244` | both | 429 with quota wording is a non-retryable quota error | status 429 |
| `oc:packages/llm/src/route/executor.ts:262` | both | 400/404/409/413/422 are invalid-request, tagged context-overflow by text match | status 400, 404, 409, 413, 422 |
| `oc:packages/llm/src/route/executor.ts:266` | both | Every 5xx, and 429/503/504/529, is a retryable provider-internal error | status >= 500 |
| `oc:packages/llm/src/route/executor.ts:346` | both | Two retries, honouring retry-after-ms / retry-after but never waiting over 10 s | status 429 or >= 500 without a content-policy/quota body |
| `oc:packages/llm/src/route/executor.ts:127` | both | Rate-limit headers of both vendors are collected into one shape | status >= 400 |
| `oc:packages/llm/src/route/executor.ts:205` | both | The provider's text reaches the error message only when short | status >= 400 |

#### Failure inside the stream (28)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:83` | A | An in-stream error frame gets an HTTP status and a retry flag inferred from its type | always, for every `error` event in the stream |
| `ai:packages/anthropic/src/anthropic-language-model.ts:103` | A | overloaded_error is given status 529 and marked retryable | stream `error` event with `error.type === 'overloaded_error'` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1963` | A | After a broken message sequence every later frame is ignored | flag set by the `message_start` check |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1972` | A | A frame that fails to parse or validate becomes an error part and the stream goes on | any SSE data line that does not match `anthropicChunkSchema` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2866` | A | A message_start for another id while one is open is an error that ends processing | `message_start` with a different `message.id` before `message_stop` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3116` | A | An `error` event becomes an error part; the stream is not closed by the code | `error` event after the first frame |
| `ai:packages/anthropic/src/anthropic-api.ts:1456` | A | The stream error frame may carry status and retry fields beyond type and message | stream `error` event |
| `pi:packages/ai/src/api/anthropic-messages.ts:543` | A | An `event: error` frame fails the stream with the raw data string | `sse.event === "error"` |
| `pi:packages/ai/src/api/anthropic-messages.ts:561` | A | An unparseable frame fails the stream with the frame in the message | JSON parse failure on a known event |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:807` | A | A stream `error` event becomes a provider-error event, not a failure | `type === "error"` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:800` | A | Error text is "<type>: <message>", with fallbacks | `type === "error"` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:218` | A | Error object tolerated with type or message missing | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:809` | A | Context overflow recognised from the in-stream error text | `type === "error"` |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:591` | O | A frame that fails to parse sets the finish reason to `error` | SSE data that is not valid JSON or does not match the chunk schema |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:599` | O | An error object inside a 200 stream is recognised by its `error` key | a data line with a top-level `error` |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:577` | O | Error frames inside the stream are normalised with an inferred status | after output has started |
| `ai:packages/openai/src/chat/openai-chat-api.ts:202` | O | The chunk schema is a union of a completion chunk and the error body | always |
| `ai:packages/openai/src/openai-stream-error.ts:247` | O | The status of a stream error is guessed from the text of its code and type | error frame in a stream |
| `ai:packages/openai/src/openai-stream-error.ts:308` | O | Retry flag of a stream error: by status, except insufficient_quota | error frame in a stream |
| `ai:packages/openai/src/openai-stream-error.ts:220` | O | An error frame is recognised in three shapes | error frame in a stream |
| `pi:packages/ai/src/api/openai-completions.ts:710` | O | A failure mid-stream keeps the partial content and the reasoning details collected so far | any throw after the stream started |
| `oc:packages/llm/src/protocols/openai-chat.ts:157` | O | An error object inside a 200 stream is not understood | any frame without a `choices` array |
| `ai:packages/provider-utils/src/response-handler.ts:74` | both | A read failure in the middle of the body errors the stream | connection drops while streaming |
| `ai:packages/provider-utils/src/handle-fetch-error.ts:4` | both | Network failures are recognised by error code or by message text and marked retryable | fetch or body read fails |
| `ai:packages/provider-utils/src/create-provider-stream-error.ts:40` | both | Stream errors with provider metadata are plain marked objects | error frame in a stream |
| `pi:packages/ai/src/utils/retry.ts:256` | both | Retry after a failed response is decided by matching the error text | `stopReason === "error"` with an error message |
| `oc:packages/llm/src/route/transport/http.ts:141` | both | A read failure mid-stream is reported as invalid provider output | connection drops or body read errors during streaming |
| `oc:packages/llm/src/schema/events.ts:382` | both | A provider-error event makes the response finish reason "error" | `provider-error` event in the stream |

#### Step ends (13)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:1877` | A | A stream that never reports a stop reason ends with finish reason `other` | stream |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3105` | A | `finish` is emitted on message_stop and nowhere else | `message_stop` |
| `pi:packages/ai/src/api/anthropic-messages.ts:567` | A | A stream that stops after `message_start` without `message_stop` is an error | `sawMessageStart && !sawMessageEnd` |
| `pi:packages/ai/src/api/anthropic-messages.ts:866` | A | A stream that ends without any stop reason is an error | `output.stopReason === "pending"` after the stream |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:785` | A | The step finishes on message_delta; message_stop is not used | `type === "message_delta"` |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:840` | A | No flush when the stream ends early | HTTP body ends without `message_delta` |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:373` | O | A non-stream response without choices is an error | `choices` empty |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:748` | O | The stream is finalised when the HTTP body ends; no finish reason by then is an error | end of the response body (including after `[DONE]`) |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:534` | O | A stream that ends without finish_reason finishes as `other`, without an error | body ends early |
| `pi:packages/ai/src/api/openai-completions.ts:702` | O | A stream that ends without `finish_reason` is an error | `compat.supportsFinishReason` (default) and no finish reason, or stop reason still `pending` |
| `oc:packages/llm/src/protocols/openai-chat.ts:491` | O | The step ends when the HTTP body ends, not on finish_reason or [DONE] | always |
| `oc:packages/llm/src/protocols/openai-chat.ts:468` | O | No finish event if no finish_reason was ever seen | stream ends early |
| `oc:packages/llm/src/route/client.ts:389` | both | generate fails when no finish or provider-error event was seen | stream ends without `finish` / `provider-error` |

#### Who answered (13)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:1764` | A | Response id and model are optional | always |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2916` | A | Response id and model come from message_start | `message_start` |
| `ai:packages/anthropic/src/anthropic-api.ts:801` | A | `id`, `model` and `role` may be null or missing | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:670` | A | The served model is recorded only when it differs, and prices follow a fallback model | `event.message.model !== model.id` |
| `pi:packages/ai/src/api/anthropic-messages.ts:667` | A | `input_transformations` reported by the server are kept as a diagnostic | the field is an array with entries |
| `pi:packages/ai/src/api/anthropic-messages.ts:657` | A | Response status and headers are handed to a hook before the body is read | always |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:865` | O | id, model and created are optional; the response object is loose | always |
| `ai:packages/openai-compatible/src/chat/get-response-metadata.ts:15` | O | A `created` of 0 is treated as absent | always |
| `ai:packages/openai/src/chat/get-response-metadata.ts:15` | O | A `created` of 0 is treated as absent because Azure content-filter chunks send it | always |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:596` | O | Provider-specific response fields are left to a host-supplied extractor | `config.metadataExtractor` set |
| `pi:packages/ai/src/api/openai-completions.ts:565` | O | The served model is recorded only when it differs from the requested id | `chunk.model !== model.id` |
| `ai:packages/provider-utils/src/extract-response-headers.ts:8` | both | Response headers are returned as a plain object, nothing is picked out | always |
| `oc:packages/llm/src/route/executor.ts:82` | both | Request id is read from six header names, and only for errors | status >= 400 |

#### Left out: images, files, audio (13)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:147` | A | Only three citation kinds become sources; the rest are dropped | always |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1203` | A | Documents that can be cited are collected from the request up front | citations enabled on a file part |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:417` | A | File parts: wire shapes and the betas they add | user file part |
| `ai:packages/anthropic/src/anthropic-provider.ts:147` | A | URLs the provider is told it can take directly | always |
| `pi:packages/ai/src/api/anthropic-messages.ts:1375` | A | Images are sent as base64 `image` blocks; the media type is passed through | content contains an image block |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:311` | A | Images only, base64 only | always |
| `ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:131` | O | File parts: image_url, video_url, input_audio, file, or inlined text | user file part |
| `ai:packages/openai/src/chat/convert-to-openai-chat-messages.ts:232` | O | File parts: image_url with detail, input_audio, file by id or data URL | user file part |
| `pi:packages/ai/src/api/openai-completions.ts:1280` | O | Images are `image_url` parts with a data URL | content has an image block |
| `oc:packages/llm/src/protocols/openai-chat.ts:207` | O | Images as data-URL image_url parts only | always |
| `pi:packages/ai/src/api/transform-messages.ts:12` | both | Images are replaced by a text placeholder for models without image input | `!model.input.includes("image")` |
| `oc:packages/llm/src/protocols/shared.ts:158` | both | Media is validated locally: four image types, size caps, canonical base64 | any media part or tool-result file |
| `oc:packages/opencode/src/provider/transform.ts:439` | both | Media the model cannot read is replaced by an error sentence (older runtime) | user message parts of type file or image |

#### Left out: tools the provider runs (13)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:539` | A | Provider tool ids are mapped to the fixed names the API uses | a provider tool is declared |
| `ai:packages/anthropic/src/anthropic-language-model.ts:816` | A | `container` is a bare id string unless skills are attached | provider option `container` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1404` | A | Calls made by the provider's own tools are renamed and their input reshaped | provider-run tools |
| `ai:packages/anthropic/src/anthropic-language-model.ts:2189` | A | Server-tool input in the start frame is used only when non-empty | `content_block_start` of type `server_tool_use` |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:913` | A | Provider-run tool calls in the history are turned back into their wire block types | assistant tool-call / tool-result parts with `providerExecuted` |
| `ai:packages/anthropic/src/anthropic-prepare-tools.ts:322` | A | Each provider tool version adds its own beta | provider tool declared |
| `ai:packages/anthropic/src/anthropic-api.ts:782` | A | MCP tool-result citations are kept as opaque JSON | `mcp_tool_result` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1407` | A | code_execution calls are marked dynamic when a web tool brought code execution in implicitly | dynamic-filtering web tool declared without a code execution tool |
| `pi:packages/ai/src/api/anthropic-messages.ts:723` | A | Blocks of provider-run tools are not represented | always |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:294` | A | Provider-run tool calls and results are replayed by name | `providerExecuted` parts in an assistant message |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:638` | A | Server tool results arrive whole in content_block_start; error told by a type suffix | `content_block_start` of type web_search_tool_result / code_execution_tool_result / web_fetch_tool_result |
| `oc:packages/llm/src/protocols/anthropic-messages.ts:138` | A | Server tools cannot be declared | always |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:454` | O | url_citation annotations become source parts | search-preview models |

#### Left out: structured output (10)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:362` | A | A JSON response format without a schema is ignored | `responseFormat.type === 'json'` without `schema` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:466` | A | JSON output goes through `output_config.format` or through a synthetic tool named `json` | `responseFormat.type === 'json'` with a schema |
| `ai:packages/anthropic/src/anthropic-language-model.ts:473` | A | The JSON tool is replaced by native structured output on models that reject forced tool use | `structuredOutputMode: 'jsonTool'`, model row has `rejectsForcedToolUse` and `supportsStructuredOutput` |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1260` | A | Text blocks are discarded when the JSON tool is in use | JSON response tool in use |
| `ai:packages/anthropic/src/sanitize-json-schema.ts:35` | A | The JSON schema for output_config.format is rebuilt from an allow-list of keywords | native structured output |
| `ai:packages/anthropic/src/sanitize-json-schema.ts:138` | A | oneOf becomes anyOf and every object gets additionalProperties: false | native structured output |
| `ai:packages/anthropic/src/sanitize-json-schema.ts:163` | A | Unsupported constraints are moved into the description text | native structured output |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:305` | O | JSON mode: json_schema only when the host says structured outputs are supported | `responseFormat.type === 'json'` |
| `ai:packages/openai/src/chat/openai-chat-language-model.ts:219` | O | response_format: json_schema whenever a schema is given, else json_object | `responseFormat.type === 'json'` |
| `oc:packages/llm/src/llm.ts:148` | both | Structured output is a forced synthetic tool call on both formats | `LLM.generateObject` |

#### Left out: batches (4)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-batch.ts:294` | A | A batch entry is `{ custom_id, params }` where params is the ordinary non-stream body | batch start |
| `ai:packages/anthropic/src/anthropic-batch.ts:246` | A | Betas of all batch entries are merged into one header; per-entry betas are refused | batch start |
| `ai:packages/anthropic/src/anthropic-batch.ts:265` | A | The JSON-tool fallback for structured output is refused in batches | batch entry whose model lacks native structured output |
| `ai:packages/openai/src/openai-batch.ts:57` | O | Batches do not use chat completions at all | batch start |

#### Other (10)

| Where | Format | What the code does | When |
|---|---|---|---|
| `ai:packages/anthropic/src/anthropic-language-model.ts:375` | A | Provider options are read under two keys and the response metadata is written under both | `config.provider` prefix is not `anthropic` (a wrapper provider reusing this model class) |
| `ai:packages/anthropic/src/anthropic-language-model.ts:3041` | A | safeguard_results: the last non-null value wins | `message_delta.delta.safeguard_results` |
| `ai:packages/anthropic/src/convert-to-anthropic-prompt.ts:848` | A | A server-side fallback marker is sent back as a `fallback` block | assistant custom part `anthropic.fallback` |
| `ai:packages/anthropic/src/anthropic-api.ts:795` | A | The response schemas are deliberately partial | always |
| `ai:packages/anthropic/src/anthropic-language-model.ts:1987` | A | A `fallback` block is reported as a custom part and never opens a content block | server-side fallback served the turn |
| `ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:225` | O | Provider options are read under four keys and merged | always |
| `ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:23` | O | `providerOptions.openaiCompatible` on a message or part is spread into the wire object | provider options present on a message or part |
| `pi:packages/ai/src/api/openai-completions.ts:1697` | O | Compat is auto-detected from provider name and base URL, then overridden field by field | always |
| `oc:packages/llm/src/protocols/openai-compatible-chat.ts:19` | O | The openai-compatible route is the same protocol under another id | route id `openai-compatible-chat` |
| `pi:packages/ai/src/api/openai-completions.ts:1645` | both | Everything else for Xiaomi comes from runtime detection, which does not know the host | all four Xiaomi providers |

## What each piece needs said neutrally

Notes for the paper of P02-I02, not a design. One line per piece: what both formats need from
the caller, or give to the reader, and where one of them needs more.

What a request says:

- **Address and slug** — a base address, and the provider's own name for the model. Both put
  the name in the body.
- **Authentication** — one secret and the header that carries it (`Authorization: Bearer`,
  `x-api-key`, `api-key`). Anthropic may need a workspace id, OpenAI an organisation or
  project id.
- **Version and feature switches** — Anthropic needs a version string and a list of beta
  names, and the list follows from which other pieces a request uses. OpenAI needs nothing.
- **Base instructions** — text in ordered segments, since a cache mark can sit between two of
  them. OpenAI also needs the role name the model wants.
- **Instruction inside the conversation** — the text and its position. Anthropic allows it
  only after a user turn and before an assistant turn or the end; OpenAI states no rule. Both
  need to know whether the served model accepts it at all.
- **What the user said** — ordered text parts.
- **What the model said** — its text in the order it was produced, among its reasoning and
  its tool calls. Anthropic keeps that order in one `content` array; OpenAI holds text in
  `content` and calls in `tool_calls`, so the order between a text and a call is not said.
- **Reasoning sent back** — for Anthropic, the block as received: its text, its signature or
  its redacted data, its place among the blocks of the turn, and the model that produced it.
  OpenAI chat needs nothing; a server such as MiMo wants the text back in a field of its own.
- **Tool declarations** — a name, a description, a JSON Schema whose root is an object, and
  whether the schema is strict. A name that fits both is at most 64 long from
  `[a-zA-Z0-9_-]`.
- **Tool choice** — the model decides, must call some tool, must call a named tool, or may
  call none. OpenAI can also narrow the choice to a set.
- **Parallel tool calls** — whether one step may hold more than one call.
- **Tool call sent back** — the call's id, the tool's name and the input. Anthropic wants the
  input as an object, OpenAI as the JSON string it produced. An id that fits Anthropic matches
  `^[a-zA-Z0-9_-]+$`.
- **Tool result** — the id of the call it answers, its content, and whether the tool failed.
  Only Anthropic has a field for the failure.
- **Turn order** — which results answer which step, so that they can be placed directly after
  it: in one user message for Anthropic, as one message each for OpenAI.
- **Asking for reasoning** — on, off, or left to the provider's default; Anthropic also has a
  budget in tokens and an "off before answering, on between tool calls". Which of these a
  model accepts is a fact of the model.
- **Effort** — one level from an ordered list. Both have `low`, `medium`, `high`, `xhigh`,
  `max`; only OpenAI has `none` and `minimal`.
- **Whether reasoning text is returned** — yes or no. Anthropic only.
- **Cache marks** — after which part a mark sits, and a lifetime. Both allow four in a
  request. The lifetimes differ (`5m` and `1h`; `30m`). OpenAI also takes a key that groups
  requests.
- **Output limit** — a number of tokens that covers reasoning and visible output on both.
  Anthropic requires it.
- **Sampling** — `temperature` and `top_p` on both, with different ranges; `top_k` on
  Anthropic only; penalties and `seed` on OpenAI only. Several served models accept none.
- **Stop sequences** — a list of strings; at most 4 on OpenAI.
- **Stream switch** — whether to stream. OpenAI must also be asked for usage.
- **Cut output sent back** — the partial text and the fact that it was cut. Where it may be
  placed is a fact of the model.

What a response carries:

- **Framing** — nothing to carry. The reader must know that Anthropic names its events and
  OpenAI ends with `[DONE]`.
- **Step opens** — the provider's id for the response and the model that served it, both in
  the first frame.
- **Part boundaries** — Anthropic says where a part starts and ends and gives it an index.
  OpenAI says neither; a boundary there has to be derived from which field a delta fills.
- **Text** — a string to append.
- **Reasoning** — a string to append; it can be empty while a payload still arrives.
- **Tool call** — the id and the name once, at the start; then fragments of the input as a
  string; an index that says which call a fragment belongs to.
- **Opaque payload** — a string that belongs to one reasoning part (a signature), or a part
  that is nothing but a payload (redacted reasoning). Anthropic only.
- **Why it stopped** — the provider's own word, and its meaning. The two lists do not map one
  to one: `pause_turn`, `refusal` and `model_context_window_exceeded` have no OpenAI
  counterpart, `content_filter` has no Anthropic one, and MiMo adds `repetition_truncation`.
- **Which stop sequence matched** — a string. Anthropic only.
- **Refusal detail** — a category and an explanation (Anthropic), or the refusal's text
  (OpenAI).
- **Usage** — Anthropic gives counts that do not overlap (input, cache read, cache write,
  output) and repeats them as running totals. OpenAI gives totals with the cached and
  reasoning counts inside them, once, and only when asked. Either can be absent when a stream
  is cut.
- **Keep-alive and unknown frames** — nothing to carry; they must be passed over without
  ending the step.
- **Failure before the stream** — the status, the provider's error type or code, its message,
  the seconds to wait when given, and the request id.
- **Failure inside the stream** — the same without a status.
- **Step ends** — both have a terminal frame; a stream without it was cut.
- **Who answered** — the request id from a header, the response id and the served model from
  the body.
- **Rate-limit state** — what remains and when it resets, for requests and for tokens.
- **What the server changed** — which blocks of the request the provider dropped. Anthropic
  only.

## Pieces left out

Outside the plan (its non-goals, or not in its tables). Each is named with its fields so the
neutral format can leave room for it.

| Piece | Anthropic Messages | OpenAI chat | Sources |
|---|---|---|---|
| Images | A block in a user message or a tool result: `{type: "image", source, cache_control?, transformations?}`; `source` is `{type: "base64", media_type, data}`, `{type: "url", url}` or `{type: "file", file_id}`; `media_type` is `image/jpeg`, `image/png`, `image/gif` or `image/webp` | A part in a user message: `{type: "image_url", image_url: {url, detail?}}`; `url` is a URL or base64 data | [A1] [O1] |
| Documents and files | `{type: "document", source, …}`; `source` is base64 PDF, plain text, content blocks, a URL or a `file_id`. Also `search_result` and `container_upload` blocks | `{type: "file", file: {file_data?, file_id?, filename?}}` | [A1] [O1] |
| Audio | Nothing found | `{type: "input_audio", input_audio: {data, format}}` in a user message; request fields `audio` and `modalities`; `message.audio`, `delta.audio`. MiMo adds `video_url` parts | [O1] [O2] [M2] |
| Tools the provider runs | Entries of `tools[]` with a dated `type` (`web_search_20260209`, `web_fetch_20260209`, `code_execution_20260521`, `bash_20250124`, `memory_20250818`, `computer_toolset_20260801`, tool search, and others); the response carries `server_tool_use` blocks and result blocks (`web_search_tool_result`, `web_fetch_tool_result`, `code_execution_tool_result`, `bash_code_execution_tool_result`, `text_editor_code_execution_tool_result`, `tool_search_tool_result`); stop reason `pause_turn`; `usage.server_tool_use`; request field `container` | Request field `web_search_options`; `message.annotations[]` of type `url_citation`. MiMo adds a `web_search` tool and `web_search_usage` | [A1] [A21] [O1] [M2] |
| Structured output | `output_config.format: {type: "json_schema", schema}`; `strict: true` on a tool | `response_format`: `{type: "text"}`, `{type: "json_object"}`, `{type: "json_schema", json_schema: {name, description?, schema?, strict?}}`; `function.strict`. MiMo lists `text` and `json_object` | [A1] [O1] [M2] |
| Batches | `https://api.anthropic.com/v1/messages/batches`; usage `service_tier: "batch"` | A Batch API exists; its page was not read | [A1] [A37] |
| Tool kinds that are not functions | `tool_addition` and `tool_removal` blocks in a `system`-role message (beta) | `{type: "custom", custom: {name, description?, format?}}` with a `grammar` format; `tool_calls[]` of type `custom` with `input` as a string; `tool_choice` of type `allowed_tools`; the deprecated `functions` and `function_call` | [A20] [O1] |
| Citations | `citations` on text blocks; `citations_delta` in the stream | `annotations` | [A1] [O1] |
| Who the end user is | `metadata.user_id`, at most 512 long | `safety_identifier`, at most 128 long; `user`, "being replaced"; `metadata`, 16 key-value pairs | [A1] [O1] |
| Service tier | Request `service_tier`: `auto`, `standard_only`; response `usage.service_tier`: `standard`, `priority`, `batch` | Request and response `service_tier`: `auto`, `default`, `flex` and three more | [A1] [O1] [O2] |
| Where inference runs | Request `inference_geo`; response `usage.inference_geo` | Nothing found | [A1] |
| Trimming the context on the server | `context_management.edits` (beta), with strategies such as `clear_tool_uses_20250919` and `compact_20260112` | Nothing found | [A38] |
| Speed | `"speed": "fast"` (research preview) | Nothing found | [A38] |
| A budget for a whole task | `output_config.task_budget: {type: "tokens", total}` (beta) | Nothing found | [A38] |
| Falling back to another model | `fallbacks` (beta); `fallback` blocks in the response | Nothing found | [A2] [A22] |
| Cache diagnosis | Request `diagnostics.previous_message_id`; response `diagnostics` | Nothing found | [A1] |
| Predicted output | Nothing found | `prediction`; `accepted_prediction_tokens`, `rejected_prediction_tokens` | [O1] [O2] |
| Several answers, token probabilities, stored completions, moderation | Nothing found | `n` and `choices[].index`; `logprobs`, `top_logprobs`, `logit_bias`; `store`; `moderation` | [O1] [O2] |
| Length of the visible answer | Nothing found (effort covers it) | `verbosity`: `low`, `medium`, `high` | [O1] |
| Counting tokens before sending | A token counting endpoint | Nothing found in the pages read | [A6] |

## Differences from the first cut

Against the two tables under "The pieces, first cut" in the plan, cell by cell. A cell not
named here was found as the plan has it.

Wrong:

| Row · column | The plan says | Found |
|---|---|---|
| Authentication · Anthropic | `x-api-key`, `anthropic-version`, `anthropic-beta` | The key goes in `Authorization: Bearer`; `x-api-key` is "Legacy fallback …, still supported" [A8]. The version and beta headers are not authentication and are a piece of their own |
| Cache marks · OpenAI | "none; caching is implicit" | Explicit marks exist: `prompt_cache_breakpoint: {mode: "explicit"}` on a content part, `prompt_cache_options: {mode, ttl}`, four writes a request, for "`gpt-5.6` and later models"; earlier models are implicit only [O1] [O6] |
| Cache marks · differs | "markers, implicit, none" | A fourth: markers and an implicit mark together (Anthropic's top-level `cache_control`, OpenAI's `implicit` mode with explicit breakpoints), each taking one of the four slots [A19] [O6] |
| Turn order · Anthropic | "roles alternate" | Not enforced as a rule: "Consecutive `user` or `assistant` turns in your request will be combined into a single turn" [A1]. What is enforced is where a `tool_result` and a `system` message sit [A20] [A26] |
| Turn order · OpenAI | "an assistant message with calls is followed by its tool messages" | Not in OpenAI's reference, which gives `tool_call_id` and no order rule [O1]. See the translations section for what the three layers do |
| Asking for reasoning · Anthropic | `adaptive`, `enabled` with `budget_tokens`, `disabled`; `output_config.effort` | A fourth type, `between_tools`; `display`; `block_binding` under a beta. Effort is another piece: it is a different field, it exists on models where thinking cannot be set, and OpenAI's `reasoning_effort` is its counterpart [A1] [A12] [A14] |
| Asking for reasoning · differs | "effort, budget, toggle, none" | Per model, from Anthropic's own table [A12]: Sonnet 5.5 has no `disabled` (400) and uses `between_tools`; Haiku 5.5 has `disabled` at `high` effort or below; Haiku 4.5 has a budget or `disabled` and rejects `adaptive`; no current model accepts a budget. MiMo has `enabled` and `disabled` only [M1] [M2] |
| Sampling · both | `stop_sequences` and `stop` listed as sampling | A piece of its own: the response carries which sequence matched (`stop_sequence`), and the limits differ (4 on OpenAI) [A1] [O1] |
| Sampling · differs | "rejected on some" | Rejected with 400 on Sonnet 5.5 and Haiku 5.5, and on every Claude model after Opus 4.6; accepted on Haiku 4.5 unless thinking is on; silently overridden on MiMo when thinking is on [A1] [A12] [M1] |
| Tool choice · differs | "forced choice rejected or ignored on some" | Rejected with 400 on Sonnet 5.5 (and Opus 5.5, Fable 5.1, Mythos 5.1) and with a budget on Haiku 4.5; accepted on Haiku 5.5; removed without an error on MiMo [A6] [A25] [M1] [M2] |
| Cut output sent back · Anthropic | "cut text as the model's turn, then a user turn" | The references describe only a last assistant message (a prefill), which Claude 4.6 and later answer with 400, and advise putting the partial text into a user message on those models [A2] [A6]. A cut assistant turn followed by a user turn is described nowhere; G009 stays open |
| Cut output sent back · OpenAI | "cut text as an assistant message" | Nothing in the reference [O1] |
| Reasoning sent back · differs | "signed, plain, none" | MiMo's Anthropic page now lists `signature` on the thinking block, optional in a request and present in the non-streaming response, while its stream has no `signature_delta` [M1]. "Plain" is not established; it needs a capture |
| Keep-alive · OpenAI | "comment lines; chunks with no choices" | Chunks with empty `choices` are documented; comment lines are not [O1] [O2] |
| Failure inside the stream · OpenAI | "an `error` object in a data line, or the stream just ends" | Not in OpenAI's reference [O1] [O2]. See the translations section |
| Usage · OpenAI | no cache-write count | `prompt_tokens_details.cache_write_tokens` exists [O2] |

Missing from a cell:

- **Address and slug · differs** — the token-plan hosts serve both formats:
  `token-plan-{cn,sgp,ams}.xiaomimimo.com/anthropic` and `…/v1` [M8].
- **Authentication · OpenAI** — `OpenAI-Organization`, `OpenAI-Project` [O3]. **Anthropic** —
  `anthropic-workspace-id` [A8].
- **Base instructions** — `text` has a minimum length of 1 on Anthropic [A1]; OpenAI messages
  take a `name` [O1].
- **Instruction inside the conversation · Anthropic** — the placement rule and its 400; the
  model list (not Sonnet 5, not Haiku 4.5); the blocks it can carry besides text. "else text
  in a user turn" is a translation's choice, not something the format has [A20].
- **What the model said · OpenAI** — `content` may be absent when there are `tool_calls`; a
  `refusal` part and field [O1].
- **Reasoning sent back · Anthropic** — which model may read whose block, the binding to the
  prefix and to the account, and what each breach returns [A6] [A12] [A18].
- **Tool declarations** — `strict` on both; the name limits (128 and 64); Anthropic's
  `eager_input_streaming`, `input_examples`, `defer_loading`; OpenAI's `custom` tools [A1]
  [O1].
- **Tool choice · OpenAI** — `allowed_tools`; the defaults [O1]. **Anthropic** —
  `disable_parallel_tool_use` sits inside `tool_choice` [A1].
- **Tool call sent back · Anthropic** — the id pattern and the name length [A1].
- **Tool result · Anthropic** — `content` is optional and may hold blocks [A1].
- **Cache marks · Anthropic** — the top-level `cache_control`; the TTL order rule; the
  20-position lookback; the minimum prefix per model [A19].
- **Output limit · Anthropic** — 0 is allowed [A1]. **differs** — not required on MiMo [M1].
- **Stream switch · OpenAI** — `include_obfuscation` [O1].
- **Reasoning (response) · Anthropic** — with `display: "omitted"` the block still opens and
  carries one empty `thinking_delta` [A2].
- **Opaque payload · Anthropic** — a `redacted_thinking` block arrives whole in
  `content_block_start`, without deltas [A1].
- **Why it stopped · differs** — MiMo's Anthropic page also lacks `stop_sequence`,
  `pause_turn`, `refusal` and `model_context_window_exceeded` [M1].
- **Usage · Anthropic** — `cache_creation` by lifetime, `output_tokens_details.thinking_tokens`
  [A1].
- **Usage · differs** — "MiMo reports no cache write" holds for both MiMo pages, which also
  have no field to place a cache mark [M1] [M2].
- **Failure before the stream** — `request_id` in Anthropic's body [A6]; `param` in OpenAI's
  [O11]; `Retry-After` on OpenAI too [O8].
- **Who answered · OpenAI** — `system_fingerprint`, `openai-organization`,
  `openai-processing-ms`, `X-Client-Request-Id` [O2] [O3].

Rows the plan lacks: "Version and feature switches", "Parallel tool calls", "Effort", "Whether
reasoning text is returned" and "Stop sequences" on the request side; "Which stop sequence
matched", "Refusal detail", "Rate-limit state" and "What the server changed" on the response
side.

What the translations add to a cell the references leave empty:

- **Turn order · OpenAI** — each result is its own `tool` message directly after the
  assistant message with the calls
  (`ai:packages/openai-compatible/src/chat/convert-to-openai-compatible-chat-messages.ts:313`);
  some hosts also need an assistant message before the next user message
  (`pi:packages/ai/src/api/openai-completions.ts:1244`).
- **Failure inside the stream · OpenAI** — an `error` object in a data line
  (`ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:599`), or
  a body that ends with no `finish_reason` (`pi:packages/ai/src/api/openai-completions.ts:702`).
  The plan's cell is what the translations handle; no reference states it.
- **Keep-alive · OpenAI** — chunks without a choice are passed over by all three
  (`ai:packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts:639`,
  `pi:packages/ai/src/api/openai-completions.ts:573`,
  `oc:packages/llm/src/protocols/openai-chat.ts:413`); none has code for comment lines.
- **Reasoning (response) · differs** — the field name is one of `reasoning_content`,
  `reasoning`, `reasoning_text`, and some hosts send `reasoning_details`
  (`pi:packages/ai/src/api/openai-completions.ts:611`, `:674`).
- **Instruction inside the conversation** — "else text in a user turn" is opencode's fallback
  (`oc:packages/llm/src/protocols/anthropic-messages.ts:416`); pi folds the text into the
  leading system text and the AI SDK hoists it or sends the role.
- **Why it stopped · differs** — MiMo answers an overflowing prompt with `length` and no
  output (`pi:packages/ai/src/utils/overflow.ts:163`).

Where a reference disagrees with itself:

- [A1] says in prose "there is no `"system"` role for input messages in the Messages API",
  and lists `role: "user" or "assistant" or "system"` for the same `messages` parameter. [A20] documents the
  role at length. Believed: the role exists, on the models [A20] lists; the prose is older.
- [A1] says `thinking.display` "Defaults to `summarized`"; [A12] says the default is
  `omitted` on Sonnet 5.5, Haiku 5.5 and ten other models. Believed: [A12], which gives the
  default per model.

## Unverified

Not established by anything read. Each needs a capture, or a page that was not found.

Anthropic:

- What the endpoint answers to a fifth explicit cache mark. [A19] says "up to 4" and gives the
  400 only for four explicit marks plus the top-level one. All three translations drop the
  fifth before sending.
- What it answers to `max_tokens` above the model's ceiling, to an empty text block, and to a
  first message whose role is not `user`. The reference gives the limits and not the answers;
  it does not state the last rule at all.
- The message of the 400 for a `system`-role message sent to a model that does not take it.
- Whether a cut assistant turn (partial text, no tool call) followed by a user turn is
  accepted with thinking on. This is G009; the references describe only a last assistant
  message.
- Whether Haiku 4.5 returns `model_context_window_exceeded` without the beta header. [A21]
  names "Sonnet 4.5 … and newer models".
- Which models return `input_transformations`.
- Whether `Authorization: Bearer` and `x-api-key` behave alike for every kind of key.

OpenAI:

- Any rule about where a `tool` message sits, and the answer when it is broken. The reference
  has none; the three translations all send each result as its own `tool` message after the
  assistant message that holds the calls.
- The shape of an error inside a 200 stream. Only the AI SDK's code shows one.
- Whether keep-alive comment lines are sent.
- That `prompt_tokens` includes `cached_tokens`. The reference says "Cached tokens present in
  the prompt"; all three translations subtract.
- Which models take `system` and which `developer`, beyond "o1 models and newer".
- OpenAI's Batch page was not read.

MiMo. Everything in the column is what its pages say. Nothing was called. Not known:

- Whether the stream of the Anthropic endpoint carries a signature at all (the page lists no
  `signature_delta`), and what the endpoint does with a `thinking` block sent back without
  one, with an empty one, or with one from Claude.
- Whether `x-api-key`, `anthropic-version` and `anthropic-beta` are accepted, ignored or
  refused; the same for `cache_control`, `top_k`, `metadata` and `output_config`.
- Whether a `system`-role message inside `messages` follows Anthropic's placement rule.
- Whether the OpenAI endpoint needs `stream_options.include_usage` to report usage, sends
  `[DONE]`, accepts `max_tokens`, `reasoning_effort` or `parallel_tool_calls`, and accepts
  `reasoning_content` on an assistant message (pi sends it; the page's schema does not list
  it).
- The body of an error on either endpoint, and whether errors arrive inside a stream.
- That a token-plan key reaches the `/anthropic` path of the token-plan hosts. The pages now
  list those addresses [M8]; the engine-design note of 2026-10-07 had it as unchecked.
- The date of the two pages. The saved markdown carries none; the engine-design note read the
  Anthropic page as dated 2026-09-20 and did not find `signature` on it.
- pi's reason for leaving MiMo's Anthropic endpoint is its changelog's one line; the issue it
  cites (#4505) was not opened.

The translations:

- Of 868 entries, the source around 71 was opened by me. For the rest, the cited line exists
  and reads as quoted; what the code around it does is the sub-agent's reading. The
  sub-agent reports three of opencode's entries as its own reading with no test behind them;
  two say so in its file (`oc:packages/llm/src/protocols/utils/lifecycle.ts:57`, of which I
  read the guard, and `oc:packages/llm/src/protocols/openai-chat.ts:434`).
- A "nothing found" for a translation rests on the sub-agent's search, except the search for
  `mimo` and `xiaomi`, which I ran.
- The AI SDK sweep read `packages/openai/src/openai-provider.ts` from line 150 only and the
  two batch files only at the cited lines.
