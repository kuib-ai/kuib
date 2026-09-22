---
title: "Comprehension Model"
type: vision
status: decided
layer: product
created: 2026-06-18
tags: [comprehension, hunks, ledger, intent, pair, cognition]
depends-on: ["[[vision]]"]
informs:
  [
    "[[host-layer]]",
    "[[discussions-ux]]",
    "[[context-bootstrap]]",
    "[[architecture-overview]]",
    "[[nvim-integration]]",
    "[[context-engine]]",
  ]
---

# Comprehension Model

## Current Decisions

### Core Insight

**Review surface ≠ diff. Working surface ≠ diff.** Full file context + marginalia anchored to lines and hunks — not stripped diffs with equal visual weight per line.

### Unified Event Stream

Everything is one ordered event log: agent hunks, user hunks, decisions, captures, sub-chats, lens switches. Projections (Conversation, Files, Graph, Tree, Index) are read-time views over the same stream.

Agent and user edits are symmetric — both produce hunks. Author is metadata.

### Hunk Primitive

Atomic unit with: author, anchor (file + line range), intent links, blast (call sites, data-flow, confidence), activity metadata.

Per-hunk actions: revert, jump-to-editor, open sub-chat, pin to intent, drift-compare, approve, explore graph.

Hunks are superpositioned on **full files** — highlighted bands + annotation gutters, never isolated snippets.

### Comprehension Surfaces (v1 target)

| Surface          | Role                                                                            |
| ---------------- | ------------------------------------------------------------------------------- |
| **Conversation** | Chronological narrative, context control, discussions overlay                   |
| **Ledger**       | Hunk list in agent order, status (unread → engaged), comprehension tracking     |
| **Code**         | Full files, LSP, refs, blast navigation via quickfix order                      |
| **Project Map**  | Bootstrap/greenfield: defined vs undefined layers (see [[context-bootstrap]])   |
| **Intent**       | `.kuib/intent.yaml` or equivalent — rules, gotchas, open questions (five feeds) |

> **v1 scoping (2026-06-30):** Blast radius + the hunk-Ledger comprehension layer are **deferred to v1.x**. v1 ships the **transparency / context-control** vertical (Conversation + discussions: compose the context window, save selected message-sets as referenceable context — _not_ boiled-down md docs). When built, blast is **deterministic** — LSP call-hierarchy + tree-sitter, never RAG; the "quickfix order" framing above is stale (nvim-era) — v1.x navigates via OpenTUI. See [[discussions-ux]], [[host-layer]].

### Intervention Ladder

Agent runs autonomously by default. Graded interrupts: silent → ambient → soft pause → hard pause → scout handoff. Classifier picks level per action.

### Resurface and Sub-chats

Open items in marginalia/ledger graduate to main conversation when ignored or newly relevant. Sub-chats are hunk-anchored forks with handles (`#sc-12`), promotable captures to intent.

Sub-chats may map to **discussions** with hunk anchor metadata (see [[discussions-ux]]).

### Phaseless Workflow

No explicit Plan/Execute/Review modes. Phase signal is implicit in what's surfacing (marginalia, lens, intent state). Round-shaped lifecycle, fluid movement inside a round.

### Agent Is Not the Editor

Code editing uses user's muscle memory (nvim default via [[host-layer]]). Comprehension UI is read-first for review; explicit unlock for edit. Agent surfaces state into editor; does not gate on buffer open.

## Open Questions

- Graph projection in v1 — ASCII buffer vs deferred?
- Dwell → hunk status thresholds (see [[bootstrap-validation]] scenes)
- Intent file location: `.kuib/intent.yaml` vs journal-linked
