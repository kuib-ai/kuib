---
id: R217
title: Grow the agent tool set — write, exec, search, subagent and think tools
state: idea
horizon: later
domains: [core]
depends-on: ["[[roadmap/items/R204-tool-approval-gate]]", "[[roadmap/items/R205-risk-scoring-and-security-profiles]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Reasoning is content, not a tool call (2026-07-01)]]", "[[_archive/protocol-design/decisions#Tool Call Kind — Normal vs Subagent]]", "[[_archive/protocol-design/decisions#Open Questions]]", "[[_archive/protocol-design/plan#Phase 4: Tools]]", "[[_archive/protocol-design/progress#Remaining]]", "[[_archive/tool-system/decisions#Open / follow-ups]]"]
touched: 2026-09-22
---

# R217 — Grow the agent tool set — write, exec, search, subagent and think tools

## Idea

The agent has `readFile` and `readDir`. Next tools, each one file in `@kuib-ai/tools`:

- **`writeFile` / `executeCommand`** — the daemon primitives already exist as intentional
  dormant procedures; exposing them is one tool file each, once approvals exist.
- **Search** (grep/glob-style) over the daemon's fs.
- **Subagent tools** — a tool that internally calls an LLM; its completed/error states use the
  existing `kind: subagent` variants carrying `ModelRef` + `TokenUsage` (errored subagents still
  consumed tokens). Streams via `ToolCallOutputDelta` (R203).
- **Think tool** — giving a *non*-reasoning model a `think` tool; additive, coexists with
  native `REASONING_DELTA`, never replaces it.
- A genuinely new capability (network, new fs op) adds a `FileSystemPort` / daemon method; a tool
  that composes existing primitives needs zero daemon changes.

## Why

A read-only agent cannot do coding work.

## Open questions

- Should `ToolSpec` input schemas be exposed as JSON Schema (`z.toJSONSchema()`) rather than
  `Record<string, unknown>` for mesh transport and plugin tools?

## Constraints already decided

- Tools defined once; protocol/tools/daemon/engine each hold one role —
  [[domains/core/decisions#^D012]].
- Write and exec stay daemon-only until gated — [[domains/core/decisions#^D013]].
- Reasoning is content, not a tool call — [[domains/core/decisions#^D006]].
- Subagent kind carries model and tokens — [[domains/core/decisions#^D008]].

## History

- 2026-09-22 migrated from the archive
