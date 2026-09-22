# Journal layout and format contract

Single runtime contract for `journal/`. Skills and scripts reference this file.
`scripts/journal.ts` enforces it; if this file and the validator disagree, fix one of them
in the same change.

## Layers

| Layer | Path | Holds | Rule |
|---|---|---|---|
| Intent | `roadmap/` | Everything not built yet — ideas, open questions, deferred plans | May be vague; must record `origin` |
| Truth | `domains/<domain>/` | What is built, attributed to source | Every paragraph cites code |
| In flight | `features/<feature>/` | Plan + execution state of active work | Strict schema below |
| Provisional | `scratchpad/<name>/` | Session notes (git-ignored) | Not truth |
| Legacy | `_archive/<entry>/` | Pre-migration entries, read-only | Deleted once ledgers are complete |

Lifecycle: `inbox.md` line → roadmap item → **graduate** → feature → **promote** → domain
claims + decisions; the item becomes `shipped`.

Generated (never hand-edit): `_index.md`, `roadmap/ROADMAP.md`, the block between
`<!-- journal:generated -->` markers in `/AGENTS.md`. Rebuild with
`deno run -A scripts/journal.ts build`.

## Links

Obsidian wikilinks, vault root = `journal/`. Paths are journal-relative without `.md`:
`[[domains/core/current#^C014]]`, `[[domains/core/decisions#^D003]]`,
`[[roadmap/items/R017-web-host-viewer]]`, `[[features/stt-engine/plan]]`,
`[[_archive/host-layer/decisions#Exact Heading Text]]`.

Short IDs in prose and TOML: `R017`, `core#C014`, `core#D003`.

## Domains

`product`, `core`, `host`, `infra`. Each `domains/<domain>/` contains:

- `current.md` — required. Present-tense truth. No dates, no "superseded" markers: when code
  changes, the paragraph is rewritten and re-stamped.
- `decisions.md` — required. Append-only log of why built things are the way they are.
- `wireframes/` — optional. Adopted screen wireframes (see Wireframes).

### `current.md`

```markdown
---
domain: core
summary: One line for the index.
code: ["packages/engine/**", "packages/protocol/**"]
---

# Core

## Mid-run submits

Messages typed during a run are spliced in at the next step boundary, not queued as a new
turn. ^C014

> [!sources]- C014 · behaviour · verified 9374dfb
> - `packages/engine/src/orchestrator/index.ts` › `runAgent` · #a91f3c20
> - `packages/engine/src/orchestrator/index.ts` › "prepareStep"
> - test: `packages/engine/src/orchestrator/index.test.ts` › "splices pending submits"
> - url: <https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text>
> - why: [[domains/core/decisions#^D003]]
> - from: [[_archive/protocol-design/decisions#Pending Approval State Persistence (2026-04-26)]]
```

- `code` globs (`**`, `*`, `{a,b}`) declare file ownership. Every git-tracked file outside
  `journal/` matches exactly one domain.
- A claim is one paragraph (or list/table block) ending in ` ^C###`, followed by a blank line
  and its callout. Claim IDs are per domain, sequential, never reused.
- Callout header: `> [!sources]- C### · <kind> · verified <sha|pending>`.
  Kinds: `behaviour` (what code does), `structure` (how code is laid out), `rationale`
  (why — needs a `why:`), `external` (facts about dependencies — needs a `url:`).
- Anchor lines (at least one code anchor unless kind is `rationale`):
  - `` `path` `` — the file matters as a whole.
  - `` `path` › `Symbol` · #hash `` — TS/TSX only. `Symbol` or `Outer.member`; `hash` is
    written by `stamp`, omit it when authoring.
  - `` `path` › "exact quote" `` — any language; must appear verbatim in the file.
  - `` test: `path` › "test name" `` — the name must appear in the file.
  - `url: <https://…>`
  - `why:` and `from:` — wikilinks, any number.
- `verified pending` is allowed while authoring; `stamp` sets the sha and hashes.
- Anything the code does not show is not a claim — it is a roadmap item.

### `decisions.md`

```markdown
---
domain: core
---

# Core — decisions

### D003 — Pending submits drain at step boundaries

- Status: accepted | superseded
- Context: Why the decision was needed.
- Decision: What was chosen.
- Consequences: Trade-offs.
- Supersedes: — | D001
- Superseded by: — | D007
- From: [[_archive/host-layer/decisions#Heading]] | [[features/x/plan]]

^D003
```

Append-only. A decision's rationale is never edited; replacement is a new decision with
reciprocal `Supersedes` / `Superseded by`. Only decisions about **built** things live here;
decisions about unbuilt things stay in their roadmap item.

## Roadmap

```
roadmap/
  ROADMAP.md        generated — horizon lists + mermaid graph
  inbox.md          free-form one-liners awaiting triage
  items/R###-<slug>.md
  research/         evidence cited by items
  wireframes/       exploring screen wireframes
```

### Item file

```markdown
---
id: R017
title: Web host as a pure viewer over SSE
state: idea
horizon: later
domains: [host, infra]
depends-on: ["[[roadmap/items/R031-mesh-event-log]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/host-layer/decisions#Web host (`kuib web`) + SSE catch-up protocol (2026-07-01)]]"]
touched: 2026-09-22
---

# R017 — Web host as a pure viewer over SSE

## Idea
## Why
## Open questions
## Constraints already decided
## History
```

- Filename `R###-<kebab-slug>.md`; `id` matches. IDs are global and never reused.
- `state`: `idea` → `shaped` → `graduated` (needs `feature`) → `shipped` (needs `feature`);
  terminal `absorbed` (needs `absorbed-into`), `dropped`.
- `horizon`: `now | next | later | maybe`.
- Edges are wikilinks to items. `converges-with` must be reciprocal. `enables` is derived
  from `depends-on` and never written. `depends-on` must be acyclic.
- `origin` is required and non-empty: archive sections, features, or
  `"conversation YYYY-MM-DD"`.
- Only `## Idea` is required in the body. `touched` is the last date the item was reviewed.

## Features

`features/<feature>/plan.md` + `implementation.toml` + optional `research/`.

### `plan.md`

```yaml
---
owner: github-username
lifecycle: draft | accepted | implementing | shipped | abandoned | superseded
summary: One-line hook for the generated index.
topics: []
supersedes: []
superseded-by: []
roadmap: R017
context: ["[[domains/host/current#^C004]]"]
---
```

Unknown keys are errors. `roadmap` names the item this feature implements (that item's
`feature` points back). `context` lists the domain claims/decisions a session needs;
`/remember` loads exactly these.

Machine-addressable body:

```markdown
# Plan — <feature-name>

## Objective
## Non-goals
## Principles

## P01 — Phase title

### P01-I01 — Item title

- Acceptance: Observable completion criterion.

## Decisions

### D001 — Decision title

- Status: proposed | accepted | superseded
- Context / Options considered / Decision / Consequences / Supersedes / Superseded by

## Gaps

### G001 — Gap title

- Status: open | planned | resolved | dismissed
- Context: What is unknown or unresolved.
```

IDs are never reused. Accepted decision rationale is immutable.

### `implementation.toml`

```toml
feature = "<feature-name>"
state = "implementing"
current_phase = "P01"

[checkpoint]
summary = "What just happened and what is next."
next = ["P01-I02"]
blockers = []

[phases.P01]
state = "in_progress"

[items."P01-I01"]
state = "planned"
decisions = ["D001"]
addresses = []
refs = [{ path = "services/stt-coreml/Sources/main.swift", role = "entry" }]
```

- Item states: `planned` → `in_progress` → `implemented` → `verified`; terminal `deferred`,
  `dropped`.
- Phase state: all planned → `planned`; all implemented/verified/terminal → `implemented`;
  otherwise `in_progress`.
- Every plan item has an entry and vice versa. Checkpoint `next` names live, non-terminal
  items. `refs` paths exist.

### Tasks (`tasks/<task-id>/`)

Delegated work (see `/orchestrate`, tool `bin/orchestra`) is recorded inside the feature it
belongs to and committed with it:

| File | Written by | Holds |
|---|---|---|
| `brief.md` | orchestrator | objective, acceptance, context links, scope |
| `prompt.md` | `orchestra spawn` | the exact prompt typed into the worker |
| `task.toml` | `orchestra` | `status`, `agent`, `command`, `cwd`, `started`, `finished`, `reported` |
| `report.md` | worker | result or findings |

- Task ids are kebab-case and unique across features.
- `status`: `draft` → `running` → `done` \| `blocked` \| `failed`; `lost` when the worker's
  window vanished; `orchestra send` (new assigned work) sets it `running` again. Workers never
  message the orchestrator — a worker that cannot proceed reports `blocked`. Non-draft tasks need `brief.md`; finished ones need `report.md`.
- Runtime (panes, windows) lives only in tmux, never in the journal.

### Promotion (feature → domains)

When a feature ships: rewrite the affected `current.md` paragraphs (new/changed claims, then
`stamp`), append its lasting decisions to the domain `decisions.md` with `From:` the feature,
set the roadmap item to `shipped`, and set `lifecycle: shipped`.

## Wireframes

One file per screen (route or dialog), never per component; runtime states are frames inside
it. `exploring` wireframes live in `roadmap/wireframes/` and are linked from an item;
`adopted` wireframes live in `domains/host/wireframes/`.

```yaml
---
screen: <name>              # equals filename
kind: route | dialog
status: exploring | adopted | superseded
sizes: [80x24, 120x32]
implements: []              # repo paths once built
superseded-by: ""           # wikilink, only when superseded
---
```

Body: `## Motivation` first. While exploring, `## Variant <X> — <name>` sections, each loser
keeping a one-line **Verdict**. Once adopted, `## States` with one frame per distinct layout.
Never edit a sketch to match code — supersede it.

## Code attribution

Every TS module under `apps/` and `packages/` starts with
`// @context @journal/domains/<domain>` or `// @context @journal/domains/<domain>#^C###`
(enforced by `house/require-context-link`). The domain must own the file; a claim anchor
must exist in that domain's `current.md`.

## Archive

`_archive/<entry>/` holds a legacy entry unchanged plus `ledger.toml`:

```toml
entry = "host-layer"

[[section]]
file = "decisions.md"
heading = "Web host (`kuib web`) + SSE catch-up protocol (2026-07-01)"
to = ["R017", "host#D004"]
note = "optional"
```

- `heading` is the exact text of an `##`/`###` heading in `file`, or `"*"` for the whole
  file.
- `to` targets: `R###`, `<domain>#C###`, `<domain>#D###`, `feature:<name>`,
  `path:<journal-relative path>` (file moved out), `spec` (folded into this file),
  `dropped` (dead or superseded).
- Coverage = mapped headings / all headings. The archive is deleted only at 100%.

## Tooling

`deno run -A scripts/journal.ts <command>` (also `pnpm journal <command>`):

| Command | Does |
|---|---|
| `check` | Validate everything above; exit non-zero on errors. Part of `pnpm run check`. |
| `build` | Regenerate `_index.md`, `roadmap/ROADMAP.md`, AGENTS.md block. |
| `drift` | Rank claims: broken anchors, changed symbol hashes, commits since `verified`; stale roadmap items. |
| `stamp <domain>[#C###]` | Recompute symbol hashes and set `verified` to HEAD for the targets. |

`bin/orchestra` (a uv script) manages task records and their tmux windows; see `/orchestrate`.
