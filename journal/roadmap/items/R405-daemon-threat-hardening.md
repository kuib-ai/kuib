---
id: R405
title: Daemon threat-model hardening for the mesh
state: idea
horizon: later
domains: [core, infra]
depends-on: ["[[roadmap/items/R403-command-risk-approval-flow]]", "[[roadmap/items/R406-signed-binary-distribution]]", "[[roadmap/items/R407-os-secure-storage]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/security-model/decisions#Daemon Threat Model (2026-06-30)]]", "[[_archive/infrastructure-strategy/decisions#Phasing (decided 2026-06-30)]]"]
touched: 2026-09-22
---

# R405 — Daemon threat-model hardening for the mesh

## Idea

The daemon is, by design, remote-code-execution-as-a-service; the mesh makes the blast radius
the user's entire fleet, reachable from anywhere, possibly unattended. Harden it layer by
layer, ranked by novel + catastrophic:

1. **Confused-deputy agent (the defining risk).** The daemon executes what a hijackable LLM
   says; one prompt-injected file could dispatch `rm -rf` or secret exfiltration to every
   device. Human approval is the load-bearing defense (absent in headless runs, vulnerable to
   fatigue). Treat the agent as semi-untrusted: destructive and network-out ops resist
   auto-approval regardless of profile; pursue content provenance ("user said" vs "a file
   said").
2. **Network reachability (layer 0).** Bind only to the WireGuard interface — never `0.0.0.0`,
   LAN or public.
3. **Application auth (layer 2).** WireGuard proves "a mesh peer", not "a legitimate engine for
   this session". Sign / capability-token every command so a compromised low-trust device
   cannot command a high-trust one; WG alone makes the mesh a flat trust domain.
4. **Asymmetric trust / segmentation (layers 3, 7).** `prod-server` defaults to
   readonly/block; not every device may command every other.
5. **Key lifecycle (layer 1).** WG and signing keys need secure storage; rotation and
   especially revocation (lost device) are hard without a central server.
6. **Log integrity (layer 6).** Sign events so a compromised follower cannot forge `Engine*`
   events into the replicated log; leadership is a high-value target.
7. **Daemon RCE surface (layer 5).** Path traversal / symlink escape (coding agents want broad
   fs access → rely on the operation × target model, not hard sandboxing alone), command
   injection (safe execution, no string concat), deserialization, resource exhaustion (fork
   bombs, disk fill — which also triggers spurious failover).
8. **Secrets and exfiltration (layer 8).** fs access reaches `.env`/SSH/cloud creds;
   network-out is the channel; detect the read-secret-then-network-out combination.
9. **Supply chain (layer 9).** Signed daemon binary, verified on install/update
   ([[roadmap/items/R406-signed-binary-distribution]]).
10. **Audit (layer 10).** The replicated log as tamper-evident (if signed) provenance: who,
    when, which device, approved by whom.

Future file isolation via nsjail-style sandboxing constrains the agent to codebase-related
operations. Single-device-first phasing is the interim mitigation: contained blast radius and
a present human while mesh security is gotten right.

## Why

Mesh remote execution without these layers turns one poisoned file into a fleet compromise.

## Open questions

- Command signing scheme and capability-token format.
- Revocation without a central authority.

## Constraints already decided

- The daemon's optional TCP listener currently binds all interfaces: [[domains/core/current#^daemon-server]].
- Agent tools are read-only for now: [[domains/core/decisions#^D013]].

## History

- 2026-09-22 migrated from the archive
