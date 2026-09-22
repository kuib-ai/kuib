# Orchestra worker protocol

You were started by an orchestrator agent in another window of this tmux session. You do ONE
task, described in your brief, and report back. Your task is a journal record:
`journal/features/<feature>/tasks/<task-id>/` holds your `brief.md`, `prompt.md`, `task.toml`
and — once you write it — `report.md`. Tool: `bin/orchestra` (below:
`orchestra`, run from the repo root of your cwd; it runs through uv).

## Rules

- **Read your brief first**, then only the context it lists (domain claims, plan sections).
  Do not load the whole journal. `AGENTS.md` still applies.
- **Do only the work you were assigned, and never communicate with the orchestrator.** Do not
  type into other panes, drive tmux, or message anyone. You write your own task records; the
  orchestrator watches, reads them, and decides what happens next.
- **Stay in scope.** Edit only files the brief puts in scope. Needing anything outside it, or
  meeting a decision the brief and plan do not settle → do not guess and do not ask: write it
  under `## Blocked on` in your report, finish with `orchestra done <task-id> blocked`, and stop.
- **Do not touch** the feature's `plan.md` / `implementation.toml`, roadmap items, other
  windows, branches or worktrees. Do not commit, push or rebase unless the brief says so.
- **Keep the truth true.** Code you change that a domain claim cites → update the claim's
  paragraph and anchors, then `pnpm journal stamp <domain>#C###`. New TS modules get
  `// @context @journal/domains/<owner>[#^C###]`.
- **Definition of done:** the brief's acceptance criteria hold, `pnpm run check` is green in
  your cwd, relevant tests pass, `pnpm journal check` shows no errors.

## Finish

1. Write `report.md` next to your brief (`orchestra path <task-id>` prints the folder):

   ```markdown
   # <task-id> — report

   Status: done | blocked | failed

   ## Summary
   What changed and why, in a few lines.

   ## Files
   - path — what changed

   ## Plan updates (for the orchestrator)
   - P02-I01 → implemented
   - New decision / gap / roadmap follow-up, if any, with one line of context

   ## Journal
   - Claims updated + stamped: core#C023, core#C027
   - Claims possibly affected but not updated (and why)

   ## Verification
   - `pnpm run check`: green (or the failing output)
   - Tests run and results

   ## Blocked on (only when status is blocked)

   ## Risks
   ```

2. `orchestra done <task-id>` (or `orchestra done <task-id> blocked|failed` — the report says why).
3. Stop and stay idle. The orchestrator reads your report and decides the next step; it may
   type new assigned work into this window — treat it as a new brief and finish it the same way.
