---
id: R301
title: Session screen and v1 pane layout
state: shaped
horizon: next
domains: [host]
depends-on: ["[[roadmap/items/R300-own-tui-library]]", "[[roadmap/items/R302-ui-host-attach]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/host-layer/decisions#Session screen — sticky right prompt pane (2026-07-03)]]", "[[_archive/host-layer/decisions#v1 Frontend — OpenTUI + Solid (nvim-flavored)]]", "[[_archive/host-layer/decisions#Coupling Rule]]", "[[_archive/host-layer/decisions#Open Questions]]"]
touched: 2026-09-22
---

# R301 — Session screen and v1 pane layout

## Idea

The main route of the UI host: render the session transcript truthfully from the event-log
fold and accept prompts, then grow into the v1 comprehension shell.

**Session screen** ([[roadmap/wireframes/session]]) — the design that shipped on the removed
OpenTUI host and is re-explored for [[roadmap/items/R300-own-tui-library]]:

- Two bordered panes: transcript flowing free on the left (sticky-bottom, never blocked while a
  turn streams); a fixed-width (~33 col) sticky right pane holding the device badge and a
  multi-line prompt (min 3 rows, grows to 8; Enter submits trimmed text, whitespace-only
  ignored; Shift+Enter inserts a newline). Hint line: "Enter sends · queues mid-turn".
- Transcript keeps fold semantics: segments break on tool and user-message boundaries so
  chronology is true ([[domains/core/decisions#^D019]]); mid-turn submits queue and steer at
  step boundaries ([[domains/core/decisions#^D018]]).
- **Generic loader** pinned to the transcript bottom for the whole turn (`MESSAGE_STARTED` →
  completed/failed): braille spinner + elapsed seconds; `Working…` until reasoning arrives,
  then `Thinking… · <tail>` with the last 48 whitespace-collapsed chars of reasoning. Reasoning
  lives in the loader, not as a transcript row.
- **Context meter** under the hint: `input + output` tokens of the latest `STEP_FINISHED`
  against a local `modelID → window` table (no provider API exposes the window; Anthropic's
  `/v1/models` `max_input_tokens` could be live-queried). Unknown model → bare token count.
- **Interrupt affordance** — the next thing to build: never advertise `esc to interrupt` until
  it works. The engine-service already accepts `interrupt` and wires `onAbort`
  ([[domains/core/current#^C042]]); the screen needs the binding.
- **Queued prompts (exploring):** the empty lower-right of the prompt pane shows a
  `QUEUED · steer at step end` list while a turn streams and the queue is non-empty; items in
  send order, truncated with `…`, leaving as they enter the transcript.
- The empty session has no distinct frame and no copy yet — defined by
  [[roadmap/items/R310-context-bootstrap]].

**v1 pane layout** ([[roadmap/wireframes/session-layout]], variant B preferred): Conversation +
Context sidebar on top, Code pane below the conversation only, sticky Prompt + Status strip at
the bottom. The Context pane holds the discussions quick-toggle list and the Project Map; the
Status strip shows the live token estimate for the next payload and opens
[[roadmap/wireframes/payload-preview]] (`gp`). Visual selection + `x` excludes parts (dimmed,
`[excluded]`, still in the log). The original fixed layout was Conversation | Project Map/Ledger
on top, Ledger hunk index (agent order) when code exists, Code at the bottom.

**Coupling rule for the code pane:** the agent always pushes surface state into the host (never
waits for the user to open a file); the user's cursor/quickfix index is an optional "attended"
signal back; ledger or conversation selection can drive the code pane without it being a gate.
Loop prevention (locks + debounce, the vscode-neovim pattern) is required when UI selection
jumps the code pane and code events echo back.

## Why

This is the screen a user spends their time on; it proves the engine/host split (thin client over
the log) and is the frame every other UX item (discussions, payload preview, bootstrap map,
device badge) lives in.

## Open questions

- Project Map vs Ledger: same pane with a mode switch, or always split?
- Code buffers read-only by default vs an explicit edit unlock.
- Queued prompts: edit/remove bindings that don't fight the textarea; overflow (scroll vs
  `+N more`); highlight when an item starts steering.
- 80x24 cost: the right prompt pane takes ~40% of transcript width.

## Constraints already decided

- [[domains/host/decisions#^D001]] — the screen is a thin attachable client; the engine runs in
  `serve`.
- [[domains/host/decisions#^D007]] — mid-run submits steer the running turn.
- [[domains/core/decisions#^D019]] — the transcript fold is shared and segments at boundaries.

## History

- 2026-09-22 migrated from the archive
