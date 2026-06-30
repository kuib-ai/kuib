---
title: "Neovim Integration"
type: research
status: stale
layer: research
created: 2026-06-18
tags: [nvim, rpc, embed, attach, bridge, research]
depends-on: ["[[host-layer]]", "[[comprehension-model]]"]
informs: ["[[host-layer]]"]
---

# Neovim Integration

> **STALE — superseded v1 stance.** v1 ships as an **OpenTUI + Solid** TUI that is nvim-_flavored_ (modal keymap/leader), **not** real embedded nvim. The embed-nvim approach below is **deferred to v1.x**. See [[architecture-overview]], [[host-layer]], [[host-layer/research/tui-framework]]. The research below (embed vs attach, bridge patterns, blast-as-quickfix, reference projects) remains the starting point for that v1.x embedded-nvim work.

## Current Decisions

### Stance for v1

- **Embed controlled nvim** as code/environment engine inside NvimHost — not attach-to-user-dotfiles as default
- **Host layer** keeps migration path to desktop/web hosts
- **Fork nvim** only if code-surface rendering hits hard limits — not for ledger/conversation buffers

### Attach vs Embed

| Mode                                        | Use                                        |
| ------------------------------------------- | ------------------------------------------ |
| **Attach** (socket to user's nvim)          | Power users later; fragile as default      |
| **Embed** (subprocess + shipped `init.lua`) | v1 default — LSP, refs, qf blast, extmarks |

Comprehension chrome in nvim buffers; code pane uses real nvim primitives (extmarks, virtual text, `setqflist` for agent-ordered blast).

### Poll vs Push

- **Outbound (daemon → nvim):** open buffer, extmarks, quickfix — proven via msgpack-RPC
- **Inbound (cursor/focus/dwell):** needs Lua shim + `rpcnotify` or poll; start poll, design for push (Hybrid A→B)

### NvimBridge Pattern

Single bridge interface: `PollBridge` / `PushBridge`. Loop prevention mandatory (locks + debounce) when UI drives cursor and cursor events echo back.

### Ranked Reference Projects

1. **bigcodegen/mcp-neovim-server** — external attach, read state, qf population
2. **vscode-neovim** — manager pattern, event bus, loop locks (inverted: they embed; we show nvim)
3. **coc.nvim** — long-lived Node daemon beside editor, thin Lua ↔ heavy TS
4. **laktek/nvim-mcp-server** — socket discovery, cwd filtering
5. **avante.nvim** — UX only: extmark diff review, conflict navigation (Lua, not RPC)

### Quickfix as Blast Index

Agent-ordered consequence list → `setqflist`; user `:cnext` through blast. UI ledger stays in sync on qf index.

### Fork Escape Hatch

If code pane needs grid compositing or primitives buffers cannot fake at scale — evaluate fork or leave nvim for code pane only. Ledger/conversation stay host-owned.

## Open Questions

- TUI embed: terminal multiplexer split vs single process owning Ink + nvim
- Web host: remote full nvim session (terminal in browser) vs grid client
