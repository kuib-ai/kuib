---
status: "accepted"
role: "implementer"
gate: "plan"
items: ["P04-I01"]
grant: ["journal/features/test-system/tasks/move-runner/**","packages/testing/**"]
agent: "codex"
command: "choom -n 800 -- codex --dangerously-bypass-approvals-and-sandbox -m gpt-6-sol -c model_reasoning_effort=\"high\" -c service_tier=\"default\""
cwd: "/home/rs10/developer/kuib-ai/kuib"
session: "kuib-ai/kuib/root"
started: "2026-10-14T01:53:33"
finished: "2026-10-14T01:55:40"
reported: "accepted"
---
# move-runner — the testing package owns the test runner

Feature: journal/features/test-system/ · Item: P04-I01 · Roadmap: R021

## Objective

The test runner lives in `tooling/` (`test.ts`, a stub; `test.runner.ts`; `test.coverage.ts`;
their tests) while everything it is built from lives in `packages/testing`. The owner: "if we
already have a package for testing; what is the meaning of @tooling/test.ts"; "should
everything not be kept within the package itself? the whole monorepo can have acess to it as a
depedency?". Build the runner inside `packages/testing` as units of that package, and expose it
as one command. This task is the first half: it works only inside `packages/testing`. A
second task then switches every project and the root scripts to the command and deletes
`tooling/test*`; until then the old runner keeps running the workspace and yours sits beside it.

## Acceptance

- P04-I01 of `journal/features/test-system/plan.md`, except its last sentence: `tooling/test*`
  is not deleted and no claim outside this package's own is rewritten here.
- The runner in the package does everything the one in `tooling/` does: every project, the
  affected projects, one project, a file or folder, any other flag passed to Deno, the three
  kinds, coverage, the sandbox, the permissions, the nesting bound and the slot bound.
- Its tests live beside its units and pass through the runner that exists today:
  `pnpm test packages/testing`, and typecheck and lint for the project.
- The package declares the command. The report shows it running from a scratch pnpm workspace
  as the plan describes.

## What the owner asks of all code

In his words, 2026-10-14: "i think every part of the codebase must be uniform"; "please keep
all of the code symmetric and uniform"; "otherwise it's confusing as to why things exist";
"everything must have a good reason for being present there"; "the tooling is for very bare
bones basic scripts; all the other things should be a proper package that owns everything;
not broken into pieces like this". So: one idea has one spelling and one home; siblings look
alike in name, placement and form; nothing is a copy of a fact kept elsewhere; nothing is left
over. Before you report, read what you made beside its siblings and be able to say in one
sentence why each file, field and name is there. Say in the report where you could not.

## Plan gate

Change nothing before GO. Write `plan.md` next to this brief with:

- the units the runner becomes, one line each: folder, export, what it holds, and the sibling
  whose name and shape it mirrors. Follow the house structure of `packages/`: one unit per
  dot-case folder, `index.ts` with its `index.test.ts` beside it, the barrel, the `@claim` line;
- the command: its name (the orchestrator's starting point is `kuib-test`; say if a sibling
  gives a better one), how the package declares it, and how it starts Deno without `-A` being
  needed anywhere else. Prove in a scratch pnpm workspace under `/var/tmp`, not in this
  repository, and record the commands and results: (a) a project that depends on the package
  runs the command by name from its `test` script; (b) the package itself can run its own
  tests by the same name; (c) the root can; (d) it works when started by Nx. From that, say
  which manifests must declare the dependency for the whole workspace to reach it, and why
  that is the same for every project;
- what happens to the real-subprocess tests of `tooling/test.test.ts` and to the permission to
  spawn that `@kuib-ai/tooling` has today;
- why no stub is needed once no file is named `test.ts` (Deno leaves a file of that name out of
  coverage);
- what the second task must then change outside this package, as a list by path, so it can be
  briefed from your report: each `package.json`, the root scripts, `nx.json`, `AGENTS.md`, the
  claims, the hooks and the workflow;
- the names you introduce, each with its sibling, and anything undecided.

Then `pnpm orchestra done move-runner plan-ready` and stop.

## Context

Read these, nothing more:

- AGENTS.md: the working rules.
- journal/features/test-system/plan.md: P04, D011, and D003 to D005.
- `tooling/test.ts`, `tooling/test.runner.ts`, `tooling/test.coverage.ts` and their two tests.
- `packages/testing`: all of it.
- The claims `infra/test-runner`, `infra/test-permissions`, `infra/test-bounds`,
  `infra/testing-helpers`, `infra/coverage-report` in journal/domains/infra/current.md.
- One or two other packages for the shape of a unit and a barrel, such as `packages/env`.

## Scope

- You change files under `packages/testing` and your task folder, nothing else. Other agents
  are working in this tree: one is moving the inference fixtures and editing
  `tooling/capture.ts`, the root `package.json`, `tooling/package.json` and the lockfile. Do not
  touch those, and do not run `pnpm install` in this repository. If you need a manifest outside
  the package changed, write it in the report for the second task.
- Do not run the whole gate: the tree is in motion under other tasks and it will not be yours
  to fix. Check your own project: `pnpm test packages/testing`, and typecheck and lint for it.
- This machine has 8 GB of memory and `/tmp` is memory. Scratch under `/var/tmp`. Every run that
  starts more than one process goes through `/var/tmp/kuib-guard.sh 30 1500 -- <command>`, with
  Nx parallelism 1. Never run `deno` with a `jsr:` or `npm:` import from the repository root
  without `--no-lock`. No `deno.json`; never `deno check`, `deno install` or `deno add`.
- Nothing under `packages/engine` or `packages/engine-service` changes.
- No git writes. No sub-agents except for read-only searches.
- Claims you change are rewritten and stamped; no prose comments in code.

## Go — 2026-10-14T01:09:53

Approved, with these conditions. Where they differ from your plan, they win.
1. Units follow the pattern this package already has, verb.test.noun, one behaviour each and about the size of their siblings (resolve.test.permissions, resolve.test.env, resolve.test.depth, acquire.test.slot). One unit of 450 lines that parses, selects, routes, spawns and reports is not that. Split along what the runner does, for example: parse.test.request (arguments into a request), resolve.test.targets (paths into projects and files), resolve.test.files (a kind and a target into what Deno is given), run.test.target (one project, directly, in its sandbox and slot), run.test.projects (every, affected or named projects through Nx), merge.test.coverage, report.test.coverage, and the command itself, which only routes a request. Settle the exact names against the siblings and list each with the sibling it mirrors; do not keep report.coverage, merge.lcov and run.test beside units named the other way.
2. The command is the package own name, testing, by the string form of bin, as your proof shows. Keep the shebang short; it is the only place -A appears.
3. For the second task, record this rule in your report, not the one in your plan: the workspace reaches the command the way it reaches eslint and tsgo, through one dependency at the root, which your proof shows is enough for every project and for the testing package itself. A project declares @kuib-ai/testing only when its tests import from it. No project is an exception.
4. Nx parallelism 1, the guard, no whole gate, nothing outside packages/testing and your task folder. tooling/test* stays as it is until the second task.

## Resume — 2026-10-14T01:36:47

Checked by the orchestrator: all 13 old test titles are still proven, 32 test steps over 13 units, the package tests, typecheck and lint pass, and the new command runs a unit directly and a project through Nx. One fix before acceptance. bin/testing holds logic that no test reaches: the catch that turns an error into a message and exit code 2. A bin file only starts a unit. Move that into run.test.command, so the unit returns the code for every outcome, test it there, and leave bin/testing as the interpreter line, the claim line, the import and one call. The capture package is being held to the same rule. Then rerun the package tests, typecheck and lint with Nx parallelism 1 through the guard, update the report and run pnpm orchestra done move-runner done.

## Resume — 2026-10-14T01:53:33

Reopened by the orchestrator: a proof was weakened. In packages/testing/src/resolve.test.permissions/index.test.ts the test "refuses a remote host, a write outside the sandbox, a spawn and the workspace .env" lost "a spawn": because @kuib-ai/testing was given run: true, the spawn from inside that test stopped being refused, and the assertion was removed to keep the test green. Nothing now proves that a unit test of an ordinary project cannot start a process. Put the proof back: run that probe under the permissions of a project that has no spawn grant and assert that the spawn is refused, with the remote host, the write outside the sandbox and the .env as before, under the old title. Keep a separate test that says which projects may spawn and why. Change no behaviour. Then rerun the package tests, typecheck and lint with Nx parallelism 1 through the guard, say in the report what was removed and restored, and run pnpm orchestra done move-runner done.
