# move-capture — report

Status: done

## Summary

Moved the provider recorder from its temporary capture package into flat units under `packages/inference/src`. The `inference` bin starts the recorder command, and the root `capture` script calls that bin. The inference product barrel stays empty; an import-graph test guards that boundary. The recorder keeps scoped child permissions, the exact saved fixture bytes, and all existing refusal and ledger behavior. No provider was called.

All 709 request bodies and 707 response bodies match the pre-migration SHA-256 manifest. The direct inference suite runs 138 tests with zero skips, including all three former subprocess probes. The testing resolver grants inference only the workspace Deno executable and still denies another program.

The checked-in symlink exists because Deno requires unscoped read and write permissions to create a symlink, which the offline test sandbox does not grant. The package-local subprocess script remains because a copy launched from a temporary folder loses inference's package dependency context and Deno rejects its `@kuib-ai/std` import.

## Files

- `packages/inference/src/**` — moved recorder units and their `index.test.ts` files; flattened recorder-only test input units, kept the product barrel recorder-free, and added its import-graph test.
- `packages/inference/src/{validate.request,scan.response}/fixtures/**` — retained the written symlink and package-local subprocess probe for the permission and dependency-context reasons above.
- `packages/inference/bin/inference`, `packages/inference/package.json` — one executable with a short interpreter line, plus the bin and std dependency.
- `packages/testing/src/create.loopback.server/**`, `packages/testing/src/index.ts` — moved and exported the general loopback test helper.
- `packages/testing/src/resolve.test.permissions/**` — a named-program spawn grant for inference and an actual allowed/denied subprocess test; removed tooling's unused test spawn grant and kept daemon and testing grants.
- `package.json`, `pnpm-lock.yaml` — root `capture` script calls `inference`; inference is a root workspace dependency; removed the capture importer.
- `tooling/tsconfig.json`, `tooling/capture.ts`, `tooling/capture.test.ts`, `packages/capture/**` — removed the old tool, test and temporary package after moving their behavior and proofs.
- `journal/domains/core/current.md`, `journal/domains/infra/current.md`, `AGENTS.md`, `journal/_index.md` — moved the recorder claim to core, corrected fixture and testing claims, updated ownership and regenerated indexes.

## Plan updates (for the orchestrator)

- P01-I07 → implemented and verified. The orchestrator fixed the stale plan refs; both full gates pass. The two small checked-in test fixtures have the reasons given above.
- The root script retains the name `capture` as the requested entry point, while the package command is `inference`. This is the remaining second name for the command.
- A future narrowing of the remaining unrestricted test spawn grants must account for daemon's shell and user-supplied commands (plus Deno in its lifecycle tests) and testing's Nx and Deno. Tooling has no test spawn grant; its own commands still run through their existing tool permissions.
- The accepted historical run ledger has 452 `provider: "mimo"` entries. Current enum validation also rejected these in the former tool; resuming that old run remains a separate decision under the no-old-name-table ruling.

## Journal

- Rewritten and stamped: `core/core-packages`, `core/inference-fixtures`, `core/provider-captures`, `core/package-barrels`, `infra/test-permissions`, `infra/testing-helpers`, `infra/test-runner`, `infra/package-exports`.
- Removed `infra/provider-captures` and `packages/capture` from infra ownership; all 123 claims are fresh. Attribution coverage has one preexisting uncited `.githooks/commit-msg` outside this task grant.

## Names

| Introduced name | Sibling mirrored |
| --- | --- |
| `inference` bin | `testing` bin of `@kuib-ai/testing`; it is the string form of `@kuib-ai/inference` |
| `createLoopbackServer`, `create.loopback.server` | `createSocketPath`, `create.socket.path` in testing |
| `CaptureRequest`, `CaptureOptions`, `CaptureResult`, `CaptureIdentity` | Each other and the `fixture.description` shape unit |
| `PreparedRequest`, `RecordInput`, `RecordRequest`, `Price` | `CaptureRequest` and their matching shape folders |
| `LedgerEntry`, `LiftedLedgerEntry`, `RepricedLedgerEntry` | Each other and their matching shape folders |
| `SequenceOptions`, `SequenceResult`, `ScanMatch`, `ScanDiagnosis` | `CaptureOptions`, `CaptureResult` and their matching shape folders |
| `observe.response`, `ObservedResponse`, `scan.response` | `read.response.usage` and `scan.sensitive.bytes` |
| `prepare.request`, `record.exchange`, `sequence.requests` | `load.fixture` in testing; API and command use `prepare`, `record`, `sequence` |
| `read.prepared.request`, `validate.request`, `reserve.request` | `prepare.request` |
| `read.ledger`, `append.ledger`, `reprice.ledger`, `check.allowance` | Each other and `acquire.test.slot` in testing |
| `lift.stop`, `find.response.stop`, `find.response.cut` | Each other by verb and object order |
| `read.response.usage`, `cost.response`, `parse.response.frames` | `find.response.stop` |
| `parse.capture.json`, `scan.sensitive.bytes`, `write.capture.file`, `hash.bytes`, `refuse.capture`, `format.capture.error` | `load.fixture` and `prepare.request` verb and object form |
| `load.key`, `audit.fixture`, `file.cases`, `refile.cases`, `rename.identity` | `load.fixture`; `file.cases` and `refile.cases` mirror each other |
| `resolve.capture.root`, `resolve.capture.path`, `resolve.capture.permissions` | `resolve.test.permissions` and `workspace.root` |
| `run.capture.command`, `run.capture.operation` | Each other; command and child share the `run.capture` stem |
| `createCaptureRequest`, `createCaptureOptions`, `createRecordInput`, `createPreparedRequest`, `createFixtureCase`, `listCaptureFiles`, `prepareCaptureTestCase` | `createTempDir` factory naming and `prepare.request` action |

Existing asymmetry left for owner review: the root script remains `capture` while the package command is `inference`. No new unit name lacks a sibling.

The bin file exists because a command needs an interpreter line while a TS module opens with its `@claim` directive. It contains only that line, the claim, one import and one call; permission and error behavior live in tested units.

## Verification

- Guarded `pnpm test packages/inference` and `pnpm test packages/testing`: green.
- Guarded direct `pnpm test packages/inference/src`: 138 passed, zero skipped. All three subprocess proofs execute in the runner.
- Guarded Nx inference and testing typecheck and lint: green. Direct `tsgo` for both projects: green.
- `pnpm capture --help`: prints the inference command help. `pnpm run check:circular`: green.
- Workspace `prettier --check .`: green.
- SHA-256 manifests before and after match byte for byte: 709 `request.body` and 707 `response.body` files.
- `pnpm journal drift`: 123/123 claims fresh.
- Guarded `pnpm run check`: green, 53 of 53 tasks across 18 projects, 23 cache hits. Guarded `NX_SKIP_NX_CACHE=true pnpm run check`: green, all 53 tasks executed without the Nx cache. The temporary symlink and subprocess-script attempts were reverted before these gates.

## Findings (reviews)

- F01 · moderate · `journal/features/inference/tasks/capture-traffic/ledger.jsonl:1` · 452 historic entries use `mimo`, so the old run folder cannot be resumed under the current enum without a separate ruling.
- F02 · low · `.githooks/commit-msg` · journal attribution reports this preexisting file as uncited; it is outside this task grant.

## Old-suite parity

Each row maps one of the 59 test titles in `tooling/capture.test.ts` to the inference proof. The old template titles expand into multiple cases; those parameter sets remain in the new tests.

| # | Old test title | Package test file and title | Note |
| --- | --- | --- | --- |
| 1 | renames a former enum value and refiles a case without changing body bytes | `packages/inference/src/rename.identity/index.test.ts` · renames a former enum value and refiles a case without changing body bytes | — |
| 2 | marks the two named MiMo admission repeats and prevents another start of their rows | `packages/inference/src/check.allowance/index.test.ts` · marks the two named MiMo admission repeats and prevents another start of their rows | — |
| 3 | allows only the named initial Haiku 4.5 signed seed | `packages/inference/src/validate.request/index.test.ts` · allows only the named initial Haiku 4.5 signed seed | — |
| 4 | records approved organization-id ${form} body data, marks the case and requires that mark during audit | `packages/inference/src/scan.response/index.test.ts` · records approved organization-id ${form} body data, marks the case and requires that mark during audit | — |
| 5 | marks an approved id carried only in the request body and still refuses keys and other identity headers | `packages/inference/src/scan.response/index.test.ts` · marks an approved id carried only in the request body and still refuses keys and other identity headers | — |
| 6 | lifts an old authentication scope without rewriting its call or count and keeps billing unreviewable | `packages/inference/src/lift.stop/index.test.ts` · lifts an old authentication scope without rewriting its call or count and keeps billing unreviewable | — |
| 7 | reprices an unbilled 400 reservation append-only and applies it to the next budget allowance | `packages/inference/src/reprice.ledger/index.test.ts` · reprices an unbilled 400 reservation append-only and applies it to the next budget allowance | — |
| 8 | admits the named JSON max repeat and only one matching native source for each outside-thinking repeat | `packages/inference/src/check.allowance/index.test.ts` · admits the named JSON max repeat and only one matching native source for each outside-thinking repeat | — |
| 9 | marks a signed repeat in the fixture and both ledger entries and prevents another start of its row | `packages/inference/src/check.allowance/index.test.ts` · marks a signed repeat in the run ledger and prevents another start of its row | GO removed run metadata from the fixture; the test checks both ledger entries and the absence of the fixture field. |
| 10 | reads a named ceiling rejection in full and refunds it without changing an earlier header-cut reservation | `packages/inference/src/check.allowance/index.test.ts` · reads a named ceiling rejection in full and refunds it without changing an earlier header-cut reservation | — |
| 11 | keeps a header-cut server rejection body and its missing-usage reservation | `packages/inference/src/observe.response/index.test.ts` · keeps a header-cut server rejection body and its missing-usage reservation | — |
| 12 | refuses ${alphabet} secrets at byte alignment ${alignment} in a real response and an audit | `packages/inference/src/scan.response/index.test.ts` · refuses ${alphabet} secrets at byte alignment ${alignment} in a real response and an audit | — |
| 13 | finds a hidden UUID in ${alphabet} at byte alignment ${alignment} without a secret | `packages/inference/src/audit.fixture/index.test.ts` · finds a hidden UUID in ${alphabet} at byte alignment ${alignment} without a secret | — |
| 14 | diagnoses ${form} call-key reflections without retaining the value or surrounding text | `packages/inference/src/scan.response/index.test.ts` · diagnoses ${form} call-key reflections without retaining the value or surrounding text | — |
| 15 | distinguishes another provider key from a named response header value | `packages/inference/src/scan.response/index.test.ts` · distinguishes another provider key from a named response header value | — |
| 16 | identifies ${blob} without persisting its sensitive match | `packages/inference/src/scan.response/index.test.ts` · identifies ${blob} without persisting its sensitive match | — |
| 17 | lifts only a reviewed safety stop by appending history and keeps its count and reservation | `packages/inference/src/lift.stop/index.test.ts` · lifts only a reviewed safety stop by appending history and keeps its count and reservation | — |
| 18 | keeps a diagnostic refusal stopped until its own later review | `packages/inference/src/lift.stop/index.test.ts` · keeps a diagnostic refusal stopped until its own later review | — |
| 19 | prints only the safe diagnosis from a real recorder subprocess | `packages/inference/src/scan.response/index.test.ts` · prints only the safe diagnosis from a real recorder subprocess | Runs in the gate under inference's named Deno spawn grant. |
| 20 | limits a historical authentication stop to its host, path and header without rewriting history | `packages/inference/src/check.allowance/index.test.ts` · limits a historical authentication stop to its host, path and header without rewriting history | — |
| 21 | keeps billing stops provider-wide across different hosts, paths and headers | `packages/inference/src/check.allowance/index.test.ts` · keeps billing stops provider-wide across different hosts, paths and headers | — |
| 22 | prepares inside its scoped fixture grant without reading parent directories | `packages/inference/src/resolve.capture.permissions/index.test.ts` · prepares inside its scoped fixture grant without reading parent directories | Unit test checks exact grants and preparation; a separate manual child probe confirmed outside reads are denied. |
| 23 | allows only the named ${row} header-cut exception and reserves its full output | `packages/inference/src/validate.request/index.test.ts` · allows only the named ${row} header-cut exception and reserves its full output | — |
| 24 | ends a sequence after two ${status} answers without retry or a permanent provider stop | `packages/inference/src/sequence.requests/index.test.ts` · ends a sequence after two ${status} answers without retry or a permanent provider stop | — |
| 25 | ends a sequence after two refused loopback connections while retaining their reservations and counts | `packages/inference/src/sequence.requests/index.test.ts` · ends a sequence after two refused loopback connections while retaining their reservations and counts | — |
| 26 | counts mixed fetch failures and 429 answers as consecutive transient failures | `packages/inference/src/sequence.requests/index.test.ts` · counts mixed fetch failures and 429 answers as consecutive transient failures | — |
| 27 | resets the transient streak on any non-transient answer and starts fresh on a later run | `packages/inference/src/sequence.requests/index.test.ts` · resets the transient streak on any non-transient answer and starts fresh on a later run | — |
| 28 | releases complete 4xx reservations without usage so rejected rows do not consume the dollar budget | `packages/inference/src/check.allowance/index.test.ts` · releases complete 4xx reservations without usage so rejected rows do not consume the dollar budget | — |
| 29 | uses reported usage on a complete 4xx answer rather than treating it as an unbilled rejection | `packages/inference/src/cost.response/index.test.ts` · uses reported usage on a complete 4xx answer rather than treating it as an unbilled rejection | — |
| 30 | keeps full reservations when a 4xx response is cancelled or its body times out | `packages/inference/src/cost.response/index.test.ts` · keeps full reservations when a 4xx response is cancelled or its body times out | — |
| 31 | reserves an unterminated SSE stream instead of treating its initial usage as final | `packages/inference/src/observe.response/index.test.ts` · reserves an unterminated SSE stream instead of treating its initial usage as final | — |
| 32 | records the real HTTP body exactly and removes account headers before writing | `packages/inference/src/scan.response/index.test.ts` · records the real HTTP body exactly and removes account headers before writing | — |
| 33 | preserves arbitrary binary bytes without decoding or newline changes | `packages/inference/src/observe.response/index.test.ts` · preserves arbitrary binary bytes without decoding or newline changes | — |
| 34 | captures a complete nonstream JSON answer and an HTTP rejection in the same layout | `packages/inference/src/record.exchange/index.test.ts` · captures a complete nonstream JSON answer and an HTTP rejection in the same layout | — |
| 35 | keeps final OpenAI usage chunks and reasoning tokens verbatim | `packages/inference/src/cost.response/index.test.ts` · keeps final OpenAI usage chunks and reasoning tokens verbatim | — |
| 36 | costs disjoint Anthropic cached input and output counts | `packages/inference/src/cost.response/index.test.ts` · costs disjoint Anthropic cached input and output counts | — |
| 37 | loads nested format/provider/model/case fixtures with the real loader and replays the same prepared request bytes | `packages/inference/src/record.exchange/index.test.ts` · loads nested format/provider/model/case fixtures with the real loader and replays the same prepared request bytes | Nested loader path and replay are tested in process; the separate subprocess probe covers process isolation. |
| 38 | injects each supported credential header without persisting its value | `packages/inference/src/observe.response/index.test.ts` · injects each supported credential header without persisting its value | — |
| 39 | refuses ${form} sensitive data reflected by a real server before any response file is written | `packages/inference/src/scan.response/index.test.ts` · refuses ${form} sensitive data reflected by a real server before any response file is written | — |
| 40 | rejects sensitive prepared body/description and credential or unknown request headers without creating files | `packages/inference/src/validate.request/index.test.ts` · rejects sensitive prepared body/description and credential or unknown request headers without creating files | — |
| 41 | refuses traversal, symlinks, credential URLs, unapproved hosts and paths | `packages/inference/src/validate.request/index.test.ts` · refuses traversal, symlinks, credential URLs, unapproved hosts and paths | — |
| 42 | refuses an output above the ordinary cap and invalid price values before disk or network | `packages/inference/src/validate.request/index.test.ts` · refuses an output above the ordinary cap before disk and invalid price before network | GO moved price to record input, so only output limits can be checked before preparation writes a fixture. |
| 43 | refuses overwrites and never starts an already-recorded or crash-started request twice | `packages/inference/src/record.exchange/index.test.ts` · refuses overwrites and never starts an already-recorded or crash-started request twice | — |
| 44 | cuts at a thinking delta and retains every byte of the observed reader chunk | `packages/inference/src/observe.response/index.test.ts` · cuts at a thinking delta and retains every byte of the observed reader chunk | — |
| 45 | cuts Meta thinking at the first ${field} delta without changing observed bytes | `packages/inference/src/observe.response/index.test.ts` · cuts Meta thinking at the first ${field} delta without changing observed bytes | — |
| 46 | cuts chat text and preserves split UTF-8 bytes with missing final usage | `packages/inference/src/observe.response/index.test.ts` · cuts chat text and preserves split UTF-8 bytes with missing final usage | — |
| 47 | refuses redirects without following them or persisting an identifying Location header | `packages/inference/src/observe.response/index.test.ts` · refuses redirects without following them or persisting an identifying Location header | — |
| 48 | retains a real HTTP prefix and its full reservation when the body times out | `packages/inference/src/observe.response/index.test.ts` · retains a real HTTP prefix and its full reservation when the body times out | — |
| 49 | records a refused loopback connection with no invented HTTP status and no retry | `packages/inference/src/observe.response/index.test.ts` · records a refused loopback connection with no invented HTTP status and no retry | — |
| 50 | refuses a concurrent invocation before its request reaches the real server | `packages/inference/src/record.exchange/index.test.ts` · refuses a concurrent invocation before its request reaches the real server | — |
| 51 | scans all supplied sequence credentials when another provider key is reflected | `packages/inference/src/sequence.requests/index.test.ts` · scans all supplied sequence credentials when another provider key is reflected | — |
| 52 | runs requests sequentially and reserves missing usage across invocations | `packages/inference/src/sequence.requests/index.test.ts` · runs requests sequentially and reserves missing usage across invocations | — |
| 53 | enforces the five-dollar ceiling even if the caller supplies a larger budget | `packages/inference/src/check.allowance/index.test.ts` · enforces the five-dollar ceiling even if the caller supplies a larger budget | — |
| 54 | stops on ${status} authentication/billing failures and keeps the safe rejection fixture | `packages/inference/src/sequence.requests/index.test.ts` · stops on ${status} authentication/billing failures and keeps the safe rejection fixture | — |
| 55 | keeps an unexpected rejection without retry and continues independent rows | `packages/inference/src/sequence.requests/index.test.ts` · keeps an unexpected rejection without retry and continues independent rows | — |
| 56 | refuses mixed provenance and detects sensitive data and identity headers during an audit | `packages/inference/src/audit.fixture/index.test.ts` · refuses mixed provenance and detects sensitive data and identity headers during an audit | — |
| 57 | loads only the named credential with environment precedence and platform dotenv quoting | `packages/inference/src/load.key/index.test.ts` · loads only the named credential with environment precedence and platform dotenv quoting | — |
| 58 | prints CLI help without reading keys or requesting filesystem/network permissions | `packages/inference/src/run.capture.command/index.test.ts` · prints CLI help without reading keys or requesting filesystem/network permissions | The command unit returns help before spawning; the public bin was also run manually without env or net grants. |
| 59 | accepts preparation on stdin and refuses a synthetic credential without echoing or writing it | `packages/inference/src/run.capture.operation/index.test.ts` · accepts preparation on stdin and refuses a synthetic credential without echoing or writing it | The command unit consumes an injected stdin stream against a temporary fixture root; the production default is Deno.stdin. |

## Test changes in this move

- Every recorder test moved from `packages/capture/src` to the corresponding `packages/inference/src` unit without dropping or loosening an assertion. The 59-title parity table above names its new file.
- `create.loopback.server/index.test.ts` moved into `packages/testing/src` with its helper.
- `resolve.capture.permissions/index.test.ts` now starts `Deno.execPath()` to prove that the scoped child denies an outside read under inference's named spawn grant.
- `run.capture.command/index.test.ts` now invokes the inference bin through Deno for help and runs a separate child without spawn permission to preserve the sanitized-denial proof.
- `scan.response/index.test.ts` now locates its probe beside that unit and runs the real child under the named inference grant.
- The three former `ignore` conditions were removed. No test file or title was deleted in this move, apart from relocation of the whole former package and tooling suite already mapped above. The new barrel import-graph test and testing grant test add proofs.
- Latest cleanup attempt: `validate.request/index.test.ts` briefly constructed the symlink inside `createTempDir`; the runner rejected `symlinkSync` for its scoped permissions. The file was restored to its prior content, so no test remains changed by this attempt.
- `scan.response/index.test.ts` briefly wrote the subprocess probe into `createTempDir`; Deno rejected its workspace dependency when launched from there. That test was restored to its prior content; the package-local probe remains and still runs in the gate.
- `resolve.test.permissions/index.test.ts` was renamed from “grants spawning for daemon execution and tooling and testing subprocess tests” to “grants spawning for daemon execution and testing subprocess tests but not tooling”. The daemon and testing assertions remain; the tooling spawn assertion now proves denial after its unused grant was removed. No other test title or assertion changed in this cleanup.
