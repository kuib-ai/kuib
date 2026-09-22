---
title: "Product Vision"
type: vision
status: decided
layer: product
created: 2026-04-13
tags: [product, strategy, differentiation, pair, comprehension]
depends-on: []
informs:
  [
    "[[architecture-overview]]",
    "[[comprehension-model]]",
    "[[provider-architecture]]",
    "[[discussions-ux]]",
    "[[bootstrap-validation]]",
    "[[infrastructure-strategy]]",
    "[[context-engine]]"
  ]
---

# Product Vision

## Current Decisions

Protocol layer (discussions, context control, transparency) and comprehension layer (hunks, ledger, intent, blast radius) are facets of the same agent — not separate projects.

### Mechanisms

1. **Transparency** — users see exactly what messages are sent to the LLM API before send
2. **Control** — users modify, exclude, or reshape messages; context window is composable, not fixed
3. **Discussion clustering** — logical message clusters included/excluded at runtime; per-part exclusion via `excluded` flag
4. **Comprehension-first automation** — agent does not block on editor state; comprehension UI owns the loop (see [[comprehension-model]])
5. **Optional depth editing** — controlled nvim for focused edit; not required user dotfiles

### External Design Reference

Comprehension-UX interaction prototypes are explored separately from this journal. The journal holds the decisions; the prototypes hold the visual/interaction exploration.

## Repo structure (2026-07-01)

Both the code and the journal live in the same public repository (`journal/` is committed alongside the packages).

**Repo structure: flat single monorepo**, not the umbrella-with-submodule nesting. `journal/` is a sibling of `packages/` so `@context` links resolve _within_ the repo (no walking up past the monorepo root).

A hosted, **dataless** Headscale+DERP coordinator relays traffic while data stays P2P; self-hosting is also supported. See [[infrastructure-strategy]].
