# research-variants — log

## 2026-10-14 01:11 — start

- Resumed with no log and no `## Go` / `## Resume` section in the brief; gate is `none`, so the
  work starts from the beginning.
- Scratch lives under `/var/tmp/research-variants/` (scripts and tabulations, read-only against
  `packages/inference/fixtures`).
- Next: read the context the brief lists (plan, pieces table, synthesis, capture-traffic report
  and notes, migrate.ts), then inventory the fixture tree.

## 2026-10-14 01:16 — context read, index built

- Read: WORKER.md, brief, plan.md (whole), format-pieces (both tables, rules per piece, the
  translations summary, "said neutrally", "left out", "differences", "Unverified"),
  prior-art-synthesis, capture-traffic report.md, provider.notes.json (providers, controls),
  migrate.ts.
- Scratch tools in `/var/tmp/research-variants/`: `lib.ts` (case listing, SSE framing, redaction),
  `view.ts` + `./v <rel> [env|req|res|both|all]` (one case, signatures and long opaque strings
  replaced by their length), `index.ts` + `./run index.ts` → `index.jsonl` (one record per case:
  envelope, request shape, response shape, stream trace). Deno runs with `--no-lock`, read access
  to the fixtures only, write access to the scratch folder only. The index was checked to hold
  no opaque run of 100+ characters, so no signature is in it.
- Tree as found: 709 cases (S 139, H 129, L 116, MA 119, MO 107, MT 99), 707 with a response.
  `sequence.json` still present in every case; `replay` already in `request.json` for 182.
- Next: matrix of case names by offering with status; then piece by piece.

## 2026-10-14 01:35 — findings, group 1 (address, auth, headers, instructions)

Offering tags used below: S Sonnet 5.5, H Haiku 5.5, L Haiku 4.5, MA MiMo on Anthropic Messages,
MO MiMo on OpenAI chat, MT Meta. Case names are today's folder names.

- Tools added: `sum.ts` (`./run sum.ts '<name-regex>' '<tag-regex>' both|req|res|trace|shows`),
  prints request shape and response shape per case from the index.
- The capture tool stores response headers by allow-list (`content-type`, `content-length`,
  `content-encoding`, `date`, `cache-control`, `retry-after`, `request-id`, `x-request-id`,
  `openai-version`, `openai-processing-ms`, and the two rate-limit families); any other header is
  only counted in `excludedHeaders`. So "MiMo sends no request id" is NOT proven: MA/MO have 3-4
  unstored headers each. Request headers stored: `content-type`, `accept`, `accept-encoding`,
  `anthropic-version`, `anthropic-beta`; the key header's name is in `authHeader`.
- Envelope is being tidied under me: `row` and the `*RepeatOf` keys are already gone from
  `request.json`; `replay` is there. Re-run `./run index.ts` before the final tables.
- Address: 6 URLs. Anthropic `api.anthropic.com/v1/messages`; MiMo
  `token-plan-sgp.xiaomimimo.com/anthropic/v1/messages` and `…/v1/chat/completions`; Meta
  `api.meta.ai/v1/chat/completions`. Slugs sent: `claude-sonnet-5-5`, `claude-haiku-5-5`,
  `claude-haiku-4-5-20251001`, `mimo-v2.6-pro`, `muse-spark-1.1`.
- `host-sgp` (MA 06:13, MO 06:43) and MO `host-api` (06:51) are 401 with the key that was later
  replaced; `host-sgp-repeat` (16:46) is 200 on both; MA `host-api` (17:46, after the key change)
  is 401 on `api.xiaomimimo.com`. The key is not in a fixture, so which key is from the ledger
  and G023, the order from the `date` headers. No capture of the working key on the
  pay-as-you-go chat host.
- MiMo 401 body on BOTH endpoints is `{"error":{"message","param","code":"401","type":"invalid_key"}}`
  — OpenAI-like, not Anthropic's `{type:"error",error:{type,message},request_id}`.
- Auth: S/H/L accept `x-api-key` (all cases) and `authorization` (`auth-bearer`, 200). MA accepts
  `api-key` (default), `authorization`, `x-api-key` (200 each). MO accepts `authorization`
  (default) and `api-key` (`auth-api-key`, 200). MT `authorization` only.
- Version/beta: MA default sends NO `anthropic-version` (200 on 116 cases); `version-header`
  and `beta-header` 200. Anthropic `invalid-beta` → 400 `invalid_request_error` "Unexpected
  value(s) `synthetic-invalid-beta` for the `anthropic-beta` header…" on S/H/L.
- Keep-alive: Anthropic sends exactly one `ping` in 211 of 215 streams; MA sends none in 110.
  MiMo sends SSE comment lines `: PROCESSING` about every 5 s while waiting, on BOTH endpoints
  (43 of 110 MA streams, 41 of 92 MO streams). Meta: none in 58 streams.
- MO `choice-function` and `top-p-changed` are byte-identical (same sha256): 23 `: PROCESSING`
  lines, then the capture tool's own 120 s timeout (`read-failed`). They show nothing about tool
  choice or sampling; they show a 200 stream that never produced a data frame.
- Base instructions: Anthropic `system` string and blocks → 200 on S/H/L/MA. Chat: `system` and
  `developer` role first → 200 on MO/MT; developer content as text parts (`instruction-blocks`) 200.
- Instruction inside the conversation, Anthropic S/H: after user at end 200; after a user
  tool_result at end 200; first → 400 "messages.0: use the top-level 'system' parameter for the
  initial system prompt; the directive-only form (content: [] with output_config) is accepted at
  any position"; after assistant and between call and result → 400 "messages.2: role 'system'
  must follow a 'user' message or an 'assistant' message ending in a server tool result; …".
- L: `inline-after-user` → 400 "role 'system' is not supported on this model" (answers the
  Unverified item). Placement errors come first on L (inline-first, after-assistant,
  between-call-result give the placement message). L `inline-after-result` is 400 for an
  unrelated reason: "`max_tokens` must be greater than `thinking.budget_tokens`" (768 vs 1024) —
  CHECK every L replay built on `tool-seed-signed` for this defect.
- MA: system role accepted (200) at all four positions incl. first and between call and result.
  MO/MT: `system` and `developer` accepted at first, after user, after assistant, between call
  and result (200 each). None of these shows the instruction was honoured.
- Inline effort: S/H 200 with beta `mid-conversation-output-config-2026-07-01`, 400
  "messages.1.output_config: Extra inputs are not permitted" without. `inline-effort-off` (thinking
  off, top effort high, inline low, directive last, `content: ""`) is 200 on S and H — the pieces
  table says 400 "effort cannot change when thinking is disabled". L: 400 "This model does not
  support the effort parameter." (top-level) and "output_config.effort requires a model that
  supports per-turn effort; this model does not" (inline only, `cache-inline-effort`).
- `clear-at`: S/H 200 with beta `mid-conversation-system-clear-at-2026-08-21`, 400
  "messages.1.clear_at: Extra inputs are not permitted" without. MA 200 both ways.
- `inline-tools` (beta `inline-tools-2026-09-15`, tool_addition + tool_removal): S/H 200, L 400
  "tool_addition/tool_removal requires a model that supports mid-conversation system content;
  this model does not". Not sent to MA.
- MA stream DOES carry `signature_delta`, with an empty string (to tabulate over all MA streams).
  MA non-stream `plain-default`: content is `[text, thinking]` — text first — and the thinking
  block has `signature: ""` (to verify).
- Next: user/assistant text, reasoning sent back, tools, tool choice, turn order.

## 2026-10-14 02:00 — findings, group 2 (errors, tool rounds, reasoning sent back, binding)

- `errors.tsv` in scratch: all 205 non-200 responses with type and message. Statuses seen in
  the whole tree: 200, 400, 401 only. No 429, 5xx, 529, no `retry-after`, no error inside a stream.
- Error body shapes. Anthropic: `{type:"error",error:{type,message},request_id}` + header
  `request-id`; every 4xx is 400 `invalid_request_error`. MA 400: `{error:{type:
  "invalid_request_error",message}}` (no outer `type`, no `request_id`). MiMo 401, both
  endpoints: `{error:{message,param,code:"401",type:"invalid_key"}}`. MO 400: `{error:{code:
  "400",message:"Param Incorrect"|"Invalid request parameters",param:"<the detail>"|"",type:
  ""|"Bad Request"|"BadRequestError"}}` — the detail is in `param`, `type` is unreliable. MT 400:
  `{error:{code:null,message,param:"<field>",type:"invalid_request_error"}}` + `x-request-id`.
- DEFECTIVE CAPTURES (rejected for a reason other than the one the case is named for):
  - L, six cases 400 "`max_tokens` must be greater than `thinking.budget_tokens`" (768 against a
    budget of 1024): `inline-after-result`, `tool-replay-cache`, `tool-replay-empty-signature`,
    `tool-replay-error`, `tool-replay-false`, `tool-replay-no-reasoning`. They show what
    `budget-at-output` shows and nothing else.
  - S `cross-model-l`, S `cross-model-ma`: 400 "\"thinking.type.enabled\" is not supported for
    this model" — the request copied the source's `thinking`. L `cross-model-s`: 400 "adaptive
    thinking is not supported on this model", same cause. None shows what a cross-model replay
    does. The capture report's "Sonnet continuation from a MiMo Messages seed returned 400" is
    this defect, not a finding.
  - S `budget-at-output`: 400 for `thinking.type.enabled`, not for the budget.
  - S/H/L `output-above-ceiling`: status 400 stored with an empty body (stream cancelled);
    `output-above-ceiling-repeat` has the message.
- All tool seeds are non-streamed JSON. S/H `tool-seed` has NO thinking block (the model did not
  think); `tool-seed-signed` has thinking + signature (S 1052, H 1216, L 1512 chars; L also has a
  text block between thinking and tool_use). L `tool-seed` and `tool-seed-diagnostic` have no
  response file. Anthropic `tool_use` blocks carry `caller:{type:"direct"}` and replays send it back.
- MA non-stream thinking block is `{type:"thinking",thinking,signature:""}` (key present, empty).
  MA non-stream content order is `[text, thinking]` (text FIRST) in `plain-default` and
  `reasoning-json`, `[thinking, tool_use]` in `tool-seed`; its stream order is thinking then text.
  MA tool ids are `call_…`, response id is `<uuid>_<hex>`.
- Signed thinking sent back in a tool round: S/H `tool-replay-signed` 200, L `tool-replay` 200
  (L's `tool-replay` IS the signed one, built on `tool-seed-signed`).
- Signature mutations: S/H empty signature → 400 "messages.1.content.0: Invalid `signature` in
  `thinking` block"; no signature key → 400 "messages.1.content.0.thinking.signature: Field
  required" (S/H/L). L empty signature: defective, unmeasured; but L `cut-thinking-replay` is 400
  "Invalid `signature` in `thinking` block". MA: no key 200, empty 200, a Sonnet signature
  (`claude-signature`) 200.
- Thinking block dropped from the tool round (`tool-replay-no-reasoning-signed`): 200 on S and H,
  and the model thinks again. The table says "Required: within a tool-use turn, pass thinking
  blocks back". L: defective, unmeasured.
- Cross-model, well-formed: S reading H's signed block (`cross-model-h-signed`) 200; H reading
  S's (`cross-model-s-signed`) 200; MA reading S's signed block with `toolu_` id, `caller`,
  `thinking: adaptive` and `output_config.effort` (`cross-model-s`) 200. Whether the block was
  read or dropped is not shown (no binding beta on those requests).
- G015, system text changed under a signed block. S/H: default 200 and the block is still
  counted (input 695 vs 550 when dropped on S; 774 vs 550 on H); `error` → 400 "…The block is
  bound to a different conversation. … The `system` prompt differs from the one this block was
  created with."; `drop_block` → 200 with `message_start.message.input_transformations:
  [{type:"thinking_dropped",path:"messages.1.content.0",reason:"prefix_binding_mismatch"}]` and a
  fresh thinking block; no beta → 400 "thinking.adaptive.block_binding: Extra inputs are not
  permitted". Changed tool description, default → 200 (696 / 775).
- L: default, `error` and `drop_block` all 200 with the same 1633 input tokens and
  `input_transformations: []` — Haiku 4.5's signature is not bound to the system text, and L does
  return `input_transformations` under the beta. No beta → 400 "thinking.enabled.block_binding:
  Extra inputs are not permitted".
- MA: all binding cases 200, no `input_transformations`. MA `binding-error` reports
  `cache_read_input_tokens: 128` with `input_tokens: 28` and NO cache mark in the request (the
  siblings report 156 input): implicit caching on MA, counts disjoint.
- Unsigned `binding-*`, `changed-tools`, `cross-model-h`, S/H `cross-model-s`, `tool-replay`,
  `tool-replay-no-reasoning` on S/H carry no thinking block: they show a plain tool round.
- Next: reasoning-outside, cut-*, chat reasoning replay, tools, tool choice, parallel.

## 2026-10-14 02:25 — findings, group 3 (reasoning across turns, cut output, chat replay)

- Reasoning kept in an earlier turn (`reasoning-outside-keep` vs `-omit`, input tokens): H 144 vs
  114 (block counted); S `…-signed-json-max` 724 vs 314 (counted); L 137 vs 137 (NOT counted: the
  API strips an earlier turn's thinking on Haiku 4.5); MA 116 vs 93 (counted). S
  `reasoning-outside-keep`, `-keep-signed`, `-omit`, `-omit-signed` have no thinking block in the
  source (`reasoning-json` and `reasoning-json-signed` on S came back without one), so keep = omit
  there: 156 = 156, 461 = 461.
- Thinking block in a tool round, input tokens: S 688 with / 543 without; H 767 / 543. S reading
  H's block (`cross-model-h-signed`) 767: counted, so read. H reading S's block
  (`cross-model-s-signed`) 543: NOT counted, dropped without an error, and H thinks again.
- MA tool round: 152 with the thinking block, with `signature:""`, without the key, and with a
  Sonnet signature; and 24 + 128 cache read = 152 with the block removed. MO tool round,
  `prompt_tokens`: 161 with the original `reasoning_content`, 161 omitted, 161 with `""`, 153 with
  a different 25-char string. So the field is read (the count moves with its content); a missing
  one costs the same as the original, which fits the server restoring reasoning it issued for
  that tool call — a reading, not shown.
- MT accepts `reasoning_content` on an assistant message: prompt 640 without or empty, 651 with a
  25-char string. Meta returns no reasoning text itself (only `reasoning_tokens`).
- Chat tool result: content as text parts 200 (MO, MT); an error is a plain string. Chat
  `tool-order-invalid` (a user message between the call and its tool message) is 200 on MO and MT;
  on S/H/L it is 400 "messages.2: `tool_use` ids were found without `tool_result` blocks
  immediately after: toolu_…", on MA 200.
- G009 answered: `cut-text-user` (partial text as a complete text block, then user "Continue.",
  thinking ON) is 200 on S, H (adaptive), L and MA (enabled, budget 1024). MO 200.
- Prefill (`cut-text-prefill-off` / `-on`, last message is the partial assistant text): S/H 400
  "This model does not support assistant message prefill. The conversation must end with a user
  message." L 200 with thinking off AND with thinking on (budget 1024): the table says "not with
  thinking on"; the response then has no thinking block and continues exactly ("\n15\n16…"). MA 200
  both (continues at "2"). MO `cut-text-prefill` 200 but the answer starts over, repeating "1 f".
- What the cut cases really are: S `cut-thinking` is a complete, uncut answer with no thinking.
  H `cut-thinking` and S `cut-thinking-signed` were cut AFTER the thinking block closed with its
  signature, inside the text. Only L and MA `cut-thinking` were cut inside thinking (no
  signature, block not closed). A cut stream has no `message_delta` and no `message_stop`.
- `cut-thinking-replay`: an assistant turn holding only a thinking block, then a user turn. H 200
  and S (`-signed`) 200 with the complete signed block; L 400 "messages.1.content.0: Invalid
  `signature` in `thinking` block" with the cut block and `signature:""`; MA 200.
- MO `cut-reasoning` cut inside `reasoning_content`; MT `cut-reasoning` was cut inside content
  (Meta streams no reasoning). MO `cut-reasoning-replay` (assistant `content:""` +
  partial `reasoning_content`, then user) 200.
- MT `cut-text` and MT `empty-text` are COMPLETE streams whose only chunk is `{delta:{},
  finish_reason:"stop"}` then `[DONE]`: an empty answer, no role, no content, no usage although
  `include_usage` was true.
- Next: tools, tool choice, parallel, strict, eager; then reasoning request settings, effort,
  display; cache; output limit; sampling; stop; stream switch; then the response pieces.

## 2026-10-14 02:55 — findings, group 4 (tool choice, parallel, strict, thinking, effort, display, cache)

- Tool choice, Anthropic format. `auto` 200 everywhere. `none`: S/H/L 200 with NO content block
  at all (`message_start message_delta message_stop`, `end_turn`, no ping) although the prompt
  demands the tool: honoured. MA `none`: 200 and the model calls the tool: not honoured. `any` /
  `tool`: S 400 "tool_choice: type \"tool\" and \"any\" are not supported for this model."; H 200
  with thinking off and with adaptive; L 200 with thinking off, 400 "Thinking may not be enabled
  when tool_choice forces tool use." with a budget; MA 200 (cannot be told from `auto`: the
  prompt asks for the tool anyway).
- Tool choice, chat. MT: only `"auto"`; `none`, `required`, a named function, `allowed_tools`,
  `custom` → 400 "only `\"auto\"` is supported for `tool_choice`…" (`param: tool_choice`). MO:
  `none` 200 and the model calls the tool (not honoured); `required` and `allowed_tools`
  (required) 200; `custom` 400 "`function` is not set"; `choice-function` has no data
  (read-failed). MO `choice-allowed-tools` was sent with NO `tools` and NO `tool_choice` although
  its `fixture.json` says otherwise: defective.
- Parallel. NAME INVERSION: on S/H/L/MA `parallel-true` sends `disable_parallel_tool_use: true`
  (one call) and `parallel-false` sends `false` (several); on MO/MT `parallel-true` is
  `parallel_tool_calls: true` (several). Honoured on S/H/L (1 call vs 2) and MT (1 vs 2); NOT on
  MA and MO (2 calls either way).
- Strict (chat only): MO accepts `strict` true/false and an invalid strict schema (200); MT 200
  for true/false, 400 "'additionalProperties' is required to be supplied and to be false." for
  the invalid one. `eager_input_streaming` true/false: 200 on S/H/L/MA, stream shape identical.
- Tool call in the stream. Anthropic: `content_block_start{tool_use,id,name,input:{}}`, then 3
  `input_json_delta`, the first `""`. MA: one fragment with the whole JSON. MO: every fragment
  has `{index,id,function:{arguments,name},type}`, `id` and `name` set on the first (with
  `arguments:""`) and `null` after. MT: first `{index,id,type,function:{name,arguments:""}}`,
  then `{index,function:{arguments}}` with the whole JSON. MT sends text and then tool calls in
  one answer.
- MO delta always carries `content, role, tool_calls, reasoning_content` with nulls; finish chunk
  has `usage:null`; then a `choices:[]` chunk with usage; `created` can change inside one
  stream. MT deltas are sparse; role and first content share the first chunk; `usage` rides on
  the finish chunk (choices not empty), no separate usage chunk.
- Asking for reasoning, measured: S `adaptive` 200, `between_tools` 200, `disabled` 400,
  `enabled` 400; H `adaptive` 200, `disabled` 200, `between_tools` 400, `enabled` 400; L
  `enabled`+budget 200, `disabled` 200, `adaptive` 400, `between_tools` 400; budget 1023 → 400
  schema error on all three; budget = max_tokens → 400 on L. MA accepts everything incl. budget
  1023 and budget = max_tokens. MA misnamed: `thinking-adaptive` sends `enabled`,
  `thinking-between-tools` sends no `thinking` (default on), `between-tools-display` sends
  `disabled`+display. Chat: MO top-level `thinking:{type}` on/off honoured (reasoning_tokens 0
  and no `reasoning_content` when disabled); MT 400 "unknown parameter `thinking`".
- Effort. S/H all five values 200; thinking tokens rise with it (S 0,0,0,28,72; H 0,31,56,50,75).
  L every value 400 "This model does not support the effort parameter." MA all 200, no visible
  effect. Off + xhigh/max: S/H 400. Chat: MO `none` 200 and reasoning off (0 tokens), low/medium/
  high 200, minimal/xhigh/max 400 "Invalid request parameters"; MT minimal..xhigh 200 (reasoning
  tokens 172,158,285,570,410), `max` 400, `none` 400.
- Display. H default omitted (empty thinking_delta + signature), `summarized` returns text;
  S default omitted (seen in `cut-text-user`), summarized returns text (signed cases); L default
  summarized, `omitted` honoured; `updates` needs beta `thinking-display-updates-2026-08-18`.
  MA and MO ignore `display` (text always returned). display with `disabled`/`between_tools` 400
  on S/H/L.
- Cache, Anthropic. Write measured (`cache-5m-write`: 2503 / 1903 / 5042 with
  `ephemeral_5m_input_tokens` equal), read measured (`cache-5m-read`). `cache-1h-write` and
  `cache-1h-read` are both READS of the 5m entry (write 0): NO fixture has a 1h write
  (`ephemeral_1h_input_tokens` is 0 in all 709). Below the minimum prefix: 200, no write, no read
  (`cache-short`). Fifth mark → 400 "A maximum of 4 blocks with cache_control may be provided.
  Found 5." (also for four plus top-level). Empty block → 400. 1h after 5m → 400 ordering
  message; `cache-last-conflict` gets the same ordering message, so it does not isolate its case.
  Mark on a thinking block → 400 "…thinking.cache_control: Extra inputs are not permitted".
- Cache invalidation on S/H/L, mark on the system block: thinking setting changed
  (`cache-change-thinking`) → write again, read 0 (2504 vs 2503: one token more); tool_choice
  changed → still read; top-level effort added (S/H) → still read; effort carried inline
  (`cache-inline-effort`) → read 2504, the entry written under the changed thinking.
- MiMo caches implicitly on both endpoints, in multiples of 128 tokens, with or without marks:
  MA reads 128 with no mark in `binding-error`, `tool-replay-error`, `tool-replay-no-reasoning`;
  1664 in the marked cases; MO 1152 with any or no cache field. MA `input_tokens` excludes the
  read (1753 → 89 + 1664); MO `prompt_tokens` includes it (1206 with cached 0 and 1152). MA never
  reports a write count. MA accepts 5 marks, 4+top, empty, 1h-after-5m (200 each).
- MT: `prompt_cache_options` → 400 "unknown parameter"; `prompt_cache_key` and
  `prompt_cache_retention` 200 but those five answers are EMPTY (no content, no usage). Meta's
  own implicit caching shows in tool cases (`cached_tokens` 497 / 625, no cache field sent);
  `prompt_tokens` includes it. Seven MT cases in all are empty answers.
- Next: output limit, sampling, stop sequences, stream switch; then response pieces across all
  streams (usage keys, stop reasons, frames, ids, headers, rate limits).

## 2026-10-14 03:25 — findings, group 5 (output limit, sampling, stop, stream switch, response shapes)

- Added `resp.ts` (`./run resp.ts > resp.out`): aggregates of every response shape per offering.
- Output limit. S/H ceiling 128000, L 64000 ("max_tokens: 128001 > 128000, which is the maximum
  allowed number of output tokens for claude-sonnet-5-5", from `output-above-ceiling-repeat`).
  -1 → 400 "max_tokens: must be greater than or equal to 0"; 0 → 400 "stream cannot be true when
  max_tokens is 0" (0 without stream not captured); 1 → 200 `max_tokens` (L with no content
  block). MA range (0, 131072], 0 and -1 400. MO `max_completion_tokens` 1..131072, legacy
  `max_tokens` 200, both 200, limit 1 → `finish_reason: length`. MT `max_completion_tokens` ≥ 1,
  legacy `max_tokens` 200, both → 400 "mutually exclusive".
- MT EMPTY ANSWERS: 10 complete streams whose only chunk is `{delta:{},finish_reason:"stop"}`,
  no usage: `output-one` (limit 1), the five 200 `cache-*` (limit 64), `empty-text`,
  `frequency-penalty`, `sampling-combined` (256), `cut-text` (768). No non-empty MT answer
  exceeds its limit (max completion 236 of 256, 717 of 768). Reading: Meta's hidden reasoning
  used up the limit and it reports `stop`, never `length`. Shown for limit 1 and 64; a reading
  for the rest.
- Sampling. S/H: `temperature:1` 200, `0` → 400 "`temperature` is deprecated for this model.";
  `top_p:0.99` 200 but `top_p:1` and `0.5` → 400 "`top_p` is deprecated for this model." (the
  table says 0.99 or more is accepted); `top_k` → 400 "`top_k` is deprecated…"; with thinking on,
  the three "…when thinking is enabled or in adaptive mode" messages. L: all accepted with
  thinking off, but `temperature` with `top_p` → 400 "`temperature` and `top_p` cannot both be
  specified for this model. Please use only one."; with a budget: temperature 0, top_k, top_p
  0.5 → 400, top_p 0.95 → 200. MA and MO accept everything sent; MO returns no `logprobs`. MT:
  temperature, top_p, penalties, seed 200; `logit_bias`, `logprobs`, `n:2`, `verbosity` 400.
  Defective: MA `thinking-sampling-top-k`, MA and MO `thinking-sampling-top-p` carry no sampling
  field; MO `top-p-changed` has no data.
- Stop sequences. S/H/L honoured: text "OK ", `stop_reason: stop_sequence`, `stop_sequence:
  "END"`. MA NOT honoured: text "OK END EXTRA", `end_turn`, no `stop_sequence` key. MO: "END"
  did not stop the output in three captures; with four sequences the letter "A" matched inside
  `reasoning_content` and the answer ended with no content and `finish_reason: stop`; five → 400
  "stop supports at most 4 sequences". MT: `stop` → 400 "`stop` is not supported".
- Stream switch. No `stream` → JSON on all six. Chat: usage arrives with `stream:true` alone and
  with `include_usage:false` on MO and MT (the table says only when asked). `include_obfuscation`
  ignored. `stream_options` with `stream:false`: MO 200, MT 400.
- Headers stored. Anthropic: `request-id` always; 12 `anthropic-ratelimit-*` on 200 only, none on
  400. MT: `x-request-id` always; `x-ratelimit-{limit,remaining}-{requests,tokens}` on 200 only
  (no `reset`). MiMo: neither a request id nor a rate header under the stored names. All bodies
  LF only; every stream, cut ones too, ends on a frame boundary (no partial frame captured).
- Anthropic stream. Events: message_start, content_block_start/delta/stop, message_delta,
  message_stop, ping; `event:` always equals `data.type`; exactly one ping, right after the
  first content_block_start (none when there is no block); exactly one message_delta; no unknown
  event, no error event in 325 streams. message_start.message keys: model, id, type, role,
  content, container, stop_reason, stop_sequence, stop_details, usage, diagnostics
  (+ input_transformations). Usage in message_start: input_tokens, cache_creation_input_tokens,
  cache_read_input_tokens, cache_creation.{5m,1h}, output_tokens, service_tier, inference_geo;
  in message_delta: input_tokens, cache_creation_input_tokens, cache_read_input_tokens,
  output_tokens, output_tokens_details.thinking_tokens (on L only when thinking is on).
  `inference_geo` is "global" on S/H, "not_available" on L.
- MA stream: six event names, no ping; message keys id, type, role, model, content, usage; usage
  `input_tokens`, `output_tokens` (+ `cache_read_input_tokens` when there is a read);
  message_delta.delta has only `stop_reason`. Stream id is `msg_` + 24 chars, non-stream id is
  `<uuid>_<hex32>`.
- Thinking in the stream: block opens `{thinking:"",signature:""}`; one `signature_delta` after
  the thinking_deltas, non-empty on S/H/L (39 blocks), empty string on MA (54 of 54); omitted
  text is one empty `thinking_delta`. No `redacted_thinking` anywhere.
- Stop reasons seen: S/H/L end_turn, tool_use, stop_sequence, max_tokens; MA end_turn, tool_use,
  max_tokens; MO stop, tool_calls, length; MT stop, tool_calls. `stop_details` always null.
  Never seen: refusal, pause_turn, model_context_window_exceeded, content_filter,
  repetition_truncation.
- Chat stream. `[DONE]` ends every complete stream on MO and MT. Chunk keys id, choices,
  created, model, object, usage; no system_fingerprint. MO `created` takes up to 18 values in
  one stream. MT non-stream message has `refusal:null` and choices carry `logprobs`.
- Next: tool result flags, remaining signed siblings, then assign every case a piece and a
  variant and write the research file.

## 2026-10-14 04:05 — naming scheme settled, mapping drafted

- Verified: Meta reasons in every answer that carries usage (50 of 50); the capture tool sends
  `Bearer <key>` for `authorization` and the bare key otherwise (`tooling/capture.ts:1173`; the
  scheme is not on disk); every request carries an output limit; `input_tokens` is the same in
  `message_start` and `message_delta`; `output_tokens` includes thinking tokens.
- `dups.ts` lists identical requests per offering (e.g. `cut-thinking = display-summarized =
  reasoning-stream` on S/H/L/MA; `plain-stream = system-string`; MA `thinking-between-tools =
  thinking-sampling-top-k = thinking-sampling-top-p`; MO `host-sgp = host-sgp-repeat`).
- Naming scheme for `case-names.json`: folder = `<piece>-<variant>`. A piece is ONE word (41
  words, so the first word of a folder always names the piece). A variant is one term in
  kebab-case: a single word where the idea has one, the wire name where a wire field is what
  varies (`top-p-changed`), and a second word when the case varies a second thing
  (`choice-required-reasoning`). The name says what the request does (the stimulus), so one
  stimulus has one name on every model; the outcome per model is a field of the entry.
- Piece words. Request: address, authentication, version, instructions, inline, user, assistant,
  replay, declaration, choice, parallel, call, result, order, mode, effort, display, cache,
  limit, sampling, stop, stream, cut. Response: framing, open, boundary, text, reasoning, tool,
  payload, cause, match, refusal, usage, heartbeat, rejection, fault, end, provenance, quota,
  alteration.
- A case gets no name ("shows nothing a piece needs") when: its request lacks the thing it was
  named for (S/H first runs without a thinking block; MA/MO sampling cases with no sampling
  field; MO `choice-allowed-tools` with no tools); it was rejected for an unintended second
  setting (the six L budget defects, the three cross-model defects, `cache-last-conflict`); it
  repeats another case of the offering with the same outcome; it has no response or no data;
  or it belongs to a piece the table leaves out (`metadata`, `verbosity-*`).
- Where a `-signed` rerun exists it takes the name and the first run is the superseded one,
  except where the first run shows something of its own (`tool-seed` → tool-json, `tool-replay`
  → result-string, `cross-model-h` → call-foreign, `binding-drop-block` → alteration-empty).
- Next: write `names.ts` (mapping + validation) → `case-names.json`; then the research file.

## 2026-10-14 04:30 — case-names.json written

- `names.ts` in scratch holds the mapping (old name → piece, variant, per offering) and checks:
  every case mapped, no two cases of an offering with one name, every variant term defined and
  used, every `see` pointing at a name that exists on the same offering. It writes
  `case-names.json`; copied to the task folder.
- Result: 709 cases, 633 named, 76 with no name (26 superseded, 20 duplicate, 17 defective,
  6 unanswered, 7 outside the table). 171 distinct names; 147 cases keep today's name. 29 of the
  41 piece words occur in a name. 51 of the 171 variant terms have more than one word (wire
  names such as `top-p-changed`, booleans such as `strict-true`, a second thing varied such as
  `choice-required-reasoning`): flag for the owner against "each variant one word".
- Each entry: `path`, `was`, `piece`, `variant`, `name`, `outcome` (status and stop reason or the
  provider's message, generated from the fixture), and for an unnamed case `nothing`, `see`, `why`.
- Next: write `journal/features/inference/research/variants-per-piece-2026-10-14.md`, then
  `report.md`, then `pnpm orchestra done research-variants`.

## 2026-10-14 05:05 — STATE FOR RESTART (asked by the orchestrator at 60 percent of context)

### Done

- `case-names.json` in the task folder: complete (709 cases, 633 named, 76 unnamed). Generated
  by `/var/tmp/research-variants/names.ts`; rerun with `cd /var/tmp/research-variants && ./run
  names.ts && cp case-names.json <task folder>/`. One small thing still to add there: a
  top-level `"root": "packages/inference/fixtures"` so `path` is self-explaining.
- Research file `journal/features/inference/research/variants-per-piece-2026-10-14.md`: WRITTEN
  THROUGH PIECE 14 OF 41 (303 lines). It holds the frontmatter, "How to read it" (rows and
  prefixes, the marks M/D/A, the four outcome words accepted/honoured/ignored/rejected, what a
  fixture cannot show, how it was read) and section 1 for the request pieces 1 to 14 — address,
  authentication, version, instructions, inline, user, assistant, replay, declaration, choice,
  parallel, call, result, order — each with all six rows (S, H, L, MA, MO, MT) and a proof per
  cell. It carries an "In progress" note under the title that must be REMOVED when the file is
  whole. The same text is `/var/tmp/research-variants/part1.md` (`part1.marked.md` has the note).
  `origin` links only the plan and the pieces file; the capture report is named in prose.
- Not written: research pieces 15 to 41, sections 2 to 5, `report.md`. `done` not run.

### Scripts under `/var/tmp/research-variants/` (all read-only on the fixtures)

- `./run <script.ts> [args]` — runs Deno with `--no-lock`, read access to the fixtures and the
  feature folder, write access to the scratch folder only.
- `index.ts` → `index.jsonl`, one record per case: `env` (url, authHeader, headers, replay,
  cut), `shows`, `req` (keys, system, tools, messages by block with signature LENGTHS only,
  `settings` = every other body field), `res` (status, stored header names, transport state,
  and for a stream `sse.trace`, blocks, usage of both frames, finishes, calls; for JSON the
  parts, stop reason, usage or the error). Rebuild first: the envelopes were being tidied.
- `./v <format/provider/model/case> [env|req|res|both|all] [maxchars]` — one case, signatures
  and long opaque strings replaced by their length. The only safe way to look at a body.
- `sum.ts '<name-regex>' '<tag-regex>' both|req|res|trace|shows` — request shape and response
  shape per case, grouped by case name, rows tagged S H L MA MO MT.
- `resp.ts` → `resp.out`: aggregates per row of every response shape (event names, pings,
  message_start keys, usage keys of both frames, stop reasons, block order, thinking/signature
  counts, tool fragments, chat chunk and delta keys, finish reasons, usage chunks, error bodies).
- `dups.ts` — identical requests per offering, and those identical apart from the output limit.
- `errors.tsv` — the 205 non-200 answers: row, case, status, type | message | param.
- `matrix.tsv` — case × row with status. `names.ts` — the mapping and its checks.

### What remains, in order

1. Append pieces 15 to 23 to the research file (cells below).
2. Append pieces 24 to 41 (cells below).
3. Write section 2 (contradictions), 3 (gaps), 4 (the MiMo endpoint), 5 (unmeasured and the
   captures worth making, with the list of defective captures).
4. Remove the "In progress" note. Add `root` to `case-names.json`.
5. Write `report.md` (WORKER.md format; end with Names and asymmetries, below).
6. `pnpm orchestra done research-variants`.

### Cells for pieces 15 to 23 (row: takes | proof). M unless marked

15 `mode` (asking for reasoning). Variants adaptive, budget, disabled, between-tools, enabled
(a toggle with no budget), absent.
- S: on `adaptive`, off `between-tools` | `S/thinking-adaptive`, `S/thinking-between-tools` 200;
  `S/thinking-disabled` 400 "To turn thinking off on this model, send "thinking": {"type":
  "between_tools"} instead of {"type": "disabled"}. …"; `S/thinking-enabled` 400
  ""thinking.type.enabled" is not supported for this model. Use "thinking.type.adaptive" and
  "output_config.effort" to control thinking behavior."; absent accepted `S/plain-default`, that
  it means adaptive is D [A12].
- H: on `adaptive`, off `disabled` | `H/thinking-adaptive`, `H/thinking-disabled` 200;
  `H/thinking-between-tools` 400 ""thinking.type.between_tools" is not supported for this
  model."; `H/thinking-enabled` 400.
- L: on `budget`, off `disabled` | `L/thinking-enabled`, `L/thinking-disabled` 200;
  `L/thinking-adaptive` 400 "adaptive thinking is not supported on this model";
  `L/thinking-between-tools` 400; budget 1,023 `L/budget-too-small` 400
  "thinking.enabled.budget_tokens: Input should be greater than or equal to 1024" (the same
  schema message on S and H); budget = max_tokens `L/budget-at-output` 400 "`max_tokens` must be
  greater than `thinking.budget_tokens`. …"; absent = no reasoning `L/plain-default`, D [A12].
- MA: on `budget` or absent, off `disabled` | `MA/thinking-enabled` (reasoning), `MA/plain-default`
  (reasoning with no setting), `MA/thinking-disabled` (none); budget not checked:
  `MA/budget-too-small`, `MA/budget-at-output` 200; `adaptive` accepted `MA/cross-model-s`.
- MO: on absent or `enabled`, off `disabled` (a top-level `thinking` field) | `MO/plain-stream`,
  `MO/thinking-enabled`; `MO/thinking-disabled` 0 reasoning tokens and no reasoning text; also
  off through effort `none`, `MO/effort-none`.
- MT: always on, no off | 50 of 50 answers with usage count reasoning tokens;
  `MT/thinking-disabled` 400 "unknown parameter `thinking`"; `MT/effort-none` 400.

16 `effort`.
- S: low..max; with reasoning off only up to high | `S/effort-low`…`-max` 200, thinking tokens
  0, 0, 0, 28, 72; `S/off-effort-xhigh`, `S/off-effort-max` 400 "output_config.effort 'xhigh' is
  not supported when thinking is disabled on this model. Use effort 'high' or below, or enable
  thinking."
- H: the same | thinking tokens 0, 31, 56, 50, 75; `H/off-effort-*` 400.
- L: none | `L/effort-low`… 400 "This model does not support the effort parameter."
- MA: accepted, effect not shown | `MA/effort-low`…`-max`, `MA/off-effort-max` 200.
- MO: none (reasoning off), low, medium, high | 200; `MO/effort-minimal`, `-xhigh`, `-max` 400
  "Invalid request parameters".
- MT: minimal..xhigh | 200, reasoning tokens 172, 158, 285, 570, 410; `MT/effort-max` 400
  "reasoning_effort 'max' is not supported for model 'muse-spark-1.1'. Supported values:
  [minimal, low, medium, high, xhigh]"; `MT/effort-none` 400 ""reasoning_effort" does not
  support "none" with this model."

17 `display`.
- S: default omitted, `summarized` returns text | `S/cut-text-user` (no setting: one empty
  thinking_delta then a signature), `S/reasoning-stream-signed` (text); `omitted`, `updates`
  accepted, their answers hold no reasoning: `S/display-omitted`, `S/display-updates`.
- H: default omitted; summarized and omitted honoured | `H/thinking-adaptive`,
  `H/display-summarized`, `H/display-omitted`; updates accepted `H/display-updates`.
- L: default summarized; omitted honoured | `L/thinking-enabled` (text), `L/display-omitted`
  (empty), `L/display-summarized`; updates accepted with the switch `L/display-updates`.
- MA: none, text always returned | `MA/display-omitted` returns text.
- MO: none, text always returned | `MO/reasoning-display-omitted` returns reasoning_content.
- MT: none, no reasoning text at all | `MT/reasoning-display-omitted` 400 "unknown parameter
  `thinking`".
- S/H/L: a display with reasoning off is 400, `S/display-disabled` "thinking.disabled.display:
  Extra inputs are not permitted", `S/between-tools-display` "thinking.between_tools.display: …".

18 `cache`. Variants `marks`, `implicit`.
- S: marks | write `S/cache-5m-write` 2,503 written (ephemeral_5m equal), read `S/cache-5m-read`.
- H: marks | 1,903. L: marks | 5,042.
- MA: implicit; marks accepted | reads with NO mark `MA/binding-error`, `MA/tool-replay-error`,
  `MA/tool-replay-no-reasoning` (128 each); with marks `MA/cache-5m-read` 1,664; nothing
  separates the two; 5 marks, 4+top, empty, 1h-after-5m all 200.
- MO: implicit; cache fields accepted | `MO/cache-no-options-read` 1,152 cached with no cache
  field; the same 1,152 with every field (`MO/cache-explicit-no-mark`, `MO/cache-key`,
  `MO/cache-retention-24h`, `MO/cache-invalid-ttl`); `MO/cache-implicit-write` is the first
  sight (0).
- MT: implicit; `prompt_cache_options` rejected | `MT/choice-auto` 497 of 550 prompt tokens
  cached with no cache field (`MT/tool-seed` 550 with 0); `MT/cache-explicit-write` 400 "unknown
  parameter `prompt_cache_options`"; `MT/cache-key`, `MT/cache-retention-24h` 200, empty answers.
- Rules of marks on S/H/L, each M: at most four, `S/cache-five` and `S/cache-four-plus-top` 400
  "A maximum of 4 blocks with cache_control may be provided. Found 5."; four ok `S/cache-four`;
  top-level mark stands for the last part `S/cache-top-level` (82 written, 2,503 read); empty
  part `S/cache-empty` 400 "system.0: cache_control cannot be set for empty text blocks"; too
  short `S/cache-short` 200 with 0 written and 0 read; longer lifetime first `S/cache-mixed-valid`
  200, shorter first `S/cache-mixed-invalid` 400 "…a ttl='1h' cache_control block must not come
  after a ttl='5m' cache_control block. …"; on a tool `S/cache-tool`, user turn `S/cache-user`,
  assistant turn `S/cache-assistant`, tool call and result `S/tool-replay-cache-signed` 200; on
  replayed reasoning `S/cache-thinking-signed` 400 "messages.1.content.0.thinking.cache_control:
  Extra inputs are not permitted" (L: `L/cache-thinking`).
- Lifetimes: 5m written and read. 1h: `S/cache-1h-write` is a READ of the 5m entry (0 written);
  no fixture has `ephemeral_1h_input_tokens` above 0. So a 1h write is unmeasured, and a 1h mark
  reads an entry written at 5m.
- What invalidates (mark on the system block): another reasoning mode `S/cache-change-thinking`
  (written again 2,504, read 0; H 1,904; L 5,042); NOT another tool choice
  `S/cache-change-choice` (read 2,503); NOT an effort added `S/cache-change-effort` (read 2,503;
  H 1,903; L rejects effort); NOT an effort carried by an instruction `S/cache-inline-effort`
  (read 2,504, the entry written under the changed mode).

19 `limit`.
- S: `max_tokens`, ceiling 128,000 | `S/output-above-ceiling-repeat` "max_tokens: 128001 >
  128000, which is the maximum allowed number of output tokens for claude-sonnet-5-5";
  `S/output-negative` "max_tokens: must be greater than or equal to 0"; `S/output-zero` "stream
  cannot be true when max_tokens is 0"; `S/output-one` 200 `max_tokens`. H the same.
- L: ceiling 64,000 | `L/output-above-ceiling-repeat`; `L/output-one` has no content part.
- MA: `max_tokens` 1..131,072 | `MA/output-above-ceiling` "'max_tokens' 131073 is out of
  supported range (0, 131072]", `MA/output-zero`, `MA/output-one`.
- MO: `max_completion_tokens` 1..131,072; `max_tokens` accepted, alone and beside it |
  `MO/output-above-ceiling`, `MO/output-zero`, `MO/output-legacy`, `MO/output-both`;
  `MO/output-one` → `length`.
- MT: `max_completion_tokens` at least 1; `max_tokens` accepted alone | `MT/output-zero`
  "`max_completion_tokens` must be at least 1, got 0", `MT/output-legacy`, `MT/output-both` 400
  "`max_tokens` and `max_completion_tokens` are mutually exclusive"; ceiling not sent.
- Never sent without a limit: D [A1] required on Anthropic, D [M1] optional on MiMo.

20 `sampling`.
- S: `temperature` 1 and `top_p` 0.99 only | `S/temperature-default` 200; `S/temperature-changed`
  400 "`temperature` is deprecated for this model."; `S/top-p-boundary` 200; `S/top-p-default`
  (1) and `S/top-p-changed` (0.5) 400 "`top_p` is deprecated for this model."; `S/top-k` 400
  "`top_k` is deprecated for this model."; `S/sampling-combined` 400; reasoning on:
  `S/thinking-sampling-temperature` "`temperature` may only be set to 1 when thinking is enabled
  or in adaptive mode. …", `S/thinking-sampling-top-k`, `S/thinking-sampling-top-p`,
  `S/thinking-top-p-valid` (0.95) 400 "`top_p` is deprecated". H the same.
- L: all three with reasoning off, temperature and top_p not together; with a budget only top_p
  from 0.95 | `L/temperature-changed`, `L/top-p-changed`, `L/top-k` 200; `L/sampling-combined`
  400 "`temperature` and `top_p` cannot both be specified for this model. Please use only one.";
  `L/thinking-sampling-temperature`, `-top-k`, `-top-p` 400; `L/thinking-top-p-valid` 200.
- MA: accepted | `MA/temperature-changed`, `MA/top-p-changed`, `MA/top-k`, `MA/sampling-combined`,
  `MA/thinking-sampling-temperature` 200; the override with reasoning on is D [M1].
- MO: accepted | `MO/temperature-changed`, `MO/temperature-upper`, `MO/top-p-lower`,
  `MO/frequency-penalty`, `MO/presence-penalty`, `MO/seed`, `MO/logit-bias`, `MO/logprobs` 200
  (no `logprobs` in the answer); `MO/n-two` 400 "n is not supported".
- MT: temperature, top_p, penalties, seed accepted | `MT/temperature-changed`,
  `MT/temperature-upper`, `MT/top-p-changed`, `MT/presence-penalty`, `MT/seed`; `MT/logit-bias`
  400, `MT/logprobs` 400 "`logprobs` is not supported with reasoning.", `MT/n-two` 400.

21 `stop`.
- S, H, L: honoured and reported | `S/stop-one`: text "OK ", `stop_reason: "stop_sequence"`,
  `stop_sequence: "END"`; `S/stop-four`.
- MA: ignored | `MA/stop-one`: the full text "OK END EXTRA", `end_turn`, no `stop_sequence` key.
- MO: not reliable | `MO/stop-one`, `MO/stop-string`: the full text although it holds the
  sequence; `MO/stop-four`: the sequence "A" matched inside the reasoning, the answer has no
  content and ends `stop`; `MO/stop-five` 400 "stop supports at most 4 sequences".
- MT: rejected | `MT/stop-one` 400 "`stop` is not supported".

22 `stream`.
- S, H, L, MA: `stream: true`; absent or false is JSON | `S/plain-stream`, `S/plain-json`,
  `S/plain-default`.
- MO: `stream: true`; usage comes with or without `stream_options` | `MO/plain-stream`,
  `MO/stream-usage-omitted`, `MO/stream-usage-false`; `include_obfuscation` no effect
  `MO/stream-obfuscation-true`; absent is JSON `MO/stream-default`; `stream_options` with
  `stream: false` accepted `MO/json-stream-options`.
- MT: the same; `stream_options` without `stream` rejected `MT/json-stream-options` 400
  "`stream_options` requires `stream` to be true".

23 `cut`. Variants `user` (cut text as an assistant turn, then a user turn), `prefill` (cut
text as the last message).
- S: `user` | `S/cut-text-user` 200 with reasoning on; prefill rejected `S/cut-text-prefill-off`,
  `-on` "This model does not support assistant message prefill. The conversation must end with
  a user message."; a turn holding only a complete signed reasoning part, then a user turn,
  accepted `S/cut-thinking-replay-signed`. H the same (`H/cut-thinking-replay`).
- L: `user`; `prefill` too, with and without a budget | `L/cut-text-user`,
  `L/cut-text-prefill-off`, `L/cut-text-prefill-on` (200; the answer continues the text exactly
  and has no reasoning part); reasoning cut before its signature cannot go back as reasoning,
  `L/cut-thinking-replay` 400.
- MA: `user`, `prefill` | `MA/cut-text-user`, `MA/cut-text-prefill-off`, `-on`; cut reasoning
  goes back `MA/cut-thinking-replay` 200.
- MO: `user`; a last assistant message is accepted and the answer starts over |
  `MO/cut-text-user`; `MO/cut-text-prefill` (the answer repeats "1 f" from the start); cut
  reasoning in `reasoning_content`, then a user turn, `MO/cut-reasoning-replay` 200.
- MT: A; the three follow-ups were never sent.

### Cells for pieces 24 to 41

24 `framing`. `named` (SSE with event names equal to `type`, no terminal line): S/H/L
`S/plain-stream` (7 names, 215 streams), MA `MA/plain-stream` (6 names, no ping, 110).
`data` (data lines only, last `data: [DONE]`): MO (88 complete), MT (57). All LF, a blank line
after every frame, cut streams too.
25 `open`. S/H/L `message_start`, message keys model, id, type, role, content, container,
stop_reason, stop_sequence, stop_details, usage, diagnostics. MA keys id, type, role, model,
content, usage. MO first chunk delta `{content: "", role: "assistant", tool_calls: null,
reasoning_content: null}`. MT first chunk holds role and first text together; in an empty
answer the first chunk is the last, with an empty delta (`MT/empty-text`).
26 `boundary`. S/H/L/MA explicit start and stop, index = position (93, 98, 64, 166 blocks).
MO none: reasoning, then text, then tool calls, never interleaved (62 streams). MT none: text,
then tool calls (`MT/choice-auto`). MA non-streamed content is `[text, thinking]`
(`MA/reasoning-json`), `[thinking, tool_use]` in `MA/tool-seed`.
27 `text`. S/H/L/MA `text_delta`, block opens `text: ""`. MO `delta.content`, null elsewhere.
MT `delta.content`, key absent elsewhere.
28 `reasoning`. `block`: S `S/reasoning-stream-signed`, H `H/reasoning-stream`, L
`L/reasoning-stream`, MA `MA/reasoning-stream` (opens `{thinking: "", signature: ""}`); omitted
text is one empty thinking_delta `H/display-omitted`. `field`: MO `delta.reasoning_content`,
`message.reasoning_content` (`MO/plain-stream`, `MO/plain-json`). `hidden`: MT, a count only
(`MT/plain-stream` 137 reasoning tokens, no reasoning key).
29 `tool`. S/H/L block `{type: "tool_use", id, name, input: {}, caller}`, three
input_json_delta, the first `""` (`S/tool-choice-auto`, two calls two blocks `S/parallel-false`,
non-streamed `S/tool-seed`); ids `toolu_` + 24. MA no `caller`, one fragment with the whole
input, ids `call_` + 24. MO every fragment `{index, id, function: {arguments, name}, type}`,
id and name in the first and null after, four fragments (`MO/choice-auto`, `MO/parallel-true`).
MT first `{index, id, type, function: {name, arguments: ""}}`, then `{index, function:
{arguments}}` whole; ids `call_` + 32.
30 `payload`. S (11 blocks), H (18): one signature_delta after the last thinking_delta;
non-streamed a `signature` field (`S/tool-seed-signed`). L (10): the same, and the signature
holds the organisation id (D028; flagged in 26 `transport.json`: 25 under L and `S/cross-model-l`).
MA: a signature_delta whose signature is the empty string, 54 of 54; non-streamed
`signature: ""`. MO, MT: none. `redacted_thinking`: none anywhere.
31 `cause`. S/H/L end_turn, tool_use, stop_sequence, max_tokens (`S/plain-stream`,
`S/tool-choice-auto`, `S/stop-one`, `S/output-one`). MA end_turn, tool_use, max_tokens. MO
stop, tool_calls, length (`MO/output-one`). MT stop, tool_calls; an exhausted limit also reads
`stop` (`MT/output-one`). Never seen: refusal, pause, content filter, context overflow,
repetition truncation (D [A21] [M1] [M2]).
32 `match`. S/H/L `message_delta.delta.stop_sequence` (`S/stop-one` "END", null otherwise).
MA: key absent. MO, MT: none.
33 `refusal`. No refusal on any row. S/H/L `stop_details: null` always; MT `refusal: null` in
non-streamed messages (`MT/plain-json`); MA, MO no field. D [A39] [O2] [M1] [M2]; Meta A.
34 `usage`. `disjoint` (input excludes the cache): S/H two frames, message_start {input,
cache write, cache read, write by lifetime, output so far, service_tier, inference_geo},
message_delta {input, cache write, cache read, output, thinking tokens}; `S/cache-5m-read` 86
input + 2,503 read. L the same, thinking tokens only with reasoning on. MA input_tokens,
output_tokens, cache_read_input_tokens when there is a read; no write count, no reasoning
count; `MA/cache-5m-write` 1,753, `MA/cache-5m-read` 89 + 1,664. `inclusive`: MO once in a last
chunk with `choices: []`, asked or not: prompt, completion, total, reasoning, cached
(`MO/cache-implicit-write` 1,206 with 0 cached, `-read` 1,206 with 1,152). MT once on the
chunk with the finish reason; absent from an empty answer. Cut stream: `S/cut-text` keeps
message_start usage, `MO/cut-text` has none. Output includes reasoning (`S/effort-max` 117 with
72; `MO/plain-stream` 15 with 12).
35 `heartbeat`. S/H/L one `ping` after the first content_block_start, 211 of 215 streams, none
when the answer has no part. MA no ping in 110; `: PROCESSING` comment lines about every five
seconds before the first frame in 43 (`MA/tool-choice-tool` 21 lines). MO the same lines in 41
of 92. MT none in 58. An unknown frame: none in 475 streams.
36 `rejection`. S/H/L `{type: "error", error: {type, message}, request_id}` + header
`request-id`; all 151 are 400 invalid_request_error. MA 400 `{error: {type, message}}`
(`MA/output-zero`), 401 `{error: {message, param, code: "401", type: "invalid_key"}}`
(`MA/host-sgp`). MO 400 `{error: {code: "400", message, param, type}}`, the detail in `param`
or nowhere, type one of "", "Bad Request", "BadRequestError" (`MO/n-two`, `MO/effort-max`,
`MO/effort-minimal`); 401 as MA. MT 400 `{error: {code: null, message, param, type}}` + header
`x-request-id` (`MT/n-two`). Other statuses and retry-after: D [A6] [A7] [O7] [M3].
37 `fault`. None on any row. D [A2] [A6] for S/H/L, A for the rest. `MO/choice-function` is a
200 stream of keep-alive lines left by the reader at its own 120 s limit, not a provider fault.
38 `end`. S/H/L/MA `message_stop` after exactly one message_delta; MO/MT `data: [DONE]`. Absent
from every cut stream (`S/cut-text`, `MO/cut-text`, `MT/cut-reasoning`).
39 `provenance`. S/H header `request-id`, `message.id` `msg_` + 24, `message.model` the slug
sent. L `message.model` the dated slug. MA `message.id` `msg_` + 24 in a stream and
`<uuid>_<32 hex>` in a JSON body; no request id under the stored names. MO chunk `id`
`<uuid>_<32 hex>`, `model`; `created` changes inside a stream (18 values in
`MO/cut-text-prefill`). MT header `x-request-id`, `id` `chatcmpl-<uuid>`.
40 `quota`. S/H/L twelve `anthropic-ratelimit-*` headers on a 200, none on a 400. MT
`x-ratelimit-limit-requests`, `-limit-tokens`, `-remaining-requests`, `-remaining-tokens` on a
200, none on a 400. MA, MO none under the stored names.
41 `alteration`. S/H `message_start.message.input_transformations` when the binding switch and
a `block_binding` are sent: `[]` (`S/binding-drop-block`) or `[{type: "thinking_dropped", path:
"messages.1.content.0", reason: "prefix_binding_mismatch"}]` (`S/binding-drop-block-signed`). L
`[]` always (`L/binding-drop-block`, `L/binding-error`). MA, MO, MT none.

### Section 2 — cells of the pieces table a fixture shows to be wrong

1. Opaque payload · differs: "MiMo's stream has no signature_delta" → it sends one per thinking
   block, holding the empty string (`MA/reasoning-stream`); non-streamed `signature: ""`.
2. Usage · OpenAI chat: "only when include_usage is set", "one extra chunk with choices: []" →
   MO and MT send usage with `stream: true` alone and with `include_usage: false`
   (`MO/stream-usage-omitted`, `MO/stream-usage-false`, `MT/…`); MT puts it on the finish chunk.
3. Rules, effort: "a per-message effort that differs, with thinking off → 400" →
   `S/inline-effort-off`, `H/inline-effort-off` are 200 (the directive is the last message).
4. Sampling · differs: "top_p of 0.99 or more" → `S/top-p-default`, `H/top-p-default` (top_p 1)
   are 400; only 0.99 passed (`S/top-p-boundary`).
5. Cut output sent back · differs: "Haiku 4.5 accepts a prefill, but not with thinking on" →
   `L/cut-text-prefill-on` is 200; the answer has no reasoning part.
6. Rules, reasoning sent back: "Required: within a tool-use turn, pass thinking blocks back" →
   `S/tool-replay-no-reasoning-signed`, `H/…` are 200.
7. Step opens · OpenAI chat: "every chunk repeats id, created and model", first delta `{role,
   content: ""}` → MO's `created` changes inside a stream; MT's first delta holds text.
8. Stop sequences · differs: MiMo lists them on both pages → ignored on MA, unreliable on MO.
9. Parallel tool calls · differs: MiMo's Anthropic page lists `disable_parallel_tool_use` →
   ignored (`MA/parallel-true`).
Narrower than the cell: `max_tokens` 0 is rejected with `stream: true`; message_delta usage
carries no lifetime breakdown, tier or geo; exactly one ping, at a fixed place.
The first reading (capture-traffic report) to correct: "Sonnet continuation from a MiMo seed
returned 400" is the copied-`thinking` defect; "MiMo's non-streamed answers have no signature"
— they have `signature: ""`; "Messages covers more: only it answered effort xhigh and max" —
that is acceptance, and no effect of effort is visible on MA.
Unverified items of the pieces file now answered: fifth mark; ceiling; empty text; first
message assistant (accepted); the 400 for a system role on a model without it; G009;
input_transformations on S, H and L; MiMo: signature at all, header/field acceptance, system
role placement, include_usage, [DONE], max_tokens, reasoning_effort, parallel_tool_calls,
reasoning_content on an assistant message, error bodies, the /anthropic path with a token-plan
key; chat tool-message order (none enforced on MO, MT); comment lines (MiMo yes, Meta none);
prompt_tokens includes cached (MO, MT). Still open: an error inside a stream;
model_context_window_exceeded on Haiku 4.5; anything about api.openai.com itself.

### Section 3 — the gaps

- G008 answered. MiMo's Anthropic endpoint is lenient: it accepts what Claude takes and
  ignores much of it. Token-plan host `/anthropic/v1/messages`; keys by `api-key`,
  `authorization`, `x-api-key`; version and beta headers optional; a system role at any
  position; reasoning on by default with an empty signature; replay accepted with, without or
  with a foreign signature; `tool_choice: none`, `disable_parallel_tool_use`, `stop_sequences`,
  `display`, the budget's size: all accepted and ignored; caching implicit in 128-token steps;
  no ping, `: PROCESSING` lines; usage without a write count and without a reasoning count;
  errors in two shapes; two id shapes; non-streamed content text-before-thinking. pi's reason
  for leaving it (tool rounds with thinking over several turns) is NOT reproduced by one round
  (`MA/tool-replay` 200); more than one round was not recorded.
- G009 answered: yes. `S/cut-text-user`, `H/…` (adaptive), `L/…` (budget 1,024), `MA/…` are 200
  with a cut text turn followed by "Continue." The cut text was sent as a complete text block
  with no trailing whitespace; trailing whitespace was not tried.
- G014: evidence, not the words. On/off is spelled five ways: S adaptive/between_tools; H
  adaptive/disabled; L enabled+budget/disabled; MiMo enabled/disabled on both endpoints (and
  effort none on chat); Meta has no off. Effort: S, H five levels and reasoning tokens rise with
  it; L none; MA accepted with no visible effect; MO none/low/medium/high; MT minimal..xhigh. A
  budget exists on L alone. So a neutral level needs: off, on, and an ordered effort, each
  renderable as "not available" per row. For D016's voice case on Haiku 5.5: switching the mode
  rewrites the cache (`H/cache-change-thinking` 1,904 written, 0 read) while an effort change
  keeps it (`H/cache-change-effort` 1,903 read; `H/cache-inline-effort` 1,904 read), and
  adaptive at effort low produced no reasoning (`H/effort-low`, 0 thinking tokens, one sample).
  Cache hint: marks matter on Claude only; 5m measured, 1h never written; MiMo and Meta cache by
  themselves and need no hint.
- G015 answered for S, H, L, MA. System text changed under a signed block, input tokens: S
  default 695 (block kept; 550 when dropped), `error` 400 "…The block is bound to a different
  conversation. … The `system` prompt differs from the one this block was created with.",
  `drop_block` 200 with the drop reported and fresh reasoning, no switch 400. H the same (774 /
  550). Tool description changed, default: 200, kept (696 / 775). L: default, `error`,
  `drop_block` all 200 with 1,633 input tokens and `input_transformations: []` — the Haiku 4.5
  signature is not bound to the text above it. MA: all 200, no report. Not measured: a changed
  earlier message; an account created after 2026-08-31 (default would be 400, D [A6]).
- G006 adds: the payload sits on reasoning parts only, one per part; on MA it is an empty
  string; on L it holds account identity. Another offering's block: S counts H's (767 input,
  as H itself), H silently drops S's (543) and reasons again, MA accepts S's; L in either
  direction and MiMo to Claude unmeasured (defects). Reasoning with no payload: rejected on L
  (`L/cut-thinking-replay`), on S and H by the empty-signature rule. A turn that is reasoning
  only is accepted (S, H signed; MA). Across turns: kept and counted on S (724 vs 314), H (144
  vs 114), MA (116 vs 93); stripped by the API on L (137 vs 137). An answer with no part exists
  (`S/tool-choice-none`; Meta's empty answers): "never emits an empty turn" has to say what is
  done with one.
- G012 adds: reasons seen and never seen (piece 31). Meta reports `stop` with an empty delta
  and no usage when its hidden reasoning used up the limit: 10 answers (`MT/output-one` limit 1;
  five `cache-*` at 64; `empty-text`, `frequency-penalty`, `sampling-combined` at 256;
  `cut-text` at 768); no non-empty answer exceeds its limit (236 of 256, 717 of 768). Shown for
  1 and 64, a reading for the rest. MO ends `stop` with no content when a stop sequence matches
  inside reasoning. So a provider's "completed" is not always complete.
- G018 adds: usage is disjoint on the four Anthropic Messages rows and inclusive on the two
  chat rows; chat alone has a total; counts that can be missing: everything on a cut chat
  stream and on a Meta empty answer, the reasoning count on MA and on L without reasoning, the
  write count outside Claude. Delta kinds seen: text, reasoning, payload, tool input. Order of
  parts: stated on Anthropic Messages; on chat MO gives reasoning, text, calls and MT text,
  calls; MA's non-streamed body is not in production order. Tool result must follow its call
  on Claude only. Instructions: position rule on S and H, no role on L.
- G021 adds: `none` cannot be rendered as a choice on three rows: ignored on MA and MO,
  rejected on MT; only Claude honours it. Parallel off is ignored on MA and MO. No chat row has
  a failure flag; a failure as text is accepted. MT shows text before tool calls in one answer.

### Section 4 — the MiMo endpoint (D005): recommend Anthropic Messages

Both endpoints are lenient and neither has a real opaque payload. For Messages: (a) all 110
streams produced data, while 2 of 92 chat streams held only keep-alive lines for 120 s; (b)
explicit part boundaries, so a cut is located as on Claude; (c) its 400 carries a real message,
chat says "Param Incorrect" or "Invalid request parameters"; (d) an unsupported stop sequence
is a no-op there, on chat one matched inside the reasoning and ended an answer with no content;
(e) it accepts everything the Claude rows send, so one translation serves both and nothing has
to be removed for MiMo. For chat: a reasoning-token count in usage; effort `none` as a second
off switch (the `thinking` toggle works on both). Risks to state: several tool rounds with
reasoning are unmeasured on both (pi's reason); MA's non-streamed order; two id shapes.
Consequence for P08-I03: its measured row would be Meta; the 107 MO fixtures stay evidence for
the chat blocks. The capture report's "31 against 29 accepted" is not the reason.

### Section 5 — unmeasured, and the captures worth making, in order of worth

1. Two or more tool rounds with reasoning in one turn, then the answer, on S, H, L, MA, MO.
2. Cross-model replay built properly (the target's own mode), with the binding switch and
   `drop_block` so the answer says what was dropped: L→S, S→L, MA→S, MO→S.
3. The six L defects sent again with `max_tokens` above the budget (reasoning left out of a
   tool round, empty signature, `is_error` both ways, cache marks on call and result).
4. A cut inside a tool call's input, a cut in the middle of a frame, a cut inside reasoning on
   S and H; and an answer with no part sent back followed by a user turn.
5. A second kind of rejection per provider (an unknown slug), and whatever 429, 5xx, in-stream
   error or refusal can be provoked; an overflowing prompt.
6. A one-hour cache write on a fresh prefix (S, H, L); a fresh long prefix sent twice to MiMo
   with and without marks.
7. An instruction whose obedience shows in the answer, at each accepted position, on all six.
8. MO `choice-function`, `top-p-changed` and `choice-allowed-tools` sent again; the MA and MO
   sampling cases with their field; `cache-last-conflict` without the 5m system mark.
9. Meta: a ceiling, a `length`, a refusal; MiMo: the effect of effort and of a budget.
10. `max_tokens` 0 without stream and no `max_tokens` at all; the undated Haiku alias;
    `strict` on Anthropic Messages. `redacted_thinking` cannot be provoked.
The 17 defective and 6 unanswered cases are listed in `case-names.json` (`nothing`, `why`).

### For report.md

- Status done. Files: the research file, `case-names.json`, log, report. Read only otherwise.
- Plan updates to propose: P07-I02 → implemented; G008, G009, G015 resolved by the fixtures;
  G014 narrowed (evidence above, words still the owner's); additions to G006, G012, G018, G021;
  D005 for MiMo: Anthropic Messages; P04-I01's "signed, plain, none" → block, field, none; a new
  gap: Meta reports `stop` for an exhausted limit; a new gap or follow-up: the captures of
  section 5; when folders are renamed, rewrite the paths in the research file from
  `case-names.json` (`was` → `name`); 76 unnamed cases need the owner's word (delete or keep).
- Names (each with its sibling): the 41 piece words (list in the 04:05 entry) — `reasoning`,
  `text`, `tool` mirror protocol's `part.reasoning`, `part.text`, `part.tool.call`; `user`,
  `assistant` mirror `part.user`, `part.assistant`; `replay` mirrors the plan's "replayed" and
  the claim `message-replay`; `stop`, `effort`, `display`, `cache`, `choice`, `parallel`,
  `stream`, `instructions`, `inline`, `cut` keep the first word of today's case names. No
  sibling, for the owner: `mode` (asking for reasoning), `cause` (why it stopped), `provenance`
  (who answered), `heartbeat`, `rejection`, `fault`, `quota`, `alteration`, `payload`, `match`,
  `boundary`, `open`, `end`, `framing`, `declaration`, `call`, `result`, `order`, `limit`,
  `sampling`, `address`, `authentication`, `version`, `usage`, `refusal`. Variant terms: 171,
  listed with meanings in `case-names.json`; the five `nothing` kinds superseded, defective,
  duplicate, unanswered, outside; outcome words accepted, honoured, ignored, rejected; marks M,
  D, A; row prefixes S, H, L, MA, MO, MT (the capture task used S, H, L, MA, MO, MT too).
- Asymmetries noticed: `parallel-true` means opposite things on the two formats; `inline-*`
  (Anthropic) beside `instruction-*` (chat) for one idea; `thinking-*` on MA sends other
  settings than its name; `replay` is also the envelope key for "built from this fixture";
  `rejection` sits close to `refusal`; the pieces file lists `n`, `logprobs`, `logit_bias` both
  in the Sampling cell and under "Pieces left out"; 51 of 171 variant terms have more than one
  word, against "each variant one word" — the owner's call; `fixture.json` of MO
  `choice-allowed-tools` describes a request the body does not hold.

## 2026-10-14 05:20 — resumed after the restart

- Reread WORKER.md, the brief (no `## Go`, no `## Resume`) and this log. Continuing at step 1 of
  "What remains".
- Tree now: 709 cases, 707 with a response, no `sequence.json` left (folded into `request.json`
  as `replay`); folder names unchanged. `./run index.ts` rebuilt `index.jsonl`: byte-identical
  to the one the cells were read from, so the cells below still hold.
- Next: check the cells of pieces 15 to 23 against the index as they are written, append them.

## 2026-10-14 05:50 — cells of pieces 15 to 23 checked; three words changed

- Added `q.ts` (`./run q.ts '<name-regex>' '<tag-regex>' [set,replay,res]`: one line per case)
  and `agg1.ts` (Meta: answers with usage, with reasoning, empty). Every cell of pieces 15 to 23
  was read again from the index. Corrections to the cells of the 05:05 entry:
  - S `thinking-adaptive`, `display-omitted`, `display-updates`, `display-summarized` hold no
    reasoning at all (0 thinking tokens): accepted, nothing more. Reasoning under `adaptive` on S
    shows in `S/effort-xhigh` (28), `S/effort-max` (72), `S/cut-text-user` (70).
  - L `display-updates` (with its switch) returns an EMPTY thinking text with 134 thinking tokens,
    where L's default returns text: on L `updates` withholds the text.
  - MO effort low/medium/high: reasoning tokens 28, 27, 24, so no visible effect; only `none`
    shows (0). MO `temperature-upper` (1.5) returns noise after "OK." (33 completion tokens against
    2): the one sampling setting whose effect shows.
  - MA `cut-text-prefill-on` starts over at "1" (the sent text was "1"; the answer begins
    "1\n2\n3"); only `-off` continues ("2\n3…", ending `max_tokens`). The 02:25 entry said both.
  - L `cut-text-prefill-on` has no thinking block AND no `thinking_tokens` key in usage.
  - S/H `sampling-combined` is rejected for `top_p: 1` alone; it does not isolate the pair.
  - MT `frequency-penalty` is accepted with an empty answer; `presence-penalty` with a full one.
  - `cache-change-thinking` also raises `max_tokens` (64 → 768, L 1536), so the pair does not
    isolate the mode; the written prefix is one token longer on S and H (2,504, 1,904).
  - `S/cache-mixed-valid` reads 2,584 (the entry `S/cache-four` wrote at its user mark), writes 0.
  - MO `stop-four`: the reasoning ends at `…"OK END EXTR`, just before the "A": measured.
- Words changed, in `names.ts`, `case-names.json` (regenerated, copied to the task folder, now
  with `root`) and to be changed in part 1 of the research file:
  - `blocks` → `parts` (instructions, result; and the rows' variants of user and assistant), and
    the rows' variant `block` → `part` (replay, reasoning). Reason: D006 calls a unit of a
    translation a block, and protocol calls a piece of content a part.
  - `omitted` → `absent` where a thing is not sent (`replay-absent`, `replay-earlier-absent`,
    `stream-usage-absent`; the rows' variant `none` of replay → `absent`). `omitted` stays only
    as the wire value of `display`. `none` stays only as a wire value (choice, effort).
  - Turn order `strict` → `adjacent` (`strict` is the wire name of a tool declaration's flag).
  - `cut-prefill` no longer says "reasoning off" (MO's sends no reasoning setting).
- Result: 709 cases, 633 named, 76 unnamed, 171 names, 145 keep today's name.
- Next: apply the words to part 1, append pieces 15 to 23.

## 2026-10-14 06:25 — research file through piece 23

- Part 1 of the research file now uses `parts`, `part`, `absent`, `adjacent` (pieces 4, 6, 7, 8,
  14). Pieces 15 to 23 appended (scratch copy `part2.md`): mode, effort, display, cache, limit,
  sampling, stop, stream, cut. The "In progress" note says 23 of 41.
- New aggregates behind those cells: `agg2.ts` (answers that reason, per row and mode: S adaptive
  12 of 49, between_tools 0 of 33, absent 0 of 4; H adaptive 18 of 43, disabled 0 of 35, absent 1
  of 4 = `H/inline-tools`; L budget 12 of 18, disabled 0 of 38; MA budget 46 of 46, absent 10 of
  10, disabled 0 of 55; MO absent 65 of 66, enabled 7 of 7, disabled 0 of 15; MT 50 of 50),
  `agg4.ts` (cache reads: S/H/L none without a cache field; MA 128 ×6 and 1,664 ×15, five reads
  with no field; MO 128 ×2 and 1,152 ×13, four with no field; MT 497 ×9 and 625 ×5, all 14 with
  no field; no one-hour write in the 231 answers that carry the count by lifetime).
- MO `cut-text-user` ALSO starts over at "1 f": on MO neither form continues a cut text.
- MO `choice-allowed-tools` (no tools in the body): the answer holds tool-call markup as text
  (`<tool_call><function=get_value>…`, finish `stop`, no `tool_calls`).
- Next: check and append pieces 24 to 41 (response pieces), then the table of the rows'
  variants, then sections 2 to 5.

## 2026-10-14 07:10 — research file: section 1 whole

- Pieces 24 to 41 appended (scratch copy `part3.md`), each cell read again from `resp.out` and
  from new checks (`cmt.ts`, `ids.ts`, `ids2.ts`, `org.ts`, `agg5.ts`), then "The rows' variants
  in one table" (21 pieces that have variants, six rows).
- New or corrected against the 05:05 cells:
  - Streams: S 81, H 79, L 55, MA 110, MO 92, MT 58 = 475; 11 cut by the reader, 2 left at its
    120 s limit, 462 complete.
  - MT tool-call ids have two shapes: `call_` + 32 characters in a stream, `call_` + a dashed UUID
    in a JSON body (`MT/tool-seed`).
  - `: PROCESSING` lines always come before the first frame; 5 to 7 seconds per line over the
    whole exchange; most 21 (`MA/tool-choice-tool`) and 23 (`MO/choice-function`).
  - In all 148 Anthropic error bodies `request_id` equals the `request-id` header.
  - Every MT answer limited to 1 or 64 tokens is empty (6 of 6) and none of them has usage, so
    "the hidden reasoning used up the limit" is a reading everywhere, not shown anywhere.
    Under 256 and 768 the answers with usage spend up to 236 and 717.
  - The four Claude streams without a ping: `S/`, `H/`, `L/tool-choice-none` and `L/output-one`.
  - New row-variant words: boundary `explicit` / `implied`; payload `signature` / `empty` /
    `absent`; heartbeat `ping` / `comment`; framing `named` / `data`; usage `disjoint` /
    `inclusive`; reasoning `part` / `field` / `hidden`; cache `marks` / `implicit`; cut `user` /
    `prefill`.
- Next: sections 2 (contradictions), 3 (gaps), 4 (MiMo endpoint), 5 (unmeasured), then remove the
  note, write report.md, `pnpm orchestra done research-variants`.

## 2026-10-14 07:55 — research file whole

- Sections 2 to 5 appended (scratch copy `part4.md`), the "In progress" note removed, and a
  paragraph "The words" added under "How to read it" (the two lists of variants: those a row
  takes, those a case shows; `absent`, `empty`, `part`). The file is 1,199 lines, 51 tables.
- Checks (`cite.ts`, `tables.ts`): 704 citations at the end, every one an existing case folder; an unnamed
  case is cited only where the text calls it defective or unanswered; no table row is wider or
  narrower than its header; no prose line over 100 characters.
- Section 2 found three contradictions more than the 05:05 list: the turn-order cell ("with a
  budget the final assistant turn must begin with a thinking block", against
  `L/cut-text-prefill-on`); "bound to its model" in one direction (`S/cross-model-h-signed`);
  and the plan's "to any sampling setting". MiMo's pages against its endpoints are a list of
  their own (the cells quote the pages correctly).
- Section 3 additions found today: a replayed part costs the reasoning tokens it was issued
  with (688 − 543 = 145 for 144; 767 − 543 = 224 for 223); reasoning is counted inside output
  on every row that counts it, so it cannot be a fifth disjoint count; "none" as a choice does
  not stop a call on MA, MO, MT.
- `case-names.json`: `MO/host-api` is now defective (refused for its key before the host was
  tested) and `MO/host-sgp-repeat` a duplicate of `rejection-unauthorized` (the same request,
  200 once the key was replaced); `duplicate` is defined to cover "the same apart from the
  output limit". Unnamed: 26 superseded, 19 duplicate, 18 defective, 6 unanswered, 7 outside.
- Next: one read of the whole file for sense, `pnpm journal check` for my file, report.md,
  `pnpm orchestra done research-variants`.

## 2026-10-14 08:25 — report written, task finished

- `report.md` written in the WORKER.md shape, ending with the names and the asymmetries as the
  brief asks. Fifteen findings (F01 to F15).
- Last corrections to the research file: piece 3, MA sends no version header in 117 of its 119
  cases, 112 of them answered 200 (the cell said 97); section 4, MiMo's Messages endpoint
  "rejected none of the Claude fields sent to it" (`between_tools` and tool changes inside an
  instruction were not sent); G012 and G018 each name the shape protocol has today
  (`step.boundary.stop.reason.enum` has no member for a matched stop sequence; `TokenUsage` has
  `reasoning` beside `output`); "The marks" says how a cell with several statements is read.
- Final state: research file 1,207 lines, 51 tables, 704 citations, all existing case folders;
  `case-names.json` 709 cases, 633 named under 171 names, 76 with no name (26 superseded, 19
  duplicate, 18 defective, 6 unanswered, 7 outside), none of the new names carrying a `-signed`,
  `-repeat` or `-diagnostic` suffix; `pnpm journal check` 0 errors, 0 warnings. Only the two
  granted paths are changed (`git status`).
- The scratch copies `part1.md` to `part4.md` under `/var/tmp/research-variants/` are older than
  the research file; the file in the journal is the one to read.
- Done: `pnpm orchestra done research-variants`.
