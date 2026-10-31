---
status: "accepted"
role: "implementer"
gate: "plan"
items: ["P01-I06"]
grant: ["journal/features/inference/tasks/rename-fixtures/**","journal/features/inference/tasks/capture-traffic/**","packages/inference/**","tooling/capture.ts","tooling/capture.test.ts","journal/domains/core/**","journal/domains/infra/**","journal/_index.md","packages/protocol/**","tooling/package.json","pnpm-lock.yaml","AGENTS.md",".agents/**",".claude/**",".cursor/**",".gemini/**","package.json"]
agent: "codex"
command: "choom -n 800 -- codex --dangerously-bypass-approvals-and-sandbox -m gpt-6-sol -c model_reasoning_effort=\"high\" -c service_tier=\"default\""
cwd: "/home/rs10/developer/kuib-ai/kuib"
session: "kuib-ai/kuib/root"
started: "2026-10-14T00:38:20"
finished: "2026-10-14T01:05:21"
reported: "accepted"
---
# rename-fixtures — file the recorded exchanges by format, provider and model

Feature: journal/features/inference/ · Item: P01-I06 · Roadmap: R020

## Objective

The 709 recorded exchanges under `packages/inference/fixtures/` sit in six folders named by
one joined string each, such as `mimo-chat-mimo-v2-6-pro`. The owner wants them filed along
the identities the design is cut on, in the words the enums will have: "whatever we have made
the seams on"; "message_format"; "provider"; "model"; "i think every part of the codebase must
be uniform"; "yeah mimo provider is xiaomi". Move them, and make the capture tool write, read
and audit the new layout. No provider is called and no recorded byte changes.

## Acceptance

- P01-I06 of `journal/features/inference/plan.md`, as written there.
- `pnpm run check` is green.
- The report ends with the names introduced and the sibling each mirrors.

## The layout

`packages/inference/fixtures/<format>/<provider>/<model>/<case>/`, each level the string value
of its enum member:

| Today | Becomes |
| --- | --- |
| `anthropic-messages-claude-sonnet-5-5` | `anthropic-messages/anthropic/claude-sonnet-5-5` |
| `anthropic-messages-claude-haiku-5-5` | `anthropic-messages/anthropic/claude-haiku-5-5` |
| `anthropic-messages-claude-haiku-4-5-20251001` | `anthropic-messages/anthropic/claude-haiku-4-5` |
| `mimo-messages-mimo-v2-6-pro` | `anthropic-messages/xiaomi/mimo-v2-6-pro` |
| `mimo-chat-mimo-v2-6-pro` | `openai-chat/xiaomi/mimo-v2-6-pro` |
| `meta-chat-muse-spark-1-1` | `openai-chat/meta/muse-spark-1-1` |

- The model folder is kuib's identity of the model. The native slug sent on the wire, such as
  `claude-haiku-4-5-20251001` or `mimo-v2.6-pro`, stays where it is, in the request body.
- Case names stay as they are. A later round renames them by piece and variant. The one
  exception: `thinking-sampling-top_p` becomes `thinking-sampling-top-p`, wherever it occurs.
- Inside a case there is one exchange, so the `001.` prefix goes, and request and response
  are named alike: `request.json` and `request.body`, `response.json` and `response.body`,
  `transport.json` for what `001.chunks.json` holds, `sequence.json` and `fixture.json` as now.
  If you find a case with more than one step, stop and say so in the plan.
- The envelope's single `offering` string becomes three fields: `format`, `provider`, `model`.
  The tool's provider `mimo` becomes `xiaomi` everywhere it is an identity. The name of the key
  variable, `KUIB_MIMO_API_KEY`, is the owner's and does not change.
- The formats, providers and models are three enums in `packages/protocol`, defined once and
  nowhere else (`ANTHROPIC_MESSAGES` = `"anthropic-messages"`, `XIAOMI` = `"xiaomi"`,
  `CLAUDE_HAIKU_4_5` = `"claude-haiku-4-5"`, and so on), named and written like the enums
  `protocol` already has. The tool imports them. It keeps no list of these words of its own.

## Staying true

The owner's worry, in his words: "if we change the schema or anything this will get old/stale";
"incorrect". So the filing must not be able to drift from the enums without the gate saying so,
and putting it right must be one command:

- A test in `packages/inference` walks the fixture tree and fails when a folder at the first,
  second or third level is not a value of the format, provider or model enum, when an
  envelope's `format`, `provider` or `model` differs from the path it sits at, or when a case
  lacks one of its files. Renaming an enum value without refiling then fails `pnpm run check`.
- The tool gets one operation that files every case at the path its envelope and the enums
  give, and one that renames a value across envelopes and folders. This move is done with
  them, so they are proven on the real tree. Bodies are never rewritten by either.
- The recorded bodies are the provider's own bytes and do not depend on kuib's words; say in
  the claim that only the filing does, and that a fixture carries its capture time and its
  request, so it can be recorded again when a provider changes.

## Plan gate

Change nothing before GO. Write `plan.md` next to this brief with:

- the full old-to-new mapping of folders and files, and where the mapping is kept afterwards;
- every place that refers to a fixture by path or by the joined name and what happens to each:
  the envelopes, `sequence.json` and its replay sources, the transport metadata, the tool and
  its tests, the two claims, `AGENTS.md`, and the data files in the capture task's folder;
- the ledger: it is append-only history and keeps the names used when each call was made. Say
  how a later call is still recognised as already made, and what single appended record ties
  the old names to the new ones;
- how you prove no body changed: a hash of every request body and response body before the
  move, keyed by the old path, compared after the move through the mapping, with the counts
  (709 requests, 707 responses);
- the order of the work so that the tree is never left half moved, and how it is undone if a
  check fails;
- the names you will introduce, each with the sibling it mirrors, and anything left undecided.

Then `pnpm orchestra done rename-fixtures plan-ready` and stop.

## Context

Read these, nothing more:

- AGENTS.md: the working rules, above all the one on names.
- journal/features/inference/plan.md: P01-I06, D004, D005, D015, D029, and P02-I01.
- journal/features/inference/tasks/capture-traffic/report.md: its Summary, Files and Names
  sections, and the last entries of its log.md for how the tool stands.
- `tooling/capture.ts`, `tooling/capture.test.ts`, and the claims `infra/provider-captures`
  and `core/inference-fixtures`.
- `packages/testing/src/load.fixture` and `fixture.description`: read, do not edit.
- `packages/protocol/src/` for how an enum unit is named and written: read, do not edit.

## Scope

- No request to any provider. `pnpm capture audit` reads the three keys through the tool and
  is allowed; nothing else reads `.env`. Never print a key, a header value or body text.
- No recorded byte changes: request bodies and response bodies are moved, never rewritten.
  The envelopes and metadata are rewritten only where a name or a field changes.
- Nothing under `packages/engine`, `packages/engine-service` or `packages/testing` changes.
  In `packages/protocol` you add the three enums and their place in the barrel, and change
  nothing that exists; the offering, the endpoint and the neutral format are not drafted here.
- The ledger of the capture task is appended to, never edited.
- Scratch under `/var/tmp`. Every multi-process run through
  `/var/tmp/kuib-guard.sh 30 1500 -- <command>` with Nx parallelism 2. Never run `deno` with a
  `jsr:` or `npm:` import from the repository root without `--no-lock`. No `deno.json`.
- No git writes. No sub-agents except for read-only searches.
- Claims you change are rewritten and stamped; no prose comments in code.

## Rulings that bind this task

- D004: provider and model are first-class enums; native slugs are derived from them.
- D015: "i want enums everywhere".
- D029: "yeah mimo provider is xiaomi"; fixtures follow the seams of the design. The order of
  the levels, the two format words and the model words are the orchestrator's proposal and
  may still be corrected by the owner; keep the mapping in one place so a correction is one
  edit and one run.

## Go — 2026-10-14T00:44:56

Approved, with these conditions. Where they differ from your plan, they win.
1. The three enums are siblings and are placed and exported alike. The owner named the seams "message_format", "provider", "model", so they are MessageFormatEnum, ProviderEnum and ModelEnum, and the envelope fields are messageFormat, provider and model. Do not put one under message/, one under provider/ and one at the top level: MessageFormatEnum is the wire format an endpoint speaks, not a property of the Message shape. Use three units of the same kind in the same place, exported the same way; if the house structure does not allow an enum unit at the top level of packages/protocol/src, put the three together in one new folder for identities and say so in the report.
2. One place builds the path. Add a unit in packages/inference that returns the folder of a case from a message format, a provider, a model and a case name, with its test beside it; the tree test lives with it. The capture tool imports that unit and derives no path of its own. Later translation tests will load fixtures through it.
3. No ledger mapping. Do not add a fixture-layout record and do not teach the tool to translate old names: that is a second copy of the words and breaks on the next rename. The folder of the task capture-traffic is the record of that run in the names of that time: leave every file in it untouched, the ledger included. Keep the old-to-new mapping in your own task folder. The tool no longer has a task folder built in: it takes the folder of the run, where its ledger lives, as an argument, and the root script grants journal/features/inference/tasks for that. A call already made is recognised across runs by the fixture itself, whose response file exists.
4. A case is one exchange. Drop step from the envelope, from sequence.json and from the tool, with the 001 prefix; if something still needs it, say what in the report.
5. rename and refile also work when the enum value changed first: rename takes the old string as plain text, because it is no longer a member.
6. Everything else as you planned: the hash manifest before anything moves, the staged tree, the swap, the recovery, the two claims, the guard. No provider call. When done, report the counts, the hash comparison, the audit, the loader run over all 709 cases and the gate.

## Resume — 2026-10-14T01:04:24

The stale Refs are gone: the orchestrator cut P01-I01 to P01-I05 back to a few paths that exist, and pnpm journal check passes. Run the full gate now, with Nx parallelism 1 through the guard (the root scripts say --parallel=1 since a moment ago; reread package.json before any edit). Two other agents are at their plan gates in this tree and change nothing, so the gate is yours. Then update report.md and run pnpm orchestra done rename-fixtures done.
