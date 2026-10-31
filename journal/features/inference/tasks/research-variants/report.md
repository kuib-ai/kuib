# research-variants — report

Status: done

## Summary

The 709 recorded exchanges were read and set against the table of pieces. The research file
says, for each of the 41 pieces and each of the six rows, which variant the row takes, with
the fixture that shows it or the mark documented or assumed. It lists what the captures
contradict, answers G008, G009 and G015, gives the evidence for G014, adds to G006, G012, G018
and G021, recommends an endpoint for MiMo, and orders the captures still worth making.
`case-names.json` gives every case folder its piece and variant: 633 cases under 171 names,
and 76 that show nothing a piece needs, each with its reason.

Nothing was read wholesale, no provider was called, no `.env` was read, and no signature was
decoded or printed.

What matters most, in five lines:

- MiMo's Anthropic endpoint rejects almost nothing and does little of what it accepts; the
  recommendation for D005 is still Anthropic Messages, with one capture owed first.
- A provider's "finished" is not always a finished answer: Meta ends ten empty answers with
  `stop`, and MiMo's chat endpoint ends one with `stop` after a stop sequence matched inside
  its reasoning.
- Tool choice "none" stops a call on Claude only. MiMo ignores it on both endpoints and Meta
  rejects it.
- On Haiku 5.5 a switch of the reasoning mode rewrites the cached instructions; a change of
  effort, at the top or inside the conversation, keeps them.
- Twenty-four captures do not show what their names say (18 defective, 6 unanswered), and the
  capture task's first reading drew three conclusions from them or from a bare 200.

## Files

- `journal/features/inference/research/variants-per-piece-2026-10-14.md` — new. Section 1,
  variants per piece (41 pieces, six rows, and the rows' variants in one table); 2, what the
  captures contradict; 3, the gaps; 4, the MiMo endpoint; 5, what is unmeasured.
- `journal/features/inference/tasks/research-variants/case-names.json` — new. The rule, the
  five reasons a case has no name, the six rows, the 41 piece words with the variant terms of
  each and their meanings, and 709 entries: `path`, `was`, `piece`, `variant`, `name`,
  `outcome`, and for a case with no name `nothing`, `see`, `why`.
- `journal/features/inference/tasks/research-variants/log.md` — the working record.
- `journal/features/inference/tasks/research-variants/report.md` — this file.

Scratch, outside the repository and read-only on the fixtures: `/var/tmp/research-variants/`
(`index.ts` builds one record a case; `names.ts` holds the mapping and writes
`case-names.json`; `cite.ts` checks the citations of a file against the tree).

## Plan updates (for the orchestrator)

- P07-I02 → implemented. Refs: the research file and this task's four files.
- G008 → answered (section 3). G009 → answered, yes. G015 → answered for S, H, L and MA; two
  halves stay open (a changed earlier message; an account created on or after 2026-08-31).
- G014 → narrowed to the words, which are the owner's. The evidence is a table of what each
  row needs said for off, on and how much. P04-I01's lists do not fit it as written:
  - "effort, budget, toggle, none": five spellings of the mode occur (`adaptive`, a budget,
    `enabled`, `disabled`, `between_tools`), with the effort as a second setting.
  - "signed, plain, none": no row needs `plain`. Anthropic Messages needs `part` (send back
    what was received, the signature even when empty) and `absent`; chat needs `field` and
    `absent`.
  - "markers, implicit, none": `marks` on the three Claude rows, `implicit` on the other
    three.
- G006, G012, G018, G021 → the additions of section 3. Two of them change a recommendation:
  - G021 recommends rendering tool choice "none" as a choice. That stops a call on Claude
    only; on MA and MO the model calls the tool anyway and MT rejects the value.
  - G018 recommends four disjoint counts. Reasoning is counted inside output on every row
    that counts it, and protocol's `TokenUsage` has it beside output.
- D005, the MiMo offering → Anthropic Messages on the evidence (section 4). If taken, P04-I03's
  second row is this one and P08-I03 has no MiMo row to register; its measured row is Meta.
  The capture that could overturn it is the first of section 5.
- New gap: an answer the provider calls finished that holds nothing (MT `stop` with an empty
  delta and no usage; MO `stop` with no content; Claude `end_turn` with no part). Belongs
  beside G012.
- New follow-up: the twelve captures of section 5. The first three decide the most: two or
  more tool rounds with reasoning on MiMo; a cache mark inside the conversation under a
  changed mode or effort on Haiku 5.5 (D016); failures that can be provoked, since every
  failure recorded is a 400 or a 401.
- The plan, "The pieces": its third fact ("Sonnet 5.5 answers 400 … to any sampling setting")
  and its fourth ("no `signature_delta`") are contradicted (section 2).
- The pieces file has eight cells or rules a fixture shows to be wrong, and four where MiMo's
  pages say what its endpoints do not do. Whether to amend that file or let this one stand
  beside it is not mine to decide.
- Renaming the folders: `case-names.json` is the mapping (`was` to `name`, under `root`). The
  research file cites today's names 704 times; they can be rewritten from the same mapping.
  The 76 cases with no name need the owner's word: delete them, or keep them under today's
  names.

## Journal

- Claims rewritten and stamped: none. No code was changed.
- Claims possibly affected and not updated: none.
- `pnpm journal check`: 0 errors, 0 warnings, with the new research file in place.

## Verification

- `pnpm run check`: not run. The brief allows no gate and no test run on this machine; the
  task changes no code.
- `pnpm journal check`: green.
- The index was rebuilt after the envelopes were tidied and is byte for byte the one the
  first cells were read from.
- `names.ts` fails unless every case is mapped, no two cases of a row share a name, every
  variant term has a meaning and is used, and every `see` names a case of the same row.
- `cite.ts`: all 704 citations of the research file are existing case folders; a case with no
  name is cited only where the text calls it defective or unanswered.
- Every cell of pieces 15 to 41 was read again from the index before it was written, and the
  cells of pieces 1 to 14 were checked against a tabulation of the same cases. The corrections
  that came of it are in the log (05:50, 06:25, 07:10).

## Findings (reviews)

Paths are under `packages/inference/fixtures/` unless they begin with `journal/`. S, H, L, MA,
MO, MT are the six rows as the research file writes them.

- F01 · high · `anthropic-messages/anthropic/claude-haiku-4-5/{inline-after-result,tool-replay-cache,tool-replay-empty-signature,tool-replay-error,tool-replay-false,tool-replay-no-reasoning}` ·
  each sends `max_tokens` 768 with a budget of 1,024 · rejected for that before the change the
  case makes is looked at, so six cells of Haiku 4.5 are unmeasured · send again with a limit
  above the budget.
- F02 · high · `…/claude-sonnet-5-5/cross-model-l`, `…/claude-sonnet-5-5/cross-model-ma`,
  `…/claude-haiku-4-5/cross-model-s` · the request copies the source model's reasoning mode ·
  rejected for the mode; replay across models with Haiku 4.5, and from MiMo to Claude, is
  unmeasured · build the request in the target's mode, with `drop_block`.
- F03 · high · `openai-chat/meta/muse-spark-1-1/{output-one,empty-text,frequency-penalty,sampling-combined,cut-text}` and the five accepted `cache-` cases ·
  ten complete answers of one chunk, an empty delta, `finish_reason: "stop"`, no usage; Meta
  never returns `length` · a step that reads as completed holds nothing · the neutral reason
  must tell the two apart (G012).
- F04 · high · `openai-chat/xiaomi/mimo-v2-6-pro/stop-four` · a stop sequence matched inside
  `reasoning_content` · the answer ends `stop` with no content · send no stop sequence to this
  endpoint.
- F05 · medium · `openai-chat/xiaomi/mimo-v2-6-pro/choice-function`, `…/top-p-changed` · a 200
  stream of 23 keep-alive lines, left by the reader after 120 seconds; the two bodies are the
  same bytes · they show nothing of tool choice or sampling · send again; give the transport a
  limit of its own for a stream that never starts.
- F06 · medium · `openai-chat/xiaomi/mimo-v2-6-pro/choice-allowed-tools/fixture.json` · `shows`
  describes a request with tools and a tool choice; the body has neither · a reader of `shows`
  is misled · correct `shows` or send again.
- F07 · medium · `anthropic-messages/xiaomi/mimo-v2-6-pro/{thinking-sampling-top-k,thinking-sampling-top-p}`,
  `openai-chat/xiaomi/mimo-v2-6-pro/thinking-sampling-top-p` · no sampling field in the body ·
  they show a plain answer · send again with the field.
- F08 · medium · `cache-last-conflict` on S, H, L and MA · its own marks put one hour after
  five minutes · it gets the message about order, not about a conflict at the last part ·
  send without the five-minute mark on the instructions.
- F09 · medium · `tool-choice-none` on MA, `choice-none` on MO and MT · "none" is ignored on
  both MiMo endpoints and rejected by Meta · a choice of "none" does not stop a call there ·
  G021's recommendation needs a second rendering for these rows.
- F10 · medium · `journal/features/inference/research/format-pieces-2026-10-08.md:138,144,150,153,162,171,227,298,334,342` ·
  cells and rules a fixture contradicts (research file, section 2, rows 1 to 8) · a block
  written from them would be wrong · amend, or cite the research file beside them.
- F11 · medium · every row · the only statuses recorded are 200, 400 and 401; no `retry-after`,
  no error inside a stream, no refusal · P02-I04 rests on documentation · capture 3 of
  section 5.
- F12 · medium · `cache-change-thinking`, `cache-change-effort`, `cache-inline-effort` on S, H,
  L · the mark sits on the instructions, and `cache-change-thinking` also raises the output
  limit · what a change does to cached messages is unmeasured, and the mode is not isolated ·
  capture 2 of section 5.
- F13 · low · `journal/features/inference/tasks/capture-traffic/report.md:82,91,105` · three
  sentences of the first reading do not hold (section 2) · they would mislead D005 · read the
  research file in their place.
- F14 · low · `parallel-true`, `parallel-false` · the names mean one call on the four Anthropic
  Messages rows and several on the two chat rows · a reader compares opposites · the new names
  are `parallel-single` and `parallel-allowed`.
- F15 · low · the capture tool's list of stored response headers · MiMo sends three to five
  headers that were not stored · "MiMo sends no request id" cannot be said · store header
  names, at least, in a later capture.

## Names

A piece has one word and a variant one term. The whole list is in `case-names.json`; this is
what was introduced and what each mirrors.

Piece words, 41:

- `text`, `reasoning` — mirror `PartTypeEnum` (`text`, `reasoning`).
- `user`, `assistant` — mirror `MessageRoleEnum`.
- `usage` — mirrors `token.usage`.
- `stop`, `effort`, `display`, `cache`, `choice`, `parallel`, `stream`, `cut`, `inline` — keep
  the first word of today's case names (`stop-one`, `effort-low`, `cut-text`, `inline-first`).
- `replay`, `result`, `order` — the second word of today's `tool-replay`, `tool-result-blocks`,
  `tool-order-invalid`.
- `instructions` — today's `instruction-` and `system-`, brought under the table's "Base
  instructions".
- `authentication`, `address`, `version`, `declaration`, `sampling`, `limit` — the noun of the
  table's piece name, where today's names say `auth-`, `host-`, `version-header`, `strict-`,
  `temperature-`, `output-`.
- `mode` — asking for reasoning; today's `thinking-`, which is a provider's word. No sibling.
- `tool`, `call` — the tool call in an answer, and the one sent back. No one-word sibling:
  protocol says `tool-call` for both.
- `framing`, `open`, `boundary`, `payload`, `cause`, `match`, `refusal`, `heartbeat`,
  `rejection`, `fault`, `end`, `provenance`, `quota`, `alteration` — one word from each response
  piece of the table. No sibling in code.

Variants a row takes, in the research file: `bearer`, `header`; `pinned`, `absent`; `string`,
`parts`; `role`; `part`, `field`; `adjacent`, `free`; `adaptive`, `budget`, `enabled`,
`disabled`, `between-tools`; `marks`, `implicit`; `user`, `prefill`; `named`, `data`;
`explicit`, `implied`; `hidden`; `signature`, `empty`; `disjoint`, `inclusive`; `ping`,
`comment`; and for choice, effort and display the values themselves. The mode words mirror
the wire values; `part` mirrors protocol's `part`; `marks` mirrors the table's "Cache marks";
the rest have no sibling.

Variants a case shows, 171 terms, with their meanings in `case-names.json`. Their pattern:
one word where the idea has one (`replay-absent`, `cache-five`); the wire name where a wire
field is what varies (`sampling-top-p-changed`, `mode-between-tools`); a second word where the
case varies a second thing (`choice-required-reasoning`, `effort-max-off`). 145 cases keep
today's name.

Other words: the five reasons a case has no name, `superseded`, `defective`, `duplicate`,
`unanswered`, `outside`; the four outcomes, `accepted`, `honoured`, `ignored`, `rejected`; the
marks M, D, A, which are the brief's measured, documented, assumed; the row prefixes S, H, L,
MA, MO, MT, taken from the capture task. None has a sibling in code.

Files and keys: `variants-per-piece-2026-10-14.md` mirrors `format-pieces-2026-10-08.md`;
`case-names.json` is the brief's name. Its keys `piece`, `variant`, `name` are the brief's
words, `offerings` is the plan's (D005), `was` and `see` have no sibling.

For the owner's review:

- Two lists of variants. The variants a row takes (`part`, `field`) are not the variants a
  case shows (`replay-verbatim`, `replay-absent`): a case is named for what its request does,
  so that one request has one name on every row, and what a row takes is read from several
  cases. Where both name the same thing the word is the same. If one list was meant, this is
  the place to say so.
- 51 of the 171 variant terms have more than one word, against "each variant one word". They
  are wire names, or a variant with a second thing varied. One word each would need two cases
  of one row to share a name.
- Three words were changed late for one reason each. `blocks` became `parts`, and the rows'
  `block` became `part`, because D006 calls a unit of a translation a block and protocol calls
  a piece of content a part. `omitted` became `absent` wherever a thing is not sent, so
  `omitted` is only the wire value of `display` and `none` only a wire value. Turn order
  `strict` became `adjacent`, `strict` being the flag of a tool declaration.

Asymmetries noticed and left as they are:

- `replay` is the piece "reasoning sent back" (the plan's word) and also the envelope key in
  `request.json` for "built from this fixture".
- `-reasoning` marks a case sent with reasoning on and `-off` one sent with it off. `-on` and
  `-off` would be a pair, but `on` and `off` already name the stream switch.
- `cause` stands for why an answer stopped, where protocol says `stop-reason`; `stop` is taken
  by stop sequences and `reason` sits one syllable from `reasoning`.
- `open` and `end` follow the table's "Step opens" and "Step ends"; protocol's pair is
  `step-start` and `step-stop`. `boundary` here is the start and stop of a part; protocol's
  `step-boundary` is another thing.
- `rejection` (a failure before the stream) sits close to `refusal`.
- Today's case names: `parallel-true` means opposite things in the two formats; `inline-` on
  Anthropic Messages and `instruction-` on chat name one idea; three `thinking-` cases of MA
  send another setting than their name; `cache-retention-in-memory` sends `in-memory` to
  MiMo and `in_memory` to Meta under one name.
- The pieces file lists `n`, `logprobs`, `logit_bias`, tools of the `custom` kind,
  `allowed_tools`, and `tool_addition` and `tool_removal` both in a cell of its tables and
  under "Pieces left out". The cases follow the cell; only `metadata` and `verbosity` are
  counted as outside.
- The plan says "Cache marks" for the piece and "markers" for its blocks (P04-I01).
- The row prefixes: in MA and MO the second letter is the format, in MT it is not.
