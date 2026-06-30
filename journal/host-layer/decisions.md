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

`engine-service` **imports and runs** `engine`. Split so the brain stays runtime-agnostic/testable while all OS/IO/process code lives in the body — same rule that makes `@kuib-ai/event-log-sqlite` its own Bun package. The service must import `event-log-sqlite` (Bun) + bind sockets + spawn, none of which may live in runtime-agnostic `engine`.

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

## Open Questions

- HostProtocol TypeScript interface location: `packages/host/` vs `packages/protocol/`
- Read-only default for code buffers vs explicit edit unlock
- Project Map vs Ledger: same pane with mode switch, or always split?
- Engine idle-reap timeout `T` (how long to keep a hostless engine alive before draining).
- Package-manager service scope: system unit with `User=` vs user-level unit.
