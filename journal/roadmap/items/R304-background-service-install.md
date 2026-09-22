---
id: R304
title: Background service install (launchd / systemd)
state: shaped
horizon: later
domains: [host, infra]
depends-on: ["[[roadmap/items/R303-single-binary-roles]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/host-layer/decisions#Current Decisions]]", "[[_archive/host-layer/decisions#Open Questions]]"]
touched: 2026-09-22
---

# R304 — Background service install (launchd / systemd)

## Idea

Make a device a reachable mesh node with the UI closed: the daemon (and the service, if the node
is a voter) runs headless under the OS service manager. Opt-in only, via
`kuib service install`; without it nothing outlives the session except data.

**Node composition.** A node = identity + on-disk state (permanent: `nodeID`, WireGuard key,
the kuib data dir with event log, config, keys) carrying two processes. The daemon is the node's
presence — reachable iff it listens — so it is permanent *when enrolled*, otherwise ephemeral
(host-spawned, self-reaps). The engine is ephemeral compute on the leader only. Enrolled units are
boot-persistent with no idle reap.

**One canonical unit template in the repo** (`kuib.service` / `ai.kuib.plist`), reused by every
channel:

| Channel | Who places the unit | Where | Activation |
| --- | --- | --- | --- |
| curl / raw binary | the binary embeds the template, `kuib service install` writes it | `~/.config/systemd/user/` or `~/Library/LaunchAgents/` | self, opt-in |
| pacman / AUR | `PKGBUILD` installs the same file | `/usr/lib/systemd/system/` | `sudo systemctl enable --now kuib` |
| deb / rpm | package + systemd macros | `/usr/lib/systemd/system/` | user enables (distro policy) |
| Homebrew | formula `service do … end` | brew-managed plist | `brew services start kuib` |

- `ExecStart` is a path reference to the installed binary (`/usr/bin/kuib daemon`), not a copy:
  update the binary, restart picks it up.
- Per-user by default: systemd `--user` with `Restart=always` + `loginctl enable-linger`, or a
  launchd LaunchAgent with `RunAtLoad`/`KeepAlive` — starts at login, survives logout, keeps
  keys in user-scoped secure storage.
- Distro system units run as a real user via `User=`.

## Why

A device can only serve as "remote hands" for another node's agent while the user is away if its
daemon runs without a terminal open.

## Open questions

- Package-manager channels: system unit with `User=` vs always a user-level unit.
- Whether an enrolled node also keeps a non-reaping engine (voter) or only the daemon.

## Constraints already decided

- [[domains/core/decisions#^D017]] — without enrolment, services self-reap when idle.
- [[domains/host/decisions#^D004]] — the unit runs the same binary with a role argument.

## History

- 2026-09-22 migrated from the archive
