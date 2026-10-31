---
status: "accepted"
role: "implementer"
gate: "none"
items: ["P04-I02"]
grant: ["journal/features/test-system/tasks/switch-runner/**","package.json","pnpm-lock.yaml","nx.json","apps/*/package.json","packages/*/package.json","packages/testing/**","tooling/**","scripts/**","eslint.config.ts",".prettierignore","AGENTS.md",".agents/**",".claude/**",".cursor/**",".gemini/**",".githooks/**",".github/**","journal/domains/infra/**","journal/domains/core/current.md","journal/domains/host/current.md","journal/_index.md"]
agent: "codex"
command: "choom -n 800 -- codex --dangerously-bypass-approvals-and-sandbox -m gpt-6-sol -c model_reasoning_effort=\"high\" -c service_tier=\"default\""
cwd: "/home/rs10/developer/kuib-ai/kuib"
session: "kuib-ai/kuib/root"
started: "2026-10-14T02:15:50"
finished: "2026-10-14T02:54:21"
reported: "accepted"
---
# switch-runner — the workspace runs its tests through the testing package

Feature: journal/features/test-system/ · Item: P04-I02 · Roadmap: R021

## Objective

The test runner now lives in `packages/testing` and is the command `testing` (task
move-runner, accepted). The workspace still runs the old one: 14 projects say
`deno run -A ../../tooling/test.ts`, `tooling` says `deno run -A test.ts`, and the root scripts
point at `tooling/test.ts`. Switch everything to the command and delete the old runner, so
that one idea has one spelling and one home. The owner: "please keep all of the code symmetric
and uniform"; "otherwise it's confusing as to why things exist"; "everything must have a good
reason for being present there".

## Acceptance

- P04-I02 of `journal/features/test-system/plan.md`, as written there.
- The workspace reaches `testing` through one dependency at the root, the way it reaches
  `eslint` and `tsgo`; move-runner proved that this serves every project and the testing
  package itself. A project declares `@kuib-ai/testing` only when its tests import from it.
- Every project's `test` script is the same word, `testing`. `test:live` and `bench`, where a
  project has them, are that command with its kind. The root `test` is that command too.
- `tooling/test.ts`, `tooling/test.runner.ts`, `tooling/test.coverage.ts`, `tooling/test.test.ts`
  and `tooling/test.coverage.test.ts` are gone, and nothing names them: not a script, not
  `nx.json`, not a tsconfig, not a claim, not `AGENTS.md`.
- The root `check` and `check:affected` do not write one chain twice. Nx parallelism is stated
  once for the workspace and not as a flag in scripts; it is 1.
- `AGENTS.md` gives the rule for a new package in the new form. The claims that describe the
  runner, its permissions, the coverage report, the package exports, the Nx tasks, the gate
  and each project's test script are rewritten to what is true and stamped; `pnpm journal
  drift` shows every claim fresh.
- `pnpm run check` is green, once from the cache and once with the cache skipped.
- No test is loosened, removed or turned around. The report lists every test you changed or
  deleted and why, and ends with the names introduced and the sibling each mirrors.

## What to settle and say in the report

- How the gate chain is written once. If that needs a new script name, mirror the siblings
  (`check:circular`, `check:affected`, `format:modified`) and say which one.
- Where Nx parallelism is stated once, and how CI or another machine sets its own.
- Whether `@kuib-ai/tooling` still needs its permission to spawn in
  `resolveTestPermissions` once its runner tests are gone; remove it if nothing needs it, and
  keep the test that says which projects may spawn true.
- Whether the hooks and the workflow need any change; they call the root check scripts.

## Context

Read these, nothing more:

- AGENTS.md: the working rules.
- journal/features/test-system/plan.md: P04, D011, D003 to D005, D010.
- journal/features/test-system/tasks/move-runner/report.md and plan.md: what was built, the
  proof of the command, and the list of what this task changes, path by path.
- `packages/testing`: the runner units and `bin/testing`.
- The root `package.json`, `nx.json`, each project's `package.json`, `tooling/`.
- In journal/domains/infra/current.md the claims `nx-tasks`, `check-pipeline`,
  `workspace-tools`, `test-runner`, `test-permissions`, `test-bounds`, `testing-helpers`,
  `coverage-report`, `package-exports`, `push-hook-ci`; and the claims in the core and host
  domains that quote a project's test script.

## Scope

- `packages/engine` and `packages/engine-service` keep `deno test -A --no-check` and are not
  touched (D004). That is the one exception; say so where the rule is written.
- Another agent is working inside `packages/capture/src`; that package is about to be folded
  into `packages/inference`. Leave `packages/capture` alone, its `package.json` included. If
  its project is red for a reason inside that folder, say so in the report and do not fix it.
  A third agent only reads the fixtures.
- `tooling/capture.ts` and `tooling/capture.test.ts` stay; they go with that other task.
- This machine has 8 GB of memory and `/tmp` is memory. Scratch under `/var/tmp`. Every run that
  starts more than one process goes through `/var/tmp/kuib-guard.sh 30 1500 -- <command>`, with
  Nx parallelism 1. Never run `deno` with a `jsr:` or `npm:` import from the repository root
  without `--no-lock`. No `deno.json`; never `deno check`, `deno install` or `deno add`.
- No git writes. No sub-agents except for read-only searches. No prose comments in code.

## Resume — 2026-10-14T02:53:52

Both things you were blocked on are cleared, by others. The orchestrator removed the stale Refs from the plan, and the capture package no longer exists: its recorder was folded into packages/inference by another task, which also removed the tooling test grant since tooling has no tests left. The orchestrator ran the gate just now: check:base green, typecheck, lint and tests green for all 18 projects with the cache skipped (53 s), pnpm run check green and served 53 of 53 from the cache, no file rewritten, 123 of 123 claims fresh. Your own part was checked earlier and stands. Change no code. Read the current package.json, nx.json and packages/testing/src/resolve.test.permissions/index.ts so your report matches what is there now, replace the Status and the Blocked on section of report.md accordingly, and run pnpm orchestra done switch-runner done.
