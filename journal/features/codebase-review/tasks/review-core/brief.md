# review-core — core packages: bugs + claim truth

Feature: journal/features/codebase-review/ · Item: P01-I02 · Roadmap: R005

Roadmap: R001 (context-system) for the claims part.

## Objective
Review the current state of this part of the codebase: find correctness bugs, security problems, dead or contradictory code, and missing tests. Then verify that the domain claims describing this code are TRUE — the validator only proves their anchors exist, not that the prose is right.

## Scope
- Code: packages/engine, packages/engine-service, packages/protocol, packages/transcript, packages/tools, packages/event-log-sqlite, packages/daemon (source and tests).
- Journal: journal/domains/core/current.md and decisions.md.
- Priorities: agent loop and step-boundary steering, event log writes/reads (sequencing, transactions, polling), engine-service socket lifecycle and turn queue, daemon command execution and path handling (security), transport/endpoint handling.

For claims: read each `^C###` paragraph and its cited sources; judge TRUE / PARTLY TRUE / FALSE. Report only non-TRUE claims as findings (quote the wrong sentence, say what the code does); give counts in "Verified OK". Flag important behaviour no claim mentions.

## Context (read these, nothing more)
- journal/domains/core/current.md (headings first, then claims as you review their code)
- journal/SPEC.md → "Domains" (claim format)

## Rules for this review
- READ-ONLY: do not edit, create, move or delete any file in the repository. Your only output is `report.md` next to this brief (journal/features/codebase-review/tasks/<task-id>/report.md) — the one file you may create.
- You may run read-only commands: `git diff`, `git status`, `pnpm journal check`, `pnpm journal drift --files`, `pnpm agents check`, tests, grep, reading files. Do not run `pnpm journal build`, `stamp`, `pnpm agents sync` or anything that writes.
- Nothing is committed; the work under review is the uncommitted working tree on master.
- Findings: rank most severe first. Each finding = file:line, what is wrong, a concrete failure scenario (input/state → wrong result), and a suggested fix. Separate CONFIRMED (you reproduced or traced it) from PLAUSIBLE. No style nits unless they hide a bug.
- Report format: `## Summary`, `## Findings` (numbered), `## Verified OK` (what you checked and found fine), `## Open questions`. Then run `bin/orchestra done <task-id>`.
