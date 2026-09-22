---
id: R303
title: Single compiled binary with argv-selected roles
state: shaped
horizon: later
domains: [host, infra]
depends-on: ["[[roadmap/items/R002-deno-runtime]]"]
converges-with: ["[[roadmap/items/R406-signed-binary-distribution]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/host-layer/decisions#Single binary, multi-role distribution]]"]
touched: 2026-09-22
---

# R303 — Single compiled binary with argv-selected roles

## Idea

One `deno compile` artifact per platform containing service, daemon and UI host; the first
argument selects the role:

- `kuib` → UI host (default); attaches to or spawns local service + daemon
  ([[roadmap/items/R302-ui-host-attach]]).
- `kuib daemon` → daemon only (a remote mesh node — "remote hands").
- `kuib serve` → service/engine only (headless leader / voter). Built today
  ([[domains/host/current#^role-dispatch]]).
- `kuib up` → all-in-one local.

The single entry wires protocol, engine, engine-service, daemon and dispatches on role. Today
the daemon is spawned from its own `start.daemon` module ([[domains/core/current#^ensure-daemon]]); in
the compiled binary it must become a role of the same executable so `spawn(execPath, [role])`
works.

## Why

One artifact to distribute and to reference from OS service units
([[roadmap/items/R304-background-service-install]]); spawn-by-role keeps the host, the service
manager and manual runs on the same invocation.

## Open questions

- Solid JSX compile step before `deno compile` (deno-runtime G005).
- Does `kuib` with no argument print usage (today) or launch the UI once
  [[roadmap/items/R300-own-tui-library]] exists?

## Constraints already decided

- [[domains/host/decisions#^D004]] — one entry, argv selects the role.
- [[domains/core/decisions#^D014]] — the daemon is always a separate process, even locally.

## History

- 2026-09-22 migrated from the archive
