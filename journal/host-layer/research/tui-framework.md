# Research: TUI Framework (OpenTUI)

Session 2026-06-30. De-risking the v1 frontend stack. Conclusion: **OpenTUI + Solid reconciler, run on Bun.** See [[host-layer]], [[architecture-overview]].

## OpenTUI maturity (github.com/anomalyco/opentui, under the SST org)

- Native terminal UI core in **Zig** with TypeScript bindings (C ABI). **Powers OpenCode in production** + terminal.shop incoming.
- 12.2k stars, 115 contributors, very active (commits within days). MIT.
- Packages: `@opentui/core` (Zig core + imperative API), **`@opentui/solid`** (SolidJS reconciler), `@opentui/react`, `@opentui/three`. **Native Yoga/flexbox layout** built into the core.
- Components shipped that cover most of kuib's surface: `scrollbox`, `text`, `markdown`, `input`, `textarea`, `select`, `tab-select`, **`code`, `line-number`, `diff`**, tree-sitter highlighting. Plus a first-class **keymap/leader** system (→ vim-modal nav). An official agent skill is installed at `.agents/skills/opentui`.
- **Caveat: pre-1.0** (v0.4.2), fast cadence → API churn risk. Mitigate by pinning a version. It's MIT + OpenCode pins it, so no vendor exposure.

## Why OpenTUI+Solid (not Ink)

- **Not Ink** — Ink is React (we dropped React for kuib) and does whole-tree reconcile + JS-side ANSI diffing (the weaker model).
- **Solid reconciler** = fine-grained reactivity = "render only on change" (the user's dynamic-FPS requirement) — no vdom diff, only changed reactive nodes update.
- **Flicker-free** = OpenTUI's Zig core does retained-mode double-buffered cell diffing (writes only changed cells; no clear-then-redraw). GitHub research surfaced the failure modes to avoid: `\x1b[3J` wiping scrollback, `reset()`-then-`write()` blank frames, full-subtree replacement flicker — OpenTUI's renderer + Solid's granularity avoid all three.

## Runtime: Bun

- OpenTUI's **native renderer requires FFI** — stable only on Bun (Node 26.3.0 `--experimental-ffi` is more fragile, worse install). `@opentui/keymap` + `@opentui/core` import in plain Node but **do not create a renderer** without FFI.
- **Bun quarantined to the host adapter**; engine + core packages stay runtime-agnostic. Distribution: `bun build --compile` → per-platform self-contained binary (bundles Bun + JS + native `.so/.dylib`). See [[architecture-overview]].

## nvim fork (decided: flavored for v1)

- **Fork #1 — nvim-flavored**: OpenTUI keymap mimics vim modality. Chosen for v1. Low risk; the keymap system is built for it.
- **Fork #2 — real embedded nvim** (`nvim --embed` msgpack-RPC, render via `nvim_ui_attach` or a pty terminal widget): a real systems problem (two things sharing one terminal). **Deferred to v1.x.** See [[nvim-integration]] (now `stale`).

## Reference apps (proven OpenTUI, for study)

- **OpenCode** (sst) — production agent; **client-server: HTTP server + thin TUI client** (validates the engine/host split). Bun workspaces + Turbo monorepo.
- **modem-dev/hunk** — "review-first terminal diff viewer for agentic coders" (closest analog to kuib's comprehension surface).
- **kitlangton/ghui** — clean Solid TUI (state mgmt + JSX patterns). **remorses/critique** — git-change reviewer. **msmps/opentui-ui** — component lib.
