# Plan: Protocol Design

## Problem Statement

kuib needs a protocol layer that defines the vocabulary shared across all packages. It must support: provider abstraction (AI SDK compatible but overridable), SQ/EQ communication, discussion clustering, cross-device resumption, and smart security — all with runtime validation via Zod.

## Proposed Solution

Zod-first schema definitions in `@kuib/protocol`. Every data type is a Zod schema; TypeScript types are inferred via `z.infer<>`. Behavioral interfaces (methods) remain as TS interfaces. Single runtime dep: `zod`.

## Phases

### Phase 1: Core Protocol (DONE)

**Files:**

- [x] `packages/protocol/src/*.ts` — all 11 schema modules
- [x] `packages/protocol/package.json` — package config (zod dep, tsgo build)
- [x] `packages/protocol/tsconfig.json` — TS 7.0 config (composite, NodeNext, tsbuildinfo in dist/)

### Phase 2: Engine

**Files:**

- [ ] `packages/engine/` — orchestration, agent loop (plain while loop, not XState), state management via protocol's reducer system

### Phase 3: Provider Adapters

**Files:**

- [ ] `packages/providers/` — Anthropic, OpenAI, OpenRouter adapters wrapping AI SDK, implementing protocol's `LanguageModel` interface

### Phase 4: Tools

**Files:**

- [ ] `packages/tools/` — tool implementations (file read/write, shell exec, search), using protocol's `ToolExecutor` interface and `IOContext` for DI

### Phase 5: TUI

**Files:**

- [ ] `packages/tui/` — terminal UI (OpenTUI + SolidJS reconciler or custom)
- [ ] `apps/cli/` — entry point, wires IOContext + providers + tools + engine

## Verification

- `tsgo --noEmit` passes for all packages
- `tsgo -b` produces clean build with `.js` + `.d.ts` + source maps
- Consumer packages can import and use protocol types with full type safety
- Zod validation works at transport boundaries (WebSocket, checkpoint deserialization)
