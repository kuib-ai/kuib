---
status: "accepted"
role: "reviewer"
gate: "none"
items: ["P07-I02"]
grant: ["journal/features/inference/tasks/research-variants/**","journal/features/inference/research/variants-per-piece-2026-10-14.md"]
agent: "claude"
command: "choom -n 800 -- claude --dangerously-skip-permissions --model claude-opus-5-5 --effort max --mcp-config '{\"mcpServers\":{}}' --strict-mcp-config"
cwd: "/home/rs10/developer/kuib-ai/kuib"
session: "kuib-ai/kuib/root"
started: "2026-10-14T01:57:42"
finished: "2026-10-14T02:30:45"
reported: "accepted"
---
# research-variants — the variants each piece needs, read from the recorded exchanges

Feature: journal/features/inference/ · Item: P07-I02 · Roadmap: R020

## Objective

The table of pieces (`journal/features/inference/research/format-pieces-2026-10-08.md`) lists
what a request says and what a response carries in the two formats, from documentation. Since
then 709 real exchanges were recorded under
`packages/inference/fixtures/<messageFormat>/<provider>/<model>/<case>/`. Read them and say,
for each piece, which variants the served models actually need. This is the evidence the
neutral format and the blocks are drawn from, so a cell is worth exactly its proof.

## What to deliver

Write `journal/features/inference/research/variants-per-piece-2026-10-14.md` with:

1. **Variants per piece.** For each of the pieces of the table, in its order: the variants
   seen, and for each of the six rows (Claude Sonnet 5.5, Haiku 5.5, Haiku 4.5 at Anthropic;
   MiMo 2.6 Pro at Xiaomi on Anthropic Messages and on OpenAI chat; Muse Spark 1.1 at Meta)
   which variant it takes. Every cell is marked measured, with the path of the fixture that
   shows it; documented, with its reference; or assumed. A status of 200 proves a request
   shape was accepted and nothing more: do not call a cache hit, a consumed signature or an
   honoured setting measured unless the response shows it.
2. **What the captures contradict.** Each cell of the pieces table that a fixture shows to be
   wrong, with the fixture.
3. **The gaps the captures were meant to settle**, each answered from fixtures or said to be
   still open: G008, G009, G014, G015, and what the captures add to G006, G012, G018 and
   G021 of the feature plan.
4. **The MiMo endpoint.** Under D005 an offering names one format. Say which of the two
   endpoints the MiMo offering should use, on the evidence.
5. **What is still unmeasured**, and the few further captures that would settle the most,
   in order of worth.

And in your task folder, `case-names.json`: for every case folder, the piece and the variant
it shows, as the name the folder will take. Today's names are ad hoc, and 52 carry suffixes
such as `-signed`, `-repeat` and `-diagnostic` that say how the fixture came about, not what
it shows. Give each piece one word and each variant one word, kebab-case, fit to be enum
values; a case that shows the same thing on two models has the same name on both. List the
words once, with the piece of the table each stands for. A case that shows nothing a piece
needs is listed as such, not forced under one.

## How to read 709 cases

Do not read bodies into your context wholesale. Write small read-only scripts under
`/var/tmp` that tabulate what a question needs (status, stop reason, block types, usage
fields, which settings a request body carries) and open single bodies when a cell depends on
the detail. Run Deno from outside the repository root or with `--no-lock`; never with a
`jsr:` or `npm:` import from the root without it.

A case holds `request.json` (the envelope: message format, provider, model, name, url,
headers), `request.body`, `response.json` (status and stored headers), `response.body`,
`transport.json` (read lengths, hash, whether the stream was complete or cut) and
`fixture.json`. Another agent is tidying the envelopes while you work: `sequence.json`, which
today names the fixture a request was built from, is being folded into `request.json` as
`replay`, and `row` and `price` are leaving the envelope. Bodies and paths do not change.
Two cases under Haiku 4.5 have no response; they were refused when recorded.

Twenty-six fixtures carry the Anthropic organization id inside a Haiku 4.5 signature, each
flagged in its `transport.json`. The owner allows it there. Never decode or print it.

## Context

Read these:

- AGENTS.md: the working rules, above all the one on names.
- journal/features/inference/plan.md: Objective, Principles, "The pieces", P07, the decisions
  D003, D005, D006, D009, D013 to D016 and D026 to D029, and the gaps G006 to G021.
- journal/features/inference/research/format-pieces-2026-10-08.md: the table. It is large;
  read the two tables, the rules per piece and every "Unverified" list.
- journal/features/inference/research/prior-art-synthesis-2026-10-08.md.
- journal/features/inference/tasks/capture-traffic/report.md and provider.notes.json: what was
  sent, what was skipped and why, and the first reading of the results. Its paths are the
  old ones; `journal/features/inference/tasks/rename-fixtures/migrate.ts` holds the mapping.

## What the owner asks of all work

In his words, 2026-10-14: "i think every part of the codebase must be uniform"; "please keep
all of the code symmetric and uniform"; "everything must have a good reason for being present
there". For this task: one word for one idea across pieces, variants and rows; a variant is
named for the behaviour, never for a model or a provider; nothing in the table that is not
proven or marked as not proven.

## Scope

- Read only. You write the research file and files in your task folder, nothing else. No
  code, no fixture, no plan and no other task is changed; propose plan changes in the report.
- No request to any provider, no read of `.env`.
- This machine has 8 GB of memory and `/tmp` is memory: scratch under `/var/tmp`, one process
  at a time, no test runs and no gate. Three other agents are working in this tree.
- No git writes. No sub-agents.
- End the report with the names you introduce, each with the sibling it mirrors, and with
  any asymmetry you noticed.
