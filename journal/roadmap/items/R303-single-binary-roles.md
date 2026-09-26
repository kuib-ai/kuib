---
id: R303
title: One compiled TypeScript binary with argv-selected roles, beside the native UI
state: shaped
horizon: later
domains: [host, infra]
depends-on: ["[[roadmap/items/R002-deno-runtime]]", "[[roadmap/items/R221-self-contained-engine]]"]
converges-with: ["[[roadmap/items/R406-signed-binary-distribution]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/host-layer/decisions#Single binary, multi-role distribution]]", "conversation 2026-09-23"]
touched: 2026-09-25
---

# R303 — One compiled TypeScript binary with argv-selected roles, beside the native UI

## Idea

Two executables per platform. The UI is native and ships on its own
([[roadmap/items/R300-own-tui-library]]); everything TypeScript is one `deno compile` artifact
whose first argument selects the role:

- `serve` → the engine only (headless leader / voter), the entry of
  [[roadmap/items/R221-self-contained-engine]]. Built today as a host command
  ([[domains/host/current#^role-dispatch]]).
- `daemon` → the daemon only (a remote mesh node — "remote hands").
- an all-in-one local role (engine and daemon) may follow.

The UI spawns or attaches to the TypeScript binary by role
([[roadmap/items/R302-ui-host-attach]]). Today the daemon is spawned from its own
`start.daemon` module ([[domains/core/current#^ensure-daemon]]); in the compiled binary it must
become a role of the same executable so `spawn(execPath, [role])` works.

Known requirements for the compile ([[roadmap/research/startup-and-compile]]): `--no-check`
(tsgo already type-checks; Deno's own check reads `tsconfig.json` and loses its runtime lib),
`--bundle` (without it pnpm's layout leaves dependencies of dependencies out of the binary,
[denoland/deno#30509](https://github.com/denoland/deno/issues/30509)), and each role importing
only its own dependencies.

## Why

One TypeScript artifact to distribute and to reference from OS service units
([[roadmap/items/R304-background-service-install]]); spawn-by-role keeps the UI, the service
manager and manual runs on the same invocation.

## Open questions

- How the two executables ship together and how the UI finds the TypeScript binary.
- Whether `--bundle` (experimental) survives the `serve` role: pino's worker transport and any
  dynamic import it cannot trace.
- Does the TypeScript binary with no argument print usage or run the all-in-one role?

## Constraints already decided

- Owner, 2026-09-23: "keep the engine and the daemon adn everything in typescript" — "and make
  the TUI in a native language for extreemly fast startups".
- [[domains/host/decisions#^D004]] — one entry, argv selects the role (for the TypeScript
  binary).
- [[domains/core/decisions#^D014]] — the daemon is always a separate process, even locally.

## History

- 2026-09-22 migrated from the archive
- 2026-09-25 the UI leaves the binary (deno-runtime D007); compile requirements from
  [[roadmap/research/startup-and-compile]]
