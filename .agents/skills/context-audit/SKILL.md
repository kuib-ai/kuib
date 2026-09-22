---
name: context-audit
description: Periodically correct domain context. Re-verifies only the claims the drift report flags, against the code diff since each claim was verified, and stamps them after approval.
user-invocable: true
argument-hint: [domain | domain#C### | all]
---

# Context Audit

Auditing: "$ARGUMENTS" (default: all). Layout contract: `journal/SPEC.md` → Domains.

The drift script decides WHAT to look at; the model only judges the flagged claims. Never
re-read a whole domain or the whole codebase.

## 1. Queue

```bash
pnpm journal drift --files
```

Take the rows for the requested domain(s) with status `broken`, `changed`, `unverified`,
`stale`, or `dirty`. Order: broken → changed → unverified → stale (most commits first).

## 2. Verify each flagged claim (parallelise with subagents for more than ~5)

Give each check ONLY:
- the claim paragraph and its `[!sources]` callout from `current.md`;
- `git diff <verified>..HEAD -- <source paths>` (plus the working-tree diff for `dirty`);
- for `broken`: where the symbol/quote/test moved (grep), if anywhere.

Verdict per claim, one of:
- **holds** — text still true; anchors fine (or only hashes moved).
- **rewrite** — proposed replacement paragraph and/or updated anchors.
- **gone** — behaviour removed; propose deleting the claim (and whether a roadmap item should
  capture it as intent).
- **split** — the paragraph now covers two behaviours; propose two claims (new IDs).

## 3. Present all verdicts together

A table: claim, status, verdict, one-line reason, then the proposed diffs. The owner accepts
or rejects each.

## 4. Apply accepted verdicts

- Edit `current.md` (keep IDs; new claims take the next free ID; never reuse a deleted ID).
- If a rationale changed, append a new decision to `decisions.md` superseding the old one.
- Update `@context` headers that named a deleted claim.
- `pnpm journal stamp <domain>#C###` for every accepted or holding claim.
- `pnpm journal build && pnpm journal check` — zero errors.

## 5. Coverage (optional, when asked)

For uncited files from `drift --files`, propose new claims (or extend existing ones) so every
source file is attributed.
