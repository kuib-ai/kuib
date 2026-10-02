---
id: R110
title: MiMo ASR as cloud STT fallback
state: absorbed
horizon: maybe
domains: [product]
depends-on: ["[[roadmap/items/R003-stt-engine]]"]
converges-with: []
split-from: []
absorbed-into: "[[roadmap/items/R017-ana-voice]]"
feature: ""
origin: ["[[_archive/ana/decisions#Voice I/O Architecture]]"]
touched: 2026-09-28
---

# R110 — MiMo ASR as cloud STT fallback

## Idea

When local Parakeet on minerva/thalia is unavailable, transcribe through MiMo ASR
(`mimo-v2.5-asr`, token-plan endpoint `https://token-plan-sgp.xiaomimimo.com/v1`). Costs
80–150 ms RTT from Bengaluru plus inference (~250–400 ms+ total vs ~100–280 ms local/LAN).
Details: [[roadmap/research/voice-io-landscape#MiMo ASR (`mimo-v2.5-asr`)]].

## Why

Keeps Ana usable away from the mesh or when minerva is down.

## Open questions

- Fallback detection (health ping vs request timeout) and whether streaming is possible via the API.

## Constraints already decided

- Local CoreML STT is primary: [[domains/product/decisions#^D001]], [[domains/product/decisions#^D003]].

## History

- 2026-09-22 migrated from the archive
- 2026-09-28 absorbed into [[roadmap/items/R017-ana-voice]]
