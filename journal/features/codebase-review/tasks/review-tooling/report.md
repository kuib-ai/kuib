# review-tooling — report

Status: done

## Summary

This was a read-only correctness review of `scripts/journal.ts`, `scripts/agents.ts`, `.agents/hooks/journal-context`, the
`require.context.link` lint rule and, because the bash `orchestra` script was retired mid-review,
its replacement `bin/orchestra`, checked against the same focus list. There are 17 findings.
Nine are CONFIRMED by reproduction (in throwaway repos under `/tmp`, or read-only against the live
tree). The rest are confirmed by tracing the code or are plausible.

The two most severe findings are both in `drift`:
- **(1)** A claim stamped in the same change as its code, which is the workflow AGENTS.md and WORKER.md prescribe,
  reads "stale" as soon as the change is committed. After this migration commits, about 88 of
  106 claims will show as stale.
- **(2)** Files that were never committed, inside new directories, are reported "fresh".

`agents sync` can delete a real directory without warning **(3)**. A macOS `.DS_Store` breaks
`pnpm run check` **(4)**.

Line numbers refer to the working tree as of 21:30.

## Findings

### 1. CONFIRMED (high) — drift: stamping in the same change makes the claim stale on commit
`scripts/journal.ts:1631-1641` (`commandDrift`) with `commandStamp`.
- **What is wrong.** `stamp` sets `verified` to the current HEAD, but it hashes the working tree.
  `drift` then counts `rev-list <verified>..HEAD -- <paths>`. The commit that carries the
  verified code is counted against the claim.
- **Reproduced** in `/tmp/rt/repo`:
  1. Edit `src/a.ts`.
  2. Run `stamp infra/journal-layers`. Drift shows `dirty`, which is correct.
  3. Commit. Drift now shows `stale infra/journal-layers — 1 commits since 135b87e`, although the claim
     was verified against exactly that content.
- **Impact on this repo.** All 106 claims say `verified 9374dfb`. 88 of them cite files that are
  modified in this working tree (current drift lists them as `dirty`). They all become `stale`
  on commit, so `/context-audit` gets flooded and drift stops meaning anything.
- **Fix, with no format change.** Use as baseline the commit that last changed the claim's
  callout header line: `git blame --porcelain -L <headerLine+1>,+1 -- <current.md>`. If that
  commit is not `0000000` and descends from `verified`, count
  `rev-list <blameCommit>..HEAD -- paths`.
- **Alternative fix.** Store content hashes for file and quote anchors too, and derive "stale"
  from hash mismatch.

### 2. CONFIRMED (high) — drift: untracked files inside a new directory are never dirty, so they show "fresh"
`scripts/journal.ts:1607` uses `git status --porcelain`, which collapses a new directory to
`?? dir/`. Anchored paths such as `dir/file` never match the `dirty` set.
- **Reproduced in `/tmp`.** A claim citing the never-committed `newdir/b.ts` is reported `fresh`.
- **Live tree.** The `dirty` list for `infra/orchestra` omits `bin/orchestra` and
  `.agents/skills/orchestrate/{SKILL,WORKER}.md`. The list for `infra/session-hook` omits
  `.agents/hooks/journal-context` and `.gemini/settings.json`.
- **Fix.** Use `git status --porcelain -z --untracked-files=all`. The `-z` also fixes the second
  problem: paths with spaces or unicode are C-quoted today and never match.

### 3. CONFIRMED (medium) — `agents sync` wipes a real directory where a symlink belongs
`scripts/agents.ts:229-235`.
- **What is wrong.** When `.claude/skills` exists as a real directory, `write()` runs `rmSync`
  with `recursive: true, force: true`, then creates the symlink. The only output is
  `wrote .claude/skills`.
- **Reproduced in `/tmp/rt/agx`.** `.claude/skills/legacy-skill/SKILL.md`, which did not exist in
  `.agents/skills`, was silently deleted.
- **Fix.** If the existing path is a non-symlink directory, refuse and report it (or move it to
  `<path>.bak-<ts>`) unless it is empty.

### 4. CONFIRMED (medium) — `agents check` treats every entry in `.agents/skills/` as a skill
`scripts/agents.ts:202-207`.
- **What is wrong.** Finder's `.DS_Store`, a README, or any other file produces
  `.agents/skills/.DS_Store: missing SKILL.md`. That fails `pnpm run check`, and `sync` cannot
  repair it.
- **Reproduced** in `/tmp/rt/agx`.
- **Fix.** Only consider directories, and skip names that start with a dot.

### 5. CONFIRMED (medium) — edges and context entries that are not wikilinks are silently dropped
`scripts/journal.ts:742-744` (`links()`), `:984` and `:1109` (plan `context`).
- **What is wrong.** Values go through `flatMap(wikilinks)`, so any value that is not a wikilink
  disappears with no error. Reproduced with the parser: `depends-on: [R017]` produces
  `edges=[]`.
- **Consequences:**
  - `depends-on`, `converges-with` and `split-from` given as bare IDs create no edge. They also
    get no cycle or reciprocity check, and no error.
  - A plan `context: ["core/fs-io-schemas"]` uses the short-ID form SPEC allows "in prose and TOML". It
    makes `/remember` and `brief` load nothing, silently.
  - `absorbed-into: R017` produces the misleading error "absorbed-into is required exactly when
    state is absorbed".
- **Fix.** Report an error for every list value that is not exactly one `[[…]]`.

### 6. CONFIRMED (medium, latent) — symbol hash is not formatting-invariant for object/array literals
`scripts/journal.ts:305-310`. The comment there, and claim `infra/claim-verification` / D002, say that
formatting-only edits keep the same hash.
- **Reproduced.** The TS printer keeps a literal's `hasTrailingComma` and its multi-line layout:
  - `const o = { a: 1, b: [1, 2] }` prints as `o = { a: 1, b: [1, 2] }`.
  - The same object wrapped by prettier prints as `o = { a: 1, b: [ 1, 2, ], }`.
  - Redundant parentheses and quote style are also preserved.
- **Consequence.** A pure prettier reflow flips the hash, and drift reports `changed`. This hits
  the `z.object({…})` schemas throughout `packages/protocol`. Examples of pure reflows: a
  `printWidth` change, or a longer identifier that forces a wrap.
- **Fix.** Hash the scanner token stream without trivia and without a `,` that directly precedes
  `)`, `]` or `}`. Alternatively, strip `hasTrailingComma` with a transformer before printing.

### 7. CONFIRMED mechanically (medium, latent) — `findNamed` can hash the wrong node
`scripts/journal.ts:276-288`.
- **What is wrong.** It returns the first node in document order whose `.name` matches. Nodes
  that can win instead of the declaration:
  - an `ImportSpecifier`, `PropertyAccessExpression`, `ShorthandPropertyAssignment` or
    `PropertyAssignment`;
  - the first overload signature;
  - a `type X` declared before `const X`.
- **Reproduced.** For an imported name, the hashed text is just `runAgent`. For overloads it is
  `function f(a: string): void;`. In both cases drift never sees body changes.
- **Live anchors.** I scanned all 250: every one currently resolves to a real declaration, so
  nothing is wrong today.
- **Fix.** Accept only declaration kinds, and prefer the overload that has a body. For a
  same-named type/const pair, hash both.

### 8. CONFIRMED (low, latent) — `globToRegExp`: comma after `**/` inside braces is emitted literally
`scripts/journal.ts:256`.
- **What is wrong.** The `)` of the `(?:.*/)?` group that `**/` emits makes the
  `lastIndexOf("(?:") > lastIndexOf(")")` test conclude it is outside the braces.
- **Reproduced.** `{src/**/a.ts,lib/*.ts}` becomes `^(?:src\/(?:.*\/)?a\.ts,lib\/[^/]*\.ts)$`,
  which matches neither `src/a.ts` nor `lib/x.ts`.
- **Current globs** are unaffected. `{a/**,b/**}` works because a `**` with no following slash
  emits no parentheses.
- **Fix.** Track brace depth with a counter.

### 9. CONFIRMED (low) — the session hook errors out when `node_modules` is missing
`.agents/hooks/journal-context:27-32`.
- **What is wrong.** In a fresh worktree or clone before `pnpm install`, `exec
  ./node_modules/.bin/deno` fails with "No such file or directory" and exit 1. That means a
  hook error on every session start and no context.
- **Reproduced** in `/tmp/rt/wt`.
- **Fix.** `[ -x "$deno" ] || { <emit a "run pnpm install" note in the tool's JSON>; exit 0; }`.

### 10. CONFIRMED by trace (medium) — `bin/orchestra spawn --cwd <other checkout>` strands the worker
`bin/orchestra:76-84`, `:232-236`, `:298`.
- **What is wrong.** `ROOT` is `git rev-parse --show-toplevel` of the *calling* process. The
  orchestrator writes the task record under its own checkout, and the prompt uses paths
  relative to that checkout (`task.rel`). A worker started with `--cwd` in another worktree
  therefore:
  - resolves `journal/features/…/brief.md` against its own tree, where the file does not exist
    because the record is uncommitted;
  - gets `no task … under journal/features/*/tasks/` from `bin/orchestra ask` and `done`.
- **Fix.** Either reject a `cwd` outside `ROOT`, or put absolute paths in the prompt and export
  `ORCHESTRA_ROOT=<ROOT>` into the window (`new-window -e`) for `repo_root()` to honour. The
  `--cwd` help text suggests this case is meant to work (see the open questions).

### 11. CONFIRMED by trace (low-medium) — `orchestra watch <ids>` ignores its filter for the "no running tasks" exit
`bin/orchestra:394`.
- **What is wrong.** `any(task.status in ACTIVE for task in all_tasks())` looks at every task.
  Once the watched task has been reported, `watch <id>` blocks until all *other* tasks finish,
  or until `--timeout`. A mistyped id also blocks forever, because ids are not validated.
- **Fix.** Validate the ids with `find_task`, then do the ACTIVE check over the filtered set.

### 12. CONFIRMED by trace (low) — `orchestra` accepts task ids that `journal check` rejects
`bin/orchestra:87-89`.
- **What is wrong.** The id check accepts `foo-`, `foo--bar`, `-` and unicode lowercase
  (`str.islower`). `journal.ts` requires `^[a-z0-9]+(?:-[a-z0-9]+)*$`. So `orchestra new`
  creates a record that fails `pnpm run check`.
- **Fix.** Use the same regex.

### 13. PLAUSIBLE (medium) — `wait_tui_ready` also settles on dialogs and static splash screens
`bin/orchestra:215-226`. The retired bash script had the same logic.
- **What goes wrong.** In a new cwd (typically a new worktree), Claude Code, Cursor and Gemini
  show a "trust this folder?" dialog. The screen is stable, so the prompt gets typed into the
  dialog and Enter accepts the default. The prompt is lost, `spawn` reports success, and the
  worker sits idle. A static splash that lasts more than 1 s does the same.
- **Fix.** After typing, confirm that the prompt text shows up in `capture-pane` and retry or
  fail if it doesn't. Alternatively, default to `--arg` for CLIs that take a positional prompt.

### 14. PLAUSIBLE (low) — `notify` / `send` type raw newlines
`bin/orchestra:195-212`.
- **What goes wrong.** A multi-line `ask` question or `send` message goes through
  `send-keys -l`, which types the embedded LF. Some TUIs treat that as submit, so the notice
  arrives split or partially submitted.
- **Fix.** Collapse `\n` to spaces in `notify`. The full text is already in `questions.md`.

### 15. PLAUSIBLE (low) — `reconcile` marks other sessions' tasks as `lost`, and races with `spawn`
`bin/orchestra:343-359` and `:302-306`.
- **Other sessions.** `watch` calls `reconcile`, which compares *all* task records in the
  checkout with windows of the *current* session only. Tasks started from another tmux session
  in the same checkout are marked `lost`, and `--respawn` would launch duplicates.
- **Race with `spawn`.** `spawn` writes `status="running"` before the window exists, so a
  concurrent `watch` can mark the task `lost` in that gap.
- **Fix.** Record the session in `task.toml` and reconcile only this session's tasks. Create the
  window before writing `running`.

### 16. CONFIRMED (low) — frontmatter parser rejects or mangles valid YAML
`scripts/journal.ts:95-158`. Reproduced with the parser:
- A block list at column 0 (`origin:` followed by `- "conversation …"` lines) parses as `""`,
  giving a false "origin must not be empty".
- `feature: "stt-engine" # note` keeps the quotes, giving a false "feature … does not exist".
- An apostrophe in an unquoted flow-list item (`[a, the user's idea, b]`) swallows the rest of
  the list.
- A file with CRLF line endings parses as "missing frontmatter".

Each of these produces an error rather than silent acceptance, so the severity is low.

### 17. CONFIRMED by trace (low) — smaller gaps
- **Unexplained coverage gap.** `validateArchive` (`scripts/journal.ts:1281`) counts a file with
  no headings as one unit. If the ledger doesn't map it with `"*"`, coverage drops below 100%
  with no "unmapped" warning explaining why.
- **Tasks skipped when implementation.toml is broken.** `validateTasks` is only called after
  `implementation.toml` parses (`:1100`). A broken TOML hides that feature's task errors and
  its task ids from the cross-feature duplicate check.
- **Header rules disagree.** `journal.ts` only sees `// @context` (one space) within the first
  600 characters (`:647`). The lint rule accepts `@context` in any comment anywhere. So a header
  written as `//@context`, or placed below a long preamble, passes lint while `journal.ts` skips
  its owner check.
- **Machine-dependent generated block (plausible).** `renderAgentsBlock` (`:1455`) lists projects
  with `readdirSync`. A leftover ignored directory, such as `apps/host-web/node_modules` after a
  project is deleted, adds a phantom code-map row. AGENTS.md then differs per machine, and
  `check` reports "stale" on the other machine. None exists today. Fix: derive the list from
  `git ls-files '*/package.json' '*/pyproject.toml'`.
- **Unquoted hook path (plausible).** The Claude hook command is
  `${CLAUDE_PROJECT_DIR}/.agents/hooks/…` without quotes (`scripts/agents.ts:75`), so it breaks
  when the repo path contains spaces.

## Verified OK

- **Checks:**
  - `pnpm journal check`: 0 errors, 0 warnings, ledger coverage 311/311.
  - `pnpm agents check`: adapters in sync.
- **Lint rule** `require.context.link`: `deno test` gives 1 passed (10 steps). Anchor regex
  input is constrained to `[A-Za-z0-9-]+`, so the dynamic `RegExp` is safe. Directory fallback
  order is current, then plan, then decisions.
- **Symbol anchors:** all 250 live anchors resolve to proper declaration nodes (from the scan in
  finding 7).
- **Stamp:**
  - `anchors` and `anchorLines` stay index-aligned.
  - The `verified` header rewrite and the trailing newline are preserved.
  - Claims with broken anchors are skipped.
  - An unknown claim exits 1.
  - Short SHAs fit `CALLOUT_HEADER`.
- **Quote matching:** both the raw and the `\"`/`\\`-unescaped forms are tried. `infra/session-hook`'s
  escaped quotes match the hook file. Whitespace normalisation is symmetric.
- **Callout parser:**
  - Orphan callouts are reported.
  - A marker/header id mismatch is reported.
  - Kinds are validated, and so are rationale `why:` and external `url:`.
  - Duplicate ids are caught.
  - Fenced blocks are skipped.
- **Globs:** all four current domain globs compile correctly. `**/`, `*`, `?` and regex escaping
  are right, and every file has exactly one owner (check passes).
- **Features:**
  - Phase derivation matches the SPEC wording, including the empty-phase case.
  - Checkpoint `next` existence and terminal checks work.
  - `refs` existence and the plan↔impl item bijection work.
  - Task status, brief and report rules match SPEC → Tasks.
- **Generated files:** the stale comparison (trim) and the marker splice work. `.prettierignore`
  covers every generated JSON and markdown file, so `prettier --write` and `agents check` don't
  fight.
- **agents.ts:**
  - Symlink target and regular-file checks work, and retired paths are enforced absent.
  - The per-tool MCP `serverUrl` translation is right.
  - The Claude settings merge keeps non-hook keys, with stable key order.
- **Hook:**
  - It runs in about 1.7 s end to end, well inside the 30 s timeout.
  - The array expansion is bash-3.2-safe.
  - The Cursor early exit comes before any work.
- **bin/orchestra:**
  - TOML string escaping is correct.
  - `notify` skips the calling pane.
  - `send` records an answer only for a pending question.
  - `watch` re-arm via `reported` works as described in `infra/orchestra`.

## Open questions

- **Hook formats (unverifiable offline).**
  - Gemini CLI: does it accept `hookSpecificOutput.additionalContext` on SessionStart, the
    `startup|resume|clear` matcher, and a timeout given in ms?
  - Cursor: is `additional_context` the right sessionStart output key? Do the `preCompact` event
    and its `user_message` exist, and is the per-hook `timeout` field supported?
  - Does Cursor set `CURSOR_PROJECT_DIR` when it runs Claude hooks? The dedup depends on it.
  - This needs the live round (agent-harness G001).
- **SPEC vs validator mismatches** (SPEC says to fix one or the other):
  - Marker names: SPEC says `<!-- journal:generated -->`; the code uses `:start` / `:end`.
  - Header position: SPEC says the file "starts with" the header; the code checks the first 600
    characters, and lint checks anywhere.
  - Checkpoint `next`: SPEC says "live"; the code accepts `implemented` and `verified` items.
  - Not validated: plan decision and gap statuses, and "sequential" claim ids.
- **Should `bin/orchestra spawn --cwd` into another worktree be supported** (finding 10), given
  C031's "a worktree's orchestration is committed on its branch"? Or should each worktree have
  its own orchestrator?
- **Phase state for items that are only planned plus deferred or dropped:** the literal SPEC
  gives `in_progress`, but `planned` seems intended.

## Plan updates (for the orchestrator)

- P01-I01 (codebase-review) → implemented. The review is complete; this file holds the findings.
- Suggested follow-ups: fix findings 1–5 before committing the migration. Finding 1 decides
  whether the first post-commit drift is usable at all.

## Journal

- No claims edited (read-only task).
- Claims whose text is contradicted by the findings:
  - `infra/claim-verification`: "formatting-only edits keep the same hash" (finding 6); "stale (commits since
    `verified`)" misfires after a same-change stamp (finding 1).
  - `infra/orchestra`: `--cwd` worktree behaviour (finding 10).

## Verification

- `pnpm run check` was **not run**: its `format` step runs `prettier --write .`, which writes,
  and the brief forbids that.
- Ran instead: `pnpm journal check` (green), `pnpm agents check` (green),
  `pnpm journal drift --files`, and the lint rule tests (pass).
- Experiments used throwaway repos under `/tmp/rt/` and the repo's deno and typescript,
  read-only.
- One early experiment command copied a scratch file into the repo root and deleted it in the
  same command, because the deno path was wrong. I confirmed nothing was left behind.
- No Python was executed.
- `report.md` is the only file created in the repo.
