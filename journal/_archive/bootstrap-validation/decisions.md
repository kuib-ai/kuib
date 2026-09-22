---
title: "Bootstrap Validation"
type: research
status: in-progress
layer: process
created: 2026-06-18
tags: [bootstrap, validation, roleplay, edge-cases, methodology]
depends-on: ["[[vision]]", "[[ux-classification]]", "[[journal-system]]"]
informs:
  [
    "[[host-layer]]",
    "[[context-bootstrap]]",
    "[[discussions-ux]]",
    "[[comprehension-model]]",
  ]
---

# Bootstrap Validation

## Current Decisions

### Methodology

Validate Kuib by **simulating building Kuib as a user journey** — not narrow dogfooding of incomplete software on the critical path for writing code.

**Format:**

1. Run one **scene** — user message to Kuib, Kuib response, host state
2. **Stop** — builder input required before next scene
3. Classify each finding: `[UX]`, `[Context]`, or `[Model]` (see [[ux-classification]])
4. Record **ideal behavior** for UX/Context gaps only
5. **Architecture derived later** — after edge cases accumulate, not upfront

### Roles

- **User** — developer building the product
- **Kuib** — product voice (agent + host behavior)
- **Builder** — both participants reflect on ideal vs actual

### Output Locations

- Scene findings → `bootstrap-validation/research/scene-*.md`
- Milestone decisions promoted to relevant entry `decisions.md`
- Do not create monolithic session dump entries

### Scope Classification Reminder

We work on **UX** and **Context** findings. **Model** findings are assumptions about a capable frontier model — not build targets.

### Scenes Completed

- [[bootstrap-validation/research/scene-00-cold-start]] — greenfield session, host layer request, Project Map + context bootstrap

## Open Questions

- Scene 1 topic: user accepts bootstrap nudge vs override to implement?
- When is "validation complete" enough to derive architecture doc?
