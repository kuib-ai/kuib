# repair-orchestra — report

Status: done

## Summary

`accept` now protects literal workspace test titles and gives each item one task-report ref. A task whose runtime was lost can use `--without-title-guard`; its changed paths are explicitly reported as unknown. `diff` shows added, changed and removed paths since spawn. Spawn puts its prompt before launch options and verifies it reached the foreground process. Handoff clears the orchestrator pane only after it has a valid saved prompt and pastes the standard opening followed by any supplied prompt. Scope attribution keeps the grants of stopped tasks whose active time overlapped the watched task, so a peer finishing does not create a burst of false scope events.

The opening pasted after `/clear` is exactly:

```text
Resume orchestrating <feature>. Read the rendered handoff injected by the session hook; if it is missing, run pnpm journal handoff <feature>. Read the briefs of active tasks named there. Carry on orchestrating from the handoff: run pnpm orchestra status and re-arm pnpm orchestra watch.
```

The actual feature name replaces `<feature>` in both places.

## Files

- `tooling/orchestra.ts` — title snapshots, guarded accept, report refs, diff, validated snapshot hashes, time-bounded scope grants, prompt delivery checks, stored prompt mode on restart, and handoff prompt storage and paste.
- `tooling/orchestra.test.ts` — isolated Git and tmux tests for the new behaviors.
- `tooling/tsconfig.json` — includes the new test in typechecking.
- `packages/testing/src/resolve.test.permissions/index.ts` — lets tooling tests spawn only workspace Deno, git and tmux.
- `packages/testing/src/resolve.test.permissions/index.test.ts` — checks those exact programs.
- `journal/domains/infra/current.md` — corrected and stamped the touched claims.
- `journal/features/agent-harness/tasks/repair-orchestra/plan.md`, `log.md`, `report.md` — approved plan, progress and result.

## Tests

- Added: `tooling/orchestra.test.ts` › "keeps a test title when its file moves and finds literal Deno titles" — scans literal titles across files and skipped calls.
- Added: `tooling/orchestra.test.ts` › "places the prompt before variadic options in a wrapped launch command" — inserts after the agent executable.
- Added: `tooling/orchestra.test.ts` › "keeps a baseline dirty path when it disappears from current dirt" — keeps removed or restored baseline dirt in the diff.
- Added: `tooling/orchestra.test.ts` › "uses one task report reference for every accepted item" — verifies two items each receive only the task report ref.
- Added: `tooling/orchestra.test.ts` › "delivers a prompt before a trailing variadic flag and reports changes since spawn" — exercises an isolated CLI and added/changed/removed output.
- Added: `tooling/orchestra.test.ts` › "fails spawn when the foreground agent has no prompt in its argv" — rejects swallowed prompts.
- Added: `tooling/orchestra.test.ts` › "refuses a missing test title, permits a moved title and records an intentional removal" — exercises accept across two tasks.
- Added: `tooling/orchestra.test.ts` › "fails closed without a title snapshot and records an explicit legacy exception" — tests both a missing title set and the whole runtime missing after a reboot.
- Added: `tooling/orchestra.test.ts` › "attributes scope to either running grant and stays quiet after restart" — tests cross-task grants and an unchanged restart.
- Added on resume: `tooling/orchestra.test.ts` › "keeps a stopped peer's grant for overlapping work but excludes an earlier task" — proves a completed peer's grant remains for overlapping work, a task finished before the watched spawn does not, and restart keeps the original start time.
- Added: `tooling/orchestra.test.ts` › "puts the opening before a whole multiline handoff prompt and preserves its last newline" — checks exact paste bytes.
- Added: `tooling/orchestra.test.ts` › "refuses an empty handoff and leaves the pane unchanged when the saved prompt is missing" — tests both early rejection and guard recovery.
- Changed: `packages/testing/src/resolve.test.permissions/index.test.ts` › "grants spawning for daemon, testing and named tooling subprocesses" — the approved tooling grant makes the old “not tooling” assertion false; it now verifies the exact three named programs. No test was removed or skipped.

## Deviations from the approved plan

- GO added `--without-title-guard`, its dated brief entry, the fixed opening before any supplied handoff prompt, and the two real-agent launch probes. All were implemented.
- GO's reboot case also allows that explicit option when the whole runtime, including the baseline, is gone. In that case accept prints `accepted <task>; files changed since spawn unknown (no baseline)`.
- A resumed brief expanded P04-I03 to include stopped peers whose active time overlapped the watched task. The old `runningAnywhere` filter dropped those grants on `done`, `blocked` and `plan-ready`; the new regression test demonstrates that cause of false scope attribution and the time boundary that excludes older tasks.
- A separate batch hash failure remained a plausible path/hash pairing hazard, but it was not established as the cause of the historical burst. The code validates the batch result and falls back to per-path hashing.

## Plan updates (for the orchestrator)

- P04-I01 → implemented.
- P04-I02 → implemented.
- P04-I03 → implemented under the resumed acceptance: stopped peers retain their grants for overlapping work; an earlier finished task is excluded.
- P04-I04 → implemented.
- P04-I05 → implemented.

## Journal

- Claims rewritten and stamped: `infra/orchestra`, `infra/orchestra-watch`, `infra/handoff`, `infra/workspace-tools`, `infra/test-permissions`.
- Claims possibly affected but not updated: none identified.

## Verification

- `pnpm run check`: green, all 53 Nx targets passed; journal check reported 0 errors and 0 warnings.
- Focused `pnpm test tooling/orchestra.test.ts`: 12 steps passed.
- Private tmux launch probes: the exact Codex launch form from this task's brief displayed and answered `PROBE-CODEX`; Claude with `--mcp-config` displayed and answered `PROBE-CLAUDE`. Their private server was killed immediately afterward.

## Findings (reviews)

- The stopped-peer grant drop explains the false scope attribution. The separate batch hash failure was not tied to a historical occurrence.

## Names

- `diff` / `cmdDiff` — mirrors `watch` / `cmdWatch`.
- `testTitles` — mirrors `changedSince` as a snapshot helper; `test_titles` mirrors runtime `flagged_paths`.
- `prompt_flag` — mirrors runtime `test_titles`; `commandWithPrompt` mirrors `mcpArguments` as a launch-argument helper.
- `promptInForeground` — mirrors `paneAtShell` as a foreground-process check.
- `reportRef` — mirrors `taskFile` as a task path helper.
- `itemReports` — mirrors `taskList` as a task-item helper.
- `handoffOpening` and `handoffMessage` — mirror `workerPrompt` and `resumePrompt` as prompt builders.
- `--file` on handoff — mirrors `--file` on send; `--removed-title` and `--without-title-guard` have no semantic sibling and were reviewed at the plan gate or in GO.
- `testCall` — no direct sibling; it recognizes the test registration forms inside `testTitles`.
- Existing asymmetry left unchanged: `tooling/orchestra.ts` remains a large single-file script under D005/D007; moving it is the owner's separate question.
