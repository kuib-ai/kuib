---
id: R205
title: Operation × target risk scoring with per-device security profiles
state: shaped
horizon: later
domains: [core, infra]
depends-on: ["[[roadmap/items/R213-mesh-protocol-fields]]"]
converges-with: ["[[roadmap/items/R403-command-risk-approval-flow]]", "[[roadmap/items/R404-per-device-security-profiles]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Per-Device Security Profiles (2026-04-25)]]", "[[_archive/protocol-design/decisions#Security: Operation x Target Risk Matrix]]", "[[_archive/protocol-design/decisions#Module Structure]]", "[[_archive/protocol-design/progress#Mesh decisions affecting the rebuild (2026-04-25)]]", "[[_archive/tool-system/decisions#The model — single source of truth, three roles]]", "[[_archive/tool-system/decisions#Open / follow-ups]]", "[[_archive/tool-system/progress#2026-07-01 — initial build (readFile)]]"]
touched: 2026-09-22
---

# R205 — Operation × target risk scoring with per-device security profiles

## Idea

A `security` protocol module producing the `SecurityVerdict` the approval gate (R204) needs.

- **Decomposition:** a command is decomposed into `CommandEffect[]`, each effect an
  `operation × target` pair (operation/target enums, score matrices). Risk = max across effects.
- **Per-device profiles:** `SecurityProfile` is per device, not per session:
  `risk = commandRisk × deviceProfile[targetDevice]` — the same `rm -rf node_modules` has a
  different blast radius on a laptop, a Mac mini and a production server.
- **Tiers:** three verdict tiers from configurable thresholds per profile; three built-in
  profiles `development`, `production`, `readonly`.
- **Risk rides the `ToolSpec`:** the single place tools are declared is also where their risk
  is declared (a `risk` field on `defineTool`), plus **remote-origin elevation** (a call
  originating from, or targeting, a remote device scores higher).
- An earlier `security.ts` existed (Operation/Target enums, score matrices, CommandEffect,
  RiskAssessment, SecurityVerdict, SecurityProfile, ApprovalState, 3 profiles) and was deleted
  in the protocol rebuild; it is the starting sketch.

## Why

Approvals without scoring either prompt for everything or nothing; device-aware scoring is what
makes mesh tool dispatch safe.

## Open questions

- How shell commands are parsed into effects (static parse vs model-assisted).
- Where device profiles are configured and how they sync across the mesh.

## Constraints already decided

- `[security] profile` (`development | production | readonly`) already exists in the root config
  schema — [[domains/infra/current#^C016]], [[domains/infra/decisions#^D013]].
- Tools are defined once in `@kuib-ai/tools` — [[domains/core/decisions#^D012]].

## History

- 2026-09-22 migrated from the archive
