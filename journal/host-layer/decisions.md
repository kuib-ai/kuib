---
title: "Host Layer"
type: implementation
status: open
layer: experience
created: 2026-06-18
tags: [host, opentui, solid, bun, nvim, ui, panes, adapter]
depends-on:
  [
    "[[architecture-overview]]",
    "[[comprehension-model]]",
    "[[protocol-design]]",
    "[[nvim-integration]]",
  ]
informs:
  [
    "[[context-bootstrap]]",
    "[[discussions-ux]]",
    "[[nvim-integration]]",
    "[[multi-device-ux]]",
    "[[ux-iteration-process]]",
  ]
---

# Host Layer

## Current Decisions

### Role

**Host sits between engine and presentation.** Engine owns truth (event log, context assembly, agent loop). Host renders state and emits `User*` events. Engine never imports host.

### HostProtocol (Contract)

Host adapter responsibilities:

- **Render** — apply engine events to surfaces (buffers, highlights, quickfix, empty states)
- **Focus** — manage pane focus and keyboard routing
- **Emit** — translate user actions to protocol events (`UserMessageSubmitted`, `UserPartExcluded`, `UserDiscussionToggled`, etc.)
- **Subscribe** — receive engine event stream for live updates

Migration path: same protocol for NvimHost (v1), DesktopHost, WebHost later.

### v1 Frontend — OpenTUI + Solid (nvim-flavored)

v1 frontend is an **OpenTUI** app (Zig native core) driven by the **Solid** reconciler, run on **Bun** (FFI for the native renderer). Fixed pane layout (Yoga/flexbox):

```
┌─ Conversation ─────────────┬─ Project Map / Ledger ────────┐
│  messages + discussions    │  hunks OR bootstrap map       │
├─ Ledger (when code exists) ┴───────────────────────────────┤
│  hunk index (agent order)                                  │
└─ Code ─────────────────────────────────────────────────────┘
```

- **Panes compose OpenTUI primitives** — `scrollbox`/`text`/`markdown` (Conversation), `select`/`box` (Ledger, discussion selection), `code`/`line-number`/`diff` + tree-sitter (Code). Most of the v1 surface is composition, not construction.
- **vim-flavored, NOT embedded nvim** — modal navigation/selection via OpenTUI's keymap/leader system (normal/visual, hjkl, operators). Minimal verb set bound to real actions (navigate, visual-select parts, save/exclude/toggle discussion, preview payload) — not a vim emulator.
- **Flicker-free + render-on-change** — OpenTUI's double-buffered cell diffing + Solid's fine-grained reactivity; no fixed render loop.
- Conversation: linear messages, part exclude, discussion overlay. Ledger: hunk list (empty state in design phase). Project Map: greenfield bootstrap (see [[context-bootstrap]]).

**Real embedded nvim (subprocess via `nvim_ui_attach` or pty) is deferred to v1.x** for the code-editing pane. v1 has no nvim dependency. See [[nvim-integration]] (now `stale`) and [[host-layer/research/tui-framework]].

### Runtime

Host app runs on **Bun** — stable FFI for the OpenTUI native renderer (the Node 26.3.0 `--experimental-ffi` path is more fragile, worse distribution). Bun is **quarantined to this adapter**; engine + core packages stay runtime-agnostic (see [[architecture-overview]]). Distribution: `bun build --compile` → per-platform self-contained binary.

### Coupling Rule

```
Agent/daemon → always pushes surface state into host (never waits on user opening a file)
User in host → optional signals back (cursor, qf index) for "attended" status
User in ledger/conversation → can drive code pane without code pane being a gate
```

Loop prevention required when UI selection jumps code pane and code events echo back (vscode-neovim pattern: locks + debounce).

### Not in Host

- Context assembly logic (engine)
- Discussion schema (protocol — UX in [[discussions-ux]])
- LLM provider calls (engine)

### Terminology lock (Host / Engine / Service / Daemon)

Precise vocabulary, since "daemon" and "engine" were being conflated:

- **Host** — thin TUI/web client. Renders the committed log, submits `User*` events. Owns nothing; dies when the TUI closes.
- **Engine** — agent loop + event log. The thing the host actually depends on.
- **Service** — the RPC front exposing the Engine + session store over the network (tRPC). Wraps the Engine.
- **Daemon** — node-local fs/shell executor. The Engine calls the Daemon to touch disk / run commands.

Dependency direction: **Host → Service/Engine → Daemon.** The host never talks to the daemon directly (the current spike collapses this — host calls daemon over Connect; the reshape routes host → engine → daemon). See [[consensus-model]], [[multi-device-ux]].

### Engine lifecycle & idempotent discovery

The host must always have an Engine. Discovery is single-instance, socket-lock based (the `gpg-agent` / docker-daemon / language-server pattern):

```
host starts
  → try to connect to the known endpoint (unix socket ~/.kuib/engine.sock or PID/lockfile)
    ├─ reachable?  → an Engine/Service is already running (background service) → USE IT
    └─ not?        → spawn one, then connect
```

Spawn flavors: **in-process** (same Bun binary runs Engine+Daemon as async tasks — simplest, dies with the TUI) vs **detached child** (`kuib serve` survives the TUI closing, so an in-flight run isn't killed — better default once runs are long). **Idempotency mechanism:** bind `~/.kuib/engine.sock`; `EADDRINUSE` → already serving → connect as client; else become the server. The background OS service and the host-spawned child are the **same `kuib serve`** — whoever wins the lock serves, everyone else connects. At most one Engine per device.

### Single binary, multi-role distribution

One `bun build --compile` artifact contains Service + Daemon + TUI; argv selects role:

- `kuib` → TUI host (default); spins a local Service + Daemon in-process if none running
- `kuib daemon` → daemon only (a remote mesh node — "remote hands")
- `kuib serve` → Service/Engine only (headless leader / voter)
- `kuib up` → all-in-one local (the common local case)

`apps/kuib/src/index.ts` is the single compile entry that wires `packages/{protocol,engine,daemon,service}` and dispatches on role.

### Background service / "remote node when idle" — packaging standard

For a device to be a reachable mesh node with the TUI closed, the **Daemon** (+ **Service** if it's a voter) runs headless under the OS service manager. **One canonical unit template lives in the repo** (`kuib.service` / `ai.kuib.plist`); three delivery channels reuse it:

| Channel               | Who places the unit                                                  | Where                                                  | Activation                          |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------- |
| **curl / raw binary** | the binary embeds the template, writes it via `kuib service install` | `~/.config/systemd/user/` or `~/Library/LaunchAgents/` | self, opt-in                        |
| **pacman / AUR**      | `PKGBUILD` installs the same file                                    | `/usr/lib/systemd/system/`                             | `sudo systemctl enable --now kuib`  |
| **deb / rpm**         | package + systemd macros                                             | `/usr/lib/systemd/system/`                             | user enables (distro policy varies) |
| **Homebrew**          | formula `service do … end` block                                     | brew-managed plist                                     | `brew services start kuib`          |

Key facts:

- The unit's `ExecStart` is a **path reference** to the installed binary (`/usr/bin/kuib daemon`) — a pointer, not a copy. Update the binary → restart picks up the new one.
- "Auto-login service" = a **per-user** manager unit (systemd `--user` / launchd **LaunchAgent**) with `RunAtLoad`/`KeepAlive` (launchd) or `Restart=always` + `loginctl enable-linger` (systemd), so it starts at login and survives logout. **User-level, not root, is the default** — aligns with keys-in-user-secure-storage.
- Distro system packages install **system** units; to keep keys user-scoped the system unit runs as a real user via `User=`. (Open: system-unit-with-`User=` vs always user-level for package-manager channels.)

### Node composition + corrected lifecycle (2026-07-01, supersedes "detached-child default")

**A node = identity + on-disk state (permanent) carrying two processes:**

- **Permanent substrate** = `nodeID` + WG key + `~/.kuib` (SQLite event log, config, keys). Survives every restart.
- **Daemon = the node's presence/executor.** A node is reachable as a mesh node _iff_ its daemon listens → **permanent WHEN ENROLLED** (`kuib service install`); otherwise ephemeral (host-spawned, self-reaps).
- **Engine = ephemeral compute, summoned per active session, ON THE LEADER ONLY.** Spawned for work, survives host-close to finish the run, self-reaps when idle. It _writes_ the permanent log but is not itself permanent. Most nodes most of the time run only a daemon (+ a transient host).
- Single-device v1: daemon + engine + host collapse onto one node.

**Corrected lifecycle — host attaches; engine/daemon are services (NOT children that die with the TUI):**

- The host is a thin **attachable/detachable** client; it renders the log and emits events, owns nothing.
- Closing the TUI must NOT kill an in-flight run, so the engine cannot be a child of the host. It's a **service** the host attaches to.
- **Local transport = unix sockets** (`~/.kuib/{engine,daemon}.sock`) — faster than TCP, and the `.sock` file IS the idempotency mutex (bind fails if held → race-free, no PID-file staleness). Remote = WireGuard TCP. (Refines the earlier `localhost:8080`.)
- **Idempotent spawn:** host probes the socket → attach if up, else `spawn(process.execPath, ["serve"|"daemon"])` (same binary, role arg — NOT `child_process.fork`; we talk tRPC, not Node IPC; and it's the same invocation the systemd/launchd unit runs).
- **Self-reap when idle** (no active run + no attached host) → graceful drain → unlink socket → exit. So nothing lingers as a surprise process.
- **Durability across quit = the SQLite event log, not a kept-alive process.** Quit mid-run → in-flight LLM step aborts, committed chunks remain; reopen → replay → resume.
- **Background/always-on persistence is opt-in ONLY via `kuib service install`** (boot-persistent, no idle-reap). Without it, nothing survives the session beyond the data.
- Idle cost must be ~zero: event loop parked on the socket, no polling; the reaper is one debounced timer, not a poll loop.

**Daemon boundary:** a **stateless executor** (fs/shell only) that knows nothing of the log/sessions/LLM. **Only the engine calls it** (the host never does); the engine intercepts the tool call → appends `ToolCallStarted` → calls the daemon → appends `ToolCallCompleted/Failed`. Daemon stays dumb; engine owns orchestration + logging. This is why the single-active-engine invariant is load-bearing in the mesh — the dumb executor won't dedupe a double-dispatch ([[consensus-model]]).

## Engine vs engine-service, control/data-plane split, host read access (2026-07-01)

Surfaced by a real bug: the TUI ran the agent loop **in-process** (`apps/host-tui/src/index.tsx` called `Engine.runAgent` directly), so closing the TUI killed the process mid-stream and **appends to the event log stopped** — on reopen you replayed a partial turn. There is **no in-process fix**: appends survive host-exit only if the _appending process_ survives. So the engine must be a **separate process the host attaches to / detaches from** — the long-promised `.sock` engine-service.

### Engine vs engine-service (brain vs body)

|         | `@kuib-ai/engine` (package)                                                                | `@kuib-ai/engine-service` (new package / `kuib serve`)                                        |
| ------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Is      | the pure agent-loop **library** (`runAgent`, provider, daemon-client, uses `EventLogPort`) | the long-lived **process** that _hosts_ the engine                                            |
| Owns    | nothing process-y                                                                          | the SQLite **writer**, the **unix socket**, **lifecycle** (spawn/self-reap), live **fan-out** |
| Runtime | **agnostic** (runs under Node tests)                                                       | **Bun-quarantined** (sockets, `bun:sqlite`, spawn)                                            |

`engine-service` **imports and runs** `engine`. Split so the brain stays a pure library (no sockets, no spawn, no SQLite writer) while all OS/IO/process code lives in the body. **Framing update (2026-07-02):** the original "runtime-agnostic / Node tests" motivation is superseded — everything runs and tests on Bun now ([[testing-strategy]], [[architecture-overview]] Runtime), and `engine` itself may use `Bun.*` (e.g. `Bun.TOML`). The split **stands** on IO-separation grounds: library vs process, not runtime vs runtime.

### Control plane vs data plane

- **Data plane = the SQLite event log.** The engine-service is the single writer; the **host reads the local DB directly** (WAL → safe concurrent reader). The host does NOT route reads through the service.
- **Control plane = the unix socket** (`~/.kuib/engine.sock`, dev `./dist/engine.sock`) — three small jobs, **not** data streaming: **(1) liveness/mutex** (socket bind = single-engine guarantee; host spawns `kuib serve` detached if absent), **(2) submit** (`submit({sessionID, prompt})` — plain request/response, not a fiddly streaming subscription), **(3) doorbell** (1-line "new events for S" tick so the host re-reads immediately; robust because the DB is the truth — a missed tick is caught by the next poll).

### How the host gets read access

Always via `EventLogPort.subscribe(sessionID, handler, afterSeq)` (contract lives in `@kuib-ai/protocol`, see [[protocol-design]]). The **host is a _reader_ impl; the engine-service is the _writer_ impl** — same one contract, different implementations:

- **Single-device:** read the local SQLite file directly + socket doorbell for liveness. Submit + doorbell over the socket; reads never go through the service.
- **Remote (mesh, later):** local replicated SQLite (settled) + a subscription to the remote engine-service (live tail). See the unified event-log model in [[consensus-model]].

The host **only reads** (and, in the mesh, locally-replicates received entries — which is _not_ authoring/write-access, see [[consensus-model]] author-vs-replicate). The engine-service (running the engine) is the single authoring writer.

### Lifecycle (single-device)

- **One engine per device** — the socket bind is the mutex; a second `serve` fails to bind → attaches as a client instead.
- **Survives host death** — `kuib serve` is spawned **detached**; closing the TUI leaves it running to finish the turn and keep appending.
- **Self-reaps when idle** — reaps (unlink socket, exit) only when **no active run AND no host attached** (debounced). Active-run = in-flight `runAgent` count; host-attached = live socket connection. Never reaps mid-run.
- **Durability across quit = the SQLite log**, not a kept-alive process. Reopen → replay-from-cursor → resume.

### Data-plane research (see [[consensus-model]] for full grounding)

WAL gives concurrent readers + one writer; `sqlite3_update_hook` is in-process-only (hence poll + socket doorbell, not a DB push); SQLite-as-durable-event-backbone is the proven local-AI-agent pattern. Host-reads-local-DB is **correct**, not a compromise — and it's replication-invariant (mesh fills the local DB via replication; host read path never changes).

## Turn scheduling — per-session queue + step-boundary steering (2026-07-02)

Previously submits were fire-and-forget: a SUBMIT arriving mid-run started a **second concurrent `runAgent`** on the same session (interleaved transcript; worse, run B's context snapshot contained run A's half-streamed assistant text folded as a complete turn). Writes were safe (`BEGIN IMMEDIATE`) — the problem was semantic.

**Decision: single active turn per session; pending messages steer the running turn at step boundaries.** A message enters the event log **when it enters the conversation**, not at submit time — the log stays the source of truth for what the model actually saw.

- **engine-service** keeps `Map<sessionID, { running, pending[] }>`. SUBMIT while running → `pending.push` (no log write). Otherwise a turn loop: run the turn; any pending left when it ends becomes the next turn's prompt, until drained. Sessions serialize independently; `activeRuns`/reap accounting spans the loop.
- **`RunTurn` contract** gains `takePending: () => string[]` (drain-all splice). Hosts thread it into `runAgent`.
- **orchestrator** passes `prepareStep` to `streamText` (AI SDK v7 — runs before _every_ step; a returned `messages` override carries forward): drain `takePending`, emit `USER_MESSAGE_SUBMITTED` for each, append `{role:"user"}` to the step messages. So a message typed mid-run is picked up at the next tool/step boundary — inside the same turn — or, if the turn is past its last boundary, becomes the immediate next turn.
- **`fold.transcript` segmentation** (fixes "tool call renders last"): assistant/reasoning accumulation now **breaks** on `USER_MESSAGE_SUBMITTED` / `TOOL_CALL_COMPLETED` / `TOOL_CALL_FAILED` — post-boundary deltas open a new entry (`id: <messageID>:<segment>`), so chronology renders truthfully (`text → tool ✓ → text`, injected user messages in place).
- **Known gap:** host-web bypasses the engine-service (`void runAgent` per POST) so it still allows concurrent turns — resolves with the shared-host-bootstrap follow-up (see the host-duplication smell in [[testing-strategy]]'s sweep).
- TUI mouse-selection note: opentui enables mouse tracking, so terminal text selection needs Shift+drag; in-app copy-on-select is part of the deferred `@opentui/keymap` pass.

## Open Questions

- HostProtocol TypeScript interface location: `packages/host/` vs `packages/protocol/`
- Read-only default for code buffers vs explicit edit unlock
- Project Map vs Ledger: same pane with mode switch, or always split?
- Engine idle-reap timeout `T` (how long to keep a hostless engine alive before draining).
- Package-manager service scope: system unit with `User=` vs user-level unit.

## Web host (`kuib web`) + SSE catch-up protocol (2026-07-01)

A browser cannot open a `bun:sqlite` file or a unix socket — the two things the TUI relies on. So the web host is not standalone: **a local `kuib` process is compulsory**, the browser is a pure _viewer_ (`viewing ≠ leading`). This is the predicted `LocalEventLog → MeshEventLog` transport-swap, with "remote = localhost": the browser gets a **`RemoteEventLog`** whose `subscribe()` rides HTTP/SSE instead of reading SQLite. Host code shape is unchanged; only the transport impl differs. Later, the same client can point at a mesh node (homelab via coordinator) with the same contract.

**`kuib web` = one long-lived process** serving engine + daemon **in-process** + the web bridge. Endpoints: `POST /api/submit` (runs `runAgent`), `GET /api/events` (SSE live tail), `GET /api/events/since` (pull reconcile), `GET /api/status` (liveness). It binds **loopback + this node's tailscale IP** (never `0.0.0.0`) so phone / other mesh nodes can reach it. Auth + threat model live in [[security-model]] "Web host auth".

### The catch-up / no-staleness protocol (the load-bearing part)

Total order is `(epoch, seq)`, PK-enforced, and `seq` is strictly contiguous per session/epoch (`MAX(seq)+1`). That contiguity makes gap _detection_ trivial. Three layers, each covering what the others miss:

1. **Live push — SSE with `id: epoch:seq`.** On any drop, `EventSource` auto-reconnects with `Last-Event-Id`; the server resumes `replay(afterSeq)` from the durable log then rides the tail. Since the settled log is append-only (never truncated in v1), replay always closes the drop window.
2. **Pull reconcile — `/api/events/since?afterSeq`.** Fired on load, `visibilitychange→visible`, `online`, and on detected gap. Backstop for the cases `Last-Event-Id` silently misses — backgrounded tabs (browsers suspend EventSource without `onerror`), proxy buffering, laptop sleep. The DB is truth, so a pull always reconciles to latest.
3. **Contiguity gap-heal.** Any incoming `seq ≠ lastSeq+1` is a provable hole → auto-reconcile from `lastSeq`. Silent loss becomes self-healing.

**Idempotency:** client applies only `key > cursor`, deduped by `(epoch,seq)`; the three layers can overlap freely and always converge.

**Latency refinement:** because the engine runs **in-process**, the server holds the _writer_ `eventLog`, whose `subscribe()` does synchronous in-process fan-out on `append` → **zero-latency, zero-staleness tail** (strictly better than the TUI's 150ms poll reader). The polling `createSqliteReader` is only needed when reader and writer are _different processes_ (detached `serve`, or the mesh) — that path wants the socket **doorbell** to avoid the 150ms floor.

### Run-liveness detection (co-viewing a TUI-started stream)

Single engine + single log per device (socket mutex) ⇒ TUI and web are **co-viewers of the same log**, not separate streams. "Is a run live?" is answered two ways: **(1)** derive from the log tail — a submit with no terminal `MessageCompleted`/`Failed`, or a trailing `TextDelta`, means in-flight; **(2)** authoritative `activeRuns` (already tracked by the engine-service) via `/api/status`, which covers the submit→first-token spin-up window the log alone is ambiguous about.

### Client stack

Solid-for-DOM via **Vite** (`vite-plugin-solid` — Bun's transpiler can't do Solid's reactivity transform). Dev = Vite server + API proxy to the Bun engine; prod = `vite build` → Bun serves `dist/` with the token injected into an `index.html` meta tag. The transcript **fold is shared** — both hosts import `Transcript.foldTranscript` from `@kuib-ai/transcript` (the extraction follow-up is DONE), so the segmentation fix applies to both. Lives in `apps/host-web`; folds into the unified `kuib` binary later.

### host-web parity gaps vs host-tui (audited 2026-07-02)

The web host lags the TUI on the newer seams — all traceable to it assembling its own engine graph instead of sharing a bootstrap:

- **No mesh target routing** — uses `Daemon.resolveDaemonEndpoint(KUIB_DAEMON_URL, KUIB_DAEMON_SOCKET)` directly; ignores `KUIB_TARGET_NODE`/`mesh.config.toml` (the TUI's `resolve.daemon.client` seam lives in `apps/host-tui`, not shared).
- **No turn queue/steering** — bypasses the engine-service; `void runAgent` per `POST /api/submit` → concurrent turns still possible (see Turn scheduling section above).
- **No device badge** — the web UI doesn't show the selected node.
- Shares: provider v2 config resolution ✓, telemetry ✓, SQLite db + fold ✓.

**Resolution path:** extract a shared host bootstrap (model + daemon client + event log + telemetry + submit path) consumed by both hosts — also kills the duplication smell flagged in the coverage sweep.

## TUI structure — provider stack, route store, dialog overlay (2026-07-03)

Adopted from the opencode study (their `packages/tui` — same `@opentui/solid` stack, fully grown). Three layers; **no router library**:

- **Provider stack** — Solid contexts at the root for shared state (event-log store, config, theme, keymap); screens consume hooks. Several of these become shared with host-web — this is the host-unification seam.
- **Route store** — `Route` as a discriminated union (Zod-first, protocol idiom) held in a Solid store; `navigate()` = `reconcile()`; the root renders `<Switch>/<Match>` on `route.type`. No URLs, no history stack — navigation in a TUI is just swapping which screen is mounted. Screens live in `routes/`.
- **Dialog overlay layer** — dialogs (pickers, approvals, help, palette) stack _above_ the current route via a dialog context; they are NOT routes. The remote-daemon picker for command execution lands here.

The Route union + dialog list enumerates the product's screens — and is therefore the table of contents of the wireframe set ([[ux-iteration-process]]): one wireframe file per route screen or dialog, screen-level only, states as frames within the file.

Current state: `apps/host-tui` is a single fixed screen (no providers/routes/dialogs yet); this structure is the target as the UX phase begins.

## TUI dev loop — no HMR anywhere; watch-restart against the persistent engine (2026-07-03)

Verified (multi-agent research with adversarial verification, 2026-07-03): **opencode has zero hot-reload machinery.** No `--hot`/`--watch`/`import.meta.hot` anywhere in their repo; `packages/tui` has no dev script; their own skill doc says config "is not hot-reloaded… tell the user to quit and restart opencode". Their actual iteration story = **fast cold restarts** (Bun runs TS directly, no build) + **serve/attach split** (all session state server-side; the TUI is a disposable thin client: `opencode serve` + `opencode attach --continue`) + **kv.json-persisted UI state** (theme, toggles, prompt history/stash) so restarts feel seamless. Their SIGUSR2 handling reloads config/theme _data_, never code.

Adopted for kuib — we already have the split (engine-service survives host detach):

- **Tier 1 (now):** `dev:watch` = `bun --watch --no-clear-screen run src/index.tsx`. Hard restart on edit → reattach to `engine.sock` → refold from the log. `--no-clear-screen` is required: Bun's clear escapes corrupt alternate-screen TUIs.
- **Tier 1b (with the first new screens):** kv.json-style UI-state persistence + prompt history/stash, mirroring opencode's `tui/src/context/kv.tsx`.
- **Tier 2 (experimental, deferred):** `bun --hot` same-PID re-eval + opentui's `singleton()` renderer reuse. Possible but self-plumbed: no Solid refresh exists (solid-refresh is bundler-only; only React got in-place refresh, opentui PR #446), re-creating the renderer throws stdin-exclusivity, and listeners/timers leak without manual disposal. opentui maintainers recommend `--watch`.
- **Tier 3 (cheap, later):** SIGUSR2 → re-read config/theme without restart.
- **Standing rule:** never embed the engine in the host process — a TUI restart must never kill a run. (opencode's default single-process dev mode has this trap; their escape is serve+attach, ours is the socket split.)

## Session screen — sticky right prompt pane (2026-07-03)

Composition moved out of the transcript: the session screen is now two bordered panes — transcript flowing free in the left (sticky-bottom), a fixed-width (33 col) sticky right pane holding the device badge and a multi-line prompt box (textarea: min 3 rows, grows to 8; Enter submits, Shift+Enter newline; trimmed/whitespace-only gating unchanged). Adopted from a design-session sketch, implemented same day in `apps/host-tui/src/app/index.tsx`, locked with an 80x24 `captureCharFrame` snapshot test. Sketch, as-built frame, and the retired single-pane layout: [[host-layer/wireframes/session]]. The empty lower-right of the prompt pane is deliberate headroom — candidate home for queued mid-turn prompts or the v1 Ledger (v1 Frontend above).
