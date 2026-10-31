# repair-orchestra — log

## 2026-10-14 · plan gate

- Read the task brief, worker protocol, listed P03/P04 and D005/D007 context, deviations review, relevant infra claims, orchestra launch/snapshot/watch/accept/handoff paths, and the named test spawn-grant implementation.
- Confirmed `respawnWorker` retains `baseline` and `flagged_paths`; no restart reset is apparent. Found a possible independent burst path: `dirtyFiles` ignores `git hash-object --stdin-paths` failure and pairs hashes by position. The precise historical cause remains unproved.
- Wrote `plan.md` with path changes, proposed literal interface, tests, permission grant, and unresolved risks. No implementation file was changed. Next: await GO; then reread the brief and this log before implementing.

## 2026-10-14 · GO and test grant

- Read the GO conditions. Added the explicit legacy-runtime `--without-title-guard` exception to the implementation queue. Handoff must always include a new standard opening before any supplied prompt. Real Codex and Claude launch probes are required in private tmux servers.
- Added the named `@kuib-ai/tooling` test spawn grant for workspace Deno, git and tmux; updated its permission test and tooling TypeScript include. Next: implement the tool in typechecked increments, then add integration tests.
- Added runtime title snapshot field and replaced batch dirty-file hash pairing with individually checked hashes. `pnpm exec tsgo --noEmit -p tooling/tsconfig.json` passed after each orchestra edit. Next: add title extraction, diff and accept behavior.
- Implemented literal test-title snapshots and accept guard (including GO's explicit legacy exception), one report ref per item, `diff`, prompt insertion before options with foreground argv verification, and stored prompt mode for restart. Added the handoff opening plus copied supplied prompt. Typecheck stayed green after each orchestra edit.
- Added isolated Git/tmux tests. The focused suite now passes nine behaviors: title extraction/move, argument ordering, baseline changes, report ref, spawn/diff, missing title/removal, legacy exception, scope/restart, and multi-line handoff paste. Next: cover empty/missing handoff files, run real Codex/Claude probes, format, claims, full gate.
- Focused suite expanded to eleven passing tests. Real Codex and Claude commands were started on a separate tmux socket, each displayed and answered its prompt, and that server was closed. Empty and missing handoff prompts were tested.
- Replaced per-file hashing with a validated batch and individual fallback to keep watch polls fast. Expanded literal title reading to include skipped/parameterized call forms. Reformatted and re-stamped the touched infra claims. `pnpm journal check` passed with 0 errors and 0 warnings; final `pnpm run check` passed all 53 Nx targets. Next: write the report and mark the task done.
- Final review found the GO reboot case: a missing runtime also removes the baseline, so `--without-title-guard` must allow accept with changed paths reported as unknown. Added this path and a test, plus a two-item report-ref mapping test. Re-stamped `infra/orchestra`. Next: rerun the full gate, update the report, then mark done.
- Final `pnpm run check` is green again: journal validation 0 errors/0 warnings, formatting and circular imports green, all 53 Nx targets successful. Report updated. Next: `pnpm orchestra done repair-orchestra done` and stop.

## 2026-10-14 · resume: stopped-task grant attribution

- Read the new `## Resume` and this log. The orchestrator identified a concrete gap: `allowedGlobs` sees only currently running peers, so a peer's completed files become false scope events. The approved P04-I03 acceptance now requires grants of any same-repository task active since the watched task spawned.
- Code review found the fields needed for the interval: `started` and `finished` in the task brief. The current `respawnWorker` overwrites `started`, while `plan-ready`, `restart` and `lost` do not set `finished`; these transitions need accurate boundaries. Next: change the tool in a typechecked increment, add a separate stopped-peer test without altering existing tests, then re-stamp claims and rerun the full gate.
- Changed `allowedGlobs` to use all readable task records in the same repository and include a peer whose `finished` is absent or no earlier than the watched task's `started`. Preserved `started` on respawn; stop/lost transitions now record `finished`, and resumed/go transitions clear it. Typechecked after each tool edit.
- Added a separate stopped-peer regression test without changing any existing orchestra test. The focused suite passed all 12 steps. Updated the report and infra claim; next: format, stamp, full gate and mark done.
- Reformatted, typechecked, and stamped `infra/orchestra` and `infra/orchestra-watch`. Final `pnpm run check` passed: journal 0 errors/0 warnings and all 53 Nx targets green. The report reflects the resumed acceptance. Next: mark task done and stop.
