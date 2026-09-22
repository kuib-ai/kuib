---
id: R100
title: Kuib north star — a transparent, comprehension-first coding agent
state: shaped
horizon: later
domains: [core, host]
depends-on: ["[[roadmap/items/R101-context-transparency-and-control]]", "[[roadmap/items/R102-comprehension-layer]]", "[[roadmap/items/R103-intervention-ladder]]", "[[roadmap/items/R104-editor-handoff]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/vision/decisions#Current Decisions]]", "[[_archive/vision/decisions#Mechanisms]]", "[[_archive/comprehension-model/decisions#Phaseless Workflow]]", "[[_archive/ux-classification/decisions#Current Decisions]]", "[[_archive/ux-classification/decisions#Rule]]"]
touched: 2026-09-22
---

# R100 — Kuib north star — a transparent, comprehension-first coding agent

## Idea

The durable product direction. Two layers that are facets of the **same agent**, not separate
projects:

- **Protocol layer** — discussions, context control, transparency ([[roadmap/items/R101-context-transparency-and-control]]).
- **Comprehension layer** — hunks, ledger, intent, blast radius ([[roadmap/items/R102-comprehension-layer]]).

The five mechanisms that differentiate kuib:

1. **Transparency** — the user sees exactly which messages are sent to the LLM API before send.
2. **Control** — the user modifies, excludes or reshapes messages; the context window is
   composable, not fixed.
3. **Discussion clustering** — logical clusters of messages are included/excluded at runtime;
   per-part exclusion via the `excluded` flag.
4. **Comprehension-first automation** — the agent does not block on editor state; the
   comprehension UI owns the loop.
5. **Optional depth editing** — a controlled editor for focused edits, not a requirement on the
   user's dotfiles ([[roadmap/items/R104-editor-handoff]]).

**Phaseless workflow.** No explicit Plan / Execute / Review modes. The phase signal is implicit
in what is surfacing (marginalia, lens, intent state). Work is round-shaped, with fluid movement
inside a round.

**Design principle — build UX and Context, never compensate for a weak model.** Every observed
product gap is classified:

| Tag | Meaning | Build target? |
|---|---|---|
| `[UX]` | Missing affordance, surface, flow, empty state, visualization | Yes |
| `[Context]` | Bootstrap injection, manifest, indexing, payload assembly, checkpoint context | Yes |
| `[Model]` | Depends on the frontier model noticing, phrasing, judgment | No — assume a capable model |

## Why

Coding agents today hide the payload and hand the user stripped diffs. Kuib's bet is that
seeing and shaping the context, and comprehending changes on full files, is the product.

## Open questions

- Which slice after context control lands first: the ledger/hunk layer or the intervention ladder?

## Constraints already decided

- Parts already carry an `excluded` flag: [[domains/core/decisions#^D009]].
- Model context is rebuilt from the event log each run, so what is sent is derivable: [[domains/core/decisions#^D011]].

## History

- 2026-09-22 migrated from the archive
