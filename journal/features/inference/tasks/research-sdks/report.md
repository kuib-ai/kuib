# research-sdks — report

Status: done

## Summary

The research file names fifteen worst shapes in the AI SDK, LiteLLM and LangChain (with
Bedrock Converse, the OpenAI-compatible endpoints of Anthropic and Google, and one Mastra
issue as secondary evidence), each with source at a recorded commit, the harm it caused, and
where this plan stands. Eleven are HIGH (the plan has the shape or leaves it open), four
MEDIUM, none LOW. The heaviest for kuib: the opaque payload's home and origin (G006), the
report D003 promises but no item defines, a reasoning level whose "off" three subjects say
Claude Sonnet 5.5 rejects (D016's voice case), and five endings with no place for the
provider's reason.

Nothing was taken from memory. Three read-only sub-agents searched the clones; every
`path:line` cited was then printed from the clone and read by me, and every "nothing found"
that is stated rests on my own search. Issues were read as title, state, labels and body;
comment threads were not read.

## Files

- `journal/features/inference/research/prior-art-sdks-2026-10-08.md` — new: what was read,
  fifteen worst shapes, per-subject paragraphs on axes A to J, the brief's four questions,
  secondary subjects, five things the plan lacks, unverified leads.
- `journal/features/inference/tasks/research-sdks/plan.md`, `log.md`, `report.md` — new.

No other file in the repository was changed. No git writes.

## Plan updates (for the orchestrator)

- P06-I03 → implemented.
- G006, proposed ruling (W01, W02): the payload is one typed field on any model-authored part
  and one on the closed step, with the offering that minted it beside it; no lookup by name.
  Each "send reasoning back" variant states what it does with a payload from another offering,
  with reasoning that has no payload, and with a turn left empty.
- G007, proposed ruling (W14): a plugin's identity travels as two fields, never one string to
  split. New question for P02-I01: is a dated snapshot a model, an offering or a field.
- G003 (W15): if ruled as recommended, add a check that built-in folders import only the
  public entry.
- New gap (W03), bears on D003: where "reports what it did" lives. Proposed: a typed list of
  renderings in the closed step and the first delta, also returned by the build-without-sending
  path of P03-I03; acceptance added to P02-I02 and P04-I01.
- New gap (W04), bears on D016: the reasoning level has no vocabulary, and three subjects'
  tables say Claude Sonnet 5.5 rejects thinking disabled and thinking budgets. Settle by
  capture before P02; the voice case of D016 depends on it.
- New gap (W05), bears on D013: the five endings stay; P02-I02 should also require the
  provider's stop reason verbatim and a neutral "why the model stopped" with an unrecognised
  member; say which ending a pause and a refusal produce.
- P02-I02 (W06): check the shapes on paper against OpenAI Responses and Gemini
  `generateContent`, not only OpenAI chat; the checklist is in the file. Give G005 and G010 an
  end condition.
- P02-I02 (W08): four disjoint token counts, each optional, no computed total, the provider's
  usage kept verbatim.
- P02-I02 (W09): a closed set of delta kinds with one merge rule each, kuib's own part id on
  every delta, the payload set once and whole, one shared fold tested at every cut point.
- P04-I02 (W10): an unknown frame kind is skipped and counted; a known kind that does not
  parse fails the step; a stream without the terminal frame is cut.
- P03-I02 (W11): split it. The transport reports status and headers; a step of the
  translation reads the provider's error body and mid-stream error frame.
- P04-I01 and P04-I03 (W13): add steps for tool choice and sampling settings; every value in
  every row, Claude's too, cites its fixture.
- P05 (W12): a prefix test over every fixture sequence, with the recorded cache read as proof.
- P01-I02, captures proposed across the shapes: thinking disabled, a thinking budget, a forced
  tool choice and `temperature` on Sonnet 5.5 (rejections kept as fixtures); a system message
  at four positions; a history holding a step cut during thinking; a thinking block minted by
  one Claude model sent to another; an answer ending on the output limit; context overflow, an
  invalid signature, an overloaded error mid-stream. This is about fourteen requests beyond
  those already listed and may exceed the envelope of D017 (20 per provider): the owner's call.
- Lead for the "place cache marks" step: Anthropic's automatic caching (a top-level
  `cache_control`) may need a variant beside markers, implicit and none. Unverified.
- Lead for G009: LiteLLM's data marks `claude-sonnet-5-5` with
  `"supports_assistant_prefill": false`. G009's case ends with a user message, so it is
  adjacent, not the same.
- "What they do that this plan lacks" names five things: the provider's raw stop reason and
  usage beside the neutral ones, parts for tools the provider runs itself, a first delta that
  says what was changed, named failure kinds including context overflow, and raw frames in
  the stream on request.

## Journal

- Claims rewritten and stamped: none. No code changed.
- Claims possibly affected but not updated: none.

## Names

- `prior-art-sdks-2026-10-08.md` — the name the brief gives; mirrors
  `structure-and-names-2026-10-08.md`.
- `W01` to `W15` (ids of worst shapes) — no sibling: the plan uses `D`, `G` and `P`. For the
  orchestrator to align across the four research files before P06-I05.
- No names introduced in code.
- Existing asymmetries noticed and left unchanged: none.

## Verification

- `pnpm run check`: green (exit 0; agent adapters in sync; journal 0 errors, 0 warnings; Nx
  typecheck, lint and format for 16 projects).
- Sources at recorded commits: `vercel/ai@5028fa4` (and `@ca47b75` for `LanguageModelV1`),
  `BerriAI/litellm@8fc31b1`, `langchain-ai/langchain@1f587e3`,
  `langchain-ai/langchainjs@824d07b`. 41 issues and pull requests, seven vendor pages, one
  maintainers' post and two npm registry entries read on 2026-10-08.
- Things the orchestrator should know:
  - At 10:28:35 `/tmp/kuib-prior-art` was replaced, not by me, with a symlink to
    `/var/tmp/kuib-prior-art` and its contents moved. My folder read as missing for about a
    minute. The clones were checked afterwards (same commits, clean trees) and the sub-agents
    re-ran what they had searched in that window.
  - The unauthenticated GitHub API allowance (60 requests an hour per address) is shared by
    all workers on this machine and ran out during the task. Some issues found by search
    could therefore not be opened; they are under Unverified leads, not cited.
  - Limits of what was read: the AI SDK's gateway package, LiteLLM's proxy, cache-injection
    hook and Responses bridge, and the test suites beyond counting fixture files. TanStack AI
    was not read at all.
  - One early shell command of mine ran a bare `python3 -c 'print(1)'`, against the rule that
    Python goes through uv. It did nothing and was not repeated.

## Findings (reviews)

- W01 · HIGH · `vercel/ai@5028fa4:packages/provider/src/shared/v4/shared-v4-provider-metadata.ts:24` · the opaque payload sits in an open record under a name that writer and reader derive separately · signatures lost or misfiled (`vercel/ai#12351`, `#18962`, `#11689`; `BerriAI/litellm#37849`) · rule G006 as one typed field with its origin, read and written only by a translation
- W02 · HIGH · `vercel/ai@5028fa4:packages/anthropic/src/convert-to-anthropic-prompt.ts:807-817` · nothing records which model minted a payload, so on a cut or a change of model it is replayed, dropped or faked · an aborted turn leaves `content: []` and "the conversation is bricked permanently" (`vercel/ai#18452`) · each "send reasoning back" variant states three rules and never emits an empty turn; add two captures
- W03 · HIGH · `vercel/ai@5028fa4:packages/provider/src/shared/v4/shared-v4-warning.ts:12-22` · an intent the provider cannot honour is changed with a free-text warning, a debug log or nothing · `reasoning: 'none'` yields the API default (`vercel/ai#20867`); settings discarded silently (`BerriAI/litellm#34105`) · give D003's report a typed shape in P02-I02, returned before sending too
- W04 · HIGH · `vercel/ai@5028fa4:packages/anthropic/src/anthropic-language-model.ts:3519-3527` · one neutral reasoning word means different things per model and "off" is missing on some · invalid or opposite requests (`vercel/ai#20867`, `BerriAI/litellm#34301`) · capture thinking disabled and a budget on Sonnet 5.5 before fixing the vocabulary; mapping as data per row
- W05 · HIGH · `vercel/ai@5028fa4:packages/anthropic/src/map-anthropic-stop-reason.ts:13-29` · endings collapse into a few words and the provider's reason is lost · a lost tool call reported as `stop` (`vercel/ai#19493`); tools run after a truncated answer (`vercel/ai#19063`) · keep D013's five endings and require the provider's reason and a neutral stop enum beside them
- W06 · HIGH · `vercel/ai@5028fa4:packages/ai/src/model/as-language-model-v3.ts:25-26` · the format is drawn against the simplest schema and broken by each richer feature · four specifications in nineteen months, lossy adapters, three coexisting message generations in LangChain (`langchain-ai/langchainjs#11550`) · check P02-I02 on paper against OpenAI Responses and Gemini as well
- W07 · HIGH · `langchain-ai/langchain@1f587e3:libs/partners/anthropic/langchain_anthropic/chat_models.py:667-679` · the type lets an instruction sit anywhere and each adapter decides where it goes · instructions re-sorted (`vercel/ai#15681`), the cache prefix destroyed (`BerriAI/litellm#42104`) · capture four positions; the block takes position as input, never moves an instruction earlier, reports
- W08 · HIGH · `BerriAI/litellm@8fc31b1:litellm/llms/anthropic/chat/transformation.py:2468-2473` · token counts folded into one provider's arithmetic, missing counts read as zero · double charging (`BerriAI/litellm#9812`), negative uncached input (`vercel/ai#21027`) · four disjoint optional counts, no computed total, raw usage kept
- W09 · HIGH · `langchain-ai/langchain@1f587e3:libs/core/langchain_core/utils/_merge.py:59-64` · deltas carry values whose merge rule the accumulator cannot know · `TypeError` on merge (`langchain-ai/langchain#29116`), corrupted reasoning items (`langchain-ai/langchainjs#11550`) · one rule per delta kind, kuib's own part id, payload whole and once, one shared fold
- W10 · HIGH · `vercel/ai@5028fa4:packages/anthropic/src/anthropic-language-model.ts:1971-1973` · what the stream reader does not recognise disappears · events "discarded without any signal" and a tool call lost (`vercel/ai#19493`) · in P04-I02 count unknown kinds, fail on a known kind that does not parse, never invent an ending
- W11 · HIGH · `BerriAI/litellm@8fc31b1:litellm/litellm_core_utils/exception_mapping_utils.py:539-540` · failures classified by message text, or in a layer that cannot know the provider · context overflow not recognised, fallbacks do not fire (`BerriAI/litellm#43013`) · split P03-I02: transport reports status, a translation step reads the error body
- W12 · MEDIUM · `vercel/ai@5028fa4:packages/anthropic/src/anthropic-language-model.ts:1242` · the rebuilt request is not an extension of the one sent · "hundreds of thousands of tokens per turn" rewritten to the cache (`vercel/ai#21919`) · a prefix test over every fixture sequence in P05
- W13 · MEDIUM · `BerriAI/litellm@8fc31b1:litellm/llms/bedrock/chat/converse_transformation.py:1780-1783` · differences are substring tests on model names; unknown names inherit the newest behaviour · settings discarded for models in the wrong branch (`BerriAI/litellm#34105`) · rows cite fixtures; add steps for tool choice and sampling settings
- W14 · MEDIUM · `BerriAI/litellm@8fc31b1:litellm/litellm_core_utils/get_llm_provider_logic.py:252-254` · a model is one string that code takes apart · 20 keys for one model with disagreeing flags; a guess scheduled to change (`langchain-ai/langchain@1f587e3:libs/langchain_v1/langchain/chat_models/base.py:584-594`) · rule G007 as two fields; define a dated snapshot in P02-I01
- W15 · MEDIUM · `BerriAI/litellm@8fc31b1:litellm/main.py:6084-6086` · built-ins reach the core by a path third parties are not given · the generic path loses Gemini signatures under a custom name (`vercel/ai#18962`) · enforce G003's import rule with a check
