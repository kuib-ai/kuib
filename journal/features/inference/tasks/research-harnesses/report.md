# research-harnesses — report

Status: done

## Summary

Surveyed the model layers of Codex, Crush (with fantasy and catwalk) and Goose on axes A to
J, with samples of Aider, Roo Code, Cline and Zed, and set what was found against
`journal/features/inference/plan.md`. The result is
`journal/features/inference/research/prior-art-harnesses-2026-10-08.md`: fourteen worst
shapes (seven HIGH, six MEDIUM, one LOW), a paragraph per axis for each primary subject,
five things the subjects do that the plan lacks, and the leads that could not be verified.

The three findings that bear hardest on the plan:

- The opaque provider payload has no recorded producer, and a session may change model
  (G006 is open). This is what broke all three subjects when a second provider arrived.
- D003 promises that the translation "reports what it did"; no item gives the report a
  shape or a place, so degradations would be silent as written.
- The five steps of the Anthropic translation are already too few for what the plan's own
  sources record (tool choice, effort level sets, extra headers), and nothing stops a block
  from testing the model or provider identity, which is how every subject's table decayed.

## Files

- `journal/features/inference/research/prior-art-harnesses-2026-10-08.md` — new, the survey.
- `journal/features/inference/tasks/research-harnesses/plan.md` — new.
- `journal/features/inference/tasks/research-harnesses/log.md` — new, the working record.
- `journal/features/inference/tasks/research-harnesses/report.md` — new, this file.

## Plan updates (for the orchestrator)

- P06-I02 → implemented.
- New gap (extends G006): every opaque payload, and every provider id kept as data, records
  the offering that produced it; "send reasoning back" takes the producer as input and has
  three reported outcomes (replay, replay as text, withhold). Shape 1.
- New gap: where the report of D003 lives. Proposed: a typed list in `protocol`, returned
  by "build the exact request" and emitted as the first delta. Open question for the owner:
  may the caller mark an intent (tool choice, output limit) as refusable at build time.
  Shape 3.
- New gap: the five endings of D013 against provider stop reasons. Proposed: keep D013's
  endings, add the provider's reason verbatim and a neutral detail separating output limit,
  context limit, refusal and paused. Shape 4.
- New gap: blocks and rows. Proposed: a block never receives the model or provider
  identity (type plus lint rule); a variant may carry parameters; a row is validated at
  registration. Shape 2.
- New gap: who classifies a failure and who retries. Proposed: the transport reports
  transport facts only; a "classify failure" step of the translation maps the body and a
  mid-stream error; the inference layer never retries. Shape 5.
- New gap (touches G004): model facts stated once on the model, the offering holding only
  what the provider changes. Shape 6.
- New gap: the meaning of each usage number (input net of cache; "not reported" distinct
  from zero; the provider's usage kept verbatim). Shape 7.
- New gap: variants (dated snapshot, region, tier, larger context) as identity, offering
  field or per-step intent; record the model the server reports. Shape 11.
- P01-I02 and P01-I03: add a tool round begun on Claude and continued on MiMo, and the
  reverse; add a mid-stream error fixture. Shapes 1 and 5.
- P02-I02: extend the paper check to OpenAI Responses and Gemini for the opaque payload and
  the delta vocabulary. Shape 10.
- P04-I01: list the steps from the fixtures before building; tool choice, output limit,
  extra headers, URL, framing and signing are not in the current picture. Shapes 2 and 12.
- P04-I02: add "for every fixture and every cut point, the fold of the deltas equals the
  closed step", with one fold shared by the path and any reader. Shape 9.
- P05: add prefix stability over a recorded session of several steps, and a stream idle
  timeout to P03-I02. Shape 8 and "what the plan lacks" 4.
- G003: whichever packaging is chosen, enforce it with a lint rule and a test that
  registers the Anthropic translation from outside the package. Shape 13.
- For P06-I05: every CONFIRMED reference in the research file was re-read by this worker at
  the commit named; INFERRED items and the "Unverified leads" section were not.

## Journal

- Claims rewritten and stamped: none (no code changed).
- Claims possibly affected but not updated: none.

## Names

- None introduced in code. The research file uses the plan's words (offering, translation,
  block, step, delta, closed step).
- Proposed in recommendations and not introduced: a "classify failure" step, and variants
  carrying parameters (`EFFORT { levels }`, `BUDGET { min, max }`). Both are for the owner's
  review; "classify failure" mirrors the plan's step names ("ask for reasoning", "place
  cache marks").
- Existing asymmetry noticed and left unchanged: the reference prefixes in the research
  file are named after repositories (`codex:`, `goose:`), while Goose's repository is now
  `aaif-goose/goose`; the commit was cloned through the old name `block/goose`.

## Verification

- `pnpm run check`: green (exit 0; agent adapters in sync, journal 0 errors and 0 warnings,
  48 Nx tasks passed).
- `git status`: no path outside the grant changed by this task.
- Citations: each line cited as CONFIRMED was printed from the clone and compared with the
  claim; each issue cited was read in full. The log lists them.
- Not done: Gemini CLI was not read. Secondary subjects were sampled, not surveyed. Codex's
  WebSocket path was not re-read. No code of any subject was built or run, and no model API
  was called.

## Findings (reviews)

- 1 · HIGH · `codex:core/src/client.rs:1073-1076`, `goose:PT/formats/openai.rs:221-222,354`, `crush:internal/message/content.go:596-612` · opaque provider data is stored without its producer and sent to whoever is asked next · model switch fails with `invalid_encrypted_content` (codex#17541), sessions unresumable (goose#12090) · record the producing offering on every payload and id; three reported outcomes on replay; a Claude-to-MiMo fixture (G006)
- 2 · HIGH · `crush:internal/agent/coordinator.go:555-582,656-662`, `goose:PV/openai.rs:424-448` · facts outgrow the table and code beside it tests identities · "hard-coded model-name checks, provider-specific exception lists" (goose#10821); a new model fails on an unknown name (crush#3741) · blocks never see the identity; variants carry parameters; rows validated at registration; add the missing steps (D006, P03-I01, P04-I01)
- 3 · HIGH · `goose:PT/formats/databricks.rs:324`, `crush:internal/agent/agent.go:1041-1042`, `fantasy:providers/anthropic/anthropic.go:905-908` · an intent that cannot be upheld is dropped or overwritten in silence, and a report is not read · "no tools" never sent, the model kept calling tools (fantasy#177) · define the report of D003 in `protocol`, return it from the build and emit it as the first delta (D003, P02-I02, P03-I03)
- 4 · HIGH · `codex:codex-api/src/common.rs:104-106`, `fantasy:providers/anthropic/anthropic.go:1304-1316`, `goose:PT/conversation/token_usage.rs:17` · provider stop reasons collapse into a few values, or there is no ending · a thinking-only answer ends the turn silently (goose#11975); a failed run recorded as success (goose#11051) · keep the raw reason beside D013's endings and separate output limit, context limit, refusal and paused (D013, P02-I02)
- 5 · HIGH · `goose:PV/http_status.rs:139-149`, `fantasy:providers/openai/error.go:19-23`, `codex:codex-api/src/sse/responses_error.rs:98-101` · failures classified by English text; several layers retry · a cache miss after each failed attempt, 11% of uncached input (codex#35925); a signature retry that repeats forever (`goose:PV/anthropic.rs:227-228`) · transport reports transport facts, a translation step classifies the body, the engine alone retries (P03-I02)
- 6 · HIGH · `catwalk:internal/providers/configs/anthropic.json:169-170` against `opencode-zen.json:213-214`, `aider:aider/resources/model-settings.yml:187-345` · one flat row per model at a provider, nothing shared · wrong levels break every request (catwalk#558); defaults lost on a model switch (crush#1464) · model facts once on the model, the offering holds what differs (D005, P02-I01, G004)
- 7 · HIGH · `fantasy:providers/openai/language_model_hooks.go:245-246` against `fantasy:providers/google/google.go:1510-1516`, `crush:internal/agent/agent.go:2072-2077` · usage numbers mean different things per provider · false "context limit reached" (goose#8642) · define each number once; "not reported" is not zero; keep the provider's usage verbatim (P02-I02)
- 8 · MEDIUM · `goose:G/agents/reply_parts.rs:371-377`, `codex:core/src/context_manager/normalize.rs:64,142-145` · what is sent is not what is stored; repairs run per request · placement "re-decided independently in ~11 request-assembly paths, of which 2 have tests" (goose#11019); 26% of uncached input after prefix changes (codex#35925) · a prefix-stability test in P05; rendering of a step independent of later steps (D009, P05-I01)
- 9 · MEDIUM · `goose:PT/base.rs:332-334`, `fantasy:agent.go:1629-1630`, `crush:internal/agent/agent.go:1165-1169` · the stream cannot rebuild the answer, so several rebuilders disagree · abort during reasoning makes the next request malformed (crush#3788); a call without a result ends the session (crush#1860) · one shared fold; fold of deltas equals the closed step at every cut (P02-I03, P04-I02)
- 10 · MEDIUM · `goose:PT/conversation/message.rs:232-240`, `crush:internal/message/content.go:55-63`, `zed:language_model_core/src/language_model_core.rs:42-69` · the neutral format takes the first provider's shape · encrypted reasoning dropped on replay (fantasy#406); missing thought signature rejected (fantasy#80) · paper check against Responses and Gemini too (D001, P02-I02)
- 11 · MEDIUM · `crush:internal/agent/coordinator.go:1016-1017,1262-1265`, `goose:PT/model.rs:369-382` · variants hide in the name or pose as providers · slugs ending `:free` break (goose#3054); provider renamed to "azure" as a workaround (codex#35739) · decide per variant: identity, offering field or per-step intent (D004, P02-I01)
- 12 · MEDIUM · `fantasy:providers/vercel/language_model_hooks.go:798-803` against `fantasy:providers/openrouter/language_model_hooks.go:751`, `goose:PT/formats/databricks.rs:315` against `goose:PT/formats/anthropic.rs:843-844` · a second host of one schema becomes a drifting near-copy · a fix that "explicitly excludes Databricks" (goose#12090) · name URL, framing and signing as steps now (D005, D014, P04-I01)
- 13 · MEDIUM · `crush:internal/agent/coordinator.go:658-659`, `goose:PV/openai.rs:424-448` · built-ins take a path an added provider cannot · DeepSeek's thinking toggle not expressible (fantasy#217) · enforce G003 with a lint rule and an outside-registration test (D008, G003)

## Notes for the orchestrator

- `/tmp/kuib-prior-art` became a symlink to `/var/tmp/kuib-prior-art` at 10:28, changed by
  something other than this task (the folder is shared with the sibling research tasks).
  The clones are intact at the recorded commits. Left as found.
- A sub-agent's report was flagged by the harness for a system-reminder-shaped tag. It is a
  quote of Crush's source (`crush:internal/agent/agent.go:1609-1614`), where Crush sends a
  fabricated todo reminder as a user message. Treated as data.
- GitHub was read without credentials (60 requests an hour, 10 searches a minute); `gh` is
  not installed. Issue JSON is cached in `/tmp/kuib-prior-art/research-harnesses/_issues/`.
