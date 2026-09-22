---
id: R107
title: Ana persistent conversation with structured fact extraction
state: shaped
horizon: next
domains: [product, core]
depends-on: ["[[roadmap/items/R106-ana-application]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/ana/decisions#Context Management]]"]
touched: 2026-09-22
---

# R107 — Ana persistent conversation with structured fact extraction

## Idea

- **Single persistent conversation channel** — not session-based; Ana is always the same
  conversation.
- **Structured extraction** (chosen over rolling summarization) — extract facts, tasks and
  commitments into an indexed store; rebuild context every turn from system prompt + extracted
  facts + recent turns.
- Lowest latency is the priority.
- Reuse the engine's exclusion/branching mechanics for context; the persistent channel and the
  extraction layer are Ana-specific.

## Why

A voice assistant must remember across days without an ever-growing transcript in every call.

## Open questions

- Extraction trigger (every turn, idle, or boundary events) and store (SQLite table beside the log?).
- How extracted facts are corrected or retracted by the user.

## Constraints already decided

- Context is rebuilt by folding the event log each run: [[domains/core/decisions#^D011]] — extraction changes what the fold includes.
- The prototype keeps only the last 10 turns: [[domains/product/current#^C013]].

## History

- 2026-09-22 migrated from the archive
