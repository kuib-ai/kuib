---
id: R206
title: Interrupts resolve every pending tool call in the log
state: shaped
horizon: next
domains: [core, host]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Interrupt Handling in the Parts Array]]", "[[_archive/protocol-design/decisions#Tool Call Error — Reason Enum]]", "[[_archive/protocol-design/decisions#Performance Strategy]]"]
touched: 2026-09-22
---

# R206 — Interrupts resolve every pending tool call in the log

## Idea

Interrupt exists (`interrupt` → abort; an error after abort is recorded as
`MESSAGE_COMPLETED`), but the log does not record what the interrupt did to in-flight tool
calls. Invariant: **every pending tool call gets a resolution** (completed or error) — no
dangling pendings. Codex (synthetic `AbortedToolOutput`), opencode (cleanup marks pending→error
plus a serialization safety net) and claude-code (`ensureToolResultPairing()` as final safety
net) all converge on it.

**Interrupt mid-stream** (during generation):

```
StepBoundaryStartPart
  TextPart("here's the ans")           ← partial, whatever streamed
  ToolCallPart(pending, callID=1)      ← fully formed before interrupt
                                        ← callID=2 was mid-JSON, dropped
StepBoundaryStopPart(reason: interrupted)
ToolCallPart(error, callID=1, reason: interrupted)  ← never executed
```

**Interrupt during tool execution:**

```
StepBoundaryStopPart(reason: tool-call-request)
ToolCallPart(completed, callID=1)                    ← finished before interrupt
ToolCallPart(error, callID=2, reason: interrupted)   ← was running, killed
ToolCallPart(error, callID=3, reason: interrupted)   ← never started
```

- Half-formed calls (incomplete input JSON) are dropped — never a real request.
- The parts array stays an exact append-only log; nothing is synthesized beyond error
  resolutions. The provider boundary translates them to `tool_result` blocks with `is_error`.
- Emit `STEP_FINISHED(reason: interrupted)` for the aborted step so the stop is durable.
- Reason rendering in hosts: `cancelled` grey, `rejected` red badge, `interrupted` amber with
  wall time, `failed` red with details.
- **Token counting on interrupt is approximate:** input exact (we built the context), output
  counted from received deltas; hosts show a `~` prefix on an interrupted step's tokens.

## Why

`buildMessages` currently drops unresolved calls from the model context, so an interrupted call
silently vanishes; the model never learns it was stopped, and hosts cannot show it.

## Open questions

- Does the tool `execute` receive the abort signal so a running daemon command is actually
  killed?

## Constraints already decided

- `ToolCallErrorReasonEnum` = `failed | interrupted | cancelled | rejected` and the append-only
  state model — [[domains/core/decisions#^D008]].
- Terminal events on every turn — [[domains/core/decisions#^D007]].

## History

- 2026-09-22 migrated from the archive
