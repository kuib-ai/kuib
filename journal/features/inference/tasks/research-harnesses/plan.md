# research-harnesses — plan

Gate is `none`; this records the plan the work followed.

## Changes by path

- `journal/features/inference/research/prior-art-harnesses-2026-10-08.md` — new: the survey.
- `journal/features/inference/tasks/research-harnesses/{plan,log,report}.md` — new.
- Nothing else in the repository. Clones and scratch files live under
  `/tmp/kuib-prior-art/research-harnesses/` and `/tmp/kuib-prior-art/tools/`.

## Order of moves

1. Read the brief and the three context files it lists.
2. Clone the five primary repositories shallowly and record their commits.
3. Source: one read-only sub-agent per primary subject (Codex; Crush with fantasy and
   catwalk; Goose), each asked for axes A to J with a file, a line and a quote per fact.
4. In parallel, by hand: the issue trackers and the maintainers' words (GitHub API and page
   reads), then a sample of the secondary subjects where a primary shape pointed at them.
5. Re-read every line that will be cited, at the recorded commit. What cannot be re-read is
   marked INFERRED or moved to "Unverified leads".
6. Write the per-subject sections, then the worst shapes ranked against the plan, then what
   the plan lacks and the leads.
7. `report.md`, `pnpm run check`, `pnpm orchestra done research-harnesses`.

## How each move is verified

- A source statement: the cited lines printed from the clone with `sed -n` and compared with
  the claim.
- An issue statement: the issue body read in full, not its title or a search summary.
- A count: the command that produced it re-run, or the count attributed to the sub-agent
  and marked INFERRED.
- Severity: by the brief's rule, against decisions, gaps and items of
  `journal/features/inference/plan.md` named in each shape.
- The repository: `pnpm run check` exits 0 and `git status` shows no change outside the
  grant.

## Left undecided by the brief

- Whether sections beyond the five named may be added to the research file: none was added;
  the answers to the brief's four questions sit at the top of "Worst shapes".
- How far to go into secondary subjects: sampled only (Aider, Roo Code, Cline, Zed); Gemini
  CLI not read.
