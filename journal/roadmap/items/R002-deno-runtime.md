---
id: R002
title: Deno as the only runtime
state: graduated
horizon: now
domains: [infra, core, host]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: "deno-runtime"
origin: ["[[features/deno-runtime/plan]]"]
touched: 2026-09-22
---

# R002 — Deno as the only runtime

## Idea

Every TS project runs and tests on Deno used purely as a runtime; Bun, OpenTUI and the Solid/Vite front ends are gone.
