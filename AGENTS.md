# kuib

kuib is an AI agent engine built around transparency and control over what reaches the model:
an event-logged agent loop (`core`), a daemon that executes filesystem/shell work on each device
of a user's mesh, and host adapters such as the terminal host (`host`). Ana, a voice-driven
personal assistant, is the first application on the engine; its speech-to-text services live in
`services/` (`product`).

This file is the single instruction source for every agent tool (Claude Code, Cursor, Gemini
CLI, Antigravity, Codex). Tool-specific files are generated from it and from `.agents/` by
`pnpm agents sync` — edit here or in `.agents/`, never in `.claude/`, `.cursor/`, `.gemini/`.

## Working here

- pnpm workspace + Nx task runner; **Deno is the runtime** (no Bun, no `deno.json`); `tsgo`
  type-checks against generated Deno types.
- **Always leave the codebase green**: `pnpm run check` (agent-config sync, journal, typecheck,
  lint, format — cached via Nx) must pass before ending a task. Never silently ignore type
  errors or lint failures; fix them.
- **Python always runs through uv**: `uv run …` / `uvx …`, never bare `python`, `python3` or
  `pip`. Scripts carry PEP 723 inline metadata and the shebang
  `#!/usr/bin/env -S uv run --script`; projects (e.g. `services/stt-mlx`) use `uv sync`/`uv run`.
- New packages include `"lint": "eslint ."` and `"format": "prettier --write ."` in
  `package.json` so they join the Nx caching loop.
- Commits: `feat|fix|chore|docs: <short message>`; never mention AI/agents in commits; never
  push without explicit instruction.

## Context: the journal

`journal/SPEC.md` is the contract — read it when working on the journal; never restate its rules
from memory. Three layers, one job each:

1. **Roadmap** (`journal/roadmap/`) — intent: everything not built yet. Items `R###-<slug>.md`
   with graph edges; `ROADMAP.md` (generated) lists them; `inbox.md` holds raw one-liners.
2. **Domains** (`journal/domains/{product,core,host,infra}/`) — built truth. `current.md`
   paragraphs end in `^C###` with a `[!sources]` callout citing the code; `decisions.md` is the
   append-only why. Every tracked file is owned by exactly one domain.
3. **Features** (`journal/features/<feature>/`) — work in flight: `plan.md` +
   `implementation.toml`, linked to a roadmap item and to the domain claims it relies on.

`journal/_archive/` holds legacy entries being retired; never add to it or cite it as truth.
Every TS module's first line `// @context @journal/domains/<domain>[#^C###]` names the context
that explains it.

### Lifecycle

- Idea → `/journal-start` (inbox line or roadmap item). Unclear exploration → scratchpad.
- Concrete plan → `/journal-graduate <feature> <R###>` before implementation.
- During implementation: update `implementation.toml` checkpoint/item states after every major
  milestone; add decisions, phases and gaps to `plan.md` as they happen; point refs at real files.
- Shipped → `/journal-promote <feature>`: truth into domain claims, rationale into domain
  decisions, leftovers into roadmap items.
- Bug-fix / debugging → tracked via commits, no journal entry needed.
- After context compaction or in a fresh session → `/remember <feature>`.

### Keeping context true

- Changing code a claim cites → update the claim in the same change and
  `pnpm journal stamp <domain>#C###`.
- Periodically, or when `pnpm journal drift` shows drift → `/context-audit <domain>`.
- New TS modules start with `// @context @journal/domains/<owner>` (narrow to `#^C###` when one
  claim is primary).
- `pnpm journal build && pnpm journal check` after journal changes; `/journal-validate` adds
  drift and semantic review.

### Wireframes (screen-level UX truth)

- Every screen (route or dialog) has exactly ONE wireframe file: `exploring` ones in
  `journal/roadmap/wireframes/`, `adopted` ones in `journal/domains/host/wireframes/`. Never per
  component; runtime states are frames inside the screen's file.
- Read a screen's wireframe before designing or modifying the screen.
- When an implementation permanently diverges, mark the wireframe `superseded` (+
  `superseded-by`) — never silently edit a sketch to match code. Details: SPEC → Wireframes,
  `/wireframe`.

## Multi-agent work (tmux)

One orchestrator per tmux session spawns worker agents as new windows of that session.
Orchestrator: `/orchestrate <feature>` (`.agents/skills/orchestrate/SKILL.md`), tool
`bin/orchestra`. Every task is a journal record under `journal/features/<feature>/tasks/`. A
session started with a prompt naming an orchestra task is a worker: follow
`.agents/skills/orchestrate/WORKER.md`. Worktrees are created and managed by the user only.
`bin/` holds helper scripts meant to be run by hand.

## Skills

`.agents/skills/<name>/SKILL.md`: `remember`, `journal-start`, `journal-graduate`,
`journal-validate`, `journal-promote`, `context-audit`, `wireframe`, `orchestrate`, plus the
`firecrawl-*` web skills. Invoke as `/<name>` where the tool supports it; otherwise read the
SKILL.md and follow it.

<!-- journal:generated:start -->
<!-- Generated by scripts/journal.ts build. Do not edit. -->

### Code map

| Path | Domain | Description |
|---|---|---|
| `apps/host-tui` | host | Terminal host for Kuib AI |
| `packages/cli` | host | kuib lightweight cli parser and help generator |
| `packages/config` | infra | kuib configuration loading, precedence, and application paths |
| `packages/daemon` | core | kuib node-local fs/shell executor (tRPC) |
| `packages/deno-types` | infra | Deno runtime declarations for tsgo, generated from the installed deno binary |
| `packages/engine` | core | kuib engine — agent loop, event log, daemon dispatch |
| `packages/engine-service` | core | kuib engine-service — process host for the agent loop |
| `packages/env` | infra | kuib environment bootstrap and platform base directories |
| `packages/eslint-plugin-house-style` | infra |  |
| `packages/event-log-sqlite` | core | kuib event log — node:sqlite adapter |
| `packages/protocol` | core | kuib protocol — schemas, events, and interfaces |
| `packages/std` | infra | kuib shared primitives |
| `packages/telemetry` | infra | kuib telemetry — OpenTelemetry span export for the AI SDK to Phoenix |
| `packages/tools` | core | kuib tool definitions — single source of truth, backed by protocol interfaces |
| `packages/transcript` | core | kuib transcript fold — event log → display entries, shared by host adapters |
| `packages/tsconfig` | infra |  |
| `services/stt-coreml` | product |  |
| `services/stt-mlx` | product | Qwen3-ASR inference service via MLX on Apple Silicon |

### Domains

- `journal/domains/core/current.md` — Agent loop, protocol schemas, event log, tools, daemon and engine-service.
- `journal/domains/host/current.md` — Host adapters: the terminal host and its CLI surface.
- `journal/domains/infra/current.md` — Workspace tooling, config/env/std/telemetry foundations, lint rules, agent wiring and the journal itself.
- `journal/domains/product/current.md` — Ana voice assistant: speech-to-text services and their clients.

### Features in flight

- `journal/features/agent-harness/` (implementing) — One source (AGENTS.md + .agents/) generates every agent tool's config, and a tool-agnostic tmux orchestra lets one orchestrator spawn and coordinate worker agents.
- `journal/features/codebase-review/` (implementing) — Parallel reviewer agents audit the codebase and its domain claims; findings are triaged and fixed.
- `journal/features/context-system/` (implementing) — Replace the drifting context graph with three layers — roadmap (intent), domains (code-attributed truth), features (in flight) — plus deterministic drift detection so domain context is periodically corrected.
- `journal/features/deno-runtime/` (implementing) — Strip OpenTUI/Solid/Bun and run every TS project on Deno as a pure runtime — pnpm resolves packages, Nx runs tasks, tsgo type-checks against Nx-generated Deno types. No deno.json. Clears the ground for kuib's own TUI library.
- `journal/features/stt-engine/` (implementing) — Unified STT service on M4 Mac Mini (minerva) — FluidAudio for Parakeet CoreML/ANE, mlx-swift for Qwen3-ASR, single unix socket API. TypeScript client in monorepo.

### Roadmap: now

- R001 Three-layer context system with drift detection (graduated)
- R002 Deno as the only runtime (graduated)
- R003 Local speech-to-text engine for Ana (graduated)
- R004 Uniform agent harness and tmux orchestration (graduated)
- R005 Codebase review and fixes (graduated)

<!-- journal:generated:end -->
