# kuib

kuib is an AI agent engine built around transparency and control over what reaches the model:
an event-logged agent loop (`core`), a daemon that executes filesystem/shell work on each device
of a user's mesh, and host adapters such as the terminal host (`host`). Ana, a voice-driven
personal assistant, is the first application on the engine; its speech-to-text services live in
`services/` (`product`).

This file is the single instruction source for every agent tool (Claude Code, Cursor, Gemini
CLI, Antigravity, Codex). Tool-specific files are generated from it and from `.agents/` by
`pnpm agents sync` — edit here or in `.agents/`, never in `.claude/`, `.cursor/`, `.gemini/`.

## Working rules

- pnpm workspace + Nx task runner. **Deno is only the runtime**: the workspace's own Deno
  (`./node_modules/.bin/deno`, on PATH inside `pnpm` scripts) runs code with `--no-check`;
  there is no `deno.json`. Never run `deno check`, `deno install` or `deno add` — without a
  `deno.json` Deno rewrites the root `package.json` from `pnpm-workspace.yaml`.
- **`tsgo` is the only type-checker**, against the Deno declarations generated into
  `packages/deno-types`. Dependencies are added through pnpm and the catalog.
- **Always leave the codebase green**: `pnpm run check` (agent adapters, journal, typecheck,
  lint, format — cached via Nx) must pass before ending a task. Never silence type errors or
  lint failures; fix them.
- **No prose comments in code** — code is self-explanatory. The only comments are directives:
  `@claim` links, eslint/ts directives, shebangs.
- **Python only through uv** (`uv run …`, `uvx …`, PEP 723 scripts, `uv sync` in projects such
  as `services/stt-mlx`); never bare `python`, `python3` or `pip`. Workspace tooling is
  TypeScript.
- New packages include `"lint": "eslint ."` and `"format": "prettier --write ."`.
- Commits: one line, `feat|refactor|chore: <description>`; no body, no attribution; never push
  without explicit instruction. Never mention AI/agents in commits; commit only when asked.
  Worktrees and branches belong to the owner.

## Why context lives on disk

Everything a session learns that matters later is written to the journal, next to the code, in
git. That is what makes this workspace work across sessions, tools and agents:

- **Any session picks up where another left off.** A fresh session, a compacted one, another
  tool or another machine reads the same plan, checkpoint and handoff note — nothing important
  lives only in a chat.
- **Truth stays tied to the code.** Claims are anchored to the exact code scopes they describe,
  so drift is detected mechanically the moment that code changes, and any agent editing a
  function sees which truth it carries.
- **Handoffs cost nothing.** State is recorded as work happens, so a handoff is rendered, not
  written; only a short note is added.
- **Decisions keep their reasons.** Rulings are stored in the owner's words and decisions are
  append-only, so nobody re-litigates what was settled.
- **Many agents can work at once.** Tasks, briefs and reports are files, so an orchestrator
  learns what workers did by reading, not by being messaged.

Persist early and often: a decision, ruling, finding or state change that is only in the
conversation is lost at the next compaction.

## The journal

`journal/SPEC.md` is the contract (formats, fields, commands) — read it before editing journal
files. Three layers, one job each, all markdown with YAML frontmatter:

- **Roadmap** (`journal/roadmap/items/R###-<slug>.md`) — intent: everything not built yet, as a
  graph (`depends-on`, `converges-with`, `split-from`, `absorbed-into`). A raw idea is an item
  with `state: idea`. `ROADMAP.md` is generated.
- **Domains** (`journal/domains/{product,core,host,infra}/`) — built truth. `current.md` holds
  claims: paragraphs ending in `^<slug>` with a folded `[!sources]` callout; `decisions.md` is
  the append-only why. Each domain owns files by `code:` globs.
- **Features** (`journal/features/<feature>/plan.md`) — work in flight: objective, phases,
  items with `State`/`Refs`, decisions (with the owner's rulings), gaps, and a frontmatter
  checkpoint (summary, next, blockers, note). Delegated work lives in `tasks/<task>/`.

`journal/_archive/` holds legacy entries being retired; never add to it or cite it as truth.

### Code ↔ truth

Code points at its explanation with `@claim` directives; nothing points back by hand:

- the first line of a module — `// @claim <domain>[/<claim>]` — names what explains it
  (required for TS modules in `apps/` and `packages/`, enforced by lint);
- `// @claim <domain>/<claim>` (or `# @claim …`) above a declaration, statement or block ties
  that claim to that scope, in any language with line comments.

`pnpm journal stamp` turns the links into the claim's sources with a hash per scope. When you
change code under a link, the claim is flagged; before committing, read the claim against the
code, rewrite it if it no longer holds, and stamp it. `pnpm journal claims <file>` lists the
truth tied to a file.

### What the tools can do

- `pnpm journal check | build` — validate the journal and code links; regenerate indexes.
- `pnpm journal drift [--files]` — claims whose evidence changed, stale roadmap items,
  attribution coverage. `pnpm journal gate` — fails until every claim is fresh (commit time).
- `pnpm journal stamp <domain>[/<claim>] | --all` — record that claims were verified.
- `pnpm journal set <feature> <item> <state> [--ref path=role]` and `pnpm journal checkpoint
  <feature> [--summary] [--next] [--blockers] [--note]` — write plan state.
- `pnpm journal handoff <feature>` — the rendered handoff: checkpoint, note, rulings, open
  questions, unfinished items, tasks, claims to re-verify.
- `pnpm agents sync [--force] | check` — `sync` previews what would change in the generated tool
  adapters and writes nothing; `--force` applies it: MCP servers a tool added are imported back
  into `.agents/mcp_config.json`, every adapter is rewritten (hand edits are overwritten).
- `pnpm orchestra …` — run worker agents in tmux windows (see below).

### The session hook

Every tool runs `.agents/hooks/journal-context` at session start (Claude Code also after
`/clear` and compaction). It injects what fits where the session runs: an orchestra worker
window gets its task, brief and log; the orchestrator pane gets the rendered handoff of its
feature; any other session gets the features in flight with their checkpoints, notes and the
number of claims awaiting re-verification.

### Skills

`.agents/skills/<name>/SKILL.md`, invoked as `/<name>` where supported (otherwise read and
follow the file):

- `remember <feature>` — load a feature with exactly the context it declares;
- `journal-start` — capture an idea as a roadmap item or start a scratchpad;
- `journal-graduate <feature> <R###>` — turn a clear plan into a feature;
- `journal-promote <feature>` — ship: truth into domain claims, rationale into decisions;
- `journal-validate`, `context-audit [domain]` — structural checks and claim correction;
- `wireframe` — screen wireframes (one file per screen; read it before touching a screen);
- `orchestrate <feature>` — run this session as an orchestrator;
- `firecrawl-*` — web research.

Bug-fix sessions need no journal entry beyond keeping the touched claims true.

## Multi-agent work (tmux)

One orchestrator per tmux session spawns worker agents as windows `w:<task>` of that session
with `pnpm orchestra`; see `/orchestrate` (`.agents/skills/orchestrate/SKILL.md`). Every task is
a journal record under `journal/features/<feature>/tasks/`. Workers never message the
orchestrator: they write their own files and set their own status; the orchestrator finds out
through `pnpm orchestra watch`. A session started with a prompt naming an orchestra task, or
running in a `w:<task>` window, is a worker: follow `.agents/skills/orchestrate/WORKER.md`.

<!-- journal:generated:start -->
<!-- Generated by pnpm journal build. Do not edit. -->

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
| `tooling` | infra | kuib repo tooling — journal, agent adapters and the tmux orchestra |

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
- R221 Self-contained engine — one entry that owns its wiring and its single-instance start (shaped)

<!-- journal:generated:end -->
