# research-routers — plan

Gate is `none`; this records the order of moves, nothing waits on it.

## Output

- `journal/features/inference/research/prior-art-routers-2026-10-08.md` — the research file,
  written section by section as findings are confirmed.
- `log.md`, `report.md` in this folder.

No other path in the repository is changed. No git writes, no `pnpm journal build` or `stamp`.

## Order of moves

1. Shallow clones into `/tmp/kuib-prior-art/research-routers/<repo>/`, commit recorded for
   each: `OpenRouterTeam/ai-sdk-provider`, `OpenRouterTeam/typescript-sdk`,
   `Portkey-AI/gateway`, the models.dev catalogue at its current home. Nothing cloned is
   installed, built or run.
2. Source pass per primary subject: comparisons on model ids and provider names, compatibility
   flags, `TODO`/`HACK`/`workaround`, patched dependencies, version gates. Count the special
   cases (axis B).
3. OpenRouter's documentation and public API (`/api/v1/models`, the endpoints of one model):
   slugs and suffixes, `reasoning` and `reasoning_details`, `cache_control`, provider routing
   and fallbacks, `supported_parameters`, what happens to an unsupported parameter.
4. Issue trackers, pull requests and changelogs of the four repositories, for harm caused by
   the abstraction: lost or rejected thinking signatures, cache misses, tool-call id
   collisions, dropped parameters, wrong stop reasons, miscounted usage, swallowed mid-stream
   errors, breaking changes.
5. models.dev consumers: how a tool that reads the catalogue makes up in code for what an
   entry cannot say (only as far as the catalogue's own repository and issues show it; opencode
   itself belongs to task research-opencode-pi).
6. Secondary subjects (Vercel AI Gateway, Helicone, Cloudflare AI Gateway, LiteLLM's proxy)
   only where a worst shape shows.
7. Rank the shapes against the plan's decisions, gaps and items; write `## Per subject`,
   `## What they do that this plan lacks`, `## Unverified leads`.
8. `pnpm run check`, `report.md`, `pnpm orchestra done research-routers`.

## Verification

- Every statement cites `owner/repo@<commit>:path:line` or a URL with the date read, and is
  marked CONFIRMED or INFERRED. A line cited from a sub-agent's search is reopened in the
  source before it is written down.
- `pnpm run check` passes.

## Undecided by the brief

- Nothing blocks. Where the models.dev repository has moved, the current home is recorded
  under `## What was read`.
- `gh` is not installed on this machine; issues are read through the public web pages and the
  unauthenticated GitHub API.
