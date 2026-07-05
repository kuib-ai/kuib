---
screen: session-layout
kind: route
status: exploring
sizes: [80x24, 120x40]
implements: []
---

# session-layout

## Motivation

Replace the single-pane [[host-layer/wireframes/session]] with the v1 comprehension shell: Conversation + context sidebar + Code. The user composes the LLM payload in the left pane, sees project/bootstrap or ledger context on the right, and keeps code in a persistent bottom pane. This screen must never hide the prompt or block input during streaming; context-control affordances (exclude, discussion toggle, payload preview) live in Conversation, not buried in menus.

Supersedes [[host-layer/wireframes/session]] when adopted. Ledger hunk index row is optional in v1 (blast deferred — [[comprehension-model]]); right pane defaults to Project Map on greenfield.

## Variant A — stacked code (exploring)

Classic IDE split: conversation dominates top; code is a horizontal strip at the bottom. Right column toggles Project Map ↔ Ledger.

```
┌─ Conversation ────────────────────────┬─ Project Map ─────────────────┐
│ user: add auth middleware             │ DEFINED                       │
│ assistant: I'll read the router…      │  packages/engine              │
│ reasoning: …                          │  packages/protocol            │
│ tool: ✓ readFile router.ts            │ UNDEFINED                     │
│                                       │  journal/active               │
│                                       │                               │
├───────────────────────────────────────┴───────────────────────────────┤
│ Code · router.ts                                              :help ①│
│  12 export function createRouter() {                                  │
│  13   return new Hono();                                             │
│  14 }                                                                 │
└───────────────────────────────────────────────────────────────────────┘
┌─ Prompt ──────────────────────────────────────────────────────────────┐
│ Message kuib…                                    rs10@septimus · local②│
└───────────────────────────────────────────────────────────────────────┘
```

① status line — mode (NORMAL/VISUAL), discussion name, cache zone indicator; `:help` opens keymap overlay (dialog, not a route)
② prompt strip — sticky bottom, full width; device badge right-aligned ([[multi-device-ux]])

**Verdict:** rejected — prompt at very bottom fights nvim muscle memory (command line should feel like `:` line near focus); conversation loses height when code pane opens.

## Variant B — right prompt column + bottom code (ADOPTED direction)

Extends the adopted session right-prompt pattern into the v1 pane grid. Conversation + context on top; code below conversation only (not under the sidebar).

```
┌─ Conversation ────────────────────────┬─ Context ─────────────────────┐
│▓▓ cached prefix ends here ───────────│ DISCUSSIONS                   │
│ user: refactor the auth layer         │ ● api-design        included ①│
│ assistant: …                          │ ○ bootstrap-notes   excluded  │
│ [dim] excluded reasoning part         │                               │
│ tool: ✓ readFile                      │ PROJECT MAP                   │
│                                       │  engine · protocol · host-tui │
├───────────────────────────────────────┤                               │
│ Code · middleware.ts            NORMAL│                               │
│  1 import { Hono } from "hono";       │                               │
│  2 …                                  │                               │
└───────────────────────────────────────┴───────────────────────────────┘
┌─ Prompt ────────────────────────────────┬─ Status ──────────────────────┐
│ Message kuib…                         │ 42k in · 8k cache · anthropic②│
└───────────────────────────────────────┴───────────────────────────────┘
```

① discussion list in Context pane — toggle included/excluded at runtime ([[discussions-ux]]); `*` on active discussion
② status strip — live token estimate for next payload; opens [[discussions-ux/wireframes/payload-preview]] on click or `gp`

**Verdict:** preferred — keeps sticky prompt from session wireframe; Context pane is the home for discussions + map; code pane width matches conversation (reading flow).

## States (variant B)

### visual selection — part exclude (80x24)

```
┌─ Conversation ────────────────┬─ Context ───────┐
│ user: fix the types           │ DISCUSSIONS     │
│ assistant:                    │ ● selection     │
│ ┌───────────────────────────┐ │                 │
│ │visually selected text part│ │ 1 part selected │
│ └───────────────────────────┘ │                 │
│ [excluded] old wrong answer   │ PROJECT MAP     │
├───────────────────────────────┤                 │
│ Code                    VISUAL│                 │
└───────────────────────────────┴─────────────────┘
┌─ Prompt ───────┬─ Status ─────┐
│                │ x exclude · s │
└────────────────┴───────────────┘
```

`x` toggles exclude on visual selection; excluded parts render dimmed with `[excluded]` prefix; still in log, omitted from payload.

### payload preview open (dialog overlays — see [[discussions-ux/wireframes/payload-preview]])

Conversation pane dims; dialog is not a route swap.
