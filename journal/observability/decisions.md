---
title: Observability — LLM Tracing via OpenTelemetry → Phoenix
type: implementation
layer: architecture
status: decided
created: 2026-07-02
tags: [observability, telemetry, tracing, opentelemetry, openinference, phoenix]
depends-on: ["[[infrastructure-strategy]]"]
informs: []
---

## Context

The engine ran the model with **no visibility**: a failed model/daemon call was silently swallowed (the stream `error` part was unhandled), and there was no way to see **what actually went into the model context** per turn — the messages sent, tool calls, tool results, token counts, latency, or the error. The SQLite event log stores the _conversation_, not the _machinery_ of each model call. We need proper tracing for local debugging.

## Decision

Add structured **LLM tracing over OpenTelemetry**, exported to a self-hosted **Arize Phoenix** backend. Tracing is a **separate `@kuib-ai/telemetry` package**, opt-in by config, injected — not reached-for.

- **Backend**: Phoenix (self-hosted, Docker) — local-first, no data leaves the tailnet, aligns with the product thesis (see [[distributed-mesh-state]] zero-central-trust). Currently the author's instance on **cornelius** (`http://100.119.121.34:6006`, OTLP HTTP `/v1/traces`).
- **Pipeline** (AI SDK **v7**): `streamText` telemetry events → `@ai-sdk/otel` `OpenTelemetry` integration (emits `gen_ai.*` OTel spans) → `@arizeai/openinference-vercel` `OpenInferenceSimpleSpanProcessor` (relabels to OpenInference convention Phoenix reads) → `OTLPTraceExporter` → Phoenix. AI SDK v7 emits **no** OTel spans on its own — its telemetry is a callback-integration system (`registerTelemetry`), so the `@ai-sdk/otel` bridge is mandatory. The pre-v7 `experimental_telemetry` OTel-span path does **not** apply.
- **Package boundary**: the OTel dependency stack lives only in `@kuib-ai/telemetry`. `engine` gains **zero** deps — its only touch is `telemetry: { isEnabled: true, functionId: "runAgent" }` on `streamText` (a plain option object). Telemetry init is a process-level concern, so it's a host responsibility.
- **Config is Zod-validated + injected** (house style): `EnvSchema` gains `KUIB_TRACE_ENDPOINT` (`z.string().url().optional()`) and `KUIB_TRACE_SERVICE` (optional). `startTelemetry(config: { endpoint, serviceName })` takes an injected param bag and never reads `process.env` — the hosts resolve from validated `env` and pass in, exactly like `resolveDbPath`/`resolveDaemonEndpoint`. Named the env var `KUIB_TRACE_ENDPOINT` (not Phoenix's `PHOENIX_COLLECTOR_ENDPOINT`) because we pass the URL to the exporter explicitly, so the name is ours and follows the `KUIB_` convention.
- **Opt-in**: `startTelemetry` is a no-op returning `false` when `endpoint` is unset, so normal runs are unaffected. Called once at the start of the `serve` process in `host-tui` and `host-web` (the processes that run the model).

Verified end-to-end on **Bun + AI SDK v7**: a spike span landed in Phoenix (`kuib-spike` project, traceCount 1), confirming the one runtime unknown (Bun/v7/ESM/Node-22).

## Why not Langfuse

Langfuse has first-class v7 support but its cloud sends prompts + tool results (file contents, secrets) off-box — contradicting the local-first thesis — and self-hosting it needs Postgres + ClickHouse. Phoenix self-hosts as a single container and stays fully local. Kept behind the `startTelemetry` seam, so a different backend/exporter can swap in without touching `engine` or the hosts.

## Consequences

- **Positive**: full per-turn visibility (messages, tools, tokens, latency, errors) in the Phoenix UI; the silent-failure class is now debuggable. Local, free, unlimited.
- **Negative**: pulls in an OpenTelemetry dependency stack (isolated to `@kuib-ai/telemetry`). Requires a running Phoenix instance; if the endpoint is set but Phoenix is down, spans fail to export (the app still runs — export is best-effort).
