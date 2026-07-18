---
title: "Architecture Overview"
type: vision
status: decided
layer: architecture
created: 2026-04-13
tags: [architecture, monorepo, packages, host]
depends-on: ["[[vision]]", "[[comprehension-model]]"]
informs:
  [
    "[[provider-architecture]]",
    "[[protocol-design]]",
    "[[host-layer]]",
    "[[security-model]]",
    "[[infrastructure-strategy]]",
    "[[house-style-linting]]",
    "[[tool-system]]",
    "[[testing-strategy]]",
    "[[application-directories]]",
  ]
---

# Architecture Overview

## Current Decisions

### Language

- **TypeScript** for the entire kuib product (protocol, tools, engine, host). Maximizes developer speed and ecosystem compatibility.
- **Go** — no kuib-authored Go; the network control plane uses **deployed Headscale** (existing OSS, not built here — see [[infrastructure-strategy]]).
- C/C++ deferred to future projects.

### Monorepo Structure (kuib repo)

```
packages/
  protocol/       — Zod schemas (source of truth), inferred TS types, interfaces
  tools/          — tool definitions + logic, calls interfaces
  engine/         — orchestration, agent loop, event log (runs on the elected leader)
  daemon/         — node-local executor (fs/shell) exposing a tRPC service
  host/           — HostProtocol + host adapters (NvimHost v1)

apps/
  server/         — hosts the engine, session store, and tRPC endpoints (P2P, every node)
  daemon/         — entry point for the node-local execution daemon
  cli/            — TUI host client (attaches to the local engine over the unix socket)
```

### Repo Organization

- Single **public monorepo** (pnpm + Nx) — code AND `journal/` in one repo; `journal/` is a sibling of `packages/`/`apps/` (no umbrella/submodule split), so `@context` links resolve within the repo. See [[vision]].
- Network control plane: **deployed Headscale + DERP** (not a kuib-authored repo — see [[infrastructure-strategy]]).

### Package Dependency Flow

```
protocol  (Zod-first — Zod schemas are the source of truth, infer TS)
    ↑
  tools   (implements tool logic, calls protocol interfaces)
    ↑
  engine  (orchestrates tools, manages agent loop, owns event log)
    ↑
  server  (wires engine, exposes tRPC endpoints; P2P — every node co-hosts)
    ↕ (tRPC via Mesh/Tailnet — proto/gRPC is a future option for polyglot daemons)
  daemon  (implements fs/shell interfaces locally, exposes to the engine)
    ↕ (tRPC)
  host    (TUI client, renders engine state, emits User* events)
```

Engine, Host, and Daemon are strictly decoupled. They share only the protocol vocabulary over the wire. Host adapters (NvimHost, future DesktopHost, WebHost) implement [[host-layer]]. RPC is **tRPC (Zod-native)** for v1; see [[infrastructure-strategy]], [[consensus-model]].

**Process isolation from day one (decided 2026-06-30):** the engine reaches the daemon over **HTTP tRPC even on the same device** — NOT an in-process caller. The daemon is always a separate process. This bakes isolation into the first phase so the local case and the remote-mesh case are the _same_ code path (`TransportFactory(deviceID)` → loopback URL or WireGuard IP), with no special-casing to unwind later. The in-process tRPC caller is kept only for **unit-testing the daemon directly**. Core packages built on this basis: `@kuib-ai/protocol` (Zod), `@kuib-ai/std` (`withError` tuple), `@kuib-ai/daemon` (tRPC router), `@kuib-ai/engine` (event log + orchestrator). See [[host-layer]] lifecycle.

### Interface-Based I/O

The engine and tools don't touch the filesystem or shell directly. They call interfaces defined in protocol. Implementations are hosted by the **Daemons**, which the engine communicates with over **tRPC** (local = a separate daemon process over a unix socket — NOT in-process; isolation from day one, see [[host-layer]]).

```
Local Daemon:    LocalFS + LocalShell (real filesystem, real shell)
Remote Daemon:   LocalFS + LocalShell on a different machine over WireGuard
Sandbox Daemon:  PostgresFS + NsjailShell (sandboxed, e.g. for web)
Tests:           MockFS + MockShell
```

Implementations are their own packages, daemons pick and wire them:

```
packages/
  fs-local/       — LocalFS implementation
  fs-postgres/    — PostgresFS implementation
  shell-local/    — local shell execution
  shell-nsjail/   — sandboxed shell execution
```

### Build System

- pnpm workspaces + Nx
- pnpm strict catalogs for version consistency
- ESM-first
- **`tsgo` (@typescript/native-preview 7.0.0-dev)** — Go-based native TS compiler for typechecking and building. `tsgo -b` with `--builders N` for parallel monorepo builds. `tsc` (TypeScript 6.0.3) kept at workspace root only for `typescript-eslint` compatibility.

### Runtime & Distribution

- **Bun is the runtime for the TUI host app.** The OpenTUI native Zig renderer requires FFI, available stably only on Bun — the Node 26.3.0 `--experimental-ffi` path is more fragile and a worse install story. Bun is now the chosen runtime _and_ distribution path. See [[host-layer]], [[host-layer/research/tui-framework]].
- ~~**Bun is quarantined to the host adapter.**~~ **Superseded (2026-07-02): Bun is the single runtime everywhere.** The quarantine was dropped deliberately — the product runs on Bun, so tests, engine, and packages exercise the same runtime ([[testing-strategy]]). Engine now uses `Bun.*` where it's the best tool (`Bun.TOML.parse` for `mesh.config.toml`), `bun-types` is a devDep across packages, and vitest was removed. Runtime-swappability is no longer a goal; `bun build --compile` distribution makes the runtime an implementation detail.
- **Distribution: per-platform self-contained binaries via `bun build --compile`** — bundles the Bun runtime + JS + the native OpenTUI `.so/.dylib` into one executable; users install nothing.
- **Toolchain provisioning (2026-07-02): pnpm stays the package manager; bun is provisioned BY pnpm.** `bun` (stable, catalog-pinned `^1.3.14`) is a root devDependency with `allowBuilds: bun: true`, so `git clone && pnpm install` fetches the platform binary into `node_modules/.bin` on any device (proven on minerva/darwin) — no system bun install, no version drift across the mesh. `pnpm run` scripts resolve that pinned bun via PATH. Trade-off accepted: npm ships stable only (no canary).

### Config & Env Resolution (`@kuib-ai/env`, 2026-07-01)

**Single root config, not per-package** — because kuib ships as ONE binary, there's logically one config, so a per-package layered `.env` + `metadata`-introspection model is over-engineering here. Two contexts, one Zod schema:

- **Dev** — load root `.env` / `.env.<mode>` into `process.env` (convenience), then validate.
- **Binary** — no files; `process.env` (+ future `~/.kuib/config`) is authoritative.

Resolution precedence (full): `schema defaults < ~/.kuib/config < OS env < CLI flags` (+ dev `.env` loaded first). v1 ships the floor (`defaults → .env → process.env`, Zod-validated); the `~/.kuib/config` + CLI layers come with the daemon/app work.

- **Flat `KUIB_*` prefix**, Zod-validated into a typed `Env`.
- **Engine stays config-injected** — the provider takes a `ModelConfig`; only the app entry calls `bootstrapEnv()` and passes config down. Engine never reads `process.env`.
- **Secrets boundary** — API keys come from `.env` in **dev only**; in production from **OS secure storage**, never a committed/synced file ([[security-model]]). `.env*` is gitignored (`.env.example` committed). The old hardcoded provider URL/key is removed.

## Open Questions

- Web UI framework choice (later — separate host adapter, not engine concern)
- Testing strategy across packages

## Resolved

- **TUI framework → OpenTUI + Solid reconciler** (Zig native core, fine-grained reactivity = render-only-on-change, flicker-free double-buffered cell rendering). See [[host-layer]], [[protocol-design]].
- **Embed nvim subprocess vs grid → deferred to v1.x.** v1 is nvim-_flavored_ (OpenTUI keymap/leader), not real embedded nvim. See [[nvim-integration]] (now `stale`).
