# Workflow Rules

## Journal System

Layout, frontmatter, and lifecycle are defined in `journal/SPEC.md` — the single contract.
Read it when working on journal structure; never restate its rules from memory.

The journal has two layers:

1. **Features** (`journal/features/<feature>/`) — active implementation tracking with strict
   schema: `plan.md` (phases, items, decisions, gaps) + `implementation.toml` (execution state,
   refs to code, checkpoint). See `journal/SPEC.md` for the full contract.

2. **Context entries** (`journal/<name>/`) — existing background knowledge using the old format
   (decisions.md, wikilinks, research/). Reference material, not active tracking.

### Starting work

- Unclear task → `/journal-start <name>` for bare scratchpad notes in `journal/scratchpad/`.
- Clear task → `/journal-graduate <name>` directly to create a concrete feature with plan +
  implementation map. No placeholders.
- Bug-fix / debugging → tracked via commits, no journal entry needed.
- Graduate before implementation once the plan is concrete enough to review.

### During implementation

- Update `implementation.toml` checkpoint/item states after every major milestone.
- Update `plan.md` when decisions are made, phases evolve, or gaps are discovered.
- The plan is a living document — add decisions, phases, gaps as the feature progresses.
- Point implementation refs at actual code files. The reconciliation checks refs exist.

### On context compaction

- Run `/remember <feature>` to reload journal context.
- Read `journal/_index.md` and `journal/features/` to understand what exists.

### Validation

- Run `/journal-validate` after journal changes to check structure, coverage, state
  consistency, and refs.

## Wireframes (screen-level UX truth)

- Every screen (route or dialog) has exactly ONE wireframe file: `journal/<entry>/wireframes/<screen>.md`. Screen-level only — components never get their own wireframes; a screen's runtime states are frames inside its single file.
- Before designing or modifying any screen — code or design — read its wireframe first; it carries the motivation the code cannot.
- When a screen's implementation permanently diverges from its sketch, mark the wireframe `status: superseded` (+ `superseded-by`) and clean it to motivation + verdicts — never silently edit a sketch to match code.
- Full conventions: [[ux-iteration-process]].

## Commit Conventions

- Format: `feat/fix/chore/docs: <short message>`
- Never mention AI/Claude in commits
- Never push without explicit user instruction

## Code Quality & Command Running

- **Crucial Rule**: You must always ensure that the codebase is completely green before ending your task.
- Run `pnpm run check` from the workspace root to execute typechecking, linting, and formatting (cached via Nx) across the monorepo.
- If you create a new package, ensure it includes `"lint": "eslint ."` and `"format": "prettier --write ."` in its `package.json` so it participates in the `nx run-many` caching loop.
- Never silently ignore type errors or lint failures. Fix them.
