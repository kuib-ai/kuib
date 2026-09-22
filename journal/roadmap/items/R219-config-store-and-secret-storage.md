---
id: R219
title: ConfigStore seam for user preferences and OS secure storage for secrets
state: idea
horizon: later
domains: [infra, core]
depends-on: []
converges-with: ["[[roadmap/items/R407-os-secure-storage]]", "[[roadmap/items/R401-mesh-distributed-state]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Three storage classes — do not conflate (2026-06-30)]]", "[[_archive/provider-architecture/decisions#Provider contract v2 — flat config + factory map, NOT a discriminated union (2026-07-02)]]", "[[_archive/provider-architecture/decisions#Per-request provider options are a second axis, separate from client options (2026-08-12)]]", "[[_archive/architecture-overview/decisions#Config & Env Resolution (`@kuib-ai/env`, 2026-07-01)]]"]
touched: 2026-09-22
---

# R219 — ConfigStore seam for user preferences and OS secure storage for secrets

## Idea

Three storage classes that must not be conflated:

| Class | Examples | Store | Merge |
| --- | --- | --- | --- |
| Chat transcript | event log + snapshot + checkpoints | SQLite `kuib.db` | single-writer, `(epoch, seq)` |
| Config / model prefs | active model, UI prefs, device profiles | `ConfigStore` seam: v1 local JSON/SQLite, later CRDT (Yjs) for mesh sync | mergeable, multi-master |
| API keys / secrets | provider keys, OAuth tokens | OS secure storage (Keychain / libsecret / Credential Manager) — never a DB, never synced | n/a |

- A `ConfigStore` interface holds user-mutable preferences at runtime (switching model in a
  host, per-model `providerOptions` such as reasoning effort) carrying the same flat
  `ModelConfig` shape; the CRDT implementation drops in behind it later, as SQLite did behind
  `EventLogPort`.
- In production, secrets come from OS secure storage; `.env` is dev-only.

## Why

Today config is read-only at startup (file < env < CLI) and secrets come from env; nothing lets
a user change the model mid-session or keeps keys out of plaintext.

## Open questions

- Does the `ConfigStore` write back into `config.toml` or a separate store?
- Keychain access from Deno (FFI, a helper binary, or a CLI shell-out).

## Constraints already decided

- One root config: defaults < `config.toml` < `KUIB_*` env < CLI; secrets returned beside the
  config, never inside it — [[domains/infra/decisions#^D013]], [[domains/infra/current#^C018]].
- Engine packages take configuration as parameters — [[domains/core/decisions#^D027]].
- Keys never touch the transcript or any synced store.

## History

- 2026-09-22 migrated from the archive
