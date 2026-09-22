---
id: R409
title: Platform directory layout corrections for Windows and macOS runtime
state: idea
horizon: maybe
domains: [infra]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/application-directories/decisions#Example consumer layout (after app suffix)]]", "[[_archive/application-directories/decisions#Windows — Known Folders]]", "[[_archive/application-directories/decisions#macOS — Apple Library vs CLI expectation]]"]
touched: 2026-09-22
---

# R409 — Platform directory layout corrections for Windows and macOS runtime

## Idea

The designed per-OS layout differs from what `resolveAppPaths` builds (it appends `kuib/` plus
a file name uniformly). Designed Windows layout:

| Artifact | Windows |
|---|---|
| `config.toml`, `mesh.config.toml` | `%APPDATA%\kuib\` |
| SQLite DB | `%LOCALAPPDATA%\kuib\kuib.db` |
| logs | `%LOCALAPPDATA%\kuib\logs\kuib.log` |
| sockets | `%LOCALAPPDATA%\kuib\run\*.sock` (not Roaming, not `%TEMP%`) |
| cache | `%LOCALAPPDATA%\kuib\cache\` |

Roaming is for sync-worthy settings; DB, logs, cache and sockets must be machine-local (never
roam a SQLite WAL or unix-style IPC). Windows `runtime` currently falls back to `%TEMP%`.

On macOS, when `$XDG_RUNTIME_DIR` is unset the runtime base falls back to the OS temp dir; the
design called for a short `0700` fallback and watching the unix-socket path-length limit
(`$TMPDIR` on macOS is long).

## Why

Keeps the no-roaming rule for IPC and data on Windows and prevents socket bind failures from
over-long paths on macOS.

## Open questions

- Is Windows a supported target at all before the mesh exists?

## Constraints already decided

- Base directories only in `@kuib-ai/env`: [[domains/infra/decisions#^D010]]; XDG on macOS, Known Folders on Windows: [[domains/infra/decisions#^D011]].
- Current Windows bases and app paths: [[domains/infra/current#^windows-dirs]], [[domains/infra/current#^app-paths]].

## History

- 2026-09-22 migrated from the archive
