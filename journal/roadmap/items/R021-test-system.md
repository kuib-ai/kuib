---
id: R021
title: Tests as a first-class part of the workspace
state: graduated
horizon: now
domains: [infra]
depends-on: []
converges-with: []
split-from: ["[[roadmap/items/R018-workspace-health]]"]
absorbed-into: ""
feature: test-system
origin: ["conversation 2026-10-08", "[[roadmap/items/R412-full-gate-verification]]"]
touched: 2026-10-08
---

# R021 — Tests as a first-class part of the workspace

## Idea

Testing is part of the gate and has one shape in every project: three kinds of test as named
targets, real modules instead of stand-ins, offline and isolated by construction, shared
helpers and one fixture convention, and a lint rule, a coverage report, a hook and CI that
keep it true as packages multiply.

## Why

On 2026-10-08 `pnpm run check` was green while `pnpm test` was red, and nothing kept a unit
test off the network. The workspace is about to gain several packages.

## Constraints already decided

- Testing is first class and the setup must scale (owner, 2026-10-08).
- Tests use the real modules, not stand-ins for what the codebase implements (owner, 2026-10-08).
- Colocated, hermetic Deno tests: [[domains/infra/decisions#^D023]].

## History

- 2026-10-08 split from R018 and graduated into `features/test-system` at the owner's request
  ("please make it first class and make the test shape good").
