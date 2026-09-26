---
id: R221
title: Self-contained engine — one entry that owns its wiring and its single-instance start
state: shaped
horizon: now
domains: [core, host]
depends-on: []
converges-with: ["[[roadmap/items/R302-ui-host-attach]]", "[[roadmap/items/R313-host-protocol-contract]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["conversation 2026-09-23"]
touched: 2026-09-25
---

# R221 — Self-contained engine — one entry that owns its wiring and its single-instance start

## Idea

Today the engine cannot run by itself. `apps/host-tui`'s `serve` command wires it: telemetry,
the model (`resolveModelConfig`, `createModel`, `buildProviderOptions`), the daemon client
resolved by node identity, the SQLite event log, and `startEngineService` with a `runTurn`
closure around `runAgent` ([[domains/host/current#^serve-startup]]). The split is deliberate
today: core D015 leaves the wiring to the host application, and host D005 has the host resolve
the daemon.

A self-contained engine owns all of that behind one entry, so a host (the native terminal UI
first) only:

- spawns the engine process or attaches to it,
- sends `submit` and `interrupt` frames over the engine socket,
- reads the session from the SQLite log.

Single-instance start moves inside too. Today the callers of `ensureDaemon` and `connectOrSpawn`
probe the socket and spawn, so idempotence is the caller's job; the engine and the daemon should
guarantee it themselves.

## Why

The terminal UI becomes native while the engine stays TypeScript
([[features/deno-runtime/plan#D007 — The terminal UI is native; engine, daemon and tooling stay TypeScript]]).
A native host cannot import engine code, so everything it needs has to sit behind the process
boundary that already exists: control frames on the socket, data in the log
([[domains/core/decisions#^D016]]).

## Open questions

- Where the entry lives: a `start.engine` entry in core that loads its own config, as
  `start.daemon` does, with `host-tui`'s `serve` handing off to it; one `startEngine(bootstrap)`
  function the host still calls; or a separate engine app.
- Package layout: merge `engine-service` into `engine` (replacing D015's library/process split),
  keep the split with the wiring in `engine-service`, or also fold in `event-log-sqlite`, whose
  reader hosts use.
- Whether the engine ensures its own daemon, and what a second start does: fail, attach or
  nothing.
- Packaging: a compiled binary needs `deno compile --bundle` and the daemon as a role of the
  same binary ([[roadmap/research/startup-and-compile]],
  [[roadmap/items/R303-single-binary-roles]]).
- Startup: each role should import only its own dependencies; today the entry loads all of them
  before dispatching (about 80 ms in a compiled binary).

## Constraints already decided

- Owner, 2026-09-23: "let us begin work on refactoring the engine to be self contained";
  "currently cnsumers call it and idempotence is property of consumer"; "keep the engine and the
  daemon adn everything in typescript".
- [[domains/core/decisions#^D014]] — the daemon is always a separate process.
- [[domains/core/decisions#^D016]] — control plane on the socket, data plane in SQLite.
- [[domains/core/decisions#^D017]] — socket mutex, detached spawn, idle self-reap.
- [[domains/host/decisions#^D001]] — the engine never runs inside a UI host.

## History

- 2026-09-23 raised by the owner as the next piece of work; shaped in conversation
- 2026-09-25 recorded
