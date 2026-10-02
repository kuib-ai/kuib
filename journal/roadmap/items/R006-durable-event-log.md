---
id: R006
title: Durable event log
state: idea
horizon: next
domains: [core, host, infra]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["conversation 2026-09-28"]
touched: 2026-09-28
---

# R006 — Durable event log

## Idea

The session event log is the engine's single source of truth: it survives crashes and restarts, stays consistent when several writers append, keeps its schema evolvable, and stays fast on the hot path.

## History

- 2026-09-28 created as an initiative; absorbed R200, R201, R202, R203, R206, R212, R215, whose files keep the prior notes
