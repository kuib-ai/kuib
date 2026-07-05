---
screen: conversation
kind: route
status: exploring
sizes: [80x24]
implements: []
---

# conversation

## Motivation

The Conversation pane is where absolute context control happens. Messages are not chat bubbles — they are a **navigable transcript of parts** (text, reasoning, tool calls, step boundaries) with nvim-flavored modal editing ([[context-engine]], [[vision]]). The user excludes pollution, selects clusters for discussions, and edits AI/user content to recover from doom loops. Must never lie about chronology (fold breaks on tool/user boundaries — [[host-layer]] Turn scheduling).

Lives inside [[host-layer/wireframes/session-layout]] as the left-top pane; this wireframe isolates Conversation-only layout at 80x24.

## Variant A — inline chat rows (superseded)

```
┌─ Conversation ──────────────────────────────────────────────────────────┐
│ USER  fix auth                                                          │
│ AI    sure — reading router.ts                                          │
│ TOOL  ✓ readFile                                                        │
│ AI    the handler is missing…                                           │
│                                                                         │
│                                                    [Exclude] [Edit]  ①  │
└─────────────────────────────────────────────────────────────────────────┘
```

① per-message action buttons — discoverable but not nvim; fights density at 80 cols

**Verdict:** superseded — button chrome doesn't scale; breaks nvim-first goal.

## Variant B — part-addressable transcript + gutter (superseded)

```
┌ Conversation ───────────────────────────────────────────────────────────┐
│c│ user                                                    rs10@mbp · 2p①│
│a│ fix the auth middleware — the session type is wrong                   │
│c│ assistant                                                               │
│h│ reasoning · step 3                                                      │
│e│ I need to read the router and the session module…                       │
│ │ tool · readFile · ✓                                                     │
│ │ {"path":"packages/engine/src/router.ts"}                                │
│e│ assistant                                                               │
│ │ The Session type in protocol is v1; router still imports v0.           │
│d│                                                                         │
│ │                                                                         │
└─┴─────────────────────────────────────────────────────────────────────────┘
 ②③
```

① header — role line + origin device + part index within message
② **cache gutter** (`c`/`a`/`c`/`h`/`e`/`d`) — heavily overloaded state character
③ gutter is informational; toggling exclude is `x` in visual mode on the part, not gutter click

**Verdict:** superseded — overloading cache state (c/a/h) and inclusion state (e/d) into a single column is too dense and confusing.

## Variant C — full nvim buffer embed (deferred)

Real nvim subprocess owns the buffer; kuib sets extmarks for exclude/discussion/cache zones ([[nvim-integration]]). Conversation pane is nvim, not OpenTUI `scrollbox`.

**Verdict:** deferred — v1 ships OpenTUI vim-flavored keymap; revisit when embed lands in v1.x.

## Variant D — split gutter + floating modal edits (exploring)

Aligns perfectly with fzf-lua / modal-heavy user profiles. Gutter is split to cleanly separate cache boundaries from inclusion state. Editing spawns a centered, floating OpenTUI modal instead of destroying the vertical flow with inline edits.

```
┌ Conversation ───────────────────────────────────────────────────────────┐
│c │ user                                                   rs10@mbp · 2p │
│c │ fix the auth middleware — the session type is wrong                  │
│c │ assistant                                                            │
│a │ reasoning · step 3                                                   │
│h x I need to read the router and the session module…                    │
│  │ tool · readFile · ✓                                                  │
│  │ {"path":"packages/engine/src/router.ts"}                             │
│  x assistant                                                            │
│  │ The Session type in protocol is v1; router still imports v0.         │
│  │                                                                      │
└─┴┴──────────────────────────────────────────────────────────────────────┘
 ①②
```

① **Cache State:** `c` (cached), `a` (active/warm), `h` (breakpoint line).
② **Inclusion State:** `x` (excluded), `d` (discussion). Space is normal.

**Verdict:** preferred — clean separation of concerns in the gutter. Modal editing respects the centered-focus (`zz`) and `fzf` workflows of power users.

## States (variant D)

### NORMAL — navigate parts

```
┌ Conversation ───────────────────────────────────────────────────────────┐
│c │ user                                                                 │
│c │ add rate limiting to the API                                         │
│c │ assistant · step 4                                                   │
│a │ ├─ text                                                              │
│a │ I'll add a middleware…                                               │
│a │ tool · bash · pending                                                │
│a │ {"command":"pnpm test"}                                              │
│h │ ── cache breakpoint (anthropic) ──                                   │
│  │                                                                      │
└─┴┴──────────────────────────────────────────────────────────────────────┘
 NORMAL  j/k part  gh/gl message  gp preview  :discussion save
```

### VISUAL — select → discussion / exclude

```
┌ Conversation ───────────────────────────────────────────────────────────┐
│c │ user                                                                 │
│c │ assistant                                                            │
│c x ┌─ visual selection ──────────────────────────────────────────────┐  │
│c x │The Session type in protocol is v1; router still imports v0.     │  │
│c x └─────────────────────────────────────────────────────────────────┘  │
│a │ I'll patch the import and add a migration note.                      │
│  │                                                                      │
└─┴┴──────────────────────────────────────────────────────────────────────┘
 VISUAL  s save discussion  x exclude  e edit
```

### EDIT — Floating Modal

Pressing `e` in normal or visual mode spawns a centered popup overlaying the transcript.

```
┌ Conversation ───────────────────────────────────────────────────────────┐
│c │ user                                                                 │
│c │ fix the au ┌ Edit Part ───────────────────────────────────┐ ng       │
│c │ assistant  │ The Session type in protocol is v1; router   │          │
│a │ reasoning  │ still imports v0. I will write a migration   │          │
│h x I need to  │ to bridge them.█                             │          │
│  │ tool · rea │                                              │          │
│  │ {"path":"p └──────────────────────────────────────────────┘          │
│  x assistant                                                            │
│  │ The Session type in protocol is v1; router still imports v0.         │
└─┴┴──────────────────────────────────────────────────────────────────────┘
 INSERT  <C-c> normal mode  <Enter> save edit
```

### edit mid-history — triggers confirm dialog

If the user hits `<Enter>` to save an edit on a part that is *above* the cache breakpoint (`c` or `h`), the floating modal closes and immediately opens [[discussions-ux/wireframes/cache-edit-confirm]] to warn about the cache invalidation cost before committing the change.
