---
id: R104
title: Editor handoff — read-first comprehension UI with explicit unlock to edit
state: idea
horizon: maybe
domains: [host]
depends-on: ["[[roadmap/items/R102-comprehension-layer]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/comprehension-model/decisions#Agent Is Not the Editor]]", "[[_archive/vision/decisions#Mechanisms]]"]
touched: 2026-09-22
---

# R104 — Editor handoff — read-first comprehension UI with explicit unlock to edit

## Idea

**The agent is not the editor.** Code editing uses the user's muscle memory (a controlled nvim
by default). The comprehension UI is read-first for review, with an explicit unlock for editing.
The agent surfaces state into the editor (jump-to-editor from a hunk) but never gates on a
buffer being open. Depth editing is optional and must not require the user's own dotfiles.

## Why

Keeps comprehension and editing separate so the agent loop never blocks on editor state.

## Open questions

- Controlled nvim vs an in-TUI editor once kuib's own TUI library exists.

## Constraints already decided

- The host keeps only non-UI plumbing until kuib's own TUI library exists: [[domains/host/decisions#^D002]].

## History

- 2026-09-22 migrated from the archive
