# move-runner — report

Status: done

## Summary

The testing package now owns the test runner: request parsing, project and file selection, direct sandboxed runs, Nx fan-out, coverage collection and reporting are separate tested units. Its string-form `bin` exposes `testing`, derived from `@kuib-ai/testing`. The extensionless `bin/testing` contains only the Deno shebang, claim link, import and one call. `run.test.command` converts errors to a message and exit code 2, including when called as a unit; its direct test verifies that outcome. The current tooling runner and all workspace scripts stay in place for the second task.

The permission proof removed during the move is restored. When `@kuib-ai/testing` gained a spawn grant for its subprocess tests, its own permission check could no longer assert that ordinary tests cannot spawn. The restored test runs under the flags for an ordinary project and verifies a real refused subprocess alongside the remote host, outside-sandbox write and workspace `.env` checks.

## Files

- `packages/testing/bin/testing`, `packages/testing/package.json` — thin executable package entry and string-form bin declaration.
- `packages/testing/src/{parse.test.request,resolve.test.targets,resolve.test.projects,resolve.test.kind,resolve.test.files,resolve.test.task}/` — arguments, project and file selection, and Nx task mapping, each with `index.ts` and `index.test.ts`.
- `packages/testing/src/{run.test.command,run.test.target,run.test.projects,run.test.process,run.test.coverage}/` — routing, sandboxed execution, signal forwarding, Nx fan-out and coverage collection, each with `index.ts` and `index.test.ts`. The command tests exercise real subprocesses, nesting, permissions, kinds and slot waiting.
- `packages/testing/src/{merge.test.coverage,report.test.coverage}/` — lcov merge and workspace report, each with `index.ts` and `index.test.ts`.
- `packages/testing/src/index.ts`, `packages/testing/src/resolve.test.permissions/index.ts`, `packages/testing/src/resolve.test.permissions/index.test.ts` — barrel exports, the spawn grant needed by the moved subprocess tests, and the restored ordinary-project refusal proof.

## Plan updates (for the orchestrator)

- P04-I01 → implemented inside the granted package. The second task switches manifests, removes the five `tooling/test*` files, and updates journal claims.
- The workspace needs **one root `@kuib-ai/testing` dependency** to expose `testing` to root and project scripts, including the testing package's own script. A project declares `@kuib-ai/testing` only if its tests import it. This is the GO rule; the earlier plan's per-project dependency rule is superseded.
- The second task changes `package.json` and `pnpm-lock.yaml`; `apps/host-tui/package.json`; `packages/{cli,config,daemon,env,eslint-plugin-house-style,event-log-sqlite,inference,protocol,std,telemetry,testing,tools,transcript}/package.json`; and `tooling/package.json` so runner-based `test` scripts say `testing`. The engine and engine-service scripts remain under D004. Future `test:live` and `bench` scripts say `testing --kind=live` and `testing --kind=bench`.
- The second task updates `nx.json` runner inputs, `AGENTS.md` instructions, `journal/domains/infra/current.md` claims, and any generated adapter text affected by `AGENTS.md`. Check `scripts/check.root.manifest.ts`, `.githooks/pre-push` and `.github/workflows/check.yml` against the revised root check scripts; the hook and workflow currently call those scripts and have no runner path. The root `check` and `check:affected` scripts should share one gate chain as P04-I02 requires.
- The old tooling spawn grant stays while `tooling/test.test.ts` remains. After deleting those tests, check the remaining tooling tests before removing the grant.

## Journal

- New production units link `infra/test-runner` or `infra/coverage-report`; the package bin links `infra/test-runner`. The changed grant links `infra/test-permissions`, and the barrel links `infra/package-exports`.
- Claims possibly affected but not rewritten or stamped: `infra/test-runner`, `infra/coverage-report`, `infra/test-permissions`, `infra/test-bounds`, and `infra/package-exports`. Their current sources still describe or point to `tooling/test*`; editing the claim file is outside this worker's grant. `infra/testing-helpers` was read and remains accurate.

## Names

- `testing` and `bin/testing` — the existing package name `@kuib-ai/testing`; no runner-specific command name was created. The package has no other bin entry, so `bin/testing` has no structural bin sibling for the owner's review.
- `parse.test.request` / `parseTestRequest`, `resolve.test.targets` / `resolveTestTargets`, `resolve.test.projects` / `resolveTestProjects`, `resolve.test.kind` / `resolveTestKind`, `resolve.test.files` / `resolveTestFiles`, and `resolve.test.task` / `resolveTestTask` — the verb.test.noun folder/export pattern of `resolve.test.permissions` / `resolveTestPermissions`.
- `run.test.command` / `runTestCommand`, `run.test.target` / `runTestTarget`, `run.test.projects` / `runTestProjects`, `run.test.process` / `runTestProcess`, and `run.test.coverage` / `runTestCoverage` — the same verb.test.noun pattern, and each other as run units.
- Private `route` in `run.test.command` — the routing step that `runTestCommand` wraps to turn every thrown error into code 2; it has no named sibling and is flagged for the owner's review.
- `merge.test.coverage` / `mergeTestCoverage` and `report.test.coverage` / `reportTestCoverage` — the same verb.test.noun pattern; their tests sit beside their `index.ts` like `resolve.test.env`.
- `TestRequest` and `TestTarget` — `TestDepth` and `TestSlot`; `TestProjectsInput` and `CoverageReportInput` — `TestPermissionsInput`. The private `hasTestTarget` follows `resolveTestTask`'s target terminology.
- Existing asymmetry left for the second task: `tooling/test.ts`, `test.runner.ts` and `test.coverage.ts` still use standalone filenames while the testing package uses dot-case unit folders.
- The restored permission test adds no public name. Its title matches the existing `infra/test-permissions` source citation; the separate grant test follows the sibling permission tests' `grants` wording.

## Verification

- `pnpm test packages/testing`: green through the existing tooling runner; includes real nested runner subprocesses and disposable-workspace lcov/HTML collection.
- After the Resume fix, `pnpm test packages/testing`, testing typecheck, testing lint, and package Prettier check all passed again with the guard and Nx parallelism 1.
- After restoring the spawn refusal proof, the focused permission test and `pnpm test packages/testing` passed; testing typecheck and lint passed through the guard with Nx parallelism 1, and the changed file passed Prettier check.
- `pnpm test packages/testing/src/run.test.command`: green after adding a real forwarded `--filter` case and the nested-folder case.
- `pnpm exec nx run @kuib-ai/testing:typecheck --parallel=1`: green.
- `pnpm exec nx run @kuib-ai/testing:lint --parallel=1`: green.
- `pnpm exec prettier --check packages/testing`: green.
- `packages/testing/bin/testing packages/env` from the repository root: green through Nx.
- Scratch root-only dependency proof at `/var/tmp/kuib-runner-probe.N5NtLJ`: after removing the project's direct dependency, `pnpm test` in the project and provider package and `pnpm run test:nx` at the root all exited 0.
- Actual package proof at `/var/tmp/kuib-real-bin-probe.lWChJY`: root depends on this package by `link:`, project has no testing dependency; root `pnpm test` invoked `testing --help`, project `pnpm test` ran one real Deno test, and root `pnpm run test:nx` ran the project target. All exited 0. The project had no local `.bin/testing`; pnpm resolved the root binary.
- `pnpm run check` was not run because the brief prohibits the whole gate while other tasks edit the tree. Every multi-process run used `/var/tmp/kuib-guard.sh 30 1500 --`; Nx ran with parallelism 1 where invoked directly.
