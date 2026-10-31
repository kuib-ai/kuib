# research-harnesses — log

## 2026-10-08

- Read WORKER.md, brief, `journal/features/inference/plan.md`,
  `research/structure-and-names-2026-10-08.md`, and the four named sections of
  `engine-foundation/research/engine-design-2026-10-07.md`.
- Cloned shallowly into `/tmp/kuib-prior-art/research-harnesses/`:
  - `openai/codex@e974aad` (2026-10-08)
  - `charmbracelet/crush@140e8cb` (2026-10-06)
  - `charmbracelet/fantasy@b0fadc9` (2026-10-06)
  - `charmbracelet/catwalk@8eb2a29` (2026-10-08)
  - `block/goose@9560429` (2026-10-07)
- Next: survey each primary subject on axes A to J, source first, then issue trackers.
- Spawned three read-only Explore sub-agents (Codex, Crush+fantasy+catwalk, Goose) for source
  surveys on axes A to J; every citation they return is to be re-read before it is cited.
- Issue tracker pass, Codex (GitHub API, read 2026-10-08; cached under
  `/tmp/kuib-prior-art/research-harnesses/_issues/`): #7051 (chat wire regressions 0.59 to 0.66,
  maintainer: "Maintaining support for this old wire protocol is becoming increasingly
  challenging and costly"), #17541 (model switch → `invalid_encrypted_content`), #38855
  (`item_` ids from a custom provider rejected by OpenAI, expects `rs_`), #36586 (DeepSeek
  provider drops `encrypted_content` agent message, subagent gets empty task), #19661 (resume
  omits `encrypted_content`), #44363 (compaction rewrote rollout in place, transcript lost),
  #35925 (cache misses after pruning/retry = 94% of uncached cost), #35739 (`store` decided by
  `is_azure_responses_endpoint()`; renaming provider to "azure" is the workaround), #37475
  (Bedrock input rejected in 0.147.0).
- Next: discussion #7782 (chat deprecation rationale); Crush, fantasy, Goose trackers.
- Read `openai/codex` discussion #7782 (chat/completions deprecation, 2025-12-09; removed by
  PR #10157, Feb 2026): "has increasingly hampered our ability to improve Codex … added
  complexity, introduced regressions, and increased support overhead". Lead for the "deepseek
  harness": #36586 mentions "the official DeepSeek one-command setup" writing a Codex
  `models.json`; DeepSeek requires `reasoning_content` replay on tool rounds.
- Crush tracker (search API, read 2026-10-08): #2489 (thinking blocks modified in the
  conversion chain), #3788 (abort during reasoning → assistant message with no content → 400),
  #1860 (aborted tool → no tool_result → session corrupt), #1464 (catwalk defaults merged only
  for the selected model), #3050 (system message not at the beginning), #2696 + #2754
  (DeepSeek: `reasoning_content` must be passed back) against #1590 (Mistral: rejects
  `reasoning_content`), #1698 (Gemini corrupted thought signature), #3741 + #1061
  (`max_tokens` vs `max_completion_tokens`, by model).
- fantasy tracker: #330 (empty `reasoning_content` moves between turns → prefix cache
  re-branches), #406 + #411 (Responses replay drops encrypted reasoning, item ids, error
  details), #305 (no cache breakpoint inside the system prompt via Agent API), #177
  (`ToolChoiceNone` never sent on Anthropic), #80 (Gemini thought_signature not sent), #217
  (openaicompat options closed; DeepSeek `thinking` toggle not expressible).
- catwalk tracker: #558 (wrong `reasoning_levels` → upstream 1210 errors), #258 (per-model
  attachment limit not expressible; consumers hard-code).
- GitHub API unauthenticated: core 60/h (about half used), search 10/min. `block/goose` now
  redirects to `aaif-goose/goose`.
- Goose tracker (`aaif-goose/goose`, search API, read 2026-10-08): #11019 (cache-safe request
  assembly: volatile block placement "re-decided independently in ~11 request-assembly paths,
  of which 2 have tests"; fixes #10030, #10937, #10993 each provider-specific), #10821
  (reasoning decided by "explicit model metadata, canonical model metadata, hard-coded
  model-name checks, provider-specific exception lists, request parameters, legacy environment
  variables"), #12090 (empty-text thinking with signature persisted; #11836 fixed native
  Anthropic only, Databricks excluded), #12164 (trailing assistant message → 400 on no-prefill
  providers), #10807 (ACP tool title stored as tool name → >200 chars → permanent 400 after
  switching to an Anthropic-format provider), #11975 (thinking-only response silently ends the
  turn), #11051 (mid-stream failure reported as success), #8807 + #9434 (DeepSeek thinking not
  passed back), #10032 (`GOOSE_CONTEXT_LIMIT` overrides canonical limits).
- Next: wait for the three source surveys, re-read every citation, write the research file.
- Secondary sources cloned sparsely (same folder): `cline/cline@ae9e1ef` (2026-10-07; model
  layer now `sdk/packages/llms`), `RooCodeInc/Roo-Code@b867ec9` (2026-05-15),
  `zed-industries/zed@dc3fb21` (2026-10-08), `Aider-AI/aider@5dc9490` (2026-05-22).
- Secondary evidence read so far (by me, at those commits):
  - Aider `aider/resources/model-settings.yml`: 3128 lines, 357 `- name:` rows, 44 naming
    "sonnet"; Claude 3.7 Sonnet alone has 12 rows (lines 187 to 345), one slug per way a
    provider names it, `vertex_ai/claude-3-7-sonnet@20250219` twice (306 and 318).
    `aider/models.py:438-587` is a second, substring-sniffing fallback for names not in the
    file (`if "deepseek" in model and ("r1" in model or "reasoning" in model)` at 500).
  - Roo `src/api/providers`: 29 handler classes in a tree (`DeepSeekHandler extends
    OpenAiHandler`, `VertexHandler extends GeminiHandler`, `MoonshotHandler extends
    OpenAICompatibleHandler`), 24 model-id substring checks in `src/api` (non-test).
  - Cline `sdk/packages/llms/src/providers/routing/provider-option-rules.ts`: 22 predicate
    rules; the default rule fans the options out under every provider key
    (`provider.generic-fanout`, line 217) and other rules exist to suppress it
    (`suppresses: { genericThinking: true }`; one rule at 479 only suppresses).
    `model-facts.ts` holds the predicates: substring and regex tests on model id, family and
    base URL (lines 121 to 458).
  - Zed `crates/language_model_core/src/language_model_core.rs:42-69`: the event enum carries
    `Thinking { text, signature }`, `RedactedThinking { data }`, `ReasoningDetails(serde_json::Value)`,
    `Compaction(..)`, `StartMessage { message_id }`; `request.rs:355-361` adds a message-level
    `reasoning_details: Option<Arc<serde_json::Value>>` beside `MessageContent::Thinking`.
    Each provider file decides alone what to do with thinking: dropped in
    `language_models/src/provider/open_router.rs:482` and `lmstudio.rs:378`, kept as text in
    `deepseek.rs:394` and `mistral.rs:375`.
- Research file created with frontmatter and "What was read"; other sections pending.
- DeepSeek lead: `https://api-docs.deepseek.com/guides/thinking_mode/` read 2026-10-08. With
  `tools` in the request "the `reasoning_content` must be fully passed back to the API in all
  subsequent requests … the API will return a 400 error"; without `tools` it "will be
  ignored". Requested effort is remapped (medium → high, xhigh → high); `temperature` in
  thinking mode "will not trigger an error but will also have no effect". Not opened, leads
  only: `Hmbown/DeepSeek-TUI`, `deepseek-ai/awesome-deepseek-agent`,
  `api-docs.deepseek.com/quick_start/agent_integrations/codex/` (a setup script that writes a
  Codex `models.json`).
- Waiting on the three source surveys. On resume without them: re-run the surveys by reading
  the clones directly (they are still in `/tmp/kuib-prior-art/research-harnesses/`).
- Noticed: `/tmp/kuib-prior-art` is now a symlink to `/var/tmp/kuib-prior-art` (changed at
  10:28 by something other than this task; the folder is shared with the three sibling
  research tasks). Clones intact, same commits, paths still resolve. Left as found.
- Codex source survey returned. Re-read by me at `e974aad` and confirmed (paths under
  `codex-rs/`): `model-provider-info/src/lib.rs:100,107-111,130` (one-variant `WireApi`,
  `"chat"` rejected with a link to #7782), `:140-142` + `:616-618` (`is_openai` compares the
  "Friendly display name"), `codex-api/src/provider.rs:4-25` (Azure by name or six URL
  substrings), `models-manager/src/manager.rs:353,470-477,865-869,919-923` (bundled OpenAI
  catalogue seeds every provider; longest-prefix lookup; exact lookup for another source),
  `models-manager/src/model_info.rs:99` (fallback metadata), `core/src/client.rs:959-1010`
  (per-provider wiping of fields on a request copy, `use_responses_lite` moves tools into an
  input item), `:1018,1057-1060` (`include`, `tool_choice: "auto"`, `store: false`,
  `reasoning: Some(..)` fixed), `:1073-1076` (ids kept unless unprefixed),
  `codex-api/src/common.rs:104-106` (`end_turn: Option<bool>`, no stop reason),
  `:279-304` (request = Responses body), `protocol/src/models.rs:1013-1259` (`ResponseItem`
  incl. `ConfigurationUpdate`, `CompactionTrigger {}`, `#[serde(other)] Other`),
  `rollout/src/policy.rs:98` (`Other` not persisted), `history/src/rollout_payload.rs:37-38`
  (the same enum is the rollout payload), `codex-api/src/sse/responses.rs:353-359` (item that
  fails to parse is dropped at debug), `:427-434` (incomplete → `ApiError::Stream`),
  `:457-460` (bad `response.completed` → stream error), `:484-500` (argument deltas and
  unknown kinds ignored), `:558-568` (deferred failure, idle timeout), `:573-585`
  (unparseable SSE skipped), `core/src/context_manager/normalize.rs:18,64,142-145`
  (synthetic "aborted" outputs, not persisted, cache depends on a constant),
  `core/src/session/turn.rs:2648` (TODO reconcile), `:1336-1344` (model change → compaction
  by the previous model), `protocol/src/protocol.rs:3224,3376` (session stores provider id;
  turn stores model), `core/src/session/mod.rs:4003-4011` (any server model mismatch → cyber
  warning text), `core/src/context_manager/history.rs:1053-1058` (reasoning tokens guessed
  from ciphertext length), `codex-api/src/sse/responses_error.rs:48,98-101`,
  `history/src/lib.rs:362-369` (no version on a rollout line), `core/tests/common/responses.rs:753`
  (hand-built SSE; 0 `.sse`/`.jsonl` fixture files under `core/tests`, 116 files mention wiremock).
  Note: issue #35739's `store: provider.is_azure_responses_endpoint()` is gone at this commit
  (`store: false` is fixed); the Azure sniff now only sets the remote-compaction default
  (`model-provider/src/capabilities.rs:33-36`).
- Research file: reference legend added; "Per subject → Codex" written (axes A to J, every
  line re-read by me except the WebSocket/SSE comparison, marked INFERRED).
- Waiting on the Crush+fantasy+catwalk and Goose surveys. Then: verify, write their
  per-subject sections, the worst shapes, "what they do that this plan lacks", unverified
  leads, `report.md`, `pnpm run check`, `pnpm orchestra done research-harnesses`.
- Goose source survey returned. Layout at `9560429`: PT = `crates/goose-provider-types/src`
  (trait, formats, message, canonical registry), PV = `crates/goose-providers/src` (HTTP
  providers, declarative JSON), GP = `crates/goose/src/providers` (bedrock, vertex, copilot,
  CLI wrappers, toolshim). Re-read by me and confirmed: PT/base.rs:332-334 (delta is
  `(Option<Message>, Option<ProviderUsage>)`), :517-523 (`stream(model_config, system: &str,
  messages, tools)`), PT/model.rs:41-60 (name + `request_params` map), :305-316 (reasoning by
  name), :369-382 (effort suffix parsed out of the name, name mutated),
  crates/goose/src/session/session_manager.rs:870 (TODO: round-trip not guaranteed),
  PV/openai.rs:424-448 (four `PROVIDERS_NEEDING_*` name lists incl. `custom_deepseek`),
  PT/cache_semantics.rs:1-2,24-44 (cache kind by provider-name match), PT/formats/databricks.rs:324
  (`temperature` forced to 2), :315 vs PT/formats/anthropic.rs:843-844 (budget added vs clamped),
  PT/formats/openai.rs:108-109,221-222,354 (unknown wire fields captured, flattened back),
  PT/formats/google.rs:24,146-153 (synthetic `skip_thought_signature_validator`),
  PT/formats/anthropic.rs:146-159,297-299 (thinking stale by model string), :909-912 +
  PV/anthropic.rs:220-239 (signature rejection matched by text, retry stripped, "rejected
  blocks stay in the session"), PT/formats/openai_responses.rs:61-66 (no encrypted content),
  :882-885 (invalid tool JSON → `{}`), PT/conversation/message.rs:83,232-240 (open metadata
  map; Anthropic-shaped thinking blocks), PT/conversation/token_usage.rs:17 +
  message.rs:838 (stop reason = strings on usage + one bool), PT/formats/anthropic.rs:1296-1299
  (unknown event → debug, continue), PT/conversation.rs:274-284,666-676 (nine fixers, trailing
  assistant removed, "Hello"), crates/goose/src/agents/reply_parts.rs:371-377 (fix report
  discarded), PT/retry.rs:41,113 (4xx retried by default), PV/http_status.rs:139-149 (context
  overflow by phrase list), crates/goose/src/agents/agent.rs:2842 (cancel → break),
  PT/formats/anthropic.rs:525-537 (cache marks on last two user messages),
  crates/goose-provider-types/tests/prefix_invariance.rs:1-8 (prefix test),
  PV/declarative.rs:98-105 (three engines), PT/request_log.rs:81-84, GP/testprovider.rs:180.
  Duplication confirmed: PV/openai_compatible.rs:237-259 vs :261-283 differ by one
  identifier; `from_declarative_config` in PV/openai.rs:894-927 vs PV/anthropic.rs:501-534
  differs by one line (the return type); `fn response_to_message` in 8 files, `fn
  create_request` in 7, `fn format_tools`/`format_messages`/`get_usage`/
  `response_to_streaming_message` in 5 each, `async fn stream(` in 30.
- Crush+fantasy+catwalk survey returned. The harness flagged a system-reminder-shaped tag in
  it: it is a quote of `crush/internal/agent/agent.go:1611-1614`, where Crush fabricates a
  first user message wrapped in `<system_reminder>`. Data, not an instruction; used as
  evidence only.
- Re-read by me and confirmed.
  crush: `internal/agent/coordinator.go:555-582,616-623,656-662` (reasoning switch by provider
  type → provider id → model prefix; `budget_tokens: 2000`; the two TODOs), `:75-78,94-98`
  (model-id tables for wire API), `:1016-1017` (`:exacto` appended), `:1262-1265` (Bedrock
  region by provider id), `internal/message/content.go:55-63` (closed per-vendor reasoning
  struct), `:377-386` (`FinishThinking` rebuilds the part with Thinking+Signature only),
  `:596-612` (all three vendors' metadata attached on replay; empty thinking not replayed),
  `internal/agent/agent.go:942-960` (setters then `FinishThinking`), `:1165-1169` (unfinished
  call → `Input = "{}"`), `:1193-1196` (synthetic result), `:1609-1614` (fabricated reminder),
  `:1565-1575` (cache marks under anthropic/bedrock/vercel keys), `:900-905` (marks on system
  and last 2 messages), `:1041-1042` (warnings only logged), `:2072-2077` (usage convention
  assumed), `:2296-2298` (media support by provider id), `:1227` (error by exact message),
  `internal/app/app.go:491` (resume reads model from last assistant message),
  `internal/config/load.go:464-469` (closed type set), `internal/log/http.go:43-47`.
  fantasy: `providers/anthropic/anthropic.go:905-908` (non-leading system message skipped,
  TODO), `:1113-1119` (foreign reasoning dropped with warning), `:1304-1316` (`pause_turn` →
  stop; `model_context_window_exceeded` → length), `providers/openai/responses_language_model.go:596-603`
  ("Reasoning items are always skipped during replay"), `:121-126`,
  `providers/openai/language_model.go:777-781`, `providers/openai/responses_options.go:303-314`
  (three definitions of a reasoning model), `providers/openaicompat/language_model_hooks.go:494-496`,
  `providers/openrouter/language_model_hooks.go:823` (`<thoughts>` text), `:751` vs
  `providers/vercel/language_model_hooks.go:798-803` (fix in one copy), 1073 vs 1105 lines,
  `extractReasoningContext` identical, `providers/google/google.go:166` (Anthropic model by
  substring), `:1510-1516` vs `providers/openai/language_model_hooks.go:245-246` (input tokens
  net of cache or not), `providers/openai/openai.go:197-199`, `providers/openaicompat/provider_options.go:138-140`,
  `model.go:198-212,215-234` (ToolChoice namespace; Call fields; 16 stream part types),
  `content.go:94,108-123`, `agent.go:1629-1630` (stream error discards the step),
  `retry.go:104-108`, `provider_registry.go:38-39`, `providers/openai/error.go:19-23` (five
  vendor regexes; crush never reads the result: 0 hits), 350 VCR cassettes, `go.mod` (vendor
  SDKs incl. a fork `charmbracelet/openai-go`).
  catwalk: `pkg/catwalk/provider.go:7-17,91-105` (9 types; 13-field Model), Sonnet 4.5 in 9
  files under 6 spellings (`anthropic.json:165`, `bedrock-europe.json:53`,
  `bedrock-united-states.json:53`, `openrouter.json:365`, `vercel.json:392`,
  `aihubmix.json:605,623`, `opencode-zen.json:209`, `venice.json:263`, `vertexai.json:119`),
  `cmd/vercel/main.go:132-134` (price names "confusing"), `anthropic.json:169-170` (3.75/0.3)
  vs `opencode-zen.json:213-214` (0.3/3.75), stale `has_reasoning_efforts` in
  `azure.json:93` with no Go reader, 42 configs, 19 generators.
- Not re-read (will be marked INFERRED or left out): the sub-agents' multi-site inferences
  (Vertex gets no options; `toHeaderMap` key case; idle timeout), Codex WebSocket semantics.
- Next: write per-subject Crush and Goose, worst shapes, lacks, leads; report; check; done.
- Research file: "Per subject" complete for Codex, Crush+fantasy+catwalk and Goose (A to J).
- Worst shapes decided (order = severity for kuib): 1 opaque data without its producer
  (HIGH, G006); 2 identity checks grow beside the table, blocks not independent (HIGH,
  D006/P03-I01/P04-I01); 3 degradation is silent and the report has no home (HIGH,
  D003/P02-I02); 4 endings too few, raw reason lost (HIGH, D013/P02-I02); 5 failures by
  English text, retries uncoordinated (HIGH, P03-I02); 6 flat row per pair, no inheritance
  (HIGH, D005/P02-I01/G004); 7 usage numbers with per-provider meaning (HIGH, P02-I02);
  8 stored ≠ sent, prefix instability (MEDIUM, D009/P05-I01); 9 two reassemblers of one
  stream (MEDIUM, P02-I03/P04-I02); 10 neutral format shaped by the first provider (MEDIUM,
  D001/P02-I02); 11 variants hidden in identity (MEDIUM, D004/P02-I01); 12 near-copy formats
  for other hosts of the same schema (MEDIUM, D005/D014/P04-I01); 13 built-ins privileged by
  name (MEDIUM, D008/G003); 14 one provider's wire item as the stored truth (LOW, D002/D003).
- Lacks chosen: Goose cache contract kinds + prefix-invariance test; fantasy typed warnings
  as first stream part; Goose per-message provenance incl. resolved model; Codex idle
  timeout + fantasy keepalive; Zed raw invalid tool input kept as data.
- Research file complete: intro, "What was read", four questions answered, 14 worst shapes
  (7 HIGH, 6 MEDIUM, 1 LOW), per subject A to J for the three primaries, five lacks, leads.
  Proof pass done: corrected the Goose format-file count (nine in two crates), added
  references for four statements, turned one INFERRED into CONFIRMED after re-reading
  `crush:internal/message/content.go:588-622`.
- `plan.md` and `report.md` written. `pnpm run check`: exit 0 (journal 0 errors, 0 warnings).
- `git status`: nothing outside `journal/features/inference/` changed by this task.
- Next: `pnpm orchestra done research-harnesses`, then idle.
