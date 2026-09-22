---
id: R414
title: Scheduled drift audit of domain context
state: idea
horizon: maybe
domains: [infra]
depends-on: ["[[roadmap/items/R001-context-system]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/journal-system/decisions#Open Questions]]"]
touched: 2026-09-22
---

# R414 — Scheduled drift audit of domain context

## Idea

Run journal validation and the drift report on a schedule (the legacy journal left the exact
cron cadence open), surfacing flagged claims for a `context-audit` pass instead of waiting for
someone to run it by hand.

## Why

Drift detection is cheap and deterministic; correction only happens if someone looks.

## Open questions

- Cadence (per commit on master, nightly, weekly) and where it runs (CI, a scheduled agent).

## Constraints already decided

- Drift is deterministic and correction model-assisted: [[domains/infra/decisions#^D002]], [[domains/infra/current#^claim-verification]].

## History

- 2026-09-22 migrated from the archive
