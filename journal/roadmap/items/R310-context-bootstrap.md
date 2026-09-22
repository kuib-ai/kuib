---
id: R310
title: Context bootstrap for greenfield repos
state: idea
horizon: later
domains: [core, host]
depends-on: ["[[roadmap/items/R301-session-screen]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/context-bootstrap/decisions#Current Decisions]]", "[[_archive/context-bootstrap/decisions#Problem]]", "[[_archive/context-bootstrap/decisions#Context Engine (Before First Turn)]]", "[[_archive/context-bootstrap/decisions#Project Map Buffer (UX)]]", "[[_archive/context-bootstrap/decisions#Empty States]]", "[[_archive/context-bootstrap/decisions#Ideal First-Turn Behavior (Given Scaffolding)]]", "[[_archive/context-bootstrap/decisions#Open Questions]]", "[[_archive/bootstrap-validation/decisions#Current Decisions]]", "[[_archive/bootstrap-validation/decisions#Methodology]]", "[[_archive/bootstrap-validation/decisions#Roles]]", "[[_archive/bootstrap-validation/decisions#Scope Classification Reminder]]", "[[_archive/bootstrap-validation/decisions#Scenes Completed]]", "[[_archive/bootstrap-validation/decisions#Open Questions]]"]
touched: 2026-09-22
---

# R310 — Context bootstrap for greenfield repos

## Idea

On a cold start in a greenfield repo (docs only, sparse code) the model should not jump to
implementation without project context. Detection and injection are context engineering, not
model intelligence.

**Before the first turn, detect:** a sparse or missing codebase, plain markdown docs that may be
unindexed, external design references not linked.

**Inject a bootstrap block** (format open: system reminder, a manifest file, or a separate
"dreamer" agent pass):

```yaml
bootstrap:
  phase: greenfield-docs
  indexed: false
  block_implementation: true # until user picks an action or overrides
  open_layers: [host, discussions-ux, ledger, nvim-layout]
  decided: [engine-events, part-schema, checkpoint-model]
```

**Project Map buffer** in the right pane when no code hunks exist (concrete frame in
[[roadmap/research/scene-00-cold-start]]): ON DISK scan, LAYER STATUS bars, JOURNAL COVERAGE,
DEPENDENCY build-order hint (from the manifest, not model-guessed), SUGGESTED actions
(`[1] Index journal`, `[2] Sketch host layout`, `[3] Link design ref`).

**Empty states:** Ledger reads "design phase — no code hunks"; the code pane stays closed until
the first file touch; the empty session screen gets its copy here
([[roadmap/items/R301-session-screen]]).

**Ideal first turn:** kuib summarises the map and does not draft code until the user picks a
bootstrap action or explicitly overrides.

**Validation method** (how these behaviours were found and should keep being found): simulate
building kuib as a user journey, one scene at a time — user message, kuib reply, host state —
then stop for builder input. Roles: user (developer), kuib (agent + host), builder (both,
reflecting). Classify each finding `[UX]`, `[Context]` or `[Model]`; record ideal behaviour only
for UX and Context (Model findings are assumptions about a capable frontier model, not build
targets). Derive architecture after edge cases accumulate. Scene 0 (cold start) is done.

## Why

The worst first impression is an agent confidently scaffolding the wrong thing because nothing
told it the project is still in design.

## Open questions

- Manifest format: a project manifest file vs a journal-index job vs both.
- `block_implementation`: always on for greenfield, or a user preference?
- Dreamer agent: separate pass vs inline injection.
- Next scene: user accepts the bootstrap nudge vs overrides to implement; when is validation
  "enough" to derive architecture?

## Constraints already decided

- [[domains/core/decisions#^D011]] — context is rebuilt from the event log, so an injected
  bootstrap block must be an event to survive replay.

## History

- 2026-09-22 migrated from the archive
