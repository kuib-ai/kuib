# test-setup — plan

Nothing in the repository has been changed. Everything marked "verified" below was reproduced
with read-only runs; the evidence is in `log.md`. Points that need a ruling are in
[Undecided](#undecided); each has the default I will follow if GO says nothing about it.

## The shape in one page

- **One runner, `tooling/test.ts`.** Every project's `test` script calls it. It finds the
  project that owns the given path, creates a sandbox folder, starts `deno test` there with
  explicit permissions and a clean environment, and removes the sandbox afterwards.
- **One definition of the permissions**, in the new package `packages/testing`, as a tested
  unit the runner imports (G001).
- **`packages/testing` (`@kuib-ai/testing`)** also holds the helpers test files import: a temp
  folder, an environment and a working directory that are restored, a socket path, a fixture
  loader. Helpers are disposables, used with `using`, so they restore even when a test throws.
- **Three kinds by file name:** `index.test.ts` → `test`; `index.live.test.ts` → `test:live`;
  `index.bench.ts` → `bench`.
- **Gate:** root checks, `prettier --check .`, madge, then `typecheck lint test` through Nx.

## Cause of the failing `packages/env` tests

`resolve.windows.base/index.test.ts`, step "falls back to TEMP for runtime", saves
`process.env["TEMP"]` (unset, so `undefined`) and restores it with
`process.env["TEMP"] = prevTemp`. Assigning `undefined` stores the string `"undefined"`.
`os.tmpdir()` returns `TMPDIR || TMP || TEMP || "/tmp"`, so from then on it returns
`"undefined"`. `workspace.root/index.test.ts` runs later in the same process and fails with
`ENOENT: no such file or directory, mkdtemp 'undefined/wsroot-XXXXXX'`. Alone, that file never
sees the polluted variable. With `TMPDIR` set the package passes, which is why it looks
intermittent. The same restore defect is in every `process.env[x] = prev` line of that package
(Deno prints DEP0104 for each); `TEMP` is the only one that breaks a later test.

None of the env tests removes the temp folders it creates, and `resolve.dir` and
`resolve.dirs` skip their `chdir` restore when an expectation throws.

## G001 — where the permissions are defined

`packages/testing/src/resolve.test.permissions/index.ts`: one function from (kind, project
name, sandbox) to the Deno flags, plus one table of per-project additions. Nothing else in the
workspace spells a permission flag. No `deno.json`.

Sandbox, created per run under the OS temp folder (short paths, for the unix socket length
limit) and removed on exit:

```
<os tmp>/kuib-test-XXXXXX/
  home/      HOME of the test process
  tmp/       TMPDIR of the test process
  s/0 … s/15 the socket paths a test may use
```

Flags for `test` (kind `test`):

| Flag | Why |
|---|---|
| `--no-check` | tsgo is the type-checker |
| `--no-prompt` | a missing permission fails, never asks |
| `--permit-no-files` | a project with no tests passes |
| `--ignore=**/*.live.test.ts` | live tests are not unit tests |
| `--allow-read` | reading is unrestricted |
| `--allow-env` | the environment |
| `--allow-sys` | OS facts: `homedir` (env), `hostname` (pino in std), `uid` (config) |
| `--allow-write=<sandbox>` | writing only inside the sandbox |
| `--allow-net=127.0.0.1,localhost,[::1],unix:<sandbox>/s/0,…,unix:<sandbox>/s/15` | loopback and the test's own sockets; any other host is refused before a packet leaves |

Environment of the test process: only `PATH`, `HOME`, `TMPDIR`, `DENO_DIR` (the real cache,
read from `deno info --json`, so nothing is recompiled), `KUIB_TEST_SOCKETS`, and
`NO_COLOR`/`FORCE_COLOR`/`TERM`/`CI` when set. A test cannot pass because of a variable in
someone's shell, and `~` and the XDG defaults resolve inside the sandbox.

Per-project additions (the table):

| Project | Addition | Why |
|---|---|---|
| `@kuib-ai/daemon` | `--allow-run`; `[::]` and `0.0.0.0` in `--allow-net` | spawns `start.daemon` and a shell (`executeCommand`); `createDaemonServer(socket, port)` listens on all interfaces |
| `@kuib-ai/tooling` | `--allow-run` | the runner's own test starts the runner |

Every other project passes on the base set (verified for env, std, config, telemetry,
transcript, event-log-sqlite, eslint-plugin-house-style, tools, host-tui, protocol, cli).

Kind `live`: `deno test` on `**/*.live.test.ts` with the base set, `--allow-net` unrestricted,
the caller's environment, and `--env-file=<root>/.env` when that file exists. Kind `bench`:
`deno bench` with the base set.

Why a fixed pool of socket paths: Deno 2.9.6 grants unix sockets by exact path only (verified:
no folder, prefix or wildcard form is accepted). The alternative is `--allow-net` with a deny
list of every non-loopback range; it is a deny list, and I could not confirm it holds for
`fetch`. See U3.

## G002 — what the tools tests run against

The daemon's own caller. `Daemon.createDaemonCaller({})` has `readFile` and `readDir` with the
port's exact signatures, so `const ctx: ToolContext = { fs: Daemon.createDaemonCaller({}) }`
type-checks (verified with tsgo) and `Tools.readFile` returns the real content of a file in a
temp folder under the base permissions (verified). **P02-I03 can be done without the engine.**
`tools` gains `@kuib-ai/daemon` as a devDependency; `daemon` does not depend on `tools`, so no
cycle. A method added to the port needs no change in these tests; a method the daemon lacks
fails typecheck there, which is the real gap.

## Items

### P01-I01 — the red test

- `packages/env/package.json`: devDependency `@kuib-ai/testing`.
- `packages/env/src/{bootstrap.env,resolve.dir,resolve.dirs,resolve.platform.base,resolve.unix.base,resolve.windows.base,workspace.root}/index.test.ts`:
  every environment change through `overrideEnv`, every temp folder through `createTempDir`,
  every `chdir` through `changeCwd`. Step titles stay as they are (claims cite them).
- Verify: `pnpm nx test @kuib-ai/env --skip-nx-cache` and `pnpm --filter @kuib-ai/env test`
  green; the old failing invocation green
  (`env -u TMPDIR -u TMP -u TEMP deno test -A --no-check` in `packages/env`; this one run puts a
  few folders in `/tmp` for milliseconds, which the fixed tests remove); no `wsroot-*`/`env-*`
  folder and no DEP0104 line left.

### P01-I02 — the same targets in every project

- `test` script `deno run -A ../../tooling/test.ts run` in: `apps/host-tui`,
  `packages/{cli,config,daemon,env,eslint-plugin-house-style,event-log-sqlite,protocol,std,telemetry,testing,tools,transcript}`;
  `tooling/package.json` gets `deno run -A test.ts run`.
- `packages/deno-types` (one generated declaration file) and `packages/tsconfig` (JSON only)
  hold no TypeScript to test and get no target.
- `test:live` (`… run --kind=live`) and `bench` (`… run --kind=bench`) are added to a project
  when it gains such a file. Today no project outside the engine has a live test and none has
  a benchmark, so no project gets either script now; the runner supports both and its test
  covers both.
- `nx.json`: `test:live` and `bench` with `"cache": false`; `test` stays cached with inputs
  `default`, `^default`, the runner (`tooling/test.ts`, `packages/testing/src/**`) and
  `deno --version`.
- Root `package.json`: `test:llm` removed (see U1); `test:live` → `nx run-many -t test:live`;
  `bench` → `nx run-many -t bench`.
- Verify: `pnpm nx show projects --withTarget test` lists every project above plus the two
  engine packages; `pnpm test` green; a second run is all cache hits; `pnpm test:live` and
  `pnpm bench` exit 0.

### P01-I03 — permissions instead of `-A`

- `packages/testing/src/resolve.test.permissions`, `create.sandbox`, `test.kind.enum` and
  `tooling/test.ts` as described under G001. `tooling/package.json` gains `@kuib-ai/testing`
  and, for its test, `@std/testing` and `@std/expect`; `tooling/tsconfig.json` includes the two
  new files.
- Verify: `packages/testing/src/resolve.test.permissions/index.test.ts` asserts, from inside a
  `test` run, with `Deno.permissions.querySync` (no I/O): net to a remote host not granted,
  loopback granted, write outside the sandbox not granted, run not granted.
  `tooling/test.test.ts` writes a tiny project into a temp folder and starts the runner on it:
  a unit test that fetches a remote host must fail with "Requires net access" (refused before
  anything is sent), the same check as `index.live.test.ts` under `--kind=live` must find the
  permission granted (state query only, no request), an `index.bench.ts` must run under
  `--kind=bench`, a project with no test file must exit 0, and the sandbox folder must be gone
  afterwards.

### P01-I04 — the gate

- Root `package.json` `check`: the three root checks as today, then `prettier --check .`, then
  `pnpm run check:circular`, then `nx run-many --parallel=10 -t typecheck lint test`.
- The per-project `format` scripts (`prettier --write .`) stay for writing and leave the gate
  (see U5). `.prettierignore` gains `packages/deno-types/index.d.ts` (path outside the grant,
  see below).
- Verify: `pnpm run check` green; `git status` identical before and after it; a deliberately
  misformatted scratch file makes it fail and is not rewritten.

### P01-I05 — running a part

| What | Command |
|---|---|
| everything, cached | `pnpm test` |
| the affected projects | `pnpm test:affected` (`nx affected -t test`, base `origin/master`) |
| one project, cached | `pnpm nx test @kuib-ai/env` |
| one file | `pnpm test:path packages/env/src/workspace.root/index.test.ts` |
| one test by name | `pnpm test:path packages/env --filter "walks up"` |
| watch a project | `pnpm test:path packages/env --watch` |

`test:path` → `deno run -A tooling/test.ts run`: a file or folder anywhere in the workspace,
run directly in its project, uncached; every flag is passed to `deno test` untouched.
Documented in `AGENTS.md`. Verify: each command run once, output recorded in the report.

### P02-I01 — the testing package

`packages/testing` (`package.json`, `tsconfig.json`, `src/index.ts` default-exporting
`Testing`), each unit with its test beside it:

| Unit | What it does |
|---|---|
| `create.temp.dir` | makes a temp folder (optionally under a given parent); removes it on dispose |
| `override.env` | snapshots the whole environment, applies the given values (`undefined` deletes), restores the snapshot exactly on dispose, including variables the unit under test added |
| `change.cwd` | changes the working directory; restores it on dispose |
| `create.socket.path` | hands out one of the sandbox's socket paths; frees it and removes the socket file on dispose |
| `load.fixture` | loads a declared fixture (P02-I02) |
| `fixture.manifest`, `fixture.origin.enum` | the manifest schema and its `recorded`/`written` enum |
| `create.sandbox`, `resolve.test.permissions`, `test.kind.enum` | what the runner uses (G001) |

No stand-in for any module of the codebase. Dependencies: `zod`; dev: `@std/testing`,
`@std/expect`, `@types/node`, the workspace `tsconfig` and `deno-types`.

### P02-I02 — one fixture convention

- `<project>/fixtures/` beside `src/`, data files only, plus `fixtures/manifest.json`: one
  entry per file with `shows` (a sentence) and `origin` (`recorded` or `written`).
- `Testing.loadFixture(import.meta.url, "name.ext")` finds the owning project and fails when
  the file is not in the manifest, when a manifest entry has no file, or when a file in
  `fixtures/` has no entry. The convention is enforced where fixtures are used.
- Nx: `default` is every file of the project, so `fixtures/**` is already an input of `test`.
  Verify: change a byte in `packages/testing/fixtures/…` and `pnpm nx test @kuib-ai/testing` is
  a cache miss; revert and it is a hit.
- First fixture: `packages/testing/fixtures/`, used by the loader's own test. The failing cases
  (undeclared file, entry without a file) are built in a temp folder by that test.
- Written in `AGENTS.md`.

### P02-I03 — tests stop declaring their own file system

- `packages/tools/package.json`: devDependencies `@kuib-ai/daemon`, `@kuib-ai/testing`.
- `packages/tools/src/read.file/index.test.ts`: writes a file in a temp folder and runs the
  tool against `{ fs: Daemon.createDaemonCaller({}) }`; expects the content.
- `packages/tools/src/tool.spec/index.test.ts`: the same context; no port literal.
- The two step titles the core claims cite are kept.
- Verify: `grep -rn FileSystemPort packages/tools/src --include='*.test.ts'` is empty; tests
  green; typecheck green.

### P02-I04 — spawned processes are reaped

- `packages/daemon/src/ensure.daemon/index.ts`: returns the pid of the process it spawned, and
  `undefined` when a daemon was already listening (see U2). The existing test already expects
  `undefined` for that case.
- `packages/daemon/src/ensure.daemon/index.test.ts`: ends the returned pid and waits until it
  is gone. The timeout step's child exits by itself (verified: only the spawn step leaks).
- All daemon tests: sockets from `createSocketPath`, folders from `createTempDir`;
  `procedure/read.file` uses a folder under the sandbox home and removes it.
- `packages/daemon/package.json`: devDependency `@kuib-ai/testing`.
- Verify: `pgrep -f start.daemon/index.ts` before, `pnpm nx test @kuib-ai/daemon
  --skip-nx-cache` twice, `pgrep` again: same list.

### P03-I01 — a unit that exports behaviour has a test beside it

- `packages/eslint-plugin-house-style/src/rules/require.unit.test/index.ts` + test, registered
  in `src/index.ts` and set to `error` in `recommended`.
- **Behaviour** means: the module contains a function or a class. Type-only modules, enums,
  plain schemas and barrels contain neither and are exempt without a list of exemptions (U6).
- **A test beside it** means `<stem>.test.ts(x)` or `<stem>.live.test.ts(x)` in the same folder.
- **Stored:** `packages/eslint-plugin-house-style/src/untested.units/index.ts`, a default
  export of workspace-relative paths, one per line (about 16 today: cli 2, config 2, daemon 1,
  engine 1, env 3, protocol 1, std 3, tools 1, host-tui 2).
- **Checked** by the same rule in two places: on a unit, it fails when the unit has behaviour,
  no test, and is not listed; on the list file itself, it fails on each entry whose file no
  longer exists, now has a test, or no longer has behaviour, and reports at that entry's line.
  So an entry can only be removed.
- `nx.json`: `lint` inputs gain `eslint.config.ts` and the plugin's `src/**` (today a rule
  change does not invalidate any lint cache). The plugin project's own `lint` also takes every
  `apps/*/src/**` and `packages/*/src/**` as input, so the check of the list reruns when any
  unit changes.
- `eslint.config.ts`: test, live-test and bench files keep the three rules off that test files
  have off today.
- Verify: rule tests with `RuleTester` over units the test writes into a temp folder (the rule
  takes the list and the workspace root as options, so the test passes its own);
  `pnpm nx run-many -t lint` green; adding a bogus entry, and deleting a real one, each make
  lint fail.

### P03-I02 — a coverage report

- `pnpm test:coverage` → `deno run -A tooling/test.ts coverage`: runs every project's `test`
  uncached with `--coverage=<root>/dist/coverage/raw` (the engine's untouched script accepts
  the flag too), then writes `dist/coverage/<project>.lcov`, `dist/coverage/total.lcov` and
  `dist/coverage/html/`, and prints one table: project, lines, branches, and a workspace total.
  `dist` is already git-ignored. No floor, no exit code from the numbers.
- Verify: run it; the table and the files exist; the report quotes the table.

### P03-I03 — a hook and CI

- `.githooks/pre-push` (three lines of `sh`): `exec pnpm run check:affected`.
  `check:affected` is `check` with `nx affected` in place of `nx run-many`.
- **Installed without a manual step:** root `package.json`
  `"prepare": "git config core.hooksPath .githooks || true"`, which pnpm runs on every
  `pnpm install`. See U4: this machine has a global `core.hooksPath`.
- `.github/workflows/check.yml`: on `push` and `pull_request`; `ubuntu-latest`;
  `actions/checkout`, `pnpm/action-setup` (version from `packageManager`), `actions/setup-node`
  with Node 25.4.0 and the pnpm cache, `pnpm install --frozen-lockfile` (this provisions Deno
  and generates the Deno types), `pnpm run check`.
- Verify: `git push --dry-run` is not a test of the hook, so: run `.githooks/pre-push` by hand
  and see it run the affected gate; `git config core.hooksPath` after `pnpm install`. The
  workflow cannot run here; I verify its commands in a clean `git clone` under `/var/tmp`
  (install, then `pnpm run check`) and say in the report that its first real run is the
  owner's next push.

### P03-I04 — the rules are written down

- `AGENTS.md`: the gate line names tests; a "Testing" section with the three kinds, the
  commands of P01-I05, the real-modules rule (D002), the sandbox, the fixture convention; "New
  packages include" gains the `test` script. Then `pnpm agents sync` (preview), `--force`.
  `AGENTS.md` and `.agents/skills/orchestrate/*` already carry someone else's uncommitted
  edits; I add to them and report anything the sync changes that is not mine.
- `journal/domains/infra/current.md`: `code:` gains `packages/testing/**`, `.github/**`,
  `.githooks/**`; rewrite and stamp `^nx-tasks`, `^check-pipeline`, `^eslint-config`,
  `^house-plugin` (fourteen rules) and `^house-structure-rules` (a row for the new rule); new
  claims `^test-runner`, `^test-permissions`, `^testing-helpers`, `^fixture-convention`,
  `^coverage-report`, `^push-hook-ci`. `^bootstrap-env` keeps its test titles and is unchanged.
- Verify: `pnpm journal check`, `pnpm journal drift` shows none of mine stale,
  `pnpm agents check`, `pnpm run check`.

## Order of moves

1. `packages/testing` with its helpers and tests; `tooling/test.ts`; `nx.json`; catalog/lockfile
   via `pnpm install`. Run the testing package through the runner.
2. Switch each project's `test` script, one at a time, running it after each (P01-I02, I03).
3. env tests (P01-I01), tools tests (P02-I03), daemon tests and `ensureDaemon` (P02-I04).
4. The gate and the root scripts (P01-I04, I05).
5. The lint rule and its list (P03-I01). Coverage (P03-I02). Hook and workflow (P03-I03).
6. `AGENTS.md`, adapters, claims, stamps (P03-I04). Full `pnpm run check`, twice, with the
   process and `git status` comparisons. Report.

## Dependencies and paths

**New third-party dependencies: none.** One new workspace package, `@kuib-ai/testing`, added as
`workspace:*` to env, daemon, tools and tooling; `@kuib-ai/daemon` added to tools as a
devDependency. `pnpm-lock.yaml` changes only by workspace links. `lint-staged` stays unused.

**Paths I need that the grant lacks:**

| Path | For | Without it |
|---|---|---|
| `.prettierignore` | one line, `packages/deno-types/index.d.ts`; the generated file is the only thing `prettier --check .` fails on today | I put `'!packages/deno-types/index.d.ts'` in the root script instead |
| `journal/domains/core/current.md` | rewrite and stamp `^ensure-daemon` after the pid return (U2); restamp any core claim the daemon and tools edits flag | I take the fallback of U2 and report the flagged claims unstamped |
| `journal/_index.md` | generated by `pnpm journal build`; `journal check` fails when it does not match after claims are added | blocked at P03-I04 |

## What waits in the engine (D004)

- `packages/engine` and `packages/engine-service` keep `deno test -A --no-check`: no sandbox,
  no permission limit, real HOME. Both still run in the gate and pass.
- `packages/engine/src/provider/live.test.ts` stays a `.test.ts` gated by `KUIB_LLM_TESTS`; on
  release it becomes `index.live.test.ts` under a `test:live` script.
- `packages/engine/src/provider/build.tools` restates `FileSystemPort`; the in-memory event log
  is a second implementation used by five test files; one test drives the loop with the AI
  SDK's mock model.
- `packages/engine-service` tests open unix sockets under the temp folder and will need
  `createSocketPath`.
- `packages/engine/src/daemon.file.system` is in the list of untested units.

Outside the engine but outside my grant: the tests of config, std, telemetry, transcript,
event-log-sqlite and host-tui keep their ad hoc temp folders (`mesh-config-*` and the like).
They no longer leak, because the runner removes the sandbox; moving them to the helpers is a
follow-up.

## Names

| New name | Mirrors |
|---|---|
| `@kuib-ai/testing`, `packages/testing`, namespace `Testing` | `@kuib-ai/env` / `packages/env` / `Env` |
| `create.temp.dir` ↔ `createTempDir` | `create.console.logger` ↔ `createConsoleLogger` (std) |
| `create.socket.path` ↔ `createSocketPath`, `create.sandbox` ↔ `createSandbox` | same |
| `resolve.test.permissions` ↔ `resolveTestPermissions` | `resolve.app.paths` ↔ `resolveAppPaths` (config) |
| `load.fixture` ↔ `loadFixture` | verb-first unit; **no sibling for `load`** |
| `override.env` ↔ `overrideEnv` | `bootstrap.env` ↔ `bootstrapEnv` for the noun; **no sibling for `override`** as a verb (`config.overrides` is the noun) |
| `change.cwd` ↔ `changeCwd` | **no sibling** |
| `test.kind.enum` ↔ `TestKindEnum` (`TEST`/`LIVE`/`BENCH` = `"test"`/`"live"`/`"bench"`) | `log.level.enum` ↔ `LogLevelEnum` |
| `fixture.origin.enum` ↔ `FixtureOriginEnum` (`RECORDED`/`WRITTEN`) | same |
| `fixture.manifest` ↔ `FixtureManifest` | `kuib.config.file` ↔ `KuibConfigFile` |
| `fixtures/`, `fixtures/manifest.json` | **no sibling** |
| `index.live.test.ts`, `index.bench.ts` | `index.test.ts` |
| `tooling/test.ts`, commands `run`, `coverage` | `tooling/journal.ts`, commands `check`, `build` |
| `tooling/test.test.ts` | **no sibling** (first test in `tooling/`; the name is awkward but follows `<file>.test.ts`) |
| scripts `test:affected`, `check:affected`, `test:path`, `test:coverage`, `test:live`, `bench` | `format:modified`, `check:circular` (target, then scope) |
| rule `require-unit-test` ↔ `require.unit.test` ↔ `requireUnitTest` | `require-context-link` ↔ `require.context.link` ↔ `requireContextLink` |
| `untested.units` ↔ `untestedUnits` | **no sibling** (first data module in the plugin) |
| `KUIB_TEST_SOCKETS` | `KUIB_DAEMON_SOCKET` |
| `.githooks/pre-push`, `.github/workflows/check.yml` | git and GitHub fix both; `check` mirrors the root script |
| claims `^test-runner`, `^test-permissions`, `^testing-helpers`, `^fixture-convention`, `^coverage-report`, `^push-hook-ci` | `^nx-tasks`, `^check-pipeline` |

Existing asymmetries noticed, left alone: `workspace.root` ↔ `findWorkspaceRoot`, `server` ↔
`createDaemonServer`, `tool.spec` ↔ `defineTool` (folder and function disagree); the runner
does not use `Cli.parseCli` like its siblings in `tooling/`, because it passes unknown flags
to Deno untouched.

## Undecided

- **U1 — `test:llm` and the engine.** P01-I02 removes the root script that names the live
  test, but D004 forbids giving the engine a `test:live` script. Default: remove `test:llm`
  now; until the engine is released its one live test runs by the direct command, which the
  report gives. Alternative: keep `test:llm` until then and leave that line of P01-I02 open.
- **U2 — `ensureDaemon` returns the pid.** A small change to product code in the core domain,
  so that the test can end what it started. Default: do it (needs
  `journal/domains/core/current.md`). Fallback with no product change: the test asks the
  spawned daemon, through its own `executeCommand`, to end its parent process. It works but
  is a trick.
- **U3 — a pool of 16 socket paths.** Forced by Deno granting unix sockets by exact path.
  Default: the pool, reached only through `createSocketPath`. Alternative: `--allow-net` with a
  deny list of non-loopback ranges, which lets tests use any socket path but is unproven for
  `fetch`.
- **U4 — the owner's global git hooks.** `core.hooksPath` is set globally to
  `~/.config/git/hooks`, which holds a `commit-msg`. A repository-level `core.hooksPath`
  replaces it for this repository. Default: also add `.githooks/commit-msg`, which runs the
  global `commit-msg` when one exists, so nothing the owner has stops running. Alternative: no
  forwarding, or no `prepare` at all and a documented one-line install.
- **U5 — the format check is one root `prettier --check .`** (2.5 s), not a per-project Nx
  target, because the engine's `package.json` cannot gain a checking script. The per-project
  `format` scripts keep writing and are no longer part of the gate.
- **U6 — "behaviour" is "contains a function or a class".** Simple to explain and to check.
  It lists a port that happens to hold a function (one in `protocol`) and exempts wiring with
  no function of its own (`daemon.caller`).
- **U7 — a clean environment for `test`.** Stricter than the plan asks. Default: keep it; all
  eleven projects already pass under it.
- **U8 — the pre-push base is `origin/master`** (`defaultBase` in `nx.json`), and the affected
  gate still runs the root checks, the format check and madge in full (about 5 s).
- Not mine to fix, for the orchestrator: four `start.daemon` processes left by earlier runs are
  alive on this machine (pids 48452, 963966, 966072, 967808). `pnpm reload` clears them.
