# research-sdks — log

## 2026-10-08

- Read WORKER.md, the brief, `journal/features/inference/plan.md` (all),
  `research/structure-and-names-2026-10-08.md`, the four named sections of
  `engine-design-2026-10-07.md`, and the claims `^provider-factories`, `^provider-options`,
  `^model-config`.
- Cloned (sparse, depth 1) into `/tmp/kuib-prior-art/research-sdks/`: `ai` = vercel/ai
  `5028fa4`; `litellm` = BerriAI/litellm `8fc31b1`; `langchain` = langchain-ai/langchain
  `1f587e3`; `langchainjs` = langchain-ai/langchainjs `824d07b`. `gh` is not installed; issues
  are read over HTTP.
- Wrote `plan.md`.
- Next: source sweep per primary subject (axes A to J), then issue trackers and changelogs.
- 10:28:35: `/tmp/kuib-prior-art` was replaced, not by me, with a symlink to
  `/var/tmp/kuib-prior-art` (disk; the RAM-backed `/tmp` had reached 81%) and the contents
  moved. For about a minute my folder read as missing. Checked after: all four clones intact
  at the recorded commits, working trees clean; the brief's path still resolves. Consequence
  for evidence: any search run in that window may have seen missing files, so the three
  sub-agents were told to re-run them, and no "nothing found" is taken from a sub-agent
  without my own search.
- Launched three read-only sub-agents (AI SDK, LiteLLM, LangChain source sweeps, axes A to J).
  Their output is candidates only; every `path:line` is opened by me before it is cited.
- `gh` absent: issues read through the GitHub REST API (unauthenticated, search results saved
  with bodies under `_issues/`) and over HTTP. Helper scripts live in `_tools/`, outside the
  clones.
- Next: issue trackers for harm evidence (AI SDK first), then verify sweep candidates.
- Research file created with skeleton and an evidence ledger; 20 issues and one maintainer
  post confirmed and recorded there (AI SDK 7, LiteLLM 8, LangChain 5). GitHub API budget is
  shared with sibling workers (60/h per IP), so issue bodies are fetched sparingly.
- Next: vendor docs (Anthropic and Google OpenAI-compatible endpoints, Bedrock Converse), the
  AI SDK V1 spec from an old tag, then verification of sweep candidates as they arrive.
- LiteLLM sweep returned; every citation used was opened and read by me (identity, special
  cases, opaque data, stream, endings, usage, errors, drop_params, extension, bytes). Draft
  per-subject LiteLLM section (axes A to J) is in the research file. Also confirmed in the AI
  SDK source myself: V1 to V4 changes to usage, finish reason, reasoning signature and stream
  parts; `stream-text.ts:1611-1613` replaces `providerMetadata` per delta;
  `anthropic-language-model.ts:2743-2755` sends the signature as an empty reasoning delta;
  `map-anthropic-stop-reason.ts:13-29`.
- Next: AI SDK and LangChain sweeps (still running) → verify → per-subject sections → shapes
  set against the plan → report.
- All three sweeps returned (AI SDK, LiteLLM, LangChain). LiteLLM fully verified. AI SDK:
  identity, special cases, system messages, cache control, opaque data and chunk validation
  verified; stream, endings, retry, warnings, extension, bytes, migration guides still to
  verify. LangChain: nothing verified yet.
- AI SDK and LangChain sweeps verified line by line (every citation used was printed from the
  clone). AI SDK draft per-subject section is in the research file. Extra facts confirmed:
  npm publish dates (provider 1.0.0 2024-11-18, 2.0.0 2025-07-31, 3.0.0 2025-12-22, 4.0.0
  2026-06-25); AI SDK issues #11689, #19063, #21027 read; LangChain's positional rule for a
  system message (`_previous_turn_allows_system`, chat_models.py:667-679); AI SDK's and
  LiteLLM's per-model flags for Claude Sonnet 5.5 (rejects thinking disabled, budget thinking,
  forced tool use, sampling parameters).
- Shape list settled (15), most severe first: W01 payload in a name-keyed open record (HIGH,
  G006/G007) · W02 payload without origin, empty turn after a drop (HIGH, D009/G006) · W03
  degraded intent reported nowhere durable (HIGH, D003) · W04 reasoning word with a different
  meaning per model, "off" unavailable (HIGH, D016) · W05 endings collapsed, provider reason
  lost (HIGH, D013/P02-I02) · W06 format checked against the weakest schema (HIGH, P02-I02) ·
  W07 instruction position decided by the adapter (HIGH, D016/P04-I01) · W08 usage in one
  provider's arithmetic (HIGH, P02-I02) · W09 delta merge rule unknown to the accumulator
  (HIGH, P02-I02) · W10 unknown frames dropped silently (HIGH, P04-I02) · W11 errors
  classified by text, classification in a layer that knows no provider (HIGH, P03-I02) · W12
  rebuilt request differs from sent request (MEDIUM, P05-I01) · W13 differences as substring
  tests, rows as unproven claims (MEDIUM, P04-I01/I03) · W14 identity as a parsed string
  (MEDIUM, G007) · W15 built-ins on a private path (MEDIUM, G003).
- Next: read the research file, write the final version (prescribed sections only), run
  `pnpm run check`, write report.md, `pnpm orchestra done research-sdks`.
- Final research file assembled from verified parts (15 shapes, per-subject A to J for the
  three primaries, the brief's four questions, secondary subjects, five things the plan
  lacks, unverified leads). My own searches back every "nothing found" taken from a
  sub-agent. Parts kept under `/tmp/kuib-prior-art/research-sdks/_parts/`.
- Next: `pnpm run check`, report.md, `pnpm orchestra done research-sdks`.
- report.md written (findings W01 to W15 on one line each, plan updates, verification notes).
  Final `pnpm run check` and `pnpm orchestra done research-sdks` follow.
