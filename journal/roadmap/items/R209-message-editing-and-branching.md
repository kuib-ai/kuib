---
id: R209
title: Editable messages, message versions and conversation branching
state: idea
horizon: later
domains: [core, host]
depends-on: ["[[roadmap/items/R207-checkpoints-and-context-assembly]]"]
converges-with: ["[[roadmap/items/R210-part-exclusion-and-context-curation]]", "[[roadmap/items/R102-comprehension-layer]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/context-engine/decisions#Goal]]", "[[_archive/context-engine/decisions#1. Editable AI & User Messages]]", "[[_archive/context-engine/decisions#2. Forking and Branching Conversations]]", "[[_archive/context-engine/decisions#Open Questions (To Brainstorm)]]", "[[_archive/protocol-design/decisions#Command Editing — Cache-Safe (Option B)]]", "[[_archive/protocol-design/decisions#Versioning boundaries (2026-06-30)]]"]
touched: 2026-09-22
---

# R209 — Editable messages, message versions and conversation branching

## Idea

Absolute control over the context window to recover from doom loops.

- **Edit both user and assistant messages.** If the model wrote a slightly wrong code block or
  hallucinated a premise, the user edits that message inline before replying, so the *next*
  context window is not polluted by the mistake.
- **Edits create versions, never mutate parts.** A message carries a content `version: number`
  (domain versioning, distinct from schema `_version`); an edit emits
  `MessageVersionCreated { messageID, version }` and the checkpoint's `activeMessages` records
  which version is active (R207).
- **Branches:** editing a past message (or forking a thought) creates a branch in the event log.
  A branch is a sub-chat, possibly anchored to a specific code hunk. Users traverse branches
  like a tree; at any moment the **active branch is flattened into a linear `Message[]`** for the
  model. The engine resolves the current branch, applies exclusion filters (R210) and computes
  the final payload.
- **Cost transparency:** editing mid-conversation invalidates the provider prompt cache —
  intentional; hosts show the cost delta (from `TokenUsage` + `ModelRef`) before the user
  confirms. (Edits to the current turn's tool input are cache-safe — see R204.)

## Why

Today the only recovery from a derailed conversation is starting over; the log is append-only
with no way to replace an assumption.

## Open questions

- Forking UX: visual tree (Discord-thread style) or linear timeline with a branch switcher
  (git style)?
- How the engine assembles context when several branches run in parallel.
- Structural representation of a fork in the SQLite event log (new session with a parent
  pointer? branch ID on the envelope?).

## Constraints already decided

- Parts are append-only within a message version — [[domains/core/decisions#^D008]].
- Context is rebuilt from the log; the prefix must stay byte-stable for automatic provider
  caching — [[domains/core/decisions#^D011]].

## History

- 2026-09-22 migrated from the archive
