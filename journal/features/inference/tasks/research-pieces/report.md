# research-pieces — report

Status: done

## Summary

`journal/features/inference/research/format-pieces-2026-10-08.md` lists what Anthropic
Messages and OpenAI chat have, as 23 pieces of a request and 18 of a response, each cell
citing the page or source line it rests on. Nine pieces are new against the plan's first cut.
Sixteen cells of the first cut are wrong and twenty lack something; they are listed one by
one. The file also holds the rules each piece carries with the endpoint's answer when one is
broken, 868 special cases from the AI SDK, pi and opencode filed by piece, one line per piece
on what both formats need said, the pieces left out with their fields, and what stayed
unverified.

Four findings change the plan most:

- Anthropic's own table settles the reasoning switch. Sonnet 5.5 rejects `disabled` and a
  budget and uses `between_tools` as its off switch; Haiku 5.5 takes `disabled` at `high`
  effort or below; Haiku 4.5 takes a budget or `disabled` and rejects `adaptive`.
- OpenAI chat now has explicit cache marks (`prompt_cache_breakpoint`,
  `prompt_cache_options`), four a request. The plan's "none; caching is implicit" is wrong.
- Sonnet 5.5 answers 400 to a forced tool choice and to any sampling setting; MiMo removes a
  forced tool choice and overrides sampling without an error.
- MiMo's Anthropic page now lists a `signature` on thinking blocks and still no
  `signature_delta`; pi left that endpoint for OpenAI chat because sessions with thinking and
  tool calls over several turns failed.

Nothing is from memory. The reference pages were saved as served and searched on disk. Three
read-only sub-agents swept the translations; a script matched every one of their 868 cited
lines against the clones, I read every entry, and I opened the source around 71.

## Files

- `journal/features/inference/research/format-pieces-2026-10-08.md` — new, about 237 kB; 150
  kB of it is the generated tables of special cases.
- `journal/features/inference/tasks/research-pieces/plan.md`, `log.md`, `report.md` — new.

No other file in the repository was changed. No git writes, no model API call, `.env` not
read. Outside the repository, under `/var/tmp/kuib-prior-art/research-pieces/`: the saved
pages (`anthropic/`, `openai/`, `mimo/`), the sub-agents' findings (`findings/`), two scripts
(`scripts/`).

## Plan updates (for the orchestrator)

- P07-I01 → implemented.
- Pieces to add to "What a request says": **Version and feature switches** (`anthropic-version`,
  `anthropic-beta`; OpenAI sends none), **Parallel tool calls** (`disable_parallel_tool_use`
  inside `tool_choice`; `parallel_tool_calls`), **Effort** (`output_config.effort`;
  `reasoning_effort`), **Whether reasoning text is returned** (`thinking.display`; nothing on
  OpenAI), **Stop sequences** (`stop_sequences`; `stop`, at most 4).
- Pieces to add to "What a response carries": **Which stop sequence matched**
  (`stop_sequence`; nothing on OpenAI), **Refusal detail** (`stop_details`; `delta.refusal`),
  **Rate-limit state** (the `anthropic-ratelimit-*` and `x-ratelimit-*` headers), **What the
  server changed** (`input_transformations`, under a beta).
- Pieces to remove: none. `stop_sequences` and `stop` leave the Sampling row; the version and
  beta headers leave the Authentication row; effort leaves "Asking for reasoning".
- Cells to correct: the sixteen under "Wrong" in the file's "Differences from the first
  cut". The ones with consequences are in "Findings" below.
- P07-I02, rows as documented (each still needs its fixture):
  - Sonnet 5.5: thinking `adaptive` or `between_tools`; effort five levels, default `high`;
    no budget; forced tool choice 400; sampling 400; `system` role inside `messages`
    accepted; prefill 400; thinking blocks bound to model, prefix and account; 128K output;
    shortest cached prefix 512 tokens.
  - Haiku 5.5: thinking `adaptive` or `disabled` (at `high` or below); effort default
    `medium`; no budget; forced tool choice accepted; sampling 400; `system` role accepted;
    prefill 400; bound like Sonnet 5.5; 128K.
  - Haiku 4.5: thinking `enabled` with a budget, or `disabled`; no effort (not among the
    models that support it); forced tool choice refused while a budget is on; sampling
    accepted unless thinking is on; no `system` role inside `messages`; prefill accepted
    unless thinking is on; the API keeps only the last turn's thinking; 64K; shortest cached
    prefix 4,096.
  - MiMo 2.6 Pro, Anthropic endpoint: thinking `enabled` or `disabled`, default on; no
    effort; `tool_choice` other than `auto` removed; `signature` optional on a thinking block
    sent back; no cache field; two extra stop reasons and four missing; usage without a
    cache-write count; `max_tokens` not required.
  - MiMo 2.6 Pro, OpenAI endpoint: a top-level `thinking` field; `reasoning_content` in
    deltas and "recommended" on the way back; `max_completion_tokens` only;
    `stream_options` not listed; the same `tool_choice` and sampling behaviour.
- G008: three new facts. The token-plan hosts document an `/anthropic` path for all three
  regions. The Anthropic page lists `signature` (optional in a request, present in the
  non-streaming response). pi, which serves MiMo only through OpenAI chat, sends an empty
  `reasoning_content` on every assistant message and asks for thinking as
  `thinking: {type}` plus `reasoning_effort`. For D005 this points at the OpenAI endpoint as
  the one that covers more, until P01-I03 and P01-I04 measure it.
- G009: stays open. The references describe only a last assistant message, which Sonnet 5.5
  and Haiku 5.5 answer with 400; Anthropic's advice for those models is the partial text in a
  user message. pi removes turns that ended in an error or an abort from the request.
- G014: the reasoning words differ more than the first cut shows. Anthropic has a mode
  (`adaptive`, `enabled`, `disabled`, `between_tools`) and a separate effort; OpenAI has only
  effort, with `none` and `minimal` below `low`. Cache lifetimes are `5m` and `1h` against
  `30m`; both allow four marks.
- D016's voice case: on Sonnet 5.5 "reasoning off for the first turn" is `between_tools` at
  `high` effort or below, and a change of the thinking setting between steps invalidates the
  cached messages; an effort change inside a `system`-role message does not. On Haiku 5.5 it
  is `disabled`.
- New gap, bears on P02-I02: OpenAI chat cannot say in what order a text and a tool call were
  produced (`content` and `tool_calls` are separate fields), and has no error flag on a tool
  result. The format has to say which side loses what.
- New gap, bears on P04-I01 and P08-I01: tool choice "none" and "send no tools" are different
  requests. The AI SDK and opencode drop the tools on Anthropic, which also changes the
  cached prefix.
- Captures the file's "Unverified" asks for, beyond those already planned: a fifth cache
  mark; `max_tokens` above the ceiling; an empty text block; a `system`-role message to
  Haiku 4.5; on MiMo, a `thinking` block sent back without a signature, with an empty one and
  with one from Claude, the three Anthropic headers, `cache_control`, a mid-stream error, and
  on its OpenAI endpoint `stream_options`, `[DONE]`, `max_tokens` and `reasoning_content` on
  an assistant message. The owner decides whether these fit D017's envelope.
- The research file is large because the brief asks for every special case. If a shorter
  file is wanted, the section "Every case, by piece" is generated and can move to a file of
  its own; I did not split it because the brief names one file.

## Journal

- Claims rewritten and stamped: none. No code changed.
- Claims possibly affected: none.
- The engine-design note of 2026-10-07 ("MiMo's Anthropic-compatible endpoint") says the page
  has no signature on thinking blocks and that the token-plan key on the Anthropic path is
  unchecked. Both are out of date against the pages read today. Not mine to edit.

## Names

No name was introduced in code. Names of pieces introduced in the research file:

- "Version and feature switches" — mirrors "Stream switch".
- "Parallel tool calls" — mirrors "Tool choice", "Tool call".
- "Effort" — mirrors "Sampling", "Usage" (one noun).
- "Stop sequences" — mirrors "Cache marks".
- "Which stop sequence matched" — mirrors "Why it stopped", "Who answered".
- "Refusal detail", "Rate-limit state" — no close sibling; nearest are "Opaque payload" and
  "Output limit". For the owner's review.
- "Whether reasoning text is returned", "What the server changed" — clauses among noun
  phrases; nearest are "What the user said" and "Why it stopped". For the owner's review.

Existing asymmetries noticed and left unchanged: the first cut names request pieces partly
by content ("What the user said", "What the model said") and partly by mechanism ("Tool
declarations", "Cache marks"); "Asking for reasoning" (request) and "Reasoning" (response)
are a pair, while "Tool call sent back" and "Tool call" are another pair built differently.

## Verification

- `pnpm run check`: green (`pnpm journal check`: 0 errors, 0 warnings; typecheck, lint and
  format: 48 of 48 tasks).
- Commits checked before citing: `vercel/ai` `5028fa4`, `badlogic/pi-mono` `1cedd32`,
  `sst/opencode` `663fbd7`; `git status --porcelain` is empty in all three after the sweep.
- `scripts/check-findings.sh`, run by me on each findings file: `ok=342 bad=0`,
  `ok=269 bad=0`, `ok=257 bad=0`. It prints each cited line from the clone and compares it
  with the quoted text.
- Source opened by me around 71 of the 868 entries; all 71 read as the entry says. For the
  other 797 the line exists as quoted and the reading is the sub-agent's.
- Reference pages: 49 Anthropic, 18 OpenAI, 19 MiMo saved, all HTTP 200, and OpenAI's
  OpenAPI document at `openai/openai-openapi@498c71d`. How far each was read
  is stated under "Sources" in the file; no cell rests on a page that was not opened.
- Departures from the brief, all stated in the file:
  - `platform.openai.com/docs/api-reference/chat/create` answers 403 to an HTTP client; the
    reference was read at `developers.openai.com/api/reference/…`, where a browser is
    redirected.
  - MiMo's pages were read as the markdown its own `llms.txt` lists under
    `mimo.mi.com/static/docs/`, since `mimo.mi.com/docs` is an application shell.
  - opencode's `packages/opencode/src/provider/transform.ts` was swept besides the folder the
    brief names, because the per-model workarounds live there; its entries are marked.
  - The AI SDK sub-agent reports that it created and at once deleted one scratch file in
    `/dev/shm`, which is memory. Nothing else was written outside the scratch folder.
- The harness loaded its Claude API skill at the start. Nothing in the file is taken from it;
  every Anthropic cell cites a page fetched today.

## Findings (reviews)

Against the plan's first cut. Line numbers are those of `journal/features/inference/plan.md`.

- F01 · HIGH · plan.md:178 · Cache marks, OpenAI: "none; caching is implicit" · a translation
  built from it never places a mark on `gpt-5.6` and later, where `prompt_cache_breakpoint`
  exists and `explicit` mode with no mark means no caching · rewrite the cell; add the variant
  "markers and an implicit mark together".
- F02 · HIGH · plan.md:177 · Asking for reasoning: the variants "effort, budget, toggle, none"
  do not fit Sonnet 5.5, which has no `disabled` and no budget · D016's voice case sends
  `disabled` and gets 400 · add `between_tools`; split effort out; take the rows from
  Anthropic's table.
- F03 · HIGH · plan.md:173 · Tool choice, differs: "rejected or ignored on some" · Sonnet 5.5,
  the first row, rejects `any` and `tool` with 400; MiMo drops them silently · state it per
  row; the block needs a variant that renders "must call" as `auto` and reports it (D003).
- F04 · HIGH · plan.md:171 · Reasoning sent back, differs: "signed, plain, none" · MiMo's
  Anthropic page lists an optional `signature`; pi marks Xiaomi as taking `signature: ""`;
  the three translations each do something different with reasoning that has no signature
  (drop, send as text, send without the key) · keep the variant open until P01-I03; the
  block must say what it does with an unsigned and with a foreign block.
- F05 · MEDIUM · plan.md:166 · Authentication: lists the version and beta headers as
  authentication and `x-api-key` as the header · the key now goes in `Authorization: Bearer`
  and `x-api-key` is the legacy fallback; the beta list depends on other pieces · split the
  row.
- F06 · MEDIUM · plan.md:180 · Sampling: holds stop sequences and "rejected on some" · Sonnet
  5.5 and Haiku 5.5 answer 400 to any non-default value; MiMo overrides silently · split stop
  sequences; state the three behaviours.
- F07 · MEDIUM · plan.md:176 · Turn order: "roles alternate" · Anthropic combines same-role
  turns and does not reject them; what it rejects is a misplaced `tool_result` or `system`
  message. OpenAI's rule is in no reference · rewrite both cells; cite the translations for
  OpenAI.
- F08 · MEDIUM · plan.md:182 · Cut output sent back: both cells describe something no
  reference documents · a block written from them is untested behaviour on every row · leave
  the cells as "not documented" until G009's capture.
- F09 · MEDIUM · plan.md:168 · Instruction inside the conversation: no placement rule, no
  model list · a `system` message between a call and its result, or first, is 400; Sonnet 5
  and Haiku 4.5 do not take the role · add both; "else text in a user turn" is one
  translation's choice.
- F10 · LOW · plan.md:196 · Usage, OpenAI: no cache-write count · `cache_write_tokens` exists
  and one translation subtracts it from the prompt count · add it.
- F11 · LOW · plan.md:197, plan.md:199 · Keep-alive and mid-stream failure on OpenAI: stated
  as the format's · neither is in OpenAI's reference; they are what translations handle ·
  mark their source.
- F12 · LOW · the reference itself · `api/messages/create` says there is no `system` role and
  lists it; says `display` defaults to `summarized` where the thinking guide says `omitted`
  per model · do not derive a default from the reference's prose; use the guides.
