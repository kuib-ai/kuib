---
id: R307
title: Payload preview and cache-cost transparency
state: shaped
horizon: later
domains: [host, core]
depends-on: ["[[roadmap/items/R301-session-screen]]"]
converges-with: ["[[roadmap/items/R306-discussions-context-control]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/discussions-ux/decisions#Host Affordances (To Build)]]"]
touched: 2026-09-22
---

# R307 — Payload preview and cache-cost transparency

## Idea

Show the user exactly what the next provider call will receive, and what an edit will cost.

- **Payload preview** ([[roadmap/wireframes/payload-preview]], dialog, variant B preferred): left
  column is the folded message → part list in assembly order (excluded parts collapsed with `⊘`);
  right rail is the cost story — input tokens, cache read/write, excluded parts and their tokens,
  discussion toggles, where the cached prefix ends. Opened on demand (`gp`, status-strip click)
  or as an optional pre-send gate ("confirm before send": `Enter` send, `e` edit context, `Esc`
  cancel; flags unsent context changes). Providers without caching show `cache: n/a`.
- **Cache-edit confirm** ([[roadmap/wireframes/cache-edit-confirm]], dialog, variant B
  preferred): editing a part above the cache breakpoint (text edits, reverting tool results,
  un-excluding) shows the diff plus economics — prefix invalidated from where, tokens previously
  cached, estimated rewrite and next read — before committing. Optional `mb` moves the breakpoint
  below the edit. Tail edits (at or below the breakpoint) apply without a dialog.
- Estimates come from `TokenUsage` + `ModelRef` recorded on step boundaries; prefix `~` when a
  step was interrupted.

## Why

The preview is the proof that context control is real rather than a hidden engine filter; the
confirm makes cache invalidation a visible trade-off instead of a surprise bill.

## Open questions

- Per-provider cache rules and breakpoint placement (which providers expose explicit
  breakpoints, which cache automatically).
- Where the next-payload estimate is computed (engine vs host) and how it stays cheap per
  keystroke.

## Constraints already decided

- [[domains/core/decisions#^D009]] — per-step `ModelRef` and `TokenUsage` on stop boundaries.
- [[domains/core/decisions#^D011]] — the payload is a replay of the event log.

## History

- 2026-09-22 migrated from the archive
