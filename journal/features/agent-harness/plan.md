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
  - "[[domains/infra/current#^agent-sources]]"
  - "[[domains/infra/current#^session-hook]]"
  - "[[domains/infra/current#^agents-check]]"
  - "[[domains/infra/current#^orchestra]]"
  - "[[domains/infra/current#^orchestra-watch]]"
  - "[[domains/infra/current#^handoff]]"
  - "[[domains/infra/current#^workspace-tools]]"
checkpoint:
  summary: "v2 landed (P03): the tooling package (tooling/, @kuib-ai/tooling) holds journal, agents and the TypeScript orchestra (plan gate, restart, accept, watch events with an orchestra: prefix, orchestrator handoff), all parsing arguments with @kuib-ai/cli; role-aware session brief; agents sync lock with MCP import and hand-edit refusal. Orchestra verified only with a fake agent in an isolated tmux server (G004). Next: a first live round (P03-I05)."
  next: ["P03-I05"]
  blockers: []
  note: ""
---

# Plan — agent-harness

## Objective

Claude Code, Cursor, Gemini CLI and Antigravity read the same instructions, skills, session
context and MCP servers, all derived from `AGENTS.md` and `.agents/`, with `pnpm run check`
failing on drift. An orchestrator agent in a tmux session spawns worker agents (any CLI) in new
windows, briefs them from the journal, learns what they did by watching their records, screens
and repositories (workers never message it), decides every next step, and keeps the journal true.

## Non-goals

- Codex-specific adapters (it reads `AGENTS.md` and `.agents/skills` natively).
- Creating or managing git worktrees — the owner does that with `tm`.
- Tool-specific workarounds for missing features (Antigravity session hooks, Gemini
  compaction re-injection).

## Principles

- Edit only sources; adapters are generated.
- Task records are journal files committed with the work; runtime (panes, baselines, watch state)
  never enters git.

## P01 — Single source

### P01-I01 — Rules merged into `AGENTS.md`

- Acceptance: `AGENTS.md` holds orientation and every workflow rule; `CLAUDE.md` imports it;
  no other instruction files except the generated Antigravity pointer rule.
- State: implemented
- Refs:
  - `AGENTS.md` — single instruction source
  - `CLAUDE.md` — imports AGENTS.md

### P01-I02 — `scripts/agents.ts` sync/check

- Acceptance: `pnpm agents sync` writes all adapters; `pnpm agents check` runs in
  `pnpm run check` and fails on stale, missing or retired files and bad skill frontmatter.
- State: implemented
- Decisions: D001
- Refs:
  - `tooling/agents.ts` — adapter generator + check
  - `.gemini/settings.json` — generated Gemini adapter
  - `.agents/rules/agents.md` — generated Antigravity rule

### P01-I03 — Shared session hook

- Acceptance: Claude, Gemini and Cursor run `.agents/hooks/journal-context` and receive the
  journal brief; Claude re-receives it after compaction; no duplicate run under Cursor.
- State: implemented
- Addresses: G002
- Refs:
  - `.agents/hooks/journal-context` — shared session hook

## P02 — Orchestration

### P02-I01 — `orchestra` tool

- Acceptance: the orchestra tool creates, spawns, drives, watches and reconciles tasks
  recorded under `journal/features/<feature>/tasks/`; a live round completes.
- State: implemented
- Decisions: D002, D003
- Refs:
  - `tooling/orchestra.ts` — tmux coordination tool

### P02-I02 — `orchestrate` skill and worker protocol

- Acceptance: `SKILL.md` covers journal-driven planning, briefing, monitoring and
  integration; `WORKER.md` covers scope, claims, reporting and how a worker stops.
- State: implemented
- Addresses: G001
- Refs:
  - `.agents/skills/orchestrate/SKILL.md` — orchestrator skill
  - `.agents/skills/orchestrate/WORKER.md` — worker protocol

## P03 — Orchestra v2

### P03-I01 — Orchestra in TypeScript in the tooling package

- Acceptance: `pnpm orchestra` replaces the Python `bin/orchestra` with the same commands; task
  state lives in `brief.md` frontmatter; the tools live in the `@kuib-ai/tooling` package and
  parse arguments with `@kuib-ai/cli`; no Python remains in the workspace tooling.
- State: implemented
- Decisions: D004, D005
- Refs:
  - `tooling/orchestra.ts` — the tool
  - `package.json` — `pnpm orchestra`

### P03-I02 — Plan gate, restart, accept and watch events

- Acceptance: `--gate plan` stops a worker at `plan-ready` until `go`; `restart` clears a worker
  and resumes it from `log.md`; `accept` marks plan items implemented with refs; `watch`
  reports record, idle, context, scope and git events once each with an `orchestra:` prefix.
- State: implemented
- Decisions: D004
- Refs:
  - `tooling/orchestra.ts` — cmdGo, cmdRestart, cmdAccept, cmdWatch

### P03-I03 — Orchestrator handoff and role-aware session brief

- Acceptance: `orchestra handoff` clears the orchestrator pane after its turn and resumes it; the
  session hook injects the rendered handoff in the orchestrator pane and the task pointer in a
  worker window.
- State: implemented
- Refs:
  - `tooling/journal.ts` — sessionRole, renderHandoff
  - `.agents/hooks/journal-context` — shared session hook

### P03-I04 — Sync imports MCP edits and refuses hand edits

- Acceptance: `agents sync` keeps `.agents/generated.lock.json`, imports MCP servers a tool
  added, refuses other hand edits without `--force`; `agents check` reports edits outside sync.
- State: implemented
- Decisions: D006
- Refs:
  - `tooling/agents.ts` — sync and check
  - `.agents/generated.lock.json` — hashes of generated files

### P03-I05 — First live round on v2

- Acceptance: one small orchestrated round with a real agent CLI (spawn, plan gate, watch,
  accept, handoff) completes and its findings land as gaps or fixes.
- State: planned
- Addresses: G004

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

- Status: superseded
- Context: Most agent CLIs cannot wait on background events; an idle orchestrator must be
  woken without polling.
- Options considered: polling status files; `tmux wait-for`; send-keys into the orchestrator.
- Decision: workers' `ask`/`done` type a one-line `[orchestra]` notice into the orchestrator's
  pane; `orchestra wait` exists for CLIs that can block in the background.
- Consequences: a notice can interleave with the owner typing in that pane.
- Supersedes: —
- Superseded by: D004

### D003 — Tasks as journal records, tool in Python

- Status: superseded
- Context: The first version kept task state in the git common dir and was a bash script; the
  owner orchestrates inside one worktree and wants briefs, prompts and reports tracked in the
  journal, with a tool that can be changed and re-armed from its current state.
- Options considered: git common dir; git-ignored `.orchestra/`; journal task folders.
- Decision: task folders inside the owning feature; runtime from tmux; `bin/orchestra` as a uv
  script with re-runnable `watch` and `reconcile` (infra D026).
- Consequences: every orchestrated task needs a feature; records merge with the branch.
- Supersedes: —
- Superseded by: D005

### D004 — Workers never message the orchestrator; it finds out by watching

- Status: accepted
- Ruling: "no one should communicate with the orchestrator -- the orchestrator finds out what the child agents have done … otherwise things get fucked up real fast"; "They must only do the work that the orchestrator assigns to them — not send messages back." (owner, 2026-09-22, recorded in research/continuation-2026-09-22-a.md)
- Context: Worker notices typed into the orchestrator pane (D002) interleaved with the owner and made the orchestrator reactive to its workers.
- Options considered: notices into the orchestrator pane; a question channel; stops recorded in the task plus a watcher.
- Decision: a worker only sets its own status (`done`, `blocked`, `failed`, `plan-ready`, `restart`) and stops; `orchestra watch` reports those and what it sees on screens and in repositories. The orchestrator types into worker panes (`go`, `send`, `restart`), never the reverse.
- Consequences: anything a worker would ask becomes a `blocked` stop with `## Blocked on`.
- Supersedes: D002
- Superseded by: —

### D005 — One language and one package for workspace tooling

- Status: accepted
- Ruling: "maybe use node for everything please? so that we only deal with teh deno binary present in our workspace -- only for runtime though"; "why are we hand writing them? ... maybe even use our own cli parser that we have? @packages/cli"; "please don't add the dependency at root -- that is messy and unstructured"; "make a tooling folder and create it there, keep a folder with a package.json for resolution, for others, keep them as single handed scripts"; "i meant an or, not a nesting — scripts or tooling" (owner, 2026-09-22)
- Context: The orchestra was a Python uv script next to TypeScript tools run by the workspace Deno; the tools parsed arguments by hand and their dependencies sat in the root manifest.
- Options considered: keep Python; port to TypeScript in `scripts/` with root dependencies; a private workspace package for the tools.
- Decision: `tooling/` is the private workspace package `@kuib-ai/tooling` holding `journal.ts`, `agents.ts` and `orchestra.ts` as single-file scripts run by the workspace Deno (`pnpm journal|agents|orchestra`). It declares their dependencies, parses arguments with `@kuib-ai/cli`, and is type-checked by tsgo and linted through Nx. One-off scripts stay single files in `scripts/`. Task records stay journal files, as D003 decided.
- Consequences: infra D030. One runtime, one type-checker, one style for all workspace tools; the root manifest keeps only workspace-wide tools.
- Supersedes: D003
- Superseded by: —

### D006 — Sync keeps a lock of what it generated

- Status: accepted
- Context: One-way sync silently dropped MCP servers added through a tool and any hand edit.
- Options considered: document "edit only sources"; import MCP edits and refuse other hand edits.
- Decision: `.agents/generated.lock.json` records the hash of every generated file; edited MCP files are imported, other edits are refused unless `--force` (infra D029).
- Consequences: the lock is committed.
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

### G004 — v2 orchestra only verified with a fake agent

- Status: open
- Recommendation: run P03-I05 with one small real task before relying on the plan gate, context events and handoff.
- Context: Every command and event was exercised in an isolated tmux server with a scripted agent. Real TUIs (Claude Code, Cursor, Gemini, Codex) may show trust dialogs, other status line formats or paste placeholders that the delivery check and the context parser do not recognise.
