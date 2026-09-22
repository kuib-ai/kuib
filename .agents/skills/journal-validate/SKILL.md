---
name: journal-validate
description: Validate the journal — structure, claim anchors, roadmap graph, features, archive ledgers, file ownership — then review semantic drift.
user-invocable: true
---

# Journal Validate

Layout contract: `journal/SPEC.md`.

## Phase 1 — Structural (deterministic)

```bash
pnpm journal build   # regenerate _index.md, roadmap/ROADMAP.md, AGENTS.md block
pnpm journal check   # errors fail; warnings are archive ledger progress
```

`check` covers: roadmap items (frontmatter, edges resolve, reciprocal `converges-with`,
acyclic `depends-on`), domain claims (callout format, anchors hold, `verified` is a commit),
domain decisions, features (frontmatter, plan ↔ implementation coverage, derived phase states,
checkpoint, refs), wireframes, archive ledgers, file ownership and `@context` headers, and
freshness of generated files.

Report errors grouped by area. Do NOT auto-fix — present them to the user, then fix what
they approve.

## Phase 2 — Drift

```bash
pnpm journal drift --files
```

Summarize broken/changed/stale claims, stale roadmap items, and uncited source files per
domain. Suggest `/context-audit <domain>` for domains with drift.

## Phase 3 — Semantic review

1. Contradictions between domains (the same behaviour described differently).
2. Roadmap items whose idea now appears built (grep the code for their key terms) → propose
   promoting or marking `shipped`.
3. Features whose `context:` links point at claims that drifted.

Report with specific quotes; ask the user to decide. Do not silently resolve.
