---
id: R220
title: Daemon idle self-reap and no leaked daemons from tests
state: absorbed
horizon: next
domains: [core]
depends-on: []
converges-with: ["[[roadmap/items/R412-full-gate-verification]]"]
split-from: []
absorbed-into: "[[roadmap/items/R018-workspace-health]]"
feature: ""
origin: ["[[_archive/tool-system/decisions#Open / follow-ups]]"]
touched: 2026-09-28
---

# R220 — Daemon idle self-reap and no leaked daemons from tests

## Idea

The `ensureDaemon` spawn-path tests launch real detached `start.daemon` processes that outlive
the run (~20 had accumulated). Fix either by killing the spawned child in test teardown, or by
giving the daemon an idle self-reap like the engine-service's reap timer.

## Why

Leaked daemons hold sockets and old code, confusing later runs and dev reloads.

## Open questions

- Should a daemon reap at all when remote engines may connect over TCP?

## Constraints already decided

- Engine-service lifecycle: socket mutex, detached spawn, idle self-reap —
  [[domains/core/decisions#^D017]].
- Core tests are hermetic — [[domains/core/decisions#^D030]].

## History

- 2026-09-22 migrated from the archive
- 2026-09-28 absorbed into [[roadmap/items/R018-workspace-health]]
