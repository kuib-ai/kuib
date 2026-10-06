---
id: R019
title: Reusable engine foundation — application boundaries and efficient Deno deployment
state: graduated
horizon: now
domains: [core, host, infra, product]
depends-on: []
converges-with: ["[[roadmap/items/R007-context-control]]", "[[roadmap/items/R009-agent-capabilities]]", "[[roadmap/items/R013-multi-device-mesh]]", "[[roadmap/items/R015-distribution]]", "[[roadmap/items/R221-self-contained-engine]]"]
split-from: []
absorbed-into: ""
feature: engine-foundation
origin: ["conversation 2026-10-04 to 2026-10-06"]
touched: 2026-10-06
---

# R019 — Reusable engine foundation

## Idea

Shape the engine for Kuib, Ana and later applications: consumer-controlled context, pluggable
tools and models, application-defined session state, and boundaries that work on one device or
a mesh. Establish startup-efficient deployment as one Deno executable while retaining the
owner's readable namespace APIs. The feature owns the architecture, evidence and staged plan.

## Why

The current loop binds the AI SDK, two file tools, a daemon client and a fixed context builder.
Separating those responsibilities and assessing their startup costs precedes self-contained
process bootstrap and avoids making later applications inherit coding-specific assumptions.

## Constraints already decided

- Owner: "let us keep caution by default that whatever we are building must support subsequent
  iterations/applications".
- Owner: "i want to be deno first"; "i will have to bundle the application as deno single compiled
  binary"; "i want snappy startups".
- Preserve namespace-shaped usage such as `Protocol.Message.User`.
- Owner: "please get me the plan first instead of implemetnation"; "do not take decisions for me".

## Open questions

The feature tracks namespace/loading semantics, compiled performance, SDK replacement design,
application contracts and the still-proposed mesh/consensus design. Graduation records the work;
it does not select a bundler or approve the proposed architecture.

## History

- 2026-10-06 captured from the engine-mesh-shape scratchpad and graduated into
  [[features/engine-foundation/plan]] at the owner's request: "graduate this current journal as a feature".
