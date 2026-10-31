# research-opencode-pi — report

Status: done

## Summary

Read the model layers of opencode (`anomalyco/opencode@663fbd7`, formerly `sst/opencode`) and
pi (`earendil-works/pi@1cedd32`, formerly `badlogic/pi-mono`) on every axis of the brief, with
26 issues opened and pi's published model catalogue counted. The research file names fifteen
worst shapes: seven HIGH, seven MEDIUM, one LOW. The plan shares or leaves open the seven HIGH
ones; the most severe is that an offering has no place for an address, a region or a billing
plan, which is the history pi already lived through with Xiaomi MiMo.

The brief's five questions are answered in the research file: the two runtimes (shape 13), the
count of decisions by id or name (shape 14 and "Per subject" B, both subjects), pi's
compatibility settings (shape 8 and "Per subject" pi B), a model change with signed reasoning
(shapes 2 and 3), and the keys of the open records (shape 9 and "Per subject" opencode D).

## Files

- `journal/features/inference/research/prior-art-opencode-pi-2026-10-08.md` — new: what was read, fifteen worst shapes, both subjects on axes A to J, five things the plan lacks, unverified leads.
- `journal/features/inference/tasks/research-opencode-pi/plan.md` — new: order of work.
- `journal/features/inference/tasks/research-opencode-pi/log.md` — new: progress and the evidence kept at each step.
- `journal/features/inference/tasks/research-opencode-pi/report.md` — this file.

Outside the repository, read only: clones in `/tmp/kuib-prior-art/research-opencode-pi/{opencode,pi-mono}`,
the npm tarball `@earendil-works/pi-ai@1.1.0` unpacked in `pi-ai-npm/`, and three small
scripts in `/tmp/kuib-prior-art/research-opencode-pi-scripts/`. Nothing was installed, built
or run from the clones.

## Plan updates (for the orchestrator)

- P06-I01 → implemented.
- New gap, before P02-I01: an offering has no address, region, billing plan or account. Proposal: a typed endpoint under a provider, the slug a function of offering and endpoint, and a decision on whether a session stores the endpoint (shape 1; touches D004, D005, G004, G008).
- G006, extend: the opaque payload must record the offering that produced it, and "send reasoning back" needs a stated outcome for a payload from another offering: verbatim, or dropped and reported (shape 2).
- New gap for P04-I01 and P01-I02: no block and no capture for signed thinking whose request prefix changed. D016 makes the prefix change by design; its Consequences cover the cache only (shape 3).
- New gap for P02-I02: D003's "reports what it did" has no shape. Proposal: a list of intent and outcome returned when the request is built and kept on the closed step (shape 4).
- New gap for P02-I02: tool declarations are a top-level field, so a tool added or removed mid-conversation cannot be expressed; the rule for an instruction between a tool call and its result is unstated (shape 5).
- New gap for P02-I02: the provider's raw stop reason has no field, and "stopped to call tools", "paused", "refused" have no place beside D013's five endings (shape 6).
- New gap for P02-I02: usage cannot say "not reported" and a cut step's usage is unspecified (shape 7).
- P02-I01 acceptance, proposed additions: every step is a required choice in every row; variants are named for behaviour, not vendors; the per-format block holds values, never switches (shape 8).
- P02-I02 acceptance, proposed additions: the payload is a union keyed by format with named fields; a payload delta can open a part by itself; redacted reasoning is its own kind of part (shapes 9 and 10).
- P01-I02, proposed captures: signed thinking with a changed system text, with and without the binding control; an instruction between a tool call and its result; a step cut during thinking and one cut during tool input (shapes 3, 5, 11).
- Risks carried by rulings, reported and not reopened: D009 (both subjects stopped replaying unfinished steps, shape 11), D015 (closed sets of a provider's own values, shape 12), D012 and the non-goals (two runtimes during the engine's move, shape 13), D004 with G007 (a compiled model enum and the pressure to sniff ids, shape 14), D005 (pi renamed Azure when one provider gained a second format, shape 1).
- G008, new context: pi moved every direct Xiaomi row from the Anthropic-compatible address to Chat Completions after multi-turn tool calls failed (pi#4505, `CHANGELOG.md:1015`), and marks Anthropic-format Xiaomi rows as taking `signature: ""` on replay (`scripts/generate-models.ts:1243-1245`). The plan's MiMo row says PLAIN; P01-I03 decides.
- Roadmap follow-up: when a feature wires the engine to `inference`, carry shape 13's three conditions.

## Journal

- Claims rewritten and stamped: none. No code changed.
- Claims possibly affected but not updated: none.
- `pnpm journal build` and `stamp` were not run, as the brief requires. If the journal index lists research files, it does not yet list the new one.

## Names

- None introduced in code.
- Words used in proposals that have no sibling, for the owner's review: "endpoint" (an address, region and plan under a provider; pi and opencode both call this a provider), and the outcome words "honoured", "rendered another way", "dropped".
- Existing asymmetries noticed and left unchanged: none beyond G004 and G005.

## Verification

- `pnpm run check`: green (exit 0; agent adapters in sync; journal check 0 errors, 0 warnings; typecheck, lint and format for 16 projects).
- Every cited line was read in the clone at the stated commit; lines taken from sub-agents were reopened before use. Counts state their search; two are a sub-agent's classification and are marked so.
- Not verified, listed under "Unverified leads" in the research file: twelve issues seen only in search results, three inferences about opencode's native package, and whether MiMo's Anthropic address accepts an empty signature.

## Findings (reviews)

References use the prefixes of the research file (`oc:` `anomalyco/opencode@663fbd7:packages/opencode/src/`, `llm:` the same commit under `packages/llm/`, `pi:` `earendil-works/pi@1cedd32:packages/ai/`).

- S01 · HIGH · `pi:src/types.ts:43-86`, `pi:CHANGELOG.md:1077` · the name of who serves a model also carries address, region and plan · a breaking move of `xiaomi` between addresses, one fix repeated on four ids (pi#4678) · add a typed endpoint under a provider before P02-I01.
- S02 · HIGH · `oc:session/message-v2.ts:255,376-383`, `pi:src/api/transform-messages.ts:95-134` · opaque reasoning data kept with no record of what produced it · signatures stripped or rejected on a model change (oc#22813, pi#9048, pi#6167) · stamp the closed step with its offering; verbatim or dropped and reported.
- S03 · HIGH · `oc:provider/transform.ts:703-709`, `oc:session/message-v2.ts:272-289` · signed reasoning treated as content though bound to the bytes above it · permanent 400 loops (oc#16748, oc#39291, oc#51481, pi#10324) · a block for a changed prefix, turns kept verbatim, two captures.
- S04 · HIGH · `llm:src/protocols/anthropic-messages.ts:493-504,534-538`, `pi:src/types.ts:217` · an unsupported intent is dropped with a log line or nothing · cache misses and loops nobody is told about (pi#9335, oc#18108) · give D003's report a shape in P02-I02.
- S05 · HIGH · `pi:src/types.ts:519-544`, `llm:src/protocols/anthropic-messages.ts:356-423` · instructions and tools sit outside the conversation · pi broke every custom provider to move them (`pi:CHANGELOG.md:200`) · decide tool changes and the call-result rule before P02-I02.
- S06 · HIGH · `pi:src/api/anthropic-messages.ts:1635-1637`, `llm:src/protocols/anthropic-messages.ts:558-564` · a closed set of endings with no place for the raw reason · crashes on a new reason (pi#978, pi#1870) · raw reason as text plus an enum with "unknown".
- S07 · HIGH · `pi:src/types.ts:433-454`, `oc:session/processor.ts:452-459` · usage cannot say "not reported" and is lost on an unfinished step · cache writes shown as 0, usage zeroed on abort (oc#37745, pi#6445) · absent counts and usage as a delta.
- S08 · MEDIUM · `pi:src/types.ts:810-988`, `pi:src/api/openai-completions.ts:1589-1690` · compatibility as 52 optional flags with defaults guessed from the address · shipped rows missing a flag (pi#4678, pi#2946), two breaking removals · required choices, behaviour names, values only in the per-format block.
- S09 · MEDIUM · `oc:provider/transform.ts:42-98,362-381,486-499` · provider data in open records keyed by convention · thinking rewritten under the wrong key (oc#23926) · a payload union keyed by format.
- S10 · MEDIUM · `llm:src/protocols/utils/lifecycle.ts:51-57`, `llm:src/schema/events.ts:594-602` · a payload rides only on a part with text and a result exists only after a final event · a signature lost with empty text (oc#39291) · a payload delta that opens a part, a redacted part kind.
- S11 · MEDIUM · `pi:src/api/transform-messages.ts:195-203`, `oc:session/message-v2.ts:258-266` · both stopped replaying unfinished steps · 400s from unsigned or orphaned reasoning (oc#52225) · one fixture per kind of cut per format (risk on D009).
- S12 · MEDIUM · `ocr:patches/@ai-sdk%2Fgroq@3.0.31.patch:47-48` and two more · closed sets of a provider's own values go stale · eight patched packages that silently stop applying · provider values as row data (risk on D015).
- S13 · MEDIUM · `oc:session/llm/native-runtime.ts:55-59,94,100`, `oc:session/processor.ts:421-422` · two runtimes behind one event vocabulary · features on one path only, typed failures thrown away · no adapter and no per-request fallback when the engine moves (risk on D012).
- S14 · MEDIUM · `oc:provider/transform.ts` (271 lines), `pi:scripts/generate-models.ts` · behaviour decided by substrings of ids · a user renamed a model to get reasoning (oc#24097) · settle in G007 how a row is added without a core release.
