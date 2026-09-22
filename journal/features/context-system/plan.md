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
  - "[[domains/infra/current#^journal-layers]]"
  - "[[domains/infra/current#^journal-check]]"
  - "[[domains/infra/current#^claim-verification]]"
  - "[[domains/infra/current#^code-links]]"
  - "[[domains/infra/current#^feature-plans]]"
  - "[[domains/infra/current#^handoff]]"
checkpoint:
  summary: "v2 landed (P06): @claim links tie claims to code scopes, claim sources are generated, evidence is content-hashed and gated at commit, plans hold their own state, handoffs are rendered, SPEC/AGENTS.md/skills rewritten. Open with the owner: converging roadmap merges (G004) and deleting the archive (P05-I01)."
  next: ["P05-I01"]
  blockers: []
  note: ""
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
- State: implemented
- Decisions: D001, D004, D005
- Refs:
  - `journal/SPEC.md` — journal contract

### P01-I02 — `scripts/journal.ts` validate + build

- Acceptance: `check` validates roadmap, domains, features, archive ledgers and code
  ownership; `build` writes `_index.md`, `roadmap/ROADMAP.md` (with mermaid) and the
  AGENTS.md generated block; `pnpm run check` runs the validator.
- State: implemented
- Decisions: D003, D005
- Refs:
  - `tooling/journal.ts` — check + build
  - `package.json` — journal script, check gate

### P01-I03 — Drift report and stamping

- Acceptance: `drift` ranks claims by broken/changed anchors and commits since `verified`;
  `stamp <domain>[#C###]` rewrites hashes and `verified` to HEAD.
- State: implemented
- Decisions: D007
- Refs:
  - `tooling/journal.ts` — drift + stamp

### P01-I04 — `require-context-link` resolves domains and claim anchors

- Acceptance: `@context @journal/domains/<d>` and `@journal/domains/<d>#^C###` resolve;
  a missing claim anchor is reported as a dead link.
- State: implemented
- Decisions: D006
- Refs:
  - `packages/eslint-plugin-house-style/src/rules/require.context.link/index.ts` — context header lint rule
  - `packages/eslint-plugin-house-style/src/rules/require.context.link/index.test.ts` — domain + anchor cases

## P02 — Archive and roadmap

### P02-I01 — Move legacy entries to `journal/_archive/`

- Acceptance: all 25 entries live under `_archive/` unchanged; nothing else references them
  except `from:` attributions and ledgers.
- State: implemented
- Decisions: D002
- Refs:
  - `journal/_archive` — legacy entries

### P02-I02 — Extract roadmap items with ledgers

- Acceptance: every unbuilt idea, open question and deferred plan in the archive is a
  roadmap item with `origin`; every archive section is mapped in its entry's `ledger.toml`.
- State: implemented
- Decisions: D002, D008
- Refs:
  - `journal/roadmap/items` — roadmap items R100–R414
  - `journal/roadmap/ROADMAP.md` — generated roadmap + graph

## P03 — Domain truth

### P03-I01 — `product` domain

- Acceptance: `domains/product/current.md` + `decisions.md` pass validation; every claim cites code.
- State: implemented
- Decisions: D003, D004
- Refs:
  - `journal/domains/product/current.md` — product truth

### P03-I02 — `core` domain

- Acceptance: as P03-I01 for `core`.
- State: implemented
- Decisions: D003, D004
- Refs:
  - `journal/domains/core/current.md` — core truth

### P03-I03 — `host` domain

- Acceptance: as P03-I01 for `host`.
- State: implemented
- Decisions: D003, D004
- Refs:
  - `journal/domains/host/current.md` — host truth

### P03-I04 — `infra` domain

- Acceptance: as P03-I01 for `infra`, including claims about the journal tooling itself.
- State: implemented
- Decisions: D003, D004
- Refs:
  - `journal/domains/infra/current.md` — infra truth incl. journal system

### P03-I05 — Rewrite `@context` headers to domains

- Acceptance: every TS module header points at `@journal/domains/<owner>` or one of its
  claims; `pnpm run check` is green.
- State: implemented
- Decisions: D006
- Refs:
  - `packages/engine/src/orchestrator/index.ts` — example claim-narrowed header

## P04 — Agent wiring

### P04-I01 — Skills

- Acceptance: `remember`, `journal-start`, `journal-graduate`, `journal-validate` and
  `wireframe` use the new layout; new `context-audit` and `journal-promote` skills exist.
- State: implemented
- Decisions: D007
- Refs:
  - `.agents/skills/context-audit/SKILL.md` — audit skill
  - `.agents/skills/journal-promote/SKILL.md` — promote skill
  - `.agents/skills/remember/SKILL.md` — remember via context links

### P04-I02 — Hooks

- Acceptance: Claude and Cursor hooks run the new validator; post-compaction injects the
  checkpoints of implementing features.
- State: implemented
- Refs:
  - `.agents/hooks/journal-context` — shared session hook (brief)

### P04-I03 — `AGENTS.md` orientation

- Acceptance: hand-written orientation plus a generated package/domain/feature block;
  `CLAUDE.md` links to it.
- State: implemented
- Decisions: D001
- Refs:
  - `AGENTS.md` — orientation + generated block
  - `CLAUDE.md` — imports @AGENTS.md

## P05 — Archive retirement

### P05-I01 — Delete `_archive/` once ledgers are complete

- Acceptance: `journal.ts check` reports 100% ledger coverage; archive removed on the
  owner's go-ahead.
- State: planned
- Decisions: D002
- Addresses: G004

## P06 — Code-linked truth, one format

### P06-I01 — `@claim` links carry the code-to-truth link

- Acceptance: a first-line `@claim` names what explains a module and scope links tie claims to
  declarations, statements or indented blocks in any language with comments; claim sources are
  generated from the links; claims have slug ids; lint and `journal.ts check` resolve every link.
- State: implemented
- Decisions: D009
- Addresses: G001
- Refs:
  - `tooling/journal.ts` — link scanning, scopes, stamp
  - `packages/eslint-plugin-house-style/src/rules/require.context.link/index.ts` — first-line link and target checks
  - `packages/eslint-plugin-house-style/src/rules/no.prose.comments/index.ts` — allows `@claim`

### P06-I02 — Content-hash drift and the commit gate

- Acceptance: `drift` reports broken, changed and unverified claims from scope and file hashes
  with no git dependency; `gate` fails while any claim is not fresh; `check` fails only on
  structure.
- State: implemented
- Decisions: D010
- Refs:
  - `tooling/journal.ts` — claimEvidence, commandGate, commandStamp

### P06-I03 — One-file plans and rendered handoffs

- Acceptance: plans carry item `State`/`Refs` fields and a frontmatter checkpoint with a note;
  `implementation.toml` and `inbox.md` are gone; `journal.ts set`, `checkpoint` and `handoff`
  exist; task briefs carry their state in frontmatter.
- State: implemented
- Decisions: D011
- Refs:
  - `journal/SPEC.md` — the contract
  - `tooling/journal.ts` — parsePlanBody, commandSet, commandCheckpoint, renderHandoff

### P06-I04 — Migrate the journal and the code

- Acceptance: every claim has a slug and a stamped callout; the old `@context` headers and
  symbol anchors became `@claim` links; plans, tasks and references use the new formats;
  `pnpm run check` and `pnpm journal gate` are green.
- State: implemented
- Refs:
  - `journal/domains/infra/current.md` — rewritten journal and tooling claims

### P06-I05 — Instructions describe the mechanism

- Acceptance: `AGENTS.md` explains the whole working mechanism as capabilities and why keeping
  context on disk pays off; SPEC and the journal skills match the new formats.
- State: implemented
- Decisions: D012
- Refs:
  - `AGENTS.md` — capabilities and rules
  - `.agents/skills/remember/SKILL.md` — loads a feature

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

- Status: superseded
- Context: Every TS module already carries `// @context @journal/<entry>`, enforced by lint.
- Options considered: a separate code map; headers; both.
- Decision: headers stay and point at the owning domain or a specific claim
  (`@claim core/fs-io-schemas`); ownership globs cover non-TS files.
- Consequences: archiving legacy entries requires rewriting all headers in the same change.
- Supersedes: —
- Superseded by: D009

### D007 — Deterministic drift, model-assisted correction

- Status: superseded
- Context: Domain context must be periodically corrected without re-reading the codebase.
- Options considered: periodic full re-read; git-based staleness per claim.
- Decision: `journal.ts drift` flags claims whose symbol hash, quote or test anchor broke or
  whose sources changed since `verified`; `/context-audit` re-verifies only flagged claims
  against the diff and stamps them after owner approval.
- Consequences: correction cost scales with code change.
- Supersedes: —
- Superseded by: D010

### D008 — Roadmap ID blocks during migration

- Status: accepted
- Context: Domains are migrated in parallel and roadmap IDs are global.
- Options considered: renumber afterwards; allocate blocks.
- Decision: R001–R099 general/features, R100 product, R200 core, R300 host, R400 infra.
  New items take the next free number in any block.
- Consequences: IDs are stable from creation; numbers carry no ordering meaning.
- Supersedes: —
- Superseded by: —

### D009 — Code points at truth with `@claim` directives; sources are generated

- Status: accepted
- Ruling: "i think we can put it on functions and scopes too -- we can use ast parsing and ensuring this is more properly maintained"; "i hope the implemetnation file only contains refernces about the codebase -- and the codebase contains referneces about the domain context"; "i never want commetns in the code -- everything must be self -explanatory"; on links: "no by comments i mean plain // commetns that describe things, of course this is a good thing, these are directives that our journal has and eslint excludes" (owner, 2026-09-22)
- Context: Claims listed code sources by hand and code pointed back with `@context` headers, so the link was kept twice; sequential ids collided across branches.
- Options considered: claims own the sources plus a lookup command; code annotations own the link and sources are generated.
- Decision: `@claim` on the first line of a file names what explains the module; `@claim <domain>/<claim>` above a scope ties that claim to it. `stamp` generates the scope sources. Claim ids are slugs. Plans point at code (`Refs`), code points at domain claims, nothing points back by hand.
- Consequences: infra D027. Directives are the only comments allowed in code.
- Supersedes: D006
- Superseded by: —

### D010 — Verify by content hash; truth is due at commit

- Status: accepted
- Context: `verified <sha>` made claims stale the moment the stamped change was committed, broke after rebases and squashes, and ignored uncommitted work.
- Options considered: keep git-based staleness with a blame baseline; hash the evidence.
- Decision: stamp stores a hash per linked scope and per whole-file source; drift compares hashes. `check` never fails on changed evidence; `gate` does, and it runs before a commit.
- Consequences: editing is never blocked by the journal; the commit is where truth is settled.
- Supersedes: D007
- Superseded by: —

### D011 — One storage format; plans hold their own state; handoffs are rendered

- Status: accepted
- Ruling: "we should keep one singel format for storing everything"; "the plan and implemetnation separately is a big problem -- keeping it in sync by hand" (owner, 2026-09-22)
- Context: `inbox.md` was a second format; `plan.md` and `implementation.toml` stored every item twice; continuations were written by hand and repeated recorded state.
- Options considered: keep two files without duplicates; one file with state fields; derive state from task records.
- Decision: everything is markdown with YAML frontmatter; an idea is an item with `state: idea`; items carry `State`/`Refs`; the checkpoint (with the previous session's note) sits in the plan frontmatter; `journal.ts handoff` renders the handoff; rulings are decisions with a `Ruling` field quoting the owner.
- Consequences: infra D028. The note is the only thing written at handoff time.
- Supersedes: —
- Superseded by: —

### D012 — Instructions state capabilities, not procedures

- Status: accepted
- Ruling: "keep it flexible but free -- mention about capabilities but do not ground in how to work"; "advertise the good things about maintaining contxt like this -- persisting to disk is the best way to do this" (owner, 2026-09-22)
- Context: Agents need the whole mechanism in view without being scripted step by step.
- Options considered: procedural skills only; capability description in `AGENTS.md` plus skills for multi-step flows.
- Decision: `AGENTS.md` describes what the journal, the tools and the hook can do and why persisted context pays off; skills keep the multi-step flows.
- Consequences: `AGENTS.md` is longer and always loaded.
- Supersedes: —
- Superseded by: —

## Gaps

### G001 — Swift and Python files carry no `@context` header

- Status: resolved
- Context: The lint rule only covers TS; non-TS files are attributed through domain globs only. Resolved by D009: `@claim` links work in any language with line comments and are checked by `journal.ts check`.

### G002 — External claims are not rechecked on dependency bumps

- Status: open
- Context: `url:` anchors have no automatic trigger; drift only reports their age.

### G003 — Headings containing brackets cannot be wikilinked

- Status: open
- Context: Obsidian link syntax cannot address a heading such as "Discussion Model — PartID[] Overlay"; R211 records that origin in its History instead, and the ledger maps it normally.

### G004 — Overlapping roadmap items from the parallel migration

- Status: open
- Context: Items mined per domain overlap (e.g. R403/R404 with R204/R205, R406 with R303, R219 with R407); they are linked with `converges-with` and await the owner's merge decisions (`absorbed-into`).
