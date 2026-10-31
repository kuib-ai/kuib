# research-pieces — plan

Gate is `none`; this records the order of moves, not a request for approval.

## Output

- `journal/features/inference/research/format-pieces-2026-10-08.md` — the research file, with
  the frontmatter and sections the brief fixes.
- `plan.md`, `log.md`, `report.md` in this folder.

Nothing else in the repository is written. No code changes, no git writes, no
`pnpm journal build` or `stamp`, no call to any model API, `.env` not read.

## Sources

- Reference pages, downloaded as served into `/var/tmp/kuib-prior-art/research-pieces/` so
  that every cell can be checked against a file on disk, each cited with its URL and the date
  read:
  - Anthropic, `platform.claude.com/docs` (the `.md` form of each page): Messages create,
    streaming, thinking and effort, prompt caching, tool use, system messages in the middle of
    a conversation, stop reasons, errors, rate limits, versioning and beta headers, the models
    page.
  - OpenAI: the chat completions reference and its streaming objects. If the reference page
    cannot be fetched as served, the OpenAPI document the reference is generated from, cited
    with its repository and commit or its URL and date.
  - MiMo, `mimo.mi.com/docs`: the Anthropic-compatible page and the OpenAI-compatible page.
- Three translations, read only, at the commits the brief names, checked before citing:
  `vercel/ai@5028fa4`, `badlogic/pi-mono@1cedd32`, `sst/opencode@663fbd7`.

## Order of moves

1. Check the three commits. Download the reference pages. Verified by: HTTP status and a read
   of each file's head; the list goes into `## Sources`.
2. Write the skeleton of the research file with the pieces of the plan's first cut as rows,
   then fill the two tables piece by piece from the pages on disk. Verified by: every cell
   names a page and the text it rests on is found in the saved file by search.
3. `## Rules a piece carries`, from the same pages: required fields, order rules, limits, and
   what the endpoint answers when a rule is broken.
4. Sweep of the three translations, one read-only sub-agent per repository, each returning
   `path:line` with the line quoted. Their output is candidates only: every line is printed
   from the clone and compared with the quote before it is cited, and a "nothing found" rests
   on my own search. Verified by: a script that prints each cited line.
5. MiMo's two pages for the column of differences.
6. `## What each piece needs said neutrally`, `## Pieces left out`,
   `## Differences from the first cut`, `## Unverified`.
7. `pnpm run check`; `report.md` with the pieces to add to or remove from the plan's tables;
   `pnpm orchestra done research-pieces`.

## Left undecided by the brief

- Where a reference page cannot be fetched as served, a machine-readable form of the same
  reference is used and named as such. A cell that rests only on a translation says so.
- A model's behaviour that only a capture can show (for example whether a rule is enforced)
  is listed under `## Unverified`, not guessed.
