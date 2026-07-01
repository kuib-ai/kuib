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

## Open Questions

- Adapter implementation details (caching strategies per provider, reasoning variant mapping)
- Auth-method discriminated union (`api-key | oauth`) + stored-auth file, when subscription/OAuth providers arrive (the closed-axis union per the opencode study)
- Anthropic provider options tuning (beta headers, thinking via providerOptions) — the `options` catchall is the carrier
