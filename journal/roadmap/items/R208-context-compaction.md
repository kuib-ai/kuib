---
id: R208
title: Context compaction as an ordinary summary message
state: shaped
horizon: later
domains: [core, host]
depends-on: ["[[roadmap/items/R207-checkpoints-and-context-assembly]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Compaction — Just a Regular Message]]"]
touched: 2026-09-22
---

# R208 — Context compaction as an ordinary summary message

## Idea

Compaction replaces N old messages with one summary message. No `synthetic` flag, no special
part type, no `ContextCompacted` event: the summary is a regular `MessageUser`.
Pre-compaction messages are **archived, not deleted** — the checkpoint's `activeMessages`
list decides what is in context, and archived messages are simply absent from it. Hosts grey
them out. Reverting a compaction re-activates the originals and archives the summary.

## Why

Long sessions overflow the context window (`context_overflow` is already an assistant error
kind); compaction must stay reversible and transparent.

## Open questions

- Trigger: manual, threshold on `TokenUsage`, or on `context_overflow`.
- Whether the taxonomy's `CompactionPerformed { archivedMessageIDs, summaryMessageID }` event
  (R203) is needed or a new checkpoint suffices.

## Constraints already decided

- History is never deleted; the active set lives on checkpoints (R207).

## History

- 2026-09-22 migrated from the archive
