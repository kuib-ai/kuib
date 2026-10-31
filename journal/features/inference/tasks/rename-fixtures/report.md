# rename-fixtures — report

Status: done

## Summary

Filed all 709 recorded cases under `<messageFormat>/<provider>/<model>/<case>`, using three
sibling protocol enums and the shared inference `fixturePath` unit. Each case now has one
unprefixed request and, where recorded, one response. The capture tool writes and reads the
new layout, audits it, and exposes `rename` and `refile` operations. The capture-traffic task
folder, including its ledger and recorded run data, was untouched. No provider was called.

The implementation and full workspace gate are complete. The orchestrator corrected the
feature-plan Refs outside this worker's grant before the final gate run.

## Files

- `packages/inference/fixtures/` — moved 709 complete case directories, preserving all
  request and response body bytes; two historic sensitive-data refusals have no response set.
- `packages/protocol/src/{message.format.enum,provider.enum,model.enum}/index.ts` and
  `packages/protocol/src/index.ts` — three sibling enums and root namespace exports.
- `packages/inference/src/fixture.path/` — shared path unit and the enum/tree/loader test.
- `tooling/capture.ts`, `tooling/capture.test.ts` — enum-backed envelopes, single-exchange
  case names, run-folder CLI, audit, rename/refile and loopback coverage.
- `packages/inference/package.json`, `tooling/package.json`, `pnpm-lock.yaml`, `package.json`
  — protocol/inference dependencies and the root capture script's run-folder permission.
- `journal/domains/core/current.md`, `journal/domains/infra/current.md` — updated built truth
  and stamped its code links.
- This task's `migrate.ts` — one historical six-prefix mapping and the repeatable staging,
  rename, refile, replay and body-hash checks. `plan.md`, `log.md` and this report record
  the worker state.

## Plan updates (for the orchestrator)

- P01-I06 → implemented and verified by the full gate.
- P02-I01 → the three identity enums were delivered early under the GO ruling; the offering,
  endpoint and neutral format remain for that item.
- The old-to-new mapping remains only in this task's `migrate.ts`. Capture-traffic's old ledger
  remains a record of its original call names. Across new runs, a case's `response.json`
  prevents a second call even with a different ledger.
- `AGENTS.md` contained no joined fixture paths. Its generated block did not need a change.

## Journal

- Rewritten and stamped: `core/inference-fixtures`, `core/protocol-enums`,
  `core/core-packages`, `core/core-tests-typecheck`, `infra/provider-captures`.
- Re-stamped after source changes: `core/package-barrels`.
- `pnpm journal drift --files`: 123/123 claims fresh. No touched claim remains unverified.

## Verification

- Before the move, recorded SHA-256 hashes keyed by every old body path. After using the
  task's mapping to the final paths, all **709 request bodies and 707 response bodies**
  matched their original hashes: **1,416/1,416**. The original tree and manifests are under
  `/var/tmp/kuib-rename-fixtures` for recovery.
- The migration exercised `rename` on 226 Xiaomi cases and 116 dated-Haiku cases, then
  `refile` on the remaining 367 cases. Every replay source resolved in the final tree.
- `pnpm capture audit`: clean over **4,957** fixture files. The inference test loaded all
  **709** cases through the real fixture loader and checked each tree level, envelope and
  required file set against the enums.
- Capture loopback suite: green. The new rename/refile test checks both bodies remain exact
  and that an existing response blocks a call with another run ledger.
- Guarded Nx typecheck, lint and test with `--parallel=1`: **53 successful tasks** across
  18 projects. Prettier check, circular-import check and agent-adapter check: green.
- Guarded `pnpm run check`: **green** with Nx parallelism 1. Journal check reports 0 errors
  and 0 warnings; Prettier and circular checks pass; all 53 Nx tasks pass (cached on the
  final run). The orchestrator updated the feature-plan Refs, and another concurrent journal
  edit corrected `infra/check-pipeline` to the parallelism-1 script before this final run.

## Names

| Introduced name | Sibling mirrored or review |
| --- | --- |
| `MessageFormatEnum`, `ProviderEnum`, `ModelEnum` and their dot-case units | Sibling root enum units; each follows `MessageRoleEnum`'s type and member style |
| `ANTHROPIC_MESSAGES`, `OPENAI_CHAT`, `ANTHROPIC`, `XIAOMI`, `META`, and the five model members | Uppercase enum members mirror `EventTypeEnum.TOOL_CALL_STARTED` |
| `messageFormat`, `provider`, `model` envelope fields | Each mirrors one enum and one fixture path level |
| `fixture.path`, `fixturePath` | A dot-case single-function unit like `load.fixture`/`loadFixture`; no exact path-builder sibling, owner review |
| `request.json`, `response.json`; `request.body`, `response.body` | Request/response pairs mirror each other |
| `transport.json` | Sits beside `sequence.json` and `fixture.json`; no exact transport sibling, owner review |
| `rename`, `refile` | Capture operation names mirror `prepare` and `audit`; no exact operation sibling, owner review |
| `Identity`, `caseFolders`, `pruneFolders`, `fileCases` | Local filing helpers; no exact sibling, owner review |
| `MODULE_GRANT` | Test constant beside `ROOT`; no exact sibling, owner review |
| `migrate.ts`, `folders`, `names` | Task-local migration and maps; no exact sibling, owner review |

Existing intentional asymmetry: the owner-held key name `KUIB_MIMO_API_KEY` still says MiMo,
while the provider identity is Xiaomi; native wire model slugs retain their provider spellings.
