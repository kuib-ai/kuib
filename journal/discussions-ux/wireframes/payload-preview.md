---
screen: payload-preview
kind: dialog
status: exploring
sizes: [80x24, 120x40]
implements: []
---

# payload-preview

## Motivation

Transparency ([[vision]]): the user sees **exactly** what the next provider call will receive — after branch resolution, discussion toggles, and part exclusions. This is the proof that context control is real, not a filter hidden in the engine. Opened before send (optional gate) or on demand (`gp` / status strip click). Must show token + cache economics, not just pretty text.

Dialog overlays [[host-layer/wireframes/session-layout]]; not a route.

## Variant A — raw JSON only (exploring)

```
┌─ Payload preview ──────────────────────────────────────────────── [Esc] ─┐
│ [                                                                      │
│   {"role":"user","content":"fix auth"},                                │
│   {"role":"assistant","content":"I'll read…"},                         │
│   {"role":"user","content":"…tool result…"}                            │
│ ]                                                                      │
│                                                          Send anyway  ① │
└────────────────────────────────────────────────────────────────────────┘
```

① Send anyway — only when opened as pre-send gate; dismiss-only when opened for inspection mid-session

**Verdict:** rejected — accurate but unreadable; users need structure matching mental model (messages → parts).

## Variant B — folded transcript + summary rail (exploring)

```
┌─ Payload preview ────────────────────────────────── anthropic/claude ─ [q]┐
│ MESSAGES (4)          │ TOKENS                                              │
│                       │ input      38,420                                     │
│ ▼ user                │ output     (next turn)                                │
│   fix auth            │ cache read 36,100  ①                                  │
│ ▼ assistant           │ cache write     0                                     │
│   text · I'll read…   │ ─────────────────                                     │
│   ⊘ reasoning         │ excluded    2 parts · 1,240 tok                       │
│ ▼ tool result         │ discussions api-design ✓ · notes ✗                    │
│   readFile ✓          │ breakpoint  msg 2 / part 3  ②                         │
│ ▼ user                │                                                       │
│   continue            │ [j/k scroll]  [t] toggle part detail  [Enter] close   │
│                       │                                                       │
└───────────────────────┴───────────────────────────────────────────────────────┘
```

① cache read — from last `StepBoundaryStop.tokens.cache` + engine estimate for tail
② breakpoint — shows which message/part ends the cached prefix; links to conversation gutter `h` row

**Verdict:** preferred — left column mirrors assembly order; right rail is the cost story; excluded parts listed but collapsed (`⊘`).

## States (variant B)

### pre-send gate (user enabled "confirm before send")

```
┌─ Payload preview ──────────────────────────────── ⚠ unsent changes ─ [q]┐
│ …                                                                        │
│                       │ excluded parts changed since last send           │
│                       │                                                       │
│                       │ [Enter] send   [e] edit context   [Esc] cancel   │
└───────────────────────┴───────────────────────────────────────────────────┘
```

### provider without cache

Right rail omits cache lines; shows `cache: n/a (openai-compatible)` — per-provider rules ([[provider-architecture]] open question).
