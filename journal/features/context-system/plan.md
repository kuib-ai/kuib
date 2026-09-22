---
owner: roysupriyo10
lifecycle: implementing
summary: Replace the drifting context graph with three layers — roadmap (intent), domains (code-attributed truth), features (in flight) — plus deterministic drift detection so domain context is periodically corrected.
topics:
  - journal
  - context
  - roadmap
  - domains
  - attribution
  - drift
supersedes: []
superseded-by: []
roadmap: R001
context:
  - "[[domains/infra/current#^C001]]"
  - "[[domains/infra/current#^C002]]"
  - "[[domains/infra/current#^C003]]"
  - "[[domains/infra/current#^C004]]"
---

# Plan — context-system

## Objective

Agents and humans get project context from three layers with one job each: the **roadmap**
holds everything not built yet (a graph of items), **domains** hold what is built — every
paragraph attributed to the source files that make it true — and **features** track work in
flight. The 25 legacy context entries are archived and mined: intent becomes roadmap items,
rationale for built behaviour becomes domain decisions, and domain truth is rebuilt from code.
A deterministic script finds drifted claims; a model only re-verifies what it flags.
Everything stays viewable in Obsidian.

## Non-goals

- Auto-committing corrected context without human approval.
- Executing tests to prove `test:` anchors (they are checked textually).
- Symbol-level hashing for Swift and Python (quote anchors cover them).
- Deleting the archive before every section is mapped in its ledger.

## Principles

- Code is truth for *what exists*; the journal holds *why*, *intent*, and *in-flight* work.
- One fact, one home: truth in a domain, intent in the roadmap, execution state in a feature.
- Attribution is mandatory and machine-checkable; drift detection needs no model.
- Generated views (`_index.md`, `ROADMAP.md`, AGENTS.md map) never hand-edited.

## P01 — Contract and tooling

### P01-I01 — Rewrite `journal/SPEC.md` for the three-layer model

- Acceptance: SPEC defines roadmap items, domain `current.md` claims with source callouts,
  domain `decisions.md`, feature frontmatter additions, archive ledgers, and wireframes.

### P01-I02 — `scripts/journal.ts` validate + build

- Acceptance: `check` validates roadmap, domains, features, archive ledgers and code
  ownership; `build` writes `_index.md`, `roadmap/ROADMAP.md` (with mermaid) and the
  AGENTS.md generated block; `pnpm run check` runs the validator.

### P01-I03 — Drift report and stamping

- Acceptance: `drift` ranks claims by broken/changed anchors and commits since `verified`;
  `stamp <domain>[#C###]` rewrites hashes and `verified` to HEAD.

### P01-I04 — `require-context-link` resolves domains and claim anchors

- Acceptance: `@context @journal/domains/<d>` and `@journal/domains/<d>#^C###` resolve;
  a missing claim anchor is reported as a dead link.

## P02 — Archive and roadmap

### P02-I01 — Move legacy entries to `journal/_archive/`

- Acceptance: all 25 entries live under `_archive/` unchanged; nothing else references them
  except `from:` attributions and ledgers.

### P02-I02 — Extract roadmap items with ledgers

- Acceptance: every unbuilt idea, open question and deferred plan in the archive is a
  roadmap item with `origin`; every archive section is mapped in its entry's `ledger.toml`.

## P03 — Domain truth

### P03-I01 — `product` domain

- Acceptance: `domains/product/current.md` + `decisions.md` pass validation; every claim cites code.

### P03-I02 — `core` domain

- Acceptance: as P03-I01 for `core`.

### P03-I03 — `host` domain

- Acceptance: as P03-I01 for `host`.

### P03-I04 — `infra` domain

- Acceptance: as P03-I01 for `infra`, including claims about the journal tooling itself.

### P03-I05 — Rewrite `@context` headers to domains

- Acceptance: every TS module header points at `@journal/domains/<owner>` or one of its
  claims; `pnpm run check` is green.

## P04 — Agent wiring

### P04-I01 — Skills

- Acceptance: `remember`, `journal-start`, `journal-graduate`, `journal-validate` and
  `wireframe` use the new layout; new `context-audit` and `journal-promote` skills exist.

### P04-I02 — Hooks

- Acceptance: Claude and Cursor hooks run the new validator; post-compaction injects the
  checkpoints of implementing features.

### P04-I03 — `AGENTS.md` orientation

- Acceptance: hand-written orientation plus a generated package/domain/feature block;
  `CLAUDE.md` links to it.

## P05 — Archive retirement

### P05-I01 — Delete `_archive/` once ledgers are complete

- Acceptance: `journal.ts check` reports 100% ledger coverage; archive removed on the
  owner's go-ahead.

## Decisions

### D001 — Three layers: roadmap, domains, features

- Status: accepted
- Context: Legacy `decisions.md` files mixed current truth, dated revisions, intent and
  superseded history; shipping `deno-runtime` required inline "Superseded" patches in 15 files.
- Options considered: patch entries in place; split each entry into current + log; separate
  intent from truth entirely.
- Decision: intent lives only in `roadmap/`, built truth only in `domains/`, execution only in
  `features/`. Lifecycle: inbox → item → feature (graduate) → domain (promote).
- Consequences: a shipped feature edits one `current.md` per domain instead of scattering
  patches; context loading is by layer.
- Supersedes: —
- Superseded by: —

### D002 — Migrate by treating the legacy journal as intent

- Status: accepted
- Context: Legacy text cannot be trusted as a description of the code.
- Options considered: distil entries in place; archive and rebuild truth from code.
- Decision: archive all entries read-only; mine them for roadmap items and rationale; rebuild
  domain truth from the code; per-entry `ledger.toml` maps every section to its destination.
- Consequences: nothing is lost silently; archive deletion is gated on ledger coverage.
- Supersedes: —
- Superseded by: —

### D003 — Four coarse domains owning code by glob

- Status: accepted
- Context: Truth needs a small number of homes, and every file needs an owner.
- Options considered: seven topical domains; one per package; four coarse domains.
- Decision: `product`, `core`, `host`, `infra`; each `current.md` declares `code:` globs and
  every tracked file outside `journal/` matches exactly one domain.
- Consequences: ownership coverage is enforced by the validator.
- Supersedes: —
- Superseded by: —

### D004 — Claims as block IDs with folded source callouts, one file

- Status: accepted
- Context: Heavy attribution must be machine-checkable without a sidecar that drifts from prose.
- Options considered: inline citations; sidecar `claims.toml`; callouts in the same file.
- Decision: each paragraph of truth ends with `^C###` and is followed by a collapsed
  `> [!sources]-` callout listing symbol/quote/test/url anchors, `why` and `from` links.
  Granularity is one claim per paragraph.
- Consequences: Obsidian renders clean prose with expandable sources; the stamp tool edits
  `current.md` directly.
- Supersedes: —
- Superseded by: —

### D005 — Roadmap as item files with frontmatter edges

- Status: accepted
- Context: Intent forms a graph whose items later split and join.
- Options considered: hand-written mermaid; one roadmap file; one file per item.
- Decision: `roadmap/items/R###-slug.md`, edges `depends-on`, `converges-with` (reciprocal),
  `split-from`, `absorbed-into` as wikilinks in frontmatter; `enables` is derived; mermaid
  is generated into `ROADMAP.md`.
- Consequences: Obsidian's graph view draws the roadmap natively; edges are lintable.
- Supersedes: —
- Superseded by: —

### D006 — Code attribution through `@context` headers

- Status: accepted
- Context: Every TS module already carries `// @context @journal/<entry>`, enforced by lint.
- Options considered: a separate code map; headers; both.
- Decision: headers stay and point at the owning domain or a specific claim
  (`@journal/domains/core#^C014`); ownership globs cover non-TS files.
- Consequences: archiving legacy entries requires rewriting all headers in the same change.
- Supersedes: —
- Superseded by: —

### D007 — Deterministic drift, model-assisted correction

- Status: accepted
- Context: Domain context must be periodically corrected without re-reading the codebase.
- Options considered: periodic full re-read; git-based staleness per claim.
- Decision: `journal.ts drift` flags claims whose symbol hash, quote or test anchor broke or
  whose sources changed since `verified`; `/context-audit` re-verifies only flagged claims
  against the diff and stamps them after owner approval.
- Consequences: correction cost scales with code change.
- Supersedes: —
- Superseded by: —

### D008 — Roadmap ID blocks during migration

- Status: accepted
- Context: Domains are migrated in parallel and roadmap IDs are global.
- Options considered: renumber afterwards; allocate blocks.
- Decision: R001–R099 general/features, R100 product, R200 core, R300 host, R400 infra.
  New items take the next free number in any block.
- Consequences: IDs are stable from creation; numbers carry no ordering meaning.
- Supersedes: —
- Superseded by: —

## Gaps

### G001 — Swift and Python files carry no `@context` header

- Status: open
- Context: The lint rule only covers TS; non-TS files are attributed through domain globs only.

### G002 — External claims are not rechecked on dependency bumps

- Status: open
- Context: `url:` anchors have no automatic trigger; drift only reports their age.

### G003 — Headings containing brackets cannot be wikilinked

- Status: open
- Context: Obsidian link syntax cannot address a heading such as "Discussion Model — PartID[] Overlay"; R211 records that origin in its History instead, and the ledger maps it normally.

### G004 — Overlapping roadmap items from the parallel migration

- Status: open
- Context: Items mined per domain overlap (e.g. R403/R404 with R204/R205, R406 with R303, R219 with R407); they are linked with `converges-with` and await the owner's merge decisions (`absorbed-into`).
