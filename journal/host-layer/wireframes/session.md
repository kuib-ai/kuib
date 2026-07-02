---
screen: session
kind: route
status: adopted
sizes: [80x24]
implements: [apps/host-tui/src/app/index.tsx]
---

# session

## Motivation

The single v0 screen: render the session transcript **truthfully from the event-log fold** and accept prompts. Chronology must match what the model actually experienced — assistant/reasoning segments break on tool and user-message boundaries ([[host-layer]] Turn scheduling) — and input is never blocked while a turn streams (mid-turn submits queue and steer at step boundaries). This file is as-built documentation and the live example of the wireframe convention ([[ux-iteration-process]]); the screen predates the convention, so there are no explored variants.

Expected supersession: the v1 pane layout (Conversation / Project Map / Ledger / Code — [[host-layer]] v1 Frontend) will replace this single-pane screen when the comprehension UX lands.

## Variant — right prompt pane (ADOPTED 2026-07-03, sketch)

Composition moves out of the transcript's way. Transcript flows freely in the left pane; the right pane is sticky (never scrolls with messages) and holds the device badge plus a large multi-line prompt box. Implemented same day — as-built frames in States below (borders differ slightly from this sketch: two adjacent boxes rather than a shared divider).

```
┌─ Conversation ───────────────────────────────┬─ Prompt ──────────────────────┐
│ user: read the secret file and tell me       │                rs10@septimus ①│
│ the code                                     │                               │
│                                              │ ┌───────────────────────────┐ │
│ reasoning: I should call readFile on         │ │ Message kuib…             │ │
│ the path…                                    │ │                           │ │
│                                              │ │                           │ │
│ tool: ✓ {"content":"The secret code is       │ │                           │ │
│ BANANA-42.\n"}                               │ │                           │ │
│                                              │ └───────────────────────────┘②│
│ assistant: The secret code is BANANA-42. ④   │                               │
│                                              │ Enter sends · queues mid-turn③│
│                                              │                               │
│                                              │                               │
│                                              │                               │
│                                              │                               │
│                                              │                               │
│                                              │                               │
│                                              │                               │
│                                              │                               │
│                                              │                               │
│                                              │                               │
│                                              │                               │
└──────────────────────────────────────────────┴───────────────────────────────┘
```

① device badge, top-right of the prompt pane (was top-right of the transcript)
② prompt box — bordered, minimum 3 rows (5 drawn), grows with input; the pane is sticky so composition never scrolls away
③ submit hint — Enter sends; mid-turn submits still queue and steer at step boundaries
④ transcript flows freely, sticky-bottom, never blocked while a turn streams

Tradeoff accepted: at 80x24 the prompt pane costs ~40% of transcript width (45 cols left for messages); the empty lower half of the right pane is unclaimed space — candidate home for queued prompts or the v1 Ledger.

## Variant — single-pane (v0 as-built, retired 2026-07-03)

The original layout: full-width transcript with a one-line input at the bottom.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                             rs10@septimus  │
│ user: read the secret file and tell me the code                            │
│ reasoning: I should call readFile on the path…                             │
│ tool: ✓ {"content":"The secret code is BANANA-42.\n"}                      │
│ assistant: The secret code is BANANA-42.                                   │
│                                                                            │
│                                                                            │
│                                                                            │
│ Message kuib…  (Enter to send)                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Verdict:** retired — composition shared the transcript column and was capped at one line; replaced by the sticky right prompt pane (adopted above).

## States (right prompt pane, as-built 2026-07-03)

### streaming turn (as-built, 80x24 `captureCharFrame` — snapshot in `apps/host-tui/src/app/__snapshots__`)

```
┌─Conversation────────────────────────────────┐┌─Prompt────────────────────────┐
│assistant: The secret code is BANANA-42.     ││                rs10@septimus ①│
│                                             ││                               │
│                                             ││ ┌───────────────────────────┐ │
│                                             ││ │Message kuib…              │②│
│                                             ││ │                           │ │
│                                             ││ │                           │ │
│                                             ││ └───────────────────────────┘ │
│                                             ││                               │
│                                             ││ Enter sends · queues mid-turn③│
│                                             ││                               │
│                                             ││                               │
│                                             ││                               │
│                                             ││                               │
│                                             ││                               │
│                                             ││                               │
│                                             ││                               │
│                                             ││                               │
│                                             ││                               │
│                                             ││                               │
│                                             ││                               │
│                                             ││                               │
│                                             ││                               │
└─────────────────────────────────────────────┘└───────────────────────────────┘
```

① device badge, top-right of the prompt pane — the target node (`KUIB_TARGET_NODE` or local label; [[multi-device-ux]])
② multi-line prompt (textarea), always focused; min 3 rows, grows to 8 with content; Enter submits trimmed text (whitespace-only ignored), Shift+Enter inserts a newline
③ hint line; mid-turn submits queue and steer at step boundaries — input is never blocked while a turn streams

Transcript entries keep their fold semantics (reasoning dim before the answer, tool boundaries break assistant segmentation, true chronological order) — unchanged from v0, so not re-annotated here.

The empty session is the same layout with an empty conversation pane — no distinct frame. No empty-state copy yet; an open gap the greenfield bootstrap flow ([[context-bootstrap]]) will define.
