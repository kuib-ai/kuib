---
task: capture-traffic
---
# capture-traffic — plan

Status: awaiting GO. This is a plan-only delivery. No implementation, key read, provider
model-list call or inference call has happened.

## Changes by path and order

1. After test-setup is accepted and GO is appended to the brief, reread its conditions and
   check the shared root manifests before touching them.
2. Add `tooling/capture.ts` beside `tooling/test.ts`, with its real implementation
   and `tooling/capture.test.ts` beside it. It records exactly one prepared POST per
   invocation. Its library function is importable without invoking the CLI.
3. Add root `capture` script, run with `pnpm capture`. Existing pnpm resolves
   Deno; use `--no-check`, scoped permissions, no provider SDK and no new external
   dependency. Read sibling manifests and existing dotenv/bootstrap helpers after GO;
   reuse a suitable helper instead of creating a second implementation if one exists.
4. Create `packages/inference/package.json`, `packages/inference/src/index.ts`
   (empty public barrel), `packages/inference/tsconfig.json`, and
   `packages/inference/fixtures/<fixture-name>/`. The extra tsconfig is needed for
   the workspace's tsgo project check; it extends the established workspace config.
   Include the required test/lint/format scripts. There is no neutral format or translation.
   The runtime has no dependencies; its existing workspace tsconfig package is a dev
   dependency if sibling manifests require it. Reconcile the lockfile through pnpm only.
5. Add the minimum core claim/ownership for the empty inference package and an infra claim
   for capture behavior. Attribute implementation and meaningful tests, verify and stamp only
   affected claims. Run journal build and agents sync if their generated outputs change.
   Their generated files are inside the grant. Do not write to any other feature plan.
6. Run offline tests through the accepted runner, then the full check. Prepare synthetic
   request data under this task's directory. Each actual request must be one row below,
   with its credential-free prepared bytes persisted before submission. Sending is manual
   and sequential: no background batch, automatic retry, model discovery, or hidden extra
   request.
7. Record captures only after implementation and credential-removal tests pass. Keep a call
   ledger here; append every observation, skipped prerequisite, unexpected answer and cost.
   Update report/log, verify fixtures with the real loader and secret scan, run full check,
   stamp touched claims, and report the actual matrix coverage. Stop at the worker boundary.

All process trees launched through pnpm, Nx or test subprocesses use
`/var/tmp/kuib-guard.sh 30 1500 -- <command>`; set `NX_PARALLEL=2`,
`TMPDIR=/var/tmp` and disable the Nx daemon for this machine. Scratch files live
under /var/tmp. Never run two capture calls at once.

## CLI and permissions

Proposed invocation, with no secret on the command line:

`pnpm capture --provider anthropic --request journal/features/inference/tasks/capture-traffic/requests/S-plain-json.json --fixture anthropic-sonnet-5-5-plain-json --step 001 --shows "Nonstream text with between-tools thinking"`

The request file holds method, URL, public headers and exact UTF-8 body text. Provider
selection chooses the one named key and credential header inside memory. A repeated call uses
the stored sanitized request envelope/body file and makes a new step; it never silently
overwrites existing data. The tool refuses path traversal, destination collisions, credential
headers in prepared input, URLs with userinfo/query credentials, and redirects. URLs are
restricted to the approved host/path pairs. Its API accepts supplied key values in memory for
offline tests; production obtains them by name. No key value is printed.

The root script uses Deno run with no -A, no run/ffi/sys permission:

- Read: `tooling/`, `node_modules/`, package manifests needed for workspace
  imports, `.env`, `packages/inference/fixtures/`, and this task's directory.
- Write: `packages/inference/fixtures/` and this task's directory only.
- Env: `KUIB_ANTHROPIC_API_KEY,KUIB_MIMO_API_KEY,KUIB_META_API_KEY` only.
- Net: `api.anthropic.com:443,token-plan-sgp.xiaomimimo.com:443,api.xiaomimimo.com:443,api.meta.ai:443`.
- `--no-prompt`; exact runtime flag syntax is checked against the installed Deno
  before the script is added. A workspace package resolution config may require a named
  read path; add the precise path, not unrestricted read.

The CLI reads .env once without echoing its contents and loads only the three named keys,
with a supplied environment value taking precedence. No other .env setting becomes request
data. Simple quoted values, CRLF and blank/comment lines are handled by a reusable existing
helper if present; malformed/missing named values produce static errors naming the variable,
never its value. Do not use --env-file to import every workspace secret. No keys are read
before GO.

## Fixture layout and replay

One fixture is one case or ordered sequence. All data files are flat in the fixture directory,
so the current loadFixture.files lists them without requiring a recursive extension:

`fixture.json` — exactly `{"shows":"Concrete observed behavior","origin":"recorded"}`.

For each numbered step:

- `001.request.json`: method, URL, sanitized public header pairs, and
  `bodyFile: "001.request.body.json"`. No credential placeholder value that resembles
  a real key; the credential source is identified only by the provider setting.
- `001.request.body.json`: exact UTF-8 bytes sent as the request body. Serialize
  the prepared body once and send those same bytes. No subsequent pretty-printing.
- `001.response.json`: status, statusText and sanitized response header pairs.
- `001.response.bin`: untouched Uint8Array bytes delivered by fetch's body reader.
- `001.chunks.json`: observed byte lengths in read order, start/finish UTC times,
  SHA-256 of body bytes, completion state (complete/cancelled/read-failed), deliberately
  selected cut trigger, and the static failure code if reading did not finish.
- `sequence.json`: ordered step records, source fixture/step for every replay,
  each intentional transformation, fixture/model/format identity, public endpoint, and
  matrix row id. A tool round points to the real seed answer. A cache read repeats the
  exact request, rather than appending its previous answer to messages.

Tool sequences and cache sequences share one fixture description and an ordered sequence
file; cross-offering rows cite the source fixture and also copy the exact source request/
response data needed to replay offline. A rejection is recorded with the same layout.
Transport errors before headers have no HTTP status; a nullable response metadata value
records that fact, with zero bytes if none arrived. Written-only failures have separate
fixtures with `origin:"written"`; they never share a recorded fixture description.

`Testing.loadFixture(import.meta.url,name)` works from later inference tests, and
`fixture.bytes("001.response.bin")` gives exact body bytes. No changes to packages/testing.
Its strict fixture.json has no place for sequences, status or framing; separate data files
supply that information without weakening the convention. Tests in tooling prove capture
behavior; inference starts with data and an empty barrel, so no fake inference test is added.

## Byte fidelity and credential removal

Record application response body bytes from fetch, not TCP packets, TLS records or HTTP
transfer framing. Set `Accept-Encoding: identity`; fetch may still decode a server
content encoding, so metadata explicitly states the capture boundary is the fetch reader.
Observed stream read boundaries are kept as byte lengths, not claimed to be server write
boundaries, SSE frames or network packets. Concatenating the numbered read lengths reproduces
the entire binary file, including CR/LF, UTF-8 split across reads, ping/unknown events, empty
deltas, partial JSON and the final terminal frame. Never decode/re-encode body bytes for disk.
A deliberate cut retains every byte already delivered by the reader, including other events
coalesced in that read; report that actual boundary.

Remove, case-insensitively, on BOTH requests and responses:
`authorization,proxy-authorization,x-api-key,api-key,x-goog-api-key,cookie,set-cookie,
anthropic-organization-id,anthropic-workspace-id,openai-organization,openai-project,
openai-organization-id,openai-project-id,x-organization-id,x-project-id,x-workspace-id,
x-account-id,x-user-id,x-api-key-id,x-auth-token,x-access-token`.
Also remove any header whose name contains credential/account/org/project/workspace/user/
session/token identity semantics, including all x-meta-/x-mimo- identity headers.
Rate-limit token counters are the explicitly named exception to that broad token rule.

Persist headers through a small explicit public allowlist; unknown headers are excluded:

- Requests: `content-type,accept,accept-encoding,anthropic-version,anthropic-beta`.
- Responses: `content-type,content-length,content-encoding,date,cache-control,
  retry-after,request-id,x-request-id,openai-version,openai-processing-ms`, Anthropic's
  documented request/token/input-token/output-token limit/remaining/reset headers, and
  OpenAI's documented request/token/project-token limit/remaining/reset headers.

Identify requests by request-id, not account identity. No unsanitized Headers object is
serialized or included in errors. Account-scoped headers can be injected only in memory for
the test, not stored as prepared request data.

Buffer a single response in memory, with a 16 MiB cap, before any body file is written.
Before writing ANY fixture or ledger data, scan the proposed bytes for the supplied key
values, known removed account-header values and their JSON-escaped/URL-encoded/base64 forms.
A sensitive value reflected in a body or otherwise public header causes a static refusal:
discard it without writing raw, redacted or temporary body data. Exact bytes and no secret
cannot both be satisfied for a reflected secret; refusing capture is the chosen behavior.
Do not log an exception's arbitrary message, input body, header values or diagnostic object.
Only static error codes, row names, timestamps and numeric statuses reach the ledger.
Any safety refusal is recorded as no fixture, and stops capture work pending review.

Offline tests use the REAL capture implementation against a Deno.serve HTTP server bound to
127.0.0.1 with an ephemeral port inside the runner sandbox, with disposable testing resources:

- Server asserts the fake credential arrived in the correct header while disk contains no
  fake credential or sentinel account header. Test each credential-header spelling and
  mixed casing, cookies, known account headers and a new unknown account header.
- Compare stored response bytes with the server's known SSE/JSON/error byte arrays, including
  multibyte text, CRLF, binary bytes, final usage and a partial stream. Chunks may coalesce:
  assert observed lengths partition the stored bytes; do not demand server write boundaries.
- Reflect a fake key in response body, in a nominally public header, across server writes,
  or inside a JSON escape; assert capture refuses and no raw/temp data file exists.
- Exercise a prepared body containing a key, credentials in URL, unsafe destinations,
  redirect, write collision, stream read failure and cancellation, using the same module.
- Record a real two-request loopback sequence, load description/data through the actual
  Testing.loadFixture, and replay its stored request body bytes through capture again.
- Assert fixture.json contains exactly shows/origin and recorded/written separation.
- Test the CLI's restricted permissions and named env lookup through tooling's allowed spawn
  path, not an unrestricted subprocess or nested test runner. No .env from this workspace
  is read by an offline test.
- Whole-capture secret audit recursively scans every fixture file (binary included), request
  file, sequence, log, report and ledger without printing matches or secrets; report only
  zero/nonzero match count and scanned fixture names. Search for denied header NAMES as well
  as values. This audit is run after captures, not claimed at the plan stage.

## Providers, models and public sources

| Group | Host/path | Default authentication | Key variable | Model |
| --- | --- | --- | --- | --- |
| S | api.anthropic.com/v1/messages | x-api-key; version 2023-06-01 | KUIB_ANTHROPIC_API_KEY | claude-sonnet-5-5 |
| H | api.anthropic.com/v1/messages | x-api-key; version 2023-06-01 | KUIB_ANTHROPIC_API_KEY | claude-haiku-5-5 |
| L | api.anthropic.com/v1/messages | x-api-key; version 2023-06-01 | KUIB_ANTHROPIC_API_KEY | claude-haiku-4-5-20251001 |
| MA | token-plan-sgp.xiaomimimo.com/anthropic/v1/messages, then api.xiaomimimo.com/anthropic/v1/messages | api-key; no Claude version/beta unless row sets one | KUIB_MIMO_API_KEY | mimo-v2.6-pro |
| MO | token-plan-sgp.xiaomimimo.com/v1/chat/completions, then api.xiaomimimo.com/v1/chat/completions | Authorization Bearer | KUIB_MIMO_API_KEY | mimo-v2.6-pro |
| MT | api.meta.ai/v1/chat/completions | Authorization Bearer | KUIB_META_API_KEY | muse-spark-1.1 (GO must confirm; see below) |

Checked 2026-10-12: Sonnet 5.5 and Haiku 5.5 are current, and Haiku 4.5 is legacy and still
available. Use the pinned 4.5 snapshot.
[Anthropic model overview](https://platform.claude.com/docs/en/models/overview),
[Haiku 4.5](https://platform.claude.com/docs/en/models/haiku-4-5/overview).

MiMo default host comes from engine resolve.model.config and is tried first for both formats.
The second host is the documented pay-as-you-go host. MiMo's current docs distinguish tp-/
ttp- plan keys from sk- pay-as-you-go keys. Do not print or persist a prefix read from a real
key. Do not silently try China/Amsterdam/USA, read a custom endpoint out of .env or make a
third host request.
[MiMo integration](https://mimo.mi.com/static/docs/quick-start/faq/api-integration.md),
[Token-plan quick access](https://mimo.mi.com/static/docs/tokenplan/Token%20Plan/quick-access.md).

Meta address is fixed in engine resolve.model.config; model is caller-selected, not fixed.
The primary tests name muse-spark-1.1; an override test also names 1.2. Therefore 1.1 is the
proposed existing row, not a claim that it is the owner's active model. Public docs list it
as available. No Meta list call was used.
[Meta models/prices](https://dev.meta.ai/products/meta-model-api).

Beta values are literal, approved request settings, not inferred later:
`mid-conversation-output-config-2026-07-01` for per-message effort,
`thinking-binding-controls-2026-08-01` for binding,
`thinking-display-updates-2026-08-18` for updates,
`mid-conversation-system-clear-at-2026-08-21` for clear_at, and
`inline-tools-2026-09-15` for local tool addition/removal.
Plain mid-conversation system text uses no beta; the public page says it is generally
available on the newer Claude models.
[Instruction documentation](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages),
[Thinking documentation](https://platform.claude.com/docs/en/build-with-claude/thinking).

## Matrix conventions and synthetic payloads

Every table row below represents at most ONE HTTP call, with no retries. Names are unique
within a group; stored row id is `<group>/<name>`, and fixture names use the group's
provider/model prefix plus the case name. Group/model expansion is already performed:
there are no hidden repeat-each-model macros in the approved count.

A = answer/200 expected; R = rejection expected; A? or R? = uncertain answer/rejection;
A?/R? = either is plausible; AUTH = authentication-failure possibility; U = specifically
from Unverified/G009/G015/G019/G020 or extending that provider's undocumented compatible
behavior; HOLD = no call without the cap exception in GO.
A rejection expected from documentation does not establish which exact body arrives.
An unexpected answer is retained, reported and never retried.

Default A request: required model; max_tokens as shown; stream=true unless row specifies
false/omitted; a short synthetic system instruction, a user asking for exactly OK; no
sampling/cache/effort/stop/tool choice fields unless set. Default chat request uses
max_completion_tokens, no thinking/effort, and include_usage=true ONLY when streaming.
Every changed parameter is retained exactly, including unsupported fields: no SDK fixes it.
Rows described as reasoning on use adaptive on S/H, enabled with budget 1024 on L, and enabled
on MA/MO. Thinking off uses between_tools on S, disabled on H/L/MA/MO.
MT always reasons internally; its plain/cut/tool prompts use effort low only where specified.

Reasoning prompt: a short, invented widget arithmetic puzzle asking for a one-sentence
answer. Tool seed prompt asks for a value only the declared `get_value` tool supplies.
The tool has an object schema with integer selector; actual execution is unnecessary: its
result is synthetic `7`. Parallel rows ask for selectors 7 and 8 and return each actual
call id's corresponding result when a follow-up is listed. Calls are not guaranteed:
a seed with no genuine tool call blocks/skips its dependent rows and is NOT retried.
Strict schemas require every property and additionalProperties=false. Custom tool choice
probes declare `echo_value` as a custom grammar/text tool, with no provider-run tools.

Cache prefixes are deterministic synthetic numbered vocabulary paragraphs, identical within
a sequence. Target about 1,024–2,048 input tokens for newer Claude, MiMo and Meta, and about
4,096–8,192 for Haiku 4.5. The latter's caching minimum is 4,096, so use its larger prefix.
Record observed usage and a miss as a miss; do not label a cache hit merely from the mark.
Repeated request bytes are not mutated by a new timestamp, nonce, fixture name or user id.
All count/TTL/placement probes use synthetic text/tools. No account metadata is sent.

Limits listed in the matrix are total output limits INCLUDING reasoning, not visible answer
budgets. Ordinary caps are <=2,048; budgets require >=1,024 reasoning tokens. Negative/zero
values are intentional validation probes. All above-ceiling values are HOLD. Those prompts
ask for exactly OK, and an unexpected 200 is cancelled immediately at headers, without a
second request. Cancellation cannot promise zero billing; the envelope below reserves full
output cost. Need the cap exception before sending them.

Cut observers only recognize the complete SSE event needed to trigger cancellation; they
never alter stored bytes. Follow-up request preparation is literal extraction of the
provider's native complete response fields, preserving block order/signatures/JSON arguments.
There is no neutral format, runtime inference translation, or second implementation of the
AI SDK's modules. When streaming cuts need inspection, read the recorded bytes and document
the exact extraction in sequence.json; do not pretend an incomplete thinking signature is
valid. MT cut-reasoning falls back to first visible text if no reasoning field appears, and
the reasoning-only replay is skipped with the absence documented.

## Explicit requests

### Anthropic / Sonnet 5.5 — claude-sonnet-5-5 (115 calls maximum)

| Row/name | What is set beyond defaults | What it shows | Expected | max_tokens / max_completion_tokens | Earlier response sent back | Source |
| --- | --- | --- | --- | --- | --- | --- |
| S/plain-json | stream=false; thinking=between_tools | nonstream answer, thinking off | A | 256 | — | pieces |
| S/plain-stream | stream=true; thinking=between_tools | text deltas, terminal frame, usage, headers | A | 256 | — | pieces |
| S/plain-default | stream omitted; thinking omitted; system omitted | default stream/thinking/effort/display and no cache mark | A | 768 | — | pieces |
| S/system-string | system string; thinking=between_tools | base instruction string | A | 256 | — | pieces |
| S/system-blocks | system text-block array; thinking=between_tools | base instruction blocks | A | 256 | — | pieces |
| S/reasoning-json | stream=false; thinking=adaptive; display=summarized | complete reasoning blocks and any signature | A | 768 | — | pieces |
| S/reasoning-stream | stream=true; thinking=adaptive; display=summarized | reasoning/signature deltas and complete ordering | A | 768 | — | pieces |
| S/tool-seed | stream=false; thinking=adaptive; display=summarized; tools get_value; auto | signed reasoning and genuine tool call for replay | A | 2048 | — | pieces |
| S/tool-replay | stream=true; same tools/system/thinking; actual tool result value 7 | tool round with all reasoning and original call order | A | 2048 | S/tool-seed | U |
| S/tool-replay-no-reasoning | same replay; remove only thinking blocks | omitted reasoning inside tool round | R | 768 | S/tool-seed | U |
| S/tool-replay-empty-signature | same replay; signature="" on every thinking block | empty signature handling | R | 768 | S/tool-seed | U |
| S/tool-replay-no-signature | same replay; remove signature field only | missing signature handling | R | 768 | S/tool-seed | U |
| S/tool-replay-error | same replay; is_error=true; synthetic error result | tool-result error flag | A | 768 | S/tool-seed | pieces |
| S/tool-replay-false | same replay; is_error=false; result as text blocks | tool-result false flag and block content | A | 768 | S/tool-seed | pieces |
| S/tool-replay-cache | same replay; cache_control on tool_use and tool_result | cache mark on call and result blocks | A | 768 | S/tool-seed | pieces |
| S/tool-order-invalid | insert user text before tool_result or leave result unmatched | rejection and raw error body | R | 256 | S/tool-seed | U |
| S/thinking-adaptive | thinking.type=adaptive; effort omitted | thinking-mode value, including rejected modes | A | 768 | — | pieces |
| S/thinking-enabled | thinking.type=enabled; budget_tokens=1024; effort omitted | thinking-mode value, including rejected modes | R | 1536 | — | pieces |
| S/thinking-disabled | thinking.type=disabled; effort omitted | thinking-mode value, including rejected modes | R | 768 | — | pieces |
| S/thinking-between_tools | thinking.type=between_tools; effort omitted | thinking-mode value, including rejected modes | A | 768 | — | pieces |
| S/budget-too-small | thinking=enabled; budget_tokens=1023 | lower budget bound | R | 1536 | — | pieces |
| S/budget-at-output | thinking=enabled; budget_tokens=1536 | budget must be below total output | R | 1536 | — | pieces |
| S/effort-low | thinking=adaptive; output_config.effort=low | effort value with reasoning on | A | 768 | — | pieces |
| S/effort-medium | thinking=adaptive; output_config.effort=medium | effort value with reasoning on | A | 768 | — | pieces |
| S/effort-high | thinking=adaptive; output_config.effort=high | effort value with reasoning on | A | 768 | — | pieces |
| S/effort-xhigh | thinking=adaptive; output_config.effort=xhigh | effort value with reasoning on | A | 768 | — | pieces |
| S/effort-max | thinking=adaptive; output_config.effort=max | effort value with reasoning on | A | 768 | — | pieces |
| S/off-effort-xhigh | thinking=between_tools; output_config.effort=xhigh | off/effort incompatibility | R | 256 | — | pieces |
| S/off-effort-max | thinking=between_tools; output_config.effort=max | off/effort incompatibility | R | 256 | — | pieces |
| S/display-summarized | thinking=adaptive; display=summarized | display value; preserve empty thinking with signature | A | 768 | — | pieces |
| S/display-omitted | thinking=adaptive; display=omitted | display value; preserve empty thinking with signature | A | 768 | — | pieces |
| S/display-updates | thinking=adaptive; display=updates; beta=thinking-display-updates-2026-08-18 | display value; preserve empty thinking with signature | A | 768 | — | pieces |
| S/display-disabled | thinking=disabled; display=summarized | display when disabled | R | 256 | — | pieces |
| S/between-tools-display | thinking=between_tools; display=summarized | between_tools has no additional fields | R | 256 | — | pieces |
| S/display-updates-no-beta | thinking=adaptive; display=updates; no beta | feature header requirement | R | 768 | — | pieces |
| S/tool-choice-auto | thinking=between_tools; tools retained; tool_choice=auto | every native tool choice without deleting tools | A | 768 | — | pieces |
| S/tool-choice-any | thinking=between_tools; tools retained; tool_choice=any | every native tool choice without deleting tools | R | 768 | — | pieces |
| S/tool-choice-tool | thinking=between_tools; tools retained; tool_choice=tool(get_value) | every native tool choice without deleting tools | R | 768 | — | pieces |
| S/tool-choice-none | thinking=between_tools; tools retained; tool_choice=none | every native tool choice without deleting tools | A | 768 | — | pieces |
| S/thinking-tool-choice-any | thinking=adaptive; tools retained; tool_choice=any | forced tool choice with reasoning | R | 768 | — | pieces |
| S/thinking-tool-choice-tool | thinking=adaptive; tools retained; tool_choice=tool | forced tool choice with reasoning | R | 768 | — | pieces |
| S/parallel-false | thinking=between_tools; auto.disable_parallel_tool_use=false; ask for values 7 and 8 | parallel switch, separate calls if emitted | A | 768 | — | pieces |
| S/parallel-true | thinking=between_tools; auto.disable_parallel_tool_use=true; ask for values 7 and 8 | parallel switch, separate calls if emitted | A | 768 | — | pieces |
| S/eager-false | thinking=between_tools; tools[].eager_input_streaming=false; stream=true | tool argument fragmentation switch | A | 768 | — | pieces |
| S/eager-true | thinking=between_tools; tools[].eager_input_streaming=true; stream=true | tool argument fragmentation switch | A | 768 | — | pieces |
| S/inline-first | messages=[system(text), user]; no beta | system as first message | R | 256 | — | U |
| S/inline-after-user | messages=[user, system(text)]; no beta | system inside conversation at legal end | A | 256 | — | U |
| S/inline-after-assistant | messages=[user, assistant(text), system(text), user] | system after assistant text | R | 256 | — | U |
| S/inline-between-call-result | insert system(text) between actual call and its result | fourth instruction position and paired-call rule | R | 768 | S/tool-seed | U |
| S/inline-after-result | system(text) after actual user tool_result, at end | legal instruction position after result | A | 768 | S/tool-seed | U |
| S/inline-effort | thinking on; system(content="",output_config.effort=low); beta=mid-conversation-output-config-2026-07-01 | effort carried inside conversation | A | 768 | — | pieces |
| S/inline-effort-off | thinking=between_tools; top effort=high; inline effort=low; same beta | effort change with reasoning off | R | 256 | — | pieces |
| S/inline-effort-no-beta | thinking on; inline effort=low; no beta | per-message effort header requirement | R | 768 | — | pieces |
| S/clear-at | inline system text; clear_at=next_user_message; matching beta | turn-scoped instruction | A | 256 | — | pieces |
| S/clear-at-no-beta | inline system text; clear_at=next_user_message; no beta | turn-scope header requirement | R | 256 | — | pieces |
| S/cut-text | stream=true; thinking off; ask for long enumerated text; cancel after first text delta | deliberate text cut; no terminal frame | A | 256 | — | pieces |
| S/cut-text-user | original history + observed partial assistant text + user Continue; thinking on | cut text followed by user with thinking on | A? | 768 | S/cut-text | U |
| S/cut-text-prefill-off | original history + observed partial text as last assistant; thinking off | prefill accepted or rejected | R | 256 | S/cut-text | U |
| S/cut-text-prefill-on | same last partial assistant; thinking on | prefill and reasoning interaction | R | 768 | S/cut-text | U |
| S/cut-thinking | stream=true; thinking=adaptive; display=summarized; cancel after first thinking delta | step cut before signature; raw prefix retained | A | 768 | — | pieces |
| S/cut-thinking-replay | replay observed incomplete thinking as thinking; append user Continue | incomplete reasoning sent back | R | 768 | S/cut-thinking | U |
| S/reasoning-outside-omit | complete reasoning-json assistant text only + new user | allowed omission outside tool round | A | 768 | S/reasoning-json | pieces |
| S/reasoning-outside-keep | complete reasoning-json blocks unchanged + new user | reasoning replay across user turns | A | 768 | S/reasoning-json | U |
| S/binding-default | change only top-level system; actual signed tool seed replay; no binding control | account default for changed-prefix signature | A?/R? | 768 | S/tool-seed | U |
| S/binding-error | change system; thinking.block_binding.prefix_mismatch_behavior=error; binding beta | binding control and input_transformations | R | 768 | S/tool-seed | U |
| S/binding-drop_block | change system; thinking.block_binding.prefix_mismatch_behavior=drop_block; binding beta | binding control and input_transformations | A | 768 | S/tool-seed | U |
| S/binding-no-beta | changed system; block_binding=drop_block; no binding beta | binding header requirement | R | 768 | S/tool-seed | pieces |
| S/changed-tools | change synthetic tool description only; actual signed seed replay | tools-prefix binding interaction | A?/R? | 768 | S/tool-seed | U |
| S/cache-5m-write | thinking=between_tools; long synthetic prefix; system mark ttl=5m; stream=true | cache write and TTL usage | A | 64 | — | pieces |
| S/cache-5m-read | identical request bytes to cache-5m-write | cache hit or observed miss, not assumed | A | 64 | S/cache-5m-write (repeat request only) | U |
| S/cache-1h-write | thinking=between_tools; long synthetic prefix; system mark ttl=1h; stream=true | cache write and TTL usage | A | 64 | — | pieces |
| S/cache-1h-read | identical request bytes to cache-1h-write | cache hit or observed miss, not assumed | A | 64 | S/cache-1h-write (repeat request only) | U |
| S/cache-tool | thinking=between_tools; 5m mark at tool; long synthetic prefix | cache-mark placement value | A | 64 | — | pieces |
| S/cache-user | thinking=between_tools; 5m mark at user; long synthetic prefix | cache-mark placement value | A | 64 | — | pieces |
| S/cache-assistant | thinking=between_tools; 5m mark at assistant; long synthetic prefix | cache-mark placement value | A | 64 | — | pieces |
| S/cache-top-level | thinking=between_tools; 5m mark at top-level; long synthetic prefix | cache-mark placement value | A | 64 | — | pieces |
| S/cache-four | four explicit marks, including system/user/tool; thinking off | four-breakpoint limit | A | 64 | — | pieces |
| S/cache-five | five explicit marks; thinking off | fifth explicit breakpoint | R? | 64 | — | U |
| S/cache-four-plus-top | four explicit marks and top-level automatic mark | automatic mark shares four-slot limit | R | 64 | — | pieces |
| S/cache-mixed-valid | 1h mark before 5m mark | TTL order accepted | A | 64 | — | pieces |
| S/cache-mixed-invalid | 5m mark before 1h mark | TTL order invalid | R | 64 | — | pieces |
| S/cache-last-conflict | last user block ttl=1h; top-level ttl=5m | conflicting last-block TTL | R | 64 | — | pieces |
| S/cache-short | short prefix below minimum; one 5m mark | cache hint without actual caching | A | 64 | — | pieces |
| S/cache-empty | empty text block with 5m cache mark | empty text cannot be cached | R | 64 | — | U |
| S/cache-thinking | cache_control on unchanged replayed thinking block | reasoning is not cache-markable | R | 768 | S/tool-seed | pieces |
| S/cache-change-thinking | cache-5m request + same-prefix thinking on | mode change versus cached messages | A | 768 | S/cache-5m-write (repeat prefix only) | pieces |
| S/cache-change-effort | cache-5m request + top-level effort=low; mode unchanged | top-level effort cache invalidation | A | 64 | S/cache-5m-write (repeat prefix only) | pieces |
| S/cache-inline-effort | cache-5m request + inline effort-only instruction + beta; thinking on | inline effort and cache prefix | A | 768 | S/cache-change-thinking (repeat prefix only) | pieces |
| S/cache-change-choice | cache-5m request + tool_choice none, tools unchanged | tool-choice cache invalidation | A | 64 | S/cache-5m-write (repeat prefix only) | pieces |
| S/temperature-default | thinking=between_tools; temperature=1 | sampling field accepted/rejected without normalization | A | 256 | — | pieces |
| S/temperature-changed | thinking=between_tools; temperature=0 | sampling field accepted/rejected without normalization | R | 256 | — | pieces |
| S/top-p-default | thinking=between_tools; top_p=1 | sampling field accepted/rejected without normalization | A | 256 | — | pieces |
| S/top-p-boundary | thinking=between_tools; top_p=0.99 | sampling field accepted/rejected without normalization | A | 256 | — | pieces |
| S/top-p-changed | thinking=between_tools; top_p=0.5 | sampling field accepted/rejected without normalization | R | 256 | — | pieces |
| S/top-k | thinking=between_tools; top_k=1 | sampling field accepted/rejected without normalization | R | 256 | — | pieces |
| S/thinking-sampling-temperature | thinking=adaptive; temperature=0 | sampling with reasoning on; MiMo override | R | 768 | — | pieces |
| S/thinking-sampling-top_p | thinking=adaptive; top_p=0.5 | sampling with reasoning on; MiMo override | R | 768 | — | pieces |
| S/thinking-sampling-top_k | thinking=adaptive; top_k=1 | sampling with reasoning on; MiMo override | R | 768 | — | pieces |
| S/thinking-top-p-valid | thinking=adaptive; top_p=0.95 | budget-model permitted top_p versus newer bound | R | 768 | — | pieces |
| S/sampling-combined | thinking=between_tools; temperature=1; top_p=1 | two sampling fields together | A | 256 | — | pieces |
| S/stop-one | thinking=between_tools; stop_sequences=[END]; ask OK END EXTRA | one stop string and matched stop sequence | A | 256 | — | pieces |
| S/stop-four | thinking=between_tools; stop_sequences=[END,A,B,C] | four stop sequences | A | 256 | — | pieces |
| S/output-one | thinking=between_tools; request long text | output-limit stop | A | 1 | — | pieces |
| S/output-zero | thinking=between_tools; long cache-marked prefix | zero-output cache warming | A | 0 | — | pieces |
| S/output-negative | thinking=between_tools | invalid output limit error | R | -1 | — | pieces |
| S/output-above-ceiling | thinking=between_tools; ask exactly OK; cancel immediately if HTTP 200 | server answer to above-model ceiling; pending cap exception | R? | 128001 | — | U; HOLD |
| S/empty-text | user empty text block | empty text validation | R? | 256 | — | U |
| S/first-assistant | messages=[assistant(text), user]; thinking off | first role rule | A | 256 | — | U |
| S/consecutive-user | two adjacent user messages; thinking off | role merging behavior | A | 256 | — | pieces |
| S/auth-bearer | Authorization Bearer instead of default auth header; thinking off | credential-header alternative | A | 64 | — | U |
| S/invalid-beta | anthropic-beta=synthetic-invalid-beta | known rejection error envelope | R | 64 | — | pieces |
| S/inline-tools | system tool_addition then tool_removal; beta=inline-tools-2026-09-15 | mid-conversation tool availability | A | 768 | — | pieces |
| S/cross-model-h | source request unchanged except target model/host/auth; complete assistant blocks and result | tool round continued on another offering | A?/R? | 2048 | H/tool-seed | U |
| S/cross-model-l | source request unchanged except target model/host/auth; complete assistant blocks and result | tool round continued on another offering | A?/R? | 2048 | L/tool-seed | U |
| S/cross-model-ma | source request unchanged except target model/host/auth; complete assistant blocks and result | tool round continued on another offering | A?/R? | 2048 | MA/tool-seed | U |

### Anthropic / Haiku 5.5 — claude-haiku-5-5 (113 calls maximum)

| Row/name | What is set beyond defaults | What it shows | Expected | max_tokens / max_completion_tokens | Earlier response sent back | Source |
| --- | --- | --- | --- | --- | --- | --- |
| H/plain-json | stream=false; thinking=disabled | nonstream answer, thinking off | A | 256 | — | pieces |
| H/plain-stream | stream=true; thinking=disabled | text deltas, terminal frame, usage, headers | A | 256 | — | pieces |
| H/plain-default | stream omitted; thinking omitted; system omitted | default stream/thinking/effort/display and no cache mark | A | 768 | — | pieces |
| H/system-string | system string; thinking=disabled | base instruction string | A | 256 | — | pieces |
| H/system-blocks | system text-block array; thinking=disabled | base instruction blocks | A | 256 | — | pieces |
| H/reasoning-json | stream=false; thinking=adaptive; display=summarized | complete reasoning blocks and any signature | A | 768 | — | pieces |
| H/reasoning-stream | stream=true; thinking=adaptive; display=summarized | reasoning/signature deltas and complete ordering | A | 768 | — | pieces |
| H/tool-seed | stream=false; thinking=adaptive; display=summarized; tools get_value; auto | signed reasoning and genuine tool call for replay | A | 2048 | — | pieces |
| H/tool-replay | stream=true; same tools/system/thinking; actual tool result value 7 | tool round with all reasoning and original call order | A | 2048 | H/tool-seed | U |
| H/tool-replay-no-reasoning | same replay; remove only thinking blocks | omitted reasoning inside tool round | R | 768 | H/tool-seed | U |
| H/tool-replay-empty-signature | same replay; signature="" on every thinking block | empty signature handling | R | 768 | H/tool-seed | U |
| H/tool-replay-no-signature | same replay; remove signature field only | missing signature handling | R | 768 | H/tool-seed | U |
| H/tool-replay-error | same replay; is_error=true; synthetic error result | tool-result error flag | A | 768 | H/tool-seed | pieces |
| H/tool-replay-false | same replay; is_error=false; result as text blocks | tool-result false flag and block content | A | 768 | H/tool-seed | pieces |
| H/tool-replay-cache | same replay; cache_control on tool_use and tool_result | cache mark on call and result blocks | A | 768 | H/tool-seed | pieces |
| H/tool-order-invalid | insert user text before tool_result or leave result unmatched | rejection and raw error body | R | 256 | H/tool-seed | U |
| H/thinking-adaptive | thinking.type=adaptive; effort omitted | thinking-mode value, including rejected modes | A | 768 | — | pieces |
| H/thinking-enabled | thinking.type=enabled; budget_tokens=1024; effort omitted | thinking-mode value, including rejected modes | R | 1536 | — | pieces |
| H/thinking-disabled | thinking.type=disabled; effort omitted | thinking-mode value, including rejected modes | A | 768 | — | pieces |
| H/thinking-between_tools | thinking.type=between_tools; effort omitted | thinking-mode value, including rejected modes | R | 768 | — | pieces |
| H/budget-too-small | thinking=enabled; budget_tokens=1023 | lower budget bound | R | 1536 | — | pieces |
| H/budget-at-output | thinking=enabled; budget_tokens=1536 | budget must be below total output | R | 1536 | — | pieces |
| H/effort-low | thinking=adaptive; output_config.effort=low | effort value with reasoning on | A | 768 | — | pieces |
| H/effort-medium | thinking=adaptive; output_config.effort=medium | effort value with reasoning on | A | 768 | — | pieces |
| H/effort-high | thinking=adaptive; output_config.effort=high | effort value with reasoning on | A | 768 | — | pieces |
| H/effort-xhigh | thinking=adaptive; output_config.effort=xhigh | effort value with reasoning on | A | 768 | — | pieces |
| H/effort-max | thinking=adaptive; output_config.effort=max | effort value with reasoning on | A | 768 | — | pieces |
| H/off-effort-xhigh | thinking=disabled; output_config.effort=xhigh | off/effort incompatibility | R | 256 | — | pieces |
| H/off-effort-max | thinking=disabled; output_config.effort=max | off/effort incompatibility | R | 256 | — | pieces |
| H/display-summarized | thinking=adaptive; display=summarized | display value; preserve empty thinking with signature | A | 768 | — | pieces |
| H/display-omitted | thinking=adaptive; display=omitted | display value; preserve empty thinking with signature | A | 768 | — | pieces |
| H/display-updates | thinking=adaptive; display=updates; beta=thinking-display-updates-2026-08-18 | display value; preserve empty thinking with signature | R? | 768 | — | pieces |
| H/display-disabled | thinking=disabled; display=summarized | display when disabled | R | 256 | — | pieces |
| H/between-tools-display | thinking=between_tools; display=summarized | between_tools has no additional fields | R | 256 | — | pieces |
| H/display-updates-no-beta | thinking=adaptive; display=updates; no beta | feature header requirement | R | 768 | — | pieces |
| H/tool-choice-auto | thinking=disabled; tools retained; tool_choice=auto | every native tool choice without deleting tools | A | 768 | — | pieces |
| H/tool-choice-any | thinking=disabled; tools retained; tool_choice=any | every native tool choice without deleting tools | A | 768 | — | pieces |
| H/tool-choice-tool | thinking=disabled; tools retained; tool_choice=tool(get_value) | every native tool choice without deleting tools | A | 768 | — | pieces |
| H/tool-choice-none | thinking=disabled; tools retained; tool_choice=none | every native tool choice without deleting tools | A | 768 | — | pieces |
| H/thinking-tool-choice-any | thinking=adaptive; tools retained; tool_choice=any | forced tool choice with reasoning | A | 768 | — | pieces |
| H/thinking-tool-choice-tool | thinking=adaptive; tools retained; tool_choice=tool | forced tool choice with reasoning | A | 768 | — | pieces |
| H/parallel-false | thinking=disabled; auto.disable_parallel_tool_use=false; ask for values 7 and 8 | parallel switch, separate calls if emitted | A | 768 | — | pieces |
| H/parallel-true | thinking=disabled; auto.disable_parallel_tool_use=true; ask for values 7 and 8 | parallel switch, separate calls if emitted | A | 768 | — | pieces |
| H/eager-false | thinking=disabled; tools[].eager_input_streaming=false; stream=true | tool argument fragmentation switch | A | 768 | — | pieces |
| H/eager-true | thinking=disabled; tools[].eager_input_streaming=true; stream=true | tool argument fragmentation switch | A | 768 | — | pieces |
| H/inline-first | messages=[system(text), user]; no beta | system as first message | R | 256 | — | U |
| H/inline-after-user | messages=[user, system(text)]; no beta | system inside conversation at legal end | A | 256 | — | U |
| H/inline-after-assistant | messages=[user, assistant(text), system(text), user] | system after assistant text | R | 256 | — | U |
| H/inline-between-call-result | insert system(text) between actual call and its result | fourth instruction position and paired-call rule | R | 768 | H/tool-seed | U |
| H/inline-after-result | system(text) after actual user tool_result, at end | legal instruction position after result | A | 768 | H/tool-seed | U |
| H/inline-effort | thinking on; system(content="",output_config.effort=low); beta=mid-conversation-output-config-2026-07-01 | effort carried inside conversation | A | 768 | — | pieces |
| H/inline-effort-off | thinking=disabled; top effort=high; inline effort=low; same beta | effort change with reasoning off | R | 256 | — | pieces |
| H/inline-effort-no-beta | thinking on; inline effort=low; no beta | per-message effort header requirement | R | 768 | — | pieces |
| H/clear-at | inline system text; clear_at=next_user_message; matching beta | turn-scoped instruction | A | 256 | — | pieces |
| H/clear-at-no-beta | inline system text; clear_at=next_user_message; no beta | turn-scope header requirement | R | 256 | — | pieces |
| H/cut-text | stream=true; thinking off; ask for long enumerated text; cancel after first text delta | deliberate text cut; no terminal frame | A | 256 | — | pieces |
| H/cut-text-user | original history + observed partial assistant text + user Continue; thinking on | cut text followed by user with thinking on | A? | 768 | H/cut-text | U |
| H/cut-text-prefill-off | original history + observed partial text as last assistant; thinking off | prefill accepted or rejected | R | 256 | H/cut-text | U |
| H/cut-text-prefill-on | same last partial assistant; thinking on | prefill and reasoning interaction | R | 768 | H/cut-text | U |
| H/cut-thinking | stream=true; thinking=adaptive; display=summarized; cancel after first thinking delta | step cut before signature; raw prefix retained | A | 768 | — | pieces |
| H/cut-thinking-replay | replay observed incomplete thinking as thinking; append user Continue | incomplete reasoning sent back | R | 768 | H/cut-thinking | U |
| H/reasoning-outside-omit | complete reasoning-json assistant text only + new user | allowed omission outside tool round | A | 768 | H/reasoning-json | pieces |
| H/reasoning-outside-keep | complete reasoning-json blocks unchanged + new user | reasoning replay across user turns | A | 768 | H/reasoning-json | U |
| H/binding-default | change only top-level system; actual signed tool seed replay; no binding control | account default for changed-prefix signature | A?/R? | 768 | H/tool-seed | U |
| H/binding-error | change system; thinking.block_binding.prefix_mismatch_behavior=error; binding beta | binding control and input_transformations | R | 768 | H/tool-seed | U |
| H/binding-drop_block | change system; thinking.block_binding.prefix_mismatch_behavior=drop_block; binding beta | binding control and input_transformations | A | 768 | H/tool-seed | U |
| H/binding-no-beta | changed system; block_binding=drop_block; no binding beta | binding header requirement | R | 768 | H/tool-seed | pieces |
| H/changed-tools | change synthetic tool description only; actual signed seed replay | tools-prefix binding interaction | A?/R? | 768 | H/tool-seed | U |
| H/cache-5m-write | thinking=disabled; long synthetic prefix; system mark ttl=5m; stream=true | cache write and TTL usage | A | 64 | — | pieces |
| H/cache-5m-read | identical request bytes to cache-5m-write | cache hit or observed miss, not assumed | A | 64 | H/cache-5m-write (repeat request only) | U |
| H/cache-1h-write | thinking=disabled; long synthetic prefix; system mark ttl=1h; stream=true | cache write and TTL usage | A | 64 | — | pieces |
| H/cache-1h-read | identical request bytes to cache-1h-write | cache hit or observed miss, not assumed | A | 64 | H/cache-1h-write (repeat request only) | U |
| H/cache-tool | thinking=disabled; 5m mark at tool; long synthetic prefix | cache-mark placement value | A | 64 | — | pieces |
| H/cache-user | thinking=disabled; 5m mark at user; long synthetic prefix | cache-mark placement value | A | 64 | — | pieces |
| H/cache-assistant | thinking=disabled; 5m mark at assistant; long synthetic prefix | cache-mark placement value | A | 64 | — | pieces |
| H/cache-top-level | thinking=disabled; 5m mark at top-level; long synthetic prefix | cache-mark placement value | A | 64 | — | pieces |
| H/cache-four | four explicit marks, including system/user/tool; thinking off | four-breakpoint limit | A | 64 | — | pieces |
| H/cache-five | five explicit marks; thinking off | fifth explicit breakpoint | R? | 64 | — | U |
| H/cache-four-plus-top | four explicit marks and top-level automatic mark | automatic mark shares four-slot limit | R | 64 | — | pieces |
| H/cache-mixed-valid | 1h mark before 5m mark | TTL order accepted | A | 64 | — | pieces |
| H/cache-mixed-invalid | 5m mark before 1h mark | TTL order invalid | R | 64 | — | pieces |
| H/cache-last-conflict | last user block ttl=1h; top-level ttl=5m | conflicting last-block TTL | R | 64 | — | pieces |
| H/cache-short | short prefix below minimum; one 5m mark | cache hint without actual caching | A | 64 | — | pieces |
| H/cache-empty | empty text block with 5m cache mark | empty text cannot be cached | R | 64 | — | U |
| H/cache-thinking | cache_control on unchanged replayed thinking block | reasoning is not cache-markable | R | 768 | H/tool-seed | pieces |
| H/cache-change-thinking | cache-5m request + same-prefix thinking on | mode change versus cached messages | A | 768 | H/cache-5m-write (repeat prefix only) | pieces |
| H/cache-change-effort | cache-5m request + top-level effort=low; mode unchanged | top-level effort cache invalidation | A | 64 | H/cache-5m-write (repeat prefix only) | pieces |
| H/cache-inline-effort | cache-5m request + inline effort-only instruction + beta; thinking on | inline effort and cache prefix | A | 768 | H/cache-change-thinking (repeat prefix only) | pieces |
| H/cache-change-choice | cache-5m request + tool_choice none, tools unchanged | tool-choice cache invalidation | A | 64 | H/cache-5m-write (repeat prefix only) | pieces |
| H/temperature-default | thinking=disabled; temperature=1 | sampling field accepted/rejected without normalization | A | 256 | — | pieces |
| H/temperature-changed | thinking=disabled; temperature=0 | sampling field accepted/rejected without normalization | R | 256 | — | pieces |
| H/top-p-default | thinking=disabled; top_p=1 | sampling field accepted/rejected without normalization | A | 256 | — | pieces |
| H/top-p-boundary | thinking=disabled; top_p=0.99 | sampling field accepted/rejected without normalization | A | 256 | — | pieces |
| H/top-p-changed | thinking=disabled; top_p=0.5 | sampling field accepted/rejected without normalization | R | 256 | — | pieces |
| H/top-k | thinking=disabled; top_k=1 | sampling field accepted/rejected without normalization | R | 256 | — | pieces |
| H/thinking-sampling-temperature | thinking=adaptive; temperature=0 | sampling with reasoning on; MiMo override | R | 768 | — | pieces |
| H/thinking-sampling-top_p | thinking=adaptive; top_p=0.5 | sampling with reasoning on; MiMo override | R | 768 | — | pieces |
| H/thinking-sampling-top_k | thinking=adaptive; top_k=1 | sampling with reasoning on; MiMo override | R | 768 | — | pieces |
| H/thinking-top-p-valid | thinking=adaptive; top_p=0.95 | budget-model permitted top_p versus newer bound | R | 768 | — | pieces |
| H/sampling-combined | thinking=disabled; temperature=1; top_p=1 | two sampling fields together | A | 256 | — | pieces |
| H/stop-one | thinking=disabled; stop_sequences=[END]; ask OK END EXTRA | one stop string and matched stop sequence | A | 256 | — | pieces |
| H/stop-four | thinking=disabled; stop_sequences=[END,A,B,C] | four stop sequences | A | 256 | — | pieces |
| H/output-one | thinking=disabled; request long text | output-limit stop | A | 1 | — | pieces |
| H/output-zero | thinking=disabled; long cache-marked prefix | zero-output cache warming | A | 0 | — | pieces |
| H/output-negative | thinking=disabled | invalid output limit error | R | -1 | — | pieces |
| H/output-above-ceiling | thinking=disabled; ask exactly OK; cancel immediately if HTTP 200 | server answer to above-model ceiling; pending cap exception | R? | 128001 | — | U; HOLD |
| H/empty-text | user empty text block | empty text validation | R? | 256 | — | U |
| H/first-assistant | messages=[assistant(text), user]; thinking off | first role rule | A | 256 | — | U |
| H/consecutive-user | two adjacent user messages; thinking off | role merging behavior | A | 256 | — | pieces |
| H/auth-bearer | Authorization Bearer instead of default auth header; thinking off | credential-header alternative | A | 64 | — | U |
| H/invalid-beta | anthropic-beta=synthetic-invalid-beta | known rejection error envelope | R | 64 | — | pieces |
| H/inline-tools | system tool_addition then tool_removal; beta=inline-tools-2026-09-15 | mid-conversation tool availability | A | 768 | — | pieces |
| H/cross-model-s | source request unchanged except target model/host/auth; complete assistant blocks and result | tool round continued on another offering | A?/R? | 2048 | S/tool-seed | U |

### Anthropic / Haiku 4.5 — claude-haiku-4-5-20251001 (113 calls maximum)

| Row/name | What is set beyond defaults | What it shows | Expected | max_tokens / max_completion_tokens | Earlier response sent back | Source |
| --- | --- | --- | --- | --- | --- | --- |
| L/plain-json | stream=false; thinking=disabled | nonstream answer, thinking off | A | 256 | — | pieces |
| L/plain-stream | stream=true; thinking=disabled | text deltas, terminal frame, usage, headers | A | 256 | — | pieces |
| L/plain-default | stream omitted; thinking omitted; system omitted | default stream/thinking/effort/display and no cache mark | A | 768 | — | pieces |
| L/system-string | system string; thinking=disabled | base instruction string | A | 256 | — | pieces |
| L/system-blocks | system text-block array; thinking=disabled | base instruction blocks | A | 256 | — | pieces |
| L/reasoning-json | stream=false; thinking=enabled; budget_tokens=1024; display=summarized | complete reasoning blocks and any signature | A | 1536 | — | pieces |
| L/reasoning-stream | stream=true; thinking=enabled; budget_tokens=1024; display=summarized | reasoning/signature deltas and complete ordering | A | 1536 | — | pieces |
| L/tool-seed | stream=false; thinking=enabled; budget_tokens=1024; display=summarized; tools get_value; auto | signed reasoning and genuine tool call for replay | A | 2048 | — | pieces |
| L/tool-replay | stream=true; same tools/system/thinking; actual tool result value 7 | tool round with all reasoning and original call order | A | 2048 | L/tool-seed | U |
| L/tool-replay-no-reasoning | same replay; remove only thinking blocks | omitted reasoning inside tool round | R | 768 | L/tool-seed | U |
| L/tool-replay-empty-signature | same replay; signature="" on every thinking block | empty signature handling | R | 768 | L/tool-seed | U |
| L/tool-replay-no-signature | same replay; remove signature field only | missing signature handling | R | 768 | L/tool-seed | U |
| L/tool-replay-error | same replay; is_error=true; synthetic error result | tool-result error flag | A | 768 | L/tool-seed | pieces |
| L/tool-replay-false | same replay; is_error=false; result as text blocks | tool-result false flag and block content | A | 768 | L/tool-seed | pieces |
| L/tool-replay-cache | same replay; cache_control on tool_use and tool_result | cache mark on call and result blocks | A | 768 | L/tool-seed | pieces |
| L/tool-order-invalid | insert user text before tool_result or leave result unmatched | rejection and raw error body | R | 256 | L/tool-seed | U |
| L/thinking-adaptive | thinking.type=adaptive; effort omitted | thinking-mode value, including rejected modes | R | 768 | — | pieces |
| L/thinking-enabled | thinking.type=enabled; budget_tokens=1024; effort omitted | thinking-mode value, including rejected modes | A | 1536 | — | pieces |
| L/thinking-disabled | thinking.type=disabled; effort omitted | thinking-mode value, including rejected modes | A | 768 | — | pieces |
| L/thinking-between_tools | thinking.type=between_tools; effort omitted | thinking-mode value, including rejected modes | R | 768 | — | pieces |
| L/budget-too-small | thinking=enabled; budget_tokens=1023 | lower budget bound | R | 1536 | — | pieces |
| L/budget-at-output | thinking=enabled; budget_tokens=1536 | budget must be below total output | R | 1536 | — | pieces |
| L/effort-low | thinking=enabled; budget_tokens=1024; output_config.effort=low | effort value with reasoning on | R | 1536 | — | pieces |
| L/effort-medium | thinking=enabled; budget_tokens=1024; output_config.effort=medium | effort value with reasoning on | R | 1536 | — | pieces |
| L/effort-high | thinking=enabled; budget_tokens=1024; output_config.effort=high | effort value with reasoning on | R | 1536 | — | pieces |
| L/effort-xhigh | thinking=enabled; budget_tokens=1024; output_config.effort=xhigh | effort value with reasoning on | R | 1536 | — | pieces |
| L/effort-max | thinking=enabled; budget_tokens=1024; output_config.effort=max | effort value with reasoning on | R | 1536 | — | pieces |
| L/off-effort-xhigh | thinking=disabled; output_config.effort=xhigh | off/effort incompatibility | A? | 256 | — | pieces |
| L/off-effort-max | thinking=disabled; output_config.effort=max | off/effort incompatibility | A? | 256 | — | pieces |
| L/display-summarized | thinking=enabled; budget_tokens=1024; display=summarized | display value; preserve empty thinking with signature | A | 1536 | — | pieces |
| L/display-omitted | thinking=enabled; budget_tokens=1024; display=omitted | display value; preserve empty thinking with signature | A | 1536 | — | pieces |
| L/display-updates | thinking=enabled; budget_tokens=1024; display=updates; beta=thinking-display-updates-2026-08-18 | display value; preserve empty thinking with signature | R? | 1536 | — | pieces |
| L/display-disabled | thinking=disabled; display=summarized | display when disabled | R | 256 | — | pieces |
| L/between-tools-display | thinking=between_tools; display=summarized | between_tools has no additional fields | R | 256 | — | pieces |
| L/display-updates-no-beta | thinking=enabled; budget_tokens=1024; display=updates; no beta | feature header requirement | R | 1536 | — | pieces |
| L/tool-choice-auto | thinking=disabled; tools retained; tool_choice=auto | every native tool choice without deleting tools | A | 768 | — | pieces |
| L/tool-choice-any | thinking=disabled; tools retained; tool_choice=any | every native tool choice without deleting tools | A | 768 | — | pieces |
| L/tool-choice-tool | thinking=disabled; tools retained; tool_choice=tool(get_value) | every native tool choice without deleting tools | A | 768 | — | pieces |
| L/tool-choice-none | thinking=disabled; tools retained; tool_choice=none | every native tool choice without deleting tools | A | 768 | — | pieces |
| L/thinking-tool-choice-any | thinking=enabled; budget_tokens=1024; tools retained; tool_choice=any | forced tool choice with reasoning | R | 1536 | — | pieces |
| L/thinking-tool-choice-tool | thinking=enabled; budget_tokens=1024; tools retained; tool_choice=tool | forced tool choice with reasoning | R | 1536 | — | pieces |
| L/parallel-false | thinking=disabled; auto.disable_parallel_tool_use=false; ask for values 7 and 8 | parallel switch, separate calls if emitted | A | 768 | — | pieces |
| L/parallel-true | thinking=disabled; auto.disable_parallel_tool_use=true; ask for values 7 and 8 | parallel switch, separate calls if emitted | A | 768 | — | pieces |
| L/eager-false | thinking=disabled; tools[].eager_input_streaming=false; stream=true | tool argument fragmentation switch | A | 768 | — | pieces |
| L/eager-true | thinking=disabled; tools[].eager_input_streaming=true; stream=true | tool argument fragmentation switch | A | 768 | — | pieces |
| L/inline-first | messages=[system(text), user]; no beta | system as first message | R | 256 | — | U |
| L/inline-after-user | messages=[user, system(text)]; no beta | system inside conversation at legal end | R | 256 | — | U |
| L/inline-after-assistant | messages=[user, assistant(text), system(text), user] | system after assistant text | R | 256 | — | U |
| L/inline-between-call-result | insert system(text) between actual call and its result | fourth instruction position and paired-call rule | R | 768 | L/tool-seed | U |
| L/inline-after-result | system(text) after actual user tool_result, at end | legal instruction position after result | R | 768 | L/tool-seed | U |
| L/inline-effort | thinking on; system(content="",output_config.effort=low); beta=mid-conversation-output-config-2026-07-01 | effort carried inside conversation | R | 1536 | — | pieces |
| L/inline-effort-off | thinking=disabled; top effort=high; inline effort=low; same beta | effort change with reasoning off | R | 256 | — | pieces |
| L/inline-effort-no-beta | thinking on; inline effort=low; no beta | per-message effort header requirement | R | 1536 | — | pieces |
| L/clear-at | inline system text; clear_at=next_user_message; matching beta | turn-scoped instruction | R | 256 | — | pieces |
| L/clear-at-no-beta | inline system text; clear_at=next_user_message; no beta | turn-scope header requirement | R | 256 | — | pieces |
| L/cut-text | stream=true; thinking off; ask for long enumerated text; cancel after first text delta | deliberate text cut; no terminal frame | A | 256 | — | pieces |
| L/cut-text-user | original history + observed partial assistant text + user Continue; thinking on | cut text followed by user with thinking on | A? | 1536 | L/cut-text | U |
| L/cut-text-prefill-off | original history + observed partial text as last assistant; thinking off | prefill accepted or rejected | A | 256 | L/cut-text | U |
| L/cut-text-prefill-on | same last partial assistant; thinking on | prefill and reasoning interaction | R | 1536 | L/cut-text | U |
| L/cut-thinking | stream=true; thinking=enabled; budget_tokens=1024; display=summarized; cancel after first thinking delta | step cut before signature; raw prefix retained | A | 1536 | — | pieces |
| L/cut-thinking-replay | replay observed incomplete thinking as thinking; append user Continue | incomplete reasoning sent back | R | 1536 | L/cut-thinking | U |
| L/reasoning-outside-omit | complete reasoning-json assistant text only + new user | allowed omission outside tool round | A | 1536 | L/reasoning-json | pieces |
| L/reasoning-outside-keep | complete reasoning-json blocks unchanged + new user | reasoning replay across user turns | A | 1536 | L/reasoning-json | U |
| L/binding-default | change only top-level system; actual signed tool seed replay; no binding control | account default for changed-prefix signature | A?/R? | 1536 | L/tool-seed | U |
| L/binding-error | change system; thinking.block_binding.prefix_mismatch_behavior=error; binding beta | binding control and input_transformations | A?/R? | 1536 | L/tool-seed | U |
| L/binding-drop_block | change system; thinking.block_binding.prefix_mismatch_behavior=drop_block; binding beta | binding control and input_transformations | A?/R? | 1536 | L/tool-seed | U |
| L/binding-no-beta | changed system; block_binding=drop_block; no binding beta | binding header requirement | R | 1536 | L/tool-seed | pieces |
| L/changed-tools | change synthetic tool description only; actual signed seed replay | tools-prefix binding interaction | A?/R? | 1536 | L/tool-seed | U |
| L/cache-5m-write | thinking=disabled; long synthetic prefix; system mark ttl=5m; stream=true | cache write and TTL usage | A | 64 | — | pieces |
| L/cache-5m-read | identical request bytes to cache-5m-write | cache hit or observed miss, not assumed | A | 64 | L/cache-5m-write (repeat request only) | U |
| L/cache-1h-write | thinking=disabled; long synthetic prefix; system mark ttl=1h; stream=true | cache write and TTL usage | A | 64 | — | pieces |
| L/cache-1h-read | identical request bytes to cache-1h-write | cache hit or observed miss, not assumed | A | 64 | L/cache-1h-write (repeat request only) | U |
| L/cache-tool | thinking=disabled; 5m mark at tool; long synthetic prefix | cache-mark placement value | A | 64 | — | pieces |
| L/cache-user | thinking=disabled; 5m mark at user; long synthetic prefix | cache-mark placement value | A | 64 | — | pieces |
| L/cache-assistant | thinking=disabled; 5m mark at assistant; long synthetic prefix | cache-mark placement value | A | 64 | — | pieces |
| L/cache-top-level | thinking=disabled; 5m mark at top-level; long synthetic prefix | cache-mark placement value | A | 64 | — | pieces |
| L/cache-four | four explicit marks, including system/user/tool; thinking off | four-breakpoint limit | A | 64 | — | pieces |
| L/cache-five | five explicit marks; thinking off | fifth explicit breakpoint | R? | 64 | — | U |
| L/cache-four-plus-top | four explicit marks and top-level automatic mark | automatic mark shares four-slot limit | R | 64 | — | pieces |
| L/cache-mixed-valid | 1h mark before 5m mark | TTL order accepted | A | 64 | — | pieces |
| L/cache-mixed-invalid | 5m mark before 1h mark | TTL order invalid | R | 64 | — | pieces |
| L/cache-last-conflict | last user block ttl=1h; top-level ttl=5m | conflicting last-block TTL | R | 64 | — | pieces |
| L/cache-short | short prefix below minimum; one 5m mark | cache hint without actual caching | A | 64 | — | pieces |
| L/cache-empty | empty text block with 5m cache mark | empty text cannot be cached | R | 64 | — | U |
| L/cache-thinking | cache_control on unchanged replayed thinking block | reasoning is not cache-markable | R | 1536 | L/tool-seed | pieces |
| L/cache-change-thinking | cache-5m request + same-prefix thinking on | mode change versus cached messages | A | 1536 | L/cache-5m-write (repeat prefix only) | pieces |
| L/cache-change-effort | cache-5m request + top-level effort=low; mode unchanged | top-level effort cache invalidation | R | 64 | L/cache-5m-write (repeat prefix only) | pieces |
| L/cache-inline-effort | cache-5m request + inline effort-only instruction + beta; thinking on | inline effort and cache prefix | R | 1536 | L/cache-change-thinking (repeat prefix only) | pieces |
| L/cache-change-choice | cache-5m request + tool_choice none, tools unchanged | tool-choice cache invalidation | A | 64 | L/cache-5m-write (repeat prefix only) | pieces |
| L/temperature-default | thinking=disabled; temperature=1 | sampling field accepted/rejected without normalization | A | 256 | — | pieces |
| L/temperature-changed | thinking=disabled; temperature=0 | sampling field accepted/rejected without normalization | A | 256 | — | pieces |
| L/top-p-default | thinking=disabled; top_p=1 | sampling field accepted/rejected without normalization | A | 256 | — | pieces |
| L/top-p-boundary | thinking=disabled; top_p=0.99 | sampling field accepted/rejected without normalization | A | 256 | — | pieces |
| L/top-p-changed | thinking=disabled; top_p=0.5 | sampling field accepted/rejected without normalization | A | 256 | — | pieces |
| L/top-k | thinking=disabled; top_k=1 | sampling field accepted/rejected without normalization | A | 256 | — | pieces |
| L/thinking-sampling-temperature | thinking=enabled; budget_tokens=1024; temperature=0 | sampling with reasoning on; MiMo override | R | 1536 | — | pieces |
| L/thinking-sampling-top_p | thinking=enabled; budget_tokens=1024; top_p=0.5 | sampling with reasoning on; MiMo override | R | 1536 | — | pieces |
| L/thinking-sampling-top_k | thinking=enabled; budget_tokens=1024; top_k=1 | sampling with reasoning on; MiMo override | R | 1536 | — | pieces |
| L/thinking-top-p-valid | thinking=enabled; budget_tokens=1024; top_p=0.95 | budget-model permitted top_p versus newer bound | A | 1536 | — | pieces |
| L/sampling-combined | thinking=disabled; temperature=1; top_p=1 | two sampling fields together | A | 256 | — | pieces |
| L/stop-one | thinking=disabled; stop_sequences=[END]; ask OK END EXTRA | one stop string and matched stop sequence | A | 256 | — | pieces |
| L/stop-four | thinking=disabled; stop_sequences=[END,A,B,C] | four stop sequences | A | 256 | — | pieces |
| L/output-one | thinking=disabled; request long text | output-limit stop | A | 1 | — | pieces |
| L/output-zero | thinking=disabled; long cache-marked prefix | zero-output cache warming | A | 0 | — | pieces |
| L/output-negative | thinking=disabled | invalid output limit error | R | -1 | — | pieces |
| L/output-above-ceiling | thinking=disabled; ask exactly OK; cancel immediately if HTTP 200 | server answer to above-model ceiling; pending cap exception | R? | 64001 | — | U; HOLD |
| L/empty-text | user empty text block | empty text validation | R? | 256 | — | U |
| L/first-assistant | messages=[assistant(text), user]; thinking off | first role rule | A | 256 | — | U |
| L/consecutive-user | two adjacent user messages; thinking off | role merging behavior | A | 256 | — | pieces |
| L/auth-bearer | Authorization Bearer instead of default auth header; thinking off | credential-header alternative | A | 64 | — | U |
| L/invalid-beta | anthropic-beta=synthetic-invalid-beta | known rejection error envelope | R | 64 | — | pieces |
| L/inline-tools | system tool_addition then tool_removal; beta=inline-tools-2026-09-15 | mid-conversation tool availability | R | 768 | — | pieces |
| L/cross-model-s | source request unchanged except target model/host/auth; complete assistant blocks and result | tool round continued on another offering | A?/R? | 2048 | S/tool-seed | U |

### MiMo / Anthropic / 2.6 Pro — mimo-v2.6-pro (118 calls maximum)

| Row/name | What is set beyond defaults | What it shows | Expected | max_tokens / max_completion_tokens | Earlier response sent back | Source |
| --- | --- | --- | --- | --- | --- | --- |
| MA/plain-json | stream=false; thinking=disabled | nonstream answer, thinking off | A? | 256 | — | pieces |
| MA/plain-stream | stream=true; thinking=disabled | text deltas, terminal frame, usage, headers | A? | 256 | — | pieces |
| MA/plain-default | stream omitted; thinking omitted; system omitted | default stream/thinking/effort/display and no cache mark | A? | 768 | — | pieces |
| MA/system-string | system string; thinking=disabled | base instruction string | A? | 256 | — | pieces |
| MA/system-blocks | system text-block array; thinking=disabled | base instruction blocks | A? | 256 | — | pieces |
| MA/reasoning-json | stream=false; thinking=enabled; display=summarized | complete reasoning blocks and any signature | A? | 768 | — | U |
| MA/reasoning-stream | stream=true; thinking=enabled; display=summarized | reasoning/signature deltas and complete ordering | A? | 768 | — | U |
| MA/tool-seed | stream=false; thinking=enabled; display=summarized; tools get_value; auto | signed reasoning and genuine tool call for replay | A? | 2048 | — | pieces |
| MA/tool-replay | stream=true; same tools/system/thinking; actual tool result value 7 | tool round with all reasoning and original call order | A? | 2048 | MA/tool-seed | U |
| MA/tool-replay-no-reasoning | same replay; remove only thinking blocks | omitted reasoning inside tool round | A? | 768 | MA/tool-seed | U |
| MA/tool-replay-empty-signature | same replay; signature="" on every thinking block | empty signature handling | A? | 768 | MA/tool-seed | U |
| MA/tool-replay-no-signature | same replay; remove signature field only | missing signature handling | A? | 768 | MA/tool-seed | U |
| MA/tool-replay-error | same replay; is_error=true; synthetic error result | tool-result error flag | A? | 768 | MA/tool-seed | pieces |
| MA/tool-replay-false | same replay; is_error=false; result as text blocks | tool-result false flag and block content | A? | 768 | MA/tool-seed | pieces |
| MA/tool-replay-cache | same replay; cache_control on tool_use and tool_result | cache mark on call and result blocks | A? | 768 | MA/tool-seed | U |
| MA/tool-order-invalid | insert user text before tool_result or leave result unmatched | rejection and raw error body | A? | 256 | MA/tool-seed | U |
| MA/thinking-adaptive | thinking.type=adaptive; effort omitted | thinking-mode value, including rejected modes | R? | 768 | — | pieces |
| MA/thinking-enabled | thinking.type=enabled; budget_tokens=1024; effort omitted | thinking-mode value, including rejected modes | A? | 1536 | — | pieces |
| MA/thinking-disabled | thinking.type=disabled; effort omitted | thinking-mode value, including rejected modes | A? | 768 | — | pieces |
| MA/thinking-between_tools | thinking.type=between_tools; effort omitted | thinking-mode value, including rejected modes | R? | 768 | — | pieces |
| MA/budget-too-small | thinking=enabled; budget_tokens=1023 | lower budget bound | A? | 1536 | — | pieces |
| MA/budget-at-output | thinking=enabled; budget_tokens=1536 | budget must be below total output | A? | 1536 | — | pieces |
| MA/effort-low | thinking=enabled; output_config.effort=low | effort value with reasoning on | A? | 768 | — | U |
| MA/effort-medium | thinking=enabled; output_config.effort=medium | effort value with reasoning on | A? | 768 | — | U |
| MA/effort-high | thinking=enabled; output_config.effort=high | effort value with reasoning on | A? | 768 | — | U |
| MA/effort-xhigh | thinking=enabled; output_config.effort=xhigh | effort value with reasoning on | A? | 768 | — | U |
| MA/effort-max | thinking=enabled; output_config.effort=max | effort value with reasoning on | A? | 768 | — | U |
| MA/off-effort-xhigh | thinking=disabled; output_config.effort=xhigh | off/effort incompatibility | A? | 256 | — | U |
| MA/off-effort-max | thinking=disabled; output_config.effort=max | off/effort incompatibility | A? | 256 | — | U |
| MA/display-summarized | thinking=enabled; display=summarized | display value; preserve empty thinking with signature | A? | 768 | — | U |
| MA/display-omitted | thinking=enabled; display=omitted | display value; preserve empty thinking with signature | A? | 768 | — | U |
| MA/display-updates | thinking=enabled; display=updates; beta=thinking-display-updates-2026-08-18 | display value; preserve empty thinking with signature | A? | 768 | — | U |
| MA/display-disabled | thinking=disabled; display=summarized | display when disabled | A? | 256 | — | pieces |
| MA/between-tools-display | thinking=between_tools; display=summarized | between_tools has no additional fields | A? | 256 | — | pieces |
| MA/display-updates-no-beta | thinking=enabled; display=updates; no beta | feature header requirement | A? | 768 | — | pieces |
| MA/tool-choice-auto | thinking=disabled; tools retained; tool_choice=auto | every native tool choice without deleting tools | A? | 768 | — | pieces |
| MA/tool-choice-any | thinking=disabled; tools retained; tool_choice=any | every native tool choice without deleting tools | A? | 768 | — | pieces |
| MA/tool-choice-tool | thinking=disabled; tools retained; tool_choice=tool(get_value) | every native tool choice without deleting tools | A? | 768 | — | pieces |
| MA/tool-choice-none | thinking=disabled; tools retained; tool_choice=none | every native tool choice without deleting tools | A? | 768 | — | pieces |
| MA/thinking-tool-choice-any | thinking=enabled; tools retained; tool_choice=any | forced tool choice with reasoning | A? | 768 | — | pieces |
| MA/thinking-tool-choice-tool | thinking=enabled; tools retained; tool_choice=tool | forced tool choice with reasoning | A? | 768 | — | pieces |
| MA/parallel-false | thinking=disabled; auto.disable_parallel_tool_use=false; ask for values 7 and 8 | parallel switch, separate calls if emitted | A? | 768 | — | pieces |
| MA/parallel-true | thinking=disabled; auto.disable_parallel_tool_use=true; ask for values 7 and 8 | parallel switch, separate calls if emitted | A? | 768 | — | pieces |
| MA/eager-false | thinking=disabled; tools[].eager_input_streaming=false; stream=true | tool argument fragmentation switch | A? | 768 | — | pieces |
| MA/eager-true | thinking=disabled; tools[].eager_input_streaming=true; stream=true | tool argument fragmentation switch | A? | 768 | — | pieces |
| MA/inline-first | messages=[system(text), user]; no beta | system as first message | A? | 256 | — | U |
| MA/inline-after-user | messages=[user, system(text)]; no beta | system inside conversation at legal end | A? | 256 | — | U |
| MA/inline-after-assistant | messages=[user, assistant(text), system(text), user] | system after assistant text | A? | 256 | — | U |
| MA/inline-between-call-result | insert system(text) between actual call and its result | fourth instruction position and paired-call rule | A? | 768 | MA/tool-seed | U |
| MA/inline-after-result | system(text) after actual user tool_result, at end | legal instruction position after result | A? | 768 | MA/tool-seed | U |
| MA/inline-effort | thinking on; system(content="",output_config.effort=low); beta=mid-conversation-output-config-2026-07-01 | effort carried inside conversation | A? | 768 | — | pieces |
| MA/inline-effort-off | thinking=disabled; top effort=high; inline effort=low; same beta | effort change with reasoning off | A? | 256 | — | pieces |
| MA/inline-effort-no-beta | thinking on; inline effort=low; no beta | per-message effort header requirement | A? | 768 | — | pieces |
| MA/clear-at | inline system text; clear_at=next_user_message; matching beta | turn-scoped instruction | A? | 256 | — | pieces |
| MA/clear-at-no-beta | inline system text; clear_at=next_user_message; no beta | turn-scope header requirement | A? | 256 | — | pieces |
| MA/cut-text | stream=true; thinking off; ask for long enumerated text; cancel after first text delta | deliberate text cut; no terminal frame | A? | 256 | — | pieces |
| MA/cut-text-user | original history + observed partial assistant text + user Continue; thinking on | cut text followed by user with thinking on | A? | 768 | MA/cut-text | U |
| MA/cut-text-prefill-off | original history + observed partial text as last assistant; thinking off | prefill accepted or rejected | A? | 256 | MA/cut-text | U |
| MA/cut-text-prefill-on | same last partial assistant; thinking on | prefill and reasoning interaction | A? | 768 | MA/cut-text | U |
| MA/cut-thinking | stream=true; thinking=enabled; display=summarized; cancel after first thinking delta | step cut before signature; raw prefix retained | A? | 768 | — | pieces |
| MA/cut-thinking-replay | replay observed incomplete thinking as thinking; append user Continue | incomplete reasoning sent back | A? | 768 | MA/cut-thinking | U |
| MA/reasoning-outside-omit | complete reasoning-json assistant text only + new user | allowed omission outside tool round | A? | 768 | MA/reasoning-json | pieces |
| MA/reasoning-outside-keep | complete reasoning-json blocks unchanged + new user | reasoning replay across user turns | A? | 768 | MA/reasoning-json | U |
| MA/binding-default | change only top-level system; actual signed tool seed replay; no binding control | account default for changed-prefix signature | A? | 768 | MA/tool-seed | U |
| MA/binding-error | change system; thinking.block_binding.prefix_mismatch_behavior=error; binding beta | binding control and input_transformations | A? | 768 | MA/tool-seed | U |
| MA/binding-drop_block | change system; thinking.block_binding.prefix_mismatch_behavior=drop_block; binding beta | binding control and input_transformations | A? | 768 | MA/tool-seed | U |
| MA/binding-no-beta | changed system; block_binding=drop_block; no binding beta | binding header requirement | A? | 768 | MA/tool-seed | pieces |
| MA/changed-tools | change synthetic tool description only; actual signed seed replay | tools-prefix binding interaction | A? | 768 | MA/tool-seed | U |
| MA/cache-5m-write | thinking=disabled; long synthetic prefix; system mark ttl=5m; stream=true | cache write and TTL usage | A? | 64 | — | U |
| MA/cache-5m-read | identical request bytes to cache-5m-write | cache hit or observed miss, not assumed | A? | 64 | MA/cache-5m-write (repeat request only) | U |
| MA/cache-1h-write | thinking=disabled; long synthetic prefix; system mark ttl=1h; stream=true | cache write and TTL usage | A? | 64 | — | U |
| MA/cache-1h-read | identical request bytes to cache-1h-write | cache hit or observed miss, not assumed | A? | 64 | MA/cache-1h-write (repeat request only) | U |
| MA/cache-tool | thinking=disabled; 5m mark at tool; long synthetic prefix | cache-mark placement value | A? | 64 | — | U |
| MA/cache-user | thinking=disabled; 5m mark at user; long synthetic prefix | cache-mark placement value | A? | 64 | — | U |
| MA/cache-assistant | thinking=disabled; 5m mark at assistant; long synthetic prefix | cache-mark placement value | A? | 64 | — | U |
| MA/cache-top-level | thinking=disabled; 5m mark at top-level; long synthetic prefix | cache-mark placement value | A? | 64 | — | U |
| MA/cache-four | four explicit marks, including system/user/tool; thinking off | four-breakpoint limit | A? | 64 | — | pieces |
| MA/cache-five | five explicit marks; thinking off | fifth explicit breakpoint | A? | 64 | — | U |
| MA/cache-four-plus-top | four explicit marks and top-level automatic mark | automatic mark shares four-slot limit | A? | 64 | — | pieces |
| MA/cache-mixed-valid | 1h mark before 5m mark | TTL order accepted | A? | 64 | — | pieces |
| MA/cache-mixed-invalid | 5m mark before 1h mark | TTL order invalid | A? | 64 | — | pieces |
| MA/cache-last-conflict | last user block ttl=1h; top-level ttl=5m | conflicting last-block TTL | A? | 64 | — | pieces |
| MA/cache-short | short prefix below minimum; one 5m mark | cache hint without actual caching | A? | 64 | — | pieces |
| MA/cache-empty | empty text block with 5m cache mark | empty text cannot be cached | A? | 64 | — | U |
| MA/cache-thinking | cache_control on unchanged replayed thinking block | reasoning is not cache-markable | A? | 768 | MA/tool-seed | pieces |
| MA/cache-change-thinking | cache-5m request + same-prefix thinking on | mode change versus cached messages | A? | 768 | MA/cache-5m-write (repeat prefix only) | pieces |
| MA/cache-change-effort | cache-5m request + top-level effort=low; mode unchanged | top-level effort cache invalidation | A? | 64 | MA/cache-5m-write (repeat prefix only) | pieces |
| MA/cache-inline-effort | cache-5m request + inline effort-only instruction + beta; thinking on | inline effort and cache prefix | A? | 768 | MA/cache-change-thinking (repeat prefix only) | pieces |
| MA/cache-change-choice | cache-5m request + tool_choice none, tools unchanged | tool-choice cache invalidation | A? | 64 | MA/cache-5m-write (repeat prefix only) | pieces |
| MA/temperature-default | thinking=disabled; temperature=1 | sampling field accepted/rejected without normalization | A? | 256 | — | pieces |
| MA/temperature-changed | thinking=disabled; temperature=0 | sampling field accepted/rejected without normalization | A? | 256 | — | pieces |
| MA/top-p-default | thinking=disabled; top_p=1 | sampling field accepted/rejected without normalization | A? | 256 | — | pieces |
| MA/top-p-boundary | thinking=disabled; top_p=0.99 | sampling field accepted/rejected without normalization | A? | 256 | — | pieces |
| MA/top-p-changed | thinking=disabled; top_p=0.5 | sampling field accepted/rejected without normalization | A? | 256 | — | pieces |
| MA/top-k | thinking=disabled; top_k=1 | sampling field accepted/rejected without normalization | A? | 256 | — | U |
| MA/thinking-sampling-temperature | thinking=enabled; temperature=0 | sampling with reasoning on; MiMo override | A? | 768 | — | pieces |
| MA/thinking-sampling-top_p | thinking=enabled; top_p=0.5 | sampling with reasoning on; MiMo override | A? | 768 | — | pieces |
| MA/thinking-sampling-top_k | thinking=enabled; top_k=1 | sampling with reasoning on; MiMo override | A? | 768 | — | pieces |
| MA/thinking-top-p-valid | thinking=enabled; top_p=0.95 | budget-model permitted top_p versus newer bound | A? | 768 | — | pieces |
| MA/sampling-combined | thinking=disabled; temperature=1; top_p=1 | two sampling fields together | A? | 256 | — | pieces |
| MA/stop-one | thinking=disabled; stop_sequences=[END]; ask OK END EXTRA | one stop string and matched stop sequence | A? | 256 | — | pieces |
| MA/stop-four | thinking=disabled; stop_sequences=[END,A,B,C] | four stop sequences | A? | 256 | — | pieces |
| MA/output-one | thinking=disabled; request long text | output-limit stop | A? | 1 | — | pieces |
| MA/output-zero | thinking=disabled; long cache-marked prefix | zero-output cache warming | R? | 0 | — | pieces |
| MA/output-negative | thinking=disabled | invalid output limit error | R? | -1 | — | pieces |
| MA/output-above-ceiling | thinking=disabled; ask exactly OK; cancel immediately if HTTP 200 | server answer to above-model ceiling; pending cap exception | R? | 131073 | — | U; HOLD |
| MA/empty-text | user empty text block | empty text validation | A? | 256 | — | U |
| MA/first-assistant | messages=[assistant(text), user]; thinking off | first role rule | A? | 256 | — | U |
| MA/consecutive-user | two adjacent user messages; thinking off | role merging behavior | A? | 256 | — | pieces |
| MA/auth-bearer | Authorization Bearer instead of default auth header; thinking off | credential-header alternative | A? | 64 | — | U |
| MA/auth-x-api-key | x-api-key only; no api-key; thinking off | undocumented key header | A?/AUTH | 64 | — | U; AUTH |
| MA/version-header | add anthropic-version=2023-06-01 | version ignored/accepted/refused | A? | 64 | — | U |
| MA/beta-header | add beta=mid-conversation-output-config-2026-07-01 | beta ignored/accepted/refused | A? | 64 | — | U |
| MA/metadata | metadata.user_id=synthetic-capture | metadata handling without account data | A? | 64 | — | U |
| MA/claude-signature | MiMo thinking with signature replaced by Sonnet seed signature | foreign signature accepted/dropped/rejected | A? | 768 | S/tool-seed + MA/tool-seed | U |
| MA/cross-model-s | source request unchanged except target model/host/auth; complete assistant blocks and result | tool round continued on another offering | A? | 2048 | S/tool-seed | U |
| MA/host-sgp | https://token-plan-sgp.xiaomimimo.com/anthropic/v1/messages; api-key; thinking disabled | Singapore Anthropic route admission | A? | 64 | — | U |
| MA/host-api | https://api.xiaomimimo.com/anthropic/v1/messages; same named key; thinking disabled | documented second host; possible billing-host mismatch | A?/AUTH | 64 | — | U; AUTH |

### MiMo / OpenAI chat / 2.6 Pro — mimo-v2.6-pro (106 calls maximum)

| Row/name | What is set beyond defaults | What it shows | Expected | max_tokens / max_completion_tokens | Earlier response sent back | Source |
| --- | --- | --- | --- | --- | --- | --- |
| MO/plain-json | stream=false; reasoning_effort omitted; thinking omitted | JSON answer and default reasoning | A? | 768 | — | pieces |
| MO/plain-stream | stream=true; stream_options.include_usage=true | text chunks, final usage, DONE, headers | A? | 768 | — | U |
| MO/stream-default | stream omitted; usage options omitted | default stream switch | A? | 768 | — | pieces |
| MO/stream-usage-omitted | stream=true; stream_options omitted | usage without opt-in | A? | 768 | — | U |
| MO/stream-usage-false | stream=true; include_usage=false | usage opt-out | A? | 768 | — | U |
| MO/stream-obfuscation-false | stream=true; include_usage=true; include_obfuscation=false | obfuscation switch | A? | 768 | — | U |
| MO/stream-obfuscation-true | stream=true; include_usage=true; include_obfuscation=true | obfuscation switch | A? | 768 | — | U |
| MO/json-stream-options | stream=false; include_usage=true | stream-only option on nonstream request | A? | 768 | — | pieces |
| MO/thinking-enabled | thinking.type=enabled; effort omitted | MiMo on/off extension; Meta unsupported-field probe | A? | 768 | — | U |
| MO/thinking-disabled | thinking.type=disabled; effort omitted | MiMo on/off extension; Meta unsupported-field probe | A? | 768 | — | U |
| MO/effort-none | reasoning_effort=none | all chat effort values | A? | 768 | — | U |
| MO/effort-minimal | reasoning_effort=minimal | all chat effort values | A? | 768 | — | U |
| MO/effort-low | reasoning_effort=low | all chat effort values | A? | 768 | — | U |
| MO/effort-medium | reasoning_effort=medium | all chat effort values | A? | 768 | — | U |
| MO/effort-high | reasoning_effort=high | all chat effort values | A? | 768 | — | U |
| MO/effort-xhigh | reasoning_effort=xhigh | all chat effort values | A? | 768 | — | U |
| MO/effort-max | reasoning_effort=max | all chat effort values | A? | 768 | — | U |
| MO/verbosity-low | verbosity=low | independent verbosity field | A? | 256 | — | pieces |
| MO/verbosity-medium | verbosity=medium | independent verbosity field | A? | 256 | — | pieces |
| MO/verbosity-high | verbosity=high | independent verbosity field | A? | 256 | — | pieces |
| MO/tool-seed | stream=false; tools get_value; choice auto; ask value 7; MiMo thinking enabled / Meta effort low | genuine tool-call seed | A? | 2048 | — | pieces |
| MO/tool-replay | stream=true; include_usage=true; unchanged assistant call, original reasoning_content if present; tool result 7 | tool round and replayed reasoning extension | A? | 2048 | MO/tool-seed | U |
| MO/tool-replay-omit-reasoning | same round; remove reasoning_content | reasoning omission versus explicit replay | A? | 768 | MO/tool-seed | U |
| MO/tool-replay-empty-reasoning | same round; reasoning_content="" | empty reasoning extension | A? | 768 | MO/tool-seed | U |
| MO/tool-replay-synthetic-reasoning | same round; reasoning_content="Synthetic test reasoning." | non-native field accepted or rejected | A? | 768 | MO/tool-seed | U |
| MO/tool-order-invalid | assistant call + user + tool result, or unmatched tool_call_id | tool placement/error envelope | A? | 256 | MO/tool-seed | U |
| MO/tool-result-blocks | same round; tool content text-block array | tool-result content representation | A? | 768 | MO/tool-seed | pieces |
| MO/tool-result-error | same round; tool result plain string with synthetic error | tool error text without native error flag | A? | 768 | MO/tool-seed | pieces |
| MO/choice-auto | tool_choice=auto; tools retained | native choice value or unsupported-choice rejection | A? | 768 | — | pieces |
| MO/choice-none | tool_choice=none; tools retained | native choice value or unsupported-choice rejection | A? | 768 | — | pieces |
| MO/choice-required | tool_choice=required; tools retained | native choice value or unsupported-choice rejection | A? | 768 | — | pieces |
| MO/choice-function | tool_choice={type:function,function:{name:get_value}}; tools retained | native choice value or unsupported-choice rejection | A? | 768 | — | pieces |
| MO/choice-allowed_tools | tool_choice={type:allowed_tools,allowed_tools:{mode:auto,tools:[get_value]}}; tools retained | native choice value or unsupported-choice rejection | A? | 768 | — | pieces |
| MO/choice-custom | tool_choice={type:custom,custom:{name:echo_value}}; tools retained; declare custom echo_value | native choice value or unsupported-choice rejection | A? | 768 | — | pieces |
| MO/choice-allowed-required | allowed_tools mode=required; tools get_value | allowed-tools mode value | A? | 768 | — | pieces |
| MO/parallel-false | parallel_tool_calls=false; ask for values 7 and 8; choice auto | parallel switch and call indices | A? | 768 | — | U |
| MO/parallel-true | parallel_tool_calls=true; ask for values 7 and 8; choice auto | parallel switch and call indices | A? | 768 | — | U |
| MO/strict-false | tools[].function.strict=false | strictness off | A? | 768 | — | pieces |
| MO/strict-true | strict=true; additionalProperties=false; all properties required | strictness on with valid schema | A? | 768 | — | pieces |
| MO/strict-invalid | strict=true; required omitted; additionalProperties omitted | strict schema validation | A? | 256 | — | pieces |
| MO/instruction-system-first | messages=[system(instruction), user] | base instruction role | A? | 256 | — | U |
| MO/instruction-system-after-user | messages=[user, system(instruction)] | instruction position after user | A? | 256 | — | U |
| MO/instruction-system-after-assistant | messages=[user, assistant(text), system(instruction), user] | instruction position after assistant | A? | 256 | — | U |
| MO/instruction-system-between-call-result | source round with system inserted between call and result | instruction position in tool round | A? | 768 | MO/tool-seed | U |
| MO/instruction-developer-first | messages=[developer(instruction), user] | base instruction role | A? | 256 | — | U |
| MO/instruction-developer-after-user | messages=[user, developer(instruction)] | instruction position after user | A? | 256 | — | U |
| MO/instruction-developer-after-assistant | messages=[user, assistant(text), developer(instruction), user] | instruction position after assistant | A? | 256 | — | U |
| MO/instruction-developer-between-call-result | source round with developer inserted between call and result | instruction position in tool round | A? | 768 | MO/tool-seed | U |
| MO/instruction-blocks | developer content text-block array | segmented instruction text | A? | 256 | — | pieces |
| MO/cut-text | stream=true; ask long enumerated output; cancel after first content delta | cut stream and absent terminal usage | A? | 768 | — | pieces |
| MO/cut-text-user | partial observed assistant content + user Continue | partial answer followed by user | A? | 768 | MO/cut-text | U |
| MO/cut-text-prefill | partial observed content as last assistant message | chat prefill behavior | A? | 768 | MO/cut-text | U |
| MO/cut-reasoning | stream=true; MiMo thinking enabled / Meta effort high; cancel on first reasoning delta, else first text chunk | reasoning cut if exposed; record actual cut trigger | A? | 768 | — | pieces |
| MO/cut-reasoning-replay | observed partial reasoning_content if present + user Continue | partial reasoning replay; skipped if no reasoning field | A? | 768 | MO/cut-reasoning | U |
| MO/reasoning-display-summarized | thinking={type:enabled,display:summarized} | unsupported display extension probe | A? | 768 | — | pieces |
| MO/reasoning-display-omitted | thinking={type:enabled,display:omitted} | unsupported display extension probe | A? | 768 | — | pieces |
| MO/reasoning-display-updates | thinking={type:enabled,display:updates} | unsupported display extension probe | A? | 768 | — | pieces |
| MO/cache-implicit-write | long synthetic developer prefix; prompt_cache_options={mode:implicit,ttl:30m}; cache key=synthetic-capture | implicit cache configuration | A? | 64 | — | U |
| MO/cache-implicit-read | identical request to cache-implicit-write | cache read with same key | A? | 64 | MO/cache-implicit-write (repeat request only) | U |
| MO/cache-explicit-write | long prefix as text parts; one prompt_cache_breakpoint={mode:explicit}; prompt_cache_options={mode:explicit,ttl:30m} | explicit cache breakpoint | A? | 64 | — | U |
| MO/cache-explicit-read | identical request to cache-explicit-write | explicit cache hit or rejection | A? | 64 | MO/cache-explicit-write (repeat request only) | U |
| MO/cache-explicit-no-mark | explicit mode=explicit; ttl=30m; no breakpoint | explicit mode without marks | A? | 64 | — | pieces |
| MO/cache-four | four explicit text-part breakpoints; explicit mode; ttl=30m | four marks | A? | 64 | — | pieces |
| MO/cache-five | five explicit breakpoints; explicit mode; ttl=30m | fifth mark | A? | 64 | — | U |
| MO/cache-implicit-four | implicit mode; four explicit breakpoints | implicit mode consumes mark slot | A? | 64 | — | pieces |
| MO/cache-no-options-write | long identical synthetic prefix; no cache fields | provider-native implicit cache baseline | A? | 64 | — | pieces |
| MO/cache-no-options-read | identical request to cache-no-options-write | cached_tokens and prompt total on compatible host | A? | 64 | MO/cache-no-options-write (repeat request only) | U |
| MO/cache-retention-in_memory | prompt_cache_retention=in_memory | deprecated retention values | A? | 64 | — | pieces |
| MO/cache-retention-24h | prompt_cache_retention=24h | deprecated retention values | A? | 64 | — | pieces |
| MO/cache-key | prompt_cache_key=synthetic-capture-key | cache grouping key | A? | 64 | — | pieces |
| MO/cache-invalid-ttl | prompt_cache_options={mode:explicit,ttl:1h} | chat cache TTL rejection | A? | 64 | — | pieces |
| MO/temperature-default | thinking disabled; temperature=1 | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/temperature-changed | thinking disabled; temperature=0 | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/temperature-upper | thinking disabled; temperature=1.5 | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/top-p-default | thinking disabled; top_p=1 | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/top-p-changed | thinking disabled; top_p=0.5 | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/top-p-lower | thinking disabled; top_p=0.01 | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/frequency-penalty | thinking disabled; frequency_penalty=0.2 | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/presence-penalty | thinking disabled; presence_penalty=0.2 | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/seed | thinking disabled; seed=7 | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/logit-bias | thinking disabled; logit_bias={} | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/n-one | thinking disabled; n=1 | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/n-two | thinking disabled; n=2 | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/logprobs | thinking disabled; logprobs=true | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/top-logprobs | thinking disabled; logprobs=true; top_logprobs=1 | sampling/control field passthrough or rejection | A? | 256 | — | pieces |
| MO/thinking-sampling-temperature | thinking enabled; temperature=0 | reasoning and sampling interaction | A? | 768 | — | pieces |
| MO/thinking-sampling-top_p | thinking enabled; top_p=0.5 | reasoning and sampling interaction | A? | 768 | — | pieces |
| MO/sampling-combined | thinking disabled; temperature=1; top_p=1 | two sampling fields | A? | 256 | — | pieces |
| MO/stop-string | stop=END; ask OK END EXTRA | string stop sequence | A? | 256 | — | pieces |
| MO/stop-one | stop=[END]; ask OK END EXTRA | one stop sequence array | A? | 256 | — | pieces |
| MO/stop-four | stop=[END,A,B,C] | four stop sequences | A? | 256 | — | pieces |
| MO/stop-five | stop=[END,A,B,C,D] | above-four validation | R? | 256 | — | pieces |
| MO/output-one | max_completion_tokens=1; ask long text | length finish and hidden reasoning exhaustion | A? | 1 | — | pieces |
| MO/output-zero | max_completion_tokens=0 | zero output limit validation | R? | 0 | — | pieces |
| MO/output-negative | max_completion_tokens=-1 | invalid limit error envelope | R | -1 | — | pieces |
| MO/output-legacy | max_tokens=256; max_completion_tokens omitted | legacy limit field | A? | 256 | — | U |
| MO/output-both | max_tokens=128; max_completion_tokens=256 | conflicting limit names | A? | 256 | — | U |
| MO/empty-text | user empty text content part | empty text validation | A? | 256 | — | U |
| MO/first-assistant | messages=[assistant(text),user] | first role validation | A? | 256 | — | U |
| MO/consecutive-user | two adjacent user messages | consecutive roles | A? | 256 | — | pieces |
| MO/assistant-null | actual tool-seed replay; assistant content=null | assistant call with null content | A? | 768 | MO/tool-seed | pieces |
| MO/assistant-empty | actual tool-seed replay; assistant content="" | assistant call with empty content | A? | 768 | MO/tool-seed | pieces |
| MO/auth-api-key | api-key instead of Authorization Bearer | documented auth alternative | A? | 64 | — | U |
| MO/output-above-ceiling | max_completion_tokens=131073; ask OK; cancel immediately on HTTP 200 | server output ceiling; pending cap exception | R? | 131073 | — | U; HOLD |
| MO/host-sgp | https://token-plan-sgp.xiaomimimo.com/v1/chat/completions; Authorization Bearer; thinking disabled | Singapore OpenAI route admission | A? | 64 | — | U |
| MO/host-api | https://api.xiaomimimo.com/v1/chat/completions; same named key; thinking disabled | documented second host OpenAI route | A?/AUTH | 64 | — | U; AUTH |

### Meta / OpenAI chat / Muse Spark 1.1 — muse-spark-1.1 (102 calls maximum)

| Row/name | What is set beyond defaults | What it shows | Expected | max_tokens / max_completion_tokens | Earlier response sent back | Source |
| --- | --- | --- | --- | --- | --- | --- |
| MT/plain-json | stream=false; reasoning_effort omitted; thinking omitted | JSON answer and default reasoning | A | 768 | — | pieces |
| MT/plain-stream | stream=true; stream_options.include_usage=true | text chunks, final usage, DONE, headers | A | 768 | — | U |
| MT/stream-default | stream omitted; usage options omitted | default stream switch | A | 768 | — | pieces |
| MT/stream-usage-omitted | stream=true; stream_options omitted | usage without opt-in | A | 768 | — | U |
| MT/stream-usage-false | stream=true; include_usage=false | usage opt-out | A | 768 | — | U |
| MT/stream-obfuscation-false | stream=true; include_usage=true; include_obfuscation=false | obfuscation switch | A?/R? | 768 | — | U |
| MT/stream-obfuscation-true | stream=true; include_usage=true; include_obfuscation=true | obfuscation switch | A?/R? | 768 | — | U |
| MT/json-stream-options | stream=false; include_usage=true | stream-only option on nonstream request | R? | 768 | — | pieces |
| MT/thinking-enabled | thinking.type=enabled; effort omitted | MiMo on/off extension; Meta unsupported-field probe | R? | 768 | — | U |
| MT/thinking-disabled | thinking.type=disabled; effort omitted | MiMo on/off extension; Meta unsupported-field probe | R? | 768 | — | U |
| MT/effort-none | reasoning_effort=none | all chat effort values | R | 768 | — | U |
| MT/effort-minimal | reasoning_effort=minimal | all chat effort values | A | 768 | — | U |
| MT/effort-low | reasoning_effort=low | all chat effort values | A | 768 | — | U |
| MT/effort-medium | reasoning_effort=medium | all chat effort values | A | 768 | — | U |
| MT/effort-high | reasoning_effort=high | all chat effort values | A | 768 | — | U |
| MT/effort-xhigh | reasoning_effort=xhigh | all chat effort values | A | 768 | — | U |
| MT/effort-max | reasoning_effort=max | all chat effort values | R | 768 | — | U |
| MT/verbosity-low | verbosity=low | independent verbosity field | R | 256 | — | pieces |
| MT/verbosity-medium | verbosity=medium | independent verbosity field | R | 256 | — | pieces |
| MT/verbosity-high | verbosity=high | independent verbosity field | R | 256 | — | pieces |
| MT/tool-seed | stream=false; tools get_value; choice auto; ask value 7; MiMo thinking enabled / Meta effort low | genuine tool-call seed | A | 2048 | — | pieces |
| MT/tool-replay | stream=true; include_usage=true; unchanged assistant call, original reasoning_content if present; tool result 7 | tool round and replayed reasoning extension | A | 2048 | MT/tool-seed | U |
| MT/tool-replay-omit-reasoning | same round; remove reasoning_content | reasoning omission versus explicit replay | A | 768 | MT/tool-seed | U |
| MT/tool-replay-empty-reasoning | same round; reasoning_content="" | empty reasoning extension | A?/R? | 768 | MT/tool-seed | U |
| MT/tool-replay-synthetic-reasoning | same round; reasoning_content="Synthetic test reasoning." | non-native field accepted or rejected | R? | 768 | MT/tool-seed | U |
| MT/tool-order-invalid | assistant call + user + tool result, or unmatched tool_call_id | tool placement/error envelope | R | 256 | MT/tool-seed | U |
| MT/tool-result-blocks | same round; tool content text-block array | tool-result content representation | A | 768 | MT/tool-seed | pieces |
| MT/tool-result-error | same round; tool result plain string with synthetic error | tool error text without native error flag | A | 768 | MT/tool-seed | pieces |
| MT/choice-auto | tool_choice=auto; tools retained | native choice value or unsupported-choice rejection | A | 768 | — | pieces |
| MT/choice-none | tool_choice=none; tools retained | native choice value or unsupported-choice rejection | A | 768 | — | pieces |
| MT/choice-required | tool_choice=required; tools retained | native choice value or unsupported-choice rejection | A | 768 | — | pieces |
| MT/choice-function | tool_choice={type:function,function:{name:get_value}}; tools retained | native choice value or unsupported-choice rejection | A | 768 | — | pieces |
| MT/choice-allowed_tools | tool_choice={type:allowed_tools,allowed_tools:{mode:auto,tools:[get_value]}}; tools retained | native choice value or unsupported-choice rejection | A?/R? | 768 | — | pieces |
| MT/choice-custom | tool_choice={type:custom,custom:{name:echo_value}}; tools retained; declare custom echo_value | native choice value or unsupported-choice rejection | A?/R? | 768 | — | pieces |
| MT/choice-allowed-required | allowed_tools mode=required; tools get_value | allowed-tools mode value | A?/R? | 768 | — | pieces |
| MT/parallel-false | parallel_tool_calls=false; ask for values 7 and 8; choice auto | parallel switch and call indices | A | 768 | — | U |
| MT/parallel-true | parallel_tool_calls=true; ask for values 7 and 8; choice auto | parallel switch and call indices | A | 768 | — | U |
| MT/strict-false | tools[].function.strict=false | strictness off | A | 768 | — | pieces |
| MT/strict-true | strict=true; additionalProperties=false; all properties required | strictness on with valid schema | A | 768 | — | pieces |
| MT/strict-invalid | strict=true; required omitted; additionalProperties omitted | strict schema validation | R? | 256 | — | pieces |
| MT/instruction-system-first | messages=[system(instruction), user] | base instruction role | A | 256 | — | U |
| MT/instruction-system-after-user | messages=[user, system(instruction)] | instruction position after user | A | 256 | — | U |
| MT/instruction-system-after-assistant | messages=[user, assistant(text), system(instruction), user] | instruction position after assistant | A | 256 | — | U |
| MT/instruction-system-between-call-result | source round with system inserted between call and result | instruction position in tool round | R? | 768 | MT/tool-seed | U |
| MT/instruction-developer-first | messages=[developer(instruction), user] | base instruction role | A | 256 | — | U |
| MT/instruction-developer-after-user | messages=[user, developer(instruction)] | instruction position after user | A | 256 | — | U |
| MT/instruction-developer-after-assistant | messages=[user, assistant(text), developer(instruction), user] | instruction position after assistant | A | 256 | — | U |
| MT/instruction-developer-between-call-result | source round with developer inserted between call and result | instruction position in tool round | R? | 768 | MT/tool-seed | U |
| MT/instruction-blocks | developer content text-block array | segmented instruction text | A | 256 | — | pieces |
| MT/cut-text | stream=true; ask long enumerated output; cancel after first content delta | cut stream and absent terminal usage | A | 768 | — | pieces |
| MT/cut-text-user | partial observed assistant content + user Continue | partial answer followed by user | A | 768 | MT/cut-text | U |
| MT/cut-text-prefill | partial observed content as last assistant message | chat prefill behavior | R? | 768 | MT/cut-text | U |
| MT/cut-reasoning | stream=true; MiMo thinking enabled / Meta effort high; cancel on first reasoning delta, else first text chunk | reasoning cut if exposed; record actual cut trigger | A | 768 | — | pieces |
| MT/cut-reasoning-replay | observed partial reasoning_content if present + user Continue | partial reasoning replay; skipped if no reasoning field | R? | 768 | MT/cut-reasoning | U |
| MT/reasoning-display-summarized | thinking={type:enabled,display:summarized} | unsupported display extension probe | R? | 768 | — | pieces |
| MT/reasoning-display-omitted | thinking={type:enabled,display:omitted} | unsupported display extension probe | R? | 768 | — | pieces |
| MT/reasoning-display-updates | thinking={type:enabled,display:updates} | unsupported display extension probe | R? | 768 | — | pieces |
| MT/cache-implicit-write | long synthetic developer prefix; prompt_cache_options={mode:implicit,ttl:30m}; cache key=synthetic-capture | implicit cache configuration | A?/R? | 64 | — | U |
| MT/cache-implicit-read | identical request to cache-implicit-write | cache read with same key | A?/R? | 64 | MT/cache-implicit-write (repeat request only) | U |
| MT/cache-explicit-write | long prefix as text parts; one prompt_cache_breakpoint={mode:explicit}; prompt_cache_options={mode:explicit,ttl:30m} | explicit cache breakpoint | R? | 64 | — | U |
| MT/cache-explicit-read | identical request to cache-explicit-write | explicit cache hit or rejection | R? | 64 | MT/cache-explicit-write (repeat request only) | U |
| MT/cache-explicit-no-mark | explicit mode=explicit; ttl=30m; no breakpoint | explicit mode without marks | R? | 64 | — | pieces |
| MT/cache-four | four explicit text-part breakpoints; explicit mode; ttl=30m | four marks | R? | 64 | — | pieces |
| MT/cache-five | five explicit breakpoints; explicit mode; ttl=30m | fifth mark | R? | 64 | — | U |
| MT/cache-implicit-four | implicit mode; four explicit breakpoints | implicit mode consumes mark slot | R? | 64 | — | pieces |
| MT/cache-no-options-write | long identical synthetic prefix; no cache fields | provider-native implicit cache baseline | A | 64 | — | pieces |
| MT/cache-no-options-read | identical request to cache-no-options-write | cached_tokens and prompt total on compatible host | A | 64 | MT/cache-no-options-write (repeat request only) | U |
| MT/cache-retention-in_memory | prompt_cache_retention=in_memory | deprecated retention values | A?/R? | 64 | — | pieces |
| MT/cache-retention-24h | prompt_cache_retention=24h | deprecated retention values | A?/R? | 64 | — | pieces |
| MT/cache-key | prompt_cache_key=synthetic-capture-key | cache grouping key | A?/R? | 64 | — | pieces |
| MT/cache-invalid-ttl | prompt_cache_options={mode:explicit,ttl:1h} | chat cache TTL rejection | R? | 64 | — | pieces |
| MT/temperature-default | temperature=1 | sampling/control field passthrough or rejection | A | 256 | — | pieces |
| MT/temperature-changed | temperature=0 | sampling/control field passthrough or rejection | A | 256 | — | pieces |
| MT/temperature-upper | temperature=1.5 | sampling/control field passthrough or rejection | A | 256 | — | pieces |
| MT/top-p-default | top_p=1 | sampling/control field passthrough or rejection | A | 256 | — | pieces |
| MT/top-p-changed | top_p=0.5 | sampling/control field passthrough or rejection | A | 256 | — | pieces |
| MT/top-p-lower | top_p=0.01 | sampling/control field passthrough or rejection | A | 256 | — | pieces |
| MT/frequency-penalty | frequency_penalty=0.2 | sampling/control field passthrough or rejection | A | 256 | — | pieces |
| MT/presence-penalty | presence_penalty=0.2 | sampling/control field passthrough or rejection | A | 256 | — | pieces |
| MT/seed | seed=7 | sampling/control field passthrough or rejection | A | 256 | — | pieces |
| MT/logit-bias | logit_bias={} | sampling/control field passthrough or rejection | R | 256 | — | pieces |
| MT/n-one | n=1 | sampling/control field passthrough or rejection | A | 256 | — | pieces |
| MT/n-two | n=2 | sampling/control field passthrough or rejection | R | 256 | — | pieces |
| MT/logprobs | logprobs=true | sampling/control field passthrough or rejection | R | 256 | — | pieces |
| MT/top-logprobs | logprobs=true; top_logprobs=1 | sampling/control field passthrough or rejection | R | 256 | — | pieces |
| MT/thinking-sampling-temperature | reasoning_effort high; temperature=0 | reasoning and sampling interaction | A | 768 | — | pieces |
| MT/thinking-sampling-top_p | reasoning_effort high; top_p=0.5 | reasoning and sampling interaction | A | 768 | — | pieces |
| MT/sampling-combined | temperature=1; top_p=1 | two sampling fields | A | 256 | — | pieces |
| MT/stop-string | stop=END; ask OK END EXTRA | string stop sequence | R | 256 | — | pieces |
| MT/stop-one | stop=[END]; ask OK END EXTRA | one stop sequence array | R | 256 | — | pieces |
| MT/stop-four | stop=[END,A,B,C] | four stop sequences | R | 256 | — | pieces |
| MT/stop-five | stop=[END,A,B,C,D] | above-four validation | R | 256 | — | pieces |
| MT/output-one | max_completion_tokens=1; ask long text | length finish and hidden reasoning exhaustion | A | 1 | — | pieces |
| MT/output-zero | max_completion_tokens=0 | zero output limit validation | R? | 0 | — | pieces |
| MT/output-negative | max_completion_tokens=-1 | invalid limit error envelope | R | -1 | — | pieces |
| MT/output-legacy | max_tokens=256; max_completion_tokens omitted | legacy limit field | A | 256 | — | U |
| MT/output-both | max_tokens=128; max_completion_tokens=256 | conflicting limit names | A?/R? | 256 | — | U |
| MT/empty-text | user empty text content part | empty text validation | R? | 256 | — | U |
| MT/first-assistant | messages=[assistant(text),user] | first role validation | A | 256 | — | U |
| MT/consecutive-user | two adjacent user messages | consecutive roles | A | 256 | — | pieces |
| MT/assistant-null | actual tool-seed replay; assistant content=null | assistant call with null content | A | 768 | MT/tool-seed | pieces |
| MT/assistant-empty | actual tool-seed replay; assistant content="" | assistant call with empty content | A | 768 | MT/tool-seed | pieces |


## Coverage, excluded observations and written fixtures

Native finite values are all explicit: true/false/omitted stream; every Anthropic thinking
mode plus omitted/default and budget bounds; five Anthropic and seven chat efforts; three
display forms; four Anthropic and all six chat choice forms plus allowed-tools modes;
parallel booleans; no/explicit/automatic/implicit cache marks, all native TTLs and count
bounds; both limit names on chat, zero/one/ordinary/invalid/above-ceiling values; each
sampling field, default/changed representative numeric values, stop string/arrays; all
instruction positions/roles; complete, omitted, unsigned, foreign, cut and changed-prefix
reasoning. Continuous numeric domains are represented at valid/default/changed/boundary
values, not every real number. Lifetimes from the OTHER format are not inserted into native
configuration except the explicit invalid TTL row.

Interactions covered: reasoning/forced choice, reasoning/sampling, off/effort, off/display,
budget/output, signature/prefix/model, tool result/order/instruction, tool choice/cache,
top-level effort/cache, inline effort/cache, mode/cache, implicit cache/explicit slot count,
automatic cache/explicit slot count, mixed TTL order and conflicting last TTL, streaming/
usage/obfuscation, cut reasoning/signature and replay, prefill/thinking.

Not provoked with costly, harmful or account-changing traffic: overload/rate-limit/billing
failures; content filtering/refusal; redacted thinking; unknown frames; Haiku 4.5 filling its
200K context without a context beta; provider-run tools/pause_turn; Batch; account key classes
the owner has not supplied. Observe any naturally present ping/transformations/refusal/
rate-limit/usage fields and report exact absence as absence on the recorded sample, not as
unsupported. Context-window exhaustion would require an additional expensive long input row;
it is outside this matrix and remains unverified. The question whether prompt_tokens includes
cached_tokens needs real cache usage; compare the repeated inputs and retain raw counts, not
a guessed neutral subtraction. No OpenAI account or key is assumed: its compatible schema
is probed on MiMo/Meta, not api.openai.com.

Separate written fixtures, no network and no call count:

- anthropic-stream-overloaded — documented error event after 200, origin written.
- chat-stream-error — documented/assumed compatible error envelope after 200; assumptions
  named in shows, origin written; no claim it came from MiMo or Meta.
- anthropic-billing-error — documented 402 envelope, origin written; no real account id.
- anthropic-redacted-thinking — documented redacted block shape, dummy opaque payload explicitly
  not a genuine valid signature, origin written.
- anthropic-stream-unknown — unknown SSE event inserted into a written stream, origin written.
- chat-stream-keep-alive — comment lines in a written stream, origin written; no claim the
  provider emitted them.

Data-only synthetic fixtures can later prove parser behavior. They cannot prove live
acceptance or support.

## Counts, pricing and dollar envelope

Published rates per million tokens, USD:

| Model/provider | Input | Output | Cache assumptions |
| --- | --- | --- | --- |
| Sonnet 5.5 | 2.00 | 10.00 | 5m write 2.50; 1h write 4.00; read 0.10 |
| Haiku 5.5 (short prompts) | 0.10 | 0.50 | 5m write 0.125; 1h write 0.20; read 0.01 |
| Haiku 4.5 | 1.00 | 5.00 | 5m write 1.25; 1h write 2.00; read 0.10 |
| MiMo 2.6 Pro overseas | 0.435 | 0.87 | read 0.0036; write currently free |
| Meta Muse Spark 1.1 Standard | 1.25 | 4.25 | cached input 0.15 |

[Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing),
[MiMo API pricing](https://mimo.mi.com/static/docs/price/pay-as-you-go.md),
[Meta pricing](https://dev.meta.ai/docs/pricing-rate-limits).

Estimate deliberately charges every ordinary request to its full listed positive output
cap even expected 400s. Input assumption: 1,024 tokens per ordinary request, plus 2,048 per
response-replay row; each cache row gets 2,048 input tokens, except 8,192 for Haiku 4.5.
Every Claude cache row is costed as a 1h write, including reads and malformed rows.
These are conservative sizing estimates, not a promise of usage or billing. Long synthetic
prefix token counts are checked from the captured write; if actual input exceeds the
assumption, reprice remaining rows before the next call. No separate paid token-counting
request is allowed.

| Group | Requests maximum | Estimated input + replay tokens | Ordinary output cap sum | Estimate USD |
| --- | --- | --- | --- | --- |
| S | 115 | 189440 | 65025 | 1.1151 |
| H | 113 | 183296 | 60929 | 0.0531 |
| L | 113 | 312320 | 86273 | 0.9157 |
| MA | 118 | 190464 | 61249 | 0.1361 |
| MO | 106 | 150528 | 50497 | 0.1094 |
| MT | 102 | 147456 | 50305 | 0.3981 |
| Total | 667 | 1173504 | 374278 | 2.7276 |

Provider count limits: Anthropic 341; MiMo 224 (118 Anthropic, 106 chat, all host/auth probes
included); Meta 102. Above-ceiling HOLD rows are already included, not additional retries.
If all five HOLD requests unexpectedly accept and bill their FULL requested output, reserve
an additional $1.8921. Total with that reserve: $4.6197. Round the planning envelope to $4.70,
leaving $0.30 below the $5 limit. This includes MiMo calls valued at overseas PAYG prices even
when a token-plan quota pays for them. Token-plan actual cash billing cannot be inferred from
response usage: report quota usage separately and a PAYG-equivalent estimate. No subscription
purchase, balance read or account-console change is authorized.

Ledger reprices actual usage with cache categories when present and keeps provider usage
verbatim. For a cancelled/read-failed request without final usage, reserve that row's full
output cap plus estimated input until final account billing is known; never call missing
usage free. Rejections are kept and costed conservatively if no usage is provided.
Do not issue a next request if actual cost + conservative pending reservations + its estimate
could exceed $5. No automatic top-ups or balance endpoints.

If the budget needs reduction, first propose dropping HOLD ceiling probes ($1.8921 reserve),
then the duplicate 1h cache sequences/mixed placement probes, then repeated unsupported
schema/sampling shape probes. Those drops reduce acceptance coverage; document them and
obtain revised GO rather than silently claiming P01-I05 complete.

## Call order, ledger and stop rule

1. Admission/plain calls on S, H, L, Meta, then MA/host-sgp and MO/host-sgp. An unavailable
   model is recorded once as rejection; do not substitute a different model or list models.
2. Produce complete reasoning/tool seeds on admitted models, then ordinary and cross-model
   tool rounds. Process prerequisites topologically, regardless of table row order.
3. For each provider/model, cache write/read pairs run immediately together. Cache-affecting
   mutations branch from the recorded unchanged prefix. No TTL expiry waits/calls are added.
4. Remaining reasoning/effort/choice/sampling/instruction/limit/stream/cut rows, keeping each
   cut and its follow-up together. Invalid requests remain single explicit calls.
5. Authorized HOLD requests last among non-authentication probes.
6. Authentication tail, AFTER all ordinary primary-host rows: MA/host-api, MO/host-api, then
   MA/auth-x-api-key. If the first tail probe returns 401, the remaining MiMo tail is skipped.
   Anthropic bearer and MiMo api-key/bearer alternatives are placed after their ordinary rows
   as well, since an alternative key header can cause a real authentication failure.

Before each fetch, append a credential-free started entry to
`journal/features/inference/tasks/capture-traffic/ledger.jsonl`: ordinal, matrix row,
provider/model/format, public host/path, timestamp, input/output estimate and body SHA-256.
After fetch, append finished entry: status, fixture/step references, observed terminal state,
verbatim token usage if present, actual estimate/reservation, outcome against expectation.
A failed fetch still counts. Ledger order is the call order. A crash with a started-only row
consumes its count and full reservation; never repeat it implicitly. Prepared request files
contain synthetic text only; the keys are never ledger fields. The global ledger and public
provider notes are data from this capture, not a replacement for fixture.json.

Stop that provider on any 401/403 authentication/permission failure, 402/billing/quota error,
or spend-cap response, including the expected wrong-host possibility. Keep the failed
exchange if safe, report, and make no further request to that provider. A transport timeout,
429 or other unexpected response is recorded without retry; independent later rows proceed
only if it is not an authentication/billing failure, count/budget cap or safety refusal.
Missing prerequisites skip dependent rows with a recorded reason; no invented live tool
call or signature fills the hole. Stop a provider when its count is reached; stop all calls
at $5 risk or any credential-persistence refusal. Continue useful offline work and other
providers whose credentials did not fail.

This means a full 667-call delivery is conditional. A strict stop rule cannot guarantee
both second-host formats AND x-api-key probes when the same plan key is incompatible with
the PAYG host. This is an explicit GO decision, not a retry loophole.

## Decisions needed in GO and scope limits

- Confirm Meta `muse-spark-1.1`, or give the actual caller-selected Meta model. The
  allowed provider folder does not prove which one the owner runs. If it changes, rewrite
  the MT matrix/model/pricing before any Meta request, with approval of that concrete row.
- Authorize the five above-ceiling requests as explicit exceptions to the ~2,000-token cap,
  or leave them HOLD and accept/report the missing live evidence. They cannot be sent merely
  because G019 mentions them while the binding cap remains.
- Choose the authentication-tail priority/coverage consequence: the proposed ordering tests
  the second Xiaomi host before undocumented x-api-key; any authentication failure stops
  MiMo. The strict stop rule is followed unless the brief is explicitly amended. Do not
  claim all fields were captured if remaining probes are skipped.
- Accept documentation-only/synthetic coverage for unprovokable failures, redacted reasoning
  and context-window exhaustion; no giant prompt or attempt to drain credit is included.
- Accept the tsconfig addition beyond the suggested manifest/barrel/fixtures skeleton.
- No extra write paths are needed. Current grant already permits planned code, generated
  adapters/indexes, claims, package metadata and this task directory. Reading sibling
  tooling/manifests/helper modules after GO is needed for implementation style.
- No external dependency is proposed. pnpm workspace configuration/types/testing dependencies
  are reused. Shared manifests/lockfile are touched only after test-setup acceptance.
- This gate may report a repository check failure elsewhere but may not fix it by crossing
  grant/scope, changing test-setup files, or implementing before GO.

## Names and sibling review

Actual names introduced in this plan-only delivery:

- `plan.md` — mirrors worker task plan.md in journal/SPEC.md.
- `log.md` — mirrors worker task log.md in journal/SPEC.md.
- `report.md` — mirrors worker task report.md in journal/SPEC.md.

Proposed implementation/data names for GO:

- `tooling/capture.ts`, `pnpm capture` — mirror tooling/test.ts and pnpm test.
- `tooling/capture.test.ts` — mirrors tooling/test.test.ts.
- `@kuib-ai/inference`, `Inference`, `src/index.ts` — mirror the engine
  package's package/barrel pattern and Provider aggregate read in the assigned context;
  inspect actual root sibling barrel pattern before implementation.
- `capture` (importable operation) — no exact existing capture sibling; owner review.
- `CaptureRequest` — mirrors Request in tooling/test.ts with the capture namespace.
- `CaptureResponse`, `CaptureResult` — symmetric with CaptureRequest; no existing
  capture sibling, owner review. Introduce only types actually needed.
- `fixture.json`, `shows`, `origin` — existing fixture convention, reused.
- `001.request.json`/`001.response.json` and
  `001.request.body.json`/`001.response.bin` — symmetric request/response;
  new sequence file pattern with no existing sibling in assigned context, owner review.
- `001.chunks.json`, `sequence.json`, `ledger.jsonl`, provider-note JSON files —
  no existing equivalent in the assigned context; owner review.
- `get_value`/`echo_value` — synthetic schema names paired by the value idea;
  no codebase sibling, owner review.
- Fixture case suffixes repeat the same native setting words across models/formats; format
  differences such as tool_choice any/required are explicitly native, not two code names
  for one neutral behavior.
- Existing asymmetry: first-line @claim is present on fixture.origin.enum twice; provider
  resolution tests read in this context have no module @claim while their implementation
  does. These files belong to test-setup/engine scope and remain untouched.
- Existing drift: engine uses MiMo 2.5 Pro in live-test default; capture intentionally uses
  2.6 Pro per D018. Do not rename engine/defaults here.

## What captures have established about the pieces

Nothing yet: zero provider calls at the plan gate. Public documentation updates (ttp- team
key prefixes, Meta's private chat reasoning and unsupported choices/settings) inform
expectations only. The implementation report will end with actual names/siblings and the
specific pieces claims confirmed, contradicted, or still unverified by each fixture.

## Implementation under the build-only GO

The brief's Go section overrides the original matrix approval assumption: only the tool,
its tests and the package scaffold are built. A second orchestrator message naming approved
groups and rows is required before keys are read or provider requests are sent. No Meta
model is named in code; all five above-ceiling rows stay HOLD and the tool rejects a limit
above 2,048 even when another output-limit field is also supplied.

The implemented CLI is `pnpm capture prepare` with request configuration on stdin,
`pnpm capture record <fixture-request.json>`, `pnpm capture sequence <paths.json>` (a JSON
array of stored request paths) and `pnpm capture audit`. Preparation on stdin avoids a
second stored prepared-request file. Recorded files are now nested under
`packages/inference/fixtures/<offering>/<case>/`; sequence.json holds references rather than
duplicate envelopes/bodies. The real Testing.loadFixture loads `<offering>/<case>` without
any testing-package changes. Every test's data is temporary, inside its own sandbox.

Capture.prepare takes a CaptureRequest object with provider, offering, name, step, row,
shows, approved URL, optional public headers/authHeader, exact JSON body text, and a price
record (input/output USD per million, inputTokens estimate, optional cache rates). A cut
trigger or replay reference is optional. The CLI obtains the single named provider key
only at actual preparation/recording time; it has not been invoked that way with a real key.
Capture.capture reads the existing request, so it never regenerates or reformats body bytes.

Each ledger is protected by an exclusive file lock. Count/dollar/stop checks are performed
under that lock before fetch, including prior started-only calls. A missing final usage,
timeout, deliberate cut, or SSE stream missing its terminal frame keeps the full reservation.
Reservations use at least the body byte length as an input-token estimate and the longest
cache-write rate for a cache hint. This is stricter than the draft matrix estimate: reprice
the actual prepared rows before live approval, and retain the five-dollar stop boundary.
An interrupted process may leave a lock and a started-only ledger entry; review that call
before manually clearing the lock. No automatic retry or lock reclamation is implemented.

The implementation has no new external dependency. Platform node:util.parseEnv handles
dotenv quoting without mutating the environment. The minimal inference package uses only
existing workspace/catalog dev dependencies for tsgo declarations/configuration.

Build validation: 39 real-loopback test steps pass; full pnpm run check passes with 53
successful Nx tasks over 18 projects. The implementation report contains the final files,
claims, names and the explicit matrix-approval blocker.

## Review fixes under the build-only Resume

The latest Resume changes rejection accounting: a complete 400–499 answer without usage
releases its reservation at zero. Reported usage still determines cost when present, and
cancelled, incomplete and read-failed answers retain their full reservation. The earlier
draft's rejection-reservation estimate is superseded by this explicit ruling.

runSequence returns SequenceResult with results and stop. After two consecutive results
that are fetch-failed or carry status 429/500–599, it returns stop=consecutive-transient-failures.
That ends the run without retry or a permanent provider stop. Those requests remain counted
and cannot be sent again; a later run can use fresh rows. Any non-transient result resets
the streak. Existing authentication/billing stops retain their stronger persistent behavior.

Ten new real-loopback test steps cover both review fixes. All 49 capture steps and the
guarded full pnpm run check are green. No live matrix row or real credential is authorized
by this Resume; the task remains blocked on the owner's matrix approval.

## Owner-approved stage A checkpoint — 2026-10-13

The latest Resume and D027 approve all 667 rows, Meta muse-spark-1.1 and the five exact
ceiling probes. The original HOLD/model-approval notes above are superseded. Only stage A
admissions were authorized for this turn; all later requests still await fixture review.

rows.priced.json records the full dependency order and estimates before any live call.
Expected full-matrix estimate: $3.80796065. Stage A maximum reservation: $0.03945344.
The actual 12 calls price to $0.001647 from reported usage (complete MiMo 401 costs zero).
All named exceptions are tested, require headers cut and full reservation, and were not
called in stage A. The tool's five-dollar guard remains unchanged.

Stage A intended 13 rows: three plain cases each on S/H/L, MA/host-sgp, MO/host-sgp, then
MT/plain-json and MT/plain-stream. Meta was last per the latest instruction. Twelve rows
were sent once: all nine Claude cases and both Meta cases answered 200; MA/host-sgp answered
401 and stopped MiMo, so MO/host-sgp was skipped and remains unprepared.

The 12 recorded fixtures load via Testing.loadFixture; hashes/read lengths match exact
bytes and their requests match the priced admission hashes. pnpm capture audit passes
over 84 files. No key/header/account value was printed or retained in observations/logs.
Raw data and safe numerical observations are linked in the task report.

The scoped-root preparation bug found before the first inference call is fixed/tested,
and the CLI emits only safe static error codes. All 55 capture test steps and the final
guarded pnpm run check are green. Task status is blocked for the orchestrator to review
stage A and decide how to handle MiMo's authentication stop before the next stage.
