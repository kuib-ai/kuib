# research-sdks — plan

Gate is `none`; this records the order of moves, not a request for approval.

## Output

- `journal/features/inference/research/prior-art-sdks-2026-10-08.md` — the research file, in
  the frontmatter and sections the brief fixes.
- `log.md`, `report.md` in this folder.

Nothing else in the repository is written. No git writes, no `pnpm journal build` or `stamp`.

## Sources

Sparse shallow clones under `/tmp/kuib-prior-art/research-sdks/`, read only, never installed,
built or run:

| Folder | Repository | Commit | Committed |
|---|---|---|---|
| `ai` | `vercel/ai` | `5028fa4` | 2026-10-08 |
| `litellm` | `BerriAI/litellm` | `8fc31b1` | 2026-10-07 |
| `langchain` | `langchain-ai/langchain` | `1f587e3` | 2026-10-07 |
| `langchainjs` | `langchain-ai/langchainjs` | `824d07b` | 2026-10-07 |

Issues, pull requests, changelogs and vendor documentation are read over HTTP (`gh` is not
installed), each cited with its URL and the date read.

## Order of moves

1. Source sweep of the three primary subjects on axes A to J. One read-only sub-agent per
   subject searches its clone and returns `path:line` candidates; every candidate is opened
   and checked by me before it is cited. Verified by: the cited line reads as quoted.
2. Issue trackers, changelogs and migration guides for the harm each shape caused: thinking
   signatures lost or rejected, cache misses from a re-rendered prefix, tool-call id
   collisions, dropped parameters, wrong stop reasons, miscounted usage, swallowed mid-stream
   errors, breaking changes to the format. Verified by: the page itself is opened, never a
   search summary.
3. The four questions of the brief: breaking changes per neutral format and what forced each;
   what rides in open records; lowest common denominator lag; what OpenAI's chat shape cannot
   represent.
4. Secondary subjects only where a worst shape shows: Bedrock Converse, the OpenAI-compatible
   endpoints of Anthropic and Google, TanStack AI, Mastra's router.
5. Each shape set against the plan: the decision, gap or item it bears on, and severity by the
   brief's rule (HIGH shared or open, MEDIUM avoided by a ruling but an item could bring it
   back, LOW a warning).
6. `pnpm run check`, `report.md`, `pnpm orchestra done research-sdks`.

Findings go into the research file as they are confirmed, progress into `log.md`.

## Left undecided by the brief

- Nothing blocks. A finding against a decision that carries a `Ruling` is written as a risk
  that ruling carries, never as a proposal to reverse it.
