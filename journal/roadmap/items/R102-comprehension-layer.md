---
id: R102
title: Comprehension layer — hunks on full files, ledger, intent and blast radius
state: shaped
horizon: later
domains: [core, host]
depends-on: ["[[roadmap/items/R101-context-transparency-and-control]]"]
converges-with: ["[[roadmap/items/R103-intervention-ladder]]", "[[roadmap/items/R209-message-editing-and-branching]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/comprehension-model/decisions#Current Decisions]]", "[[_archive/comprehension-model/decisions#Core Insight]]", "[[_archive/comprehension-model/decisions#Unified Event Stream]]", "[[_archive/comprehension-model/decisions#Hunk Primitive]]", "[[_archive/comprehension-model/decisions#Comprehension Surfaces (v1 target)]]", "[[_archive/comprehension-model/decisions#Resurface and Sub-chats]]", "[[_archive/comprehension-model/decisions#Open Questions]]", "[[_archive/vision/decisions#Mechanisms]]"]
touched: 2026-09-22
---

# R102 — Comprehension layer — hunks on full files, ledger, intent and blast radius

## Idea

**Core insight: review surface ≠ diff, working surface ≠ diff.** Show full file context with
marginalia anchored to lines and hunks — not stripped diffs with equal visual weight per line.

**Unified event stream.** Everything is one ordered event log: agent hunks, user hunks,
decisions, captures, sub-chats, lens switches. Projections — Conversation, Files, Graph, Tree,
Index — are read-time views over the same stream. Agent and user edits are symmetric: both
produce hunks; author is metadata.

**Hunk primitive.** Atomic unit with author, anchor (file + line range), intent links, blast
(call sites, data flow, confidence) and activity metadata. Per-hunk actions: revert,
jump-to-editor, open sub-chat, pin to intent, drift-compare, approve, explore graph. Hunks are
superimposed on **full files** — highlighted bands + annotation gutters, never isolated snippets.

**Surfaces:**

| Surface | Role |
|---|---|
| Conversation | Chronological narrative, context control, discussions overlay ([[roadmap/items/R101-context-transparency-and-control]]) |
| Ledger | Hunk list in agent order, status (unread → engaged), comprehension tracking |
| Code | Full files, LSP, refs, blast navigation |
| Project Map | Bootstrap/greenfield: defined vs undefined layers |
| Intent | `.kuib/intent.yaml` or equivalent — rules, gotchas, open questions |

**Blast radius is deterministic** — LSP call hierarchy + tree-sitter, never RAG. Navigation
goes through kuib's own TUI (the older nvim quickfix framing is stale).

**Resurface and sub-chats.** Open items in marginalia/ledger graduate to the main conversation
when ignored or newly relevant. Sub-chats are hunk-anchored forks with handles (`#sc-12`);
their captures can be promoted to intent. Sub-chats may map onto discussions carrying hunk
anchor metadata.

## Why

The comprehension-first automation mechanism of [[roadmap/items/R100-transparent-comprehension-first-agent]]:
the user keeps understanding of what the agent changed without reading raw diffs.

## Open questions

- Graph projection: ASCII buffer in the first cut, or deferred?
- Dwell → hunk status thresholds (unread → engaged).
- Intent file location: `.kuib/intent.yaml` vs journal-linked.

## Constraints already decided

- Deferred behind the transparency/context-control vertical (v1 scoping, 2026-06-30).
- One event union in a sequenced envelope is the stream the projections read: [[domains/core/decisions#^D004]].

## History

- 2026-09-22 migrated from the archive
