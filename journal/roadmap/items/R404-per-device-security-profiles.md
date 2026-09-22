---
id: R404
title: Per-device security profiles and approval thresholds
state: shaped
horizon: later
domains: [core, infra]
depends-on: ["[[roadmap/items/R403-command-risk-approval-flow]]"]
converges-with: ["[[roadmap/items/R205-risk-scoring-and-security-profiles]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/security-model/decisions#Security Profiles — Per-Device (User-Configurable)]]", "[[_archive/security-model/decisions#Open Questions]]"]
touched: 2026-09-22
---

# R404 — Per-device security profiles and approval thresholds

## Idea

User-defined profiles set the auto-approve / ask / block thresholds of the risk model
([[roadmap/items/R403-command-risk-approval-flow]]):

- **development** — liberal: auto-approves local writes, asks for network and deletes.
- **production** — restrictive: only auto-approves reads, blocks privilege escalation.
- **readonly** — nothing writes.

**The profile is per device, not per session** (decided 2026-04-25). The same command
(`rm -rf node_modules`) has a different blast radius on a laptop, a Mac mini and a production
server. The agent picks the target device; the gate evaluates against that device's profile:

```
risk = commandRisk × deviceProfile[targetDevice]
```

Devices register their profiles in the peer registry (the node descriptors). Sessions are
replicated and resumable anywhere (this supersedes the 2026-04-25 "sessions stay on the home
device" stance): the engine runs on the elected leader, tool calls target a daemon (the active
device or an explicitly named one), risk is evaluated against that daemon's profile, and path
resolution happens at the tool boundary against the target device's filesystem.

## Why

A single global threshold is either too loose for a server or too strict for a dev laptop.

## Open questions

- Overlaps [[roadmap/items/R205-risk-scoring-and-security-profiles]]; candidate for absorption into it.
- How profiles compose with per-command overrides and allowlists.
- Where a device's profile lives in the descriptor (capabilities? a dedicated field?).

## Constraints already decided

- The config already carries `[security] profile` (`development | production | readonly`, default `development`), unused by any gate: [[domains/infra/current#^config-schema]].
- `NodeDescriptor` shape: [[domains/core/current#^endpoints]].

## History

- 2026-09-22 migrated from the archive
