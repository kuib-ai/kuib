---
id: R015
title: Distribution — one signed binary, installed as a service
state: idea
horizon: later
domains: [host, infra]
depends-on: ["[[roadmap/items/R002-deno-runtime]]", "[[roadmap/items/R221-self-contained-engine]]"]
converges-with: ["[[roadmap/items/R014-security-and-secrets]]", "[[roadmap/items/R019-engine-foundation]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["conversation 2026-09-28"]
touched: 2026-10-06
---

# R015 — Distribution — one signed binary, installed as a service

## Idea

kuib ships as one signed binary whose roles are chosen at start, and installs itself as a background service on every platform.

## Research

- [[roadmap/research/startup-and-compile]] — recorded startup and packaging measurements.
- [[features/engine-foundation/research/deno-namespace-bundling]] — module API shape, deferred initialization,
  bundling limitations and proposed validation for a single Deno executable.

## History

- 2026-09-28 created as an initiative; absorbed R303, R304, R406, R409, whose files keep the prior notes
