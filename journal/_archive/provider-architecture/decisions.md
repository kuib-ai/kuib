---
title: "Provider Architecture"
type: implementation
status: decided
layer: architecture
created: 2026-04-13
tags: [architecture, providers, plugins, llm]
depends-on: ["[[architecture-overview]]", "[[security-model]]"]
informs: ["[[protocol-design]]", "[[tool-system]]"]
---

# Provider Architecture

## Current Decisions

### Plugin-Based Providers

Providers are plugins, not core. The protocol defines the provider interface. Anyone can implement it.

**Ships with kuib (official API, safe):**

- Anthropic adapter
- OpenAI adapter
- OpenRouter adapter

**Community plugins (legally grey, not shipped):**

- ChatGPT OAuth subscription (like opencode's codex plugin)
- GitHub Copilot subscription
- Others

kuib exposes the plugin API. The official package does not ship or maintain the grey-area plugins.

### LLM Client Layer

**Recommended: Vercel AI SDK (`ai`)** as the foundation.

- Provider-agnostic with 25+ providers
- Streaming-first (streamText returns async iterable)
- Zod-based tool definitions
- Lightweight — we control the agent loop, SDK just handles LLM communication

The adapter pattern:

- protocol defines our tool interface
- providers/ adapters convert our tools → SDK format (outbound)
- providers/ adapters convert SDK responses → protocol events (inbound)
- engine calls adapters, never the SDK directly

### Auth Models

Two auth models supported via the plugin system:

1. **API key** — standard pay-per-token (set Authorization header, hit provider API)
2. **OAuth subscription** — monthly subscriptions (OAuth dance, rewrite URLs, custom headers)

## Resolved (by [[protocol-design]])

- **Provider interface defined** in `packages/protocol/src/provider.ts`: `LanguageModel` (generate + stream), `Provider`, `ProviderRegistry` as TS interfaces. `ModelInfo`, `ModelCapabilities`, `AuthModel`, `StreamChunk` as Zod schemas.
- **Wrap AI SDK, not use directly**: Our `LanguageModel` interface mirrors AI SDK's `LanguageModelV3` shapes so adapters are thin, but is independently implementable. Engine never imports AI SDK — only the adapter package does.

## v1 provider = OpenAI-compatible client, config-driven via env (2026-07-01)

`createModel({baseURL, apiKey, modelID})` uses **`@ai-sdk/openai-compatible` (`createOpenAICompatible`)**, NOT `@ai-sdk/openai`. Reason (real bug): `@ai-sdk/openai`'s `provider(modelID)` defaults to the **Responses API** (`/responses`); ollama/minerva/openrouter/mimo only speak **Chat Completions** (`/v1/chat/completions`) → silent failure (empty `assistant:`). openai-compatible always uses chat-completions.

There is **no "provider" abstraction beyond this** yet — one openai-compatible client; you "change providers" purely by env. **All OpenAI-compatible endpoints (ollama, minerva, OpenRouter, MiMo) are the _same client_ pointed at a different `baseURL`** — they are not distinct adapters.

> **Superseded (2026-07-02):** the provider seam now exists — see _Provider contract v2_ below. The envisioned `KUIB_MODEL_PROVIDER` switch was NOT built; the adopted selector is `KUIB_MODEL="<providerID>/<modelID>"` with a factory map keyed by npm package. The single-openai-compatible-client claim above describes v1 only.

**`minerva` is a remote ollama node**, not a separate provider — Tailscale host `100.70.111.96:11434/v1`, key `ollama`, models incl. `gemma4:12b` (the `gemma3:12b` default did not exist on it). `gemma4:12b` is a **reasoning model** (streams `reasoning` before `content`).

**Env config** (`@kuib-ai/env`, `EnvSchema` Zod): `KUIB_MODEL_BASE_URL` / `KUIB_MODEL_API_KEY` / `KUIB_MODEL_ID` / `KUIB_DAEMON_URL` / `KUIB_DB_PATH?` / `KUIB_SESSION_ID` (default `"default"` — stable id is what makes resume work). `bootstrapEnv` resolves the **workspace root** (walk up to `pnpm-workspace.yaml`), loads `.env`/`.env.<mode>` there, then `EnvSchema.parse(process.env)` — never throws when files are absent (compiled binary = `process.env` authoritative). Single root config, not per-package (one binary, one config). Stream errors now surface as a `⚠️` delta instead of a silent hang.

## Provider contract v2 — flat config + factory map, NOT a discriminated union (2026-07-02)

Adding Anthropic forced the contract decision. First draft was a Zod **discriminated union** (`AnyModelConfig = OpenAICompatibleModelConfig | AnthropicModelConfig`, base + `.extend()`, switch in `createModel`). Before committing we studied opencode's provider layer (~25 providers, same Vercel AI SDK; `.references/opencode/packages/opencode/src/provider/provider.ts`) — verified in source. **Their evidence killed the union:**

- opencode has **one flat provider shape for all providers**; per-provider differences (Bedrock `region`/`profile`, Azure `resourceName`, Vertex `project`/`location`) live in an **open `options` record** that flows verbatim into the SDK factory. A discriminated union makes every new provider a breaking protocol change; the flat shape makes it a data change.
- The factory discriminator is a plain **npm package string** resolved through a map of lazy `create*` imports (`BUNDLED_PROVIDERS`), exploiting the AI SDK convention that every `@ai-sdk/*` package exports `create*(options)` → `.languageModel(id)`. The real variability is _which package_, not _which config type_.
- Per-provider **quirks** are an isolated registry (`custom()`), not types: anthropic = two beta headers; openai = use `.responses()`; bedrock = region/credential logic.
- The one place opencode DOES use a discriminated union is **auth method** (`oauth | api | wellknown`) — a genuinely closed set. The provider set is open (our own requirement: user-configurable providers later); the auth-method set is closed. **Union on the closed axis only.**

**Adopted contract:**

- `protocol/src/provider/model.config` — flat Zod schema (Zod-first): `{ npm: string, modelID: string, options: { apiKey?, baseURL? }.catchall(z.unknown()) }`. The open `options` record is deliberate: it flows into `create*(options)`.
- `engine/provider/model` — `createModel(config)` looks up a **factory map** keyed by `npm` (`@ai-sdk/openai-compatible`, `@ai-sdk/anthropic`); unknown package → clear error listing supported ones. Adding a provider = one map entry, zero protocol change. The openai-compatible factory enforces `options.baseURL` presence.
- `engine/provider/resolve.model.config` — interim env→config resolver: `KUIB_MODEL="<providerID>/<modelID>"` selector (split on first `/`, opencode's `parseModel` idiom). Unset → prior behavior (openai-compatible from `KUIB_MODEL_BASE_URL`/`KUIB_MODEL_API_KEY`/`KUIB_MODEL_ID`). `anthropic/<model>` → requires **provider-specific** `KUIB_ANTHROPIC_API_KEY` (fails loudly at startup via `main().catch`). Keys are provider-specific so both providers stay configured side-by-side; switching = one env var.
- This env layer is the **interim config surface**; the eventual user-facing surface is the CRDT `ConfigStore` ([[distributed-mesh-state]]) carrying the same flat `ModelConfig` shape.

**Deliberately not copied from opencode (long-tail for 25 providers, overkill for 2):** models.dev remote catalog + disk cache, runtime `Npm.add` package install, the `custom()` quirk registry, plugin auth-method registry/OAuth flows, SSE chunk-timeout fetch wrapper. The adopted seam is the part that makes those attachable later.

Switching usage: `KUIB_MODEL=anthropic/claude-opus-4-8` + `KUIB_ANTHROPIC_API_KEY=sk-ant-…`; unset `KUIB_MODEL` to fall back to ollama/minerva.

## Meta Model API = a provider ID, not a new npm package (2026-08-12)

Meta's hosted inference (`dev.meta.ai`, models `muse-spark-1.1` / `1.2` / `1.2-contributor`, 1M context) is **drop-in OpenAI chat-completions compatible** at `https://api.meta.ai/v1`. There is **no `@ai-sdk/meta` package** — Meta retired the old Llama API (`api.llama.com/compat/v1`) on 2026-07-06 and ships no first-party AI SDK adapter.

So `meta` enters at the **resolver** layer, not the factory map: `resolveModelConfig` maps `meta/<modelID>` → `{ npm: "@ai-sdk/openai-compatible", options: { baseURL: META_BASE_URL, apiKey: KUIB_META_API_KEY } }`. Zero new deps, zero factory-map churn. This is the first case proving the flat-config seam handles a provider whose only distinguishing feature is a base URL — the whole point of not using a discriminated union.

**`baseURL` is deliberately fixed, not `params.baseURL ?? META_BASE_URL`.** `model.base_url` / `KUIB_MODEL_BASE_URL` is the _generic openai-compatible transport var_ (usually pointed at ollama/minerva); letting it leak into `meta/` would silently route Meta traffic at a local ollama. Provider-scoped selectors ignore the generic transport vars — same rule anthropic and groq already follow.

Meta docs recommend `@ai-sdk/openai` for "reasoning continuity" (Responses API). **Not adopted** — that is the exact v1 bug recorded above (`/responses` vs `/v1/chat/completions`). Revisit only with evidence that `api.meta.ai` serves `/responses`.

**Failure mode observed:** setting `KUIB_MODEL_BASE_URL` alone makes the compatibility shim synthesize `openai-compatible/${KUIB_MODEL_ID}`, so a `KUIB_MODEL_ID=meta/muse-spark-1.2-contributor` becomes the literal model ID `meta/muse-spark-1.2-contributor`, and a missing/garbage `KUIB_MODEL_API_KEY` sends no `Authorization` header → the provider replies `Unauthorized`, which surfaces as a bare `assistant: Unauthorized` turn. Provider errors currently reach the user as an unlabelled assistant message with no status code or provider attribution — see [[observability]].

## Per-request provider options are a second axis, separate from client options (2026-08-12)

Adding Meta exposed a hardcode: the orchestrator sent `providerOptions: { kuib: { reasoningEffort: "none" } }` on every `streamText` call. `kuib` is the `name` we pass `createOpenAICompatible`, so that constant leaked into **every** openai-compatible endpoint. `muse-spark` rejects it — `"reasoning_effort" does not support "none" with this model` — so every turn failed.

`ModelConfig` now carries **two** distinct records, and conflating them was the original mistake:

- `options` — **client construction**, flows verbatim into `create*(options)` (apiKey, baseURL).
- `providerOptions` — **per-request**, flows into `streamText({ providerOptions })`, nested under the SDK provider name by `engine/provider/build.provider.options` (`@ai-sdk/openai-compatible` → `kuib`, anthropic → `anthropic`, groq → `groq`). Empty record → key omitted entirely, so the provider's own defaults apply.

`reasoningEffort: "none"` is now set **only** by the `openai-compatible` branch of the resolver (it exists to suppress gemma4's reasoning stream on ollama/minerva). `meta`, `anthropic` and `groq` emit `{}` and inherit provider defaults. The eventual `ConfigStore` surface should expose `providerOptions` per model — it is the natural home for user-set reasoning effort.

`ProviderOptions` is not publicly exported from `ai@7.0.15`, so the type is derived structurally: `NonNullable<Parameters<typeof streamText>[0]["providerOptions"]>`. Avoids taking a direct `@ai-sdk/provider` dependency for one type.

## Meta caching is automatic; reasoning is not visible (2026-08-12)

**Caching — nothing to implement.** Meta's prompt caching is prefix-based KV reuse that "runs on every request with no action from you. You do not pass a cache key, set a flag, or mark breakpoints." Cached input bills at $0.15/1M vs $1.25/1M, reported as `usage.prompt_tokens_details.cached_tokens`. This is the **opposite** of Anthropic, which needs explicit `cache_control` breakpoints — so caching cannot become a shared abstraction; it is per-provider, and for Meta the correct implementation is the empty one. What matters is that our prompt prefix stays byte-stable: `buildMessages` is a pure append-only replay of the event log with no timestamps or volatile header, so every turn re-hits the cache by construction. Do not introduce a per-turn timestamp or shuffled tool order at the head of the prompt — that would silently destroy the hit rate.

**Reasoning is server-side and opaque — verified against the live API, do not re-investigate.** The orchestrator already handles `reasoning-delta` → `REASONING_DELTA` and the protocol has `PartReasoning`, so the renderer is not the gap. Evidence:

- **Our sqlite event log** (600 most recent events, real TUI sessions): `text-delta` 534, `message-started` 21, `user-message-submitted` 23, `message-completed` 11, `message-failed` 9, tool events 2 — **zero `reasoning-delta`**.
- **Chat Completions, streamed**, at `reasoning_effort` default / `low` / `high`: delta keys are always exactly `[content, role]`. No reasoning channel at any effort. The model's own advice that a non-`none` effort would surface a thinking block is **wrong** — tested and disproven.
- **Chat Completions, non-streamed**, bat-and-ball prompt at effort `high`: `usage.completion_tokens_details.reasoning_tokens: 497` of 781 completion tokens, while `message` carries only `content` and `refusal`. The reasoning is real and billed, just never returned.
- **Responses API** with `reasoning.summary: "auto"` and `"detailed"`: returns a `reasoning` output item whose `summary` is **always `[]`**. With `include: ["reasoning.encrypted_content"]` the item does carry `encrypted_content` — an opaque blob (1422 reasoning tokens' worth) meant for cross-turn replay, not display.

So Meta exposes reasoning **only** as token counts and an encrypted replay blob. There is no plaintext to render, at any effort, on either API surface. The multi-second pre-token latency users see is that hidden reasoning. Treat missing thinking blocks on `meta/*` as expected behaviour.

The one genuine future use of `encrypted_content` is feeding it back for reasoning continuity across turns in tool loops — but that requires the Responses API, which we deliberately avoid (see the v1 `/responses` bug above). Not worth it until Meta ships reasoning on chat-completions.

**Never take the model's self-description as evidence about the harness.** `muse-spark` confidently asserted it was emitting thinking blocks our UI must be hiding, and prescribed a `reasoning_effort` fix; the event log and raw curl showed both claims false. Verify provider behaviour at the wire, not by asking the model.

## MiMo (Xiaomi) — the first provider that actually streams plaintext reasoning (2026-08-12)

Xiaomi's MiMo open platform offers **both** an OpenAI-compatible endpoint (`/v1`) and an Anthropic-compatible one (`/anthropic`). We take **OpenAI-compatible**, consistent with the portability rule below: `@ai-sdk/openai-compatible` speaks chat-completions, the Anthropic path would mean `@ai-sdk/anthropic` pointed at a third-party shim, and the openai-compatible client already maps `reasoning_content` → reasoning deltas (the DeepSeek-R1 convention). Zero new deps; `mimo/<model>` is one more resolver branch.

**`providerOptions: { thinking: { type: "enabled" } }` is required, not cosmetic.** Verified at the wire across all three states on `mimo-v2.5-pro`: `enabled` → `reasoning_tokens: 72`; `disabled` → `0`; **omitted → `0`**. Thinking is **off by default**, so a request that doesn't ask for it silently gets none. `reasoning_content` appears in the streamed delta keys, and the AI SDK maps it through — a full agent-loop run emitted **219 `reasoning-delta` events**, which the transcript already renders dim via `TranscriptRoleEnum.REASONING`. This is the first provider where the reasoning renderer that has existed all along actually has content to show (contrast Meta above, where reasoning is billed but never returned).

**Base URL is the token-plan host, not the docs host.** The docs publish `https://api.xiaomimimo.com/v1` (pay-as-you-go); a Token Plan subscription issues a *dedicated* per-region host — `https://token-plan-sgp.xiaomimimo.com/v1` — and **only that host bills against the plan's credits**. Defaulting to the docs host would silently bill pay-as-you-go while the plan sat unused, so `MIMO_BASE_URL` is the token-plan host, overridable via `KUIB_MIMO_BASE_URL` because the region suffix (`-sgp`) is per-subscription. This is why the meta rule ("provider-scoped selectors ignore the generic transport vars") gets a deliberate exception here: `mimoBaseURL` is a *provider-scoped* override, distinct from the generic `KUIB_MODEL_BASE_URL` it still ignores.

Prompt caching is automatic and observable (`cached_tokens: 192` on a cold second call), same shape as Meta's.

**Plan terms are a real constraint on how kuib may use this key.** The Token Plan is licensed for "interactive use with compatible AI coding and agent tools only… not for automated scripts or application backends", with suspension/key-revocation as the stated penalty. Interactive kuib sessions are squarely in scope; scheduled/unattended agent runs against this key are not. If autonomous runs land ([[distributed-mesh-state]], scheduled work), they need a different credential — do not point them at `KUIB_MIMO_API_KEY`.

## Agent loop is unguarded — `stopWhen` removed (2026-08-12)

The orchestrator shipped with `stopWhen: stepCountIs(5)`, a demo value: a turn got five model requests (a tool call ends one step and starts the next), then exited **cleanly** — `message-completed`, no error, no log line. On any task needing more than ~4 tool calls the agent looked like it gave up mid-work. Removed at the user's explicit instruction; the loop now ends only when the model itself stops calling tools.

**Removing the parameter is not the same as removing the limit.** `stopWhen` defaults to `stepCountIs(1)` in `ai@7`, so deleting the line would have made every turn single-step — strictly worse. Unguarded requires an explicit never-true stop condition.

**Cost, demonstrated:** the unguarded loop immediately hung `emits TOOL_CALL_FAILED when a tool execution fails` (5s timeout — the mock kept being re-invoked forever), and the hung test then corrupted a *different* file's shared capture array, surfacing as a bogus `transport.factory` failure. Two full-suite runs, byte-identical results. Worth recording because it was initially read as flakiness: **it was deterministic cross-test interference caused by a genuinely non-terminating loop.** The same shape in production is an open-ended token burn with no stop — and there is currently **no interrupt** ([[host-layer/wireframes/session]]), so the only remedy is killing the process. Wiring an `AbortSignal` through `RunAgentParams` → `streamText` is now the highest-value follow-up.

Resolution: `maxSteps` is an optional `RunAgentParams` field. Omitted (both hosts) → unguarded, as intended. Tests pass `maxSteps: 5` so the suite terminates. The bound is a caller decision, not a hardcoded constant.

## Live provider tests are opt-in (2026-08-12)

`packages/engine/src/provider/live.test.ts`, gated on `KUIB_LLM_TESTS=1` via `describe.skipIf` — `pnpm test` skips them (257 pass, 3 skip), `pnpm test:llm` runs them against whatever `KUIB_MODEL` points at. They exercise the real seam end to end: an answer streams, `STEP_FINISHED` carries non-zero input tokens, and reasoning streams (asserted only when `providerID === "mimo"`, since Meta provably cannot). This is the regression net for the class of bug that dominated this session — every failure here was a wire-level behavior no unit test could have caught.

## Open Questions

- Adapter implementation details (caching strategies per provider, reasoning variant mapping)
- Auth-method discriminated union (`api-key | oauth`) + stored-auth file, when subscription/OAuth providers arrive (the closed-axis union per the opencode study)
- Anthropic provider options tuning (beta headers, thinking via providerOptions) — the `options` catchall is the carrier
