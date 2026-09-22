---
id: R407
title: OS secure storage for API keys and node keys
state: shaped
horizon: later
domains: [infra]
depends-on: []
converges-with: ["[[roadmap/items/R219-config-store-and-secret-storage]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/infrastructure-strategy/decisions#Detailed build roadmap (2026-07-01)]]", "[[_archive/application-directories/decisions#Example consumer layout (after app suffix)]]", "[[_archive/security-model/decisions#Daemon Threat Model (2026-06-30)]]"]
touched: 2026-09-22
---

# R407 — OS secure storage for API keys and node keys

## Idea

In production, provider API keys come from the user's OS secure storage (Keychain / libsecret /
Windows Credential Manager) — never a DB, never a synced file, never inside the config store.
The same storage holds WireGuard and command-signing keys for the mesh. `.env` remains a
development convenience only.

## Why

Keys must stay on the user's devices; the CRDT config sync and the control plane must never
carry them.

## Open questions

- Library or native binding per OS under Deno.
- How a newly joined node obtains keys (manual entry vs. device-to-device transfer).

## Constraints already decided

- Secrets are returned beside the config, never inside it; `.env` is gitignored: [[domains/infra/current#^config-secrets]], [[domains/infra/decisions#^D013]].

## History

- 2026-09-22 migrated from the archive
