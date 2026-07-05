---
screen: cache-edit-confirm
kind: dialog
status: exploring
sizes: [80x24]
implements: []
---

# cache-edit-confirm

## Motivation

Mid-conversation edits invalidate the provider's cached prefix ([[protocol-design]] Command Editing / cache-safe). The user must see **cost delta before commit** — intentional tradeoff, not a surprise bill. Tail edits (current turn, after cache breakpoint) skip this dialog. Applies to: editing user/AI text, reverting tool results, un-excluding parts above the breakpoint.

## Variant A — modal yes/no (exploring)

```
┌─ Edit will invalidate cache ───────────────────────────────────── [Esc] ─┐
│                                                                          │
│  This edit is above the cache breakpoint.                                │
│  Cached prefix will be rebuilt on next send.                             │
│                                                                          │
│                              [ Cancel ]    [ Edit anyway ]  ①            │
└──────────────────────────────────────────────────────────────────────────┘
```

① Edit anyway — writes new message version to event log

**Verdict:** rejected — no numbers; doesn't teach the mechanism.

## Variant B — cost breakdown + diff peek (exploring)

```
┌─ Cache impact ─────────────────────────────────────────────────── [Esc] ─┐
│ EDIT  assistant · part 2 · step 3                                       │
│ - The Session type is v1                                                 │
│ + The Session type is v2 (see protocol migration)                       │
│                                                                          │
│ CACHE (anthropic)                                                        │
│   prefix invalidated from  msg 1 / part 1                               │
│   was cached     36,100 tok                                             │
│   est rewrite     38,400 tok  (+2,300 write)  ①                         │
│   next read est   ~36,100 tok  (after rewrite)                          │
│                                                                          │
│              [ Cancel ]  [ Edit & accept cost ]  [ mb move breakpoint ] ② │
└──────────────────────────────────────────────────────────────────────────┘
```

① estimates from `TokenUsage` + `ModelRef` on recorded step boundaries — prefix `~` when interrupted ([[protocol-design]])
② `mb` — optional: move cache breakpoint below edit so edit becomes tail-safe (advanced)

**Verdict:** preferred — shows diff + economics; offers breakpoint move for power users.

## States

### tail-safe edit (no dialog)

Edits at or below the `h` gutter row in [[discussions-ux/wireframes/conversation]] apply immediately — cache-safe per protocol option B.
