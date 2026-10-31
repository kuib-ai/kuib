# rename-fixtures — plan

## Inventory and mapping

The current tree has 709 case directories, each with exactly one `sequence.json` entry,
one `001.request.json`, one `001.request.body.json` and one `fixture.json`. It has 707
response sets (`001.response.json`, `001.response.bin`, `001.chunks.json`); the two
historic sensitive-data refusals have no response set. There are no multi-step cases.

| Old folder prefix | New folder prefix |
| --- | --- |
| `anthropic-messages-claude-sonnet-5-5` | `anthropic-messages/anthropic/claude-sonnet-5-5` |
| `anthropic-messages-claude-haiku-5-5` | `anthropic-messages/anthropic/claude-haiku-5-5` |
| `anthropic-messages-claude-haiku-4-5-20251001` | `anthropic-messages/anthropic/claude-haiku-4-5` |
| `mimo-messages-mimo-v2-6-pro` | `anthropic-messages/xiaomi/mimo-v2-6-pro` |
| `mimo-chat-mimo-v2-6-pro` | `openai-chat/xiaomi/mimo-v2-6-pro` |
| `meta-chat-muse-spark-1-1` | `openai-chat/meta/muse-spark-1-1` |

For every case, map `001.request.json` → `request.json`, `001.request.body.json` →
`request.body`, `001.response.json` → `response.json`, `001.response.bin` →
`response.body`, and `001.chunks.json` → `transport.json`. Keep `sequence.json` and
`fixture.json`. The on-disk case folders already use `thinking-sampling-top-p`; the
underscore spelling survives in some row/name metadata and task data, and becomes
`thinking-sampling-top-p` there. The native model slugs inside the request bodies do
not change.

Keep the six-prefix and case-alias mapping in one task-local migration program beside
this plan. It is historical migration data. Define current words only in the three
`packages/protocol` enums; the migration program imports their target values, and
the capture tool imports the same enums. An owner correction changes one enum value,
then one `pnpm capture rename` invocation updates the envelopes and folders. The
inference test makes an omitted rename fail the gate.

## Changes by path

1. `journal/features/inference/tasks/rename-fixtures/`: keep this plan, append the
   progress log, add the one-time migration program with the old-prefix mapping,
   keep its safe hash manifest in `/var/tmp` during execution, then write the report.
   The program will reject an unknown old prefix, collision, unexpected file name
   or multi-step case. It calls the tool's `rename` and `refile` operations on the
   staged real tree rather than duplicating their filing logic.
2. `packages/protocol/src/message/message.format.enum/index.ts`,
   `packages/protocol/src/provider/provider.enum/index.ts`, and
   `packages/protocol/src/model.enum/index.ts`: add `MessageFormatEnum`,
   `ProviderEnum`, and `ModelEnum` once, with the brief's members and string values.
   Put them in the relevant existing barrels (`message/index.ts`,
   `provider/index.ts`, and root `index.ts`) without changing existing members.
   Update `core/protocol-enums`, `core/protocol-messages`, `core/model-config`, and
   `core/package-barrels` claims only if their linked scope or truth changes; stamp
   touched claims. P02-I01 will build the offering and neutral format on these enums.
3. `packages/inference/fixtures/`: stage all new case paths and file names. Rewrite
   each `request.json` envelope from `offering` to `format`, `provider`, `model`;
   use `xiaomi` for MiMo identity; set `bodyFile` to `request.body`, `name` to the
   actual case folder, and retain `step: "001"` only as the ledger/exchange identity.
   Rewrite `sequence.json` `requestFile` and every replay `fixture` to the new path;
   replay source `step` stays `001`. Update the same replay fields in envelopes.
   Rename `transport.json` from chunks without changing byte-length and SHA-256
   facts; change only identity/path fields if present. Preserve `response.json` and
   `fixture.json` content except an actual identity reference. Move both body files
   without rewriting either byte. Check every cross-fixture replay source exists.
4. `packages/inference/src/index.test.ts` and `packages/inference/package.json`:
   add an offline tree test that walks all cases and rejects a first-, second- or
   third-level directory absent from the corresponding enum, an envelope identity
   that differs from its path, or any missing case file. It also checks the
   request/response pairs, allowing the two recorded response-less refusals by
   explicit transport/history evidence. Add the protocol dev dependency.
5. `journal/features/inference/tasks/capture-traffic/`: update active recipes,
   batch/path lists, price rows, observations, progress, and provider notes to use
   new fixture paths, file names, three identities and `xiaomi` where these are
   current identities. These files include `recipes*.json`, `*batch.paths.json`,
   `probe.paths.json`, `diagnostic.paths.json`, `rows*.json`, `*observations*.json*`,
   `progress.json`, `provider.notes.json`, and `stage-a.ledger.summary.json`.
   Search each JSON/JSONL data file and verify zero old fixture prefixes or old
   case spelling remain outside history. Keep the capture task's `brief.md`,
   `plan.md`, `log.md`, and `report.md` as historical prose. Keep
   `ledger.jsonl` byte for byte through staging and testing, then append exactly
   one migration record. Never rewrite old started, finished, lifted or repriced
   lines.
6. `tooling/capture.ts`, `tooling/package.json`, and `pnpm-lock.yaml`: import the
   protocol enums; keep no local copy or list of their string values. Replace the
   joined `offering` request and prepared fields with three enum-backed fields.
   Validate enum membership and derive
   `<format>/<provider>/<model>/<case>` in one place. Update prepare, readPrepared,
   captureExchange, replay validation, response paths, and audit for the symmetric
   names. Preserve `KUIB_MIMO_API_KEY`. Use the new provider identity `xiaomi` for
   limits, origins, auth, key lookup, stopping and accounting. Parse the one
   migration ledger record and resolve historic fixture paths, provider `mimo`, and
   the old `thinking-sampling-top_p` row in memory when checking already-started
   rows, provider limits, reservations and stops. Historic entries remain exactly
   as written. Missing-header recovery for a historic entry must find the newly
   named `request.json` through that resolution. Expose `refile` to place all cases
   at the path named by their envelope's enum values, and `rename` to change one
   format/provider/model enum value across envelopes and folders; both detect
   collisions and move body bytes unchanged. Add CLI operations `pnpm capture
   refile` and `pnpm capture rename <identity> <old> <new>` and make each operable
   against a staged fixture root in tests and migration.
7. `tooling/capture.test.ts`: use the new identities and path/file names in every
   loopback test; add focused proof that a historic ledger entry plus the one
   migration record blocks a second start, preserves provider accounting/stops,
   and finds a moved prepared request. Exercise `rename` and `refile` on a
   disposable fixture tree with body hash assertions, then on the real staged
   migration. Check a real nested fixture with `Testing.loadFixture` and verify
   replay reads the same body bytes.
8. `journal/domains/core/current.md` (`core/inference-fixtures`) and
   `journal/domains/infra/current.md` (`infra/provider-captures`): rewrite the
   old layout, naming, and MiMo provider statements to match the code and data;
   state that recorded body bytes are provider-owned and independent of kuib's
   identity words, while the filing follows the enums; each fixture has its
   capture time and request so it can be recorded again if a provider changes.
   fix stale source quotes/test names, then stamp both claims. `AGENTS.md` has no
   joined fixture paths or capture layout description to change; run journal build
   and inspect its generated block if it changes.

## Ledger record

Append one `kind: "fixture-layout"` record after the 709th finished call and the
existing reviews. It records the six old-to-new folder prefixes, the one case/row
spelling alias, and `mimo` → `xiaomi`. It contains no key, header value or body.
The reader validates that at most one such record exists and that it follows the
historical calls. It normalizes historical entries only in memory; new captures
write the new identity and path directly. Duplicate detection then compares the
normalized historical fixture and row with the candidate's new path and row. The
record also lets an old stopped provider and its count remain effective after the
provider rename. A fresh synthetic test ledger can omit the record and use only
current identities.

## Order, verification and recovery

1. Before changing code or data, write a `/var/tmp` manifest of SHA-256 hashes for
   all 709 request bodies and 707 response bodies, keyed by their old relative
   paths. Save a recoverable copy of the original fixture tree and mutable code/task
   data under `/var/tmp`. Do not put body text or secrets in logs.
2. Add the three enums, dependency wiring, tool operations and tests, then stage
   the entire new fixture tree in a sibling directory. The migration program
   converts joined prefixes into three envelope fields, using temporary legacy
   `mimo` and dated Haiku identities where needed. It invokes `rename` on those
   staged cases to reach the enum's `xiaomi` and `claude-haiku-4-5` values, and
   invokes `refile` to place all cases by their envelopes. The same operations
   rewrite paths and metadata; the migration program copies body bytes unchanged.
   Validate the staged tree:
   exactly 709 request and 707 response bodies; every old-path hash equals the
   new-path hash via the mapping; 4,957 fixture files; exactly one sequence entry
   and valid description per case; every replay source resolves. Run the real
   loader over all 709 cases, the inference enum/tree test and the audit over the
   staged tree. Do not invoke capture or sequence against providers.
3. Stage the updated capture-task data and claims, then swap the complete fixture
   root by renaming old root to a sibling backup and staged root to the canonical
   path. A failed stage check leaves the old tree in place. A failed swap restores
   the backup. Run targeted loopback tests, audit, journal check/stamp, and guarded
   `pnpm run check` with Nx parallelism 2. If any of those fail before the ledger
   append, restore the old complete tree and backed-up code/data, then correct the
   cause and restage.
4. Only after the new tree and tests pass, append the single ledger mapping record.
   Verify the earlier ledger bytes are an exact prefix, all 709 ordinals still
   parse, the historical deduplication test passes, audit is clean, and the
   guarded full check is green. If a post-append check fails, fix forward; the
   ledger stays append-only. Remove sibling stage/backup only after success.

Every multi-process run uses `/var/tmp/kuib-guard.sh 30 1500 --` with Nx
parallelism 2. `pnpm capture audit` is allowed; no provider request is made.

## Names and open points

| Introduced name | Sibling mirrored |
| --- | --- |
| `MessageFormatEnum`, `message.format.enum` | `MessageRoleEnum`, `message.role.enum` |
| `ProviderEnum`, `provider.enum` | `MessageRoleEnum`, `message.role.enum` |
| `ModelEnum`, `model.enum` | `MessageRoleEnum`, `message.role.enum`; new top-level model sibling of `model.ref` |
| `ANTHROPIC_MESSAGES`, `OPENAI_CHAT` | `TOOL_CALL_STARTED` style in `EventTypeEnum` |
| `ANTHROPIC`, `XIAOMI`, `META` | other uppercase enum members |
| `CLAUDE_SONNET_5_5`, `CLAUDE_HAIKU_5_5`, `CLAUDE_HAIKU_4_5`, `MIMO_V2_6_PRO`, `MUSE_SPARK_1_1` | other uppercase enum members, with words from sibling model folders |
| `format`, `provider`, `model` | fixture path levels and prospective offering identities |
| `request.json`, `response.json` | each other |
| `request.body`, `response.body` | each other |
| `transport.json` | existing `sequence.json` and `fixture.json`; no exact peer for transport, owner review |
| `fixture-layout` ledger kind | existing `repriced`/`lifted` ledger kinds; no exact migration sibling, owner review |
| `refile`, `rename` | `prepare`, `capture` tool operation verbs; no exact existing operation sibling, owner review |

The order of path levels and proposed format/model words remain open to owner
correction under D029. There is no unresolved decision needed to execute the
mapping in the brief. Existing `step`/`001` identities in the ledger and replay
metadata do not describe multiple files; removing them from those schemas is a
separate decision. The `mimo` spelling inside `KUIB_MIMO_API_KEY`, native wire
model slugs and historic ledger lines is intentional.
