---
id: R103
title: Graded intervention ladder for autonomous runs
state: idea
horizon: later
domains: [core, host]
depends-on: []
converges-with: ["[[roadmap/items/R102-comprehension-layer]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/comprehension-model/decisions#Intervention Ladder]]"]
touched: 2026-09-22
---

# R103 — Graded intervention ladder for autonomous runs

## Idea

The agent runs autonomously by default. Interrupts are graded: **silent → ambient → soft pause
→ hard pause → scout handoff**. A classifier picks the level per action. Lower rungs surface
into the comprehension layer's marginalia/ledger ([[roadmap/items/R102-comprehension-layer]]);
upper rungs stop the run for the user.

## Why

Binary approve/deny prompts either interrupt constantly or not at all; comprehension-first
automation needs the agent to keep moving while still escalating what matters.

## Open questions

- What the classifier keys on (operation × target risk tiers, confidence, blast radius).
- What "scout handoff" hands over and to whom.

## Constraints already decided

- Mid-run user submits already steer a run at step boundaries: [[domains/core/decisions#^D018]].

## History

- 2026-09-22 migrated from the archive
