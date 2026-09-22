# Orchestra worker protocol

You were started by an orchestrator in another window of this tmux session. You do ONE task,
described in your brief, and stop. Your task is a journal record:
`journal/features/<feature>/tasks/<task>/` holds your `brief.md` (state in its frontmatter,
the task below it) and — as you write them — `plan.md`, `log.md` and `report.md`. Tool:
`pnpm orchestra`, run from the repository your prompt names (`ORCHESTRA_ROOT` is set in your
window).

## Rules

- **Read your brief first**, then only the context it lists. `AGENTS.md` still applies.
- **Do only the assigned work, and never communicate with the orchestrator.** Do not type into
  other panes, drive tmux or message anyone. You write your own files and set your own status;
  the orchestrator watches and decides what happens next.
- **Stay inside the grant** (`grant:` in the brief's frontmatter): changing anything else, or
  meeting a decision the brief and plan do not settle → do not guess and do not ask: write it
  under `## Blocked on` in `report.md`, run `pnpm orchestra done <task> blocked`, and stop.
- **Do not touch** the feature's `plan.md`, roadmap items, other tasks, branches or worktrees.
  No git writes (commit, rebase, checkout) unless the brief says so. No sub-agents unless the
  brief allows them.
- **Keep the truth true.** Code you change under a `@claim` link → reread that claim, rewrite
  it if it no longer holds, then `pnpm journal stamp <domain>/<claim>`. New modules start with
  `// @claim <domain>[/<claim>]`. No prose comments.
- **Log as you go.** After every meaningful move, append to `log.md`: what changed (paths), what
  was verified, what is next. It is your resume point after a restart or a lost window.

## Plan gate (`gate: plan`)

Write `plan.md` — the changes by path, the order of moves, how each is verified, anything the
brief leaves undecided — then `pnpm orchestra done <task> plan-ready` and stop. Change no file
before the orchestrator sends GO; its conditions are appended under `## Go` in your brief.

## Context limit

When the orchestrator asks, or you notice your context is nearly full: append your full state
to `log.md` (done, in progress, next, findings you must not lose), run
`pnpm orchestra done <task> restart`, and stop. You will be cleared and resumed from the log.

## Finish

1. Write `report.md` next to your brief (`pnpm orchestra path <task>` prints the folder):

   ```markdown
   # <task> — report

   Status: done | blocked | failed

   ## Summary
   What changed and why, in a few lines.

   ## Files
   - path — what changed

   ## Plan updates (for the orchestrator)
   - P02-I01 → implemented
   - New decision / gap / roadmap follow-up, with one line of context

   ## Journal
   - Claims rewritten and stamped: core/agent-turn
   - Claims possibly affected but not updated (and why)

   ## Verification
   - `pnpm run check`: green (or the failing output)
   - Tests run and results

   ## Findings (reviews)
   - id · severity · path:line · what is wrong · how it fails · suggested fix

   ## Blocked on (only when blocked)
   ```

2. `pnpm orchestra done <task>` (or `… blocked` / `… failed` — the report says why).
3. Stop and stay idle. The orchestrator may type new assigned work into this window — treat it
   as a new brief and finish it the same way.
