---
name: context-audit
description: Correct domain context. Re-verifies only the claims drift flags, against the code their @claim links point at, and stamps them after approval.
user-invocable: true
argument-hint: [domain | domain/claim | all]
---

# Context Audit

Auditing: "$ARGUMENTS" (default: all). Layout contract: `journal/SPEC.md` → Domains.

The drift report decides WHAT to look at; the model only judges the flagged claims. Never
re-read a whole domain or the whole codebase.

## 1. Queue

```bash
pnpm journal drift --files
```

Take the rows for the requested domain(s): `broken` (a quote, test or file is gone), `changed`
(a linked scope or file hash differs, or a link was added or removed), `unverified` (never
stamped). Order: broken → changed → unverified.

## 2. Verify each flagged claim (parallelise for more than ~5)

Give each check ONLY:
- the claim paragraph and its `[!sources]` callout from `current.md`;
- the code it is tied to: every scope under its `@claim` links (`pnpm journal claims <file>`
  lists them with line numbers) plus its quote/test/file sources;
- for `broken`: where the quote/test moved (grep), if anywhere.

Judge the claim against the code as it is now. Verdict per claim, one of:
- **holds** — the text is still true; only hashes moved.
- **rewrite** — proposed replacement paragraph and/or changed links or sources.
- **gone** — the behaviour was removed; propose deleting the claim and its links (and whether a
  roadmap item should capture it as intent).
- **split** — the paragraph now covers two behaviours; propose two claims (new slugs).

## 3. Present all verdicts together

A table: claim, status, verdict, one-line reason, then the proposed diffs. The owner accepts or
rejects each.

## 4. Apply accepted verdicts

- Edit `current.md` (slugs never change or get reused; new claims take new slugs).
- Move, add or delete `@claim` links in the code to match.
- If a rationale changed, append a new decision to `decisions.md` superseding the old one.
- `pnpm journal stamp <domain>/<claim>` for every accepted or holding claim.
- `pnpm journal build && pnpm journal check && pnpm journal gate` — zero errors.

## 5. Coverage (optional, when asked)

For files `drift --files` reports as untied, propose new claims or links so every source file
is explained.
