---
id: R111
title: Streaming Parakeet — FluidAudio direct vs Hex SDK batch
state: shaped
horizon: later
domains: [product]
depends-on: ["[[roadmap/items/R003-stt-engine]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/ana/decisions#Voice I/O Architecture]]", "[[_archive/ana/decisions#Open Questions]]"]
touched: 2026-09-22
---

# R111 — Streaming Parakeet — FluidAudio direct vs Hex SDK batch

## Idea

The original Ana plan spawned Hex's embedded service (`hex service --embedded`, TS SDK
`@kitlangton/hex`), which exposes only **batch** transcription. Parakeet TDT's transducer
architecture supports streaming, and streaming (transcribe as chunks arrive) saves more
perceived latency than where inference runs. The stt-engine feature already resolved this by
talking to **FluidAudio directly** and offering streaming sessions ([[domains/product/decisions#^D008]],
[[domains/product/current#^coreml-stream-sessions]]); this item tracks any remaining question of whether to keep
FluidAudio direct or go lower to NeMo for streaming. Landscape detail:
[[roadmap/research/voice-io-landscape#Streaming vs Batch]].

## Why

Batch mode — waiting for the user to finish speaking — is the biggest latency factor.

## Open questions

- Whether FluidAudio's streaming manager is enough or a direct NeMo path is needed.

## Constraints already decided

- Streaming STT is built via FluidAudio, not the Hex SDK: [[domains/product/decisions#^D008]].
- FluidAudio is a dependency, not custom CoreML inference: [[domains/product/decisions#^D005]].

## History

- 2026-09-22 migrated from the archive
