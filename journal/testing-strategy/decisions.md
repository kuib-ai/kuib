---
title: Testing Strategy — bun:test, colocated, hermetic
type: implementation
layer: process
status: decided
created: 2026-07-02
tags: [testing, bun-test, coverage, hermeticity, conventions]
depends-on: ["[[house-style-linting]]", "[[architecture-overview]]"]
informs: ["[[ux-iteration-process]]"]
---

# Testing Strategy

## Runner — bun:test only (2026-07-02)

One runtime, one runner. vitest was removed (config, catalog entry, root devDep); every suite imports from `"bun:test"`. Root script: `pnpm test` → `bun test packages apps`. Rationale: the product runs on Bun, tests should exercise the same runtime (this also unlocked testing `Bun.TOML`-dependent units that vitest-on-Node could not load), and one runner removes the split-brain config. Consequence discovered at migration: **bun auto-loads the repo `.env`**, so tests must never assert on values a real `.env` can override.

## What gets a test

Every source unit with **runtime behavior** gets a colocated `<unitDir>/index.test.ts` (`.tsx` for components): branching, path/string computation, parsing/folding, discovery/transport, tRPC procedures, event-log operations, eslint rules, registries, id generation. **Skipped**: pure barrels, pure enums, type-only ports, and trivial Zod schemas with no refinement logic — testing those is tautology. Coverage sweep 2026-07-02: 156 units classified, 47 test-worthy, 46 tests landed (47th — `host-web/server` — is untestable as written: zero exports, all logic in closures inside `main()`; refactor to an exported handler factory is the open follow-up).

## Hermeticity rules (each learned from a real failure)

- **No `bun:test` `mock.module`.** It patches the module registry **process-globally and leaks across test files** — a mocked `ensure.local.daemon` made the real module's own test receive the mock (order-dependent suite failure). Instead: inject fakes through the unit's params/ports, or stand up a real tiny fixture (a `net.createServer` on a temp socket makes daemon-probe paths testable without spawning).
- **Never assert env-derived values that `.env` can override** — test pure defaults via `EnvSchema.parse({})` and entrypoints structurally; isolate with a temp workspace (`mkdtempSync` + own `pnpm-workspace.yaml` + `chdir`) so `findWorkspaceRoot` never resolves to the real repo.
- **Unique temp resources per test** (`${process.pid}-${Date.now()}` socket/file names); clean up in the test body.
- **Kill spawned processes in teardown** — KNOWN VIOLATION: `ensure.daemon`'s spawn-path tests launch real detached `start.daemon` children that outlive the run (~20 accumulated before being noticed; `pnpm reload` clears them). Open fix tracked in [[tool-system]].
- House style applies to tests: no try/catch (use `expect(...).rejects`), no `as any`/`as unknown`, no prose comments, `const x = function () {}` at top level. Lint overrides for tests disable only `require-context-link`, `named-exports-are-types`, `dot-case-filename`.

## Package-specific idioms

- **eslint-plugin rules** are tested with `@typescript-eslint/rule-tester`'s `RuleTester` (statics wired to `bun:test`'s `describe/it/afterAll`) — eslint-core's `Linter`/`RuleTester` types are nominally incompatible with `RuleCreator` rules and would force banned casts.
- **The plugin package is NodeNext** — relative test imports use `"./index.js"` specifiers (the rest of the monorepo is `moduleResolution: Bundler` and may use extensionless).
- **Engine/orchestrator** tests use `MockLanguageModelV3` + `simulateReadableStream` (ai/test) and assert on **events in the log**, not internals. A tool-failure test = model emits `tool-call` while the daemon client points at a dead port → expects `TOOL_CALL_FAILED`.
- Enabled-path telemetry (`startTelemetry` with a real endpoint) registers **process-global** OTel state; it is covered once (plus the live Phoenix spike in [[observability]]) — don't multiply tests that mutate globals.

## Verification protocol

Agents/automation that write tests must verify with **all gates, not just the runner**: `bun test packages apps`, `pnpm -r --filter '!@kuib-ai/tsconfig' exec tsc --noEmit`, `pnpm exec eslint .`, madge. The 2026-07-02 sweep proved runner-only verification lies: 46 "green" tests hid 22 lint errors, 8 typecheck failures, and one cross-file mock leak.
