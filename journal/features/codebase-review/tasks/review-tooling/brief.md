# review-tooling — correctness review of the new journal and agent tooling

Feature: journal/features/codebase-review/ · Item: P01-I01 · Roadmap: R005

Feature: journal/features/context-system/ + journal/features/agent-harness/ · Roadmap: R001, R004

## Objective
Find correctness bugs in the tooling written this session before it is committed.

## Scope (review these files)
- `scripts/journal.ts` — check/build/drift/stamp/brief; the contract it enforces is `journal/SPEC.md`. Focus: frontmatter parser, glob→regex, claim/callout parser, symbol hashing via the TS printer, quote matching (escape handling), stamp rewriting lines in place, drift ranking, ledger coverage, feature validation (phase derivation), ownership check, generated-file staleness.
- `scripts/agents.ts` — adapter generator/check (see AGENTS.md top section).
- `.agents/skills/orchestrate/orchestra` — bash 3.2 tmux coordination script (quoting, state dir, spawn --tui readiness wait, notify, wait loop).
- `.agents/hooks/journal-context` — shared session hook.
- `packages/eslint-plugin-house-style/src/rules/require.context.link/` — rule + tests.

## Context (read these, nothing more)
- journal/SPEC.md
- journal/domains/infra/current.md sections "Journal system", "Agent wiring", "Orchestration"

## Rules for this review
- READ-ONLY: do not edit, create, move or delete any file in the repository. Your only output is `report.md` next to this brief (journal/features/codebase-review/tasks/<task-id>/report.md) — the one file you may create.
- You may run read-only commands: `git diff`, `git status`, `pnpm journal check`, `pnpm journal drift --files`, `pnpm agents check`, tests, grep, reading files. Do not run `pnpm journal build`, `stamp`, `pnpm agents sync` or anything that writes.
- Nothing is committed; the work under review is the uncommitted working tree on master.
- Findings: rank most severe first. Each finding = file:line, what is wrong, a concrete failure scenario (input/state → wrong result), and a suggested fix. Separate CONFIRMED (you reproduced or traced it) from PLAUSIBLE. No style nits unless they hide a bug.
- Report format: `## Summary`, `## Findings` (numbered), `## Verified OK` (what you checked and found fine), `## Open questions`. Then run `bin/orchestra done <task-id>`.
