---
id: R204
title: Tool approval gate with persisted approval state and command editing
state: shaped
horizon: later
domains: [core, host]
depends-on: ["[[roadmap/items/R205-risk-scoring-and-security-profiles]]", "[[roadmap/items/R203-event-taxonomy-completion]]"]
converges-with: ["[[roadmap/items/R201-append-validation-and-conflicts]]", "[[roadmap/items/R403-command-risk-approval-flow]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Pending Approval State Persistence (2026-04-26)]]", "[[_archive/protocol-design/decisions#Command Editing — Cache-Safe (Option B)]]", "[[_archive/protocol-design/decisions#Security: Operation x Target Risk Matrix]]", "[[_archive/protocol-design/progress#Rebuild list]]"]
touched: 2026-09-22
---

# R204 — Tool approval gate with persisted approval state and command editing

## Idea

Today tools execute immediately (and only read-only tools exist). The design gates each tool
call on a security verdict and makes the approval state durable, so a host that closes and
reopens mid-approval still knows "is this waiting on me?".

- **Pending state carries the verdict and approval:**
  `ToolCallPending = { status: "pending", input, title, startedAt, verdict: SecurityVerdict,
  approval: ApprovalState }`.
- **`ApprovalState`** (append-on-state-change, cross-consumer durable): `awaiting`,
  `counting-down { expiresAt }` (auto-approve timer), `editing { by, since }` (a device is
  editing the command — the edit lock of R201), `approved`, and `explaining` (an async background
  LLM call explaining what the command does). Denied/cancelled materialize as terminal error
  parts (`reason: rejected` / `cancelled`), not as approval states.
- **Flow:** engine emits `ToolCallRequested` with the verdict → pending part persists with
  approval `awaiting` → host renders the prompt from persisted state → `ToolApprovalGranted`
  → approval `approved` → tool executes → a completed/error part is appended as today.
  `ToolApprovalDenied` → error part `rejected`.
- **Command editing — cache-safe (option B):** when the user edits a tool call's input before
  approving, the pending part keeps the LLM's **original** request; the completed part carries
  an optional `executedInput` (present only when modified); the `tool_result` sent to the API
  includes the edit context. The edit sits at the conversation tail after the cache breakpoint,
  so the cached prefix is untouched and the model learns from the correction.
- Approval prompts show the **target device** prominently: "Run `rm -rf node_modules` on
  `prod-server`? [approve / deny / explain]".

## Why

Write and exec tools (R217) cannot be exposed without a gate, and a gate that forgets its state
on reload is unusable across devices.

## Open questions

- Auto-approve policy for low-risk verdicts (skip `awaiting` entirely?).
- Where the `explaining` LLM call runs and which model it uses.

## Constraints already decided

- Tool-call state is append-only; pending → completed/error by appending —
  [[domains/core/decisions#^D008]].
- Agent tools are read-only until this exists — [[domains/core/decisions#^D013]].
- Every pending call must get a resolution (R206).

## History

- 2026-09-22 migrated from the archive
