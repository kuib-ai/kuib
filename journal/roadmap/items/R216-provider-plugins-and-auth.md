---
id: R216
title: Provider plugins, model catalog and auth-method union (API key | OAuth)
state: idea
horizon: later
domains: [core, infra]
depends-on: ["[[roadmap/items/R219-config-store-and-secret-storage]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/provider-architecture/decisions#Plugin-Based Providers]]", "[[_archive/provider-architecture/decisions#Auth Models]]", "[[_archive/provider-architecture/decisions#Provider contract v2 — flat config + factory map, NOT a discriminated union (2026-07-02)]]", "[[_archive/provider-architecture/decisions#Meta Model API = a provider ID, not a new npm package (2026-08-12)]]", "[[_archive/provider-architecture/decisions#Meta caching is automatic; reasoning is not visible (2026-08-12)]]", "[[_archive/provider-architecture/decisions#MiMo (Xiaomi) — the first provider that actually streams plaintext reasoning (2026-08-12)]]", "[[_archive/provider-architecture/decisions#Open Questions]]", "[[_archive/protocol-design/decisions#Provider Interface]]", "[[_archive/protocol-design/decisions#Step Boundaries — Per-Step Model Tracking]]", "[[_archive/protocol-design/plan#Phase 3: Provider Adapters]]", "[[_archive/protocol-design/progress#Remaining]]"]
touched: 2026-09-22
---

# R216 — Provider plugins, model catalog and auth-method union (API key | OAuth)

## Idea

Providers today are a closed factory map (openai-compatible, anthropic, groq) plus resolver
branches (meta, mimo). The long-term design:

- **Providers are plugins, not core.** kuib exposes a plugin API; the official package ships
  official-API adapters (Anthropic, OpenAI, OpenRouter). Legally grey subscription plugins
  (ChatGPT OAuth like opencode's codex plugin, GitHub Copilot) are community plugins that kuib
  neither ships nor maintains.
- **Auth-method discriminated union** on the closed axis only: `api-key | oauth` (opencode also
  has `wellknown`), with a stored-auth file. API key = set a header, hit the API. OAuth
  subscription = OAuth dance, URL rewrite, custom headers.
- **Attachable long tail** (deliberately not copied from opencode yet): a models.dev-style remote
  catalog with disk cache, runtime package install, a per-provider quirk registry (anthropic
  beta headers, openai `.responses()`, bedrock region/credentials), an SSE chunk-timeout fetch
  wrapper.
- **Model catalog data** (`ModelInfo`, `ModelCapabilities`, limits, pricing) — enables cost:
  `sum(step.tokens × step.model.pricing) + sum(subagentCall.tokens × subagentCall.model.pricing)`.
- **Per-provider tuning:** caching strategy (Anthropic needs explicit `cache_control`
  breakpoints; Meta and MiMo cache automatically), reasoning variant mapping, Anthropic beta
  headers and thinking through `providerOptions`.
- **Reasoning continuity:** Meta returns reasoning only as an encrypted replay blob on the
  Responses API; feeding it back across tool-loop turns would require the Responses API — not
  worth it until Meta serves reasoning on chat-completions.

## Why

Users bring their own providers and subscriptions; the flat config seam was built precisely so
these attach without protocol changes.

## Open questions

- Plugin loading mechanism under Deno (npm specifiers at runtime vs bundled registry).
- Where stored OAuth tokens live (OS secure storage, R219).

## Constraints already decided

- Flat `ModelConfig` + factory map keyed by npm package; union only on the closed auth axis —
  [[domains/core/decisions#^D022]].
- Provider IDs map onto packages; provider-scoped settings ignore generic transport vars —
  [[domains/core/decisions#^D023]].
- Client options vs per-request `providerOptions` are separate axes —
  [[domains/core/decisions#^D024]].
- Chat-completions via `@ai-sdk/openai-compatible`, not the Responses API —
  [[domains/core/decisions#^D021]].
- The engine uses the AI SDK directly; no parallel kuib `LanguageModel` interface —
  [[domains/core/decisions#^D020]].
- The MiMo Token Plan key is licensed for interactive use only: scheduled/unattended agent runs
  must use a different credential, never `KUIB_MIMO_API_KEY`.
- Keep the prompt prefix byte-stable (no per-turn timestamps, stable tool order) so automatic
  provider caching keeps hitting — [[domains/core/decisions#^D011]].

## History

- 2026-09-22 migrated from the archive
