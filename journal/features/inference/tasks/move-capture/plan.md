# move-capture — plan

## Package and boundary

Create `packages/capture`, named `@kuib-ai/capture`, with `src/<unit>/index.ts`, sibling `index.test.ts` for each behavioral unit, a root `src/index.ts` barrel, `package.json`, and `tsconfig.json`. It belongs to `infra`, beside `@kuib-ai/testing` and its `src/load.fixture/` unit and barrel. Its first-line links use `// @claim infra/provider-captures`. It is an operational package: `packages/inference` supplies `fixturePath` and never imports `@kuib-ai/capture`.

Keep the public `Capture` default object and its `prepare`, `capture`, `runSequence`, `liftStop`, `reprice`, `loadKey`, `audit`, `refile`, and `rename` members while moving their implementations. The command is the only runnable entry; importing the barrel does not read `.env`, fetch, or execute `main`.

## Units and ownership

Each row names a folder, its export, the responsibility, a house sibling, and the present symbols it receives from `tooling/capture.ts`. Helpers have a focused test beside their module when they contain behavior. Types and the barrel are exempt from the sibling-test rule.

| Folder | Export and contents | Sibling | Present symbols |
| --- | --- | --- | --- |
| `src/capture.type/` | Capture request, prepared request, result, option, price, ledger, scan, sequence and identity types | `packages/testing/src/fixture.description/` | `Provider`, `Price`, `CaptureRequest`, `PreparedRequest`, `CaptureOptions`, `CaptureResult`, `LedgerEntry`, `LiftedLedgerEntry`, `RepricedLedgerEntry`, `ScanMatch`, `ScanDiagnosis`, `SequenceOptions`, `SequenceResult`, `Identity` |
| `src/capture.policy/` | Capture limits, approved origins and headers, request validation and provider validation | `packages/testing/src/resolve.test.permissions/` | `MAX_BYTES`, `LIMITS`, `OUTPUT_LIMITS`, `KEYS`, `ORIGINS`, `AUTH`, `REQUEST_HEADERS`, `RESPONSE_HEADERS`, `IDENTITY_HEADER`, `RATE_HEADER`, `NAME`, `validateProvider`, `validate` |
| `src/capture.safety/` | Refusal error, sensitive value scanning, path containment and safe writes | `packages/testing/src/resolve.test.permissions/` | `ENCODER`, `CaptureError`, `fail`, `object`, `parseJson`, `bytesHash`, `base64Bytes`, `scan`, `sensitiveValues`, `safePath`, `write` |
| `src/prepare/` | Validate and write one prepared case, then read it back for recording | `packages/testing/src/load.fixture/` | `prepare`, `readPrepared` |
| `src/ledger/` | Read and append an immutable run history, normalize the one historic fixture-layout entry in memory, enforce counts, stops and budget | `packages/testing/src/acquire.test.slot/` | `ledger`, `append`, `reserved`, `authenticationScope`, `allowance` |
| `src/capture.response/` | Parse response frames, cut points, usage, cost and stop reasons | `packages/testing/src/fixture.description/` | `frames`, `cutAt`, `usageOf`, `number`, `costOf`, `stopOf` |
| `src/capture/` | Make and record one HTTP exchange under the ledger lock | `packages/testing/src/acquire.test.slot/` | `captureExchange`, `capture` |
| `src/review/` | Append a reviewed lift or zero-cost reprice with the same ledger lock and refusal rules | `src/ledger/` | `liftStop`, `reprice` |
| `src/sequence/` | Run prepared requests in order, retaining stop and transient-failure rules | `src/capture/` | `runSequence` |
| `src/key/` | Resolve one provider credential from the named environment variable or dotenv text | `packages/config/src` key-loading units, with `src/prepare/` as the local folder form | `loadKey`, `keyFromFile` |
| `src/audit/` | Scan the fixture tree and refuse sensitive data or identity headers | `src/capture.safety/` | `audit` |
| `src/file.cases/` | Discover cases, preflight moves, move folders, and update replay references | `packages/testing/src/load.fixture/` | `caseFolders`, `pruneFolders`, `fileCases` |
| `src/refile/` | File cases at the paths named by their enum identities | `src/rename/` | `refile` |
| `src/rename/` | Replace one former identity value and move affected cases | `src/refile/` | `rename` |
| `src/command/` | `kuib-capture` command parsing, run-folder handling, sanitized errors and output | `src/index.ts` as the package entry and the planned `kuib-test` command | `ROOT`, `FIXTURES`, `main`, top-level `import.meta.main` handling |
| `src/index.ts` | `Capture` default object and public type exports only | `packages/testing/src/index.ts` | present `Capture` barrel |

`ROOT` must resolve the workspace from the package location, not rely on the old `tooling/` location. `FIXTURES` remains the inference fixtures directory. Internal units import each other directly; the barrel contains no behavior. Keep the current distinctions between the `capture` API, the CLI's `record` verb, and the private `captureExchange`; flag that existing asymmetry for owner review rather than silently renaming the public API.

## Tests beside units

Move the existing loopback tests without replacing the real modules with stand-ins. Keep their Deno subprocess checks and adapt their module paths and read grants to the package. The group boundaries are:

- `prepare/index.test.ts` and `capture.policy/index.test.ts`: request validation, approved repeat variants, price/output limits, traversal, symlinks, origins, headers, prepared fixture creation, and scoped read/write proof.
- `ledger/index.test.ts`: historical fixture-layout normalization, duplicate rows, immutable started/finished history, count and budget limits, reservations, provider stops, authentication scope, concurrent invocation, and crash-started refusal.
- `review/index.test.ts`: reviewed safety/authentication lifts and append-only rejected-request repricing.
- `capture.response/index.test.ts`: SSE/JSON usage, cached-token cost, thinking/text cuts, incomplete streams, timeout and binary-byte preservation.
- `capture/index.test.ts`: real loopback request/response recording, credential injection without persistence, redirects, fetch failures, sensitive-data diagnosis, status and header handling.
- `sequence/index.test.ts`: ordered calls, multiple-credential scanning, transient-streak stopping and independent rejected rows.
- `key/index.test.ts`: only the named key, environment precedence and dotenv parsing.
- `audit/index.test.ts`: mixed provenance, secret/identity-header detection, and the approved body-only organization-id exception.
- `file.cases/index.test.ts`, `refile/index.test.ts`, and `rename/index.test.ts`: collision/refusal checks, replay-path updates and byte-identical bodies on a disposable tree.
- `command/index.test.ts`: help without key reads or provider calls; stdin preparation and sanitized refusal through the package command.
- `prepare/index.test.ts` also uses the real nested `Testing.loadFixture` case and verifies replay sends the same prepared request bytes.

Shared test setup for the loopback server, synthetic key and request/options factories can live in `src/capture.test.helpers/` with no production export; its helpers are test-only and do not duplicate recorder behavior. Every test server binds only loopback. No test reads the workspace `.env` or calls an external provider.

## Command, permissions and dependencies

`packages/capture/package.json` declares `"bin": { "kuib-capture": "./src/command/index.ts" }`, `"exports": { ".": "./src/index.ts", "./*": "./src/*/index.ts" }`, and the sibling package scripts `typecheck`, `test`, `lint`, `format`. `src/command/index.ts` has a Deno shebang. The follow-up task changes the root `capture` script to invoke `kuib-capture`; the production Deno flags occur once in that executable shebang, not in library code or the root script. They are `--no-check --no-prompt`, scoped read for `packages/capture`, `packages/inference/fixtures`, `packages/inference/src`, `packages/protocol`, `node_modules`, the capture run folder area, `.env`, `package.json` and `pnpm-workspace.yaml`; scoped write for `packages/inference/fixtures` and the capture run folder area; env access only for `KUIB_ANTHROPIC_API_KEY`, `KUIB_MIMO_API_KEY`, `KUIB_META_API_KEY`; and net access only for the four existing provider hosts on port 443. There is no `-A`. Tests that prove a restricted child process retain their explicit test-only grants.

The command currently accepts any run-folder argument. A static shebang grant cannot safely grant an arbitrary path; keep the current bounded run-folder grant (`journal/features/inference/tasks`) for the package command and fail with `permission-denied` outside it. If the approved target requires truly arbitrary run folders, the executable must instead be launched by a root Deno command that builds a scoped grant from the supplied run folder; that interface is undecided and needs the orchestrator's GO condition before implementation.

Runtime dependencies: `@kuib-ai/inference` for `fixturePath`, `@kuib-ai/protocol` for the three identity enums, plus Deno and Node built-ins. Dev dependencies mirror `@kuib-ai/testing` and `@kuib-ai/tools`: `@kuib-ai/testing`, `@kuib-ai/deno-types`, `@kuib-ai/tsconfig`, `@std/expect`, `@std/testing`, `@types/node`. `packages/inference` gains no dependency on `@kuib-ai/capture`.

## Order and verification

1. Wait for the renamed fixture tool and its final tests to land, then reread the resulting capture source and tests. Record any changed symbol, refusal or file name in `log.md` before moving it.
2. Add the package manifest, config, types, safety and policy units. Move code mechanically, preserving wire strings, refusal codes, ledger order, key handling and scoped paths. Add the public barrel and `kuib-capture` entry.
3. Split the existing tests by the behavior they prove, adjust imports, and add the focused module tests above. Run the package test runner through `/var/tmp/kuib-guard.sh 30 1500 -- pnpm test packages/capture` with Nx parallelism 1. Use no provider key or external host.
4. Run package `typecheck`, `lint` and format check with Nx parallelism 1 under the same guard if a command fans out. Check that importing the barrel does not execute the command, inspect the diff for leaked fixture text or key material, and report any validation that cannot run before the root follow-up wires the workspace dependency.
5. Write the report with file ownership, verification, names and any unresolved issue; set the task status with `pnpm orchestra done move-capture` only after GO and implementation.

Do not edit `tooling/capture*`, the root manifest, the lockfile, `packages/inference`, claims or generated adapters in this task. The old capture files remain active until the follow-up switches the root command.

## Follow-up task outside this grant

| Path | Required change |
| --- | --- |
| `package.json` | Add the workspace dependency on `@kuib-ai/capture`; change `capture` to call `kuib-capture` using the package's one scoped Deno grant. |
| `pnpm-lock.yaml` | Record the new workspace package/dependency without changing dependency versions. |
| `tooling/capture.ts`, `tooling/capture.test.ts`, `tooling/package.json` | Delete the old tool and its test after the package command and tests are wired; remove any obsolete tooling dependency. |
| `AGENTS.md` | Add `packages/capture` to the generated code map through `pnpm journal build`; update any handwritten capture reference if present. |
| `journal/domains/infra/current.md` | Rewrite `infra/provider-captures` to point to the package command and its unit scopes, then stamp that claim. |
| `journal/domains/core/current.md` | Check `core/inference-fixtures` for references to the old tool; rewrite and stamp if affected. |
| `eslint.config.ts` | Remove an obsolete capture-tool exclusion or add only the precise package rule needed by the command; do not weaken package lint. |
| `.prettierignore` | Remove an obsolete capture-tool exclusion; format the new package normally. |

## Names and open points

`@kuib-ai/capture` mirrors `@kuib-ai/testing`; `Capture` mirrors `Testing`; `kuib-capture` mirrors the planned `kuib-test`; `prepare`, `capture`, `runSequence`, `liftStop`, `reprice`, `loadKey`, `audit`, `refile`, `rename` retain their present public names. `capture.type`, `capture.policy`, `capture.safety`, `capture.response`, `file.cases` mirror the dotted folder pattern of `load.fixture` and `resolve.test.permissions`; their exact nouns have no existing capture-package sibling and are for owner review. `request.json` and `response.json`, and `request.body` and `response.body`, remain symmetric fixture names. Existing asymmetry left unchanged: the CLI says `record` while the API says `capture`; `runSequence` retains its `run` prefix while the CLI says `sequence`.

The run-folder permission model is the one material open point. The current root grant bounds it to `journal/features/inference/tasks`, while the renamed CLI takes a path argument. The plan preserves that bounded permission until an explicit different grant is provided.

## D031 resume amendment

The owner ruled that the recorder belongs inside `packages/inference`. The package assembled here is now a temporary staging home. Its `record.exchange` unit delegates response observation to `observe.response` and safety scanning to `scan.response`, with `ObservedResponse` in its own shape unit. Every behavior unit has one `index.test.ts`; the old 59-title suite remains mapped in the report. The move into `packages/inference`, deletion of `packages/capture`, and manifest, command, lockfile and claim changes wait for the coordinated step after the testing-command worker finishes.
