# move-runner — plan

## Units and order

1. `packages/testing/src/merge.lcov/index.ts` exports `mergeLcov`. Move the lcov union and source filtering from `tooling/test.coverage.ts`. `merge.lcov/index.test.ts` moves its three focused tests. This mirrors the verb and object folder, default export, and sibling test shape of `load.fixture`.
2. `packages/testing/src/report.coverage/index.ts` exports `reportCoverage`. Move coverage attribution, totals, lcov and HTML output, and the printed table out of `tooling/test.runner.ts`; give it workspace and coverage paths as inputs so `index.test.ts` can verify ownership, output and missing reports in a disposable workspace. This mirrors `resolve.test.permissions` as one named behavior per folder, default export, and sibling test.
3. `packages/testing/src/run.test/index.ts` exports `runTest` and is the executable entry. Move request parsing, project selection, Nx and direct execution, sandbox and slot use, permissions, nesting, signal forwarding, kind selection, and coverage orchestration from `tooling/test.runner.ts`. Move and adapt the real subprocess tests from `tooling/test.test.ts` to `run.test/index.test.ts`, then add cases for root/Nx routing, path and Deno flag forwarding, and coverage. The folder mirrors `load.fixture`; its `index.ts` and `index.test.ts` mirror every behavioral unit in this package. Its first line is the Deno shebang, followed by `// @claim infra/test-runner`; `if (import.meta.main)` invokes the export.
4. `packages/testing/src/index.ts` adds these three exports to the existing `Testing` barrel, mirroring the current imports and object members. `packages/testing/package.json` adds `"bin": "./src/run.test/index.ts"`; pnpm derives the executable `testing` from the package's existing name, `@kuib-ai/testing`. The subprocess test's spawn grant is added to `resolve.test.permissions/index.ts` for `@kuib-ai/testing`, mirroring the current project grants. The package's existing `test` script stays on `tooling/test.ts` until the second task switches scripts, so this first half can be verified through the runner already in use.

The executable uses `#!/usr/bin/env -S deno run -A --no-check`; only this command entry grants its own permissions. Its child test processes still use `resolveTestPermissions`, `resolveTestEnv`, `createSandbox`, and `acquireTestSlot`. It derives the workspace root from its source path at `packages/testing/src/run.test/index.ts`, rather than from the caller's working directory. The command keeps the same external `pnpm test` usage and flags. From the workspace root, `--kind=live` and `--kind=bench` with no path should route to the corresponding Nx targets, so those kinds cover the workspace when targets exist.

Each new production unit gets a first-line `@claim` link and no prose comments. The new links will make `infra/test-runner`, `infra/coverage-report`, and `infra/package-exports` stale until the second task rewrites and stamps claims in `journal/domains/infra/current.md`, which is outside this grant. The changed permissions grant similarly affects `infra/test-permissions`.

## Command proof in a scratch pnpm workspace

I created `/var/tmp/kuib-runner-probe.N5NtLJ` with a root package, `packages/runner`, and `packages/project`. The provider package is named `@probe/testing` and declares `"bin": "./bin.ts"`; `bin.ts` has `#!/usr/bin/env -S deno run -A --no-check` and prints its cwd. The root depends on `@probe/testing` via `workspace:*`; the project has it as a dev dependency. The provider's own `test` script, the project's `test` script, and the root `test` script all say `testing`. Commands and observed results after `pnpm install --offline --ignore-scripts`:

| Command, from the scratch workspace | Result |
| --- | --- |
| `/var/tmp/kuib-guard.sh 30 1500 -- pnpm install --offline --ignore-scripts` | Exit 0; all three workspace projects linked; root and project gained `.bin/testing`. |
| `/var/tmp/kuib-guard.sh 30 1500 -- pnpm test` | Exit 0; printed root cwd. |
| The same `pnpm test` from `packages/runner` | Exit 0; printed runner package cwd. |
| The same `pnpm test` from `packages/project` | Exit 0; printed project cwd. |
| `/var/tmp/kuib-guard.sh 30 1500 -- pnpm run test:nx` from the root | Exit 0; Nx ran both package `test` targets with parallelism 1. |

For the Nx probe, the scratch root's `node_modules/.bin/nx` linked to this repository's installed Nx binary; no repository manifest or installation changed. The root dependency creates the root binary, which is also how the provider package finds its own command. `packages/runner` has no self dependency or local `.bin/testing`. The project dependency creates its local binary. Therefore the real root needs `@kuib-ai/testing` as a dev dependency and every project with a runner based test target needs the same dev dependency if absent. The testing package is the sole self dependency exception: its command is reached through the root's binary. Projects that already depend on the package keep that declaration; the two engine projects retain their old scripts under D004.

I also tried `/var/tmp/kuib-guard.sh 30 1500 -- pnpm exec @probe/testing` from `packages/project` as a pathless, commandless package invocation. It exited 1 with `Command "@probe/testing" not found`: the scoped package name is not the executable. A project script still needs to name an executable, and the string-form `bin` gives it the existing unscoped name `testing` without inventing another name. The three-word setup is simply dependency `@kuib-ai/testing`, package bin string, and script `testing`.

## Existing tests, grant and stub

The real subprocess tests move with the runner into `run.test/index.test.ts`. They still start a nested run with `KUIB_TEST_NESTED=1`, test the depth refusal and slot wait, and use disposable projects. `resolveTestPermissions` grants spawn to `@kuib-ai/testing` for these tests. The existing `@kuib-ai/tooling` spawn grant stays while tooling still has its runner tests; the second task checks remaining tooling tests before removing that grant.

No stub replaces `tooling/test.ts`: the package command entry is named `index.ts`. Deno's coverage omission applies to a file named `test.ts`; it does not require a stub when the entry has another name. The second task deletes the tooling files after switching scripts.

## Verification after GO

- Run `pnpm test packages/testing` through `/var/tmp/kuib-guard.sh 30 1500 --` with Nx parallelism 1. The existing runner executes the moved unit tests.
- Run the testing project's typecheck and lint targets with Nx parallelism 1 through the guard. Fix any local failures inside the grant.
- Invoke the package's `testing` binary directly from a project and from the root, including a file path, `--kind`, forwarded `--filter`, and coverage. Check that subprocess sandbox, permission, depth, slot and coverage tests pass.
- Review `packages/testing/src` beside existing siblings and report every introduced name. No repository-wide gate while other tasks edit the tree.

## Second task, outside this grant

- Delete `tooling/test.ts`, `tooling/test.runner.ts`, `tooling/test.coverage.ts`, `tooling/test.test.ts`, and `tooling/test.coverage.test.ts` after replacing their scripts and test coverage.
- Change `package.json` root `test` to `testing`, add `@kuib-ai/testing` as a dev dependency, adjust `test:live`, `bench`, `check` and `check:affected` so the same gate chain is written once, and regenerate `pnpm-lock.yaml` with the resulting dependency graph.
- Change `apps/host-tui/package.json`, `packages/cli/package.json`, `packages/config/package.json`, `packages/daemon/package.json`, `packages/env/package.json`, `packages/eslint-plugin-house-style/package.json`, `packages/event-log-sqlite/package.json`, `packages/inference/package.json`, `packages/protocol/package.json`, `packages/std/package.json`, `packages/telemetry/package.json`, `packages/testing/package.json`, `packages/tools/package.json`, `packages/transcript/package.json`, and `tooling/package.json`: `test` names `testing`; add the package dev dependency where absent, preserving a real runtime dependency where used. Future `test:live` and `bench` targets name the command plus `--kind=live` or `--kind=bench`. `packages/engine/package.json` and `packages/engine-service/package.json` keep their scripts under D004. `packages/deno-types/package.json` and `packages/tsconfig/package.json` have no test target to switch.
- Change `nx.json` test runner inputs to the testing package, removing the tooling files; retain the existing test, live and bench cache behavior.
- Change `AGENTS.md` test script rule, live and bench examples, and package description to the command; synchronize generated adapters if this changes their source text.
- Rewrite and stamp `infra/test-runner`, `infra/test-permissions`, `infra/test-bounds`, `infra/testing-helpers`, `infra/coverage-report`, and `infra/package-exports` as needed in `journal/domains/infra/current.md`, along with manifest linked claims such as the test target and gate descriptions.
- Check `.githooks/pre-push` and `.github/workflows/check.yml` against the revised root gate, changing them only if their command must change; both currently call the root check scripts and mention no runner path. The same applies to `.githooks/commit-msg`, which is unrelated to test execution.

## Names and open point

- `testing` is the unscoped part of the existing package name `@kuib-ai/testing`; string-form `bin` derives it, so no runner-specific command name is introduced.
- `run.test` / `runTest` mirrors `load.fixture` / `loadFixture` as verb plus object.
- `merge.lcov` / `mergeLcov` mirrors `load.fixture` / `loadFixture` as verb plus object.
- `report.coverage` / `reportCoverage` mirrors `resolve.test.permissions` / `resolveTestPermissions` as a behavioral unit with the same folder, export and test arrangement.
- Existing asymmetry to leave for the second task: the current runner names `tooling/test.ts` and `test.runner.ts`, while the package's behavioral units use dot-case folders and `index.ts`.
- No decision is needed before the implementation. The second task must decide whether `@kuib-ai/tooling` still needs its spawn grant after its runner tests move by checking the tooling tests then present.
