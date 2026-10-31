---
status: "accepted"
role: "implementer"
gate: "plan"
items: ["P01-I01","P01-I02","P01-I03","P01-I04","P01-I05","P02-I01","P02-I02","P02-I03","P02-I04","P03-I01","P03-I02","P03-I03","P03-I04"]
grant: ["journal/features/test-system/tasks/test-setup/**","package.json","nx.json","eslint.config.ts","pnpm-workspace.yaml","pnpm-lock.yaml","AGENTS.md",".agents/**",".claude/**",".cursor/**",".gemini/**",".github/**",".githooks/**","scripts/**","tooling/**","packages/testing/**","packages/eslint-plugin-house-style/**","packages/env/**","packages/tools/**","packages/daemon/**","packages/*/package.json","apps/*/package.json","packages/protocol/**","packages/cli/**","journal/domains/infra/**",".prettierignore","journal/domains/core/current.md","journal/_index.md","journal/domains/host/current.md"]
agent: "codex"
command: "choom -n 800 -- codex --dangerously-bypass-approvals-and-sandbox -m gpt-6.1-sol -c model_reasoning_effort=\"high\" -c service_tier=\"fast\""
cwd: "/home/rs10/developer/kuib-ai/kuib"
session: "kuib-ai/kuib/root"
started: "2026-10-12T20:21:08"
finished: "2026-10-12T20:55:52"
reported: "accepted"
---
# test-setup — make testing first class across the workspace

Feature: journal/features/test-system/ · Items: P01-I01 to P03-I04 · Roadmap: R021

## Objective

Give the workspace the test setup described in `journal/features/test-system/plan.md`: tests
in the gate, three kinds of test as named targets in every project, real modules instead of
stand-ins, offline and isolated by construction, a testing package and one fixture
convention, and a lint rule, a coverage report, a hook and CI that keep it true. The owner:
"this will be a multi package monorepo that shall handle a lot of things"; "so the whole shape
of the tests and everything should be awesome"; "whatever the proper standard is we should
implement it that way".

## Acceptance

- Every item P01-I01 to P03-I04 of the plan, as written there.
- `pnpm run check` is green, with tests inside it.
- The report ends with the names introduced and the sibling each mirrors.

## Plan gate

Change nothing before GO. Write `plan.md` next to this brief with:

- for each item, the changes by path and how it is verified;
- the cause of the failing `packages/env` tests, found by reading and by read-only runs;
- where the test permissions are defined once (G001), with the exact flags and what each
  project's tests really need (several open unix or loopback sockets, and some spawn);
- what the tools tests will run against (G002), and whether P02-I03 can be done without the
  engine;
- how the hook is installed without a manual step, and what the workflow runs;
- how the allowlist of P03-I01 is stored and checked;
- how a project with no tests yet has a `test` target that passes;
- every new dependency (through pnpm and the catalog only), and any path you need that the
  grant lacks;
- the names you will introduce, each with the sibling it mirrors;
- anything the plan leaves undecided.

Then `pnpm orchestra done test-setup plan-ready` and stop.

## Context

Read these, nothing more:

- journal/features/test-system/plan.md — all of it.
- AGENTS.md — the working rules.
- journal/domains/infra/current.md — only the claims `^nx-tasks`, `^check-pipeline`,
  `^eslint-config`, `^house-structure-rules`, `^bootstrap-env`.
- journal/domains/infra/decisions.md — only `^D023`.
- journal/roadmap/items/R412-full-gate-verification.md — earlier notes on the gate and on
  reaping spawned processes.

## Scope

- Do not change anything under `packages/engine` or `packages/engine-service`, their
  `package.json` included (D004). List what waits there.
- Do not touch `journal/features/inference` or any other feature.
- No `deno.json`. Never run `deno check`, `deno install` or `deno add`. Python only through
  `uv`.
- No stand-in for a module the codebase implements (D002). Time and randomness are passed in
  as values.
- The existing tests must keep passing, apart from what an item changes on purpose.
- Scratch files go under `/var/tmp`, never `/tmp`, which is memory on this machine.
- No git writes. No sub-agents except for read-only searches.
- Claims you change are rewritten and stamped; new modules start with their `@claim` line; no
  prose comments in code.

## Go — 2026-10-12T19:50:11

Approved, with these conditions. Where they differ from your plan, they win.

1. One test command. The root `test` script takes the path; do not introduce `test:path`. With nothing: every project through Nx, cached. `--affected`: the affected projects. A project folder: that project through Nx, cached. A file or a folder inside a project: run directly with the same sandbox and permissions. Any other flag reaches `deno test` untouched. `pnpm test` is `pnpm run test`, so check that pnpm hands `--filter` and `--watch` through when they follow the script name; if it keeps one for itself, say so in the report and propose another spelling. See the plan's P01-I05 and D005.
2. Fixtures describe themselves. No `fixtures/manifest.json`. A fixture is a folder under `fixtures/` holding its data files and one description file beside them that says what it shows and whether it was recorded or written by hand. The loader refuses a fixture without one. Name the description file and list it under Names. See P02-I02.
3. Where a test lives. A test lives in the package whose behaviour it proves; lower packages are dev dependencies; no separate end-to-end project. Write this in AGENTS.md.
4. U1: keep the root script `test:llm` until the engine is released. Say in the report that this line of P01-I02 stays open.
5. U2: `ensureDaemon` returns the pid of the process it spawned. Rewrite and stamp `core/ensure-daemon`.
6. U4: install the hook path through `prepare` and add the `commit-msg` forwarder to the owner's global hook. Say in the report how any other global hook would be forwarded and how to undo the install.
7. U3, U5, U6, U7, U8: as you planned.
8. Under `test`, deny reading the workspace `.env`, so a unit test cannot read keys although reading is otherwise open. `test:live` may read it.
9. The grant now includes `.prettierignore`, `journal/domains/core/current.md` and `journal/_index.md`.
10. Leave the four `start.daemon` processes from earlier runs alone, and anything under `packages/engine` and `packages/engine-service`.
11. This machine is short of memory. Keep Nx parallelism modest while you verify, and put scratch work under `/var/tmp`.

## Resume — 2026-10-12T20:03:11

Your window died with the whole tmux session at 19:58:30 on 2026-10-12. The kernel ran out of memory and killed the user session. Read this before anything else.

What the kernel recorded at that moment: 62 `deno` processes holding 4.2 GB resident and 1.4 GB in swap (swap here is compressed RAM), against 7 `node` processes. So the deno processes were started by deno or by a shell loop, not by Nx fanning out. It happened 13 seconds after your log entry "move 1 done"; the command you ran next is not in your transcript.

Do this first, in this order:

1. Find the cause by reading, without running any multi-project test: what in `tooling/test.ts`, in `packages/testing`, or in a test file can start deno from deno without a bound (the runner starting tests that start the runner, an unbounded `Promise.all` over projects, a retry loop, a watcher). Write the cause in `log.md`. If you cannot find it by reading, say so in `log.md` and reproduce it only under the guard below with a limit of 12 deno processes.
2. Build the bound into the runner: it sets a variable for its children and refuses to start when it finds itself nested, unless a test opts in for one level; and it never has more than a fixed, small number of test processes running. Test both.
3. From now on every run that starts more than one process goes through the guard: `/var/tmp/kuib-guard.sh 30 1500 -- <command>`. It runs the command in its own process group and kills the whole group when there are more than 30 deno processes or less than 1500 MB available, printing the offenders. A killed run is a finding to explain, never something to retry unchanged. Use Nx with `--parallel=2` while verifying.
4. Before a full `pnpm test` or `pnpm run check`, run one project, then three, and look at `pgrep -c -x deno` and `free -m` each time.

You now run with a raised kill priority (`choom -n 800`), inherited by everything you start, so if memory runs out again the kernel takes your processes first and the session survives.

Then continue from your log at move 2. The `## Go` conditions still hold. The working tree is as you left it after move 1: `pnpm journal check` fails only on the claims you drafted ahead of the code (`^coverage-report`, `^push-hook-ci`, the quoted scripts) and on the two generated indexes.

## Resume — 2026-10-12, a new agent takes over

You are a different agent from the one that wrote `log.md`. Start with the last section of
`log.md`, "HANDOFF: full state for the agent that continues": it is complete and replaces
everything above it. Then `plan.md` for the design and the `## Go` section of this brief,
which wins where the two differ. Follow "Next steps, in order" from step 1, and read "Traps"
before any run that starts more than one process. Keep logging after every move, in the same
detail: your context is smaller than your predecessor's and you may be restarted from the log.
