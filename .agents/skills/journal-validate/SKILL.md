---
name: journal-validate
description: Validate the journal — structure, claims and code links, roadmap graph, features, tasks, archive ledgers, file ownership — then review semantic drift.
user-invocable: true
---

# Journal Validate

Layout contract: `journal/SPEC.md`.

## Phase 1 — Structural (deterministic)

```bash
pnpm journal build   # regenerate _index.md, roadmap/ROADMAP.md, AGENTS.md block
pnpm journal check   # errors fail; warnings are archive ledger progress
```

`check` covers: roadmap items (frontmatter, edges resolve, reciprocal `converges-with`, acyclic
`depends-on`), domain claims (callout format, sources hold), `@claim` links (every target
exists, first-line links name the owning domain, TS modules have one), domain decisions,
feature plans (frontmatter, checkpoint, item states, refs, decisions, gaps), task briefs,
wireframes, archive ledgers, file ownership, and freshness of generated files.

Report errors grouped by area. Do NOT auto-fix — present them to the owner, then fix what
they approve.

## Phase 2 — Drift

```bash
pnpm journal drift --files
```

Summarize broken/changed/unverified claims, stale roadmap items, and code files no claim is
tied to. Suggest `/context-audit <domain>` for domains with drift.

## Phase 3 — Semantic review

1. Contradictions between domains (the same behaviour described differently).
2. Roadmap items whose idea now appears built (grep the code for their key terms) → propose
   promoting or marking `shipped`.
3. Features whose `context:` links point at claims that drifted.

Report with specific quotes; ask the owner to decide. Do not silently resolve.
