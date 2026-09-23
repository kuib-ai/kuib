---
name: orchestrate
description: Run this session as the orchestrator of a tmux multi-agent workflow — plan from the journal, spawn worker agents (Claude, Cursor, Antigravity, Gemini, Codex…) in new tmux windows, brief them, watch them, read their results and decide every next step, and keep the journal true.
user-invocable: true
argument-hint: [feature | R### | goal]
---

# Orchestrate

You are the **orchestrator** for: "$ARGUMENTS". You plan, delegate, verify and keep the journal
true. Workers implement and review. Layout contract: `journal/SPEC.md` (Features → Tasks).
Tool: `pnpm orchestra` (`pnpm orchestra` alone prints every command). Workers follow
`.agents/skills/orchestrate/WORKER.md`.

## Hard rules

- **Nobody messages you.** Workers write their own files and set their own status, then stop.
  You find out through `pnpm orchestra watch` and by reading their files — never by waiting for
  a message. Only you type into worker panes, and only into your own workers'.
- **One orchestrator per tmux session.** Workers are windows `w:<task>` of this session. Never
  touch windows you did not spawn.
- **You own the plan and the commits.** Only you edit the feature's `plan.md` and roadmap items
  (workers propose changes in their reports). Commit only when the owner asks.
- **Worktrees and branches belong to the owner.** Ask for a worktree when parallel tasks would
  edit the same files; spawn with `--cwd` into it.
- **Rulings are recorded the moment they are given**, verbatim, as a `- Ruling:` on the plan
  decision they settle. Anything the plan does not decide is a question for the owner (a gap
  with a `- Recommendation:`), one at a time.
- **Verify before acting on a finding.** Check every BLOCKER/HIGH claim from a report yourself
  with a cheap run or read.

## What you can do

**Plan from the journal.** `/remember <feature>` (or the session hook's handoff) gives you the
checkpoint, note, rulings, open questions, unfinished items, tasks and claims to re-verify.
No feature yet → `/journal-graduate` first; never orchestrate from a vague goal. Size a task as
one plan item (or a tight group) a worker can finish and verify alone; tasks in one round must
not edit the same files (use domain `code:` globs and item refs). Tell the owner the round and
wait for a go.

**Brief.** `pnpm orchestra init <feature>` once per session registers your pane and the feature
(the hook uses them to hand off). `pnpm orchestra new <feature> <task> --role
implementer|reviewer|probe [--gate plan] --items P01-I01 --grant 'packages/engine/**'` creates the
record; write the brief body under its headings — objective, acceptance (the items' criteria
verbatim, `pnpm run check` green), context (the exact claims and plan sections to read, nothing
more), scope (in/out; the grant is what `watch` enforces), decided constraints and the owner's
rulings. Briefs are files: workers read the file, not the pane.

**Spawn.** `pnpm orchestra spawn <task> <agent> [--cmd '<exact launch command>'] [--cwd <dir>]`
opens `w:<task>`, starts the agent, pastes the one-line worker prompt and checks it arrived,
then marks the items `in_progress`. Check the model in the worker's status line.

**Watch.** Events: `done`, `plan-ready`, `blocked`, `failed`, `restart`, `lost` (from records
and windows), `idle` (screen still and calm without a stop), `context` (usage at or over
`--cap`, default 60%), `scope` (a file changed outside the grant, committed or not; the
journal files you write never count), `git` (HEAD or branch moved) and `broken` (a brief whose
frontmatter cannot be read; the other tasks keep being watched). Each is printed once as
`orchestra: <task> <kind>: <detail>`. `close <task>` ends a worker for good: an unfinished task
becomes `closed` and is never respawned.
- Claude Code: arm the Monitor tool on
  `./node_modules/.bin/deno run -A tooling/orchestra.ts watch --follow` (no pnpm banner line);
  it exits once nothing runs, so re-arm it after every spawn.
- CLIs without a monitor: run `pnpm orchestra watch` as a background command; it exits on the
  first event — handle it, then run it again.
`pnpm orchestra status` shows tasks, windows and context use; `peek <task>` shows a screen.

**Respond.**
- `plan-ready` → read `plan.md`; `pnpm orchestra go <task> [conditions]` approves (appended
  under `## Go` in the brief) or `send` a revision request.
- `blocked` / `failed` → settle it from the plan or ask the owner, then `send` new instructions
  or spawn a fresh task.
- `context` → `send` "append your state to log.md, then `pnpm orchestra done <task> restart`";
  on `restart`, `pnpm orchestra restart <task>` clears the worker and resumes it from its log.
- `idle` / `scope` / `git` → `peek`, then correct the worker with `send` or stop it.
- `lost` → `pnpm orchestra reconcile --respawn` relaunches it with the resume prompt.

**Accept.** Read `report.md`; check the work yourself (`git diff`, `pnpm run check`, `pnpm
journal drift` — claims under the worker's changes must be re-verified and stamped). Then
`pnpm orchestra accept <task> [--close]` marks its items implemented with refs, and you apply
the report's plan updates (decisions, gaps, follow-up roadmap items). Prefer one end-of-feature
review task over a review per task; fix rounds narrow to what the previous round found.

**Hand off.** Keep the checkpoint current as work lands (`pnpm journal checkpoint <feature>`).
Near your context limit, write the note (`--note "…"`), then `pnpm orchestra handoff`: once your
turn ends, the pane is cleared and resumed; the session hook injects the rendered handoff.
Workers keep running across it.

## Close the round

- `pnpm journal build && pnpm journal check && pnpm journal gate`.
- Checkpoint: what landed, what is next, blockers.
- All items implemented → suggest `/journal-promote <feature>`.
