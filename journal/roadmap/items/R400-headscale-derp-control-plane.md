---
id: R400
title: Self-hosted Headscale + DERP control plane for the mesh
state: shaped
horizon: later
domains: [infra, core]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/infrastructure-strategy/decisions#Network Substrate & Control Plane — self-hosted Headscale + DERP (2026-07-01)]]", "[[_archive/infrastructure-strategy/decisions#Keep the substrate behind a contract — do NOT double down on Headscale (2026-07-01)]]", "[[_archive/infrastructure-strategy/decisions#Transport & RPC]]", "[[_archive/infrastructure-strategy/decisions#Detailed build roadmap (2026-07-01)]]", "[[_archive/infrastructure-strategy/decisions#Open Questions]]", "[[_archive/distributed-mesh-state/decisions#Implementation status — Layer 1 (node resolution seam) — DONE]]", "[[_archive/security-model/decisions#Coordinator/DERP isolation (2026-07-01)]]"]
touched: 2026-09-22
---

# R400 — Self-hosted Headscale + DERP control plane for the mesh

## Idea

Replace the static `mesh.config.toml` discovery with a real network substrate: a self-hosted
**Headscale** coordinator plus **DERP** relay(s), wrapped behind the existing `DiscoveryPort` /
transport factory so nothing above the port changes.

- **Two dataless server roles.** The coordinator (Headscale) handles node registration, WireGuard
  key exchange, IP allocation and ACLs. DERP relays bootstrap connections and act as the
  permanent fallback when hole-punching fails.
- **Why a relay is mandatory.** A live test of the author's tailnet (2026-07-01) showed
  cross-internet peers bootstrap on DERP and only sometimes upgrade to direct; under
  CGNAT / symmetric NAT (endemic in India) the upgrade often never happens, so traffic stays
  relayed permanently. Pure serverless P2P does not survive real NATs.
- **Control plane vs data plane (load-bearing).** Coordinator and DERP never see chats,
  sessions or API keys. User data stays P2P (per-node SQLite event log, keys in user secure
  storage — [[roadmap/items/R407-os-secure-storage]]). Operating a coordinator therefore does
  not violate the no-user-data-backend principle; this is how Tailscale itself works.
- **Per-user daemon = its own mesh node with its own IP.** alice@desktop and bob@desktop bind
  the same port on distinct mesh IPs, dissolving the multi-user port conflict. Tailscale's
  account/device model cannot give reliable per-user IPs — owning the coordinator (node
  registration + IP allocation) is why Headscale, not hosted Tailscale.
- **Three hosting tiers.** The coordinator + DERP endpoint is non-secret network config in the
  config store:
  - Tier 1 — you-host: a small dataless Headscale+DERP (VPS / public-IP node), zero-config
    onboarding.
  - Tier 2 — self-host: the kuib binary wraps Headscale+DERP on a user's public-IP node
    (homelab/VPS). Fully sovereign. A CGNAT user cannot self-host the relay.
  - Tier 3 — BYO: point kuib at any Headscale/DERP endpoint.
  `kuib service install` gets two modes: **join** (enroll this node) and, on a public node,
  **host** (run the wrapped Headscale+DERP) — see [[roadmap/items/R406-signed-binary-distribution]].
- **Isolation.** The coordinator/DERP is internet-exposed, so it runs in its own container/host,
  never on a box holding sessions or keys.
- **Keep the substrate swappable.** Headscale is the intended first `DiscoveryPort` + network
  implementation, not a commitment. Address by `NodeID`, never by IP or coordinator specifics;
  `NodeDescriptor.endpoint` stays substrate-opaque; DERP/relay never leaks into the contracts
  (direct-vs-relayed is handled below the transport). If Headscale is wrong, zero contracts
  change. WireGuard (or a tailnet) is the tunnel between daemons, engine and hosts.

## Why

Remote execution across the user's devices currently needs a hand-maintained static mesh file
and an existing tailnet. A dynamic registry is the prerequisite for the multi-device product.

## Open questions

- Which tier leads onboarding: you-hosted default or self-host default (both would ship)?
- Cost: relay bandwidth, not coordination, is the cost driver (a relayed session ships all its
  traffic through DERP). Bootstrap infra is public-IP home nodes (cornelius/statice) — fragile
  (dynamic residential IP, uptime); when does it move to cloud?

## Constraints already decided

- Daemons are addressed by node identity through a discovery port: [[domains/core/decisions#^D028]], [[domains/core/current#^C013]], [[domains/core/current#^C015]].
- The host already resolves remote daemons through static discovery: [[domains/host/decisions#^D005]].

## History

- 2026-09-22 migrated from the archive
