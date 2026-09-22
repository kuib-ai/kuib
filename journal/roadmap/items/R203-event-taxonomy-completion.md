---
id: R203
title: Complete the event taxonomy — retries, session, model switch, versions, tool output
state: shaped
horizon: later
domains: [core, host]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/protocol-design/decisions#Event Taxonomy — Revised (2026-04-26)]]", "[[_archive/protocol-design/decisions#Message Format — Finalized (v3, 2026-04-25)]]", "[[_archive/protocol-design/decisions#Versioning boundaries (2026-06-30)]]", "[[_archive/protocol-design/progress#Rebuild list]]"]
touched: 2026-09-22
---

# R203 — Complete the event taxonomy — retries, session, model switch, versions, tool output

## Idea

The built union has 13 variants (message lifecycle, steps, deltas, tool calls). The designed
taxonomy (every event implies `sessionID` via the envelope; events accumulate into messages and
parts) has more. This item holds the full reference list; capability items own their groups.

**Tool call lifecycle** (persisted parts only ever pending/completed/error):
- `ToolCallRequested { messageID, partID, callID, tool, input, title, startedAt, verdict }` —
  appends `PartToolCall(pending)` with the security verdict (→ R204).
- `ToolApprovalRequired { callID, verdict, explanation? }` (transient prompt),
  `ToolApprovalGranted { callID }`, `ToolApprovalDenied { callID }` → error part with reason
  `rejected` (→ R204).
- `ToolCallStarted { callID }` — transient "running" spinner, never persisted.
- `ToolCallOutputDelta { callID, delta }` — streaming output for long shell commands and
  subagent streams. **Declared in the protocol but never emitted today.**

**Retries** (ephemeral): `RetryAttempt { messageID, attempt, maxAttempts, waitMs }` — host
shows "Retrying… (attempt 2/5)". Retries are engine-internal; retryability is a derived function
`isRetryable(error)` over error kind + `statusCode`, not a stored field. Possible later: persist
as paired step boundaries with an aborted reason.

**Session / persistence:**
- `SessionUpdated { sessionID, status: SessionStatus }`
- `MessageUpdated { messageID, message }` — full message embedded. **Declared, never emitted.**
- `MessageVersionCreated { messageID, version }` — explicit version event for edits (→ R209).
- `CheckpointCreated { checkpointID, seq }` (→ R207).
- `ModelSwitched { from: ModelRef, to: ModelRef }`.
- `CompactionPerformed { archivedMessageIDs, summaryMessageID }` (→ R208; note the compaction
  design itself says no dedicated event is needed — reconcile there).

**Discussions** (→ R211): `DiscussionCreated { discussion }`, `DiscussionUpdated`,
`DiscussionDeleted`, `DiscussionLinked { sessionID, discussionID, snapshotVersion }`,
`DiscussionToggled { sessionID, discussionID, included }`, `DiscussionPartsAdded` /
`DiscussionPartsRemoved { discussionID, partIDs }`.

**Part exclusion** (→ R210): `PartExcluded` / `PartIncluded { messageID, partID }`.

**Deliberately dropped:** `TurnAborted` (derivable from the last step-stop reason
`interrupted`), `PartUpdated` / `PartRemoved` (parts are append-only within a message
version; edits create a new version), `PartFinalized` (implied by step boundaries and terminal
tool events), `causationID` (`seq` + `sessionID` suffice).

## Why

Retry visibility, model switching mid-session and streaming tool output are user-visible gaps;
the rest are prerequisites for the capability items above.

## Open questions

- Should `message-updated` and `tool-call-output-delta` stay declared-but-unused until these
  land, or be removed now and re-added?
- Transient events (`ToolCallStarted`, `RetryAttempt`) today would be persisted like everything
  else — is a non-persisted channel needed, or is "event type separates display from facts"
  enough?

## Constraints already decided

- One union, one envelope version; variants are unversioned — [[domains/core/decisions#^D004]],
  [[domains/core/decisions#^D005]].
- Terminal events exist and every turn ends with one — [[domains/core/decisions#^D007]].
- Discriminators are native TS enums — [[domains/core/decisions#^D002]].

## History

- 2026-09-22 migrated from the archive
