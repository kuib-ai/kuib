---
title: "UX Classification"
type: reference
status: stable
layer: process
created: 2026-06-18
tags: [classification, ux, context, model, process]
depends-on: []
informs:
  ["[[bootstrap-validation]]", "[[context-bootstrap]]", "[[journal-system]]"]
---

# UX Classification

## Current Decisions

When recording bootstrap scenes or product gaps, tag every observation:

| Tag             | Meaning                                                                       | Build target?                 |
| --------------- | ----------------------------------------------------------------------------- | ----------------------------- |
| **`[UX]`**      | Missing affordance, surface, flow, empty state, visualization                 | **Yes**                       |
| **`[Context]`** | Bootstrap injection, manifest, indexing, payload assembly, checkpoint context | **Yes**                       |
| **`[Model]`**   | Depends on frontier model noticing, phrasing, judgment                        | **No** — assume capable model |

### Rule

We work on **`[UX]`** and **`[Context]`**. We do not design around a weak model.

### Examples (Scene 0)

| Observation                                                      | Tag          |
| ---------------------------------------------------------------- | ------------ |
| No Project Map surface showing defined vs undefined layers       | UX           |
| Cold start sends only user message — no journal index in context | Context      |
| "Kuib should have noticed host isn't in docs" without manifest   | Model        |
| Structured `[1][2][3]` actions in Project Map                    | UX + Context |
| Context engine detects greenfield + unindexed md                 | Context      |

### Promotion

Scene files hold tagged findings. Milestone UX/Context decisions promote to parent entries (`host-layer`, `context-bootstrap`, etc.). Model-tagged items may be noted as "given capable model + scaffolding."
