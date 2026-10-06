---
status: "running"
role: "probe"
gate: "none"
items: []
grant: ["journal/features/agent-harness/tasks/live-codex/**"]
agent: "codex"
command: "codex --yolo"
cwd: "/home/rs10/developer/kuib-ai/kuib"
session: "kuib-ai/kuib/root"
started: "2026-10-06T21:27:20"
finished: ""
reported: ""
---
# live-codex — live round probe (codex)

Feature: journal/features/agent-harness/ · Item: P03-I05 (first live round of the orchestra)

## Objective

Prove the orchestra round trip with a real agent CLI: prompt delivery, a restart from the log,
and a clean finish. You change no code. Your behaviour depends on your log:

- **`log.md` does not exist** (first start): create `log.md` next to this brief with the single
  line `pass 1`, run `pnpm orchestra done live-codex restart`, and stop. Do nothing else.
- **`log.md` ends with `pass 1`** (you were restarted): append the line
  `pass 2 — resumed after restart`, write `report.md` from the template in the worker protocol,
  run `pnpm orchestra done live-codex`, and stop.
- **`log.md` ends with `pass 2 — resumed after restart`** (you were resumed after finishing):
  append the line `pass 3 — resumed after done`, run `pnpm orchestra done live-codex`, and stop.

In `report.md`, the Summary states which agent CLI and model you are, and whether your context
was fresh when you resumed (say what you remembered of the first pass, if anything).

## Acceptance

- `log.md` and `report.md` exist next to this brief with the lines above.
- The task status is `done`.

## Context

- `.agents/skills/orchestrate/WORKER.md` and this brief. Nothing else.

## Scope

- In: this task's folder only. Out: every other file. No git writes, no sub-agents.
