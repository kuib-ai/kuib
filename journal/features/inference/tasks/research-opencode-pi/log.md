# research-opencode-pi — log

## 2026-10-08

- Read WORKER.md, the brief, `features/inference/plan.md`, `research/structure-and-names-2026-10-08.md`,
  `engine-foundation/research/opencode-llm-2026-10-07.md` and the four named sections of
  `engine-design-2026-10-07.md`.
- Cloned shallowly into `/tmp/kuib-prior-art/research-opencode-pi/`:
  - `opencode` — `sst/opencode@663fbd7` (2026-10-07T23:30:49-04:00)
  - `pi-mono` — `badlogic/pi-mono@1cedd32` (2026-10-08T00:23:06+02:00)
- Gate is `none`, so no plan-ready stop; `plan.md` records the order of work.
- Next: survey source layout, then read per axis; issues and changelogs after the source.
- Both repositories moved: `sst/opencode` → `anomalyco/opencode`, `badlogic/pi-mono` → `earendil-works/pi` (HTTP 301 on github.com, read 2026-10-08). `gh` is not installed; issues are read over HTTPS.
- Wrote `plan.md`.
- Read opencode `session/llm.ts`, `session/llm/{ai-sdk,native-runtime,native-request,request}.ts`, `session/llm/AGENTS.md`, `provider/transform.ts` lines 20-530 and 1218-1492.
  Evidence kept so far (all `anomalyco/opencode@663fbd7`, under `packages/opencode/src/`):
  - native gate by provider id and npm package name: `session/llm/native-runtime.ts:55-59`; native still runs `ProviderTransform.message` and `.providerOptions`: `:94`, `:100`; model chosen by npm string: `session/llm/native-request.ts:165-178`; two homes for continuation data: `native-request.ts:45-48`.
  - AI SDK only: tool-call repair `session/llm.ts:296-312`, raw chunks for Copilot `:295`, telemetry `:344`, `ProviderTransform.message` on the lowered prompt behind `@ts-expect-error` `:332-337`.
  - AI SDK adapter: unknown finish reason → `"unknown"` `llm/ai-sdk.ts:22-24`; metadata dropped whole when it fails the schema `:26-29`; `abort` emits nothing `:270-275`.
  - `provider/transform.ts`: `sdkKey` npm → options key, 25 arms `:42-98`; stored key remapped at send `:486-499`; cache marker written under six provider keys `:362-381`; eight-way OR to decide caching `:471-481`; `itemId` stripped `:501-515`; tool-call id scrub by `includes("claude")` `:224`, Mistral nine-character ids and a synthetic `Done.` turn `:254-301`; Azure gets options under two keys `:1475-1477`.
  - Counts in `provider/transform.ts` (commands in the research file): 96 lines testing a model id, 22 testing `providerID`, 57 testing `api.npm`, 103 `case` arms keyed on an npm package.
- Eight `@ai-sdk/*` packages are patched (`patches/`, `package.json:148-168`).
- pi: five compat interfaces at `packages/ai/src/types.ts:810-988`.
- Three read-only sub-agents running on the clones: pi compat counts and changelog origin; opencode patch contents; pi identity special cases. Their output is checked against the source before use.
- Next: opencode `packages/llm` (schema, events, anthropic-messages, shared, errors, executor), `message-v2.ts`, `processor.ts`, `retry.ts`; then pi `anthropic-messages.ts`, `transform-messages.ts`, types head, docs.
- Read opencode `packages/llm/src/{schema/messages,schema/events,schema/ids,schema/errors}.ts`, `protocols/anthropic-messages.ts` (whole), `protocols/utils/lifecycle.ts`, `DESIGN.md` (status, hooks, escape hatches, metadata, errors, migration), `session/message-v2.ts:225-436,619-747`, `session/retry.ts:85-155`, `session/processor.ts:100-121,416-498,641-697`.
  Evidence kept (all `anomalyco/opencode@663fbd7`):
  - Native Anthropic protocol knows one thinking form: body schema `{type:"enabled",budget_tokens}` `packages/llm/src/protocols/anthropic-messages.ts:151-154`; `lowerThinking` returns nothing unless `type === "enabled"` `:493-504` and accepts two spellings of the budget key `:497-500`. The AI SDK path defaults to `{type:"adaptive"}` with `blockBinding` `packages/opencode/src/provider/transform.ts:726-729`. So adaptive thinking is dropped without a report on the native path.
  - Signature only reaches an event through `reasoningEnd`, which is a no-op for a block that never produced text: `anthropic-messages.ts:686,717,728-742`, `utils/lifecycle.ts:51-57`. A thinking block with empty text and a signature loses the signature. No `redacted_thinking` anywhere in `packages/llm/src` (grep `redacted`: only header redaction).
  - Two homes for a signature: `part.encrypted ?? signatureFromMetadata(part.providerMetadata)` `anthropic-messages.ts:453`, same in `bedrock-converse.ts:255-256`; OpenAI keeps its ciphertext in `providerMetadata.openai.reasoningEncryptedContent` `openai-responses.ts:285-297,642`.
  - Stop reasons: six values `schema/ids.ts:39`; `pause_turn` → `stop`, `refusal` → `content-filter`, anything else → `unknown` `anthropic-messages.ts:558-564`; the raw value is not kept.
  - A response exists only after `finish` or `provider-error`: `schema/events.ts:594-602`; tool input in flight never becomes content (`reduceToolCall` only) `:526-529`.
  - `PreparedRequest.body` is `Schema.Unknown` `schema/events.ts:297-304`; every frame is decoded through a schema `route/protocol.ts:82`.
  - Model id checks already inside the rewrite: `anthropic-messages.ts:356` (`=== "claude-opus-4-8"`), `providers/github-copilot.ts:19-24`, `providers/openai-options.ts:49,60`.
  - Model change: `differentModel` is a string compare of `providerID/modelID`; metadata dropped and reasoning turned into a text part `packages/opencode/src/session/message-v2.ts:255,293,376-383`. Empty-text separator hack with the maintainers' "It is unclear whether this shape originates in our stream processing" `:272-289`. A failed assistant message is skipped whole on replay `:258-266`.
  - Errors: native `provider-error` event becomes `throw new Error(value.message)` `session/processor.ts:421-422`; `fromError` only knows the AI SDK's `APICallError`/`LoadAPIKeyError` `session/message-v2.ts:619-747`; retry then falls to message regexps `session/retry.ts:148-154`. The native taxonomy (`packages/llm/src/schema/errors.ts:34-190`) is unused by the session.
  - `inputTransformations` is read from the open record `session/processor.ts:441-443` and written only by the patched `@ai-sdk/anthropic` (`patches/@ai-sdk%2Fanthropic@3.0.111.patch:142,168`).
  - `DESIGN.md:8-14` "clean break; do not preserve compatibility aliases"; `:1071-1092` table of what the redesign removes (`providerOptions` → model-typed `provider`, one `LLMError` → tagged union, one event union → two, `providerExecuted` → constructors).
  - Plugin hooks mutate an `output` object: `packages/plugin/src/index.ts:234-334`.
- Next: pi source (`anthropic-messages.ts`, `transform-messages.ts`, `types.ts` head, `models.ts`, docs), then issue trackers, then the research file.
- Patch sub-agent returned; verified against the patch files: three patches turn a closed `reasoningEffort` enum into `z.string()` (`patches/@ai-sdk%2Fgroq@3.0.31.patch:47-48`, `…xai@3.0.139.patch:93-94`, `…mistral@3.0.51.patch:75-77`); `…openai@3.0.88.patch:9-12` removes the per-model `serviceTier` gate; `…anthropic@3.0.111.patch:133` adds the `thinking-binding-controls-2026-08-01` beta; `…openai-compatible@2.0.41.patch:9-10` passes the whole stream error; `…google@3.0.73.patch:65-69` pops an empty model entry. Reason for the binding patch in the maintainers' words: `packages/opencode/src/provider/transform.ts:703-708`. `packages/opencode/test/patched-dependencies.test.ts:4-8`: a bumped dependency silently loses its patch.
- Read pi (`earendil-works/pi@1cedd32`, `packages/ai/`): `src/types.ts:14-113,140-245,356-635,760-1191`, `src/api/transform-messages.ts` (whole), `src/api/anthropic-messages.ts:196-229,1395-1512,1611-1639`, `scripts/generate-models.ts:1236-1250,2450-2500`, `CHANGELOG.md` (breaking sections and Xiaomi entries).
  Evidence kept:
  - Identity: `KnownProvider` has four Xiaomi ids, three Qwen token-plan ids, `-cn` twins `src/types.ts:43-86`; `ProviderId = KnownProvider | string` `:86`; `Api = KnownApi | (string & {})` `:29`. Xiaomi rows differ only in `baseUrl` `scripts/generate-models.ts:2461-2478`. Breaking endpoint switch `CHANGELOG.md:1077`; regional ids added `:1081`; format switched to `openai-completions` after #4505 `:1015`; Azure renamed because its id named a format `CHANGELOG.md:47`.
  - Compat: 5 interfaces `src/types.ts:810-988`. Published catalogue `@earendil-works/pi-ai@1.1.0` (npm tarball, `dist/providers/data/*.json`, read 2026-10-08): 1,563 chat entries, 41 providers, 1,101 distinct ids, 1,305 entries carry `compat`. Per-field counts are in the research file; script `/tmp/kuib-prior-art/research-opencode-pi-scripts/count-compat.mjs`. The catalogue is not in git: `.gitignore:11` `packages/ai/src/providers/data/`.
  - `sendSessionIdHeader` boolean removed for an enum `CHANGELOG.md:625`; `compat.reasoningEffortMap` moved to `Model.thinkingLevelMap` `:1096`; `Context` → `TranscriptContext` `:200`; global API moved to `/compat` `:738`. 214 version headings, 27 breaking sections, 485 fixed bullets, 234 added bullets (awk over `CHANGELOG.md`).
  - Hand-off: `isSameModel` = provider + api + model id `src/api/transform-messages.ts:95-98`; redacted dropped `:104-106`; thinking → text `:111-116`; `thoughtSignature` deleted `:131-134`; errored and aborted assistant messages skipped whole `:195-203`; system message held until tool results `:163-166,216-221`.
  - Anthropic adapter: unknown stop reason throws `src/api/anthropic-messages.ts:1635-1637`; `refusal` → `error` `:1624-1628`; `pause_turn` → `stop` `:1629`; unsigned thinking → text unless `allowEmptySignature` `:1416-1431`; OpenRouter detected by provider or URL `:216`; OAuth renames tools `:124,1443`; Xiaomi gets `allowEmptySignature` at generation `scripts/generate-models.ts:1243-1245`.
  - Events carry a shared mutable `partial` `src/types.ts:781-804`; opaque fields `textSignature`, `thinkingSignature`, `redacted`, `thoughtSignature` `:401-431`; `StopReason` seven values plus `rawStopReason` `:456,569`; neutral `ToolChoice = "auto" | "none"` `:88`; `onPayload` over `unknown` `:159`.
- Issues read 2026-10-08 (GitHub API until rate-limited, then the public pages):
  opencode #16748, #39291, #22813, #51481, #24097, #18108, #37745, #52225, #23926, #18099, #13838, #14065, #5750;
  pi #4505, #4678, #1870, #978, #6167, #10324, #9048, #7067, #9508, #2946, #6445, #9335, #4342.
  Seen in search only, not opened: opencode #11546, #24190, #24722, #20698, #42935; pi #3208, #8166, #3636, #9502 (leads unless opened later).
- Next: write the research file; fold in the two remaining sub-agents (pi compat origin in the changelog; pi identity checks) after checking them; then `report.md`, `pnpm run check`, `pnpm orchestra done`.
- The two remaining sub-agents returned. Reproduced pi's raw counts (36 provider equalities, 21 address tests, 55 id tests over 142 files) and reopened every line cited from them: `detectCompat` `packages/ai/src/api/openai-completions.ts:1589-1690`, the generator's diverged copy `scripts/generate-models.ts:749-750`, opposite defaults of `supportsStrictMode` (`openai-codex-responses.ts:537`, `openai-responses.ts:88`), and the changelog lines that introduced nine settings under "Fixed".
- `/tmp/kuib-prior-art` became a symlink to `/var/tmp/kuib-prior-art` at 10:28, not by this task; the clones are intact at the recorded commits.
- The GitHub API rate-limited this address after 15 issue reads; the remaining issues were read from their public pages. Twelve issues seen only in search results are listed as leads.
- Wrote `journal/features/inference/research/prior-art-opencode-pi-2026-10-08.md`: fifteen shapes (seven HIGH, seven MEDIUM, one LOW), both subjects on axes A to J, five things the plan lacks, leads. Corrected five line references after re-checking them.
- Wrote `report.md`.
- `pnpm run check`: exit 0; journal check 0 errors, 0 warnings; typecheck, lint, format green for 16 projects.
- Done: `pnpm orchestra done research-opencode-pi`.
