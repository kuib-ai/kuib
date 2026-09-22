---
id: R308
title: Embedded Neovim code pane (nvim bridge)
state: idea
horizon: maybe
domains: [host]
depends-on: ["[[roadmap/items/R301-session-screen]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/nvim-integration/decisions#Current Decisions]]", "[[_archive/nvim-integration/decisions#Stance for v1]]", "[[_archive/nvim-integration/decisions#Attach vs Embed]]", "[[_archive/nvim-integration/decisions#Poll vs Push]]", "[[_archive/nvim-integration/decisions#NvimBridge Pattern]]", "[[_archive/nvim-integration/decisions#Ranked Reference Projects]]", "[[_archive/nvim-integration/decisions#Quickfix as Blast Index]]", "[[_archive/nvim-integration/decisions#Fork Escape Hatch]]", "[[_archive/nvim-integration/decisions#Open Questions]]", "[[_archive/host-layer/research/tui-framework#nvim fork (decided: flavored for v1)]]", "[[_archive/host-layer/decisions#Coupling Rule]]"]
touched: 2026-09-22
---

# R308 — Embedded Neovim code pane (nvim bridge)

## Idea

Real Neovim for the code pane, after v1 ships nvim-*flavored* keymaps
([[roadmap/items/R300-own-tui-library]]). Ledger and conversation stay host-owned.

- **Embed, not attach, by default:** a controlled `nvim --embed` subprocess with a shipped
  `init.lua` (LSP, references, quickfix, extmarks). Attaching to the user's own nvim over its
  socket is a later power-user mode — fragile as a default.
- **Rendering:** `nvim_ui_attach` grid client or a pty terminal widget — two things sharing one
  terminal is the real systems problem.
- **Outbound (agent → nvim):** open buffer, extmarks, virtual text, quickfix over msgpack-RPC.
  **Inbound (cursor/focus/dwell):** Lua shim + `rpcnotify`, or poll; start with poll, design for
  push. One `NvimBridge` interface with `PollBridge` / `PushBridge` implementations.
- **Loop prevention** is mandatory (locks + debounce) when UI selection moves the nvim cursor and
  cursor events echo back.
- **Quickfix as blast index:** the agent-ordered consequence list goes to `setqflist`; the user
  walks it with `:cnext`; the UI ledger stays in sync on the qf index.
- **Fork escape hatch:** fork nvim, or keep nvim for the code pane only, if the pane needs grid
  compositing or primitives buffers can't fake at scale.
- Conversation-as-nvim-buffer (extmarks for exclude/discussion/cache zones) was considered and
  deferred with this item ([[roadmap/wireframes/conversation]] variant C).

Reference projects: `bigcodegen/mcp-neovim-server` (external attach, state reads, qf
population); vscode-neovim (manager pattern, event bus, loop locks); coc.nvim (long-lived Node
daemon beside the editor, thin Lua ↔ heavy TS); `laktek/nvim-mcp-server` (socket discovery, cwd
filtering); avante.nvim (UX only: extmark diff review, conflict navigation).

## Why

Code review and navigation in real nvim (LSP, motions, the user's muscle memory) beats any
re-implemented code viewer.

## Open questions

- One process owning both the UI and the nvim grid vs a terminal-multiplexer split.
- Web host: a remote full nvim session (terminal in browser) vs a grid client
  ([[roadmap/items/R305-web-host-viewer]]).

## Constraints already decided

- [[domains/host/decisions#^D002]] — no view layer today; this lands on kuib's own library.

## History

- 2026-09-22 migrated from the archive
