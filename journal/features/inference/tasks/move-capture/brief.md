---
status: "accepted"
role: "implementer"
gate: "plan"
items: ["P01-I07"]
grant: ["journal/features/inference/tasks/move-capture/**","packages/capture/**","packages/inference/**","packages/testing/src/resolve.test.permissions/**","packages/testing/src/create.loopback.server/**","packages/testing/src/index.ts","tooling/capture.ts","tooling/capture.test.ts","tooling/package.json","tooling/tsconfig.json","package.json","pnpm-lock.yaml","eslint.config.ts",".prettierignore","AGENTS.md",".agents/**",".claude/**",".cursor/**",".gemini/**","journal/domains/core/**","journal/domains/infra/**","journal/_index.md"]
agent: "codex"
command: "choom -n 800 -- codex --dangerously-bypass-approvals-and-sandbox -m gpt-6-sol -c model_reasoning_effort=\"high\" -c service_tier=\"default\""
cwd: "/home/rs10/developer/kuib-ai/kuib"
session: "kuib-ai/kuib/root"
started: "2026-10-14T02:32:59"
finished: "2026-10-14T02:51:45"
reported: "accepted"
---
# move-capture — the capture tool becomes a package

Feature: journal/features/inference/ · Item: P01-I07 · Roadmap: R020

## Objective

The capture tool is one file of about 1,800 lines, `tooling/capture.ts`, with a test of about
2,400. The owner: "the tooling is for very bare bones basic scripts; all the other things
should be a proper package that owns everything; not broken into pieces like this". Build it
as a package of its own, `packages/capture`, as units with their tests, exposing one command.
This task is the first half: it works only inside `packages/capture`. A second task then
points the root `capture` script at the command and deletes `tooling/capture*`.

Another agent, task rename-fixtures, is changing `tooling/capture.ts` right now: fixtures are
being filed as `<messageFormat>/<provider>/<model>/<case>`, the three identities become enums
in `packages/protocol`, one unit in `packages/inference` builds a case's folder, the files of
a case lose their `001.` prefix, `step` goes, the tool gains `refile` and `rename` and takes
its run folder as an argument. Its brief, its plan and the `## Go` section of its brief state
the target. Plan against that target; you will be told when it has landed.

## Acceptance

- P01-I07 of `journal/features/inference/plan.md`, except that `tooling/capture*` is not
  deleted and the root script is not changed here.
- The package does everything the tool does after rename-fixtures, with the same refusals,
  the same ledger rules and the same scoped permissions. No key handling is weakened.
- Its tests live beside its units and pass: `pnpm test packages/capture`, and typecheck and
  lint for the project. No provider is called.

## What the owner asks of all code

In his words, 2026-10-14: "i think every part of the codebase must be uniform"; "please keep
all of the code symmetric and uniform"; "otherwise it's confusing as to why things exist";
"everything must have a good reason for being present there"; "the tooling is for very bare
bones basic scripts; all the other things should be a proper package that owns everything;
not broken into pieces like this". So: one idea has one spelling and one home; siblings look
alike in name, placement and form; nothing is a copy of a fact kept elsewhere; nothing is left
over. Before you report, read what you made beside its siblings and be able to say in one
sentence why each file, field and name is there. Say in the report where you could not.

## Plan gate

Change nothing before GO. Write `plan.md` next to this brief with:

- the package: folder, name, namespace, domain, and the sibling each mirrors;
- the units the tool becomes, one line each: folder, export, what it holds, the sibling it
  mirrors, and which of today's functions and constants go into it. Follow the house
  structure of `packages/`. Say where each group of today's loopback tests goes;
- the command: its name, mirroring the one the test runner gets (the orchestrator's starting
  point there is `kuib-test`, so `kuib-capture`), how the package declares it, and where the
  Deno permissions are written exactly once, since the tool must never run with `-A`;
- what the package depends on, and that nothing in `packages/inference` depends on it;
- what the second task must change outside this package, as a list by path: the root script,
  `tooling/`, `AGENTS.md`, the claims, lint and format exclusions;
- the names you introduce, each with its sibling, and anything undecided.

Then `pnpm orchestra done move-capture plan-ready` and stop.

## Context

Read these, nothing more:

- AGENTS.md: the working rules.
- journal/features/inference/plan.md: P01-I06, P01-I07, D029, D030.
- journal/features/inference/tasks/rename-fixtures/brief.md and plan.md, for the target.
- `tooling/capture.ts` and `tooling/capture.test.ts`, knowing they are being edited.
- The claim `infra/provider-captures` in journal/domains/infra/current.md.
- `packages/testing` and one or two other packages for the shape of a unit and a barrel.

## Scope

- Before GO you change nothing. After GO you change files under `packages/capture` and your
  task folder, nothing else; other agents work in this tree. Do not touch `tooling/`, the root
  `package.json`, the lockfile or `packages/inference`, and do not run `pnpm install` in this
  repository before you are told to.
- No request to any provider and no read of `.env`. Never print a key, a header value or body
  text of a fixture.
- Do not run the whole gate while other tasks are in motion; check your own project.
- This machine has 8 GB of memory and `/tmp` is memory. Scratch under `/var/tmp`. Every run that
  starts more than one process goes through `/var/tmp/kuib-guard.sh 30 1500 -- <command>`, with
  Nx parallelism 1. Never run `deno` with a `jsr:` or `npm:` import from the repository root
  without `--no-lock`. No `deno.json`; never `deno check`, `deno install` or `deno add`.
- No git writes. No sub-agents except for read-only searches.
- Claims you change are rewritten and stamped; no prose comments in code.

## Go — 2026-10-14T01:09:54

Approved, with these conditions. Where they differ from your plan, they win. The task rename-fixtures has landed and is accepted: reread tooling/capture.ts and its test as they are now before you move anything.
1. No new command name. The owner: "i do hope we are not making a kuib-test now? instead updating the packages/testing to do everything that is required?". The command is the package own name, capture, by the string form of bin. The test runner does the same with testing.
2. The shebang stays short: Linux reads at most 255 bytes of it and cuts the rest without telling you, so a list of scoped flags there would silently lose permissions. Do what the test runner does: one unit returns the permissions as data (resolve.capture.permissions, the sibling of resolve.test.permissions in packages/testing), and the command starts the real work as a child with exactly those flags. The command itself may only read and spawn that child; it never reads a key and never opens the network. That also settles your open point: the child is granted the run folder it was given, and nothing wider. Test that a child cannot read outside its grant.
3. Units are named like the units of this codebase: verb.object for behaviour, one behaviour each, sized like their siblings; a noun for a shape; x.enum for an enum. Not a mix of nouns (ledger, review, sequence, key, audit, command), bare verbs (prepare, capture) and prefixed buckets (capture.policy, capture.safety, capture.response, capture.type). Shapes get a unit each, as fixture.description has. Constants that are policy live with the one unit that enforces them. Settle the names against siblings and list each with the sibling it mirrors.
4. One verb for one act. Today the API says capture and the command says record for the same thing, and runSequence beside sequence. The package is capture; the act of making one exchange is record, in the unit, the API and the command alike. Remove the second word everywhere.
5. No helpers bucket. A helper used by several tests is a unit with its own test; one used by a single test lives in that test.
6. No table of old names: your ledger unit must not normalize a historic fixture-layout entry. That was dropped from rename-fixtures and no such record exists.
7. A fixture says only what describes the exchange. Today request.json also carries a row id and a price, which belong to a capture run, a bodyFile that is always request.body, and identity fields in two places of the object; and every case has a sequence.json that for most cases says nothing. Make the envelope: messageFormat, provider, model, name, method, url, authHeader, headers, and replay only when the request was built from another fixture. Row and price are run data: the caller gives them when it records, and they are written to the ledger of the run, not into the fixture. Delete sequence.json. Rewrite the 709 cases with the package own operation once it exists, and prove again that no request body and no response body changed. Your grant now includes packages/inference/fixtures and packages/inference/src for this and for the tree test there.
8. Everything else as planned. No provider call, no read of .env, Nx parallelism 1, the guard, no whole gate. tooling/capture* stays untouched until the second task.

## Resume — 2026-10-14T01:35:43

Not accepted yet. The package and the fixture rewrite check out: every body still matches the capture ledger, the envelopes are uniform, the package typechecks, lints and its tests pass. But the proof was dropped on the way. The old suite, tooling/capture.test.ts, has 59 test steps in 2,542 lines; the package has 35, one per unit, in 763 lines. Searching the new tests finds nothing at all for: a key or account value reflected in a response body or header, the three base64 alignments, the redirect refusal, the symlink and traversal refusals, the organization-id allowance and its flag, the encoded-uuid audit rule, already-started, the capture-running lock, cookies and unknown account headers; and almost nothing for the budget, the count limits and the stops. The brief asked that no key handling be weakened and your own plan listed these groups. A port that loses its tests cannot show that.
1. Carry every behaviour the old suite proves into the package, beside the unit that owns it, against the real modules and a real loopback server as before. In report.md add a table: each of the 59 old test titles, and the test file and title that proves it now. None may be missing; if one no longer applies, say why in a sentence.
2. The two files in bin hold logic: error mapping that no test reaches. A bin file only starts a unit; move the mapping into the unit and test it. Say in the report why bin files are needed at all: if the only reason is that a module must open with its @claim line while a command must open with its interpreter line, say so, so the rule can be changed instead.
3. The launcher is granted --allow-run for anything. Grant it only the Deno it starts.
4. src/testing holds units nested one level deeper than every other unit of this codebase. Say in the report what they are for and what the sibling arrangement would be; do not move them yet.
Then run the package tests, typecheck and lint with Nx parallelism 1 through the guard, update the report, and run pnpm orchestra done move-capture done.

## Resume — 2026-10-14T02:15:28

Direction changed by the owner (D031 in the inference plan): "it should belong inside the packages/inference only". The recorder units will move into packages/inference and packages/capture will go. Your restored tests are confirmed by the orchestrator: 98 steps, every old proof mapped, all bodies still matching the ledger. The move itself comes in a second step, after another agent has finished switching the workspace to the testing command, because both touch packages/inference/package.json, the root manifest and the lockfile. Until you are told, work only inside packages/capture/src and prepare what will move.
1. One test file per unit, named index.test.ts, as everywhere else in this workspace. Today fourteen files are named parity, security, repeats, stops, budget, reservations, transport, stream.refusal and subprocess.probe. A test belongs beside the unit that owns the behaviour it proves. Where record.exchange carries forty tests, the unit does too much: split it along what those tests show, for example what is recorded, what is refused, how the stream is read and cut, how cost is reserved, and let each unit carry its own index.test.ts. The word parity says how a test came about, not what it proves: no file and no title keeps it.
2. Two proofs were done by hand. Make each a test: that the child cannot read outside its grant, and what the command prints for help.
3. The subprocess test is ignored when spawning is not granted, so it does not run in the gate. Leave that as it is for now and say so plainly in the report; the spawn grant comes with the move.
4. No test is loosened, removed or turned around. End the report with every test you changed or deleted, and why.
Do not touch any package.json, the lockfile, packages/inference or anything outside packages/capture/src and your task folder. Check with pnpm test packages/capture and the project typecheck and lint, Nx parallelism 1, through the guard. Then run pnpm orchestra done move-capture blocked, with the move into packages/inference under Blocked on.

## Resume — 2026-10-14T02:25:12

The move into packages/inference starts now. The switch to the testing command has landed and its worker has stopped, so the shared manifests are yours; your grant in the brief is widened for exactly what follows. Your tidy is checked: 41 test files, all index.test.ts, 100 steps, every security case still present, and your report says plainly which three tests do not run without a spawn grant.
1. Move every recorder unit from packages/capture/src into packages/inference/src under the same name, with its index.test.ts. Flat, like every other unit: no src/testing folder. The test-input units that only the recorder uses go beside it. create.loopback.server is a general test helper: it goes to packages/testing/src beside create.temp.dir and create.socket.path, exported the way those are, because later tests of the translations will need it too.
2. Nothing the product loads may import a recorder unit: keep them out of the inference barrel, and add a test that fails if the barrel reaches one.
3. The command is the package own name, inference, by the string form of bin, with bin/inference holding only the interpreter line, the claim line, the import and one call. The root capture script calls that command and nothing else; the permissions stay in resolve.capture.permissions and nowhere else. Say in the report if a second name is left anywhere for the same thing.
4. The three subprocess tests must run in the gate, not be skipped. Today a spawn grant lets a project start any program. Make it least privilege for every project that has one: a project with a spawn grant may start the workspace Deno and nothing else. Give @kuib-ai/inference that grant, remove the three ignore conditions, and prove in resolve.test.permissions that a granted project is still refused any other program. Do not touch the existing refusal test for a project without a grant except to keep it passing unchanged. If a project needs more than Deno, stop and say which and why.
5. Delete packages/capture, tooling/capture.ts and tooling/capture.test.ts. Remove the tooling spawn grant if nothing in tooling spawns any more. Fix the unused import and the four formatting failures the other worker saw.
6. Claims: the recorder code is now owned by the core domain. Move the claim that describes it to core and rewrite it to what is true; correct core/inference-fixtures, which still speaks of sequence.json; take capture out of the infra domain code globs; stamp what you rewrote. pnpm journal drift must show every claim fresh.
7. Prove again that no fixture body changed, and run pnpm run check through the guard, once from the cache and once with the cache skipped. Nx parallelism is 1 in nx.json; pass no flag.
8. No test is loosened, removed or turned around. End the report with every test you changed or deleted and why, how many tests run and how many are skipped in the gate, and the names you introduced with the sibling each mirrors. Then pnpm orchestra done move-capture done.

## Resume — 2026-10-14T02:31:18

You were right to stop, and the fault is in my instruction: I wrote the Deno-only rule for every granted project without checking what they start. I have read the code and your facts hold: the daemon runs user commands through a shell, tooling starts git and tmux, testing starts Nx. Step 4 is withdrawn in that form. Do this instead, and leave everything else in the last message as it is.
4. Leave the existing spawn grants of daemon, tooling and testing exactly as they are, and change none of their tests. Add the smallest thing the move needs: a spawn grant can name the programs it allows, and @kuib-ai/inference gets one that names the workspace Deno and nothing else, because that is all its three subprocess tests start. Remove the three ignore conditions so those tests run in the gate. Add to resolve.test.permissions a test that a project with such a named grant may start that program and is refused any other. The existing refusal test for a project without a grant stays as it is.
Whether the older, unrestricted grants should also be narrowed to named programs is a separate question; note in the report what each of the three would need to name, and change nothing there.
Then carry on with the move: steps 1 to 3 and 5 to 8 as given, ending with pnpm orchestra done move-capture done.

## Resume — 2026-10-14T02:45:34

The move is checked by the orchestrator and holds: the stale plan refs are fixed; the full gate is green with the cache skipped (18 projects, 52.7 s) and from the cache (53 of 53), and rewrites no file; inference runs 138 tests with none skipped; every security case is still present; all 709 request bodies and 707 response bodies match the capture ledger; all 123 claims are fresh; no old name is left in code or config. Three things are present without a reason. Fix them, then finish.
1. packages/inference/src/validate.request/fixtures and packages/inference/src/scan.response/fixtures are data folders inside units, one holding a checked-in symlink and one a child script. In this package fixtures means the recorded exchanges under packages/inference/fixtures, filed by message format, provider and model; a second place and a second meaning is confusing, and generic tools walk into the symlink. Have each test make what it needs in its own temporary folder, as the permission test in packages/testing does with its probe script, and delete both folders. If a test cannot do that under its sandbox, say exactly why and change nothing.
2. @kuib-ai/tooling still has a spawn grant for its tests, but tooling has no test file left: the grant gives nothing. My two instructions contradicted each other on this; the earlier one stands. Remove the grant. The test "grants spawning for daemon execution and tooling and testing subprocess tests" then names a project that has none: rename it to what is true and keep every assertion about daemon and testing. This narrows a permission; it must not loosen any refusal.
3. packages/inference/src/index.ts carries its claim line twice.
Rerun pnpm run check through the guard, cached and with the cache skipped, restamp any claim you touch, list in the report every test you changed and why, and run pnpm orchestra done move-capture done.

## Resume — 2026-10-14T02:47:18

You did what the message said, and the ambiguity was mine: the stop condition was meant for the symlink test only, not for the other items. The fact you found settles that one item. Each item below stands alone; if one cannot be done, say why for that item and still do the others.
1. The symlink. Deno will not let a sandboxed test create a symlink, so the checked-in one in validate.request has a reason and stays exactly as it is. Change nothing there. Say in the report, in one sentence, why it exists, so the next reader does not try to remove it.
2. The child script. packages/inference/src/scan.response/fixtures holds a script, not a symlink. Have the test write that script into its temporary folder and run it from there, as the permission test in packages/testing does with its probe, and delete that folder. If the scoped child cannot read or run it from the temporary folder, say exactly why and leave it.
3. The tooling grant. @kuib-ai/tooling has no test file, so its test spawn grant gives nothing: remove it. Rename the test that names tooling to what is true and keep every assertion about daemon and testing. This narrows a permission and must loosen no refusal.
4. The inference barrel carries its claim line twice: keep one.
Then rerun pnpm run check through the guard, from the cache and with the cache skipped, restamp any claim you touch, list in the report every test you changed and why, and run pnpm orchestra done move-capture done.
