---
owner: roysupriyo10
lifecycle: implementing
summary: "Testing becomes first class: tests in the gate, three kinds of test as named targets in every project, real modules instead of stand-ins, offline and isolated by construction, shared helpers and one fixture convention, and a lint rule, coverage, a hook and CI that keep it true."
topics: [testing, nx, lint, ci]
supersedes: []
superseded-by: []
roadmap: R021
context:
  - "[[domains/infra/current#^nx-tasks]]"
  - "[[domains/infra/current#^check-pipeline]]"
  - "[[domains/infra/current#^eslint-config]]"
  - "[[domains/infra/current#^house-structure-rules]]"
  - "[[domains/infra/current#^bootstrap-env]]"
  - "[[domains/infra/decisions#^D023]]"
checkpoint:
  summary: "Every item is implemented (P01 to P04). Testing has one home: the runner, its sandbox, permissions, bounds, coverage and helpers live in packages/testing, and every project reaches it as the command testing through one root dependency. The gate includes tests, rewrites nothing, writes its chain once and states Nx parallelism once. Ready to promote once the owner has ruled on G003 and G004."
  next: []
  blockers: ["The owner's review of G003 (the hook after a repeat install) and G004 (names without a sibling), now joined by check:base, the command testing, the runner's unit names and the bin/ convention", "The workflow has not run on GitHub; it runs on the first push", "Engine and engine-service keep unrestricted tests and test:llm until the engine is released (G005)", "Nothing is committed"]
  note: "ALL ITEMS ARE IMPLEMENTED (2026-10-14; the last task was accepted at 02:55 IST and this note was last updated at 10:05 IST, both read from the system clock). P04 is done: tasks move-runner and switch-runner are accepted and closed. The test runner lives in packages/testing as units named verb.test.noun and is the command testing, through bin/testing, which holds no logic. Every project and the root say \"test\": \"testing\", reached through one root dependency; the two engine packages keep deno test -A --no-check (D004), the one exception. tooling/ holds only agents.ts, journal.ts and orchestra.ts. The gate chain is written once as check:base, and Nx parallelism is 1 in nx.json with no flag in any script. Spawn grants for tests: daemon and testing unrestricted, inference the workspace Deno only, tooling none; the test that an ungranted project cannot spawn was inverted by a worker during this work, restored and strengthened, and stands. The orchestrator's last full check, at 02:53: check:base green; typecheck, lint and tests green for 18 projects with the cache skipped (53 s); pnpm run check green and 53 of 53 from the cache; no file rewritten; 123 of 123 claims fresh; nothing outside the journal changed after it. Nothing is committed. FOR THE OWNER before the feature is promoted: G003 (the hook after a repeat install) and G004 (names without a sibling), now joined by check:base, the command name testing and the units of the runner; then /journal-promote test-system. When accepting any task: diff the tests of units a worker edited, count tests across every *.test.ts, and trim the Refs that orchestra accept writes, keeping only paths that will still exist."
---

# Plan — test-system

## Objective

Make testing a first-class part of the workspace, in a shape that holds as packages multiply:

- one gate that includes tests and changes no file;
- three kinds of test, each a named target that means the same in every project;
- one command each to run a single test, a file, a project, the affected projects, or
  everything;
- tests that exercise the real modules, offline and isolated by construction;
- shared helpers and one fixture convention;
- a lint rule, a coverage report, a hook and CI that keep all of this true.

## Non-goals

- Writing the missing tests of every existing unit. The rule lists today's gaps, and that list
  only shrinks.
- Anything under `packages/engine` and `packages/engine-service` (D004). Their stand-ins are
  listed and wait.
- Tests of `protocol`'s model-facing shapes, which the inference feature rewrites and tests as
  it does.

## Principles

- A test exercises the module the product runs. Nothing the codebase implements gets a second
  implementation for tests.
- Offline by construction: a unit test cannot reach the network, by permission and not by
  discipline.
- A test restores what it changes: environment, temp folders, spawned processes.
- One way to do each thing, the same in every project.
- A test lives in the package whose behaviour it proves. A test that needs several packages
  takes the lower ones as dev dependencies; there is no separate end-to-end project.
- The gate is honest. It fails when anything it guards fails, and it rewrites nothing.
- Cost follows what changed, not the size of the workspace.

## What exists today

Audited 2026-10-08.

- `pnpm run check` does not run tests. It was green while `pnpm test` was red: in
  `packages/env` the two `findWorkspaceRoot` steps fail whenever the package's tests run
  together, because `tmpdir()` is undefined by then, and pass when their file runs alone.
- Every project runs `deno test -A --no-check`. Nothing keeps a unit test off the network. The
  one live test is reached by a root script that names its file in the engine.
- `protocol` (93 units), `cli` and `tooling` have no test script and no tests.
- Three tests declare a file system of their own: `packages/tools/src/read.file`,
  `packages/tools/src/tool.spec` and `packages/engine/src/provider/build.tools`. Each restates
  the whole `FileSystemPort`, so a method added to the port breaks every one of them.
- The engine's in-memory event log is a second implementation of the log, used by five test
  files and no production code. One engine test drives the loop with the AI SDK's mock model.
- The gate's `format` step runs `prettier --write`. Circular imports are checked only by
  `pnpm check:circular`, outside the gate.
- There is no fixture convention, no shared test helper, no coverage report, no benchmark
  target, no CI and no git hook. The remote is `github.com:kuib-ai/kuib`.
- What is sound: tests sit beside their unit, are type-checked by `tsgo`, use one runner and
  one assertion library, and are cached per project by Nx. The suite runs cold in 8.5 seconds.

## P01 — One gate, three targets

### P01-I01 — The red test and its cause

- Acceptance: The tests of `packages/env` pass when run together, through Nx and through pnpm.
  The report names the cause. Every test in that package that changes the environment or
  creates a temp folder restores or removes it.
- State: implemented
- Refs:
  - `packages/env/src/workspace.root/index.test.ts` — the test that fails in company

### P01-I02 — The same targets in every project

- Acceptance: Every TypeScript project has a `test` target, including `protocol`, `cli` and
  `tooling`. `test:live` exists where a test needs the network and keys, and `bench` where a
  measurement exists. Nx caches `test` and never caches the other two. The root script that
  names one live test file is gone.
- State: implemented
- Decisions: D003
- Refs:
  - `package.json` — changed

### P01-I03 — Permissions instead of `-A`

- Acceptance: `test` runs with explicit permissions: reading, the environment, writing to a
  temp folder, and no network beyond the local sockets a test opens itself. They are defined
  in one place for the whole workspace. A test that reaches a remote host fails under `test`
  and can only pass under `test:live`.
- State: implemented
- Addresses: G001
- Refs:
  - `packages/testing/src/resolve.test.permissions/index.ts` — changed

### P01-I04 — The gate

- Acceptance: `pnpm run check` runs `test` with typecheck, lint and format; its format step
  checks and rewrites nothing; the circular-import check is part of it. It is green.
- State: implemented
- Decisions: D003
- Refs:
  - `package.json` — changed

### P01-I05 — Running a part

- Acceptance: One root command, `pnpm test`, runs everything when given nothing, the affected
  projects with `--affected`, a project when given its folder, and a file or folder inside a
  project when given that path; any other flag reaches `deno test` untouched, so one test is
  chosen by name and a path is watched. Everything and a whole project run through Nx and are
  cached. There is no second command for a path.
- State: implemented
- Decisions: D003, D005
- Refs:

## P02 — Real modules, shared pieces

### P02-I01 — A testing package

- Acceptance: One package holds what many test files need: a temp folder that is removed
  afterwards, an environment that is restored afterwards, and a fixture loader. It has its own
  tests and no stand-in for a module of the codebase.
- State: implemented
- Decisions: D002
- Refs:
  - `packages/testing/src/index.ts` — changed

### P02-I02 — One fixture convention

- Acceptance: Fixtures live in `fixtures/` beside `src/` and hold data only. Each fixture
  carries its own description beside its data, saying what it shows and whether it was
  recorded or written by hand; there is no single list per project. The loader refuses a
  fixture without one. Nx reruns a project's tests when one of its fixtures changes. The
  convention is written in `AGENTS.md`.
- State: implemented
- Decisions: D005
- Refs:
  - `packages/testing/src/load.fixture/index.ts` — changed

### P02-I03 — Tests stop declaring their own file system

- Acceptance: The two tests in `packages/tools` run against the real file-system procedures
  over a temp folder and no longer restate `FileSystemPort`. A method added to the port needs
  no change in a test that does not use it.
- State: implemented
- Decisions: D002
- Addresses: G002
- Refs:
  - `packages/tools/src/read.file/index.test.ts` — changed

### P02-I04 — Spawned processes are reaped

- Acceptance: A test that starts a process ends it. Running the suite twice leaves no process
  behind.
- State: implemented
- Refs:
  - `packages/daemon/src/ensure.daemon/index.ts` — changed

## P03 — Rules that hold as packages multiply

### P03-I01 — A unit that exports behaviour has a test beside it

- Acceptance: A rule of the house plugin fails for a unit with behaviour and no test beside
  it. Types, enums and barrels are exempt. Today's gaps are in one list; the rule also fails
  when a listed unit has gained a test or no longer exists, so the list only shrinks.
- State: implemented
- Refs:
  - `packages/eslint-plugin-house-style/src/rules/require.unit.test/index.ts` — changed

### P03-I02 — A coverage report

- Acceptance: One command writes coverage per project and a workspace total. There is no
  floor.
- State: implemented
- Decisions: D003
- Refs:

### P03-I03 — A hook and CI

- Acceptance: A pre-push hook runs the gate for the affected projects, installed without a
  manual step. A GitHub Actions workflow runs the whole gate on a push and on a pull request.
- State: implemented
- Decisions: D003
- Refs:
  - `.githooks/pre-push` — changed
  - `.github/workflows/check.yml` — changed

### P03-I04 — The rules are written down

- Acceptance: `AGENTS.md` states that the gate includes tests, how to run a part, the three
  kinds of test, the real-modules rule and the fixture convention; the tool adapters are
  regenerated; the infra claims on tasks, the check pipeline and lint are rewritten and
  stamped, and new behaviour has claims.
- State: implemented
- Refs:
  - `AGENTS.md` — changed

## P04 — One home for testing

### P04-I01 — The testing package owns the runner

- Acceptance: Everything about how tests run lives in `packages/testing`: the helpers, the
  sandbox and the runner with its coverage report, as units of that package, each with its
  test. The package exposes the runner as one command. `tooling/` holds no test runner: the
  five `tooling/test*` files and the stub are gone, and the claims say where the runner is.
- State: implemented
- Decisions: D011
- Refs:
  - `packages/testing/bin/testing` — changed
  - `packages/testing/package.json` — changed
  - `packages/testing/src/report.test.coverage/index.ts` — changed
  - `packages/testing/src/run.test.command/index.ts` — changed
  - `packages/testing/src/run.test.projects/index.ts` — changed
  - `packages/testing/src/run.test.target/index.ts` — changed
  - `packages/testing/src/resolve.test.permissions/index.test.ts` — changed

### P04-I02 — Every project says the same thing

- Acceptance: The `test` script of every project is the same command name, with no path, as
  its neighbours `eslint .` and `tsgo --noEmit` are; the workspace reaches the command as a
  dependency. The engine packages keep their old script until the engine is released (D004),
  and that is the only exception. The root `check` and `check:affected` scripts do not repeat
  one chain twice. `AGENTS.md` states the new rule for a new package.
- State: implemented
- Decisions: D011
- Refs:
  - `AGENTS.md` — changed
  - `nx.json` — changed
  - `package.json` — changed
  - `packages/testing/package.json` — changed

## Decisions

### D001 — Testing is first class

- Status: accepted
- Ruling: "i want testing to be first class"; "so make sure the setup is optimal and
  scalable"; "this will be a multi package monorepo that shall handle a lot of things"; "so
  the whole shape of the tests and everything should be awesome" (owner, 2026-10-08)
- Decision: The test setup is settled before the next implementation round of any feature.

### D002 — Tests use the real modules

- Status: accepted
- Ruling: "And I don't want mock-ups of most of the things for which we are already make
  creating implementations at the code base. This is a completely local first thing without a
  lot of dependencies on infrastructure, right? So I think most of the things we can implement
  tests in such a way that it uses the exact same modules in the code."; "I think earlier I
  saw some tests which created the whole file system setup again within itself which I don't
  think is correct. Because if I try to add a new let's say function I'll have to def I have
  to redefine every single test and create a mock vari version of the file system. I what I
  should do is update the test with the usage that defines it now." (owner, 2026-10-08, dictated)
- Decision: A test exercises the module the product runs. Stand-ins exist only for what kuib
  does not implement and cannot run offline: a provider's traffic, replayed as recorded bytes,
  and time and randomness, passed in as values.

### D003 — The standard shape, chosen by the orchestrator

- Status: accepted
- Ruling: "But in any case, please make it first class and make the test shape good so that we
  can define tests individually and run them separately or not. And we can run the whole
  suite. Basically like whatever the proper standard is for basically what the proper standard
  is we should implement it that way" (owner, 2026-10-08, dictated)
- Context: Three choices had been put to the owner: tests in the gate, what runs the gate
  without a person, and a coverage floor.
- Decision: Chosen under this ruling. Tests are part of `pnpm run check`. A pre-push hook and a
  GitHub Actions workflow run the gate. Coverage is a report without a floor.

### D004 — The engine waits

- Status: accepted
- Ruling: "don't touch the engine now" (owner, 2026-10-08, recorded as D023 of
  [[features/inference/plan]])
- Decision: Nothing under `packages/engine` or `packages/engine-service` changes in this
  feature. Their stand-ins are listed under "What exists today" and wait.

### D005 — One test command, fixtures that describe themselves, tests where the behaviour is

- Status: accepted
- Ruling: "this is fine but i don't understand why can't the test command itself take the path
  argumetns?"; on the revised commands and the two additions put with them: "this is alright"
  (owner, 2026-10-12)
- Context: The worker's plan had `pnpm test` for everything and a second command,
  `pnpm test:path`, for a path. The orchestrator put three changes to the owner: one command
  that takes the path, a description per fixture in place of one manifest per project, and a
  rule for tests that span packages.
- Decision: `pnpm test` takes the path. Each fixture carries its own description. A test lives
  in the package whose behaviour it proves.

### D006 — Implementation work runs on opencode with MiMo 2.6 Pro

- Status: accepted
- Ruling: "yeah i wanted for a cheap low ram heavy harness"; "not about model usage"; "please do
  the implementation work using opencode mimo2.6 pro" (owner, 2026-10-12)
- Context: On 2026-10-12 the kernel ran out of memory during this task and killed the owner's
  session. The machine is an 8 GB laptop, and a Claude Code worker holds about 0.4 GB before
  its tests run.
- Decision: Implementer tasks are spawned with `opencode`, which orchestra launches on MiMo 2.6
  Pro. The orchestrator stays on its own agent and checks every result before accepting it.
- Superseded by: D007

### D007 — The implementer runs on codex, and workers start without MCP servers

- Status: accepted
- Ruling: "yeah please drop the mcp servers; is there a way to selectively exclude?"; "yeah i
  want to save the max plan limits too; it's depleting fast"; "i think codex may be better";
  "please try using that" (owner, 2026-10-12)
- Context: Measured on this machine the same day: agy 244 MB idle, Claude Code without its MCP
  server 266 MB idle, codex about 275 MB idle, a working Claude Code worker 622 MB of which
  208 MB is the firecrawl MCP server, opencode about 580 MB idle. D006 chose opencode before
  these numbers were known.
- Decision: The rest of `test-setup` runs on codex, as a trial. Workers start without MCP
  servers unless a task names the ones it needs.
- Supersedes: D006

### D008 — The implementer's model is GPT-6 Sol

- Status: accepted
- Ruling: "no no"; "please use 6 sol for hte implemntation" (owner, 2026-10-12)
- Context: Under D007 the codex worker had started on GPT-6 Astra at xhigh, the model the
  owner's codex configuration names.
- Decision: The implementer runs on codex with `-m gpt-6-sol`. codex's model list also has
  `gpt-6.1-sol`; "6 sol" is read as `gpt-6-sol`.
- Superseded by: D009

### D009 — Which agent does which kind of work

- Status: accepted
- Ruling: "for reasoning and high caution reviews; use opus 5.5 max"; "for implemetnation please
  use codex with a lower sol model"; "maybe even 6.1 sol"; "with a high/xhigh effort"; "and fast
  mode" (owner, 2026-10-12)
- Context: codex lists GPT-6.1 Sol as its latest workhorse model for coding and GPT-6 Sol as the
  previous one; both offer a fast tier. The owner's codex configuration already sets
  `service_tier = "fast"`.
- Decision: Implementer tasks run on codex with `gpt-6.1-sol` at high effort in fast mode.
  Reasoning tasks and reviews that need high caution run on Claude Code with Opus 5.5 at max
  effort. The orchestrator checks every result before accepting it.
- Supersedes: D008
- Superseded by: D010

### D010 — The implementer runs on GPT-6 Sol in the standard tier

- Status: accepted
- Ruling: "shouldn't we use 6 sol then?"; "why are we using 6.1 sol when we established it is
  slow?"; "that is fine; we review later though"; "please relaunch"; "and don't use the fast
  versoin please" (owner, 2026-10-13)
- Context: A probe on 2026-10-12 (two rounds, 60 numbered sentences, no tools) measured GPT-6
  Sol at about 53 output tokens a second in the fast tier and about 33 in the standard tier,
  and GPT-6.1 Sol at 22 to 27 in the fast tier and about 20 in the standard tier. The
  orchestrator recommended GPT-6 Sol in the fast tier and said the probe measures speed only,
  not care. "We review later" refers to that open question of quality.
- Decision: Implementer tasks run on codex with `gpt-6-sol` at high effort and
  `service_tier="default"`, set on the command line because the owner's codex configuration
  names the fast tier. The running task capture-traffic of the inference feature is relaunched
  on it at its next clean point. Reasoning tasks and reviews that need high caution stay on
  Claude Code with Opus 5.5 at max effort. Whether GPT-6 Sol is careful enough is reviewed
  later, on its results.
- Supersedes: D009

### D011 — Testing has one home, and every project reaches it the same way

- Status: accepted
- Ruling: "also not sure about teh need for the relative ../../tooling/test.ts in hte
  @packages/testing/package.json"; "is tat really needed?"; "please keep all of the code
  symmetric and uniform"; "otherwise it's confusing as to why things exist"; "everything must
  have a good reason for being present there"; "if we already have a package for testing; what
  is the meaning of @tooling/test.ts"; "should everything not be kept within the package
  itself? the whole monorepo can have acess to it as a depedency?"; "yeah the tooling is for
  very bare bones basic scripts; all the other things should be a proper package that owns
  everything; not broken into pieces like this?" (owner, 2026-10-14)
- Context: The task test-setup put the runner in `tooling/`, as a sibling of the repository's
  command scripts, and its building blocks in `packages/testing`. Each project's `test` script
  pointed at the runner by a relative path, in three spellings across the workspace, and
  `tooling/test.ts` became a stub because Deno does not measure coverage on a file of that
  name. The orchestrator accepted that work after checking that it ran, not that it was
  uniform.
- Decision: The testing package owns the runner and exposes it as a command; projects reach it
  as a dependency and name it without a path. `tooling/` is for bare, basic scripts that work
  on the repository itself; anything more is a proper package that owns all of its concern.
  The same ruling moves the capture tool into a package (inference D030). Carried out in P04, after the inference task rename-fixtures, which
  touches the same manifests.

## Gaps

### G001 — Defining the permissions once without a `deno.json`

- Status: resolved
- Recommendation: One definition that every project's `test` script calls. The worker's plan
  proposes where it lives.
- Context: The workspace has no `deno.json` and must not gain one. Resolved by the task
  test-setup: `resolveTestPermissions` in `packages/testing` is the one definition, and the one
  runner, `tooling/test.ts`, is what every project's `test` script calls.

### G002 — The real file system for the tools tests

- Status: resolved
- Recommendation: Use the daemon's own file-system procedures over a temp folder. If the only
  `FileSystemPort` over them lives in the engine, say so and leave P02-I03 for the engine's
  release.
- Context: `createDaemonFileSystem` is in `packages/engine`, which this feature may not touch,
  and `tools` may not import the engine. Resolved by the task test-setup: the two tools tests
  run against `Daemon.createDaemonCaller({})`, with the daemon as a dev dependency of `tools`.

### G003 — The hook after a repeat install

- Status: open
- Recommendation: Accept it. A fresh clone gets the hook from `pnpm install`; an existing
  checkout runs `pnpm run prepare` once. Revisit when pnpm fixes it.
- Context: The pinned pnpm (12.6.0) skips the root `prepare` script on an install that changes
  nothing, so a checkout that lost its hook path does not get it back from `pnpm install`
  (pnpm issue 16545). A fresh frozen install was verified to install it. `AGENTS.md` says
  "`pnpm install` installs `.githooks`", which is true of a fresh install only. This checkout
  now has `core.hooksPath` set to `.githooks`: a push runs `pnpm run check:affected`.

### G004 — Names without a sibling, for the owner's review

- Status: open
- Recommendation: Keep them; each follows the verb-first unit pattern and none duplicates an
  existing word for the same idea.
- Context: From the report of test-setup. No sibling: `load.fixture`, `override.env`,
  `change.cwd`, `acquire.test.slot`, `untested.units`, `fixtures/` and `fixture.json`, the
  resource types `TempDir`, `SocketPath`, `Sandbox` and `TestSlot`, `mergeLcov` and
  `CoverageRecord`, and the role suffixes of `tooling/test.runner.ts` and
  `tooling/test.coverage.ts` beside `tooling/test.test.ts`, the first test in `tooling`.
  Existing asymmetries it noticed and left: `workspace.root` exports `findWorkspaceRoot`,
  `server` exports `createDaemonServer`, `tool.spec` exports `defineTool`; the test runner
  does not use `Cli.parseCli` like the other tooling scripts, because it forwards unknown
  flags to Deno; `fixture.origin.enum` carries its `@claim` line twice.

### G005 — What waits for the engine's release

- Status: planned
- Context: Under D004 the engine and engine-service keep `deno test -A --no-check`, so their
  tests are not offline. When the engine is released: move both onto the shared runner, move
  the service's socket tests onto the pooled paths, rename the gated provider test to a live
  test and add its `test:live` target, remove the root `test:llm` script (the open line of
  P01-I02), and replace the engine's file-system and event-log stand-ins.

### G006 — The daemon server does not own its TCP server

- Status: open
- Recommendation: Fix it in `core` when the daemon is next touched; it is outside this feature.
- Context: `createDaemonServer` returns the unix server only, so closing it leaves the optional
  TCP server listening until the process exits. Found by test-setup and left unchanged.
