# Journal layout and format contract

Single runtime contract for `journal/`. Skills and tools reference this file.
`tooling/journal.ts` enforces it; if this file and the validator disagree, fix one of them
in the same change.

## Layers

| Layer | Path | Holds | Rule |
|---|---|---|---|
| Intent | `roadmap/` | Everything not built yet — ideas, open questions, deferred plans | May be vague; must record `origin` |
| Truth | `domains/<domain>/` | What is built, tied to the code | Every claim is backed by code |
| In flight | `features/<feature>/` | Plan and execution state of active work | Strict schema below |
| Provisional | `scratchpad/<name>/` | Session notes (git-ignored) | Not truth |
| Legacy | `_archive/<entry>/` | Pre-migration entries, read-only | Deleted once ledgers are complete |

One format everywhere: markdown with YAML frontmatter. Lifecycle: roadmap item (`state: idea`)
→ **graduate** → feature → **promote** → domain claims + decisions; the item becomes `shipped`.

Generated (never hand-edit): `_index.md`, `roadmap/ROADMAP.md`, the block between
`<!-- journal:generated -->` markers in `/AGENTS.md`. Rebuild with `pnpm journal build`.

## Links

Obsidian wikilinks, vault root = `journal/`. Paths are journal-relative without `.md`:
`[[domains/core/current#^mid-run-submits]]`, `[[domains/core/decisions#^D003]]`,
`[[roadmap/items/R017-web-host-viewer]]`, `[[features/stt-engine/plan]]`,
`[[_archive/host-layer/decisions#Exact Heading Text]]`.

Short IDs in prose: `R017`, `core/mid-run-submits` (a claim), `core#D003` (a decision).

## Domains

`product`, `core`, `host`, `infra`. Each `domains/<domain>/` contains:

- `current.md` — required. Present-tense truth. No dates in prose, no "superseded" markers: when
  code changes, the paragraph is rewritten and re-stamped.
- `decisions.md` — required. Append-only log of why built things are the way they are.
- `wireframes/` — optional. Adopted screen wireframes (see Wireframes).

### `current.md`

```markdown
---
domain: core
summary: "One line for the index."
code: ["packages/engine/**", "packages/protocol/**"]
---

# Core

## Mid-run submits

Messages typed during a run are spliced in at the next step boundary, not queued as a new
turn. ^mid-run-submits

> [!sources]- behaviour · verified 2026-09-22
> - `packages/engine/src/orchestrator/index.ts` › `runAgent` · #a91f3c20
> - `packages/engine/src/orchestrator/index.ts` › "prepareStep"
> - test: `packages/engine/src/orchestrator/index.test.ts` › "splices pending submits"
> - url: <https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text>
> - why: [[domains/core/decisions#^D003]]
> - from: [[_archive/protocol-design/decisions#Pending Approval State Persistence (2026-04-26)]]
```

- `code` globs (`**`, `*`, `{a,b}`) declare file ownership. Every file outside `journal/`
  matches exactly one domain.
- A claim is one paragraph (or list/table block) ending in ` ^<slug>` (kebab-case, unique in
  the domain, never reused), followed by a blank line and its callout.
- Callout header: `> [!sources]- <kind> · verified <YYYY-MM-DD|pending>`.
  Kinds: `behaviour` (what code does), `structure` (how code is laid out), `rationale`
  (why — needs a `why:`), `external` (facts about dependencies — needs a `url:`).
- Source lines:
  - `` `path` › `label` · #hash `` — **generated** by `stamp` from `@claim` links in the code
    (below). Never write these by hand.
  - `` `path` `` — the file matters as a whole; `stamp` appends ` · #hash`.
  - `` `path` › "exact quote" `` — for files that cannot carry a link (JSON, YAML, markdown);
    must appear verbatim.
  - `` test: `path` › "test name" `` — the name must appear in the file.
  - `url: <https://…>`; `why:` and `from:` — wikilinks, any number.
- A `behaviour`/`structure` claim needs at least one `@claim` scope link or source line.
- Anything the code does not show is not a claim — it is a roadmap item.

### Code links (`@claim`)

Code points at its explanation; nothing points back by hand.

```ts
// @claim core/agent-turn
import { streamText } from "ai";

// @claim core/mid-run-submits
const drainPending = function (queue: Queue) {
```

- First line of a file (after a shebang): `@claim <domain>[/<claim>]` names what explains the
  whole module. Every TS module under `apps/` and `packages/` except tests has one
  (`house/require-context-link`); the domain must own the file.
- Anywhere else: `@claim <domain>/<claim> [<domain>/<claim>…]` on its own comment line ties
  those claims to the scope below: for TS/JS the next declaration or statement (hashed through
  the syntax tree, comments and formatting ignored); for other languages the indented block
  starting at the next code line (decorators included, blank and comment lines ignored).
- `@claim` lines are directives, the only comments the house style allows besides tooling
  directives. Prose comments are not allowed anywhere.

### Verification and drift

- `stamp` rewrites a claim's generated source lines from the live links, hashes each scope
  and whole-file source, and sets `verified` to today.
- `drift` compares hashes: **broken** (a quote, test or file is gone), **changed** (a scope or
  file hash differs, or a link was added or removed), **unverified** (never stamped).
- Truth is due at commit, not while editing: `check` fails only on structure; `gate` fails
  while any claim is not fresh.

### `decisions.md`

```markdown
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
decisions about unbuilt things stay in their roadmap item or feature plan.

## Roadmap

```
roadmap/
  ROADMAP.md        generated — horizon lists + mermaid graph
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
origin: ["conversation 2026-09-22"]
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
- A raw one-line idea is an item with `state: idea` and only `## Idea`.
- `state`: `idea` → `shaped` → `graduated` (needs `feature`) → `shipped` (needs `feature`);
  terminal `absorbed` (needs `absorbed-into`), `dropped`.
- `horizon`: `now | next | later | maybe`.
- Edges are quoted wikilinks to items. `converges-with` must be reciprocal. `enables` is derived
  from `depends-on` and never written. `depends-on` must be acyclic.
- `origin` is required: archive sections, features, or `"conversation YYYY-MM-DD"`.
- `touched` is the last date the item was reviewed.

## Features

`features/<feature>/plan.md` + optional `research/` and `tasks/`.

### `plan.md`

```markdown
---
owner: github-username
lifecycle: implementing
summary: "One-line hook for the generated index."
topics: []
supersedes: []
superseded-by: []
roadmap: R017
context: ["[[domains/host/current#^serve-startup]]"]
checkpoint:
  summary: "What just happened and what is next."
  next: ["P01-I02"]
  blockers: []
  note: |-
    Short-lived working memory for the next session: what was in progress,
    the mood of the conversation, cautions. Overwritten at every handoff.
---

# Plan — <feature-name>

## Objective
## Non-goals
## Principles

## P01 — Phase title

### P01-I01 — Item title

- Acceptance: Observable completion criterion.
- State: in_progress
- Decisions: D001
- Addresses: G001
- Refs:
  - `services/stt-coreml/Sources/main.swift` — entry

## Decisions

### D001 — Decision title

- Status: proposed | accepted | superseded
- Ruling: "the owner's words, verbatim" (owner, YYYY-MM-DD)
- Context / Options considered / Decision / Consequences / Supersedes / Superseded by

## Gaps

### G001 — Gap title

- Status: open | planned | resolved | dismissed
- Recommendation: what to decide, when the owner owes a decision
- Context: What is unknown or unresolved.
```

- Unknown frontmatter keys are errors. `roadmap` names the item this feature implements (that
  item's `feature` points back). `context` lists the claims/decisions a session needs;
  `/remember` loads exactly these.
- `lifecycle`: `draft | accepted | implementing | shipped | abandoned | superseded`. An
  implementing feature needs a `checkpoint`.
- Item `State`: `planned` → `in_progress` → `implemented` → `verified`; terminal `deferred`,
  `dropped`. Phase state is derived from its items and never stored.
- `Refs` paths exist; `Decisions` and `Addresses` name decisions and gaps of this plan;
  checkpoint `next` names live, non-terminal items.
- A ruling is recorded the moment the owner gives it, verbatim, on the decision it settles.
- IDs are never reused. Accepted decision rationale is immutable.
- Write state with `pnpm journal set` and `pnpm journal checkpoint` (or by hand in the same
  format).

### Handoff

`pnpm journal handoff <feature>` renders the handoff from disk: checkpoint and note, accepted
decisions carrying a `Ruling`, open gaps with their `Recommendation`, unfinished items per
phase, the feature's tasks (live windows marked) and the context claims to re-verify. Nobody
writes a continuation file; only the note is written at handoff time.

### Tasks (`tasks/<task>/`)

Delegated work (see `/orchestrate`, tool `pnpm orchestra`) is recorded inside its feature and
committed with it:

| File | Written by | Holds |
|---|---|---|
| `brief.md` | orchestrator (frontmatter by `pnpm orchestra`) | task state + objective, acceptance, context, scope |
| `plan.md` | worker, when `gate: plan` | the plan to approve before any change |
| `log.md` | worker, append-only | progress after every move; the resume point after a restart |
| `report.md` | worker | result or findings |

```yaml
---
status: "running"
role: "implementer"
gate: "plan"
items: ["P02-I01"]
grant: ["packages/engine/**"]
agent: "claude"
command: "claude --model claude-opus-5"
cwd: "/path/to/checkout"
session: "kuib-ai/kuib/root"
started: "2026-09-22T21:18:32"
finished: ""
reported: ""
---
```

- Task ids are kebab-case and unique across features.
- `status`: `draft` → `running` → `plan-ready` | `done` | `blocked` | `failed` | `restart`;
  `lost` when the window vanished; `accepted` after `orchestra accept`. `plan-ready` needs
  `plan.md`, `restart` needs `log.md`, `done`/`blocked`/`failed`/`accepted` need `report.md`.
- `role`: `implementer | reviewer | probe`; `gate`: `none | plan`; `items` exist in the plan.
- Workers never message the orchestrator: they set their own status and stop.
- Runtime (panes, baselines, watch state) lives in tmux and the system temp dir, never in the
  journal.

### Promotion (feature → domains)

When a feature ships: rewrite the affected claims and add claims for new behaviour (with
`@claim` links in the code), `stamp` them, append lasting decisions to the domain
`decisions.md` with `From:` the feature, set the roadmap item to `shipped`, and set
`lifecycle: shipped`.

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

- `heading` is the exact text of an `##`/`###` heading in `file`, or `"*"` for the whole file.
- `to` targets: `R###`, `<domain>/<claim>`, `<domain>#D###`, `feature:<name>`,
  `path:<journal-relative path>`, `spec`, `dropped`.
- Coverage = mapped headings / all headings. The archive is deleted only at 100%.

## Tooling

`pnpm journal <command>` (`tooling/journal.ts` on the workspace Deno):

| Command | Does |
|---|---|
| `check` | Validate everything above and the code links; exit non-zero on errors. Part of `pnpm run check`. |
| `build` | Regenerate `_index.md`, `roadmap/ROADMAP.md`, the AGENTS.md block. |
| `drift [--files]` | Claims whose evidence changed, stale roadmap items, attribution coverage. |
| `gate` | Fail unless every claim is fresh — run before committing. |
| `stamp <domain>[/<claim>] \| --all` | Regenerate sources from `@claim` links, rehash, date. |
| `claims <path>…` | The claims tied to a file. |
| `set <feature> <item> <state> [--ref <path>[=<role>]]…` | Write an item's state and refs. |
| `checkpoint <feature> [--summary S] [--next A,B] [--blockers "A\|B"] [--note N] [--clear-note]` | Rewrite the checkpoint. |
| `handoff <feature>` | Render the handoff. |
| `brief [--hook claude\|gemini\|cursor]` | Session context for hooks (worker, orchestrator or plain session). |

`pnpm orchestra` (`tooling/orchestra.ts`) manages task records and their tmux windows; see
`/orchestrate`.
