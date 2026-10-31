# test-setup — log

## 2026-10-08 — pass 1, plan gate (no repo file changed)

Read: brief, WORKER.md, feature plan, the five infra claims, D023, R412. Then read the code the
plan must cover and ran read-only experiments. Scratch lives in `/var/tmp/kuib-test-setup`
(`proto/run.ts` is a working prototype of the sandboxed runner).

Findings that the plan rests on (all reproduced, not assumed):

- **env failure.** `packages/env/src/resolve.windows.base/index.test.ts` ("falls back to TEMP
  for runtime") restores with `process.env["TEMP"] = prevTemp`; `prevTemp` is `undefined`, and
  Deno stores the string `"undefined"`. `os.tmpdir()` reads `TMPDIR || TMP || TEMP || /tmp`, so
  it then returns `"undefined"` and `workspace.root`'s `mkdtempSync` fails with
  `ENOENT … mkdtemp 'undefined/wsroot-XXXXXX'`. Reproduced with only those two files and
  `env -u TMPDIR -u TMP -u TEMP`. With `TMPDIR` set the whole package passes (7 files, 24 steps).
  Every `process.env[x] = prev` restore in that package has the same defect.
- **Permissions.** Under `--no-prompt --allow-read --allow-env --allow-sys
  --allow-write=<sandbox> --allow-net=127.0.0.1,localhost`, a clean environment and a HOME and
  TMPDIR inside the sandbox, these pass unchanged: env, std, config, telemetry, transcript,
  event-log-sqlite, eslint-plugin-house-style, tools, host-tui; protocol and cli pass with
  `--permit-no-files` ("0 passed"). Without `--allow-sys`: std needs `hostname` (pino), config
  `uid`, env `homedir`.
- **Daemon needs more.** Unix sockets ask for net access to `unix:<exact path>`; Deno 2.9.6
  accepts no directory, prefix or wildcard for `unix:` (tried `dir`, `dir/`, `dir/*`, `dir/**`,
  `unix:/`). `listen(port)` with no host asks for `[::]:<port>`. Spawn asks for run access to
  the deno binary. An exact `unix:<path>` grant works for listen and connect.
- **Deny lists.** `--allow-net --deny-net=<range>` accepts CIDR and is applied to resolved
  addresses for `node:net` and `Deno.connect`; for `fetch` the result was inconclusive. Not used.
- **Leak.** `packages/daemon` `ensureDaemon` "spawns a child on a dead socket…" leaves one
  detached `start.daemon` process per run (reproduced; I ended the one my run left). Engine and
  engine-service leave none. Four older leftovers from earlier runs are still alive on this
  machine (pids 48452, 963966, 966072, 967808, sockets `/tmp/kuib-ensure-*/spawn.sock`); not
  mine, not touched.
- **Other leftovers of today's tests:** `~/.kuib-read-file-test-*` in the real home (daemon
  `procedure/read.file`), and temp folders `kuib-*`, `kuib-ensure-*`, `kuib-rf-*`,
  `mesh-config-*`, `env-*`, `wsroot-*`.
- **G002.** `Daemon.createDaemonCaller({})` type-checks as `ToolContext["fs"]` (tsgo, scratch
  project) and `Tools.readFile` / `Tools.readDir` return real content through it under the base
  permissions. No engine needed.
- **Gate inputs.** `prettier --check .` takes 2.5 s and fails today only on the generated,
  git-ignored `packages/deno-types/index.d.ts`. `madge --circular` takes 0.8 s and is clean.
  Baseline tests: daemon 10 files ok, engine 13 ok (1 ignored), engine-service 2 ok.
- **Toolchain.** `using` with `Symbol.dispose` passes tsgo, Deno, Prettier and ESLint with the
  house rules. `deno test '--ignore=**/*.live.test.ts'` excludes by glob; `*.bench.ts` is found
  by `deno bench` and not by `deno test`. `nx run-many -t <target no project has>` exits 0.
- **Environment facts.** Global `core.hooksPath` is `~/.config/git/hooks` (holds `commit-msg`).
  No `.github`, `.githooks` or `bin` anywhere. No `Deno.bench` and no live test outside the
  engine. Rough count of units with a function and no test beside: 16.

Next: write `plan.md`, `pnpm orchestra done test-setup plan-ready`, stop.

## 2026-10-08 — plan written

- `plan.md` written next to the brief: the shape, the env cause, G001 (flags and the
  per-project table), G002 (the daemon's caller; no engine needed), every item with paths and
  verification, order of moves, dependencies (none new), three paths the grant lacks
  (`.prettierignore`, `journal/domains/core/current.md`, `journal/_index.md`), what waits in the
  engine, names with siblings, and eight undecided points (U1–U8) with defaults.
- Scratch kept for the next pass: `/var/tmp/kuib-test-setup/proto/run.ts` (runner prototype).
- State: plan-ready. No repository file outside this task folder was changed.

Next, after GO: follow "Order of moves" in `plan.md`, starting with `packages/testing` and
`tooling/test.ts`. Read the `## Go` section of the brief first; it may overrule U1–U8.

## 2026-10-12 — pass 2, GO received

Go conditions (brief `## Go — 2026-10-12T19:50:11`), where they change the plan:

1. One command: root `test` takes the path; no `test:path`. Nothing → Nx all; `--affected`;
   project folder → Nx that project; file/folder inside a project → direct; other flags to
   `deno test`. Check pnpm passes `--filter`/`--watch` through.
2. Fixtures describe themselves: a folder per fixture with one description file; no manifest.
3. A test lives in the package whose behaviour it proves (AGENTS.md).
4. Keep `test:llm` (that line of P01-I02 stays open).
5. `ensureDaemon` returns the pid; rewrite + stamp `core/ensure-daemon`.
6. `prepare` installs hooks path; `commit-msg` forwarder; report how to forward others / undo.
7. U3, U5, U6, U7, U8 as planned.
8. Under `test`, deny reading the workspace `.env`; `test:live` may read it.
9. Grant now has `.prettierignore`, `journal/domains/core/current.md`, `journal/_index.md`.
10. Leave the four old `start.daemon` processes and the engine packages alone.
11. Low memory: modest Nx parallelism while verifying; scratch under `/var/tmp`.

Next: move 1 — `packages/testing` + `tooling/test.ts` + `nx.json`.

## 2026-10-12 — move 1 done: testing package, runner, Nx, scripts

- New `packages/testing` (12 units, 9 test files, fixture `fixtures/greeting`); `tooling/test.ts`
  (one command: Nx for all/affected/project, direct for paths, `--coverage`, `--kind=`);
  `nx.json` (namedInputs `testRunner`/`lintRules`, `test:live`/`bench` uncached,
  `defaultBase`); `tooling/package.json` + `tsconfig.json`; every project's `test` script now
  `deno run -A ../../tooling/test.ts` (engine and engine-service untouched); root scripts
  `test`, `test:live`, `bench`, `check`, `check:affected`; `.prettierignore` gained the
  generated declarations file; `journal/domains/infra/current.md` gained a draft `## Testing`
  section and the ownership globs; `pnpm install` linked the package (lockfile +31 lines).
- Verified: `packages/testing` typecheck, eslint, and `pnpm test` in it: 9 files, 37 steps ok,
  including the permission-state assertions; sandbox folder gone afterwards.
- Decided while building: fixture description file is `fixture.json`; no `test:coverage`
  script (coverage is `pnpm test --coverage`); the grants table lists the two engine packages
  as unrestricted so a direct path run inside them behaves like their own `-A` script.

Next: run each project through the runner; then env tests (P01-I01), tools (P02-I03), daemon
(P02-I04); `tooling/test.test.ts`.

## 2026-10-12 — pass 3, resumed after the out-of-memory kill

Cause, found by reading and confirmed with one single-process run in a scratch folder
(`/var/tmp/kuib-test-setup/disc`): **the runner ran itself as a test, without a bound.**

- `tooling/test.ts` is named `test.ts`, and `deno test` with no file argument discovers
  `{*_,*.,}test.{ts,…}` — a bare `test.ts` included (scratch run: "running 0 tests from
  ./test.ts", its top level executed).
- The `tooling` project's `test` script is `deno run -A test.ts`. In `tooling/` the runner
  starts `deno test` with no file argument; that loads `tooling/test.ts` as a test module; its
  top level is `process.exit(await main())`, so the runner starts again inside the test
  process, with cwd `tooling/` → `runDirect` → `deno test` → `test.ts` → …
- Nothing stops it: `PROJECT_GRANTS` gives `@kuib-ai/tooling` `--allow-run` (meant for the
  runner's own test), each level waits for its child, and each level also starts
  `deno info --json`. Every level is a live `deno` process of about 70 MB: 62 of them at the
  kill. So it was deno starting deno, in a chain, not Nx fanning out — as the kernel showed.
- Reached by any run that includes the `tooling` project: `pnpm test`, `nx run-many -t test`,
  or `pnpm test` inside `tooling/`. That is what "run each project through the runner" did.
- Not the cause: no `Promise.all` over projects (targets run one after another), no retry
  loop, no watcher unless `--watch` is passed; `packages/testing` starts no process.

Second defect seen while reading: the runner ignores SIGTERM while a child runs, so a
`kill -TERM` of the runner does nothing. It must pass the signal on.

Next: (a) the runner names the test files itself (`**/*.test.ts(x)`), so a bare `test.ts` is
never a test, and runs `main` only as the entry module; (b) the nesting bound and the slot
bound, with tests; (c) then one project, three, all — each through `/var/tmp/kuib-guard.sh`.

## 2026-10-12 — the bound is in the runner (resume steps 1–2)

Physical proof of the cause: the killed run left `/tmp/kuib-test-9dwjCi`, holding 60 sandboxes
nested one inside the other's `tmp` (a chain, not a fan). Removed; it was mine and empty.

Changed:

- `tooling/test.ts`: names the test files itself (`**/*.test.ts(x)`, live `**/*.live.test.ts(x)`,
  bench `**/*.bench.ts(x)`; a folder argument becomes those patterns under it), so `test.ts` is
  never a test; runs `main` only under `import.meta.main`; refuses to start inside a test
  (`resolveTestDepth`); refuses to call Nx when `NX_TASK_TARGET_PROJECT` is set; takes a slot
  (`acquireTestSlot`, 4 per workspace under `node_modules/.cache/kuib-test-slots`, nested runs
  use the `slots` folder of the sandbox they run in) before starting a test process and prints
  "waiting for a test slot" when it has to wait; passes SIGINT/SIGTERM on to its child instead
  of swallowing them; reuses `DENO_DIR` from the environment instead of starting `deno info`.
- `packages/testing`: new `resolve.test.depth` and `acquire.test.slot` (+ tests);
  `create.sandbox` gains `slots`; `resolve.test.env` gains `depth`, sets `KUIB_TEST_DEPTH` and
  `KUIB_TEST_SLOTS`, and never forwards `KUIB_TEST_NESTED`.
- `journal/domains/infra/current.md`: draft claim `^test-bounds`; `^test-runner` and
  `^test-permissions` updated (all still `verified pending`).
- Also found: `--ignore=**/*.live.test.{ts,tsx}` did nothing — Deno's `--ignore` takes no
  braces, so live tests would have run under `test`. Now a comma list without braces
  (scratch run: the live file is skipped).
- A test caught a real hole: `KUIB_TEST_DEPTH=""` parsed as depth 0. Now only digits are a depth.

Verified: tsgo and eslint clean for `packages/testing` and `tooling`; `packages/testing`
through the runner under the guard (limit 12): 11 files, 49 steps ok; deno count 1 before and
after (the orchestrator's `orchestra watch`), no sandbox left in `/tmp`.

Next: `tooling/test.test.ts` (runner end to end: sandbox removed, remote host refused, live,
bench, empty project, bare `test.ts` not run, the three refusals, waiting for a slot). Then one
project, three, all, under the guard with `--parallel=2`.

## 2026-10-12 — HANDOFF: full state for the agent that continues (read this section first)

Stopped on the owner's instruction, at a clean point. Everything you need is here, in
`plan.md` (the design; where the brief's `## Go` differs, `## Go` wins) and in the brief.
Nothing is committed; no git writes are allowed.

### Done and verified

- **Cause of the out-of-memory kill** (see "pass 3" above): the runner is named `test.ts`,
  `deno test` with no file argument discovers a bare `test.ts`, so in `tooling/` the runner
  ran itself as a test, in an endless chain. Fixed and bounded, see below.
- **`packages/testing`** (`@kuib-ai/testing`), 14 units, 11 test files, 49 steps green through
  the runner: `acquire.test.slot`, `change.cwd`, `create.sandbox`, `create.socket.path`,
  `create.temp.dir`, `find.project.root`, `fixture.description`, `fixture.origin.enum`,
  `load.fixture`, `override.env`, `resolve.test.depth`, `resolve.test.env`,
  `resolve.test.permissions`, `test.kind.enum`; fixture `fixtures/greeting/`.
- **`tooling/test.ts`** (the one test command) and **`tooling/test.test.ts`** (10 steps green:
  sandbox removed, bare `test.ts` and live files not run under `test`, `--kind=live`,
  `--kind=bench`, remote host refused, empty project passes, the three refusals, waiting for a
  slot). Peak while it ran: 5 `deno` processes on the machine.
- **The bound** (resume steps 1–2): depth refusal, Nx refusal, 4 slots. Both tested, unit and
  end to end.
- **Scripts**: every project's `test` is `deno run -A ../../tooling/test.ts` (13 projects;
  `tooling` has `deno run -A test.ts`); engine and engine-service keep `deno test -A --no-check`
  (D004, do not touch). Root `package.json` has `test`, `test:live`, `bench`, `check`,
  `check:affected` (written in move 1), and keeps `test:llm` (Go 4).
- **`nx.json`**: `namedInputs` `testRunner`/`lintRules`, `test` inputs, `test:live`/`bench`
  uncached, `defaultBase: origin/master`.
- **Each project through the runner, one at a time, under the guard**: host-tui 3 steps, cli 0
  files, config 8, env 24, eslint-plugin-house-style 117, event-log-sqlite 11, protocol 0
  files, std ok, telemetry 3, tools 5, transcript 5, testing 49, tooling 10 — all exit 0.
  **daemon exits 1** (expected, see next steps). Through Nx: one project, then three
  (`testing`, `std`, `tooling`) — green, deno count back to 1, no sandbox left in `/tmp`.
- **Typecheck**: `nx run-many -t typecheck --parallel=2` green for all 16 projects, as left.
  eslint and prettier clean for `packages/testing` and `tooling/test*.ts`.

### Never run yet (written, unverified)

- `pnpm test` with nothing (all projects through Nx), `pnpm test --affected`,
  `pnpm test --coverage` (the coverage code in `tooling/test.ts` has never run),
  `pnpm test:live`, `pnpm bench`, `pnpm run check`, `pnpm run check:affected`.
- pnpm handing `--filter` and `--watch` through (Go 1). **Not checked.** See traps.

### Half done, by path

- `journal/domains/infra/current.md` — a `## Testing` section with seven draft claims, all
  `verified pending`: `^test-runner`, `^test-permissions`, `^test-bounds`, `^testing-helpers`,
  `^fixture-convention` describe code that exists; `^coverage-report` and `^push-hook-ci`
  describe things not built and quote lines that do not exist (`test:coverage`, `prepare`,
  `.githooks/pre-push`, `.github/workflows/check.yml`). `^nx-tasks`, `^check-pipeline` and
  `^eslint-config` still describe the old state. Because of this `pnpm journal check` fails
  now; that is expected until the last move. Nothing is stamped.
- `package.json` — `check` and `check:affected` already include `prettier --check .`, madge
  and `test`; no `prepare` script yet.
- `packages/env/package.json`, `packages/tools/package.json`, `packages/daemon/package.json` —
  only the `test` script was switched; the devDependencies of the plan are not added.
- `packages/env` tests still have the defect of P01-I01 (they pass under the runner only
  because the sandbox sets `TMPDIR`).
- `packages/daemon/src/procedure/read.file/index.test.ts` — modified in the working tree
  (an `afterEach` that removes its folders). Not by any move in this log; it was there when
  this session started. Read the diff before you rewrite that file.
- `AGENTS.md`, `.agents/skills/orchestrate/*`, `tooling/orchestra.ts`, `journal/roadmap/*` —
  carry other people's uncommitted edits. I have not edited `AGENTS.md` yet (its
  `packages/testing` row is generated).
- Nothing exists yet for: the lint rule, `.githooks/`, `.github/`, the AGENTS.md section.

### Next steps, in order

Before any run that starts more than one process, read "Traps" below.

1. **P01-I01, env tests.** Add `"@kuib-ai/testing": "workspace:*"` to `devDependencies` of
   `packages/env/package.json`, run `pnpm install`. In the seven test files under
   `packages/env/src/*/index.test.ts` replace every `process.env[x] = …` save/restore with
   `using _env = overrideEnv({...})`, every `mkdtempSync` with `using dir = createTempDir()`,
   every `process.chdir` with `using _cwd = changeCwd(path)`. Keep every step title (claims
   quote them). Verify as plan.md P01-I01 says.
2. **P02-I03, tools tests.** devDependencies `@kuib-ai/daemon` and `@kuib-ai/testing` in
   `packages/tools/package.json`; `read.file/index.test.ts` and `tool.spec/index.test.ts` run
   against `{ fs: Daemon.createDaemonCaller({}) }` (plan.md G002). Keep the two step titles.
3. **P02-I04, daemon.** devDependency `@kuib-ai/testing`. `ensureDaemon` returns the pid of
   the process it spawned, `undefined` when one was already listening (Go 5); its test ends
   that pid and waits for it to be gone. Every daemon test takes its socket from
   `createSocketPath()` and its folders from `createTempDir()`. Today six steps fail with
   `NotCapable: Requires net access to "unix:…"`, because they make their own socket paths
   under the temp folder: `server` (3 steps), `ensure.daemon` (1, plus an uncaught error from
   the spawn step), `ensure.local.daemon` (1), `resolve.daemon.endpoint` (1). Output of that
   run: `/var/tmp/kuib-test-setup/run-daemon.txt`. A daemon spawned by a test must also be
   told its socket path from the pool. Then rewrite the claim `core/ensure-daemon` in
   `journal/domains/core/current.md` and `pnpm journal stamp core/ensure-daemon`. Verify:
   `pgrep -f start.daemon/index.ts` gives the same list before and after two runs.
4. **Run all**, as resume step 4 says: one project, three, then `pnpm test`, each through the
   guard, with `NX_PARALLEL=2` in the environment, checking `pgrep -c -x deno` and `free -m`.
5. **P01-I04/I05, the gate.** `pnpm run check` green; `git status` identical before and
   after; check `--filter` and `--watch` through pnpm (Go 1) and write the result in the
   report. `--affected` once.
6. **P03-I01** the lint rule `require-unit-test` and its list (plan.md). **P03-I02** run
   `pnpm test --coverage`, quote the table in the report. **P03-I03** `.githooks/pre-push`,
   `.githooks/commit-msg` (forwards to the global hook of the same name in
   `~/.config/git/hooks` when it exists), root script
   `"prepare": "git config core.hooksPath .githooks || true"`, `.github/workflows/check.yml`
   (Go 6: the report says how another global hook would be forwarded and how to undo).
7. **P03-I04.** `AGENTS.md`: the gate line names tests; a Testing section (three kinds by file
   name, the commands, real modules only, the sandbox, the bound, fixtures, and Go 3: a test
   lives in the package whose behaviour it proves, lower packages are dev dependencies, no
   separate end-to-end project); "New packages include" gains the `test` script. Then
   `pnpm agents sync` (preview) and `pnpm agents sync --force`. Rewrite the claims named above
   so every one matches the code, remove quotes of lines that do not exist, `pnpm journal
   stamp infra/<claim>` for each, `pnpm journal build`, `pnpm journal check`.
8. `pnpm run check` twice (second run all cache hits), then `report.md` in the format of
   WORKER.md, then `pnpm orchestra done test-setup`.

The report must also say: `test:llm` stays, so that line of P01-I02 is open (Go 4); the slot
bound is per workspace, so a second worktree has its own four; what waits in the engine
(plan.md, "What waits in the engine"); the names below.

### Decisions I took that are not in plan.md or the brief

- Fixture description file is `fixture.json`, validated by `fixture.description`
  (`FixtureDescription`), with `fixture.origin.enum` (`recorded` / `written`).
- No `test:coverage` script: coverage is `pnpm test --coverage`. The draft claim
  `^coverage-report` still names the script; fix the claim, not the manifest.
- The runner has no subcommands (`run`, `coverage` of plan.md are gone): leading arguments are
  paths, everything from the first flag on goes to `deno test`, except `--affected`,
  `--coverage`, `--kind=test|live|bench`. Whole projects with no flag go through Nx (cached);
  a file, a folder, or any flag runs directly (uncached). Inside a project folder the runner
  always runs that project directly.
- `PROJECT_GRANTS` in `resolve.test.permissions`: daemon `run`+`bind`, tooling `run`, the two
  engine packages `all` (so a path inside them behaves like their own `-A` script).
- Go 8 is `--deny-read` of every `.env` and `.env.*` at the workspace root except
  `.env.example`; kind `live` has no such denial and gets `--env-file=<root>/.env`.
- The runner names the test files itself: `**/*.test.ts(x)`, live `**/*.live.test.ts(x)`,
  bench `**/*.bench.ts(x)`; a folder argument becomes those patterns under it.
- The bound. Variables: `KUIB_TEST_DEPTH` (set by the runner on every test process, one more
  than its own), `KUIB_TEST_NESTED=1` (the opt-in, honoured at depth 1 only, never passed to a
  test process), `KUIB_TEST_SLOTS` (the slot folder of a nested run: `slots` in the sandbox).
  Slots: 4 lock files under `node_modules/.cache/kuib-test-slots`, tried every 200 ms. The
  runner refuses to call Nx when `NX_TASK_TARGET_PROJECT` is set (Nx sets it on every task).
- The runner passes SIGINT and SIGTERM to its child; it used to swallow them.
- New claim `infra/test-bounds`. `check` keeps `--parallel=10`: the slots hold test processes
  to 4 whatever Nx does.

### Names introduced so far (for the report's Names section)

`acquire.test.slot` ↔ `acquireTestSlot` (no sibling for the verb `acquire`),
`resolve.test.depth` ↔ `resolveTestDepth` (mirrors `resolve.test.env`), `KUIB_TEST_DEPTH`,
`KUIB_TEST_NESTED`, `KUIB_TEST_SLOTS` (mirror `KUIB_TEST_SOCKETS`), sandbox field `slots`
(beside `sockets`), `fixture.description` ↔ `FixtureDescription`, `fixture.json`,
`find.project.root` ↔ `findProjectRoot` (mirrors `workspace.root` ↔ `findWorkspaceRoot`, whose
folder and function disagree), `resolve.test.env` ↔ `resolveTestEnv`, claim `^test-bounds`.
The rest are in plan.md "Names"; drop from that table what was not built (`fixture.manifest`,
`fixtures/manifest.json`, `test:path`, `test:affected`, `test:coverage`, commands `run` and
`coverage`).

### Traps

- **Never run `deno test` with no file argument in `tooling/`.** A bare `test.ts` (and
  `bench.ts`) is a test to Deno. The runner now passes explicit patterns, runs `main` only
  under `import.meta.main`, and refuses to start inside a test. Keep all three.
- **The guard.** `/var/tmp/kuib-guard.sh <max deno> <min MB available> -- <command>`; use
  `30 1500`, or `12 1500` for one project. It counts every `deno` on the machine: the
  orchestrator's `orchestra watch` is always one of them. If it kills a run, find out why;
  do not rerun unchanged. Normal peak here: 5. Nx: `NX_PARALLEL=2` or `--parallel=2`.
  `/tmp` and swap are RAM on this machine; scratch goes under `/var/tmp/kuib-test-setup`.
- **Do not `pkill -f <pattern>`** with a pattern that is in your own command line: it kills
  your own shell (it happened; no harm).
- **Slots.** A slot is an exclusive `flock` on a file, freed when the holder closes it or
  dies; the files stay, empty, on purpose. A nested runner must take its slot from
  `KUIB_TEST_SLOTS`, never from the workspace folder, or it deadlocks against its own parent.
  A test that holds slots must release them before it ends. If a run prints
  "waiting for a test slot" for long, four other test processes are alive: look with
  `pgrep -af "deno test"`.
- **`--ignore` takes no braces.** `--ignore=**/*.live.test.{ts,tsx}` ignores nothing; write
  `--ignore=**/*.live.test.ts,**/*.live.test.tsx`. An ignored file stays ignored even when a
  pattern names it.
- **pnpm and `--filter`: unchecked.** pnpm has its own `--filter`; it may take it even after
  the script name. Test `pnpm test packages/env --filter "walks up"` and
  `pnpm test packages/env --watch`. If pnpm keeps `--filter`, the fallback spelling
  `pnpm test packages/env -- --filter "walks up"` does **not** work yet: `parseRequest` strips
  `--` only when it is the first argument, so a later `--` would reach `deno test` and turn
  the filter into script arguments. Strip that `--` too, add a step to `tooling/test.test.ts`,
  and say so in the report.
- **Unix sockets are granted by exact path only** (Deno 2.9.6): a test must use
  `createSocketPath()`; any other socket path fails with `NotCapable`.
- **The test environment is clean**: only `PATH`, `HOME`, `TMPDIR`, `DENO_DIR`,
  `KUIB_TEST_*` and the colour/CI switches. `HOME` and `TMPDIR` are inside the sandbox, which
  is removed after the run. Tests cannot write anywhere else and cannot spawn (daemon and
  tooling excepted).
- **Environment values.** `process.env[x] = undefined` stores the string `"undefined"` (the
  cause of the red env test); `Number("")` is `0` (a test caught it in `resolve.test.depth`).
- **Lint.** In `tooling/` an unused `using _x = …` fails `no-unused-vars` (in `apps/` and
  `packages/` the `_` prefix is accepted). `tooling/test.ts` uses a `DisposableStack` for that
  reason. No `try` without the eslint directive used in `create.socket.path`; no prose
  comments; a new module in `packages/` starts with `// @claim infra/<claim>` and the claim
  must already exist in `journal/domains/infra/current.md`, or lint fails.
- **Tools.** Deno is `./node_modules/.bin/deno`; never `deno check`, `deno install`,
  `deno add`. Type-check one project with `cd <project> && ../../node_modules/.bin/tsgo
  --noEmit`. `perl` prints locale warnings here; they mean nothing.
- The four old `start.daemon` processes of the first pass are gone (they died with the
  session). There is nothing of ours running.

## 2026-10-12 — restart checkpoint after the HANDOFF (owner requested model change)

The owner asked this worker to stop at the next clean point, leave typecheck passing, write
this checkpoint, and mark `restart`. This section supplements the HANDOFF above; its remaining
steps and traps still apply. No git writes, sub-agents, or full multi-project test run occurred.

### Done and verified since HANDOFF

- Read WORKER.md, the complete brief (Go and both Resume sections), this log, the task plan,
  journal/SPEC.md, AGENTS.md, and the relevant existing tests/helpers/runner before editing.
- **P01-I01 env tests implemented.** In all seven
  `packages/env/src/{bootstrap.env,resolve.dir,resolve.dirs,resolve.platform.base,resolve.unix.base,resolve.windows.base,workspace.root}/index.test.ts`
  files, replaced manual environment save/restore with `overrideEnv`, temporary directories
  with `createTempDir`, and working-directory changes with `changeCwd`. Bootstrap's shared
  beforeEach/afterEach uses a `DisposableStack` so bootstrap-created environment values are
  restored too. All original step titles and expectations are retained. Every created
  directory is disposed, and assigning `undefined` back into process.env is gone.
- Added `@kuib-ai/testing` as a devDependency to env, daemon and tools, and
  `@kuib-ai/daemon` as a devDependency to tools. Ran `pnpm install` through the guard;
  workspace links and `pnpm-lock.yaml` updated successfully. No new third-party dependency.
- Formatted env source and those three package manifests with Prettier; non-test env source
  was reported unchanged. Env eslint passes.
- Guarded `NX_PARALLEL=2 pnpm test packages/env`: green through Nx (cache miss).
- Guarded original failing invocation in `packages/env`:
  `env -u TMPDIR -u TMP -u TEMP ../../node_modules/.bin/deno test -A --no-check 'src/**/*.test.ts'`:
  **7 files, 24 steps, all green**, with no DEP0104 warning. This is the explicit old-repro
  exception already approved in the plan; its temporary folders are disposed by the tests.
- At the owner's stop request, guarded
  `pnpm nx run-many -t typecheck --parallel=2`: **all 16 projects plus deno-types generate
  green** (9/17 tasks cached). Guarded `pnpm exec eslint packages/env/src`: green.
- Last process/memory observation: one `deno` (the existing watcher), 4807 MB available,
  no runner or test left running. Every multi-process command used `/var/tmp/kuib-guard.sh`.

### Half done by path and unchanged work

- `packages/env` implementation above is complete. The plan's additional invocation
  `pnpm --filter @kuib-ai/env test` has not been run in this worker; direct reproduction and
  the root project's Nx path have been verified. Full gate remains pending.
- `packages/tools/package.json`, `packages/daemon/package.json`, `pnpm-lock.yaml`: dependency
  changes installed, but **no tools or daemon TypeScript file was edited by this worker**.
- Read `packages/tools/src/{read.file,tool.spec}/index.test.ts`; both still have their
  filesystem stand-ins. Replace them with the real daemon caller next.
- Read daemon tests and `ensure.daemon`, `start.daemon`, `server`; no modifications yet.
  The pre-existing cleanup edit in `procedure/read.file/index.test.ts` was inspected:
  it collects `mkdtempSync` paths in `dirs` and removes them in `afterEach`. Preserve its
  cleanup intent when converting to disposable temp directories.
- `tooling/test.ts`, `tooling/test.test.ts`, `packages/testing`, `nx.json`, AGENTS.md, domain
  claims, hooks, CI, lint rule and coverage code were not changed in this worker. All unfinished
  items listed in the HANDOFF remain, except env changes and the dependency additions above.
- No claim was rewritten or stamped: env production scopes were not changed; cited test
  titles were kept. Draft infra claims and generated indexes still require the final move.
  `pnpm run check` has not been run; the known draft-source issues remain.

### Findings for the next worker

- `ensureDaemon` currently returns `Promise<void>` and spawns detached with
  `spawn(process.execPath, [entry], ...)`. The successful spawn test still substitutes its
  own `net.Server` after 40 ms and leaves the child behind. Go requires returning its pid;
  make the test exercise the actual daemon, terminate that pid and wait for it to disappear.
- The timeout test currently probes a socket under a path that is a file. This path cannot
  be used under exact-path socket permissions. One possible equivalent test setup is to
  create a directory at a path from `createSocketPath()`: probing that exact path cannot
  connect, and daemon startup's `rmSync(path, { force: true })` should reject the directory.
  This is an untested implementation idea, not a new decision or completed change.
- `start.daemon` bootstraps config and ensures application paths. Its child tests currently
  inherit cwd. Read the config behaviour before running children; a temp cwd / production
  environment may be needed to keep their paths inside the sandbox and avoid the real .env.
- `createDaemonServer` starts an optional TCP server but returns only the unix server;
  closing the returned server currently does not close the TCP server. This is an existing
  cleanup asymmetry observed while reading, not changed or investigated further.
- Socket paths for every daemon test must come from `createSocketPath()`; its disposal
  removes the path recursively and releases its claim directory.

### Next step

Continue HANDOFF step 2 (P02-I03): rewrite the two tools tests to use
`{ fs: Daemon.createDaemonCaller({}) }`, use a real temp file in the read-file test, retain
both cited titles, and verify tools tests/typecheck. Dependencies are already installed.
Then HANDOFF step 3: daemon pid return, cleanup and pooled sockets; rewrite/stamp
`core/ensure-daemon`. Continue remaining HANDOFF steps in order with the guard and Nx
parallelism 2. Check pnpm `--filter`/`--watch` forwarding; it is still unverified.

### Names in this worker

No new exported helper, module, command, or claim name. Existing `overrideEnv`, `createTempDir`
and `changeCwd` helpers are reused with their established names. Bootstrap's local
`resources` is a DisposableStack; `_env`, `_cwd` and disposable temp variables follow the
existing testing-package usage. The complete introduced-name list remains in HANDOFF/plan.

## 2026-10-12 — resumed: tools and daemon implementation

- Reread worker protocol, complete brief, HANDOFF and restart checkpoint, task plan, journal
  SPEC, runner and testing helpers. Following the latest checkpoint; no git writes or agents.
- P02-I03: both tools tests use `Daemon.createDaemonCaller({})`; the read-file step writes
  an actual disposable temp file and asserts content. Original cited titles retained.
  Guarded tools Nx test and typecheck green. No filesystem port stand-ins remain there.
- P02-I04 implementation in progress: `ensureDaemon` returns its spawned child's pid;
  socket tests use `createSocketPath`; read/write procedures use disposable folders;
  start-daemon children run from a disposable cwd to avoid workspace .env/config.
  The spawn test now exercises the real daemon and sends SIGTERM to the returned pid;
  timeout uses a directory at an exactly granted socket path. Formatted changed files.
- Next: guarded daemon test, investigate failures, verify no child remains across two runs,
  then reread/stamp core/ensure-daemon. Full gate, lint rule, coverage, hooks/CI, docs and
  claims still pending as in HANDOFF.

## 2026-10-12 — daemon verified, full tests green, lint rule drafted

- Guarded daemon direct run: 10 files / 26 steps green; guarded second Nx run green.
  No `start.daemon/index.ts` process before or after; `pgrep -c -x deno` returned 1.
- Rewrote core/ensure-daemon to describe pid / undefined returns and stamped it.
  The timeout directory setup works and its child exits by itself.
- Guarded one-project, then three-project run green; then full `pnpm test` with
  NX_PARALLEL=2: all 16 projects green, 5/16 cached, 7.9 s. Available memory 4712 MB
  afterwards; no guard kill. Scratch outputs in /var/tmp/kuib-test-setup.
- P03-I01 draft: `require.unit.test` detects functions/classes, exempts schema/type/barrel
  modules and test/bench/declaration files, checks sibling unit/live tests and validates
  stale entries at their literal lines in `untested.units`. Collected 15 actual existing
  missing modules by ESLint; no production module was modified to evade the rule.
  RuleTester covers missing behaviour, exemptions, allowlist removals and stale entries.
- Plugin lint inputs now include all project src files; bench files get existing test
  overrides. Next: format/typecheck/lint and tests for the rule, command forwarding,
  coverage, hooks/CI, then docs/claim reconciliation and full gate.
- Existing asymmetry retained for report: createDaemonServer returns unix server only;
  closing it does not close optional TCP server. No production change outside assigned pid.

## 2026-10-12 — lint rule green, commands verified, coverage and automation

- RuleTester for require-unit-test: 20 steps green. Scoped Nx typecheck/lint for plugin,
  daemon and tools green. Allowlist has 15 existing modules; its entries are source lines.
- `pnpm test packages/env --filter findWorkspaceRoot` runs exactly one suite / two steps;
  both --filter and --watch after the script name reach Deno. Watch completed all env
  steps and waited for changes; stopped deliberately with timeout/SIGINT (exit 124).
  The earlier filter `walks up` matched zero top-level suites; replaced the documented
  example with `findWorkspaceRoot`. No pnpm spelling fallback is needed.
- Coverage found two real defects: Deno clears a reused profile directory, so concurrent
  projects lost profiles; its coverage reporter needs each project's cwd for the matching
  transpilation cache. Runner now collects profiles sequentially into per-project folders,
  reports from each project, concatenates disjoint owned sources into total.lcov, and writes
  a workspace HTML index linking individual reports. Final coverage verification pending.
- Added `.githooks/pre-push`, `.githooks/commit-msg`, root prepare, GitHub workflow; chmod
  executable on hooks. Resumed low-memory instructions take precedence over plan's 10-way
  gate: root check/check:affected now use --parallel=2.
- Pinned pnpm 12.6.0 skipped prepare on unchanged installs even with
  optimisticRepeatInstall=false and explicit flags. Confirmed upstream issue #16545;
  removed the ineffective setting. Ran authorized `pnpm run prepare` to install this
  existing checkout's local `.githooks`; fresh-install verification remains.
- Workflow uses official documented checkout v7, pnpm/action-setup v6 and setup-node v7,
  Node 25.4.0, frozen install, full check, and fetch-depth 0. Sources for the report:
  https://github.com/actions/checkout, https://github.com/pnpm/action-setup,
  https://github.com/actions/setup-node, https://github.com/pnpm/pnpm/issues/16545.
- AGENTS.md Testing rules implemented (placement, kinds, helpers, bound, fixtures, lint,
  commands, exceptions, gate, hooks). Agent adapter sync preview/apply reports no changes.
- Reconciled draft infra claims and old Nx/gate/eslint/plugin/structure claims against code;
  build/check and final stamps in progress. No ineffective pnpm setting left behind.

## 2026-10-12 — blocked checkpoint (read this after the earlier HANDOFF)

The full gate reached a grant boundary. `pnpm journal check` and guarded `pnpm run check`
fail only on `host/host-runtime`: journal/domains/host/current.md quotes the host-tui test
script `deno test -A --no-check`, changed by move 1 to the runner. The grant excludes the
host domain. Per WORKER.md, report written and task marked blocked; stop. Owner/orchestrator
must extend grant to journal/domains/host/current.md or correct/stamp that claim themselves.
No host-domain edit, git commit/branch/worktree change, subagent or message was made.

Before stopping: final guarded full typecheck/lint passes all 34 scheduled tasks (17 projects
plus generate); 16 cached, 7.9 s. Stamped permitted implemented claims: infra nx-tasks,
check-pipeline, eslint-config, house-plugin, house-structure-rules, test-runner,
test-permissions, test-bounds, testing-helpers, fixture-convention and package-exports.
core/ensure-daemon was already stamped. Drift now 116/121 fresh: broken host-runtime,
unverified coverage-report/push-hook-ci, and two unrelated predecessor orchestra/workspace-tools
changes. Shell syntax of both hooks passes; local hooksPath is .githooks. Full gate cannot
be called green. Gate stops before formatting/project tasks; their final full checks remain.

Coverage is NOT VERIFIED. Latest source in tooling/test.ts uses per-project profiles,
sequential uncached Nx calls, reporter cwd per owning project, all profile dirs as report
inputs, total as concatenation of disjoint owned reports, and per-project HTML linked from
html/index.html. That fixed lost raw profiles and some cache problems, but final table still
has empty config/env/engine/tools/tooling rows despite real tests. Crucial read-only finding:
dist/coverage/raw/config/lcov.info (Deno's automatic report from its own test) has config
sources, whereas our final config.lcov is empty. Investigate multiple-profile input handling
and cache/transpilation context; do not accept the provisional 93.1% total or swallow report
errors. Scratch coverage.txt contains runs; draft coverage claim remains verified pending.
No code was changed after discovering the grant boundary, except recording reports/logs and
stamping already implemented permitted claims. Remaining work is listed in report.md.

Next, only after a new Resume/expanded grant:
1. Correct/stamp host-runtime (or verify owner's fix).
2. Fix coverage reporting with meaningful regression verification and rerun full coverage;
   quote only the final trustworthy table; stamp coverage-report.
3. Verify fresh-install prepare in a clean scratch checkout/snapshot and run actual pre-push
   gate. The pinned pnpm skips prepare on repeat installs even with optimisticRepeatInstall
   false (upstream #16545). That ineffective setting was removed. This checkout was installed
   by the explicit authorized pnpm run prepare. Report explains forwarding other global hooks
   and undoing local hooksPath. Stamp push-hook-ci only after actual verification.
4. Complete single-file/live/bench command matrix and fixture Nx invalidation experiment,
   then full non-writing check twice with second run all cache hits. Stop at any grant issue.
5. Update this report to done, then orchestra done. Do not touch feature plan or other tasks.

Changes since previous restart: tools real-module tests; daemon pooled sockets/disposable
folders/actual child pid cleanup; lint rule + 15-entry allowlist + tests + plugin inputs;
coverage reporter draft; prepare/hooks/workflow; AGENTS Testing rules; permitted claims/stamps.
Final pgrep count 2 is two pre-existing orchestra watchers, no test/runner/daemon child;
available memory 4875 MB. Continue using /var/tmp/kuib-guard.sh 30 1500, Nx parallelism 2,
and scratch under /var/tmp. report.md has complete introduced names and unchanged asymmetries.

## 2026-10-12 — grant expanded; task resumed

The orchestrator's new user message grants journal/domains/host/current.md and directs
rewriting/stamping host-runtime, with all other conditions unchanged. Corrected that claim
and its script quote to the shared sandbox runner, then stamped it. Continuing the blocked
checkpoint's remaining verification work; no other host claim changed.

## 2026-10-12 — coverage repair checkpoint before full verification

- Root cause confirmed with a one-project coverage run: its automatic lcov is valid, while
  later raw-profile conversion loses transpilation metadata. Aggregate now reads Deno's
  lcov.info emitted at each test's end, merges DA/BRDA/FNDA by source, and copies native HTML.
  Ownership filtering produces disjoint project reports; imported workspace code also counts
  toward its owning project. Missing reports/owned production coverage fail; no empty rows.
- Added tested pure merger in tooling/test.coverage.ts (3 regression steps pass: union hits
  without duplicate denominators, exclude non-owned/test/bench sources, missing report fails).
- Deno hard-excludes bare test.ts from coverage even with explicit filters. Kept tooling/test.ts
  as the unchanged CLI entry path, moved implementation to test.runner.ts, and instrumented
  the existing runner subprocess tests with Deno run --coverage. Each child immediately
  generates lcov/HTML from the owning tooling cwd; unknown stderr/errors fail. Normal generated
  report messages are displayed. Successful tooling-only coverage now reports real runner
  coverage (41.3% before the merger module extraction), not an empty tooling row.
- New modules are in tooling tsconfig and Nx testRunner inputs. No test scripts renamed, no
  nested-run bound relaxed. New KUIB_TEST_COVERAGE is set only for instrumented runs.
- Next in the owner's required order: full coverage and stamp; fixture cache invalidation;
  fresh-install hook under guard; final check twice. Continue guard + parallel=2.

## 2026-10-12 — TS002 verified and stamped

Full guarded pnpm test --coverage passes. Final table includes 15 measured workspace projects,
including tooling (56.8% lines / 64.3% branches) and protocol measured through imports; CLI
has no test or measured imported code. No empty line rows; branch dash means no branches.
Workspace 90.2% lines / 86.4% branches. Native per-run lcov+HTML all retained; merged reports
and workspace HTML exist under dist/coverage (401 MB on disk). No missing-transpilation or
coverage error text in successful log. Merger regression tests pass. Stamped
infra/coverage-report and infra/test-runner, and restamped host-runtime after grammar cleanup.
Full log is /var/tmp/kuib-test-setup/coverage.txt. Deno count 2 (watchers), 4670 MB available.
Next: P02-I02 fixture cache invalidation, then fresh install/hook, then full gate twice.

## 2026-10-12 — fixture cache invalidation verified

Guarded executable scratch /var/tmp/kuib-test-setup/fixture-check.mts primed the testing
project cache, appended a sentence to greeting/fixture.json's shows value and reran tests:
cache miss (0/1), green. Restored the exact original bytes and reran: cache hit (1/1), green.
Restoration is also in a finally block. Outputs fixture-{baseline,changed,restored}.txt.
Next: fresh-install hook verification, then final gate twice. The first guarded stdin-based
Node attempt executed no code because background guards detach stdin; use script files.

## 2026-10-12 — fresh install verified; hook running

Created an independent scratch clone at /var/tmp/kuib-test-setup/fresh-install, overlaid the
current tracked/untracked source snapshot (no node_modules, dist, .nx or ignored .env), then
ran frozen install under the guard. It completed successfully (403 ms with the existing pnpm
store); log explicitly shows root prepare and deno-types postinstall. Scratch local
core.hooksPath is .githooks, set automatically; no explicit prepare was run in the scratch
copy. The actual executable pre-push hook is now running check:affected there under the guard.
TS003 remains: unchanged repeat installs skip prepare in the pinned pnpm. Original repository
branch/worktree/index and global hook configuration were not changed. Snapshot test artifacts
remain under /var/tmp; logs fresh-install.txt and fresh-hook.txt.

## 2026-10-12 — P03-I03 verified, final gate next

Fresh installed executable pre-push hook passed check:affected (50 tasks, 1 cached, 23.5 s).
Then the fresh copy's full pnpm run check passed (50/50 cached); these are the workflow's
install/check commands, verified locally. Hosted GitHub Actions execution is still unverified
until the next push. Stamped infra/push-hook-ci, whose text explicitly limits prepare to fresh
installs and documents the pinned repeat-install limitation. Global commit-msg forwarding
verified with a temporary GIT_CONFIG_GLOBAL fixture: a path with spaces passed intact and
exit status 42 propagated; owner's global hook/config untouched.
Single-file env command passes (2 steps). Root test:live and bench commands checked; there
are no corresponding projects yet, so Nx exits successfully without tasks. One-project and
three-project guard checks precede the final full gates; current processes/memory are logged
in the tool output. No implementation work remains; final full check twice and report update.

## 2026-10-12 — final completion checkpoint

Both final guarded pnpm run check executions pass: each has 50/50 cached Nx tasks. Executable
scratch gate-check.mts compares SHA-256 and file modes of 781 source files, including generated
Deno declarations, before/after each run: no changed file in either run. Logs gate-{1,2}.txt
and gate-{1,2}-files.json. No implementation edit occurred after these checks.

Report.md updated in place to Status done; Blocked on is None. It includes final coverage
(table 90.2% lines / 86.4% branches, all 15 measured projects), fixture invalidation, fresh
install + actual hooks + local CI command checks, names and engine exceptions. TS003 and TS004
are explicitly retained. Final deno count 1 is the owner's watcher; 4680 MB available, no
spawned test daemon or runner. Only unrelated infra/orchestra and infra/workspace-tools claims
await their owners. Host/host-runtime and all this task's infra/core claims are stamped.

No commit or push; no owner branch/worktree/index/global-hook changes. Local hooksPath and
scratch clone were authorized verification actions. Next: mark test-setup done and stay idle.
