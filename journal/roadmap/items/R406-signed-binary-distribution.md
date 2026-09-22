---
id: R406
title: Signed single-binary distribution with service install
state: idea
horizon: later
domains: [infra, host]
depends-on: []
converges-with: ["[[roadmap/items/R303-single-binary-roles]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/infrastructure-strategy/decisions#Detailed build roadmap (2026-07-01)]]", "[[_archive/security-model/decisions#Daemon Threat Model (2026-06-30)]]"]
touched: 2026-09-22
---

# R406 — Signed single-binary distribution with service install

## Idea

Ship kuib as one per-platform `deno compile` binary (multi-role: `kuib` / `daemon` / `serve` /
`up`), signed, and verified on install and update.

- `kuib service install` registers a user-level service in **join** mode (enroll this node in a
  coordinator) and, on a public-IP node, **host** mode (run the wrapped Headscale+DERP —
  [[roadmap/items/R400-headscale-derp-control-plane]]).
- Configuration from `.env` / the config file as today.
- Bootstrap milestone this was aimed at: use kuib to build kuib.

## Why

The daemon is the supply-chain target of the threat model
([[roadmap/items/R405-daemon-threat-hardening]] layer 9); an unsigned binary on every device
is an easy fleet-wide foothold. Today every device needs a checkout and `pnpm install`.

## Open questions

- Overlaps [[roadmap/items/R303-single-binary-roles]] (the multi-role binary) and [[roadmap/items/R304-background-service-install]] (service install); this item keeps signing and join/host modes. Candidate for `converges-with`.
- Revisit `deno compile` once a host has a UI again (the deno-runtime migration deferred it).
- Signing and update channel.

## Constraints already decided

- pnpm provisions the runtime for source runs: [[domains/infra/decisions#^D007]].
- One entry, argv selects the role: [[domains/host/decisions#^D004]].

## History

- 2026-09-22 migrated from the archive
