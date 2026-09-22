---
title: "Context Engine & Semantics"
type: implementation
layer: architecture
status: decided
created: 2026-07-05
tags: [engine, context, branches, forks, ux, doom-loops, ai-messages]
depends-on: ["[[comprehension-model]]", "[[discussions-ux]]", "[[vision]]"]
informs: []
---

# Context Engine & Semantics

## Goal
Absolute control over the context window to prevent LLM context pollution and recover from doom loops, implemented in the `engine` package.

## Current Decisions

### 1. Editable AI & User Messages
- **Doom Loop Prevention**: Users can surgically edit both their own messages and the AI's responses.
- If the AI generates a slightly wrong code block or hallucinates a premise, the user can edit the AI's message inline before replying. 
- This replaces the bad assumption in the event log, ensuring the *next* context window isn't polluted by the AI's previous mistake.

### 2. Forking and Branching Conversations
- **Sub-chats & Hunk-Anchored Forks**: A branch is essentially a sub-chat anchored to a specific hunk (as noted in `[[comprehension-model]]`).
- **UX Semantics**: How branching is represented visually. When a user edits a past message (or forks a thought), it creates a branch in the event log. 
- The user can traverse these branches like a tree, but at any given time, the active branch is flattened into a linear `Message[]` payload for the LLM.

### 3. Context Curations
- **Selective Inclusion**: Users can exclude specific message parts (`PartExcluded`).
- The `engine` is responsible for taking the raw event log, resolving the current branch, applying exclusion filters, and computing the final token-optimized payload to send to the provider.

## Open Questions (To Brainstorm)
- **Forking UX**: When a conversation is forked, do we show a visual tree (like Discord threads) or a linear timeline with a branch switcher (like Git)?
- **Orchestration**: How does the `engine` orchestrate context assembly when multiple branches are running in parallel?
- What are the exact structural representations of a "Fork" in the SQLite event log?
