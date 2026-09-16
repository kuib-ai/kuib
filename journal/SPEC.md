# Journal layout and format contract

Single runtime contract for `journal/`. Skills and scripts reference this file.
If this file and the validator disagree, the validator is wrong.

## Directories

| Path | Purpose | Tracked |
|---|---|---|
| `journal/features/<feature>/` | Active feature with plan + implementation tracking | yes |
| `journal/features/<feature>/research/` | Investigation evidence cited by plan decisions or items | yes |
| `journal/<entry>/` | Existing context entries (decisions, research, wireframes) | yes |
| `journal/_index.md` | Generated graph index | yes |
| `journal/SPEC.md` | This file | yes |

Existing journal entries (`journal/vision/`, `journal/ana/`, etc.) remain as context.
The `features/` subdirectory is for active implementation tracking with strict schema.

## `plan.md`

Required frontmatter:

```yaml
---
owner: github-username
lifecycle: draft | accepted | implementing | shipped | abandoned | superseded
summary: One-line hook for the generated INDEX.
topics: []
supersedes: []
superseded-by: []
---
```

Unknown frontmatter keys are errors. Machine-addressable body:

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
- Context: Why this decision was needed.
- Options considered: Alternatives evaluated.
- Decision: Selected behavior.
- Consequences: Trade-offs and effects.
- Supersedes: IDs or —
- Superseded by: IDs or —

## Gaps

### G001 — Gap title

- Status: open | planned | resolved | dismissed
- Context: What is unknown or unresolved.
```

Phase, item, decision, and gap IDs are never reused. Accepted decision rationale is
immutable; replacement uses reciprocal supersession. The plan is a living document —
new phases, decisions, and gaps are added as the feature evolves.

## `implementation.toml`

Maps every plan item to its execution state. Unknown fields and missing required
fields are errors.

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
refs = [
    { path = "services/stt-engine/src/main.swift", role = "inference server entry" },
]
```

### Item states

`planned` → `in_progress` → `implemented` → `verified`

Terminal: `deferred`, `dropped`.

### Derived rules

- Phase state derived from items: all planned → `planned`, any started → `in_progress`,
  all implemented/verified → `implemented`.
- Feature `state` must be consistent with phase states.
- Checkpoint `next` must reference live, non-terminal items.

### Refs

Repo-relative file paths. The reconciliation skill checks that referenced files exist.

## Reconciliation (`/journal-check`)

1. **Structure** — valid frontmatter, well-formed phases/items/decisions in plan;
   all required fields in implementation.toml.
2. **Coverage** — every plan item has an implementation entry.
3. **State consistency** — phase states match item states; lifecycle matches phases.
4. **Refs** — referenced files exist.
5. **Checkpoint** — next items are live and non-terminal.
