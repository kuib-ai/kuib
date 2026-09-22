---
id: R101
title: Context transparency and control — inspect, compose and exclude what the model sees
state: shaped
horizon: next
domains: [core, host]
depends-on: []
converges-with: ["[[roadmap/items/R210-part-exclusion-and-context-curation]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/vision/decisions#Mechanisms]]", "[[_archive/comprehension-model/decisions#Comprehension Surfaces (v1 target)]]"]
touched: 2026-09-22
---

# R101 — Context transparency and control — inspect, compose and exclude what the model sees

## Idea

The first vertical of the product vision ([[roadmap/items/R100-transparent-comprehension-first-agent]]),
scoped as v1 on 2026-06-30:

- **Transparency** — before send, the user sees exactly the messages that go to the LLM API.
- **Control** — the user modifies, excludes or reshapes messages and parts; the context window
  is composable, not a fixed rolling history.
- **Discussion clustering** — messages cluster into logical discussions that can be included or
  excluded as a unit at runtime; per-part exclusion through the `excluded` flag.
- **Saved message-sets as context** — a selected set of messages is saved as referenceable
  context, *not* boiled down into a markdown summary.

The Conversation surface carries this: chronological narrative + context control + a
discussions overlay.

## Why

Transparency and control are the cheapest differentiator to ship and do not depend on the
comprehension layer (hunks, ledger, blast radius), which was deferred to v1.x.

## Open questions

- How a saved message-set is referenced from another session (by discussion ID, by explicit
  set ID?).
- Whether exclusion is itself an event in the log or a property rewritten on the part.

## Constraints already decided

- `PartBase { partID, excluded }` and `discussionID` on messages exist in the protocol: [[domains/core/current#^C008]], [[domains/core/decisions#^D009]].
- Context is rebuilt by folding the event log each run: [[domains/core/decisions#^D011]].

## History

- 2026-09-22 migrated from the archive
