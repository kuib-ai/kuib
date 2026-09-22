---
id: R114
title: NAT keepalive service on minerva for warm voice paths
state: shaped
horizon: later
domains: [infra]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/ana/decisions#Network]]"]
touched: 2026-09-22
---

# R114 — NAT keepalive service on minerva for warm voice paths

## Idea

A standalone systemd service on minerva pings key Tailscale peers every ~20 s to keep NAT
mappings alive so low-latency direct voice paths stay warm (direct paths otherwise need 2–3
DERP packets to re-establish). This is a **network-layer concern, explicitly decoupled from
Ana** — not part of the Ana app. Measure the actual NAT timeout first to pick the interval.

## Why

Cold NAT mappings add hole-punching latency to the first voice packet after idle.

## Open questions

- Measured NAT timeout on the home router → the right keepalive interval.
- Where the service lives once the mesh has its own daemon.

## Constraints already decided

- Independent of the Ana application by design.

## History

- 2026-09-22 migrated from the archive
