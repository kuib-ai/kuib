# Continuation — 2026-09-22 (a)

Handoff from the session that built the context system, the agent harness and the first
orchestrated review round. Read this after `/remember agent-harness`, then act on "First five
minutes". Everything below is uncommitted work on `master` on top of `9374dfb`; `pnpm run check`
was green at handoff.

## What exists now (all uncommitted)

- **Journal, three layers** (`journal/SPEC.md` is the contract; feature `context-system`, R001):
  roadmap (`journal/roadmap/items/R###`, 70 items, generated `ROADMAP.md` with mermaid), four
  domains rebuilt from code (`journal/domains/{product,core,host,infra}/current.md` claims with
  `[!sources]` callouts + `decisions.md`), features, and `journal/_archive/` (25 legacy entries,
  311/311 sections mapped in per-entry `ledger.toml`). Tooling: `scripts/journal.ts`
  (`pnpm journal check|build|drift|stamp|brief`). Every TS module's first line is
  `// @context @journal/domains/<d>[#^C###]`, enforced by `house/require-context-link`.
- **Agent harness** (feature `agent-harness`, R004): `AGENTS.md` is the single instruction source;
  `.agents/` holds skills, MCP (`mcp_config.json`) and the shared hook
  (`.agents/hooks/journal-context`). `scripts/agents.ts` (`pnpm agents sync|check`) generates
  `CLAUDE.md` (`@AGENTS.md`), `.claude/settings.json` hooks, `.claude/skills` symlink,
  `.gemini/settings.json`, `.cursor/hooks.json`, `.mcp.json`, `.cursor/mcp.json`,
  `.agents/rules/agents.md` (Antigravity). `pnpm run check` runs agents check → journal check →
  Nx typecheck/lint/format.
- **Orchestration**: skill `.agents/skills/orchestrate/{SKILL.md,WORKER.md}`, tool
  `bin/orchestra` (PEP 723 uv script). Tasks are journal records
  `journal/features/<feature>/tasks/<id>/{brief.md,prompt.md,task.toml,report.md}`; runtime is
  read from tmux (worker window `w:<id>`). `spawn` starts the agent TUI and types the prompt;
  `watch` (background, exits on first event) / `watch --follow` (for the `Monitor` tool) finds
  events: `done|blocked|failed` (records), `lost` (window gone), `idle` (screen unchanged, no
  `done`); `reconcile [--respawn]`; `send` assigns follow-up work. Infra claims C026, C027, C030,
  C031; decisions D024, D026 (D025 superseded).
- **First orchestrated round** (feature `codebase-review`, R005): three Claude Code Opus 5 xhigh
  reviewers finished; reports at `journal/features/codebase-review/tasks/{review-tooling,
  review-core,review-rest}/report.md` (~17 / ~24 / ~40 findings, NOT yet triaged). Their windows
  `w:review-*` are still open in tmux session `kuib-ai/kuib/root`.

## Owner rulings this session (in his words where it matters)

- Workers never communicate with the orchestrator: "no one should communicate with the
  orchestrator -- the orchestrator finds out what the child agents have done … otherwise things
  get fucked up real fast". "They must only do the work that the orchestrator assigns to them —
  not send messages back." An ask requirement goes "through stop": the worker reports `blocked`
  with `## Blocked on` and stops. `orchestra ask` and the `question` status were removed.
- "The orchestrator must receive events when the review ends and whatnot" → `watch`.
- Briefs, prompts and review reports are tracked in the journal, not in `.git/`.
- Orchestration happens inside one worktree; worktrees are the owner's (`tm start … -w`,
  `.worktrees/` is git-ignored). Never create/remove/merge/push branches or worktrees.
- Use the agent TUI and type the prompt in ("use the TUI please and put in the prompts manually").
- No shell scripts for tooling: "make a proper python script that can be changed and re-armed
  based on the current status". All Python runs through `uv run` (rule in `AGENTS.md` and in the
  owner's global `~/.claude/CLAUDE.md`). uv is Homebrew's (`/opt/homebrew/bin/uv`).
- `bin/` is for helper scripts the owner runs by hand.
- The current figr-style process is "inefficient … we must make the proper version" (see below).
- Commit only when asked. Commit format `feat|fix|chore|docs: …`.

## Decisions still owed by the owner

1. `pnpm agents sync` is one-way and silently overwrites hand edits to generated files. Proposed
   (recommended option 2): import MCP servers back from `.mcp.json` / `.cursor/mcp.json` /
   `.gemini/settings.json` into `.agents/mcp_config.json`, and make `sync` refuse to overwrite any
   other hand edit (show diff, `--force` to override). Awaiting "build it".
2. Order of work: triage the review findings into fixes (`codebase-review` P02-I01) vs. design the
   "proper version" of orchestration (next phase of `agent-harness`).
3. Overlapping roadmap items from the parallel migration (`context-system` G004): R403/R404 with
   R204/R205, R406 with R303, R219 with R407, R105 with R214, etc. — linked `converges-with`,
   awaiting merge decisions.
4. Committing the whole session's work, then re-stamping all domains (every claim reads `dirty`
   until the sources are committed: `pnpm journal stamp <domain>` per domain after the commit).
5. Deleting `journal/_archive/` (ledger coverage is 100%).
6. `.claude/projects/-home-rs10-developer-kuib-ai/memory/*.md` show as deleted in the working tree
   (not by this session) — keep the deletion or restore.

## Known open problems

- `review-tooling` found `bin/orchestra` bugs (details in its report): a worker whose `--cwd` is
  another worktree cannot find its task folder; `watch <ids>` ignores the filter when deciding
  whether anything is still active (partly addressed); ids accepted that `journal check` rejects;
  the TUI readiness wait can type the prompt into Claude's "trust this folder?" dialog.
- Unverified tool behaviour (`agent-harness` G001): `agy`/`cursor-agent` prompt handling,
  Antigravity rule frontmatter, Cursor listing skills twice. Antigravity has no session hook (G002);
  the Research subagent is Claude/Cursor-only (G003).

## The "proper version" — reference process to learn from

The owner's mature (but inefficient) process lives on `rs10figr@thalia` in
`/Users/rs10figr/developer/figr-ai/journal/features/agent-platform-hardening/research/`
(read-only; reach it with `ssh rs10figr@thalia`). Start with `orchestrator-guide.md`, then
`monitors/{pane_watch.py,ctx_guard.sh,orch_handoff.sh}`, one `handoff-prompt-orchestrator-*`, one
`continuation-orchestrator-*`, one `build-record-*`, one `adversarial-review-*`, and `briefs/`.
What it has that `bin/orchestra` lacks:
- roles: implementer vs. separate reviewer per slice; slices cut to be wholly implementable and
  reviewable; plan-first gate (implementer writes a plan and STOPs; orchestrator approves);
- review rounds narrowing until one finds nothing; the orchestrator re-verifies every BLOCKER/HIGH
  finding itself before acting; rulings recorded in the owner's words the moment given;
- watching: per-agent context caps, drift detection (paths outside the brief's grant, git writes,
  sub-agents/forks, destructive commands), heartbeat snapshots, idle detection that ignores the
  orchestrator's own text in scrollback;
- build records the implementer appends to after every move; continuations per agent;
- orchestrator self-handoff near its context cap (continuation + handoff prompt + a detached
  guard that clears the pane and pastes the prompt), agents keep running across it;
- multi-line briefs pasted via `tmux load-buffer` / `paste-buffer -p`, not one-line prompts;
- lessons: panes keep little scrollback (everything goes to files), `/clear` + fresh brief per
  new slice, never Ctrl+C a worker (send STOP), check the model shows in the status line.
Design goal from the owner: the same discipline, but efficient and built into `bin/orchestra`
plus the journal, with no worker→orchestrator messaging.

## First five minutes

1. `/remember agent-harness`; read this file; `bin/orchestra status` and `pnpm journal drift`.
2. `bin/orchestra init` in your pane (the pane id changed if the session restarted).
3. Tell the owner the state in a few lines and ask decisions 1 and 2 above (one at a time, with a
   recommendation). Do not start building before he answers.
4. Leave the `w:review-*` windows alone unless the owner says to close them
   (`bin/orchestra close <id>`).
