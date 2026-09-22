---
id: R306
title: Discussions and part-level context control in the conversation
state: shaped
horizon: later
domains: [host, core]
depends-on: ["[[roadmap/items/R301-session-screen]]"]
converges-with: ["[[roadmap/items/R307-payload-preview-cache-cost]]", "[[roadmap/items/R210-part-exclusion-and-context-curation]]", "[[roadmap/items/R211-discussions-overlay]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/discussions-ux/decisions#Current Decisions]]", "[[_archive/discussions-ux/decisions#Protocol vs UX Split]]", "[[_archive/discussions-ux/decisions#Granular Context Control]]", "[[_archive/discussions-ux/decisions#v1 Merge with Comprehension]]", "[[_archive/discussions-ux/decisions#Host Affordances (To Build)]]", "[[_archive/discussions-ux/decisions#Open Questions]]"]
touched: 2026-09-22
---

# R306 — Discussions and part-level context control in the conversation

## Idea

Absolute context control from the Conversation pane — not a linear "last N messages" window.

- **Exclude parts** — dimmed in the UI, omitted from the LLM payload, still in the log
  (`UserPartExcluded` / `PartIncluded`).
- **Discussions** — named clusters of parts: select parts → save as a discussion
  (`DiscussionPartsAdded`), toggle a whole discussion in or out of the next context build at
  runtime, link discussions across sessions (`DiscussionLinked`, snapshot semantics TBD).
- **Render model** — the linear `Message[]` is the base; the discussion view overlays it through a
  `Set<PartID>` lookup (in-discussion highlighted, excluded dimmed).
- **Edit** AI/user parts to recover from doom loops; edits above the cache breakpoint go through
  [[roadmap/items/R307-payload-preview-cache-cost]].
- **Comprehension merge** — the Conversation pane carries discussions + transparency; the Ledger
  carries hunks; a discussion may carry optional `anchors: HunkID[]` for navigation only (never
  sent to the LLM). Sub-chats may be discussions with hunk anchors.

Screens:

- [[roadmap/wireframes/conversation]] — part-addressable transcript, variant D preferred: split
  gutter (cache column `c`/`a`/`h`; inclusion column `x`/`d`), NORMAL (`j/k` part, `gh/gl`
  message, `gp` preview, `:discussion save`), VISUAL (`s` save discussion, `x` exclude, `e`
  edit), floating modal edit.
- [[roadmap/wireframes/discussion-manager]] — dialog (`:discussion` / `gd`): list + part preview,
  toggle, link, snapshot; save-from-selection form.
- The quick-toggle list lives in the Context pane of [[roadmap/wireframes/session-layout]].

What exists: every part already carries `excluded` and a `PartID`, and messages carry a
`discussionID` ([[domains/core/current#^C008]], [[domains/core/current#^C004]]). The
exclusion/discussion events and the context-build filter do not.

## Why

Transparency and control over what the model sees is kuib's core promise; exclusion and
discussions are how a user removes pollution without starting over.

## Open questions

- Is a discussion included by default on create, or opt-in? (The wireframe assumes opt-in.)
- Cross-session links: snapshot vs live, and an explicit "update to latest" UX.
- LLM context from mixed refs (parts + hunk IDs) vs parts only.

## Constraints already decided

- [[domains/core/decisions#^D009]] — parts carry identity and exclusion.
- [[domains/core/decisions#^D011]] — model context is rebuilt by replaying the event log, so
  exclusion is a replay-time filter.
- [[domains/core/decisions#^D004]] — user actions are events in the one union.

## History

- 2026-09-22 migrated from the archive
