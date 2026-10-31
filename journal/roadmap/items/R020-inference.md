---
id: R020
title: Inference — a neutral model format, translations built from blocks, providers as plugins
state: graduated
horizon: now
domains: [core]
depends-on: []
converges-with: ["[[roadmap/items/R009-agent-capabilities]]"]
split-from: ["[[roadmap/items/R019-engine-foundation]]"]
absorbed-into: ""
feature: inference
origin: ["conversation 2026-10-07 to 2026-10-08", "[[features/engine-foundation/plan]]"]
touched: 2026-10-08
---

# R020 — Inference

## Idea

kuib talks to models through its own neutral format instead of the AI SDK. A provider and a
model are typed identities; an offering says how one model is served by one provider; a
translation per HTTP schema is assembled from small blocks that an offering selects; and
everything, including the built-in providers, is added through the same plugin path.

## Why

The engine design needs a model layer whose output can be cut at any point, stored and sent
back without loss, whose behaviour is visible as data, and which strangers can extend without
touching the core. The AI SDK hides the request bytes, owns the tool loop and exposes provider
differences as untyped records.

## Constraints already decided

- Neutral intent is translated to provider truth, so requests do not fail (owner, 2026-10-07).
- Anthropic Messages is the first translation (owner, 2026-10-07).
- Provider and model are first-class enums; native slugs are derived (owner, 2026-10-08).
- One format per offering, chosen by testing which endpoint covers more (owner, 2026-10-08).
- Behaviour is composed from blocks; a plugin may contribute a single block (owner,
  2026-10-08).
- The format's schemas live in `protocol`, which stays one package (owner, 2026-10-07).

## History

- 2026-10-08 split from R019 after the engine design discussion and graduated into
  `features/inference` at the owner's request ("can you /journal-graduate the plan for this?").
