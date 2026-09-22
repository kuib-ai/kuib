---
id: R402
title: Per-user daemon scoping with socket-permission local auth
state: shaped
horizon: next
domains: [core, infra]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/security-model/decisions#Per-user daemon scoping & local auth (2026-07-01)]]"]
touched: 2026-09-22
---

# R402 — Per-user daemon scoping with socket-permission local auth

## Idea

Make the daemon's user scoping an explicit, enforced security invariant:

- The daemon is **user-scoped, not machine-scoped**: it runs commands only as the OS user that
  owns its process. No root broker, no UID switching, no machine daemon distributing to users.
  Each OS user runs their own daemon with their own `nodeID`.
- **Invariant:** compromising one user's daemon compromises that OS user only, never the whole
  machine.
- **Local auth = unix-socket file permissions.** The daemon binds its socket at mode `0600` in a
  user-owned directory, so only that user (or root) can connect. Filesystem permissions are the
  local authentication; no extra local auth layer.
- **Cross-user on one box** (bob → alice) goes over the mesh IP and is authenticated by `nodeID`
  keys like any remote peer ([[roadmap/items/R405-daemon-threat-hardening]]).

## Why

Today socket directories are created `0700`, but the socket mode itself and the invariant are
not asserted anywhere, and the daemon's optional TCP listener binds all interfaces.

## Open questions

- Assert `0600` on the socket after bind, or rely on the `0700` parent directory?
- Should the optional TCP listener be restricted to the mesh interface (see R405 layer 0)?

## Constraints already decided

- Socket directories are created at mode `0700`: [[domains/infra/current#^app-paths]].
- The daemon is a separate process reached over a unix socket locally: [[domains/core/decisions#^D014]], [[domains/core/current#^daemon-server]].

## History

- 2026-09-22 migrated from the archive
