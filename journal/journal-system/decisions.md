---
title: "Journal System"
type: implementation
status: in-progress
layer: meta
created: 2026-04-13
tags: [infrastructure, journal, context, obsidian]
depends-on: []
informs: ["[[vision]]", "[[bootstrap-validation]]", "[[context-bootstrap]]"]
---

# Journal System

## Current Decisions

### Graph-Based Knowledge Store

Journal entries are nodes in a graph. Wikilinks are edges. The agent navigates the graph without reading content — metadata and edges provide the topology.

**Wikilink resolution:** A link like `[[vision]]` refers to the directory `journal/vision/`, not a standalone markdown file. Canonical content is always `journal/vision/decisions.md`. Agents resolve via `_index.md` and folder name — not Obsidian file creation behavior.

### Two-Layer Retrieval

1. **Index** (`journal/_index.md`) — compiled graph. Read at session start. Contains every entry with one-line description, status, tags, layer, and child nodes. Agent knows what exists without reading content.

2. **Subagent retrieval** — when content is needed, spawn an Explore subagent to read specific entries and return focused summaries. Main agent context stays clean.

### Entry Structure

Each entry is a directory under `journal/` containing:

- `decisions.md` — required, has YAML frontmatter + current truth only
- `plan.md` — implementation entries only
- `progress.md` — implementation entries only
- `research/` — subfolder for research findings and superseded historical detail

### Frontmatter Fields

Required: `title`, `type`, `status`, `created`, `tags`, `depends-on`, `informs`

Optional:

- `layer` — groups entries in `_index.md` (see Layer Taxonomy below)
- `supersedes` / `superseded-by` — only when an entire entry replaces another

### Entry Types (metadata, not folders)

All entries live flat under `journal/`. Type is frontmatter metadata.

- **vision** — big picture, strategy
- **implementation** — feature/system to build (may have plan + progress)
- **research** — completed or ongoing investigation
- **reference** — stable background knowledge

### Layer Taxonomy

The index compiler groups entries by `layer` (fallback: infer from `type`).

| Layer          | Purpose                                        | Typical entries                         |
| -------------- | ---------------------------------------------- | --------------------------------------- |
| `product`      | North star, problem framing, differentiation   | vision, comprehension-model             |
| `experience`   | User-facing surfaces, host, UX not in protocol | host-layer, discussions-ux              |
| `architecture` | Monorepo, packages, cross-cutting structure    | architecture-overview, security-model   |
| `protocol`     | Engine events, schemas, persistence            | protocol-design                         |
| `process`      | How we validate and decide                     | bootstrap-validation, ux-classification |
| `deferred`     | Additive later — not v1 blockers               | infrastructure-strategy                 |
| `research`     | Investigations, reference walkthroughs         | nvim-integration                        |
| `meta`         | Journal itself                                 | journal-system                          |

### Supersession Pattern

When decisions evolve within an entry (especially large implementation entries):

- **`decisions.md`** holds **Current Decisions**, **Open Questions**, and a short **Resolved Questions** bullet list
- Verbose rejected/superseded detail moves to **`research/superseded.md`** (or topic-specific research files)
- One-line pointer in current decisions: e.g. "SQ/EQ separation superseded — see [[protocol-design/research/superseded]]"
- Do not duplicate superseded content in both places

Use `supersedes` / `superseded-by` in frontmatter only when an entire journal entry is replaced by another entry.

### Bootstrap → Journal Workflow

During bootstrap validation sessions (see [[bootstrap-validation]]):

1. **Scene findings** → `bootstrap-validation/research/scene-*.md` with `[UX]`, `[Context]`, or `[Model]` tags on each observation
2. **Milestone decisions** promoted to the relevant entry's `decisions.md` (vision, host-layer, etc.)
3. **Architecture derivation** happens only after edge cases accumulate — not during scene capture

Classification rule (see [[ux-classification]]): we build **UX** and **Context** gaps; **Model** observations are assumptions about a capable frontier model, not build targets.

### Validation

Run `npx tsx scripts/compile-journal-index.ts` to rebuild the index and validate wikilinks.

Periodic validation (see `journal-validate` skill) ensures graph integrity: index matches filesystem, wikilinks resolve, bidirectional edges are consistent, stale entries are flagged.

### Obsidian Compatibility

The journal directory can be opened as an Obsidian vault. Wikilinks render as graph edges in Obsidian's graph view. Frontmatter renders in Obsidian's properties panel.

## Open Questions

- Exact cron schedule for validation
- Whether dated historical entries are needed vs updating `decisions.md` + `research/` only

## Resolved Questions

- **When/who writes to journal during a conversation** — bootstrap sessions write scene files; milestone decisions are promoted to parent entries by explicit agreement at session end or plan execution.
