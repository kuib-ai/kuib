---
screen: discussion-manager
kind: dialog
status: exploring
sizes: [80x24]
implements: []
---

# discussion-manager

## Motivation

Discussions are named, toggleable clusters of parts ([[discussions-ux]], [[protocol-design]]). The user saves visual selections, includes/excludes whole discussions at runtime, and references them across sessions. This dialog is the management surface — not the inline Context pane list (which is quick-toggle only). Opened with `:discussion` or `gd` from Conversation.

## Variant A — flat list (exploring)

```
┌─ Discussions ─────────────────────────────────────────────────── [q] ─┐
│ ● api-design          12 parts   included                               │
│ ○ bootstrap-notes      4 parts   excluded                               │
│ ● doom-loop-fix        3 parts   included                               │
│                                                                          │
│ [n] new from selection   [t] toggle   [d] delete   [Enter] open detail   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Verdict:** rejected — no preview of what parts are in each discussion; cross-session linking invisible.

## Variant B — list + part preview (exploring)

```
┌─ Discussions ─────────────────────────────────────────────────── [q] ─┐
│ DISCUSSIONS          │ PREVIEW · api-design (12 parts)                │
│ ▶ api-design    ✓    │ user · "refactor auth layer"                   │
│   bootstrap     ✗    │ assistant · "Session type is v1…"              │
│   doom-loop     ✓    │ assistant · tool readFile                      │
│                      │ … +9 parts                                      │
│ linked: session-abc  │ ①                                               │
│                      │ included in next payload: YES                   │
│ [t]oggle [l]ink [s]napshot                                             │
└──────────────────────┴──────────────────────────────────────────────────┘
```

① `linked: session-abc` — cross-session `DiscussionLinked` reference ([[discussions-ux]] open question: snapshot vs live)

**Verdict:** preferred — preview proves what's in the cluster; link line surfaces cross-session semantics.

## States

### save new discussion (from visual selection)

```
┌─ Save discussion ──────────────────────────────────────────────────────┐
│ Name: api-design_                                                         │
│ 3 parts selected                                                        │
│ [x] include in next payload immediately  ①                              │
│                                                                          │
│                              [ Cancel ]    [ Save ]                       │
└──────────────────────────────────────────────────────────────────────────┘
```

① open question from [[discussions-ux]] — default included on create vs opt-in; wireframe assumes opt-in unchecked.
