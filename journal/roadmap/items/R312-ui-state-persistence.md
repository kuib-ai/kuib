---
id: R312
title: UI state persistence and live config reload
state: idea
horizon: later
domains: [host]
depends-on: ["[[roadmap/items/R300-own-tui-library]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/host-layer/decisions#TUI dev loop — no HMR anywhere; watch-restart against the persistent engine (2026-07-03)]]"]
touched: 2026-09-22
---

# R312 — UI state persistence and live config reload

## Idea

Make UI restarts feel seamless, since restart is the dev loop and the upgrade path:

- **UI-state store** — a small key-value file in the state dir persisting theme, toggles, prompt
  history and a prompt stash (the pattern OpenCode uses with its `kv.json`). Land it with the
  first new screens.
- **Live config reload** — `SIGUSR2` (or equivalent) re-reads config and theme *data* without a
  restart; never code.

Session state itself already lives in the engine service and event log, so a restart only loses
UI state — this item closes that gap.

## Why

Watch-restart ([[domains/host/decisions#^D008]]) and attach/detach
([[roadmap/items/R302-ui-host-attach]]) make the UI disposable; persisted UI state keeps that from
being felt.

## Open questions

- File location and format under the application state directory; per-session vs global keys.
- Windows equivalent for signal-driven reload.

## Constraints already decided

- [[domains/host/decisions#^D008]] — watch-restart, no HMR.
- [[domains/infra/decisions#^D013]] — one root config with file, env, CLI precedence.

## History

- 2026-09-22 migrated from the archive
