---
task: capture-traffic
---

# capture-traffic — report

Status: done

## Summary

The capture tool and its loopback tests are complete. The approved provider calls finished at
ledger ordinal 709: 709 unique starts and finishes, 707 stored response sets, and two earlier
sensitive-data refusals whose response artifacts remain absent. The append-only reviews and
reprices leave an effective cost or reservation of USD 0.369819036. Audit passed over all 4,957
fixture files. Every approved MiMo row is captured on the replacement key. Fourteen named
Anthropic/Meta rows remain unattempted because their source lacked the required block or
partial content, or because an optional seed variant was unnecessary; none was retried or
invented.

## Files

- `tooling/capture.ts`, `tooling/capture.test.ts`, package manifest and fixture exclusions —
  the credential-safe capture, sequence, review and audit tool with loopback coverage.
- `packages/inference/fixtures/<offering>/<case>/` — exact request and response bytes,
  metadata, chunk boundaries, hashes and strict `fixture.json` descriptions.
- This task's `rows.priced.json`, `recipes.messages.json`, `recipes.chat.json`,
  `recipes.mimo.messages.json`, `recipes.mimo.chat.json`, `ledger.jsonl`, `observations.jsonl`,
  `progress.json`, `provider.notes.json`, `log.md` and `report.md` — approved recipes,
  append-only call/review history, safe observations and handoff state.
- Scratch builders and drivers live under `/var/tmp`; no request body, header value or key was
  printed to this report.

## Plan updates for the orchestrator

- P01-I01 — implemented: one prepared request is the fixture request, exact response bytes
  are retained, and the offline loopback suite verifies key exclusion, chunk boundaries,
  refusal diagnosis, scoped stops, budget reviews and audit rules.
- P01-I02 — captured: Sonnet 5.5 and both Haiku models have plain, signed-thinking tool,
  cache, cut, inline instruction, effort and rejection evidence. The Sonnet/Haiku signed
  repeats close the initial missing-thinking tool seed gap.
- P01-I03 — captured: MiMo 2.6 Pro Messages on the Singapore token-plan host with
  `api-key`; its tool seed has a thinking block followed by a real `tool_use`, and its replay,
  inline system, forced choice, cache and rejection cases are stored. Bearer and `x-api-key`
  also answered on that route; the pay-as-you-go Messages host returned 401 with this key.
- P01-I04 — captured: MiMo 2.6 Pro Chat on the Singapore token-plan host with
  `Authorization`; the native `reasoning_content` tool round, nonautomatic choice,
  output-limit `length`, terminal usage and `[DONE]` are stored.
- P01-I05 — all 226 named MiMo cases, 384 Anthropic calls and 99 Meta calls were sent as
  authorized. The 14 unattempted Anthropic/Meta names are listed under Findings and in
  `provider.notes.json`; they are conditional variants or depend on absent source content.
  Each provider note records status counts, effective cost and remaining rows.

## Journal

The `infra/provider-captures` claim was verified and stamped during tool implementation.
This continuation changed task data and fixtures only; no linked source scope changed.
The owner rulings that released organization-id body data and the replacement MiMo key are
recorded in the inference feature plan. The transport flag marks every fixture permitted to
carry the organization id; the response header itself is excluded.

## Verification

- Real `Testing.loadFixture` and SHA-256 verification covered all 709 requests and 707
  responses: 1,190,616 raw response bytes, 475 SSE responses, 462 terminal streams and 13
  cancelled or read-failed streams. The two historic refused responses have no response files.
- `pnpm capture audit` passed on all 4,957 fixture files after the final call. It scanned
  all three named keys, identity headers, and base64-decoded UUID shapes under the approved
  organization-id transport rule. No key or identifying response header is stored.
- `pnpm run check`: green through `/var/tmp/kuib-guard.sh 30 1500 --`; all adapter,
  journal, format and circular checks passed, with 53 successful Nx tasks across 18 projects
  (50 cached). The capture loopback suite remains green.

## Provider notes

| Provider / format | Calls | HTTP 200 | 4xx | Effective USD | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Anthropic Messages (S/H/L) | 384 | 233 | 151 | 0.242935295 | Signed tool rounds and required Claude cases captured; 11 conditional or missing-source names unattempted. |
| MiMo Messages (MA) | 119 | 114 | 5 | included below | Native thinking/tool blocks; marked cache reads and three working Singapore auth headers. |
| MiMo Chat (MO) | 107 | 96 | 11 | 0.020371041 total MiMo | Reasoning-content tool round, final usage and output-limit stop; two read-failed streams retained. |
| Meta Chat (MT) | 99 | 61 | 38 | 0.106512700 | Muse Spark 1.1 cases captured; three cut follow-ups lack an observed source part. |

MiMo Messages covers more of the settings tested in both formats: on 36 shared completed case
names, Messages answered 31 and Chat 29. Only Messages answered the shared `effort-xhigh` and
`effort-max` requests. The endpoints expose different native blocks, so this comparison is
about this approved matrix. The Singapore token-plan host admitted both formats; the
pay-as-you-go host refused the tested key. The current engine uses the Chat route; the
Messages route covers more of these probes.

## What the captures change in the pieces table

- The table says MiMo Messages has a signature in a nonstreamed thinking response and no
  `signature_delta` in its stream. The captured nonstreamed tool seed and reasoning answer
  have thinking but no signature; the reasoning stream contains a `signature_delta`.
  MiMo accepted the same tool round with an empty signature, without one, and with a Sonnet
  signature. These are acceptance observations, not proof of signature validation.
- The OpenAI-format rule that usage appears only when `include_usage` is true does not hold
  for MiMo Chat: both omitted and false settings returned usage in a terminal stream, with
  `[DONE]`. The one-token output case ended with `finish_reason: length` and usage.
- MiMo Messages accepted the unlisted `x-api-key`, version and beta headers, `metadata`,
  `top_k`, inline system placements and several cache marks. The 5m and 1h reads reported
  1,664 cached input tokens. MiMo Chat implicit, explicit and no-options reads each reported
  1,152 cached prompt tokens. HTTP 200 does not establish that every accepted switch changed
  model behavior.
- MiMo Chat returned 400 for `reasoning_effort` minimal, xhigh and max; MiMo Messages
  answered its xhigh and max effort probes. Sonnet continuation from a MiMo Messages seed
  returned 400; MiMo Messages continuation from a signed Sonnet seed answered 200.
- MiMo Chat `choice-function` and `top-p-changed` ended HTTP 200 with `read-failed` transport
  state and no terminal marker. Their bytes and reservations remain as captured; no repeat
  was authorized.

## Findings

- Four unattempted S/H tool replay mutations and two S/H cache-thinking originals lacked
  thinking in their first seed; later signed repeats supply the intended evidence.
- `S/cut-thinking-replay` lacked partial thinking in its first cut; the signed repeat was
  captured. Three Meta cut follow-ups lacked an observed source part and were skipped.
- Four optional S/H signed seed max/hard variants were unnecessary because the first signed
  seed succeeded. No request was sent for an unused variant.
- The 14 exact row names remain in `provider.notes.json` and the matrix, with no fabricated
  response fixture. No MiMo row remains.

## Names

| Introduced name | Sibling mirrored / owner review |
| --- | --- |
| tooling/capture.ts, pnpm capture | tooling/test.ts, pnpm test |
| tooling/capture.test.ts | tooling/test.test.ts |
| Capture | Testing, Tools default namespace objects |
| @kuib-ai/inference, Inference, src/index.ts | @kuib-ai/tools, Tools and its public barrel |
| CaptureRequest, CaptureOptions, CaptureResult | Request/ProviderOptions; capture request/result pair |
| SequenceOptions, SequenceResult | CaptureOptions/CaptureResult with the same sequence derivation |
| PreparedRequest | CaptureRequest after preparation; no exact sibling — owner review |
| Provider, Price, LedgerEntry | local capture data types; no exact sibling — owner review |
| CaptureError | capture-prefixed error; no exact existing error sibling — owner review |
| OUTPUT_LIMITS | existing LIMITS constant |
| excludedHeaders / responseHeaders | matched header grouping; identity/unknown counts have no exact sibling — owner review |
| consecutiveFailures, consecutive-transient-failures | new transient-streak counter/reason; no exact sibling — owner review |
| authenticationScope | new host/path/header stop key; no exact sibling — owner review |
| LedgerEntry.authHeader | mirrors CaptureRequest.authHeader / PreparedRequest.authHeader; name only, never the credential value |
| progress.json | task continuation data; no exact sibling — owner review |
| capture, runSequence, prepare, loadKey, audit | capture mirrors orchestra's capture; runSequence mirrors runTargets; remaining operations have no exact sibling — owner review |
| parseJson, bytesHash, write, main, fail, validateProvider, readPrepared | parseFrontmatter/parseRecord, fileHash, agents write, runner main/fail, validateOwnership and readLock patterns |
| object, number, scan, sensitiveValues, safePath, validate, ledger, append, reserved, allowance, frames, cutAt, usageOf, costOf, stopOf, captureExchange, keyFromFile | local capture helpers; no exact sibling — owner review |
| ROOT | existing tooling ROOT |
| FIXTURES, TASK, ENCODER, MAX_BYTES, KEYS, ORIGINS, AUTH, REQUEST_HEADERS, RESPONSE_HEADERS, IDENTITY_HEADER, RATE_HEADER, NAME | capture-specific constants; no exact sibling — owner review |
| fixture.json, shows, origin | existing strict fixture convention |
| 001.request.json / 001.response.json | symmetric request/response metadata |
| 001.request.body.json / 001.response.bin | request/response byte files; planned format-specific suffixes — owner review |
| 001.chunks.json, sequence.json, ledger.jsonl / ledger.jsonl.lock | new transport/sequence/ledger artifacts; no exact sibling — owner review |
| rows.priced.json, stage-a.observations.json / .jsonl, stage-a.ledger.summary.json | capture data/checkpoint artifacts; no exact sibling — owner review |
| anthropic-messages-claude-sonnet-5-5, anthropic-messages-claude-haiku-5-5, anthropic-messages-claude-haiku-4-5-20251001 | same provider-format-model offering derivation |
| mimo-messages-mimo-v2-6-pro, meta-chat-muse-spark-1-1 | same derivation; model dots become folder hyphens, wire model ids remain exact |
| plain-json / plain-stream / plain-default | sibling plain cases for false/true/omitted stream |
| host-sgp | mirrors the approved later host-api case; both approved Chat hosts have now been called |
| plan.md, log.md, report.md | standard worker task filenames |

Existing naming asymmetries previously noted in provider tests/legacy MiMo defaults remain
untouched. New names without exact siblings are explicitly flagged above.


Additional continuation names:

- observations.jsonl — mirrors stage-a.observations.jsonl.
- probe.paths.json and s.batch.paths.json — mirror stage-a.paths.json; the same path-array shape.
- recipes.messages.json and provider.notes.json — new recipe/note artifacts with no exact
  sibling; owner review.
- skipped.jsonl — append-only row/reason data; no exact sibling, owner review.
- progress.globalControls — mirrors progress.providerControls at global scope.
- provider-note fields safeRecordedResponses and completeMatrix — no exact sibling, owner review.
- mimo-chat-mimo-v2-6-pro — same provider-format-model derivation as mimo-messages-mimo-v2-6-pro.
- host-api — mirrors host-sgp; both are approved host-probe cases.
- All new fixture suffixes — reuse the approved case names across S/H/L offerings; no
  second word for the same setting. Existing engine/default naming asymmetries remain unchanged.

Additional diagnostic names:

- ScanMatch / ScanDiagnosis — paired scan result/diagnosis types; no exact existing sibling, owner review.
- CaptureError.match / LedgerEntry.diagnosis — derive from ScanMatch / ScanDiagnosis.
- LiftedLedgerEntry — mirrors LedgerEntry; kind=lifted follows started/finished past-tense forms.
- Capture.liftStop / pnpm capture lift — use the existing stop noun; no exact operation sibling, owner review.
- diagnosticRepeatOf — the same marker on CaptureRequest, PreparedRequest, sequence and LedgerEntry; no exact sibling, owner review.
- tool-seed-diagnostic / L/tool-seed-diagnostic — derive from tool-seed / L/tool-seed; new diagnostic suffix, owner review.
- diagnostic.observations.json / diagnostic.paths.json — mirror stage-a.observations.json / stage-a.paths.json.
- ScanDiagnosis.kind/header/length/form/blob — safe metadata fields; no exact diagnosis sibling, owner review.
- LiftedLedgerEntry.ordinal/time — reuse LedgerEntry.ordinal/time. Its reviewer/reason fields have no exact capture sibling; owner review.


Additional strengthened-scan and hold names:

- base64Bytes — mirrors bytesHash's source/target word order (base64 to bytes, bytes to hash).
- CaptureError.fixture — mirrors CaptureResult.fixture and LedgerEntry.fixture.
- encoded-uuid — new static audit code; no exact UUID sibling, owner review.
- rows.held.json — mirrors rows.priced.json (rows, then classification).
- checkpoint.observations.json — mirrors diagnostic.observations.json / stage-a.observations.json.
- h.batch.paths.json and l.batch.paths.json — mirror s.batch.paths.json.


Additional Meta continuation names:

- recipes.chat.json — mirrors recipes.messages.json; native endpoint-format descriptor data.
- mt.batch.paths.json and tail.batch.paths.json — mirror s/h/l.batch.paths.json.
- meta.observations.json — mirrors checkpoint.observations.json / diagnostic.observations.json.
- group-stops.jsonl — mirrors skipped.jsonl's group/row outcome record shape; no exact stop-artifact
  sibling, owner review. Its scratch-classifier review does not lift or rewrite any ledger stop.
- provider argument to cutAt — mirrors request.provider and validateProvider; no new wire name.
- Every new Meta fixture case — reuses the same approved setting/case names as MO/S/H/L siblings.


Additional signed-repeat names:

- signedRepeatOf / ceilingRepeatOf — mirror diagnosticRepeatOf on request/sequence/ledger,
  with original row strings because some sources were skipped and have no original ordinal.
- recipes.signed.json — mirrors recipes.messages.json / recipes.chat.json.
- signed.batch.paths.json — mirrors mt.batch.paths.json / tail.batch.paths.json.
- signed.observations.jsonl / signed.observations.json — mirror stage-a.observations.jsonl /
  checkpoint.observations.json and diagnostic.observations.json.
- progress.signedControls — mirrors progress.globalControls / providerControls; selectedSeeds,
  unneededVariants and gaps have no exact capture sibling and are flagged for owner review.
- tool-seed-signed / tool-seed-signed-max / tool-seed-signed-hard — derive from tool-seed /
  tool-seed-diagnostic; signed/max/hard suffixes name the three authorized variants, owner review.
- All other *-signed cases — mirror their original approved S/H case name with signed suffix.
- output-above-ceiling-repeat — mirrors output-above-ceiling; new repeat suffix, owner review.


Additional JSON/outside closure names:

- reasoning-json-signed-max — mirrors tool-seed-signed-max; same reasoning-json sibling case
  and explicit effort variant. Original row recorded in signedRepeatOf.
- reasoning-outside-omit-signed-json-max / reasoning-outside-keep-signed-json-max — mirror
  the earlier *-signed cases and name their reasoning-json-signed-max source explicitly.
- progress.outsideControls — mirrors progress.signedControls; outsideClosure / outsideSamples
  mirror signedControls / signedSamples in provider notes and observations.
- signed-already-started — mirrors diagnostic-already-started and already-started refusals.
- Stream-source case aliases in the guard mirror the JSON-max cases; no stream-source variant
  was prepared or sent. No existing naming asymmetry was renamed.


Additional release-policy names:

- anthropicOrganizationId — derives from the exact anthropic-organization-id header name;
  no exact transport-flag sibling, owner review. It is a boolean, never the header value.
- organizationId / organizationIds — singular capture value/plural optional audit values;
  same derivation as sensitiveValues, no exact identity-value sibling, owner review.
- RepricedLedgerEntry / repriced — mirror LiftedLedgerEntry / lifted past-tense entry kinds.
- Capture.reprice / pnpm capture reprice — mirrors Capture.liftStop / pnpm capture lift as
  explicit append-only review operations; price derives from existing Price/costOf.
- admissionRepeatOf — mirrors signedRepeatOf / ceilingRepeatOf / diagnosticRepeatOf.
- host-sgp-repeat — mirrors output-above-ceiling-repeat and original host-sgp case.
- L/tool-seed-signed — mirrors the exact S/H tool-seed-signed case.
- rows.released.json — mirrors rows.held.json / rows.priced.json.
- reviews.observations.json — mirrors signed/diagnostic/checkpoint.observations.json.
- progress.releaseControls — mirrors signedControls / outsideControls / providerControls.
- stop-not-reviewable — mirrors invalid-stop-review and stop-already-lifted; new code, owner review.
- invalid-reprice-review / reprice-not-rejected / already-repriced — new static review refusals,
  deriving from invalid-stop-review / stop-not-reviewable / already-started; owner review.


New checkpoint data names:

- released.seed.observations.json — mirrors signed.observations.json / diagnostic.observations.json.
- released.batch.paths.json — mirrors signed.batch.paths.json / probe.paths.json.

Final MiMo continuation names:

- `recipes.mimo.messages.json` and `recipes.mimo.chat.json` — mirror the existing
  `recipes.messages.json` and `recipes.chat.json` by provider and endpoint format.
- `mimo.batch.paths.json` — mirrors `released.batch.paths.json` and `mt.batch.paths.json` as
  the single-call prepared-path checkpoint.
- `MA/tool-seed`, `MO/tool-seed` and each ordinary MiMo case — mirror the same case name on
  S/H/L or MT where one exists; the offering prefix follows the provider-format-model folders.
- `MA/claude-signature` — names the Sonnet signature substituted into a MiMo tool round;
  no exact sibling exists, for owner review.
- Scratch `kuib-capture-mimo-messages.ts`, `kuib-capture-mimo-chat.ts` and
  `kuib-capture-mimo-drive.ts` — mirror the previous messages/chat builders and released
  driver under `/var/tmp`; these are task scratch, not repository modules.
- Existing asymmetry noticed and left unchanged: `thinking-sampling-top_p` and
  `thinking-sampling-top-p` use different separators across approved case names.
