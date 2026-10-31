# repair-orchestra — plan

## Order and verification

1. Add `tooling/orchestra.test.ts` and the smallest test spawn grant in `packages/testing/src/resolve.test.permissions/index.ts`, with its sibling permission test updated. Extend `tooling/tsconfig.json` to include the new test. Tests use disposable Git repositories and private tmux servers on sandbox socket paths; they never connect to the live session. Grant `@kuib-ai/tooling` only `[Deno.execPath(), "git", "tmux"]` for spawning, mirroring the named `@kuib-ai/inference` grant. The orchestra subprocess itself runs through the workspace Deno and may invoke `git`, `tmux` and `ps`; the parent test does not need to spawn `ps`. Verify the permission assertion and typecheck before changing the tool.
2. Change `tooling/orchestra.ts` one behavior at a time, running `pnpm exec tsgo --noEmit -p tooling/tsconfig.json` after each edit so the live orchestra remains loadable. Run the focused test after each behavior, then `pnpm run check` through `/var/tmp/kuib-guard.sh 30 1500 -- ...`. Deno commands use `--no-lock`; Nx stays at its configured parallelism.
3. Rewrite and stamp the touched `infra/orchestra`, `infra/orchestra-watch`, `infra/handoff`, `infra/workspace-tools` and `infra/test-permissions` claims in `journal/domains/infra/current.md` as applicable. Let `pnpm journal build` regenerate `journal/_index.md`; do not hand edit it. Record the final result in `log.md` and `report.md`.

## P04-I01 — accept and test titles

- At `cmdSpawn`, save a sorted, distinct set of literal test titles from all workspace `*.test.ts`, `*.test.tsx`, `*.live.test.ts`, `*.live.test.tsx`, `*.bench.ts` and `*.bench.tsx` files in the task runtime, alongside the baseline. Find files with `git ls-files --cached --others --exclude-standard -z` so preexisting untracked tests count. Use the TypeScript parser already in `@kuib-ai/tooling` to read string and no-substitution template titles from `it`, `test`, and `Deno.test` calls (including `Deno.test({ name: ... })`). A moved title counts as kept because both snapshots are workspace-wide sets, not file-paired lists. Dynamic titles cannot be compared reliably; the guard covers literal titles and tests will state that limit.
- At `cmdAccept`, take the same title set, compute titles in the spawn set that are now absent everywhere, and reject with each title unless it is named by repeatable `--removed-title`. Refuse a named removal that was not actually missing, so a typo cannot hide a disappearance. Do this before any `journalSet` call or status change. With an old runtime that has no title set, fail and say a fresh spawn snapshot is required; do not silently skip the guard.
- Set each task item to `implemented` with exactly one ref, `journal/features/<feature>/tasks/<task>/report.md=report`, from the task's own journal record. Keep the changed-path printout, but do not put those paths on plan items. A test will create two items and many changed files, verify one report ref on each, verify a moved title passes, and verify a missing title blocks until explicitly named.

## P04-I02 — diff since spawn

- Add `cmdDiff` beside `cmdAccept`, reusing `changedSince` and the spawn snapshot. For each changed path determine whether it existed at spawn and whether it exists now: absent→present is `added`, present→absent is `removed`, present→present is `changed`. A preexisting dirty or untracked file is present at spawn; a committed file is present if the baseline HEAD contains it. Extend `changedSince` to include baseline dirty paths missing from the current dirty set so a restore or removal is not lost. Require a baseline and report its absence clearly.
- Test added, changed and removed paths in a disposable Git repository, including an untracked file that predates spawn, a file committed after spawn, and a removed baseline-dirty file.

## P04-I03 — scope attribution and restart

- `repoEvents` will consider grants of all tasks running in the same repository, so a path covered by another running task produces no scope event for this task. Keep the task's own grant and orchestrator journal exceptions. A test starts two tasks with disjoint grants, changes one task's file and checks that neither receives cross-blame; a truly ungranted path yields one event.
- `respawnWorker` already preserves `baseline` and `flagged_paths`; I found no code path that resets either on restart. The exact historical burst is therefore not established. The batch `git hash-object --stdin-paths` call in `dirtyFiles` ignores its exit status and pairs returned hashes by index. If a path disappears between status and hashing, Git aborts the batch and the remaining existing paths become `not-a-file`, which can create a burst. Replace that fragile batch pairing with per-path hashing or an equally checked result. A test will reproduce the failed-hash case with a controlled disappearing file and show that restart with an unchanged repository emits no new scope events. If the failure cannot be reproduced without inventing a race, the report will say the historical cause remains unknown while the absence of a restart reset is tested.

## P04-I04 — launch prompt

- Build the command by inserting the prompt argument (and `--prompt-interactive` or `--prompt` when needed) directly after the agent executable token and before its options. Find the actual agent executable inside supported wrappers such as `choom ... -- codex`; reject an ambiguous `--cmd` plus `--arg` with an actionable error instead of launching without a provable prompt. The known-agent prompt path remains a private runtime file and is shell quoted. Pasted-prompt agents continue through `deliver`.
- After an argument launch, inspect the foreground process argv and require the full worker prompt there; if it is absent, fail `spawn` with the window name and prompt file so the orchestrator can recover. For pasted launches, the existing visible-paste and submitted-screen check is the receipt check. A fake CLI in a private tmux server will record its argv and prove both a trailing variadic `--mcp-config` and a wrapped `--cmd` receive the prompt before the option; a CLI that swallows it must fail loudly.

## P04-I05 — handoff prompt

- Accept either positional prompt text or `--file PATH`, matching `send`'s message/file choice. At `cmdHandoff`, copy the supplied text into a private file in the session runtime directory before arming `_guard`; the guard receives that file path. If no prompt is supplied, keep the existing default line. Reject an empty supplied prompt before arming. The guard reads the copy before clearing; if it is gone or empty, report the failure through tmux and leave the pane uncleared. After a successful read, remove the one-use file.
- Paste the exact multi-line content with tmux's `load-buffer`/`paste-buffer -p` path in `deliver`, without trimming its trailing newlines for this case, and submit once after `/clear` has completed. A private tmux server test verifies a multi-line prompt including quotes and trailing newline is delivered whole, the default line remains available, and an absent prompt file does not clear the pane.

## Literal interface and names for review

New command, beside `watch`, `status` and `accept`:

```text
  diff <task>                                    list added, changed and removed paths since spawn
```

New option, beside `accept --close` and the parser's repeatable string options:

```text
  accept <task> [--close] [--removed-title TITLE ...]
```

New handoff forms, beside `send <task> <message..> | --file PATH`:

```text
  handoff [prompt..] | --file PATH [--delay 20]
```

New or changed output lines, beside the existing `accepted`, `orchestra: ... scope`, spawn failure and `handoff armed` lines:

```text
added   <path>
changed <path>
removed <path>
orchestra: test titles removed since spawn: <title>; pass --removed-title '<title>' only if intentional
orchestra: no spawn baseline for <task>; respawn with a fresh snapshot before diff or accept
orchestra: prompt did not reach the agent in w:<task>; prompt saved at <path>
handoff armed: pane <pane> will be cleared once this turn ends, then resumes from the supplied prompt
orchestra: handoff prompt unavailable at <path>; pane left unchanged
```

Proposed names: `cmdDiff` mirrors `cmdWatch`/`cmdAccept`; `test_titles` mirrors runtime `flagged_paths`/`matched_lines`; `removed-title` mirrors `--match` as an explicit value option; `promptFile` mirrors existing `savePrompt`; no new top-level folder or package. The new option and output wording are proposed for the owner's review at this gate.

## Undecided and risks

- The exact source of the historical post-restart burst is not proved by the current code. The test will establish whether unchanged repository state is quiet after a restart and whether the batch hash failure can create spurious path changes; the report will distinguish that reproduced failure from the historical cause.
- Static literal test titles give a deterministic guard. Parameterized or computed titles have no stable literal value to compare; retaining them requires review outside this automatic check.
- Process argv inspection may differ across agent CLIs that replace their process after launch. If a live CLI cannot be observed reliably, the implementation will fail with a recovery path rather than report a false delivery success.
