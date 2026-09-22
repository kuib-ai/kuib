---
id: R213
title: Session and Device schemas, and mesh fields on tools and tool calls
state: shaped
horizon: later
domains: [core, host]
depends-on: []
converges-with: ["[[roadmap/items/R309-multi-device-working-context]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Mesh Protocol, 3-Tier Runtime in v1 (2026-06-30)]]", "[[_archive/protocol-design/decisions#MessageUser.originDeviceID (2026-04-25)]]", "[[_archive/protocol-design/decisions#Module Structure]]", "[[_archive/protocol-design/progress#Rebuild list]]"]
touched: 2026-09-22
---

# R213 — Session and Device schemas, and mesh fields on tools and tool calls

## Idea

The protocol should carry mesh fields natively (zero cost while single-device) so the log format
never changes when mesh dispatch arrives:

- `ToolCallPending.device?: DeviceID` — which daemon the call ran on.
- `ToolSpec.executionTargets: "local" | "remote-allowed" | "remote-only"` — where a tool may run.
- `Session { _version: 1, …, peerDevices: Device[] }` — visible mesh daemons; plus session status
  (for `SessionUpdated`, R203).
- `Device { id: DeviceID, owner: string, name: string, profile: SecurityProfile }` in a
  `session` module (profile → R205).
- **Origin rendering:** `MessageUser.originDeviceID` is the typing device (not the engine's
  home). Hosts render it — `> hey check the dotfiles` / `— you, MacBook Pro · 2:34 PM` — and the
  model can read the device context. Assistant messages carry no device (implicitly the engine's).

## Why

Tool dispatch to any daemon in the mesh needs to know which tools may leave the machine and
where each call ran; approvals (R204) need the target device.

## Open questions

- `DeviceID` vs `NodeID`: the built mesh seam addresses daemons by `NodeID` with
  `NodeDescriptor`; do `Device` and `NodeDescriptor` merge?
- Today every host invocation mints a fresh random `DeviceID` — a stable per-device ID is a
  prerequisite for meaningful origin rendering.

## Constraints already decided

- `MessageUser.originDeviceID` is required — [[domains/core/current#^C010]].
- Daemons are addressed by node identity through a discovery port —
  [[domains/core/decisions#^D028]].
- The local daemon is a separate process on the same RPC contract —
  [[domains/core/decisions#^D014]].

## History

- 2026-09-22 migrated from the archive
