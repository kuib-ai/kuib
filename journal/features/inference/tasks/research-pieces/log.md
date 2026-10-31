# research-pieces — log

## 2026-10-08

- Read WORKER.md, the brief, `journal/features/inference/plan.md` ("Objective", "The pieces,
  first cut", P07, D005, D018 to D021), `research/prior-art-synthesis-2026-10-08.md`, and
  "MiMo's Anthropic-compatible endpoint" in `engine-design-2026-10-07.md`.
- Commits checked: `research-sdks/ai` = vercel/ai `5028fa4`; `research-opencode-pi/pi-mono` =
  badlogic/pi-mono `1cedd32`; `research-opencode-pi/opencode` = sst/opencode `663fbd7`.
- Scratch folder `/var/tmp/kuib-prior-art/research-pieces/` created (`anthropic/`, `openai/`,
  `mimo/`, `scripts/`, `findings/`).
- Probes: `platform.claude.com/docs/en/api/messages/create.md` answers 200 as markdown;
  `platform.openai.com/docs/api-reference/chat/create` answers 403 to curl;
  `mimo.mi.com/docs/en-US/api/chat/anthropic-api` answers 200 as HTML.
- Wrote `plan.md`.
- Next: download the Anthropic pages named by `llms.txt`, find a fetchable form of OpenAI's
  reference, extract MiMo's two pages.
- Reference pages saved under `/var/tmp/kuib-prior-art/research-pieces/` (fetched 2026-10-08,
  about 13:55 to 14:00 UTC; the time is in each folder's `_fetched-at.txt`):
  - `anthropic/`: 49 pages of `platform.claude.com/docs/en/…` in their `.md` form, all 200.
    File name = the path with `/` as `_` (`api_messages_create.md`).
  - `openai/`: `platform.openai.com/docs/api-reference/chat/create` answers 403 and redirects
    browsers to `developers.openai.com/api/reference/…`; the reference is served there as
    markdown. Saved `reference_resources_chat.md` (the whole Chat resource, 236 kB),
    `…_completions_streaming-events.md`, `reference_overview.md` and nine guides
    (`docs_guides_*.md`). Also `openapi-manual_spec.yaml` from `openai/openai-openapi`
    branch `manual_spec` at `498c71d` (version 2.3.0) as a second form.
  - `mimo/`: `mimo.mi.com/llms.txt` lists markdown under `mimo.mi.com/static/docs/…`; saved 19
    pages, among them `api_chat_anthropic-api.md` and `api_chat_openai-api.md`.
- `findings/_PIECES.md` (the buckets) and `scripts/check-findings.sh` (prints every cited
  line and compares it with the quote) written.
- Three read-only sub-agents launched, one per translation (AI SDK, pi, opencode). Each writes
  `findings/<name>.md` in the scratch folder only. Their output is candidates; every line is
  re-checked by the script and read by me before it is cited.
- Next: read the Anthropic and OpenAI references and fill the two tables.
- Read from the saved pages: A1 (headers, body, `Message`, stream events), A2, A3, A4, A5, A6,
  A7, A8, A9, A12, A13, A14, A19, A20, A21, A25, A26, A27, A39; O1 (create body, the returned
  object, the streaming example), O2, O3, O5, O6, O7, O8; M1, M2, M3, M8. Keys are defined in
  the research file's `## Sources`.
- Research file: skeleton and `## Sources` written; `## What a request says` (23 pieces, 5
  new) and `## What a response carries` (18 pieces, 4 new) written with every cell cited.
- Findings that overturn the first cut, to carry into `## Differences from the first cut`:
  Anthropic's primary auth header is now `Authorization: Bearer`, `x-api-key` is "legacy";
  OpenAI chat has explicit cache breakpoints (`prompt_cache_breakpoint`,
  `prompt_cache_options`) and reports `cache_write_tokens`; Anthropic's own thinking table
  (A12) settles Sonnet 5.5 (`disabled` is 400, `between_tools` is the off switch), Haiku 5.5
  (`disabled` allowed at `high` or below) and Haiku 4.5 (budget only, `adaptive` is 400);
  forced tool choice is 400 on Sonnet 5.5; sampling is 400 on Sonnet 5.5 and Haiku 5.5;
  mid-conversation `system` is not accepted on Sonnet 5 or Haiku 4.5; MiMo's Anthropic page
  now lists `signature` on thinking blocks (optional in the request) but still no
  `signature_delta`; MiMo's OpenAI page has a top-level `thinking` field and
  `reasoning_content`; A1 contradicts itself on the `system` role and on the default of
  `thinking.display`.
- Sub-agents: `findings/ai-sdk.md` is being written (48 kB so far); pi and opencode have not
  written yet.
- Next: `## Rules a piece carries`, then verify the sub-agents' findings and write the
  translations section.
- Research file: `## Rules a piece carries`, `## Pieces left out` and
  `## What each piece needs said neutrally` written. Still pending: the translations section,
  `## Differences from the first cut`, `## Unverified`.
- Differences already established against the plan's tables (to write up): the Authentication
  cell (Bearer is primary, version and beta are their own piece); OpenAI cache marks ("none"
  is wrong); stop sequences, effort, parallel tool calls and reasoning display are pieces of
  their own; OpenAI's turn-order rule, its mid-stream error and its comment-line keep-alive
  are not in OpenAI's reference; "roles alternate" is not enforced by Anthropic (same-role
  turns are combined); the "cut output" cell describes neither format's documented behaviour
  (references only describe prefill, 400 on Claude 4.6 and later).
- Sub-agents still writing: `findings/ai-sdk.md` 192 entries, `pi.md` 170, `opencode.md` 82
  so far.
- Research file: `## Differences from the first cut` written from the references (wrong
  cells, missing cells, missing rows, two places where A1 contradicts A12/A20). Translation
  items still to be added to it.
- pi sweep finished: `findings/pi.md`, 269 entries, `check-findings.sh` prints `ok=269 bad=0`
  (run by me), clone clean. I read all 269 as rendered rows (title and condition). Xiaomi in
  pi: four providers, all `openai-completions`, compat `requiresReasoningContentOnAssistantMessages`
  and `thinkingFormat: "deepseek"` (`packages/ai/scripts/generate-models.ts:2457-2504`); an
  Anthropic-format Xiaomi row would get `allowEmptySignature` (`:1243`).
- `scripts/render_findings.py` renders the findings into one table per piece (Where, Format,
  What, When); the plan is to generate the translations section from the three findings files
  and keep the agents' full text (`does`) as files next to the brief.
- Waiting for the AI SDK and opencode sweeps. Then: render, read every row, open the source
  around the entries the digest relies on, write `## What three translations needed…`,
  `## Unverified`, the report; `pnpm run check`.
- All three sweeps finished: AI SDK 342 entries, pi 269, opencode 257 (61 from its older
  runtime `packages/opencode/src/provider/transform.ts`). `check-findings.sh`, run by me on
  each file: `bad=0`. Clones clean (`git status --porcelain` empty). I read all 868 as rendered
  rows and opened the source around 71.
- Research file: `## What three translations needed…` written — a hand-written summary
  (disagreements with the references, request pieces, response pieces, MiMo) followed by one
  generated table per piece holding all 868 entries (`scripts/render_findings.py render`).
  `## Unverified` written; `## Sources` now says how far each page was read. The file is
  about 231 kB.
- Decided not to add the sub-agents' findings files to the task folder: the spec gives a task
  four files. They stay in `/var/tmp/kuib-prior-art/research-pieces/findings/`.
- Next: last pass over "Differences from the first cut" for what the translations add;
  `pnpm run check`; `report.md`; `pnpm orchestra done research-pieces`.
- Research file complete: all eight sections of the brief. 23 request pieces (5 new), 18
  response pieces (4 new); 16 wrong cells and 20 incomplete ones listed against the first
  cut; 868 special cases by piece.
- `pnpm run check`: green (journal 0 errors, 0 warnings; typecheck, lint, format 48 of 48).
- `report.md` written, with twelve findings against the plan's tables and the plan updates.
- Done. Nothing in progress. If resumed: the saved pages, findings and scripts are under
  `/var/tmp/kuib-prior-art/research-pieces/`; the generated tables are rebuilt with
  `uv run --no-project python -I scripts/render_findings.py render ai=findings/ai-sdk.md pi=findings/pi.md oc=findings/opencode.md`.
