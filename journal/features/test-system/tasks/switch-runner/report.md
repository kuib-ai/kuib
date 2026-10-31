# switch-runner — report

Status: done

## Summary

The projects and root invoke the `testing` command from one root `@kuib-ai/testing` dependency. The five obsolete tooling runner files are removed. The root gate shares `check:base`, Nx defaults to parallelism 1 in `nx.json`, and the runner cache input points at the testing package. The full gate passes with and without the Nx cache, and all 123 claims are fresh.

## Files

- `package.json`, `pnpm-lock.yaml` — root command dependency, `testing` script, and shared gate chain.
- `nx.json` — parallelism 1 and testing package runner inputs.
- `apps/host-tui/package.json`, granted `packages/*/package.json`, `tooling/package.json` — migrated test scripts, excluding engine and engine-service under D004. Another task removed capture during its package move.
- `tooling/tsconfig.json` — removed obsolete runner entries.
- `tooling/test.ts`, `tooling/test.runner.ts`, `tooling/test.coverage.ts`, `tooling/test.test.ts`, `tooling/test.coverage.test.ts` — deleted after the runner and its tests moved to `packages/testing` in P04-I01.
- `AGENTS.md`, `journal/domains/infra/current.md`, `journal/domains/host/current.md` — new package rule and current runner truth.

## Plan updates (for the orchestrator)

- P04-I02 → implemented and verified. The orchestrator removed stale feature-plan refs; the inference task folded capture into `packages/inference`.
- `check:base` writes the root gate chain once; `check` and `check:affected` each choose their Nx scope. Nx parallelism is set once in `nx.json`; CI or another machine can pass Nx `--parallel=N` when it needs a different limit.
- The inference task removed `tooling/capture.test.ts` and the `@kuib-ai/tooling` spawn grant. The current permission table grants spawn to daemon and testing, and only the Deno executable to inference. The hooks and workflow already call the root check scripts and need no change.

## Journal

- Rewritten and stamped: infra/nx-tasks, infra/check-pipeline, infra/package-exports, infra/test-runner, infra/test-permissions, infra/test-bounds, infra/testing-helpers, infra/coverage-report, infra/push-hook-ci, host/host-runtime.
- `pnpm journal drift`: 123/123 claims fresh.
- No claim is stale; the orchestrator removed the old feature-plan refs.

## Verification

- `pnpm test packages/env`: green through the new command.
- `pnpm agents check`, `pnpm journal drift`, `pnpm run check:circular`: green.
- Nx typecheck, lint and test across 18 non-capture projects with `--skip-nx-cache`: 53 targets green.
- After the capture move and feature-plan cleanup, the orchestrator ran `pnpm run check` with the Nx cache skipped: all 53 typecheck, lint and test targets passed in 53 seconds.
- The orchestrator then ran `pnpm run check` with the cache: all 53 targets passed from cache. `check:base` was green, and no file was rewritten.
- Tests changed: none. Deleted `tooling/test.test.ts` and `tooling/test.coverage.test.ts`; P04-I01 had already moved their runner and coverage tests into sibling test files in `packages/testing/src` and preserved their test titles. No assertion was loosened or removed.

## Names

- `check:base` — mirrors `check:circular` and `check:affected`.
- `testing` in scripts — mirrors the existing `@kuib-ai/testing` package and `bin/testing`; no new command name.
- Engine and engine-service retain their deliberate D004 script exception; no unresolved naming asymmetry remains in the runner switch.
