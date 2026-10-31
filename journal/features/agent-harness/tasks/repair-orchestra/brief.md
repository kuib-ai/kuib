---
status: "accepted"
role: "implementer"
gate: "plan"
items: ["P04-I01","P04-I02","P04-I03","P04-I04","P04-I05"]
grant: ["journal/features/agent-harness/tasks/repair-orchestra/**","tooling/orchestra.ts","tooling/orchestra.test.ts","tooling/package.json","tooling/tsconfig.json","packages/testing/src/resolve.test.permissions/**","journal/domains/infra/current.md","journal/_index.md"]
agent: "codex"
command: "choom -n 800 -- codex --dangerously-bypass-approvals-and-sandbox -m gpt-6-sol -c model_reasoning_effort=\"high\" -c service_tier=\"default\""
cwd: "/home/rs10/developer/kuib-ai/kuib"
session: "kuib-ai/kuib/root"
started: "2026-10-14T10:10:42"
finished: "2026-10-14T10:41:30"
reported: "accepted"
---
# repair-orchestra — five repairs to the orchestra tool

Feature: journal/features/agent-harness/ · Items: P04-I01 to P04-I05 · Roadmap: R004

## Objective

An investigation into last round's deviations
(`journal/features/agent-harness/research/deviations-review-2026-10-14.md`, section D and
"Changes") found defects in `tooling/orchestra.ts` that hid problems from the orchestrator, and
the owner asked for one feature: "add the functionality in the Pnpm Orchestra tooling to clear
yourself and paste the next prompt into your own context window and con resume from there".
Make the five changes of P04 in `journal/features/agent-harness/plan.md`.

## Acceptance

- P04-I01 to P04-I05 of the plan, as written there.
- Every new behaviour is proven by a test in `tooling/orchestra.test.ts`.
- `pnpm run check` is green.
- The report has its `Tests` and `Deviations from the approved plan` sections and ends with the
  names introduced and the sibling each mirrors.

## What is there today

Read before you plan; these are the places, not the whole file.

- `cmdAccept` sets each item implemented with `granted`, every changed path inside the grant,
  through `journalSet`. Last round that wrote 832 references onto one item and thousands onto
  others, which broke the journal check as soon as files moved.
- The baseline taken at spawn (`takeBaseline`, stored in the task's runtime file) and
  `changedSince` already know what a task changed; nothing shows it.
- `watch` blames each running task for files changed under another running task's grant, and
  after `restart` it reported every uncommitted file outside the grant once. The investigation
  says the "restart reset the baseline" explanation is contradicted by the code and suspects a
  path and hash pairing bug; it is not confirmed.
- `mcpArguments` puts `--strict-mcp-config --mcp-config '<json>'` before the prompt.
  `--mcp-config` takes several values, so the prompt was read as a second config file and the
  worker never started. A `--cmd` that ends with such an option fails the same way.
- `cmdHandoff` arms `_guard`, which waits for the orchestrator pane to settle, sends `/clear`
  and then always the same line: "Resume orchestrating <feature>: the session hook injected your
  handoff; continue from it."

## Plan gate

Change nothing before GO. Write `plan.md` next to this brief with:

- for each item, the change by function and how a test proves it;
- every new command, option and output line, written out literally, with the existing one it
  mirrors. These go to the owner before GO;
- for P04-I01, how titles are read from test files, how a title moved to another file counts as
  kept, and how a removal is accepted on purpose;
- for P04-I03, what you found the cause of the restart bursts to be, by reading and a test, or
  that you could not find one;
- for P04-I05, where the prompt is kept between arming and delivery, how a long multi-line
  prompt is pasted so that it arrives whole, and what happens if it is empty or the file is gone;
- which tests need to start `tmux` or `git`, and the smallest permission that allows it (a test
  spawn grant can now name the programs it allows; `@kuib-ai/tooling` has none today);
- anything undecided.

Then `pnpm orchestra done repair-orchestra plan-ready` and stop.

## Context

Read these, nothing more:

- AGENTS.md: the working rules, above all "Names are symmetric", "One home for each concern"
  and "Existing tests are proof".
- journal/features/agent-harness/plan.md: P03, P04, D005, D007.
- The deviations review, sections D and "Changes".
- `tooling/orchestra.ts`, the functions named above and what they call.
- In journal/domains/infra/current.md the claims `orchestra`, `orchestra-watch`, `handoff`,
  `workspace-tools`.
- `packages/testing/src/resolve.test.permissions` for how a named spawn grant is written.

## Scope

- This session's orchestrator uses the tool while you change it: `watch` follows you and
  `done` is how you report. Never leave `tooling/orchestra.ts` failing to load; typecheck it
  after every edit before you move on.
- `tooling/orchestra.ts` stands against the rule that `tooling/` holds only bare scripts. Do not
  move it or split it into a package; that is the owner's question (D007). Add what P04 needs.
- The orchestrator updates the orchestrate skill for the new commands after this task; do not
  edit `.agents/`.
- This machine has 8 GB and `/tmp` is RAM: scratch under `/var/tmp`; every multi-process run
  through `/var/tmp/kuib-guard.sh 30 1500 -- <command>`; Nx parallelism is 1 in `nx.json`, pass no
  flag. `deno` with `--no-lock`. Never touch a tmux window or server this session uses; a test
  that needs tmux starts its own server on its own socket and removes it.
- No git writes. No sub-agents except for read-only searches. Claims you change are rewritten
  and stamped; no prose comments in code.

## Go — 2026-10-14T10:17:05

Approved by the owner after seeing the literal commands, options and output lines, with these conditions. Where they differ from your plan, they win. Each condition stands alone.
1. A task whose runtime has no title snapshot (spawned before this change, or whose runtime under /tmp was lost to a reboot) still fails closed at accept, but can be accepted with one explicit option, --without-title-guard. Using it writes a line into that task brief saying the guard was skipped and when. Test both paths. This task is the first one that will need it.
2. The tooling test grant names exactly the workspace Deno, git and tmux, as your plan says. Keep the test that says which projects may spawn true, and add tooling to it with its three programs.
3. Besides the fake CLI, try the reordered launch once with the real launch commands this session uses, codex as in your own brief and claude with --mcp-config, each in a private tmux server, and check the agent shows the prompt; close them at once. No task record, no other window touched.
4. Handoff, required by the owner: "make sure the next handed off session reads up the brief as well as continues orchestration". So what is pasted after /clear is always a standard opening, then the supplied prompt verbatim when there is one. The opening tells the resumed session to read the rendered handoff the session hook injects, to run pnpm journal handoff <feature> when it is missing, and to carry on orchestrating from it: run pnpm orchestra status and re-arm the watch. Without a prompt the opening alone is pasted, in place of today line. Test that the opening and a multi-line prompt arrive whole and in that order. Write the opening literally in the report.
5. Everything else as you planned. Report with the Tests and Deviations sections, then pnpm orchestra done repair-orchestra done.

## Resume — 2026-10-14T10:37:20

Checked by the orchestrator: the gate is green with the cache skipped and from the cache and rewrites nothing; all claims fresh; diff, the title guard and the help lines work as shown to the owner; the changed permission test still refuses an unrestricted spawn for tooling, and the refusal test is untouched. One gap remains, and it is in the acceptance I wrote, not in your work. allowedGlobs counts the grants of running tasks only. When a task stops, done, blocked or plan-ready, its grant drops out, and every file it changed after another task was spawned is reported against the tasks still running. That is the burst seen last night when one task reported done and the next got blamed for its packages/testing files, and it is a likely cause of the bursts after a restart. P04-I03 in the plan now reads: a path is reported only when no grant covers it of a task in the same repository that was active at any time since this task was spawned, running or since stopped. Use the task records start and finish times to decide that. Add a test where one of two tasks stops and the other is not blamed for its files; keep the existing tests unchanged. Update the report, including Tests and Deviations, then pnpm orchestra done repair-orchestra done.

## Test-title guard skipped — 2026-10-14T10:43:59

Accepted with --without-title-guard because this task has no spawn title snapshot.
