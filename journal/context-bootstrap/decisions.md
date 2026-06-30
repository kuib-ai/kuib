---
title: "Context Bootstrap"
type: implementation
status: open
layer: experience
created: 2026-06-18
tags: [bootstrap, context, greenfield, project-map, manifest]
depends-on:
  [
    "[[host-layer]]",
    "[[protocol-design]]",
    "[[journal-system]]",
    "[[bootstrap-validation]]",
  ]
informs: []
---

# Context Bootstrap

## Current Decisions

### Problem

Cold start on greenfield repos (docs only, sparse code) — model should not jump to implementation without project context. **Detection and injection are context engineering**, not model intelligence (see [[ux-classification]]).

### Context Engine (Before First Turn)

Detect:

- Sparse or missing codebase (`packages/host`, `packages/engine` absent)
- Plain markdown docs (`journal/*.md`) possibly **unindexed**
- External design refs not linked (e.g. external UX prototypes)

Inject bootstrap block (format TBD: system reminder, `.kuib/manifest.yaml`, dreamer-agent pass):

```yaml
bootstrap:
  phase: greenfield-docs
  indexed: false
  block_implementation: true # until user picks action or overrides
  open_layers: [host, discussions-ux, ledger, nvim-layout]
  decided: [engine-events, part-schema, checkpoint-model]
```

### Project Map Buffer (UX)

Host renders **Project Map** in right pane when no code hunks exist. See [[bootstrap-validation/research/scene-00-cold-start]] for Scene 0 concrete layout:

- ON DISK scan (journal/, kuib/apps/tui smoke-test, packages/protocol partial)
- LAYER STATUS bars (engine, discussions schema-only, host missing, etc.)
- JOURNAL COVERAGE from `_index.md`
- DEPENDENCY build-order hint (from manifest, not model-guessed)
- SUGGESTED actions `[1] Index journal` `[2] Sketch host layout` `[3] Link design ref`

### Empty States

- Ledger: "design phase — no code hunks"
- Code pane: closed until first file touch

### Ideal First-Turn Behavior (Given Scaffolding)

Kuib summarizes map, does not draft `HostProtocol` until user picks bootstrap action or explicitly overrides.

## Open Questions

- Manifest format: `.kuib/manifest.yaml` vs journal index job vs both
- `block_implementation` default — always on greenfield or user preference?
- Dreamer agent: separate pass vs inline bootstrap injection
