---
domain: host
---

# Host — decisions

### D001 — The engine runs in the `serve` process, never inside a UI host

- Status: accepted
- Context: When the terminal UI ran the agent loop in-process, closing it killed the run mid-stream and appends to the event log stopped. Appends survive a UI exit only if the appending process survives.
- Decision: The agent loop runs in the `serve` role, which owns the engine-service socket and is the single writer of the SQLite event log. A UI host is a thin, attachable client that renders the log and submits user events; it never embeds the engine.
- Consequences: A UI restart never kills a run; durability across quit comes from the event log, not a kept-alive UI process. The engine-service idles out (`reapIdleMs`) instead of lingering.
- Supersedes: —
- Superseded by: —
- From: [[_archive/host-layer/decisions#Engine vs engine-service, control/data-plane split, host read access (2026-07-01)]] | [[_archive/host-layer/decisions#Node composition + corrected lifecycle (2026-07-01, supersedes "detached-child default")]]

^D001

### D002 — The host keeps only non-UI plumbing until kuib's own TUI library exists

- Status: accepted
- Context: The OpenTUI/Solid view layer, the web host and the wireframe app were built on a stack kuib is replacing with its own terminal UI library.
- Decision: The view layer was deleted rather than ported. `apps/host-tui` keeps its CLI, the `serve` command, logging and daemon-client resolution; `kuib` with no command prints usage instead of rendering.
- Consequences: There is no interactive UI; screen wireframes remain the UX truth for the future library. The host has no `@opentui/*` or `solid-js` dependency.
- Supersedes: —
- Superseded by: —
- From: [[features/deno-runtime/plan]] | [[_archive/host-layer/decisions#v1 Frontend — OpenTUI + Solid (nvim-flavored)]]

^D002

### D003 — Deno runs the host from source; tsgo type-checks

- Status: accepted
- Context: Bun was chosen only for OpenTUI's FFI renderer. With OpenTUI gone, Deno is the runtime, and Deno-specific tooling fights the pnpm workspace.
- Decision: The host is executed with `deno run` / `deno test --no-check` directly on TypeScript with explicit `.ts` import specifiers; pnpm resolves packages, Nx runs tasks, `tsgo` is the only type-checker. There is no `deno.json`.
- Consequences: No build or transpile step on the start path; `Deno.*` and `node:*` APIs are both available to host code.
- Supersedes: —
- Superseded by: —
- From: [[features/deno-runtime/plan]] | [[_archive/host-layer/decisions#Runtime]]

^D003

### D004 — One entry, argv selects the role

- Status: accepted
- Context: A node needs different processes (engine service, daemon, UI host) that should ship as one artifact and be spawnable by the same invocation an OS service unit runs.
- Decision: `apps/host-tui/src/index.ts` is the single entry; the first positional argument selects the role (`serve` today), and no argument prints usage.
- Consequences: New roles are new cases in the dispatch and entries in the `run` table, not new apps.
- Supersedes: —
- Superseded by: —
- From: [[_archive/host-layer/decisions#Single binary, multi-role distribution]]

^D004

### D005 — The daemon is addressed by node identity, not by URL

- Status: accepted
- Context: The engine's file and shell tools must be able to execute on another mesh node, and the network substrate (static TOML now, a coordinator later) must stay swappable.
- Decision: The host resolves its daemon client from `target.node`: the local node label means the local daemon endpoint; any other value is parsed as a `NodeID` and resolved through static discovery built from `mesh.config.toml` and the mesh transport factory.
- Consequences: Remote execution is a config switch; replacing discovery does not touch the engine. An unknown node fails at startup.
- Supersedes: —
- Superseded by: —
- From: [[_archive/distributed-mesh-state/decisions#Implementation status — Layer 1 (node resolution seam) — DONE]] | [[_archive/multi-device-ux/decisions#Discovery contracts (substrate-agnostic) (2026-07-01)]] | [[_archive/multi-device-ux/decisions#Node identity & addressing — `user@device` (2026-07-01)]]

^D005

### D006 — Telemetry is started by the process that runs the model

- Status: accepted
- Context: Model calls need per-turn tracing, but the engine package must not take on the OpenTelemetry dependency stack or read the environment.
- Decision: Telemetry initialisation is a process-level host responsibility: `serve` calls `Telemetry.startTelemetry` once with the configured endpoint and an injected service name.
- Consequences: Tracing is opt-in by config and stays out of the engine; a different exporter can be swapped behind `startTelemetry`.
- Supersedes: —
- Superseded by: —
- From: [[_archive/observability/decisions#Decision]]

^D006

### D007 — Hosts thread pending submits into the running turn

- Status: accepted
- Context: A submit arriving mid-run used to start a second concurrent run on the same session, interleaving the transcript.
- Decision: The engine service allows one active turn per session and queues later submits; the host's `runTurn` passes the service's `takePending` (and `onAbort`) into `runAgent` so pending messages steer the running turn at step boundaries.
- Consequences: The host adapter is the seam where queueing and the agent loop meet; it must forward both callbacks.
- Supersedes: —
- Superseded by: —
- From: [[_archive/host-layer/decisions#Turn scheduling — per-session queue + step-boundary steering (2026-07-02)]]

^D007

### D008 — Watch-restart dev loop, no hot reload

- Status: accepted
- Context: Hot module reload for a terminal host is self-plumbed and leak-prone; reference TUIs iterate with fast cold restarts over a persistent server.
- Decision: `dev:watch` hard-restarts the host on edit (`deno run --watch`); session state lives in the engine service and event log, not in the host process.
- Consequences: Restarts are cheap because nothing is transpiled or bundled and no run is lost.
- Supersedes: —
- Superseded by: —
- From: [[_archive/host-layer/decisions#TUI dev loop — no HMR anywhere; watch-restart against the persistent engine (2026-07-03)]]

^D008

### D009 — CLI flags are the highest-precedence config layer

- Status: accepted
- Context: Paths and settings resolve from defaults, the config file and environment; a single invocation must be able to override any of them.
- Decision: The host passes parsed flags as the `cli` overrides of `Config.bootstrapConfig` (precedence `defaults < config file < env < CLI`) and creates the resolved application directories before anything writes to them.
- Consequences: The host owns no path logic of its own; file names and base directories come from the config package.
- Supersedes: —
- Superseded by: —
- From: [[_archive/application-directories/decisions#Decision]]

^D009
