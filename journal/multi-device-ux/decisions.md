---
title: "Multi-Device UX & Working Context"
type: implementation
status: open
layer: experience
created: 2026-06-30
tags: [multi-device, cwd, working-context, device, ux, agent-awareness, mesh]
depends-on:
  [
    "[[consensus-model]]",
    "[[security-model]]",
    "[[protocol-design]]",
    "[[host-layer]]",
  ]
informs: ["[[host-layer]]"]
---

# Multi-Device UX & Working Context

From one chat, the agent runs commands / accesses files across the user's mesh of devices. This entry covers how "current working directory" and session semantics work when there are many devices.

## Core reframe: a location is `(device, path)`, not `path`

On a single machine, cwd is just `/home/user/proj`. On the mesh that's **ambiguous** — the same path exists on the laptop and the desktop and they're different files. So every location, file reference, and process is **device-qualified**. The agent must reason in `(device, path)`, never a bare path. This ripples through everything.

## Session state: one active working context, switchable

```
WorkingContext {
  activeDevice: DeviceID,             // default target for fs/shell
  cwdByDevice: Map<DeviceID, path>,   // remembers each device's last cwd
}
```

- A tool call **without** an explicit device → targets `activeDevice` at its remembered cwd (maps to `ToolCallPending.device?` absent).
- A tool call **with** an explicit device → cross-device op, badged + risk-profiled (`ToolCallPending.device` set).
- **Switching device** = like `cd` across machines: restores `cwdByDevice[target]` (per-device cwd memory — switch back to laptop and you're where you left off).

## Orthogonality: active device ≠ leader

`activeDevice` (where work lands) is NOT the leader (where the engine/log runs, see [[consensus-model]]). The engine can run on the homelab (leader) while the active device is the laptop — the homelab-engine dispatches tools to the laptop's daemon. Don't conflate "who coordinates" with "where the command executes."

## Agent awareness (the "don't run bullshit when I switch machines" guard)

Two mechanisms:

1. **Always-on device manifest** in context every turn:
   ```
   Active device: desktop (~/proj). Mesh: laptop, desktop, prod-server.
   fs/shell target the active device unless you pass `device` explicitly.
   ```
2. **Switch reminder** fired on `ActiveDeviceChanged` (new event):
   ```
   <system_reminder>
   Active device changed: laptop → desktop. CWD is now desktop:~/proj.
   Filesystem, processes, env vars, and shell state are SPECIFIC to desktop and
   differ from laptop. Do NOT assume files, background jobs, or shell state from
   laptop exist here. Re-verify paths before acting.
   </system_reminder>
   ```
   Re-orients the agent at the exact moment of danger.

## TUI surface

- Active device + cwd **always visible** — prompt like `desktop:~/proj ❯`. The user must never be unsure where a command lands.
- Switching device is **deliberate and visible** (keybind/picker), never accidental — a **user** action.
- Cross-device tool calls are **badged** (`[prod-server]`), and the approval prompt names the target device (see [[security-model]] — `risk = commandRisk × deviceProfile[targetDevice]`).

## Decisions

- **Who switches the active device:** the **user** owns the persistent active-device switch (so "where am I" is never silently moved under them); the **agent** can _target_ another device per-tool (explicit, badged, approved). Agent targets; user relocates.
- **Single active device + explicit cross-device targeting** (chosen) over free multi-target every turn — matches the single-machine mental model and is far safer.
- **Per-device cwd memory** (restore last cwd on switch-back).

## Edge cases (need handling)

- "The file we were editing" — was `laptop:/proj/foo.ts`; after switch, references resolve against `activeDevice` by default and the agent must qualify by device.
- Path exists on one device, not another → tool fails "not found on desktop"; switch-reminder primes the agent.
- Background processes are per-device (`npm run dev` on laptop stays on laptop after switch).
- Same project out of sync (`laptop:/proj@X` vs `desktop:/proj@Y`) → cross-device work treats them as distinct; git-awareness matters.

## Node identity & addressing — `user@device` (2026-07-01)

The atom of identity is the **node = per-OS-user, per-device**, NOT the physical machine. On a shared box, `alice@desktop` and `bob@desktop` are **separate nodes** (separate keys, `~/.kuib`, daemons), grouped under one machine in the UI. The daemon is **user-scoped** — runs commands only as its own OS user (no root broker, no UID switching); see [[security-model]].

Identifiers:

- **`nodeID`** (= protocol `DeviceID`, semantics clarified) — cryptographic, per `~/.kuib`/WG key, **authoritative for mesh trust/consensus**. Two users on one box → two `nodeID`s → independent voters ([[consensus-model]]).
- **`osUser`** — display/security label, shown in approval prompts.
- **`machineID`** (`/etc/machine-id`, world-readable) — the **grouping key** so the list renders `alice@desktop`/`bob@desktop` under `desktop`.

Working-context address becomes **`(node = user@device, path)`** (refines the `(device, path)` model above). Local same-user → unix socket (no network). Local **different**-user → reached via mesh IP, treated as remote (can't touch another user's `~/.kuib/daemon.sock`) — correct, they ARE separate identities.

## Discovery contracts (substrate-agnostic) (2026-07-01)

Discovery is a swappable seam so the network substrate (Headscale, raw WG…) is late-bound — see [[infrastructure-strategy]]. Four stable contracts:

- **`NodeID`** — address by this, never by IP/coordinator specifics.
- **`NodeDescriptor`** — `{ nodeID, osUser, machineID, capabilities, endpoint? }` (endpoint substrate-opaque).
- **`Discovery`** — `listNodes()`, `resolve(nodeID): Endpoint`. v1 impl `LocalOnly` (self + local socket); v1.x impl `Headscale` (the coordinator IS the registry).
- **`TransportFactory(nodeID)`** — resolves via `Discovery`, connects.

**v1 has no discovery problem** — one local unix socket. The model exists now only to shape the schema (`DeviceID`=nodeID, `+osUser`, `+machineID`) correctly.

## Open Questions

- How references ("that file", "the tests") resolve across a device switch — strictly active-device, or last-mentioned-device?
- Whether `cwdByDevice` persists across sessions or resets.
