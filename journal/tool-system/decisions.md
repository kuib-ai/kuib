---
title: "Tool System"
type: implementation
status: in-progress
layer: architecture
created: 2026-07-01
tags: [tools, single-source, file-system, interface, daemon, ai-sdk, dedup]
depends-on:
  [
    "[[architecture-overview]]",
    "[[provider-architecture]]",
    "[[security-model]]",
  ]
informs: ["[[host-layer]]"]
---

# Tool System

Builds the `packages/tools` layer the `[[architecture-overview]]` always prescribed but that was never created. Resolves the tool-definition duplication (schemas declared both in the engine's inline AI-SDK `tool()` blocks and in the daemon's per-tool tRPC procedures).

## Root cause of the duplication

`tools/` was skipped, so tools were **inlined into the engine orchestrator** (AI SDK `tool()` with a hand-written `inputSchema` + `execute`), while the daemon grew a **parallel per-tool procedure** with its own `io/*.input` schema. The input Zod schema therefore lived in two files. Not intrinsic — a symptom of the missing layer.

## The model — single source of truth, three roles

- **`packages/protocol`** — the source of truth for tool I/O schemas AND the `FileSystemPort` interface. `FileSystem.ReadFileInput` / `ReadFileOutput` are Zod (default-exported, house style); `FileSystemPort` is a type-only port (mirrors `EventLogPort`).
- **`packages/tools`** — each tool defined **once** via `defineTool({ name, description, input, execute })`. `execute` calls a **protocol interface** (`ctx.fs.readFile`), never the daemon directly — preserving the `protocol ← tools ← engine` dependency flow. `tool.registry` is the flat list.
- **`packages/daemon`** — exposes **generic fs/shell primitives** (`readFile` etc.), NOT per-tool procedures. `readFile` now imports its schema from `protocol` (the daemon's local `io/read.file.*` was deleted).
- **engine adapter** (`provider/build.tools`) — converts the `tools` registry → AI SDK tool map, injecting a `ctx` whose `FileSystemPort` is backed by the daemon tRPC client (`daemon.file.system`). This also fixes the `provider-architecture` drift where the engine imported the AI SDK directly for tools — the SDK conversion now lives in the provider adapter.

**Consequence:** adding a tool that composes existing primitives = **one file in `packages/tools`**, zero daemon changes, zero re-declared schemas. Only a genuinely new _capability_ (network, new fs op) adds a `FileSystemPort`/daemon method. Risk tiering (`[[security-model]]`) will ride the `ToolSpec` (single place tools + risk are declared).

## Tool lifecycle events come from the stream, not the tool

The generic adapter's `execute` stays pure (interface call only). `TOOL_CALL_STARTED` / `TOOL_CALL_COMPLETED` are emitted by the **orchestrator's `fullStream` loop** (the same place `text-delta` / `reasoning-delta` are emitted), off the AI SDK `tool-call` / `tool-result` parts. Keeps event authorship in the engine and the tool package presentation-free.

## v1 scope

- **readFile only.** `executeCommand` / `writeFile` daemon procedures still exist as primitives but are **not** exposed as agent tools (per the "only read file access for now" decision).
- Context assembly (`build.messages`) folds user + assistant-text turns; tool-call/result replay into model context is a separate follow-up (they persist in the log regardless).

## Verified (2026-07-01)

Typecheck clean across protocol/tools/daemon/engine. End-to-end against minerva (`qwen3.5:9b`) + a live daemon: model called `readFile`, daemon returned `{"content":"The secret code is BANANA-42.\n"}`, `tool-call-started`/`tool-call-completed` recorded in the log, model answered `BANANA-42`.

## Open / follow-ups

- **Daemon lifecycle — DONE (2026-07-01):** the daemon runs as a separate process over a **unix socket** (`~/.kuib/daemon.sock`, dev `./dist/daemon.sock`; the `.sock` is the mutex), and the host **auto-spawns it idempotently** via `ensureDaemon` (probe socket → spawn `start.daemon` detached if absent). The engine reaches it through `TransportFactory` (unix-socket `fetch` with the `unix` option), with the per-user mesh-IP:port remote branch seam-ready for v1.x. No `apps/daemon` app is needed; `start.daemon` is the spawn target. Path resolution expands `~` at the fs boundary (`expand.home.path`). See [[host-layer]].
- **Error escalation hardening — DONE (2026-07-02):** `tool-error` stream part → `TOOL_CALL_FAILED` emission wired in the orchestrator (reason `FAILED`; makes the transcript fold's failed branch reachable). Stream-level `error` parts rethrow into the `MESSAGE_FAILED` path (previously swallowed → silent 43ms empty turns). `ensureDaemon` now **throws** after its probe deadline instead of resolving void, and both hosts' `main()` catch startup rejections to stderr instead of unhandled-rejection silence. `write.file` procedure routes through `expandHomePath` like `read.file`. Dev daemon socket resolves from the **workspace root**, not cwd; `pnpm reload` kills the detached daemon + engine-service so code changes actually load.
- `writeFile`/`executeCommand` daemon procedures are **intentional dormant primitives** (v1 exposes only `readFile` as an agent tool) — not dead code; each becomes a tool by adding one file in `packages/tools`.
- `build.messages` now uses `Protocol.Event.EventTypeEnum`/`Part.PartTypeEnum` (was hardcoded strings drifting from the enum single source of truth).
- Risk field on `ToolSpec` + remote-origin elevation ([[security-model]]).
- Extract the transcript fold to a shared package (still duplicated between TUI and web).
