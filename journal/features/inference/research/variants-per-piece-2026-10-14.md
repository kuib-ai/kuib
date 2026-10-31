---
title: The variants each piece needs, read from the recorded exchanges
date: 2026-10-14
origin: ["[[features/inference/plan]]", "[[features/inference/research/format-pieces-2026-10-08]]"]
---

# The variants each piece needs, read from the recorded exchanges

The table of pieces ([[features/inference/research/format-pieces-2026-10-08]]) says what the
two formats have for each piece, from documentation. Since then 709 exchanges were recorded
under `packages/inference/fixtures/`. This file reads them and says, piece by piece, which
variant each served model takes and what proves it (P07-I02). It designs nothing: the neutral
format and the blocks are drawn from it afterwards.

## How to read it

**The rows.** Six, each with the short prefix used in every citation below. A citation such as
`S/stop-one` is the case folder `packages/inference/fixtures/` + the row's path + `/stop-one`.

| Prefix | Row | Path under `packages/inference/fixtures/` | Cases | With a response |
|---|---|---|---|---|
| S | Claude Sonnet 5.5 at Anthropic, Anthropic Messages | `anthropic-messages/anthropic/claude-sonnet-5-5` | 139 | 139 |
| H | Claude Haiku 5.5 at Anthropic, Anthropic Messages | `anthropic-messages/anthropic/claude-haiku-5-5` | 129 | 129 |
| L | Claude Haiku 4.5 at Anthropic, Anthropic Messages | `anthropic-messages/anthropic/claude-haiku-4-5` | 116 | 114 |
| MA | MiMo 2.6 Pro at Xiaomi, Anthropic Messages | `anthropic-messages/xiaomi/mimo-v2-6-pro` | 119 | 119 |
| MO | MiMo 2.6 Pro at Xiaomi, OpenAI chat | `openai-chat/xiaomi/mimo-v2-6-pro` | 107 | 107 |
| MT | Muse Spark 1.1 at Meta, OpenAI chat | `openai-chat/meta/muse-spark-1-1` | 99 | 99 |

Case folders are cited under the names they have today. The names they are to take, one per
piece and variant, are in `journal/features/inference/tasks/research-variants/case-names.json`,
which maps every folder (`was` to `name`).

**The words.** A piece has one word; there are 41. A variant has one term, and there are two
lists of them, kept apart.

- The variants a row takes. This file defines them piece by piece and gathers them in one
  table at the end of section 1. They are what a block would be written for: `part` or `field`
  for reasoning sent back, `marks` or `implicit` for the cache.
- The variants a case shows. They say what the request of a case does (`replay-absent`,
  `cache-five`), so that one request has one name on every row, and they are listed once in
  `case-names.json`.

Where the two lists name the same thing they use the same word. Three words mean one thing
wherever they stand: `absent`, not sent; `empty`, sent and holding nothing; `part`, a piece of
a turn's content, which Anthropic calls a block. "Block" is left to the plan, where it is a
unit of a translation (D006).

**The marks.** Every cell carries one of three.

- **M**, measured: the fixture cited shows it.
- **D**, documented: a reference says it and no fixture shows it. `[A12]`, `[M1]` and the like
  are the pages listed under Sources in the pieces file.
- **A**, assumed: neither.

Inside a cell, a statement followed by a case is measured by that case; D and A are always
written out.

**Four words for an outcome.** A status of 200 proves that a request shape was accepted and
nothing more, so the words are kept apart.

- *accepted*: answered 200; the response does not show whether the setting did anything.
- *honoured*: answered 200 and the response shows the effect.
- *ignored*: answered 200 and the response shows the setting had no effect.
- *rejected*: answered 4xx; the provider's message is quoted.

**What a fixture cannot show.**

- The key. A fixture stores the name of the header that carried it (`authHeader`) and never
  the value. That `authorization` carried `Bearer <key>` is read in the capture tool
  (`tooling/capture.ts:1173`), and which key a call used is in the capture ledger.
- Most response headers. The tool stored a fixed list: `content-type`, `content-length`,
  `content-encoding`, `date`, `cache-control`, `retry-after`, `request-id`, `x-request-id`,
  `openai-version`, `openai-processing-ms`, and the rate-limit headers of the two families.
  Any other header is only counted. MiMo sends three to five such headers per answer, so "MiMo
  sends no request id" would not be a measured statement; "none under the stored names" is.
- Whether an instruction was followed. Every prompt that tests where an instruction may sit
  asks for the reply "OK", so those answers show acceptance and never obedience.
- Statuses other than 200, 400 and 401. Nothing else was ever returned: no 429, no 5xx, no
  `retry-after`, no error inside a stream, no refusal.

**How it was read.** No body was read wholesale. Read-only scripts under
`/var/tmp/research-variants/` (outside the repository) build one record per case (envelope,
request shape, response shape, the sequence of frames) and tabulate it; a signature is only
ever counted by its length, and none was decoded or printed. Single bodies were opened where
a cell turns on a detail.

## 1. Variants per piece

In the order of the table. Each piece is headed by the one word it has in `case-names.json`.

### What a request says

#### 1 · Address and slug — `address`

One variant: a base address, the path of the format (`/v1/messages`, `/v1/chat/completions`)
and the provider's slug in the body's `model`. What differs between rows is data.

| Row | Takes | Proof |
|---|---|---|
| S | `https://api.anthropic.com`, slug `claude-sonnet-5-5` | M `S/plain-stream` |
| H | the same address, slug `claude-haiku-5-5` | M `H/plain-stream` |
| L | the same address, slug `claude-haiku-4-5-20251001`; the answer names the same dated slug | M `L/plain-stream`. The undated alias was never sent: D [A9] |
| MA | `https://token-plan-sgp.xiaomimimo.com/anthropic`, slug `mimo-v2.6-pro` | M `MA/plain-stream`. The provider's other host, `api.xiaomimimo.com`, answers 401 to this key: M `MA/host-api` (that it was this key is from the ledger) |
| MO | `https://token-plan-sgp.xiaomimimo.com`, slug `mimo-v2.6-pro` | M `MO/plain-stream`. The other host was only called with the key that was later replaced (`MO/host-api`): A |
| MT | `https://api.meta.ai`, slug `muse-spark-1.1` | M `MT/plain-stream` |

#### 2 · Authentication — `authentication`

Two variants: `bearer`, the key in `Authorization: Bearer`; `header`, the key alone in a
header of its own, whose name is a parameter (`x-api-key`, `api-key`).

| Row | Takes | Proof |
|---|---|---|
| S | `header` (`x-api-key`) in 138 cases; `bearer` accepted | M `S/plain-stream`; M `S/auth-bearer` |
| H | the same | M `H/plain-stream`; M `H/auth-bearer` |
| L | the same | M `L/plain-stream`; M `L/auth-bearer` |
| MA | `header` (`api-key`) in 117 cases; `bearer` and `header` (`x-api-key`) accepted | M `MA/plain-stream`; M `MA/auth-bearer`, `MA/auth-x-api-key` |
| MO | `bearer` in 106 cases; `header` (`api-key`) accepted | M `MO/plain-stream`; M `MO/auth-api-key` |
| MT | `bearer` | M `MT/plain-stream`. No other header was tried |

`bearer` alone is accepted by all six rows.

#### 3 · Version and feature switches — `version`

Two variants: `pinned`, the header `anthropic-version: 2023-06-01` with `anthropic-beta`
naming the switches the request needs; `absent`.

| Row | Takes | Proof |
|---|---|---|
| S, H, L | `pinned` | M every case, e.g. `S/plain-stream`. Never sent without the header: D [A4] [A8] |
| MA | `absent` in 117 of its 119 cases, 112 of them answered 200; `pinned` accepted, a switch accepted | M `MA/plain-stream`; M `MA/version-header`, `MA/beta-header` |
| MO, MT | nothing: the format has no version header | M `MO/plain-stream`, `MT/plain-stream` |

The switches, each measured on S and H as 200 with the switch and 400 without it:

| Switch | Gates | With | Without |
|---|---|---|---|
| `mid-conversation-output-config-2026-07-01` | an effort carried by an instruction | `S/inline-effort` | `S/inline-effort-no-beta`: "messages.1.output_config: Extra inputs are not permitted" |
| `mid-conversation-system-clear-at-2026-08-21` | an instruction lifetime | `S/clear-at` | `S/clear-at-no-beta`: "messages.1.clear_at: Extra inputs are not permitted" |
| `thinking-binding-controls-2026-08-01` | `thinking.block_binding` | `S/binding-drop-block-signed` | `S/binding-no-beta-signed`: "thinking.adaptive.block_binding: Extra inputs are not permitted" |
| `thinking-display-updates-2026-08-18` | `display: "updates"` | `S/display-updates` | `S/display-updates-no-beta`: "thinking.adaptive.display: Input should be 'summarized', 'omitted'" |
| `inline-tools-2026-09-15` | tool changes inside an instruction | `S/inline-tools` | not sent |

- L accepts the binding and the display switch (`L/binding-drop-block`, `L/display-updates`).
- A name that does not exist is 400 on S, H and L: "Unexpected value(s)
  `synthetic-invalid-beta` for the `anthropic-beta` header. …" (`S/invalid-beta`).
- The `system` role inside the conversation needs no switch: `S/inline-after-user` carries
  none and is 200. The pieces file left this open between [A20] and the AI SDK.
- MA accepts every one of these headers, and the fields they gate with or without the header
  (`MA/clear-at-no-beta`, `MA/inline-effort-no-beta`, `MA/binding-no-beta` are 200).

#### 4 · Base instructions — `instructions`

Anthropic Messages: the top-level `system` as a `string` or as `parts`. OpenAI chat: a first
message of role `system` or `developer`, its content a string or text parts.

| Row | Takes | Proof |
|---|---|---|
| S, H, L | `string` and `parts`; `parts` wherever a cache mark sits | M `S/system-string`, `S/system-blocks`, `S/cache-5m-write` (and under `H/`, `L/`) |
| MA | `string` and `parts` | M `MA/system-string`, `MA/system-blocks` |
| MO | `system`; `developer` accepted, as a string and as parts | M `MO/plain-stream`; M `MO/instruction-developer-first`, `MO/instruction-blocks` |
| MT | the same | M `MT/plain-stream`; M `MT/instruction-developer-first`, `MT/instruction-blocks` |

A request with no base instructions is accepted on all six (`S/plain-default`,
`MO/first-assistant`). None of these shows the instructions were followed.

#### 5 · Instruction inside the conversation — `inline`

One variant was recorded: `role`, a message of role `system` at its position (`system` or
`developer` on chat). No capture renders an instruction any other way, which is what a row
without the role needs.

| Row | Takes | Proof |
|---|---|---|
| S | `role`, only after a user turn at the end of the conversation; a tool result counts as a user turn | M `S/inline-after-user` 200, `S/inline-after-result-signed` 200. Rejected as the first message, `S/inline-first`: "messages.0: use the top-level 'system' parameter for the initial system prompt; …". Rejected after an assistant turn and between a call and its result, `S/inline-after-assistant`, `S/inline-between-call-result-signed`: "messages.2: role 'system' must follow a 'user' message or an 'assistant' message ending in a server tool result; …". After a user turn and before an assistant turn, in the middle: not sent, D [A20] |
| H | the same | M the same cases under `H/` |
| L | no `role` | M `L/inline-after-user`: "role 'system' is not supported on this model". Placement is checked first: `L/inline-first` and `L/inline-after-assistant` get the placement messages. What L takes: A |
| MA | `role` at any position | M `MA/inline-first`, `MA/inline-after-user`, `MA/inline-after-assistant`, `MA/inline-between-call-result`, all accepted |
| MO | `role`, `system` or `developer`, at any position | M `MO/instruction-system-after-user`, `MO/instruction-system-after-assistant`, `MO/instruction-system-between-call-result` and the three `MO/instruction-developer-…`, all accepted |
| MT | the same | M the same six under `MT/`, all accepted |

What an instruction can carry besides text:

| Carries | S, H | L | MA |
|---|---|---|---|
| an effort and no text (`content: ""`, `output_config.effort`) | accepted, `S/inline-effort`; accepted with reasoning off and a value that differs from the top one, `S/inline-effort-off` | rejected, `L/cache-inline-effort`: "output_config.effort requires a model that supports per-turn effort; this model does not" | accepted, `MA/inline-effort` |
| a lifetime (`clear_at: "next_user_message"`) | accepted, `S/clear-at` | rejected for the role, `L/clear-at` | accepted, `MA/clear-at` |
| tool changes (`tool_addition`, `tool_removal`) | accepted, `S/inline-tools` | rejected, `L/inline-tools`: "tool_addition/tool_removal requires a model that supports mid-conversation system content; this model does not" | not sent |

#### 6 · What the user said — `user`

A `string`, or `parts` of text.

| Row | Takes | Proof |
|---|---|---|
| S, H, L | both; a text part that is the empty string is rejected | M `S/plain-stream`, `S/cache-user`; `S/empty-text`: "messages: text content blocks must be non-empty" |
| MA | both; the empty part is accepted | M `MA/plain-stream`, `MA/cache-user`, `MA/empty-text` |
| MO | both; the empty part is accepted | M `MO/plain-stream`, `MO/empty-text` |
| MT | both; the empty part is accepted and answered with an answer that has no content | M `MT/plain-stream`, `MT/empty-text` |

#### 7 · What the model said — `assistant`

Text as a `string` or as `parts`. On chat, beside tool calls, the text is `""` or `null`.

| Row | Takes | Proof |
|---|---|---|
| S, H, L | both | M `S/first-assistant` (string), `S/cache-assistant` (parts) |
| MA | both | M `MA/first-assistant`, `MA/cache-assistant` |
| MO | a string; beside tool calls `""` and `null` are both accepted | M `MO/first-assistant`, `MO/assistant-empty`, `MO/assistant-null` |
| MT | the same; MT writes text and tool calls in one answer, and both go back | M `MT/first-assistant`, `MT/assistant-empty`, `MT/assistant-null`, `MT/tool-replay` |

#### 8 · Reasoning sent back — `replay`

Three variants: `part`, the reasoning as a part of the assistant turn (a `thinking` block),
its text and signature as received; `field`, the reasoning text as `reasoning_content` on the
assistant message; `absent`, nothing sent back.

| Row | Takes | Proof |
|---|---|---|
| S | `part`, the signature verified. `absent` is also accepted in a tool round | M `S/tool-replay-signed` 200. `S/tool-replay-empty-signature-signed`: "messages.1.content.0: Invalid `signature` in `thinking` block". `S/tool-replay-no-signature-signed`: "messages.1.content.0.thinking.signature: Field required". M `S/tool-replay-no-reasoning-signed` 200 |
| H | the same | M the same four under `H/` |
| L | `part`, the signature verified | M `L/tool-replay` 200. `L/tool-replay-no-signature`: "…thinking.signature: Field required". `L/cut-thinking-replay`: "messages.1.content.0: Invalid `signature` in `thinking` block" (a part cut before its signature). `absent` in a tool round: not measured, D [A13] |
| MA | `part`; the signature is the empty string as received, and it is not checked. `absent` is also accepted | M `MA/tool-replay` 200; `MA/tool-replay-no-signature` 200; `MA/claude-signature` 200 (a Sonnet signature in its place). M `MA/tool-replay-no-reasoning` 200 |
| MO | `field`, and the field is read. `absent` is also accepted | M `MO/tool-replay` 200. The prompt count moves with the text: 161 with the original, 153 with other text (`MO/tool-replay-synthetic-reasoning`). M `MO/tool-replay-omit-reasoning`, `MO/tool-replay-empty-reasoning` 200, both 161 |
| MT | `absent`: the provider returns no reasoning text to send back | M `MT/tool-seed` (29 reasoning tokens, no reasoning in the message), `MT/tool-replay` 200. A `reasoning_content` sent anyway is accepted and counted: 651 prompt tokens against 640 (`MT/tool-replay-synthetic-reasoning`) |

The plan's variants for this piece are "signed, plain, none" (P04-I01). No recorded row needs
`plain`, reasoning text with no signature: Claude rejects it, and MiMo takes back its own part
with its own empty signature. So one variant, `part`, serves the four Anthropic Messages rows:
it sends back what was received.

Three more things were measured about a part that is sent back. Each bears on a gap and is
set out in section 3.

- In a later turn (the answer is finished, a new user turn follows): counted as input on S, H
  and MA, not counted on L.
- From another model: S counts a part of H; H does not count a part of S and reasons again.
- Under a changed system text or tool declaration: accepted by default on S, H and L.

#### 9 · Tool declarations — `declaration`

One variant per format.

| Row | Takes | Proof |
|---|---|---|
| S, H, L | `{name, description, input_schema}`; `eager_input_streaming` and a cache mark accepted | M `S/tool-choice-auto`, `S/eager-true`, `S/eager-false`, `S/cache-tool` |
| MA | the same, the same two extras accepted | M `MA/tool-choice-auto`, `MA/eager-true`, `MA/cache-tool` |
| MO | `{type: "function", function: {name, description, parameters}}`; `strict` accepted and not checked | M `MO/choice-auto`, `MO/strict-true`, `MO/strict-false`; `MO/strict-invalid` 200 |
| MT | the same; `strict` checked | M `MT/choice-auto`, `MT/strict-true`, `MT/strict-false`; `MT/strict-invalid`: "'additionalProperties' is required to be supplied and to be false." |

A tool of the `custom` kind is rejected on MO, "`function` is not set" (`MO/choice-custom`).
`strict` on Anthropic Messages was not sent. `eager_input_streaming` changes nothing visible
at the size of these inputs: both values stream the same three fragments.

#### 10 · Tool choice — `choice`

Four choices: the model decides (`auto`), no tool (`none`), some tool (`required`), a named
tool (`named`). Only `none` shows its effect: the prompts ask for the tool, so an answer that
calls it cannot tell a forced call from a free one.

| Row | `auto` | `none` | `required`, `named` | Proof |
|---|---|---|---|---|
| S | honoured | honoured: the answer has no part at all | rejected | M `S/tool-choice-auto`; `S/tool-choice-none`; `S/tool-choice-any`, `S/tool-choice-tool`: "tool_choice: type "tool" and "any" are not supported for this model." |
| H | honoured | honoured, no part | accepted, with reasoning on as well | M `H/tool-choice-auto`; `H/tool-choice-none`; `H/tool-choice-any`, `H/tool-choice-tool`, `H/thinking-tool-choice-any`, `H/thinking-tool-choice-tool` |
| L | honoured | honoured, no part | accepted with reasoning off, rejected with a budget | M `L/tool-choice-auto`; `L/tool-choice-none`; `L/tool-choice-any`; `L/thinking-tool-choice-any`: "Thinking may not be enabled when tool_choice forces tool use." |
| MA | honoured | ignored: the model calls the tool | accepted | M `MA/tool-choice-auto`; `MA/tool-choice-none` (`tool_use`); `MA/tool-choice-any`, `MA/tool-choice-tool` |
| MO | honoured | ignored: the model calls the tool | `required` accepted; `named` has no data | M `MO/choice-auto`; `MO/choice-none` (`tool_calls`); `MO/choice-required`; `MO/choice-function` holds no data frame |
| MT | honoured | rejected | rejected | M `MT/choice-auto`; `MT/choice-none`, `MT/choice-required`, `MT/choice-function`, `MT/choice-allowed-tools`: "only `"auto"` is supported for `tool_choice`. `"none"`, `"required"`, and named function choices are not currently supported" |

#### 11 · Parallel tool calls — `parallel`

`disable_parallel_tool_use` inside `tool_choice` on Anthropic Messages, `parallel_tool_calls`
on chat. The prompt asks for two calls.

| Row | Takes | Proof |
|---|---|---|
| S, H, L | honoured | M `S/parallel-true` (parallel disabled): one call; `S/parallel-false`: two |
| MA | ignored | M `MA/parallel-true` (parallel disabled): two calls |
| MO | ignored | M `MO/parallel-false`: two calls |
| MT | honoured | M `MT/parallel-false`: one call; `MT/parallel-true`: two |

Today's names are inverted between the formats: `parallel-true` means "one call" on the four
Anthropic Messages rows and "several" on the two chat rows.

#### 12 · Tool call sent back — `call`

| Row | Takes | Proof |
|---|---|---|
| S, H, L | a `tool_use` block `{id, name, input, caller}` as received, `input` an object | M `S/tool-replay`; a call issued by another Claude model is accepted, `S/cross-model-h`, `H/cross-model-s` |
| MA | `{id, name, input}`; its own ids are `call_…`; a `toolu_…` id and a `caller` are accepted | M `MA/tool-replay`; `MA/cross-model-s` |
| MO | `tool_calls[]: {id, type, function: {name, arguments}}`, `arguments` the string as received | M `MO/tool-replay` |
| MT | the same | M `MT/tool-replay` |

#### 13 · Tool result — `result`

| Row | Takes | Proof |
|---|---|---|
| S, H | a `tool_result` block in a user turn; content a string or text parts; `is_error` true and false accepted | M `S/tool-replay`, `S/tool-replay-false-signed`, `S/tool-replay-error-signed` |
| L | the same with a string | M `L/tool-replay`. Parts and the flag: not measured, D [A1] |
| MA | as S | M `MA/tool-replay`, `MA/tool-replay-false`, `MA/tool-replay-error` |
| MO | a message of role `tool`; content a string or text parts; a failure is text, there is no flag | M `MO/tool-replay`, `MO/tool-result-blocks`, `MO/tool-result-error` |
| MT | the same | M `MT/tool-replay`, `MT/tool-result-blocks`, `MT/tool-result-error` |

#### 14 · Turn order — `order`

Two variants: `adjacent`, a result directly after its call and before any text; `free`.

| Row | Takes | Proof |
|---|---|---|
| S, H | `adjacent` | M `S/tool-order-invalid-signed` (text before the result in the same user turn): "messages.2: `tool_use` ids were found without `tool_result` blocks immediately after: … Each `tool_use` block must have a corresponding `tool_result` block in the next message." |
| L | `adjacent` | M `L/tool-order-invalid`, the same message |
| MA | `free` | M `MA/tool-order-invalid` 200 |
| MO | `free` | M `MO/tool-order-invalid` (a user message between the call and its tool message) 200 |
| MT | `free` | M `MT/tool-order-invalid` 200 |

All six accept two user turns in a row (`S/consecutive-user`) and a conversation that begins
with an assistant turn (`S/first-assistant`); the same cases exist under every prefix. A
request built for `adjacent` is therefore accepted by every row.

#### 15 · Asking for reasoning — `mode`

Six variants: `adaptive`, on, and the model decides how much (`thinking: {type: "adaptive"}`);
`budget`, on with a token budget (`{type: "enabled", budget_tokens}`); `enabled`, on with no
budget (`{type: "enabled"}`); `disabled`, off (`{type: "disabled"}`); `between-tools`, no
reasoning before the answer and short updates between tool calls (`{type: "between_tools"}`);
`absent`, no setting sent. The counts below are complete answers under a setting, over all
cases of the row; an off switch is honoured when none of them reasons.

| Row | Takes | Proof |
|---|---|---|
| S | on `adaptive`; off `between-tools` | M 12 of 49 answers under `adaptive` reason (`S/effort-max`, 72 thinking tokens; the plain `S/thinking-adaptive` does not). M 0 of 33 under `between_tools` (`S/thinking-between-tools`). `disabled` rejected, `S/thinking-disabled`: "To turn thinking off on this model, send "thinking": {"type": "between_tools"} instead of {"type": "disabled"}. The model does not think before responding. The short updates it writes between tool calls come back as thinking blocks." `budget` rejected, `S/thinking-enabled`: ""thinking.type.enabled" is not supported for this model. Use "thinking.type.adaptive" and "output_config.effort" to control thinking behavior." `absent` accepted, 0 of 4 answers reason (`S/plain-default`); that it means `adaptive`: D [A12] |
| H | on `adaptive`; off `disabled`; `absent` is on | M 18 of 43 under `adaptive` (`H/thinking-adaptive`, 27 thinking tokens). M 0 of 35 under `disabled` (`H/thinking-disabled`). M `H/inline-tools` reasons with no setting (166 thinking tokens). `between-tools` rejected, `H/thinking-between-tools`: ""thinking.type.between_tools" is not supported for this model." `budget` rejected, `H/thinking-enabled`, the message S gives |
| L | on `budget`; off `disabled` | M 12 of 18 under a budget (`L/thinking-enabled`, 120 thinking tokens). M 0 of 38 under `disabled` (`L/thinking-disabled`). `adaptive` rejected, `L/thinking-adaptive`: "adaptive thinking is not supported on this model". `between-tools` rejected, `L/thinking-between-tools`. A budget under 1,024 rejected, `L/budget-too-small`: "thinking.enabled.budget_tokens: Input should be greater than or equal to 1024" (S and H check the same bound before they reject the mode). A budget equal to the output limit rejected, `L/budget-at-output`: "`max_tokens` must be greater than `thinking.budget_tokens`. …". `absent`: one answer, no reasoning (`L/plain-default`); that it means off: D [A12] |
| MA | on `budget` or `absent`; off `disabled` | M 46 of 46 under a budget (`MA/thinking-enabled`), 10 of 10 with no setting (`MA/plain-default`). M 0 of 55 under `disabled` (`MA/thinking-disabled`). The budget is not checked: 1,023 and a budget equal to the output limit are accepted, `MA/budget-too-small`, `MA/budget-at-output`. `adaptive` accepted and the answer reasons, `MA/cross-model-s`. `between_tools` was never sent |
| MO | on `absent` or `enabled`; off `disabled` | M 65 of 66 with no setting (`MO/plain-stream`; the one that does not is `MO/output-one`, a limit of one token), 7 of 7 under `enabled` (`MO/thinking-enabled`). M 0 of 15 under `disabled` (`MO/thinking-disabled`: 0 reasoning tokens and no `reasoning_content`). The setting is a top-level `thinking: {type}`. The effort `none` is a second off switch, `MO/effort-none` |
| MT | always on; no switch | M all 50 answers that carry usage count reasoning tokens (`MT/plain-stream`, 137). `MT/thinking-enabled`, `MT/thinking-disabled`: "unknown parameter `thinking`". `MT/effort-none`: ""reasoning_effort" does not support "none" with this model." |

On S the provider itself calls `between_tools` "thinking … disabled" (`S/off-effort-xhigh`,
piece 16). No answer under it holds a tool round with updates, so the "short updates between
tool calls" are documented and not seen.

#### 16 · Effort — `effort`

`output_config.effort` on Anthropic Messages, `reasoning_effort` on chat. Each case is one
sample of one prompt, so a count that rises with the value is a sign of the effect and not a
measure of it.

| Row | Takes | Proof |
|---|---|---|
| S | `low` to `max`, honoured; with reasoning off only up to `high` | M `S/effort-low`, `-medium`, `-high`, `-xhigh`, `-max`: thinking tokens 0, 0, 0, 28, 72. `S/off-effort-xhigh`, `S/off-effort-max`: "output_config.effort 'xhigh' is not supported when thinking is disabled on this model. Use effort 'high' or below, or enable thinking." `low` and `high` with reasoning off accepted, `S/cache-change-effort`, `S/inline-effort-off` |
| H | the same | M the same cases under `H/`: thinking tokens 0, 31, 56, 50, 75 |
| L | no effort | M `L/effort-low` to `L/effort-max`, `L/off-effort-max`: "This model does not support the effort parameter." |
| MA | `low` to `max` accepted, with reasoning on and off; no effect shows | M `MA/effort-low` to `MA/effort-max`, `MA/off-effort-xhigh`, `MA/off-effort-max`. The row has no reasoning count; the reasoning text is 37, 45, 26, 37 and 45 characters long |
| MO | `none` honoured; `low`, `medium`, `high` accepted, no effect shows; the rest rejected | M `MO/effort-none`: 0 reasoning tokens, no `reasoning_content`. `MO/effort-low`, `-medium`, `-high`: 28, 27, 24 reasoning tokens. `MO/effort-minimal`, `-xhigh`, `-max`: "Invalid request parameters" |
| MT | `minimal` to `xhigh`, honoured; `max` and `none` rejected | M `MT/effort-minimal`, `-low`, `-medium`, `-high`, `-xhigh`: reasoning tokens 172, 158, 285, 570, 410. `MT/effort-max`: "reasoning_effort 'max' is not supported for model 'muse-spark-1.1'. Supported values: [minimal, low, medium, high, xhigh]". `MT/effort-none`, quoted in piece 15 |

The effort a row applies when none is sent was not measured: D [A14] for Claude, A for the
rest. An effort carried by an instruction inside the conversation is in piece 5.

#### 17 · Whether reasoning text is returned — `display`

Three values of `thinking.display`: `summarized`, the text is returned; `omitted`, the
reasoning part arrives with empty text and its signature; `updates`, under a feature switch.

| Row | Takes | Proof |
|---|---|---|
| S | default `omitted`; `summarized` honoured | M `S/cut-text-user` (no setting: one empty `thinking_delta`, a signature, 70 thinking tokens). M `S/reasoning-stream-signed` (`summarized`: 181 characters of text). `omitted` and `updates` accepted, `S/display-omitted`, `S/display-updates`: neither answer reasons, so neither shows the setting |
| H | default `omitted`; `summarized` honoured | M `H/thinking-adaptive` (no setting: empty text, 27 thinking tokens). M `H/display-summarized` (58 characters). `H/display-omitted`: empty text, 28 thinking tokens, as the default. `updates` with its switch, `H/display-updates`: empty text, 28 thinking tokens |
| L | default `summarized`; `omitted` honoured | M `L/thinking-enabled` (no setting: 274 characters). M `L/display-omitted` (empty text, 117 thinking tokens). `L/display-summarized`: 314 characters. `updates` with its switch, `L/display-updates`: empty text, 134 thinking tokens |
| MA | no setting: text always returned | M `MA/display-omitted` (45 characters of text), `MA/display-summarized`, `MA/display-updates`: ignored |
| MO | no setting: text always returned | M `MO/reasoning-display-omitted` (`reasoning_content` returned): ignored |
| MT | no setting: no reasoning text at all | M `MT/plain-stream` (137 reasoning tokens, no reasoning field). `MT/reasoning-display-omitted`: "unknown parameter `thinking`" |

A display sent with reasoning off is rejected on S, H and L: `S/display-disabled`,
"thinking.disabled.display: Extra inputs are not permitted"; `S/between-tools-display`,
"thinking.between_tools.display: Extra inputs are not permitted". MA accepts it
(`MA/display-disabled`). What `updates` returns that `omitted` does not is not shown: on the
three Claude rows its answers hold empty text.

#### 18 · Cache marks — `cache`

Two variants: `marks`, the request says where a cached prefix ends (`cache_control` on a part,
or once at the top of the request); `implicit`, the provider caches by itself and nothing is
sent.

| Row | Takes | Proof |
|---|---|---|
| S | `marks` | M `S/cache-5m-write`: 2,503 tokens written, all in the five-minute count. M `S/cache-5m-read`: 2,503 read, 86 input tokens beside them. No answer of the row reads without a cache field in its request |
| H | `marks` | M `H/cache-5m-write` (1,903 written), `H/cache-5m-read` |
| L | `marks` | M `L/cache-5m-write` (5,042 written), `L/cache-5m-read` |
| MA | `implicit`; marks accepted, no effect shows | M five answers read 128 tokens with no cache field in the request (`MA/tool-replay-no-reasoning`, `MA/tool-replay-error`, `MA/binding-error`, `MA/inline-after-result`, `MA/tool-order-invalid`). With a mark: `MA/cache-5m-write` 1,753 input tokens and no read, `MA/cache-5m-read` 89 with 1,664 read. The long prefix was never sent twice without a mark, so nothing shows a mark doing anything |
| MO | `implicit`; every cache field accepted, no effect shows | M `MO/cache-no-options-write`: 1,152 of 1,206 prompt tokens cached with no cache field in the request; `MO/cache-implicit-write`, the first of the series, has 0. The same 1,152 under each field: `MO/cache-explicit-write`, `MO/cache-explicit-no-mark`, `MO/cache-key`, `MO/cache-retention-24h`, `MO/cache-invalid-ttl`, `MO/cache-five` |
| MT | `implicit`; `prompt_cache_options` rejected | M `MT/choice-auto`: 497 of 550 prompt tokens cached with no cache field (`MT/tool-seed`, the first, 550 with 0); 14 answers read so. `MT/cache-explicit-write`: "unknown parameter `prompt_cache_options`". `prompt_cache_key` and `prompt_cache_retention` accepted, `MT/cache-key`, `MT/cache-retention-24h`: both answers are empty and carry no usage |

MiMo's cached counts move in steps of 128 on both endpoints (128, 1,152, 1,664); Meta's do
not (497, 625).

The rules of marks, each measured on S and the same under `H/` and `L/`:

| Rule | Proof |
|---|---|
| Four marks at most | `S/cache-four` accepted. `S/cache-five`, and four with the one at the top, `S/cache-four-plus-top`: "A maximum of 4 blocks with cache_control may be provided. Found 5." |
| A mark at the top of the request stands for the last part | `S/cache-top-level`: 2,503 read, 82 written, with no mark on a part |
| Not on an empty part | `S/cache-empty`: "system.0: cache_control cannot be set for empty text blocks" |
| A prefix shorter than the model caches is not cached, without an error | `S/cache-short`: 200, nothing written, nothing read |
| A longer lifetime before a shorter one | `S/cache-mixed-valid` accepted. `S/cache-mixed-invalid`: "messages.0.content.0.cache_control.ttl: a ttl='1h' cache_control block must not come after a ttl='5m' cache_control block. Note that blocks are processed in the following order: `tools`, `system`, `messages`." |
| Where a mark may sit | Base instructions, `S/cache-5m-write`. A tool declaration, `S/cache-tool` (2,599 written). A user turn, `S/cache-user` (2,583 written). An assistant turn, `S/cache-assistant` (88 written, 2,503 read). A tool call and its result, `S/tool-replay-cache-signed` (686 written; L's case is defective). Not reasoning that is sent back, `S/cache-thinking-signed`: "messages.1.content.0.thinking.cache_control: Extra inputs are not permitted" (`L/cache-thinking`) |

MA accepts five marks, four with the one at the top, a mark on an empty part and a shorter
lifetime before a longer one (`MA/cache-five`, `MA/cache-four-plus-top`, `MA/cache-empty`,
`MA/cache-mixed-invalid`).

Lifetimes. Five minutes is written and read. One hour was never written: `S/cache-1h-write`
puts `ttl: "1h"` on the prefix `S/cache-5m-write` had just written, reads those 2,503 tokens
and writes nothing, and none of the 231 answers that carry the count by lifetime has a
one-hour count above 0. What is measured is that a one-hour mark reads an entry written at
five minutes.

What a change does to a cached prefix. Each case sends `cache-5m-write` again with one change;
the mark sits on the base instructions, so these show the cache of tools and instructions and
say nothing of a mark inside the conversation.

| Change | S | H | L |
|---|---|---|---|
| Another reasoning mode, `cache-change-thinking` | written again: 2,504 written, 0 read | 1,904 written, 0 read | 5,042 written, 0 read |
| Another tool choice (`none`), `cache-change-choice` | read: 2,503 | read: 1,903 | read: 5,042 |
| An effort added at the top (`low`), `cache-change-effort` | read: 2,503 | read: 1,903 | rejected, no effort |
| An effort carried by an instruction, on the request of the changed mode, `cache-inline-effort` | read: 2,504 | read: 1,904 | rejected |

`cache-change-thinking` also raises the output limit, so the pair does not isolate the mode.
That the written prefix is one token longer on S and H points at the mode. On MA the same
change still reads 1,664 (`MA/cache-change-thinking`).

#### 19 · Output limit — `limit`

| Row | Takes | Proof |
|---|---|---|
| S | `max_tokens`, 1 to 128,000 | M `S/output-one`: accepted, ends `max_tokens`. `S/output-above-ceiling-repeat`: "max_tokens: 128001 > 128000, which is the maximum allowed number of output tokens for claude-sonnet-5-5". `S/output-negative`: "max_tokens: must be greater than or equal to 0". `S/output-zero`: "stream cannot be true when max_tokens is 0" |
| H | the same | M the same cases under `H/` |
| L | `max_tokens`, 1 to 64,000 | M `L/output-above-ceiling-repeat`: "max_tokens: 64001 > 64000, …". `L/output-one`: accepted, ends `max_tokens` with no part at all |
| MA | `max_tokens`, 1 to 131,072 | M `MA/output-one`. `MA/output-above-ceiling`: "'max_tokens' 131073 is out of supported range (0, 131072]". `MA/output-zero`, `MA/output-negative`: the same range |
| MO | `max_completion_tokens`, 1 to 131,072; `max_tokens` accepted, alone and beside it | M `MO/output-one`: ends `length`. The messages are in the error's `param` (piece 36). `MO/output-above-ceiling`: "max_completion_tokens is too large: 131073. This model supports at most 131072 completion tokens, whereas you provided 131073." `MO/output-zero`: "max_completion_tokens is too small: 0. This model supports at least 1 completion tokens, …". `MO/output-legacy`, `MO/output-both` |
| MT | `max_completion_tokens`, at least 1; `max_tokens` accepted alone, rejected beside it | M `MT/output-zero`: "`max_completion_tokens` must be at least 1, got 0". `MT/output-legacy` accepted. `MT/output-both`: "`max_tokens` and `max_completion_tokens` are mutually exclusive". `MT/output-one`: accepted, the answer has no content. No ceiling was sent: A |

Every one of the 709 requests carries a limit, so a request without one is not measured:
D [A1] required on Anthropic, D [M1] optional on MiMo. A limit of 0 without `stream` was not
sent: D [A1]. The first `output-above-ceiling` of S, H and L stored its status and an empty
body.

#### 20 · Sampling — `sampling`

| Row | Takes | Proof |
|---|---|---|
| S | with reasoning off, `temperature` 1 and `top_p` 0.99; nothing else | M `S/temperature-default` (1) and `S/top-p-boundary` (0.99) accepted. `S/temperature-changed` (0): "`temperature` is deprecated for this model." `S/top-p-default` (1), `S/top-p-changed` (0.5): "`top_p` is deprecated for this model." `S/top-k`: "`top_k` is deprecated for this model." With reasoning on: `S/thinking-sampling-temperature`, "`temperature` may only be set to 1 when thinking is enabled or in adaptive mode. …"; `S/thinking-sampling-top-k`, "`top_k` must be unset when thinking is enabled or in adaptive mode. …"; `S/thinking-sampling-top-p` (0.5), "`top_p` must be greater than or equal to 0.95 or unset when thinking is enabled or in adaptive mode. …"; `S/thinking-top-p-valid` (0.95), "`top_p` is deprecated for this model." |
| H | the same | M the same cases under `H/` |
| L | all three with reasoning off, `temperature` and `top_p` not together; with a budget only `top_p` from 0.95 | M `L/temperature-changed`, `L/top-p-changed`, `L/top-p-default`, `L/top-k` accepted. `L/sampling-combined`: "`temperature` and `top_p` cannot both be specified for this model. Please use only one." With a budget: `L/thinking-sampling-temperature`, `L/thinking-sampling-top-k`, `L/thinking-sampling-top-p` rejected, `L/thinking-top-p-valid` (0.95) accepted |
| MA | all accepted, with reasoning on and off | M `MA/temperature-changed`, `MA/top-p-changed`, `MA/top-k`, `MA/sampling-combined`; with reasoning on `MA/thinking-sampling-temperature`, `MA/thinking-top-p-valid`. That the values are overridden with reasoning on: D [M1] |
| MO | all accepted; `temperature` honoured; two answers rejected | M `MO/temperature-upper` (1.5): the answer is "OK." and then noise, 33 completion tokens where its siblings have 2. Accepted: `MO/temperature-changed`, `MO/top-p-lower`, `MO/top-p-default`, `MO/frequency-penalty`, `MO/presence-penalty`, `MO/seed`, `MO/logit-bias`, `MO/logprobs`, `MO/top-logprobs` (no `logprobs` in the answers). `MO/n-two`: "n is not supported" |
| MT | `temperature`, `top_p`, penalties and `seed` accepted; the rest rejected | M `MT/temperature-changed`, `MT/temperature-upper`, `MT/top-p-changed`, `MT/top-p-lower`, `MT/presence-penalty`, `MT/seed`; `MT/frequency-penalty` accepted with an empty answer. `MT/logit-bias`: "`logit_bias` is not supported". `MT/logprobs`: "`logprobs` is not supported with reasoning." `MT/n-two`: "`n` must be 1, got 2" |

`S/sampling-combined` and `H/sampling-combined` send `top_p: 1`, which is rejected alone, so
they do not show the pair. On S and H no sampling field was sent with a value that is
accepted while reasoning is on.

#### 21 · Stop sequences — `stop`

`stop_sequences` on Anthropic Messages, `stop` on chat. The prompt asks for the text
"OK END EXTRA" and the sequence is "END".

| Row | Takes | Proof |
|---|---|---|
| S, H, L | honoured, and the match is reported | M `S/stop-one`: the text is "OK ", `stop_reason: "stop_sequence"`, `stop_sequence: "END"`. `S/stop-four` the same with four sequences |
| MA | ignored | M `MA/stop-one`, `MA/stop-four`: the text is "OK END EXTRA", `end_turn`, and no `stop_sequence` key |
| MO | not reliable | M `MO/stop-one`, `MO/stop-string`: the whole text "OK END EXTRA", `stop`. `MO/stop-four` (`END`, `A`, `B`, `C`): the reasoning ends at `…"OK END EXTR`, just before an "A"; the answer has no content and ends `stop`. `MO/stop-five`: "stop supports at most 4 sequences" |
| MT | rejected | M `MT/stop-one`, `MT/stop-string`, `MT/stop-four`: "`stop` is not supported" |

#### 22 · Stream switch — `stream`

| Row | Takes | Proof |
|---|---|---|
| S, H, L, MA | `stream: true` for a stream; `false` or no field for one JSON body | M `S/plain-stream`, `S/plain-json`, `S/plain-default`, and the same three under `H/`, `L/`, `MA/` |
| MO | the same; usage comes whether asked for or not | M `MO/plain-stream`, `MO/plain-json`, `MO/stream-default`. Usage with `stream: true` alone and with `include_usage: false`: `MO/stream-usage-omitted`, `MO/stream-usage-false`. `include_obfuscation` changes nothing seen: `MO/stream-obfuscation-true`, `MO/stream-obfuscation-false`. `stream_options` beside `stream: false` accepted, `MO/json-stream-options` |
| MT | the same; `stream_options` only with a stream | M `MT/plain-stream`, `MT/plain-json`, `MT/stream-default`; usage in `MT/stream-usage-omitted` and `MT/stream-usage-false`. `MT/json-stream-options`: "`stream_options` requires `stream` to be true" |

#### 23 · Cut output sent back — `cut`

Two variants: `user`, the cut text as an assistant turn, then a user turn that says
"Continue."; `prefill`, the cut text as the last message.

| Row | Takes | Proof |
|---|---|---|
| S | `user` | M `S/cut-text-user`: accepted with reasoning on; the text sent ends at "4" and the answer goes on from "5". `prefill` rejected with reasoning off and on, `S/cut-text-prefill-off`, `S/cut-text-prefill-on`: "This model does not support assistant message prefill. The conversation must end with a user message." |
| H | `user` | M the same cases under `H/` |
| L | `user`; `prefill`, with and without a budget | M `L/cut-text-user`: goes on from "15". M `L/cut-text-prefill-off`, `L/cut-text-prefill-on`: accepted, the answer continues the text exactly ("\n15\n16…" after "…13\n14"); under the budget it has no reasoning part and no reasoning count |
| MA | `user`; `prefill` with reasoning off | M `MA/cut-text-user`: goes on from "2". M `MA/cut-text-prefill-off`: goes on from "2". `MA/cut-text-prefill-on`: accepted, and the answer starts over at "1" |
| MO | neither continues | M `MO/cut-text-user` and `MO/cut-text-prefill`: accepted, and the answer starts over with the "1 f" that was sent |
| MT | A | The follow-ups were not sent. `MT/cut-text` is not a cut: it is a complete answer with no content |

Reasoning that was cut, sent back as a turn that holds reasoning only, then a user turn:

- S, H: accepted, `S/cut-thinking-replay-signed`, `H/cut-thinking-replay`. In both the stream
  was cut after the reasoning part had closed, so the part is whole and signed. A part cut
  before its signature was not captured on S or H.
- L: rejected, `L/cut-thinking-replay`: "messages.1.content.0: Invalid `signature` in
  `thinking` block". The part was cut before its signature and went back with `signature: ""`.
- MA: accepted, `MA/cut-thinking-replay` (text cut after eight characters, `signature: ""`).
- MO: accepted, `MO/cut-reasoning-replay` (`content: ""` and the cut `reasoning_content`).

### What a response carries

Counts of streams, used below: S 81, H 79, L 55, MA 110, MO 92, MT 58, which is 475. Of these
the reader cut 11 on purpose (two each on S, H, L, MA, MO, one on MT) and left 2 at its own
limit of 120 seconds (MO); the other 462 are complete.

#### 24 · Framing — `framing`

Two variants: `named`, server-sent events in which every frame has an `event:` line equal to
the `type` in its JSON, and no terminal line; `data`, frames of `data:` lines alone, the last
being `data: [DONE]`.

| Row | Takes | Proof |
|---|---|---|
| S, H, L | `named`, seven event names | M 215 streams, e.g. `S/plain-stream`: `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop`, `ping`. No frame lacks a name and none has a name that differs from its `type` |
| MA | `named`, the same names without `ping` | M 110 streams, e.g. `MA/plain-stream` |
| MO | `data` | M 92 streams, e.g. `MO/plain-stream`; no frame has an event name |
| MT | `data` | M 58 streams, e.g. `MT/plain-stream` |

On all six, lines end in LF alone, a blank line follows every frame, and every recorded body
ends on a frame boundary, the cut ones too: no fixture holds half a frame. A stream is
`text/event-stream` (with `; charset=utf-8` on S, H and L only); an answer that is not
streamed is one `application/json` body.

#### 25 · Step opens — `open`

| Row | Takes | Proof |
|---|---|---|
| S, H, L | `message_start` with `message: {model, id, type, role, content: [], container, stop_reason, stop_sequence, stop_details, usage, diagnostics}` | M all 215 streams, e.g. `S/plain-stream`. `container`, `stop_details` and `diagnostics` are null. `input_transformations` joins them under the binding control (piece 41) |
| MA | `message_start` with `message: {id, type, role, model, content: [], usage}` | M all 110 streams, e.g. `MA/plain-stream` |
| MO | a first chunk `{id, choices, created, model, object}` whose delta is `{content: "", role: "assistant", tool_calls: null, reasoning_content: null}` | M 90 streams, e.g. `MO/plain-stream`. On 39 of them keep-alive lines come first (piece 35) |
| MT | a first chunk whose delta holds the role and the first text together | M 48 streams, e.g. `MT/plain-stream`. In an empty answer the first chunk is the only one: an empty delta with the finish reason, `MT/empty-text` |

#### 26 · Part boundaries — `boundary`

Two variants: `explicit`, a start frame and a stop frame for each part, with an index;
`implied`, no boundary frames, a part being the run of deltas that fill one field.

| Row | Takes | Proof |
|---|---|---|
| S, H, L | `explicit`; the index is the part's position | M 93, 98 and 64 parts, e.g. `S/reasoning-stream-signed` (reasoning 0, text 1), `S/parallel-false` (two tool calls) |
| MA | `explicit` | M 166 parts, e.g. `MA/reasoning-stream` |
| MO | `implied`: reasoning, then text, then tool calls | M in each of the 62 streams that hold both, all `reasoning_content` comes before any `content`, e.g. `MO/plain-stream`. Tool calls are told apart by `tool_calls[].index`, `MO/parallel-true` |
| MT | `implied`: text, then tool calls | M `MT/choice-auto`, `MT/parallel-true` (text, then two calls by index) |

The order of parts in a stream is reasoning, text, tool calls on the four `explicit` rows
(`S/reasoning-stream-signed`, `H/tool-replay-error-signed`, `S/parallel-true`). MA's body that
is not streamed breaks it: `MA/plain-default` and `MA/reasoning-json` are `[text, thinking]`,
while `MA/tool-seed` is `[thinking, tool_use]`. A cut leaves the open part without its stop
frame (`S/cut-text`); in `S/cut-thinking-signed` and `H/cut-thinking` the reasoning part is
closed and the text part is open.

#### 27 · Text — `text`

| Row | Takes | Proof |
|---|---|---|
| S, H, L, MA | a part opened as `{type: "text", text: ""}`, then `text_delta` frames | M 75, 69, 45 and 99 text parts, each opened empty, e.g. `S/plain-stream` |
| MO | `delta.content`, a string; null in every chunk that carries something else | M `MO/plain-stream` |
| MT | `delta.content`; the key is absent from chunks that carry something else | M `MT/plain-stream` |

Not streamed: a `{type: "text", text}` in `content` (`S/plain-json`, `MA/plain-json`);
`message.content` on chat (`MO/plain-json`, `MT/plain-json`).

#### 28 · Reasoning — `reasoning`

Three variants: `part`, a reasoning part of its own, opened as
`{type: "thinking", thinking: "", signature: ""}` and filled by `thinking_delta` frames;
`field`, the reasoning text in a field beside the content (`delta.reasoning_content`,
`message.reasoning_content`); `hidden`, no reasoning in the answer, only its token count.

| Row | Takes | Proof |
|---|---|---|
| S | `part` | M 11 parts in streams, 7 with text (`S/reasoning-stream-signed`) and 4 with the text withheld (`S/cut-text-user`). Not streamed: `S/reasoning-json-signed-max` |
| H | `part` | M 18 parts, 8 with text (`H/reasoning-stream`), 10 withheld (`H/thinking-adaptive`). `H/reasoning-json` |
| L | `part` | M 11 parts, 9 with text (`L/reasoning-stream`), 2 withheld (`L/display-omitted`). `L/reasoning-json` |
| MA | `part` | M 55 parts, all with text, e.g. `MA/reasoning-stream`. `MA/reasoning-json` |
| MO | `field` | M `MO/plain-stream`, `MO/plain-json` |
| MT | `hidden` | M `MT/plain-stream`: 137 reasoning tokens, and neither the deltas nor the message of `MT/plain-json` has a reasoning key |

Withheld text is always the same shape: one `thinking_delta` holding the empty string, then
the signature.

#### 29 · Tool call — `tool`

| Row | Takes | Proof |
|---|---|---|
| S, H, L | a part opened as `{type: "tool_use", id, name, input: {}, caller}`, then `input_json_delta` fragments | M 7, 11 and 8 calls, each in three fragments, the first `""`, e.g. `S/tool-choice-auto`. Ids are `toolu_` and 24 characters. Two calls are two parts, `S/parallel-false`. Not streamed, `input` is an object, `S/tool-seed` |
| MA | the same part without `caller`; one fragment holds the whole input | M 12 calls, e.g. `MA/tool-choice-auto`. Ids are `call_` and 24 characters |
| MO | `delta.tool_calls[]`; every fragment is `{index, id, function: {arguments, name}, type}`, with `id` and `name` set in the first (beside `arguments: ""`) and null after | M 11 calls, four fragments each, e.g. `MO/choice-auto`. Ids are `call_` and 24 characters. Not streamed: `MO/tool-seed` |
| MT | a first fragment `{index, id, type, function: {name, arguments: ""}}`, then `{index, function: {arguments}}` with the whole input | M 6 calls, two fragments each, e.g. `MT/choice-auto`. Ids are `call_` and 32 characters in a stream, `call_` and a dashed UUID in a body that is not streamed (`MT/tool-seed`) |

Every recorded input parses as JSON once its fragments are joined; no capture cuts a stream
inside a tool call. Text comes before tool calls in one answer on S, H and MT
(`S/parallel-true`, `H/parallel-false`, `MT/choice-auto`). One answer writes a tool call into
its text: `MO/choice-allowed-tools`, whose request declares no tool, holds
`<tool_call><function=get_value>…` as content and ends `stop`.

#### 30 · Opaque payload — `payload`

Three variants: `signature`, an opaque string on each reasoning part, in one `signature_delta`
after the last `thinking_delta` and before the part's stop frame; `empty`, the same frame and
field holding the empty string; `absent`.

| Row | Takes | Proof |
|---|---|---|
| S | `signature` | M 11 of 11 parts, e.g. `S/reasoning-stream-signed`. Not streamed, a `signature` field: `S/tool-seed-signed` |
| H | `signature` | M 18 of 18 parts, e.g. `H/reasoning-stream`; `H/tool-seed-signed` |
| L | `signature`, and it holds the organisation id of the account | M 10 of 10 closed parts, e.g. `L/reasoning-stream`; `L/tool-seed-signed`. The id is flagged in 26 `transport.json` files, 25 under L and `S/cross-model-l` (D028); it was not decoded here |
| MA | `empty` | M 54 of 54 closed parts carry a `signature_delta` whose signature is `""`, e.g. `MA/reasoning-stream`. Not streamed, `signature: ""`: `MA/reasoning-json` |
| MO | `absent` | M `MO/plain-stream`: the reasoning text and nothing beside it |
| MT | `absent` | M `MT/plain-stream` |

A part cut before its signature has none (`L/cut-thinking`, `MA/cut-thinking`). No answer
holds a `redacted_thinking` part, and none has a payload on a text part or a tool call.

#### 31 · Why it stopped — `cause`

`message_delta.delta.stop_reason` on the four Anthropic Messages rows, null in
`message_start`; `choices[].finish_reason` in the last chunk that has a choice on the two
chat rows.

| Row | Reasons seen, with the number of streams | Proof |
|---|---|---|
| S | `end_turn` 70, `tool_use` 6, `stop_sequence` 2, `max_tokens` 1 | M `S/plain-stream`, `S/tool-choice-auto`, `S/stop-one`, `S/output-one` |
| H | the same four: 64, 10, 2, 1 | M the same cases under `H/` |
| L | the same four: 43, 7, 2, 1 | M the same cases under `L/` |
| MA | `end_turn` 96, `tool_use` 10, `max_tokens` 2 | M `MA/plain-stream`, `MA/tool-choice-auto`, `MA/output-one` |
| MO | `stop` 78, `tool_calls` 9, `length` 1 | M `MO/plain-stream`, `MO/choice-auto`, `MO/output-one` |
| MT | `stop` 52, `tool_calls` 5 | M `MT/plain-stream`, `MT/choice-auto` |

Reasons that do not mean a finished answer:

- MT: `stop` for an answer that holds nothing. Ten complete answers are one chunk with an
  empty delta, `finish_reason: "stop"` and no usage: `MT/output-one` (a limit of 1), the five
  accepted `cache-` cases (64), `MT/empty-text`, `MT/frequency-penalty`,
  `MT/sampling-combined` (256) and `MT/cut-text` (768). Every answer limited to 1 or 64 tokens
  is one of them, and Meta never returned `length`. That its hidden reasoning used up the
  limit is a reading: an empty answer carries no usage to show it. Answers under 256 and 768
  that do carry usage spend up to 236 and 717 tokens.
- MO: `stop` with no content, where a stop sequence matched inside the reasoning
  (`MO/stop-four`, piece 21).
- S, H, L: `end_turn` with no part at all under `tool_choice: none` (`S/tool-choice-none`);
  L: `max_tokens` with no part (`L/output-one`).

Never returned in 707 answers: `refusal`, `pause_turn`, `model_context_window_exceeded`,
`content_filter`, `repetition_truncation`. D [A21] [O2] [M1] [M2].

#### 32 · Which stop sequence matched — `match`

| Row | Takes | Proof |
|---|---|---|
| S, H, L | `message_delta.delta.stop_sequence`: the sequence, or null | M `S/stop-one`, `S/stop-four` ("END"); null in the other 77 complete streams of S |
| MA | no field | M the key is absent from all 108 `message_delta` frames, `MA/stop-one` among them |
| MO | no field | M `MO/stop-one`; the format has none |
| MT | no field | M the row rejects stop sequences (piece 21) |

#### 33 · Refusal detail — `refusal`

No answer is a refusal, so what a refusal carries is documented or assumed on every row. What
is measured is the field it would arrive in.

| Row | Takes | Proof |
|---|---|---|
| S, H, L | `stop_details`, null in all 209 complete streams and 16 bodies | M the field, `S/plain-stream`. Its content on a refusal: D [A1] [A39] |
| MA | no field | M absent from 108 streams. A `content_filter` stop reason: D [M1] |
| MO | no field | M no `refusal` key in any delta or message. D [M2] |
| MT | `message.refusal`, null, in a body that is not streamed; no key in a stream | M `MT/plain-json`. What a refusal looks like: A |

#### 34 · Usage — `usage`

Two variants: `disjoint`, the input count leaves out the cached tokens, which are counted
beside it; `inclusive`, the prompt count includes them.

| Row | Takes | Proof |
|---|---|---|
| S, H | `disjoint`, in two frames | M `S/cache-5m-read`: 86 input tokens and 2,503 read. `message_start`: `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `cache_creation.{ephemeral_5m_input_tokens, ephemeral_1h_input_tokens}`, `output_tokens`, `service_tier`, `inference_geo`. `message_delta`: `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens`, `output_tokens_details.thinking_tokens`. The input counts are the same in both frames. A body that is not streamed has all of them, `S/plain-json` |
| L | the same; the reasoning count only when a budget is sent | M `L/cache-5m-read`. 15 of 53 complete streams carry `thinking_tokens` (`L/thinking-enabled`; not `L/plain-stream`, and not the prefilled `L/cut-text-prefill-on`). `inference_geo` is "not_available", where S and H say "global" |
| MA | `disjoint`: `input_tokens`, `output_tokens`, and `cache_read_input_tokens` only when something was read | M `MA/cache-5m-write`: 1,753 input. `MA/cache-5m-read`: 89 input and 1,664 read. 21 of 110 streams carry the third key. No count of tokens written, none of reasoning |
| MO | `inclusive`; once, in a last chunk with `choices: []`, asked for or not | M `MO/cache-implicit-write`: 1,206 prompt tokens, 0 cached. `MO/cache-implicit-read`: 1,206, 1,152 cached. Keys: `prompt_tokens`, `completion_tokens`, `total_tokens`, `completion_tokens_details.reasoning_tokens`, `prompt_tokens_details.cached_tokens`. The chunk with the finish reason has `usage: null` |
| MT | `inclusive`; once, on the chunk with the finish reason | M `MT/tool-seed`: 550 prompt tokens, 0 cached. `MT/choice-auto`: 550, 497 cached. The same five keys. An empty answer has no usage, `MT/empty-text` |

The output count includes reasoning wherever reasoning is counted: `S/effort-max` 117 with 72,
`MO/plain-stream` 15 with 12, `MT/plain-stream` 148 with 137. A cut stream keeps the usage of
`message_start` and loses the final one on the four Anthropic Messages rows (`S/cut-text`: 32
input tokens) and has none on the chat rows (`MO/cut-text`, `MT/cut-reasoning`). Only chat
has a total.

#### 35 · Keep-alive and unknown frames — `heartbeat`

Two variants: `ping`, a named event; `comment`, a line that begins with a colon.

| Row | Takes | Proof |
|---|---|---|
| S, H, L | `ping`: exactly one, right after the first part opens | M 211 of 215 streams, e.g. `S/plain-stream`. The four without one have no part: `S/tool-choice-none`, `H/tool-choice-none`, `L/tool-choice-none`, `L/output-one` |
| MA | `comment`: `: PROCESSING` lines before the first frame | M 43 of 110 streams, up to 21 lines (`MA/tool-choice-tool`), about one for every five seconds of waiting. No `ping` in any stream |
| MO | `comment`: the same lines | M 41 of 92 streams, up to 23 (`MO/choice-function`, where nothing else came) |
| MT | none | M 58 streams |

An unknown frame or event name: none in the 475 streams. That one must be passed over is
D [A2] [A4].

#### 36 · Failure before the stream — `rejection`

Three statuses were ever returned: 200, 400 and 401.

| Row | Takes | Proof |
|---|---|---|
| S, H, L | `{type: "error", error: {type, message}, request_id}`, and the header `request-id` with the same id | M 148 bodies, all 400 `invalid_request_error`, e.g. `S/output-zero`. Other statuses and `retry-after`: D [A6] [A7] |
| MA | 400: `{error: {type, message}}`. 401: `{error: {message, param, code: "401", type: "invalid_key"}}` | M `MA/output-zero` (three such, all `invalid_request_error`). `MA/host-sgp` (two such). Neither has a request id |
| MO | 400: `{error: {code: "400", message, param, type}}`. 401 as MA | M nine 400s. Under the message "Param Incorrect" the detail is in `param`, `MO/n-two`; under "Invalid request parameters" there is none, `MO/effort-max`. `type` is `""`, "Bad Request" or "BadRequestError" (`MO/effort-minimal`). `MO/host-sgp` |
| MT | `{error: {code: null, message, param, type: "invalid_request_error"}}`, and the header `x-request-id` | M 38 bodies, all 400, e.g. `MT/n-two`; `param` names the field |

MiMo answers 401 in the same shape on both endpoints, and it is neither format's own shape.
Other statuses: D [M3] for MiMo, A for Meta.

#### 37 · Failure inside the stream — `fault`

No row sent one: no `error` event in the 325 Anthropic Messages streams and no chunk with an
error in the 150 chat streams. D [A2] [A6] for S, H and L (`event: error`); A for MA, MO and
MT.

The nearest thing recorded is a stream that never starts. `MO/choice-function` and
`MO/top-p-changed` answered 200, sent 23 keep-alive lines and nothing else, and were left by
the reader at its limit of 120 seconds.

#### 38 · Step ends — `end`

| Row | Takes | Proof |
|---|---|---|
| S, H, L, MA | `message_stop`, after exactly one `message_delta`; nothing follows it | M 317 complete streams (79, 77, 53, 108), e.g. `S/plain-stream` |
| MO, MT | `data: [DONE]`; nothing follows it | M 88 and 57 complete streams, e.g. `MO/plain-stream` |

The end frame is missing from each of the 13 streams that are not complete, so its absence
marks a cut step: `S/cut-text`, `MA/cut-thinking`, `MO/cut-text`, `MT/cut-reasoning`.

#### 39 · Who answered — `provenance`

| Row | Takes | Proof |
|---|---|---|
| S, H | header `request-id` (`req_` and 24 characters) on every answer; `message.id` (`msg_` and 24); `message.model`, the slug that was sent | M `S/plain-stream`, `S/output-zero` |
| L | the same; `message.model` is the dated slug | M `L/plain-stream` |
| MA | `message.id`: `msg_` and 24 characters in a stream, a UUID, `_` and 32 hex characters in a body that is not streamed; `message.model` | M `MA/plain-stream`, `MA/plain-json`. No request id under the stored header names |
| MO | on every chunk `id` (a UUID, `_` and 32 hex characters), `model` and `created`; `created` changes inside a stream | M `MO/plain-stream`. `created` takes two or more values in 38 of 90 streams, 18 in `MO/cut-text-prefill`. No request id under the stored names |
| MT | header `x-request-id` (a UUID) on every answer; `id` (`chatcmpl-` and a UUID), `model`, `created` | M `MT/plain-stream`, `MT/n-two` |

Neither chat row sends `system_fingerprint` or `service_tier` on a chunk, and neither answer
has an `openai-version` or `openai-processing-ms` header, which would have been stored.

#### 40 · Rate-limit state — `quota`

| Row | Takes | Proof |
|---|---|---|
| S, H, L | twelve `anthropic-ratelimit-` headers on a 200 (requests, tokens, input tokens, output tokens; each with limit, remaining, reset); none on a 400 | M 88, 84 and 59 answers with them, e.g. `S/plain-stream`; 51, 45 and 55 without, e.g. `S/output-zero` |
| MT | `x-ratelimit-limit-requests`, `x-ratelimit-limit-tokens`, `x-ratelimit-remaining-requests`, `x-ratelimit-remaining-tokens` on a 200; none on a 400; no `reset` | M 61 answers with them, e.g. `MT/plain-stream`; 38 without |
| MA, MO | none under the stored names | M 119 and 107 answers |

`retry-after` would have been stored and is in no answer; no 429 was returned.

#### 41 · What the server changed — `alteration`

| Row | Takes | Proof |
|---|---|---|
| S, H | `message_start.message.input_transformations`, a list, when the binding switch and a `block_binding` are sent | M `S/binding-drop-block-signed`: `[{type: "thinking_dropped", path: "messages.1.content.0", reason: "prefix_binding_mismatch"}]`. `S/binding-drop-block`: `[]`, its request holding no reasoning. Absent from the 78 streams without the control |
| L | the same field, always `[]` | M `L/binding-drop-block`, `L/binding-error`: their requests hold a signed part under changed instructions, and nothing is dropped |
| MA | no field | M `MA/binding-drop-block` and the other 109 streams |
| MO, MT | none | The format has no such report |

One change is made and not reported: H drops a reasoning part that S issued (section 3, G006)
in a request without the binding control, and only the input count shows it.

### The rows' variants in one table

Where a piece has variants, the one each row takes. A cell is proven in its piece above.

| Piece | S | H | L | MA | MO | MT |
|---|---|---|---|---|---|---|
| `authentication` | `header`, `bearer` | `header`, `bearer` | `header`, `bearer` | `header`, `bearer` | `bearer`, `header` | `bearer` |
| `version` | `pinned` | `pinned` | `pinned` | `absent` | no header | no header |
| `instructions` | `string`, `parts` | `string`, `parts` | `string`, `parts` | `string`, `parts` | `system`, `developer` | `system`, `developer` |
| `inline` | `role`, after a user turn at the end | the same | no `role` | `role`, anywhere | `role`, anywhere | `role`, anywhere |
| `replay` | `part` | `part` | `part` | `part` | `field` | `absent` |
| `choice` | `auto`, `none` | all four | all four; forced only with reasoning off | all four accepted, `none` ignored | `auto`, `required`; `none` ignored | `auto` |
| `parallel` | honoured | honoured | honoured | ignored | ignored | honoured |
| `order` | `adjacent` | `adjacent` | `adjacent` | `free` | `free` | `free` |
| `mode`, on | `adaptive` | `adaptive` | `budget` | `budget`, `absent` | `enabled`, `absent` | always |
| `mode`, off | `between-tools` | `disabled` | `disabled` | `disabled` | `disabled` | no switch |
| `effort` | `low` to `max` | `low` to `max` | no effort | accepted, no effect shows | `none`; `low` to `high` accepted | `minimal` to `xhigh` |
| `display` | `summarized`, `omitted` | `summarized`, `omitted` | `summarized`, `omitted` | text always | text always | no text |
| `cache` | `marks` | `marks` | `marks` | `implicit` | `implicit` | `implicit` |
| `stop` | honoured | honoured | honoured | ignored | not reliable | rejected |
| `cut` | `user` | `user` | `user`, `prefill` | `user`; `prefill` with reasoning off | neither continues | not measured |
| `framing` | `named` | `named` | `named` | `named` | `data` | `data` |
| `boundary` | `explicit` | `explicit` | `explicit` | `explicit` | `implied` | `implied` |
| `reasoning` | `part` | `part` | `part` | `part` | `field` | `hidden` |
| `payload` | `signature` | `signature` | `signature` | `empty` | `absent` | `absent` |
| `usage` | `disjoint` | `disjoint` | `disjoint` | `disjoint` | `inclusive` | `inclusive` |
| `heartbeat` | `ping` | `ping` | `ping` | `comment` | `comment` | none seen |

## 2. What the captures contradict

A cell of the pieces file, what it says, and the fixture that shows otherwise. "Cell" names
the piece and the column, "rule" a line under "Rules a piece carries".

### Cells and rules a fixture shows to be wrong

| # | Where | It says | The fixture shows |
|---|---|---|---|
| 1 | Sampling · differs; rule under "Output limit, sampling, stop sequences" | On Sonnet 5.5 and Haiku 5.5 "only `temperature` 1.0 and `top_p` of 0.99 or more are accepted" | `top_p: 1` is rejected: `S/top-p-default`, `H/top-p-default`, "`top_p` is deprecated for this model." Only 0.99 passed (`S/top-p-boundary`), and with reasoning on 0.95 is rejected too (`S/thinking-top-p-valid`) |
| 2 | Cut output sent back · differs; rule under "Cut output sent back" | "Haiku 4.5 accepts one, but not with thinking on"; "You can't prefill the assistant response while thinking is on" | `L/cut-text-prefill-on`: a last assistant message with a budget of 1,024 is accepted. The answer continues the text and has no reasoning part and no reasoning count |
| 3 | Turn order · differs | "With a budget (Haiku 4.5, `thinking.type: "enabled"`) the final assistant turn must begin with a thinking block" | The same fixture: the final assistant turn holds text only |
| 4 | Rule under "Asking for reasoning, effort, display", last row of its table | A per-message effort that differs, with thinking off, is 400: "… effort cannot change when thinking is disabled on this model." | `S/inline-effort-off`, `H/inline-effort-off`: reasoning off, `high` at the top, an instruction carrying `low` as the last message: accepted |
| 5 | Rule under "Reasoning sent back" | "Required: within a tool-use turn, pass thinking blocks back" | Not enforced on S and H: `S/tool-replay-no-reasoning-signed`, `H/tool-replay-no-reasoning-signed` leave the part out of the tool round and are accepted; the model reasons again |
| 6 | Reasoning sent back · differs | The part "is bound to its model" on Sonnet 5.5 and Haiku 5.5 | In one direction it is not: `S/cross-model-h-signed`, Sonnet reading a Haiku 5.5 part, counts 767 input tokens, the count Haiku has for its own part. The other direction fits the cell: `H/cross-model-s-signed` counts 543, the count without the part. Neither request carries the binding control |
| 7 | Usage · OpenAI chat; rule under "The stream" | Usage comes "only when `stream_options.include_usage` is set", in "one extra chunk … with `choices: []`", `usage` null on every other chunk | Both chat rows send usage with `stream: true` alone and with `include_usage: false`: `MO/stream-usage-omitted`, `MO/stream-usage-false`, `MT/stream-usage-omitted`, `MT/stream-usage-false`. MT puts it on the chunk that has the finish reason, whose `choices` is not empty |
| 8 | Step opens · OpenAI chat | The first delta is `{role: "assistant", content: ""}`; "every chunk repeats `id`, `created` and `model`" | MT's first delta holds the first text (`MT/plain-stream`). MO's `created` changes inside a stream, in 38 of 90 streams (`MO/cut-text-prefill`: 18 values) |

Neither OpenAI row is OpenAI: rows 7 and 8 say what two providers of the format do, and
nothing about `api.openai.com`.

### What MiMo's pages list and its endpoints do not do

The cells quote the pages correctly. The fixtures show the endpoint behaving otherwise.

| # | Cell | The page | The fixture shows |
|---|---|---|---|
| 9 | Opaque payload · differs (and the plan, "The pieces", fourth fact) | No `signature_delta` in the stream; a `signature` on the `thinking` block that is not streamed | A `signature_delta` in every closed reasoning part, 54 of 54, holding `""` (`MA/reasoning-stream`); not streamed, `signature: ""` (`MA/reasoning-json`) |
| 10 | Stop sequences · differs | `stop_sequences` on the Anthropic page, `stop` (up to 4) on the OpenAI page | Ignored on MA (`MA/stop-one`). On MO a sequence does not stop the text (`MO/stop-one`) and one matches inside the reasoning (`MO/stop-four`) |
| 11 | Parallel tool calls · differs | The Anthropic page lists `disable_parallel_tool_use` | Ignored: two calls with it set, `MA/parallel-true` |
| 12 | Tool choice · differs; rule under "Tool choice" | A value other than `auto` is removed and the call behaves as `auto`, with no error | True of `none` on both endpoints (`MA/tool-choice-none`, `MO/choice-none`). A named function on chat produced no answer at all in its one capture (`MO/choice-function`) |

### Narrower than the cell

- Output limit: `max_tokens: 0` is rejected with `stream: true` (`S/output-zero`, "stream cannot
  be true when max_tokens is 0"). The cell has a minimum of 0.
- Sampling: Haiku 4.5 "accepted" all three; it rejects `temperature` and `top_p` together
  (`L/sampling-combined`).
- Usage · Anthropic: `message_delta.usage` carries no count by lifetime, no tier and no geo,
  and `message_start.usage` no reasoning count (piece 34). There is exactly one
  `message_delta`, where the rule says "one or more".
- Keep-alive: "`ping` events, any number, anywhere" was always exactly one, after the first
  part opens (piece 35).
- Reasoning sent back: the message for a blanked signature is "Invalid `signature` in
  `thinking` block" (`S/tool-replay-empty-signature-signed`), not the "cannot be modified"
  message the rule quotes. No capture changes the text of a signed part.
- The plan, "The pieces", third fact: "Sonnet 5.5 answers 400 … to any sampling setting". It
  accepts `temperature: 1` and `top_p: 0.99` (`S/temperature-default`, `S/top-p-boundary`).

### The first reading of the captures, corrected

The capture task's report read its own results first. Three of its sentences do not hold.

- "Sonnet continuation from a MiMo Messages seed returned 400." The request copies MiMo's
  `thinking: {type: "enabled"}`, which Sonnet rejects before it looks at the conversation
  (`S/cross-model-ma`). It shows nothing about the seed. The same defect is in
  `S/cross-model-l` and `L/cross-model-s`.
- MiMo's answers that are not streamed "have thinking but no signature". They have
  `signature: ""`.
- "MiMo Messages covers more: … answered 31 and Chat 29"; "only Messages answered …
  `effort-xhigh` and `effort-max`". An answer of 200 is acceptance. No effect of any effort
  value shows on MA (piece 16), and MA rejects nothing but an output limit out of range.

### Items of the pieces file's "Unverified" list that are now measured

- A fifth cache mark: 400, "A maximum of 4 blocks with cache_control may be provided. Found
  5." (`S/cache-five`).
- An output limit above the ceiling (`S/output-above-ceiling-repeat`), an empty text part
  (`S/empty-text`), a first message that is not the user's (accepted on all six,
  `S/first-assistant`).
- The 400 for a `system` role on a model without it: "role 'system' is not supported on this
  model" (`L/inline-after-user`).
- G009 (section 3).
- Which models return `input_transformations`: S, H and L, under the switch and a
  `block_binding` (piece 41).
- `Authorization: Bearer` beside `x-api-key`: both accepted for the one key used
  (`S/auth-bearer`).
- Chat, on MO and MT and not on OpenAI: no rule about where a `tool` message sits
  (`MO/tool-order-invalid`); `prompt_tokens` includes the cached tokens (piece 34); `system`
  and `developer` both accepted (pieces 4, 5); keep-alive comment lines on MiMo, none on Meta
  (piece 35).
- MiMo: every item of its list but the date of its pages and pi's issue. A signature in the
  stream (empty); a reasoning part sent back without one, with an empty one, with Claude's (all
  accepted, piece 8); `x-api-key`, `anthropic-version`, `anthropic-beta`, `cache_control`,
  `top_k`, `metadata`, `output_config` (all accepted); a `system` role at any position (piece
  5); on chat, usage without `include_usage`, `[DONE]`, `max_tokens`, `reasoning_effort`
  (`none` to `high`), `parallel_tool_calls` (ignored), `reasoning_content` on an assistant
  message (read); the error bodies (piece 36); a token-plan key on the `/anthropic` path of a
  token-plan host (piece 1).

Still open from that list: `model_context_window_exceeded` on Haiku 4.5, an error inside a
stream on any row, and everything about `api.openai.com` itself.

## 3. The gaps

### G008 — what MiMo's Anthropic endpoint really does: answered

It accepts what Claude takes and does little of it. Of 119 requests it rejected five: three
output limits out of range and two keys.

- Address and key: the token-plan host under `/anthropic/v1/messages`; the key in `api-key`,
  `authorization` or `x-api-key`; version and feature-switch headers optional (pieces 1 to 3).
- Instructions: a `system` role at any position, with an effort, a lifetime or neither
  (piece 5).
- Reasoning: on unless `disabled`; a budget is accepted and not checked; the text is always
  returned; the signature is the empty string (pieces 15, 17, 30).
- Reasoning sent back: accepted with its empty signature, without the key, with a Sonnet
  signature, and left out (piece 8). The input count of the tool round is 152 in all four, and
  24 with 128 read when the part is left out, so nothing shows the part being read there. In a
  later turn it is counted: 116 against 93 (`MA/reasoning-outside-keep`, `-omit`).
- Accepted and ignored: `tool_choice: none`, `disable_parallel_tool_use`, `stop_sequences`,
  `display` (pieces 10, 11, 21, 17). Accepted with no effect to see: effort, cache marks, the
  binding control, sampling (pieces 16, 18, 41, 20).
- Caching is implicit, in steps of 128 tokens (piece 18).
- The stream: six event names, no `ping`, `: PROCESSING` lines while waiting, a tool input in
  one fragment (pieces 24, 35, 29). Usage: input, output, and cache read when there is one
  (piece 34).
- Oddities: two shapes of error (piece 36); two shapes of `message.id` (piece 39); a body that
  is not streamed lists its text before its reasoning (piece 26).

pi left this endpoint "after tool rounds with thinking failed". One round does not fail here
in any of its forms (`MA/tool-replay` and its five siblings). Two rounds or more were not
recorded on either endpoint; this is the first capture of section 5.

### G009 — whether Claude accepts cut text with thinking on: answered, yes

`S/cut-text-user` and `H/cut-text-user` (`adaptive`), `L/cut-text-user` (a budget of 1,024) and
`MA/cut-text-user` send the cut text as an assistant turn, then a user turn "Continue.", with
reasoning on. All four are accepted and go on from the next number. The cut text went back as
one complete text part with no trailing whitespace; text that ends in whitespace was not
tried. MO accepts the same and starts over (piece 23).

### G014 — the neutral words for a reasoning level and a cache hint: the evidence, not the words

What each row needs said, from pieces 15 to 18. The words stay the owner's.

| Asked | S | H | L | MA | MO | MT |
|---|---|---|---|---|---|---|
| Reasoning off | `between_tools`, effort `high` or below | `disabled`, effort `high` or below | `disabled` | `disabled` | `thinking: disabled`, or effort `none` | cannot |
| Reasoning on | `adaptive` | `adaptive`, or nothing | `enabled` with a budget of 1,024 or more, under the output limit | `enabled`, or nothing | `enabled`, or nothing | always |
| How much | effort, `low` to `max` | effort, `low` to `max` | the budget | nothing that shows | nothing that shows | effort, `minimal` to `xhigh` |

- So a neutral level is three things: off, on, and an amount. Each must be able to come out
  as "this row cannot": off on MT, the amount on MA and MO. The amount is an ordered word on
  S, H and MT and a number of tokens on L alone.
- The plan's blocks for this piece are "effort, budget, toggle, none" (P04-I01). The fixtures
  show five spellings of the mode (`adaptive`, a budget, `enabled`, `disabled`,
  `between_tools`) and the effort as a second setting beside it, which is what the pieces file
  says.
- For the voice case of D016 on Haiku 5.5, measured on the cache of the instructions:
  switching the mode writes the prefix again (`H/cache-change-thinking`: 1,904 written, 0
  read); an effort added at the top keeps it (`H/cache-change-effort`: 1,903 read); an effort
  carried by an instruction keeps it (`H/cache-inline-effort`: 1,904 read). `adaptive` at
  effort `low` did not reason in its one sample (`H/effort-low`, 0 thinking tokens), so a
  first turn may be made fast without leaving the mode. No capture puts a mark inside the
  conversation and then changes the mode or the effort, so what happens to cached messages is
  not measured (section 5).
- The cache hint. A position and a lifetime are needed by the three Claude rows only. Five
  minutes is measured; one hour was never written (piece 18). The two chat rows cannot take
  OpenAI's explicit marks: MO ignores them and MT rejects `prompt_cache_options`. MiMo and
  Meta cache by themselves and need nothing rendered.

### G015 — signed reasoning when the text above it changes: answered for S, H, L and MA

A tool round whose reasoning part was issued under one system text, sent back under another.

| Row | No control | `error` | `drop_block` | Control without its switch |
|---|---|---|---|---|
| S | accepted, the part kept: 695 input tokens (`S/binding-default-signed`) | 400 (`S/binding-error-signed`) | accepted, 550 input tokens, the drop reported, fresh reasoning (`S/binding-drop-block-signed`) | 400 (`S/binding-no-beta-signed`) |
| H | the same: 774 (`H/binding-default-signed`) | 400 | the same: 550 | 400 |
| L | accepted, 1,633 (`L/binding-default`) | accepted, 1,633, nothing dropped (`L/binding-error`) | accepted, 1,633, nothing dropped (`L/binding-drop-block`) | 400 (`L/binding-no-beta`) |
| MA | accepted (`MA/binding-default`) | accepted (`MA/binding-error`) | accepted (`MA/binding-drop-block`) | accepted (`MA/binding-no-beta`) |

- The 400 under `error`: "messages.1.content.0: Invalid `signature` in `thinking` block. The
  block is bound to a different conversation. Remove the block, or set
  `thinking.block_binding.prefix_mismatch_behavior` to "drop_block". The `system` prompt
  differs from the one this block was created with."
- A changed tool description with no control is accepted and the part kept: 696 and 775 input
  tokens (`S/changed-tools-signed`, `H/changed-tools-signed`).
- On Haiku 4.5 the signature is not bound to the text above it: `error` accepts the changed
  system text.
- Not measured: a changed earlier message; an account created on or after 2026-08-31, for
  which the default is documented as the 400 (D [A6]).

### G006 — where the payload may sit, and replay across turns: what the captures add

- Where it sits. On a reasoning part and nowhere else, one for each part (piece 30). Its three
  states are a signature, the empty string (MA) and nothing (MO, MT). On L it carries account
  identity (D028).
- What a replayed part costs. Its input cost is the reasoning tokens it was issued with, not
  the length of its visible text: 688 against 543 input tokens for a part of 144 thinking
  tokens (`S/tool-replay-signed`, `S/tool-replay-no-reasoning-signed`, `S/tool-seed-signed`);
  767 against 543 for one of 223 on H.
- A payload from another offering. S keeps a part of H (767, `S/cross-model-h-signed`). H
  drops a part of S without a word and reasons again (543, `H/cross-model-s-signed`). MA
  accepts a Sonnet signature in place of its own (`MA/claude-signature`) and a whole Sonnet
  round (`MA/cross-model-s`). Not measured, the captures being defective: L in either
  direction, and MiMo to Claude.
- Reasoning with no payload. Rejected on S, H and L: without the key "Field required", with an
  empty one "Invalid `signature`" (`S/tool-replay-no-signature-signed`,
  `S/tool-replay-empty-signature-signed`, `L/tool-replay-no-signature`,
  `L/cut-thinking-replay`). Accepted on MA.
- A turn that is reasoning only. Accepted on S and H with a whole signed part and on MA
  (piece 23).
- "Never emits an empty turn" needs a second half. Answers with no part exist
  (`S/tool-choice-none`, `L/output-one`, the ten empty answers of MT), and one with reasoning
  and no content (`MO/stop-four`). None was sent back, so what a row does with an empty
  assistant turn is not measured.
- Across turns. A finished turn's reasoning is kept and counted on S (724 against 314), H (144
  against 114) and MA (116 against 93), and stripped by the API on L (137 either way), so
  sending it to L costs nothing and does nothing (`reasoning-outside-keep` and `-omit`; on S
  the `-signed-json-max` pair). Leaving it out is accepted on all four.

### G012 — the provider's stop reason beside the five endings: what the captures add

- The reasons that occur, and those that never did, are in piece 31.
- A reason that reads as completed is not always a completed answer. Meta says `stop` for an
  answer with no content and no usage, ten times, where a limit was most likely used up by
  reasoning; it never said `length`. MiMo's chat endpoint says `stop` for an answer with no
  content when a stop sequence matched inside its reasoning. Claude says `end_turn` with no
  part at all when it may call no tool.
- So the neutral reason needs more than a member for a reason not recognised: it needs to
  tell an answer that holds nothing from one that finished, and that cannot be read from the
  provider's reason on MT and MO.
- No refusal, content filter, pause or context overflow was recorded, so where those belong
  is still decided on documentation alone.
- Today's enum in protocol (`step.boundary.stop.reason.enum`: `interrupted`,
  `tool-call-request`, `normal`, `length`, `content-filter`) has no member for a matched stop
  sequence, which S, H and L report as a reason of its own (`S/stop-one`).

### G018 — what the paper of P02-I02 must settle: what the captures add

- Usage is `disjoint` on the four Anthropic Messages rows and `inclusive` on the two chat
  rows (piece 34), so the uncached input is a subtraction on chat.
- Reasoning is counted inside the output on every row that counts it (`S/effort-max`: 117 with
  72). Four disjoint counts therefore cannot have reasoning as a fifth beside output; it is a
  part of output. Protocol's `TokenUsage` today has `reasoning` beside `output` and does not
  say which of the two it means.
- Which counts a row has:

  | Count | S, H | L | MA | MO | MT |
  |---|---|---|---|---|---|
  | uncached input | yes | yes | yes | prompt less cached | prompt less cached |
  | cache read | yes | yes | only when above 0 | yes | yes |
  | cache write | yes | yes | no | no | no |
  | output | yes | yes | yes | yes | yes |
  | reasoning, inside output | yes | with a budget | no | yes | yes |
  | total | no | no | no | yes | yes |

- Counts that go missing: all of them on a cut chat stream and on an empty answer of MT; the
  output on a cut Anthropic Messages stream, whose input counts arrive in `message_start`.
- Kinds of delta seen: text, reasoning text, payload, a tool call opening (id and name), a
  fragment of tool input. Nothing else arrived in 475 streams.
- What the provider gives to tell parts apart: an index on every part on the four `explicit`
  rows; on chat an index on tool calls only, and the field that is filled for the rest.
- Order of parts: stated by the stream on Anthropic Messages; on chat it is the order of
  arrival, reasoning, text, calls on MO and text, calls on MT. MA's body that is not streamed
  is not in the order of production.
- A tool result must follow its call on the three Claude rows only (piece 14).
- Instructions inside the conversation: by a role on five rows, with a position rule on S and
  H; not at all on L (piece 5). Tool declarations inside the conversation: accepted on S and
  H under a switch, rejected on L, not sent elsewhere.

### G021 — what OpenAI chat cannot say: what the captures add

- Tool choice "none" rendered as a choice works on the three Claude rows only. MA and MO
  accept it and the model calls the tool; MT rejects it (piece 10). On those three rows a
  choice of "none" does not stop a call.
- On Claude the choice does not disturb the cache of the instructions: `S/cache-change-choice`
  still reads 2,503.
- Turning parallel calls off is ignored on MA and MO (piece 11).
- No chat row has a failure flag on a tool result; a failure sent as text is accepted
  (`MO/tool-result-error`, `MT/tool-result-error`).
- Text and tool calls in one answer occur on MT (`MT/choice-auto`) and on Claude
  (`S/parallel-true`); on chat their order is only the order in which the chunks arrive.

## 4. The MiMo endpoint

Under D005 the offering names one format, the one that "covers more features of the endpoint".
On what was recorded that is Anthropic Messages, with one capture owed before the choice is
safe.

What only the Messages endpoint gives:

- Parts with boundaries: every part has a start, a stop and an index (166 parts, piece 26). On
  chat a part is implied.
- The input count of a step that was cut: `message_start` carries it (`MA/cut-text`). A cut
  chat stream has no usage at all (`MO/cut-text`).
- A rejection that says what is wrong: "'max_tokens' 131073 is out of supported range (0,
  131072]" (`MA/output-above-ceiling`). Chat answers "Param Incorrect" with the detail in
  another field, or "Invalid request parameters" with none (piece 36).
- Cut text that is continued: `MA/cut-text-user` goes on from the next number, as does
  `MA/cut-text-prefill-off`. `MO/cut-text-user` and `MO/cut-text-prefill` start over. The two
  pairs use different prompts and one sample each.
- No field of its own. Every field a MiMo request needs is one a Claude row sends, and of the
  Claude fields sent to it the endpoint rejected none (`between_tools` and tool changes inside
  an instruction were not sent). On chat MiMo needs two that neither OpenAI's reference nor
  Meta has: a top-level `thinking` (rejected by MT) and `reasoning_content` in both
  directions.

What only the chat endpoint gives:

- A count of reasoning tokens (`MO/plain-stream`: 12 of 15). MA counts none, so the cost of
  reasoning cannot be told from the output there.
- A second off switch, the effort `none` (`MO/effort-none`).
- A refusal of what it does not support in one place: effort `minimal`, `xhigh` and `max` are
  400, where MA accepts every value and shows no effect.

What is the same on both: reasoning on and off (pieces 15, 28); implicit caching in steps of
128 (piece 18); a `system` role at any position (piece 5); the output limit (piece 19);
`tool_choice: none` and the parallel switch ignored (pieces 10, 11); the keep-alive lines
(piece 35); the 401 body (piece 36); no request id among the stored headers; and a tool round
whose input count does not fall when the reasoning is left out (152 on MA, 161 on MO).

What to keep in mind whichever is chosen:

- A stop sequence must not be sent to chat: one matched inside the reasoning and ended an
  answer with no content (`MO/stop-four`). On Messages it is ignored.
- Slow starts on both. Two chat streams sent keep-alive lines for 120 seconds and nothing
  else (`MO/choice-function`, `MO/top-p-changed`); the slowest Messages stream sent 21 such
  lines and then answered (`MA/tool-choice-tool`). Two of 92 against none of 110 is too few to
  call one endpoint the more reliable.
- On Messages a body that is not streamed is out of order, and `message.id` has two shapes.

What could overturn it: tool rounds with reasoning, two or more in one turn. pi names them as
its reason for leaving the Messages endpoint, and neither endpoint was recorded past one
round. Consequence for the plan if Messages is chosen: the row of P04-I03 is this one, and
P08-I03 has no MiMo row to register, so its measured row is Meta; the 107 chat fixtures of
MiMo remain evidence for the chat blocks.

## 5. What is still unmeasured

### Captures worth making, in order of worth

1. **Two or more tool rounds with reasoning in one turn, then the answer**, on MA and MO
   first, then S, H and L, each with the reasoning sent back and left out. It decides the
   MiMo endpoint (section 4) and whether `absent` is safe in a longer turn (G006).
2. **A cache mark inside the conversation, sent again under a change**, on H and S: the mode
   switched, an effort added at the top, an effort carried by an instruction. Only the cache of
   the instructions was measured, and D016's voice case turns on the cached messages.
3. **Failures that can be provoked**: an unknown slug, a body too large, a prompt past the
   context window, a refusal, on each provider; and whatever 429, 5xx or error inside a stream
   can be caught. Every failure recorded is a 400 or a 401, so the whole of P02-I04 rests on
   documentation.
4. **Replay across models, built in the target's own mode and with `drop_block`**, so the
   answer says what was dropped: L to S, S to L, MA to S, and H and S to each other.
5. **The six Haiku 4.5 cases that were rejected for their output limit**, sent with a limit
   above the budget: reasoning left out of a tool round, an emptied signature, the failure
   flag both ways, cache marks on a call and its result, an instruction after a tool result.
6. **Cuts that were not made**: inside a tool call's input; inside reasoning on S and H,
   before the signature; cut text that ends in whitespace; an answer with no part sent back,
   then a user turn.
7. **A one-hour cache write on a fresh prefix** (S, H, L), and a long prefix sent twice to
   MiMo with and without marks, which is the only way to learn whether a mark does anything
   there.
8. **An instruction whose obedience shows in the answer**, at each accepted position, on all
   six rows; and on S and H an instruction after a user turn and before an assistant turn.
9. **The cases that hold no answer or not their own request**, sent again: `MO/choice-function`,
   `MO/top-p-changed`, `MO/choice-allowed-tools`; the sampling cases of MA and MO that carry no
   sampling field; `cache-last-conflict` without the five-minute mark on the instructions;
   `sampling-combined` on S and H with two values that are each accepted.
10. **What a setting does where it is only accepted**: an effort and a budget on MiMo; a
    changed reasoning text sent back in a tool round on MA; reasoning from an earlier turn kept
    and left out on MO; `between_tools` and `updates` on a turn that has a tool round, which
    is where their text is documented to appear.
11. **Meta's limits**: a ceiling, an answer that ends `length`, and one prompt under a rising
    limit until the answer stops being empty.
12. **Small ones**: `max_tokens: 0` without `stream`; no output limit at all; the undated
    Haiku alias; `strict` on Anthropic Messages; MiMo's pay-as-you-go host with a key of its
    own.

A stream cut in the middle of a frame cannot be asked of a provider. It is a test of the
transport, made by cutting a recorded body.

### Recorded and showing nothing

Seventy-six of the 709 cases show nothing a piece needs. Each is listed in `case-names.json`
with its reason and the case to read in its place.

| Kind | Cases | What they are |
|---|---|---|
| superseded | 26 | first runs on S and H whose tool seed or answer came back without reasoning, so the request carries none; the `-signed` run holds the name |
| duplicate | 19 | the same request as another case of the row, or the same apart from the output limit |
| defective | 18 | the request lacks the thing it is named for, or carries a second setting that was rejected first |
| unanswered | 6 | no response body, or no frame in it |
| outside | 7 | `metadata` and `verbosity`, which the pieces file leaves out |

The defective ones, since a reader of the old names would take them for evidence:

- Rejected for `max_tokens` 768 against a budget of 1,024, before anything else was looked at:
  `L/inline-after-result`, `L/tool-replay-cache`, `L/tool-replay-empty-signature`,
  `L/tool-replay-error`, `L/tool-replay-false`, `L/tool-replay-no-reasoning`.
- Rejected for a reasoning mode copied from the source model: `S/cross-model-l`,
  `S/cross-model-ma`, `L/cross-model-s`.
- Without the field they are named for: `MA/thinking-sampling-top-k`,
  `MA/thinking-sampling-top-p`, `MO/thinking-sampling-top-p`, `MO/choice-allowed-tools`.
- Showing another rule than their own: `cache-last-conflict` on S, H, L and MA, whose own
  marks break the order of lifetimes, so that S, H and L answer with that rule.
- Refused for its key before the other host was tested: `MO/host-api`.
- `S/budget-at-output` and `H/budget-at-output` are not defective but show only that the mode
  is rejected, the budget never being looked at.
