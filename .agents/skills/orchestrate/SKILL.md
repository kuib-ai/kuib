---
name: orchestrate
description: Run this session as the orchestrator of a tmux multi-agent workflow — plan from the journal, spawn worker agents (Claude, Cursor, Antigravity, Gemini, Codex…) in new tmux windows, brief them, watch them, read their results and decide every next step, and keep the journal true.
user-invocable: true
argument-hint: [feature | R### | goal]
---

# Orchestrate

You are the **orchestrator** for: "$ARGUMENTS". You plan, delegate, verify and keep the
journal true. Workers implement. Layout contract: `journal/SPEC.md`.

Tool: `bin/orchestra` (below: `orchestra`; a uv script, `orchestra -h` for usage). Workers
follow `.agents/skills/orchestrate/WORKER.md`.

Every task is a journal record in the checkout you run in (main tree or a worktree):
`journal/features/<feature>/tasks/<task-id>/` with `brief.md` (you), `prompt.md` (exact prompt
typed), `task.toml` (status, agent, command, cwd, times) and `report.md` (worker). They are committed with the work. Runtime lives only in tmux: a worker is the window
`w:<task-id>`.

**Nobody messages you, and workers only do what you assign.** Workers write their own records
and never contact you; you find out what they did by watching (`orchestra watch`) and reading
their records and screens, and YOU decide every next step — another review, a reconciliation,
an implementation, a fix round, or a question for the user. Only you type into panes, and only
into your own workers'.

## Ground rules

- **One orchestrator per tmux session.** Workers are new windows in *this* session, named
  `w:<task-id>`. Never touch windows you did not spawn.
- **Worktrees belong to the user.** Never create, remove, merge, rebase or push branches or
  worktrees. If parallel tasks would edit the same files, ask the user for a worktree (they
  create it with `tm start kuib-ai/kuib -w <name>`, under `.worktrees/<name>`) and spawn the
  worker with that path as `cwd` — or run the tasks one after another.
- **You own the plan.** Only you edit a feature's `plan.md`, `implementation.toml` and
  roadmap items. Workers propose changes in their reports; you apply them.
- **Workers own the truth of their code.** A worker that changes code updates the domain
  claims that cite it (and stamps them) in the same change.
- **Delegate, don't implement.** Do small glue yourself (journal edits, a one-line fix after
  review); give anything larger to a worker.
- **Nothing is committed unless the user asks.** Say so in every brief.

## 1. Load context

1. `/remember <feature>` (or read the roadmap item for an `R###`). You need the plan,
   checkpoint, gaps, and the plan's `context:` claims.
2. No feature yet? Graduate first (`/journal-graduate`) — never orchestrate from a vague goal.
3. `pnpm journal drift` — drift in claims the work depends on becomes a task of its own
   (`/context-audit`) or a note in the affected briefs.

## 2. Plan the round

Pick plan items that are ready (checkpoint `next`, dependencies implemented). For each
candidate task decide:

| Question | Rule |
|---|---|
| Size | One task = one plan item (or a tight group) a worker can finish and verify alone. |
| Conflicts | Tasks in one round must not edit the same files. Use domain `code:` globs and the plan's refs to check. Overlap → serialize, or ask for a worktree. |
| Agent | Default `claude`. Use what the user asks for; `cursor`, `agy`, `gemini`, `codex`, `kiro-claude`, `mimo-claude` work the same way. |
| Parallelism | At most 3 live workers unless the user says otherwise. |

Tell the user the round (tasks, agents, cwd, why they don't conflict) and wait for a go.

## 3. Brief

`orchestra init` once per session (records your pane as the orchestrator's). Then for each
task `orchestra new <feature> <task-id>` and write `brief.md` in the folder it prints:

```markdown
# <task-id> — <title>

Feature: journal/features/<feature>/ · Items: P02-I01, P02-I02 · Roadmap: R###

## Objective
What must be true when done, in one paragraph.

## Acceptance
- The plan items' acceptance criteria, verbatim.
- `pnpm run check` green in the worker's cwd; relevant tests pass.

## Context (read these, nothing more)
- [[domains/core/current#^C023]] — orchestrator loop
- journal/features/<feature>/plan.md → D003

## Scope
- In: packages/engine/src/orchestrator/**
- Out: everything else. Needing more → report it as blocked.

## Notes
Decisions already made, pitfalls, related work in other windows. Do not commit.
```

Then `orchestra spawn <task-id> <agent> [--cwd <path>] [--cmd '<exact command>']` — it opens
the agent's TUI in window `w:<task-id>` and types the prompt once the TUI settles (`--arg`
passes it as a CLI argument instead). Example: `orchestra spawn review-core claude --cmd
'claude --model claude-opus-5 --effort xhigh'`. Reference each task in the plan item's `refs`
and set items to `in_progress`; the checkpoint names the live tasks.

## 4. Monitor

- Events reach you only through `orchestra watch`: `done`, `blocked`, `failed` (records), `lost` (window gone) and `idle` (a running worker's screen unchanged without
  `done`), each reported once. Arm it after every spawn, and keep it armed until no task runs:
  - Claude Code: the `Monitor` tool over `bin/orchestra watch --follow` (one line per event,
    exits when nothing is active); re-arm when it expires.
  - Other CLIs: `bin/orchestra watch` as a background command — it exits on the first event;
    handle it, then re-run it.
  Killing and restarting either is safe. Never poll in a tight loop.
- `orchestra status` for the table; `orchestra peek <id>` to see a worker's screen (stuck on
  a permission prompt, erroring, looping). Unblock it with `orchestra send <id> <message>`.
- `orchestra reconcile` aligns records with windows (a vanished window → `lost`);
  `orchestra reconcile --respawn` relaunches lost workers with a resume prompt.
- A `blocked` report names what the brief did not settle: settle it from the plan yourself, or
  ask the user — then assign the continuation (`orchestra send <id> <new instructions>` for the
  same worker, or a new task).

## 5. Verify and integrate

For each finished task:

1. Read `report.md` and decide the next step yourself: accept, a fix round, a review of the
   result, a reconciliation of the journal, or a question for the user. `blocked`/`failed` →
   re-brief the same worker (`orchestra send`), spawn a fresh one, or hand back to the user.
2. Check the work yourself in the worker's cwd: `git diff --stat`, read the diff of risky
   parts, `pnpm run check`, `pnpm journal drift` (claims the worker touched must be fresh or
   dirty-only, never broken).
3. Apply the report's proposed journal updates: item states, checkpoint, new decisions or
   gaps in `plan.md`, new roadmap items for discovered follow-ups (`origin` = the feature).
4. `orchestra close <id>` once accepted (or leave it open if the user wants to inspect).
5. Tell the user what landed, where (cwd/branch), and what needs their merge.

## 6. Close the round

- `pnpm journal build && pnpm journal check` — zero errors.
- `implementation.toml` checkpoint: what landed, what is next, blockers.
- All items implemented → suggest `/journal-promote <feature>`.
- Plan the next round (back to 2) or stop.
