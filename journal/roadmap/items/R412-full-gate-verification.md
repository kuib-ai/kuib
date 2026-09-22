---
id: R412
title: Full-gate verification — madge in check, hermetic spawn teardown
state: shaped
horizon: next
domains: [infra, core]
depends-on: []
converges-with: ["[[roadmap/items/R220-daemon-idle-reap]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/testing-strategy/decisions#Verification protocol]]", "[[_archive/testing-strategy/decisions#Hermeticity rules (each learned from a real failure)]]", "[[_archive/house-style-linting/decisions#Lint infra changes (2026-07-01)]]"]
touched: 2026-09-22
---

# R412 — Full-gate verification — madge in check, hermetic spawn teardown

## Idea

- **madge as a gate.** Circular-dependency detection (`madge --circular` over `packages` and
  `apps`) is the real guard against barrel cycles, independent of import path style — but it
  runs only as `pnpm check:circular`, outside `pnpm run check`. Fold it into the green gate
  (ideally as a cached Nx target).
- **Verification protocol for agents.** Anything that writes tests verifies with all gates —
  tests, typecheck, lint, format and madge — never the runner alone. The 2026-07-02 sweep proved
  runner-only verification lies: 46 "green" tests hid 22 lint errors, 8 typecheck failures and
  one cross-file mock leak.
- **Kill spawned processes in teardown.** Known violation: `ensure.daemon`'s spawn-path test
  launches a real detached `start.daemon` child that can outlive the run (~20 accumulated once;
  `pnpm reload` clears them). Tests must reap what they spawn.

## Why

The green gate is only as honest as the checks it includes.

## Open questions

- Is the `ensure.daemon` spawn leak still reproducible under Deno?

## Constraints already decided

- Colocated, hermetic Deno tests; verification = tests plus `pnpm run check`: [[domains/infra/decisions#^D023]].
- What `pnpm run check` runs today: [[domains/infra/current#^check-pipeline]].
- Reload clears the detached runtime: [[domains/infra/decisions#^D021]].

## History

- 2026-09-22 migrated from the archive
