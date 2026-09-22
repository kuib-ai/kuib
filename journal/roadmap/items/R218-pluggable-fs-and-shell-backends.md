---
id: R218
title: Pluggable fs and shell backends — local, Postgres, nsjail sandbox
state: idea
horizon: maybe
domains: [core, infra]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/architecture-overview/decisions#Interface-Based I/O]]", "[[_archive/protocol-design/progress#Rebuild list]]"]
touched: 2026-09-22
---

# R218 — Pluggable fs and shell backends — local, Postgres, nsjail sandbox

## Idea

The engine and tools never touch the filesystem or shell; daemons host the implementations and
pick them at wiring time. Implementations become their own packages:

```
packages/
  fs-local/       — LocalFS (real filesystem)
  fs-postgres/    — PostgresFS
  shell-local/    — local shell execution
  shell-nsjail/   — sandboxed shell execution
```

Daemon flavours: **local** (LocalFS + LocalShell), **remote** (the same on another machine over
WireGuard), **sandbox** (PostgresFS + NsjailShell, e.g. for a web product), **tests** (MockFS +
MockShell). A `Shell` and `Network` port join `FileSystemPort`.

## Why

A hosted/web offering needs sandboxed execution with the same daemon contract.

## Open questions

- Is a sandbox daemon ever in scope for a personal-mesh product?

## Constraints already decided

- `FileSystemPort` in protocol; the daemon is the only code touching the filesystem —
  [[domains/core/decisions#^D012]], [[domains/core/current#^protocol-ports]].
- The daemon is always a separate process — [[domains/core/decisions#^D014]].

## History

- 2026-09-22 migrated from the archive
