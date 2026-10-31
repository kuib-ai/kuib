# test-setup — report

Status: done

## Summary

Testing is in the non-writing workspace gate. The shared runner gives projects cached Nx
execution, direct file/folder execution with the same sandbox, offline permissions and
bounded nesting/concurrency. Tools tests use the real daemon, daemon tests reap spawned
processes, fixtures describe themselves, and lint requires tests beside new behaviour.
Coverage, fresh-install hooks, CI configuration and the testing instructions are implemented
and verified locally. Both final `pnpm run check` runs pass, with 50/50 cached tasks and no
source file rewritten. The engine exceptions remain as the brief requires.

## Files

- `packages/testing/**` — disposable helpers, shared permissions/environment/bounds, fixture
  loader and greeting fixture; tests beside its units.
- `tooling/test.ts` — retained CLI entry; `tooling/test.runner.ts` — implementation, moved out
  of the bare test.ts filename that Deno excludes from coverage.
- `tooling/test.coverage.ts` / `test.coverage.test.ts` — LCOV merger and three regression cases
  for source ownership, hit/denominator union and missing reports.
- `tooling/test.test.ts` — real subprocess runner tests; instrumentation measures subprocess
  implementation during coverage runs, with immediate reports from the tooling cwd.
- Root/project package manifests, lockfile, `tooling/tsconfig.json`, `nx.json`,
  `.prettierignore` — scripts, workspace dependencies, source/type/cache inputs and gate.
  No new third-party dependency. Engine and engine-service files are untouched.
- `packages/env/src/*/index.test.ts` — disposable env/cwd/temp fixes from the predecessor;
  verified again here.
- `packages/tools/src/{read.file,tool.spec}/index.test.ts` — real daemon caller and temp file.
- `packages/daemon/src/ensure.daemon/index.ts` — returns spawned pid, undefined for an existing
  daemon; tests use exact pooled socket paths, disposable directories and actual child cleanup.
- `packages/eslint-plugin-house-style/src/{rules/require.unit.test,untested.units}/**`, plugin
  index/manifest, `eslint.config.ts` — tested rule, 15-entry existing-gap list, stale-entry
  rejection, recommended registration, global-source lint inputs and benchmark overrides.
- `.githooks/{pre-push,commit-msg}`, `.github/workflows/check.yml`, `AGENTS.md` — installed
  affected gate, global-hook forwarder, full CI gate and testing rules. Adapter sync preview
  and apply both reported no changes.
- `journal/domains/{infra,core,host}/current.md` — truthful claims and stamps. Host grant was
  expanded explicitly by the orchestrator; only host-runtime changed there.

## Plan updates (for the orchestrator)

- P01-I01 → verified: env restoration and the original failure reproduction pass.
- P01-I02 → verified with the explicitly approved exception: `test:llm` stays; its removal
  line remains open until engine release. All current test targets run; empty projects pass.
- P01-I03 → verified: scoped permissions/clean environment and remote refusal; engine scripts
  retain their permitted exception.
- P01-I04 → verified: full gate twice; source contents/modes unchanged; all cache hits second run.
- P01-I05 → verified: all, affected, project, file/folder, filter and watch paths.
  pnpm forwards --filter and --watch after the script name; no alternate spelling required.
- P02-I01 → verified: testing helpers, sandbox and bounds.
- P02-I02 → verified: loader/description cases and fixture miss/change/restore cache experiment.
- P02-I03 → verified: real daemon caller replaces filesystem stand-ins; tools tests/typecheck pass.
- P02-I04 → verified: daemon tests pass twice without a daemon child left behind.
- P03-I01 → verified: RuleTester and full workspace lint pass; removing a needed allowlist
  entry and adding missing/tested/behaviour-free entries are covered by invalid cases.
- P03-I02 → verified: all 15 measured projects present, no empty rows or suppressed reporter
  errors; native reports aggregated without stale-cache conversion; real tooling subprocess
  coverage included.
- P03-I03 → verified locally: fresh frozen install runs prepare, installed pre-push passes,
  forwarding preserves arguments/exit status, workflow install/check commands pass in scratch.
  Hosted GitHub Actions execution awaits the next push.
- P03-I04 → verified: docs, adapters, claims, journal and final gate.

## Journal

Rewritten/reverified and stamped: `core/ensure-daemon`; `host/host-runtime`;
`infra/nx-tasks`, `infra/check-pipeline`, `infra/eslint-config`, `infra/house-plugin`,
`infra/house-structure-rules`, `infra/test-runner`, `infra/test-permissions`,
`infra/test-bounds`, `infra/testing-helpers`, `infra/fixture-convention`,
`infra/package-exports`, `infra/coverage-report`, `infra/push-hook-ci`.

The earlier host-runtime blocker is resolved. Only pre-existing unrelated changes to
`infra/orchestra` and `infra/workspace-tools` remain for their owner; this task did not stamp
those edits. No feature plan, roadmap item, other task, owner branch or worktree was modified.
No commit or push. Local hooksPath and the independent scratch clone were explicitly authorized.

## Verification

All multiprocess runs used `/var/tmp/kuib-guard.sh`; no guard kill. Nx uses parallelism 2.

- Final root `pnpm run check`, twice: green; both 50/50 cached tasks. SHA-256 plus file modes
  before/after each run: **781 source files unchanged**, including generated Deno declarations.
  Evidence: `/var/tmp/kuib-test-setup/gate-{1,2}.txt` and `gate-{1,2}-files.json`.
- Full tests: all 16 targets green; affected tests green. Scoped daemon: 10 files / 26 steps;
  tools: real caller tests/typecheck green; env: 7 files / 24 steps and old-repro command green.
- Single env file: two steps; `--filter findWorkspaceRoot`: one suite / two steps. Deno filters
  top-level suites, so the earlier `walks up` example matched no suite. Watch completed tests
  and waited for changes, then was deliberately stopped by timeout/SIGINT (exit 124).
- Root `test:live` and `bench`: success, no targets yet. Runner tests separately verify both
  kinds, empty projects, denied external access, nesting refusals, Nx refusal and slot waiting.
- Lint rule: 20 RuleTester steps; merger: three regression steps; full typecheck/lint green.
- Fixture description changed: cache miss, green; original bytes restored: cache hit, green.
  Evidence: `fixture-{baseline,changed,restored}.txt`; restoration is guarded by finally.
- Fresh install: `/var/tmp/kuib-test-setup/fresh-install`, independent clone plus source overlay,
  without existing node_modules or ignored .env. Frozen install runs root prepare and generated
  Deno types automatically; local hooksPath becomes `.githooks` without a manual command.
- Fresh installed pre-push: affected gate green, 50 tasks, 1 cached, 23.5 s. Fresh full gate:
  green, 50/50 cached. Commit-msg fixture test passes a path containing spaces intact and
  propagates exit 42; owner's actual global hook/config was untouched.
- Journal checks and adapter checks are green; generated indexes were already current.
- Final process count: one existing deno watcher, no test/runner/daemon child; 4680 MB available.

Final `pnpm test --coverage` table (no floor):

```text
project                               lines  branches
@kuib-ai/host-tui                    100.0%    100.0%
@kuib-ai/config                      100.0%     84.4%
@kuib-ai/daemon                       93.7%     85.7%
@kuib-ai/engine                       87.1%     88.5%
@kuib-ai/engine-service               87.1%     87.9%
@kuib-ai/env                          94.2%     95.4%
@kuib-ai/eslint-plugin-house-style    96.3%     90.9%
@kuib-ai/event-log-sqlite             90.1%     84.2%
@kuib-ai/protocol                    100.0%         —
@kuib-ai/std                          87.6%     89.4%
@kuib-ai/telemetry                    93.5%     87.5%
@kuib-ai/testing                     100.0%     99.1%
@kuib-ai/tools                        93.2%         —
@kuib-ai/transcript                  100.0%    100.0%
@kuib-ai/tooling                      56.8%     64.3%
workspace total                       90.2%     86.4%
```

CLI has no test or measured imported code; declarations/config-only projects have no measured
sources. A branch dash means no branches, not an empty report. Per-project LCOV, total.lcov,
raw profiles/native HTML and workspace HTML index exist under `dist/coverage`; total sources
are disjoint by ownership. Coverage log: `/var/tmp/kuib-test-setup/coverage.txt`.

## Findings

- TS001 · resolved · host-runtime now describes/quotes the shared script and is stamped.
- TS002 · resolved · Deno clears reused profile directories and later executions can invalidate
  cached transpilation for raw conversion. Each project has its own profiles; aggregation uses
  reports generated at test completion. Runner subprocess reporting is immediate and validated;
  the implementation lives outside Deno's hard-excluded bare test.ts filename. Missing coverage
  reports fail instead of turning into empty rows.
- TS003 · retained limitation · `package.json` prepare · pinned pnpm 12.6.0 skips lifecycle scripts
  on unchanged installs even with optimisticRepeatInstall=false. Fresh installs were verified;
  this existing checkout was installed by explicit `pnpm run prepare`. Repeat installs cannot
  guarantee hook restoration. See [upstream issue](https://github.com/pnpm/pnpm/issues/16545).
- TS004 · retained cleanup asymmetry · `packages/daemon/src/server/index.ts` · returned unix
  server does not own the optional TCP server; closing it leaves TCP listening until the test
  process exits. Left unchanged. Assigned spawned-process cleanup is verified.

Workflow versions/inputs were checked against primary
[checkout](https://github.com/actions/checkout),
[pnpm/action-setup](https://github.com/pnpm/action-setup), and
[setup-node](https://github.com/actions/setup-node) documentation. No hosted workflow run yet.

To forward another global hook, add a repository hook of that name with commit-msg's global
path lookup and argument forwarding, composing its gate if needed. Undo installation with
`git config --local --unset core.hooksPath`; this restores global fallback. Fresh install or
explicit prepare reinstalls the local path. No global hook/config was changed.

On engine release: adopt the shared runner in engine/engine-service, migrate service socket
tests to the pool, rename the gated live test/add its target, retire test:llm, and replace the
engine's filesystem/event-log stand-ins. Other packages' remaining ad hoc test resources are
contained by the sandbox; helper migration is a follow-up. Slot bounds are per workspace, so
a second worktree has its own four.

## Blocked on

None. The host-domain grant was expanded, the claim corrected, and all requested completion
checks passed.

## Names

- `@kuib-ai/testing` / `packages/testing` / `Testing` — mirrors env package/folder/`Env`.
- `create.temp.dir` / `createTempDir`, `create.socket.path` / `createSocketPath`,
  `create.sandbox` / `createSandbox` — mirror `create.console.logger` / `createConsoleLogger`.
- `resolve.test.permissions` / `resolveTestPermissions`, `resolve.test.env` / `resolveTestEnv`
  — mirror `resolve.app.paths` / `resolveAppPaths`.
- `resolve.test.depth` / `resolveTestDepth` — mirrors `resolve.test.env` / `resolveTestEnv`.
- `find.project.root` / `findProjectRoot` — mirrors existing `workspace.root` /
  `findWorkspaceRoot` concept; existing folder/function asymmetry flagged below.
- `load.fixture` / `loadFixture` — verb-first unit pattern; no sibling for load, owner review.
- `override.env` / `overrideEnv` — noun mirrors bootstrap.env; no sibling override verb,
  owner review (`config.overrides` is the noun).
- `change.cwd` / `changeCwd` — no sibling, owner review.
- `acquire.test.slot` / `acquireTestSlot` — no sibling for acquire, owner review.
- `test.kind.enum` / `TestKindEnum` / TEST, LIVE, BENCH / test, live, bench — mirrors
  `log.level.enum` / `LogLevelEnum` and its enum-to-wire derivation.
- `fixture.origin.enum` / `FixtureOriginEnum` / RECORDED, WRITTEN / recorded, written — same.
- `fixture.description` / `FixtureDescription` — mirrors `kuib.config.file` / `KuibConfigFile`.
- `fixtures/`, `fixture.json` — no existing fixture sibling, owner review; no manifest added.
- `TempDir`, `SocketPath`, `Sandbox`, `TestSlot` — names derive from their helper units;
  disposable returned-resource types are new here, owner review.
- sandbox field `slots` — mirrors sibling `sockets`.
- `KUIB_TEST_SOCKETS` — mirrors `KUIB_DAEMON_SOCKET`; DEPTH, NESTED, SLOTS mirror that
  established KUIB_TEST_ variable family.
- `tooling/test.ts` — mirrors tooling/journal.ts; `tooling/test.test.ts` follows the sibling-test
  convention, first tooling test (owner review).
- `check:affected`, `test:live` — mirror `check:circular` / `format:modified` target/scope order;
  `bench` is Deno's command name. No test:path, test:coverage, test:affected or subcommands added.
- `require-unit-test` / `require.unit.test` / `requireUnitTest` — mirrors require-context-link /
  require.context.link / requireContextLink.
- `untested.units` / `untestedUnits` — no sibling data module in the plugin, owner review.
- `.githooks/pre-push`, `.githooks/commit-msg` — Git's fixed hook names;
  `.github/workflows/check.yml` / Check — mirrors root check script; prepare is lifecycle name.
- `test-runner`, `test-permissions`, `test-bounds`, `testing-helpers`, `fixture-convention`,
  `coverage-report`, `push-hook-ci` — mirror infra claim naming (nx-tasks, check-pipeline).
- Existing asymmetries retained for owner review: workspace.root/findWorkspaceRoot,
  server/createDaemonServer, tool.spec/defineTool; test runner does not use Cli.parseCli like
  the other tooling scripts because it forwards unknown Deno flags.

- `test.runner.ts`, `test.coverage.ts`, `test.coverage.test.ts` — mirror the existing
  `test.test.ts` entry/role suffix pattern; runner and coverage are new role suffixes, owner review.
- `mergeLcov` — names the merge operation and LCOV format; no exact existing helper sibling,
  owner review. `CoverageRecord` — beside the existing `Tally`; no record-type sibling, owner review.
- `KUIB_TEST_COVERAGE` — mirrors the established `KUIB_TEST_DEPTH` / `KUIB_TEST_SLOTS` family.
