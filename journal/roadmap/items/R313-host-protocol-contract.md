---
id: R313
title: HostProtocol contract shared by every host
state: idea
horizon: next
domains: [host, core]
depends-on: []
converges-with: ["[[roadmap/items/R302-ui-host-attach]]", "[[roadmap/items/R221-self-contained-engine]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/host-layer/decisions#Current Decisions]]", "[[_archive/host-layer/decisions#Role]]", "[[_archive/host-layer/decisions#HostProtocol (Contract)]]", "[[_archive/host-layer/decisions#Not in Host]]", "[[_archive/host-layer/decisions#Open Questions]]", "[[_archive/host-layer/decisions#host-web parity gaps vs host-tui (audited 2026-07-02)]]"]
touched: 2026-09-25
---

# R313 — HostProtocol contract shared by every host

## Idea

A host sits between the engine and presentation: the engine owns truth (event log, context
assembly, agent loop); the host renders state and emits `User*` events; the engine never imports a
host. Make that an explicit contract every host adapter implements:

- **Render** — apply engine events to surfaces (buffers, highlights, quickfix, empty states).
- **Focus** — pane focus and keyboard routing.
- **Emit** — translate user actions into protocol events (`UserMessageSubmitted`,
  `UserPartExcluded`, `UserDiscussionToggled`, …).
- **Subscribe** — receive the engine event stream for live updates
  ([[roadmap/items/R302-ui-host-attach]]).

Same protocol for the terminal host, an nvim host, the web host and a desktop host later.
Alongside it, one **shared host bootstrap** (model config, daemon client, event log, telemetry,
submit path) so hosts cannot drift apart the way the old web host did.

**Not in a host:** context assembly, discussion schema, LLM provider calls — all engine/protocol.

## Why

Every UI item assumes a host shape; defining it once keeps TUI, web and nvim hosts at parity.

## Open questions

- Where the TypeScript interface lives: a `packages/host` package vs `packages/protocol`.
- Which `User*` events exist beyond submit/interrupt (exclude, discussion toggle, device switch).

## Constraints already decided

- [[domains/host/decisions#^D001]] — hosts are thin clients; the engine runs in `serve`.
- [[domains/core/decisions#^D012]] — tools defined once; each package holds one role.
- [[domains/core/decisions#^D004]] — one event union in a sequenced envelope.

## History

- 2026-09-22 migrated from the archive
- 2026-09-25 converges with [[roadmap/items/R221-self-contained-engine]]: the shared host bootstrap (model config, daemon client, event log, telemetry) moves into the engine, and the contract is language-neutral because the terminal host is native ([[features/deno-runtime/plan#D007 — The terminal UI is native; engine, daemon and tooling stay TypeScript]])
