---
title: How opencode shapes its neutral LLM format
date: 2026-10-07
origin: ["conversation 2026-10-07"]
---

# How opencode shapes its neutral LLM format

Read from `github.com/sst/opencode` at commit `ecc4916` (2026-10-06), package `packages/llm`
(`@opencode-ai/llm`). Findings only; nothing here is a kuib decision.

## State

- opencode has its own LLM package with no AI SDK dependency (`effect`, an AWS event-stream
  codec and `aws4fetch` only). `packages/llm/DESIGN.md` is a discussion draft for its successor
  `@opencode-ai/ai`.
- The migration is unfinished: `packages/opencode/src/session/llm/ai-sdk.ts` is the default
  runtime and adapts `streamText` output into the package's `LLMEvent`s;
  `session/llm/native-runtime.ts` is opt-in per request and falls back to the AI SDK. Both
  feed the same event stream to the session processor.

## Neutral shape (`src/schema/messages.ts`, `options.ts`, `events.ts`)

- `LLMRequest`: `model`, `system` (text parts, separate from messages), `messages`, `tools`,
  `toolChoice`, `generation`, `providerOptions`, `http`, `responseFormat`, `cache`, `metadata`.
- `Message`: `role` (user, assistant, tool, system) and ordered `content` parts: text, media,
  tool-call, tool-result, reasoning.
- Provider data rides in open records: `providerMetadata` on text, tool-call, tool-result and
  reasoning parts, `native` on messages and tools, `providerOptions` keyed by provider name.
- The design draft keeps `system` apart "because it is the initial privileged instruction. A
  chronological system message represents an instruction change at a specific point in
  history."

## Layers underneath

- `src/protocols/`: one module per HTTP schema (`anthropic-messages`, `openai-chat`,
  `openai-compatible-chat`, `openai-responses`, `gemini`, `bedrock-converse`). A protocol lowers
  the request into the native body and raises native stream events into neutral events.
- `src/route/`: endpoint, auth, framing and transport. A route is a protocol bound to those.
- `src/providers/`: per-vendor facades that configure a route and type the provider options.
- `LLMClient.prepare(request)` compiles a request without sending it.
- Tests are fixture-first with recorded HTTP cassettes, including cache-specific recordings.

## How differences are handled

- Mid-conversation instruction: `Message.system(...)` is neutral. Anthropic sends a native
  `role: "system"` entry only when the model id is `claude-opus-4-8` and the placement rules
  hold. Every other case, on every protocol, becomes `<system-update>` text with XML escaping,
  merged into the preceding user message. A system message that would split a tool call from
  its result is a typed error (`protocols/shared.ts`, `protocols/anthropic-messages.ts`).
- Caching: a neutral `cache` policy (`"auto"`, `"none"` or an object) plus an inline
  `CacheHint` (`ephemeral` or `persistent`, optional `ttlSeconds`) on system, text, tool-result
  parts and tool definitions. `cache-policy.ts` places hints before lowering: last tool, last
  system part, latest user message. Only `anthropic-messages` and `bedrock-converse` emit
  markers, capped at four with the overflow counted as dropped, and a lifetime of 3600 seconds
  or more maps to the one-hour bucket. OpenAI and Gemini emit nothing because they cache
  implicitly; `promptCacheKey` is an OpenAI provider option. Usage is normalised into
  `cacheReadInputTokens` and `cacheWriteInputTokens` on every protocol.
- Reasoning replay: opaque data in `providerMetadata` (`anthropic.signature`,
  `google.thoughtSignature` on reasoning and tool-call parts, `openai.itemId` and
  `reasoningEncryptedContent`).
- Escape hatches, in order: portable generation options, provider options, staged hooks, a
  serialisable HTTP overlay (`body`, `headers`, `query`), then patching a protocol.
- Thinking binding: the AI SDK path sets `prefixMismatchBehavior: "drop_block"` on Anthropic
  models from 5.1, through a patched AI SDK, because opencode "re-renders parts of that prefix
  between turns (system prompt, tools, compaction)" (`packages/opencode/src/provider/transform.ts`).
  The native package has no equivalent yet.
- Not handled: no occurrence of `clear_at` or any turn-scoped instruction in `packages/llm`,
  `packages/opencode` or `packages/core`.

## Observations for kuib

- Their layer names are protocol, route and provider; kuib already uses `protocol` for its
  schema package.
- The native system-role gate is a model-id check in code and is already behind Anthropic's
  current list, which argues for capabilities as data.
- Their provider data is open records, the shape kuib wants to avoid before Protobuf.
- They defined the neutral events first, adapted the AI SDK into them, and are swapping the
  runtime underneath; that is a staged form of point 5.
