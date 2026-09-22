---
id: R410
title: Telemetry on Deno — service naming, span re-check, built-in OTel
state: idea
horizon: next
domains: [infra, host]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/observability/decisions#Decision]]"]
touched: 2026-09-22
---

# R410 — Telemetry on Deno — service naming, span re-check, built-in OTel

## Idea

- **Re-verify end to end on Deno.** The span pipeline (AI SDK v7 → `@ai-sdk/otel` →
  OpenInference processor → OTLP → Phoenix) was only verified on Bun (a spike span landed in the
  `kuib-spike` Phoenix project). Re-run it on Deno.
- **Evaluate Deno's built-in OpenTelemetry** (`OTEL_DENO=true`) as a replacement for or
  complement to the `NodeTracerProvider` stack.
- **Configurable service name.** The design had `KUIB_TRACE_SERVICE` beside
  `KUIB_TRACE_ENDPOINT`; today the serve process hardcodes `kuib-engine`.

## Why

Tracing is the only per-turn visibility into model calls; it is unverified on the current
runtime.

## Open questions

- Does Deno's built-in OTel pick up the AI SDK integration's spans without the Node SDK?

## Constraints already decided

- Tracing via OpenTelemetry to Phoenix, opt-in, injected: [[domains/infra/decisions#^D014]], [[domains/infra/current#^C022]].
- Telemetry is started by the process that runs the model: [[domains/host/decisions#^D006]].

## History

- 2026-09-22 migrated from the archive
