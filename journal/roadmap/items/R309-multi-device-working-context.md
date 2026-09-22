---
id: R309
title: Multi-device working context — device badge, switcher, per-device cwd
state: shaped
horizon: later
domains: [host, core]
depends-on: ["[[roadmap/items/R301-session-screen]]"]
converges-with: ["[[roadmap/items/R213-mesh-protocol-fields]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/multi-device-ux/decisions#Multi-Device UX & Working Context]]", "[[_archive/multi-device-ux/decisions#Core reframe: a location is `(device, path)`, not `path`]]", "[[_archive/multi-device-ux/decisions#Session state: one active working context, switchable]]", "[[_archive/multi-device-ux/decisions#Orthogonality: active device ≠ leader]]", "[[_archive/multi-device-ux/decisions#TUI surface]]", "[[_archive/multi-device-ux/decisions#Decisions]]", "[[_archive/multi-device-ux/decisions#Edge cases (need handling)]]", "[[_archive/multi-device-ux/decisions#Node identity & addressing — `user@device` (2026-07-01)]]", "[[_archive/multi-device-ux/decisions#Open Questions]]"]
touched: 2026-09-22
---

# R309 — Multi-device working context — device badge, switcher, per-device cwd

## Idea

From one chat the agent runs commands and reads files across the user's mesh. On the mesh a bare
path is ambiguous, so every location, file reference and process is node-qualified:
`(node = user@device, path)`. The agent reasons in qualified locations, never bare paths.

**Session state** — one active working context, switchable:

```
WorkingContext {
  activeDevice: DeviceID,            // default target for fs/shell
  cwdByDevice: Map<DeviceID, path>,  // last cwd per device
}
```

- A tool call without an explicit device targets `activeDevice` at its remembered cwd; with an
  explicit device it is a cross-device op — badged and risk-profiled (approval names the target;
  `risk = commandRisk × deviceProfile[targetDevice]`, see [[_archive/security-model/decisions]]).
- Switching device is `cd` across machines and restores that device's last cwd.
- Active device ≠ leader: the engine may run on the homelab while work lands on the laptop.

**Decided direction:** the user owns the persistent active-device switch (deliberate, visible,
keybind/picker — never moved silently); the agent may *target* another device per tool call
(explicit, badged, approved). Single active device + explicit cross-device targeting, not free
multi-target. Per-device cwd memory.

**Agent awareness:**

1. An always-on device manifest in context each turn — active device + cwd, the mesh list, and
   "fs/shell target the active device unless you pass `device`".
2. A switch reminder fired on a new `ActiveDeviceChanged` event: the new cwd, and that files,
   processes, env and shell state differ from the previous device — re-verify paths.

**UI surface:** active device + cwd always visible (`desktop:~/proj ❯`, the device badge in
[[roadmap/wireframes/session]]); cross-device tool calls badged (`[prod-server]`); nodes
grouped by `machineID` so `alice@desktop` and `bob@desktop` render under `desktop`, with
`osUser` shown in approval prompts.

**Edge cases:** "the file we were editing" after a switch resolves against the active device
unless qualified; path present on one device only → "not found on desktop" (primed by the
reminder); background processes stay on their device; the same repo out of sync across devices
is treated as distinct (git-awareness matters).

Built today: node identity and discovery (`NodeDescriptor { nodeID, osUser, machineID, … }`,
`DiscoveryPort`) and target-node daemon resolution ([[domains/core/current#^endpoints]],
[[domains/host/current#^daemon-resolution]]). The badge currently would show a fixed `target.node`; there is
no switch, no per-tool `device`, no manifest.

## Why

Without device-qualified context the agent will confidently run commands against the wrong
machine after a switch.

## Open questions

- Reference resolution across a switch ("that file", "the tests"): strictly active device, or
  last-mentioned device?
- Does `cwdByDevice` persist across sessions or reset?

## Constraints already decided

- [[domains/host/decisions#^D005]] — daemons addressed by node identity.
- [[domains/core/decisions#^D028]] — discovery port.
- [[domains/core/decisions#^D004]] — every event carries its origin device.

## History

- 2026-09-22 migrated from the archive
