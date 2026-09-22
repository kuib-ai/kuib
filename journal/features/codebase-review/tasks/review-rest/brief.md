---
status: "done"
role: "reviewer"
gate: "none"
items: ["P01-I03"]
grant: ["journal/features/codebase-review/tasks/review-rest/**"]
agent: "claude"
command: "claude --model claude-opus-5 --effort xhigh"
cwd: "/Users/rs10/developer/kuib-ai/kuib"
session: "kuib-ai/kuib/root"
started: "2026-09-22T21:18:38"
finished: "2026-09-22T21:38:04"
reported: "done"
---
# review-rest — host, infra packages and services: bugs + claim truth

Feature: journal/features/codebase-review/ · Item: P01-I03 · Roadmap: R005

Roadmap: R001 (context-system) for the claims part.

## Objective
Review the current state of this part of the codebase: find correctness bugs, security problems, dead or contradictory code, and missing tests. Then verify that the domain claims describing this code are TRUE — the validator only proves their anchors exist, not that the prose is right.

## Scope
- Code: apps/host-tui, packages/cli, packages/config, packages/env, packages/std, packages/telemetry, services/stt-coreml (Swift + Python scripts), services/stt-mlx.
- Journal: journal/domains/host/, journal/domains/product/, and the non-journal-tooling sections of journal/domains/infra/current.md (Workspace, Env, Config, Std, Telemetry, Lint rules, Scripts — skip 'Journal system', 'Agent wiring', 'Orchestration', which another reviewer covers).
- Priorities: config/env precedence and path resolution (incl. Windows branches), socket/permission handling, host serve wiring, STT server protocol handling (framing, buffer limits, concurrency), hard-coded addresses and secrets.

For claims: read each `^C###` paragraph and its cited sources; judge TRUE / PARTLY TRUE / FALSE. Report only non-TRUE claims as findings (quote the wrong sentence, say what the code does); give counts in "Verified OK". Flag important behaviour no claim mentions.

## Context (read these, nothing more)
- journal/domains/host/current.md, journal/domains/product/current.md, journal/domains/infra/current.md (sections listed in Scope)
- journal/SPEC.md → "Domains" (claim format)

## Rules for this review
- READ-ONLY: do not edit, create, move or delete any file in the repository. Your only output is `report.md` next to this brief (journal/features/codebase-review/tasks/<task-id>/report.md) — the one file you may create.
- You may run read-only commands: `git diff`, `git status`, `pnpm journal check`, `pnpm journal drift --files`, `pnpm agents check`, tests, grep, reading files. Do not run `pnpm journal build`, `stamp`, `pnpm agents sync` or anything that writes.
- Nothing is committed; the work under review is the uncommitted working tree on master.
- Findings: rank most severe first. Each finding = file:line, what is wrong, a concrete failure scenario (input/state → wrong result), and a suggested fix. Separate CONFIRMED (you reproduced or traced it) from PLAUSIBLE. No style nits unless they hide a bug.
- Report format: `## Summary`, `## Findings` (numbered), `## Verified OK` (what you checked and found fine), `## Open questions`. Then run `bin/orchestra done <task-id>`.
