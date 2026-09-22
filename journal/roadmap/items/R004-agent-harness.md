---
id: R004
title: Uniform agent harness and tmux orchestration
state: graduated
horizon: now
domains: [infra]
depends-on: ["[[roadmap/items/R001-context-system]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: "agent-harness"
origin: ["conversation 2026-09-22"]
touched: 2026-09-22
---

# R004 — Uniform agent harness and tmux orchestration

## Idea

Every agent tool (Claude Code, Cursor, Gemini CLI, Antigravity; Codex later) gets the same
instructions, skills, hooks and MCP from one source, and one orchestrator agent per tmux session
can spawn, brief, monitor and integrate worker agents of any CLI.

## History

- 2026-09-22 graduated to [[features/agent-harness/plan]]
