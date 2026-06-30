---
title: "Provider Architecture"
type: implementation
status: decided
layer: architecture
created: 2026-04-13
tags: [architecture, providers, plugins, llm]
depends-on: ["[[architecture-overview]]", "[[security-model]]"]
informs: ["[[protocol-design]]"]
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

There is **no "provider" abstraction beyond this** yet — one openai-compatible client; you "change providers" purely by env. **All OpenAI-compatible endpoints (ollama, minerva, OpenRouter, MiMo) are the _same client_ pointed at a different `baseURL`** — they are not distinct adapters. A real provider _registry_ (Anthropic-native etc.) is future work behind a `KUIB_MODEL_PROVIDER` switch; not built.

**`minerva` is a remote ollama node**, not a separate provider — Tailscale host `100.70.111.96:11434/v1`, key `ollama`, models incl. `gemma4:12b` (the `gemma3:12b` default did not exist on it). `gemma4:12b` is a **reasoning model** (streams `reasoning` before `content`).

**Env config** (`@kuib-ai/env`, `EnvSchema` Zod): `KUIB_MODEL_BASE_URL` / `KUIB_MODEL_API_KEY` / `KUIB_MODEL_ID` / `KUIB_DAEMON_URL` / `KUIB_DB_PATH?` / `KUIB_SESSION_ID` (default `"default"` — stable id is what makes resume work). `bootstrapEnv` resolves the **workspace root** (walk up to `pnpm-workspace.yaml`), loads `.env`/`.env.<mode>` there, then `EnvSchema.parse(process.env)` — never throws when files are absent (compiled binary = `process.env` authoritative). Single root config, not per-package (one binary, one config). Stream errors now surface as a `⚠️` delta instead of a silent hang.

## Open Questions

- Adapter implementation details (caching strategies per provider, reasoning variant mapping)
