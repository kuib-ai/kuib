---
owner: roysupriyo10
lifecycle: implementing
summary: One source (AGENTS.md + .agents/) generates every agent tool's config, and a tool-agnostic tmux orchestra lets one orchestrator spawn and coordinate worker agents.
topics:
  - agents
  - tooling
  - tmux
  - orchestration
supersedes: []
superseded-by: []
roadmap: R004
context:
  - "[[domains/infra/current#^C026]]"
  - "[[domains/infra/current#^C027]]"
  - "[[domains/infra/current#^C030]]"
  - "[[domains/infra/current#^C031]]"
---

# Plan — agent-harness

## Objective

Claude Code, Cursor, Gemini CLI and Antigravity read the same instructions, skills, session
context and MCP servers, all derived from `AGENTS.md` and `.agents/`, with `pnpm run check`
failing on drift. An orchestrator agent in a tmux session spawns worker agents (any CLI) in new
windows, briefs them from the journal, receives their questions and reports, and keeps the
journal true.

## Non-goals

- Codex-specific adapters (it reads `AGENTS.md` and `.agents/skills` natively).
- Creating or managing git worktrees — the owner does that with `tm`.
- Tool-specific workarounds for missing features (Antigravity session hooks, Gemini
  compaction re-injection).

## Principles

- Edit only sources; adapters are generated.
- Orchestration state never enters git.

## P01 — Single source

### P01-I01 — Rules merged into `AGENTS.md`

- Acceptance: `AGENTS.md` holds orientation and every workflow rule; `CLAUDE.md` imports it;
  no other instruction files except the generated Antigravity pointer rule.

### P01-I02 — `scripts/agents.ts` sync/check

- Acceptance: `pnpm agents sync` writes all adapters; `pnpm agents check` runs in
  `pnpm run check` and fails on stale, missing or retired files and bad skill frontmatter.

### P01-I03 — Shared session hook

- Acceptance: Claude, Gemini and Cursor run `.agents/hooks/journal-context` and receive the
  journal brief; Claude re-receives it after compaction; no duplicate run under Cursor.

## P02 — Orchestration

### P02-I01 — `orchestra` tool

- Acceptance: `bin/orchestra` (uv script) creates, spawns, drives, watches and reconciles tasks
  recorded under `journal/features/<feature>/tasks/`; a live round completes.

### P02-I02 — `orchestrate` skill and worker protocol

- Acceptance: `SKILL.md` covers journal-driven planning, briefing, monitoring and
  integration; `WORKER.md` covers scope, claims, reporting and notification.

## Decisions

### D001 — Generate adapters instead of symlinking everything

- Status: accepted
- Context: Tools differ in format (hooks JSON shapes, MCP remote keys, rule frontmatter), so
  symlinks alone cannot unify them, and symlink support is unverified for several tools.
- Options considered: symlinks only; hand-maintained copies; a generator with a check.
- Decision: `scripts/agents.ts` generates adapters; the one symlink kept is `.claude/skills`,
  which Claude Code is observed to follow.
- Consequences: drift is caught by `pnpm run check`.
- Supersedes: —
- Superseded by: —

### D002 — Notify the orchestrator by typing into its pane

- Status: accepted
- Context: Most agent CLIs cannot wait on background events; an idle orchestrator must be
  woken without polling.
- Options considered: polling status files; `tmux wait-for`; send-keys into the orchestrator.
- Decision: workers' `ask`/`done` type a one-line `[orchestra]` notice into the orchestrator's
  pane; `orchestra wait` exists for CLIs that can block in the background.
- Consequences: a notice can interleave with the owner typing in that pane.
- Supersedes: —
- Superseded by: —

### D003 — Tasks as journal records, tool in Python

- Status: accepted
- Context: The first version kept task state in the git common dir and was a bash script; the
  owner orchestrates inside one worktree and wants briefs, prompts and reports tracked in the
  journal, with a tool that can be changed and re-armed from its current state.
- Options considered: git common dir; git-ignored `.orchestra/`; journal task folders.
- Decision: task folders inside the owning feature; runtime from tmux; `bin/orchestra` as a uv
  script with re-runnable `watch` and `reconcile` (infra D026).
- Consequences: every orchestrated task needs a feature; records merge with the branch.
- Supersedes: —
- Superseded by: —

## Gaps

### G001 — Unverified tool behaviour

- Status: open
- Context: Antigravity's always-on rule frontmatter (`trigger`), whether `agy` reads
  `AGENTS.md` itself, `agy`/`cursor-agent` taking the prompt as a positional argument, and
  whether Cursor lists skills twice (it scans `.agents/skills` and `.claude/skills`) need a live
  check in each tool.

### G002 — Antigravity has no session-start hook

- Status: open
- Context: Only its always-on rule points agents at `AGENTS.md` and `/remember`; the journal
  brief is not injected automatically.

### G003 — Research subagent is Claude/Cursor-only

- Status: open
- Context: Subagent formats differ (`.gemini/agents`, `.agents/agents` with other tool names);
  the `Research` agent is not ported.
