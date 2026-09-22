---
id: R212
title: Schema migration chain and JSON-schema snapshot test
state: shaped
horizon: later
domains: [core, infra]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Schema Versioning]]", "[[_archive/protocol-design/decisions#Versioning boundaries (2026-06-30)]]"]
touched: 2026-09-22
---

# R212 — Schema migration chain and JSON-schema snapshot test

## Idea

`_version: z.literal(1)` sits on the envelope and on `MessageBase`, but there is no migration
path yet.

- **Latest-only creation:** the engine only ever creates the latest version; `z.literal(2)` makes
  code still producing `1` a compile error.
- **Migrate on read:** a discriminated union of versions plus a chain —
  `MessageAnyVersion = z.discriminatedUnion("_version", [MessageV1, MessageV2])`,
  `migrateToLatest(raw)` switches on `_version` and chains migrations to the latest.
- **Storage policy:** local files/SQLite — eager migration on load, written back; a future
  Postgres JSONB store — lazy at the app layer with background batch cleanup.
- Old schemas live in a `migrations/` folder, never in main code.
- **Schema snapshot test in CI:** `z.toJSONSchema(<aggregate>)` compared against a committed
  snapshot; a schema change without a version bump fails CI. Applies to every versioned
  aggregate (`EventEnvelope`, `Message`, and later `Session`, `Discussion`, `Checkpoint`).

## Why

The event log is durable and replayed forever; the first incompatible schema change will
otherwise brick existing `kuib.db` files.

## Open questions

- Does the SQLite event log migrate rows in place, or migrate on every replay?

## Constraints already decided

- `_version` only at durable aggregate boundaries, never on leaves or event variants —
  [[domains/core/decisions#^D005]].
- In-band `_version` suffices because all mesh nodes are deployed together.

## History

- 2026-09-22 migrated from the archive
