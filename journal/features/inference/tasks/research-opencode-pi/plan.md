# research-opencode-pi — plan

Gate is `none`; this records the order of work, not a request for approval.

## Writes

- `journal/features/inference/research/prior-art-opencode-pi-2026-10-08.md` — the research file.
- `journal/features/inference/tasks/research-opencode-pi/{plan,log,report}.md`.

Nothing else in the repository is touched. Clones live in
`/tmp/kuib-prior-art/research-opencode-pi/{opencode,pi-mono}` and are only read.

## Order

1. Source, opencode at `663fbd7`: `packages/llm` (schema, protocols, route, `DESIGN.md`,
   `AGENTS.md`), `packages/opencode/src/session/llm*`, `provider/transform.ts`,
   `provider/provider.ts`, `provider/error.ts`, `session/retry.ts`, `session/message-v2.ts`,
   `packages/plugin`, `patches/@ai-sdk*`.
2. Source, pi at `1cedd32`: `packages/ai/src/{types,compat,models,models.generated}.ts`,
   `api/*`, `api/transform-messages.ts`, `scripts/generate-models.ts`, `CHANGELOG.md`;
   `packages/coding-agent/docs/{models,custom-provider,providers,session-format}.md`.
3. Counts: every decision by model id or provider name in both; pi's compatibility settings
   and how many models carry each.
4. Issue trackers and changelogs, for harm caused by the abstraction: signatures, cache
   misses, tool-call ids, dropped parameters, stop reasons, usage, mid-stream errors, aborts,
   breaking changes.
5. Write the research file as findings land; rank the shapes against the plan's decisions,
   gaps and items; then `report.md`, `pnpm run check`, `pnpm orchestra done`.

## Verification

- Every statement carries `owner/repo@commit:path:line` or a URL with the date read, and is
  marked CONFIRMED or INFERRED.
- Counts are produced by a stated search, and the search is written next to the count.
- What a sub-agent returns is opened in the source before it is cited.

## Undecided by the brief

- Both repositories have moved (`sst/opencode` → `anomalyco/opencode`, `badlogic/pi-mono` →
  `earendil-works/pi`). Citations use the current owner and name.
