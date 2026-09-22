# review-core — report

Status: done

## Summary

Read-only review of the seven core packages (engine, engine-service, protocol, transcript, tools,
event-log-sqlite, daemon) and the 48 claims in `journal/domains/core/current.md`. In core, the
working-tree diff is header-only (`@context` lines plus two package.json descriptions), so the
code reviewed is the same as HEAD 9374dfb.

Most important results:

- **Security:** when a daemon TCP port is set, the daemon listens on every network interface,
  with no authentication, and serves `executeCommand`. That is remote shell access for anyone
  who can reach the port. Reproduced.
- **Local daemon never auto-starts under Deno:** `ensureDaemon` spawns `deno <entry>` without
  permission flags, so the child dies with `NotCapable` and `serve` fails unless a daemon is
  already running. Reproduced.
- **Sessions that break for good** — four ways, each reproduced:
  - a failure before streaming leaves no terminal event and the error is swallowed;
  - parallel tool calls replay as a message shape OpenAI-style APIs reject;
  - a steered message can land between tool calls and their results (latent — needs an append
    that really awaits);
  - tool output has no size limit and is replayed on every later turn.
- **Interrupts sent before `runAgent` wires `onAbort` are lost.** Reproduced.
- **Claims:** 44 TRUE, 4 PARTLY TRUE (C021, C025, C038, C039), 0 FALSE.

## Findings

Ranked by severity, most severe first. The label on each finding says how it was checked:

- **CONFIRMED** — reproduced with a `deno eval` script, or traced end to end.
- **PLAUSIBLE** — traced in the code but not reproduced.

### Code — CONFIRMED

1. **Daemon TCP listener: remote shell access with no authentication** —
   `packages/daemon/src/server/index.ts:10-14`
   - **What's wrong:** `tcpServer.listen(port)` passes no host, so it binds every interface (IPv4
     and IPv6). The router has no auth context and no Host-header check.
   - **Reproduced:** with `createDaemonServer(sock, 47931)`, `lsof` shows `TCP *:47931 (LISTEN)`.
     A plain `POST /executeCommand {"command":"id -un"}` returned
     `{"stdout":"rs10\n","exitCode":0}`. `writeFile` and `readFile` are exposed the same way.
   - **Scenario:** a user sets `KUIB_DAEMON_PORT` to reach a mesh node. Any host on the LAN, or
     the internet if the port is forwarded, can now run commands as that user. DNS rebinding also
     works from a browser, because there is no Host check.
   - **Blocked:** simple cross-site form posts. tRPC passes a `FormData` to the zod input, which
     rejects it (verified).
   - **Made worse by:**
     - No engine code calls `executeCommand` or `writeFile`, so these two procedures are attack
       surface with no legitimate caller.
     - Remote daemon traffic is cleartext HTTP (`createDaemonClient` TCP branch).
   - **Fix:**
     - Bind to `127.0.0.1` by default and make LAN exposure an explicit host setting.
     - Require a bearer token or mTLS through the tRPC context.
     - Remove `executeCommand` and `writeFile` from the router until they have a caller.
     - Validate the Host header.

2. **`ensureDaemon` auto-spawn cannot start a daemon under Deno** —
   `packages/daemon/src/ensure.daemon/index.ts:33-41`
   - **What's wrong:** it runs `spawn(process.execPath, [entry])`, which is `deno <entry>`.
     Deno runs that with no permissions.
   - **Reproduced:** the child exits 1 with
     `NotCapable: Requires env access to "NODE_ENV", run again with the --allow-env flag`.
     Because stdio is ignored, `ensureDaemon` just polls for 5 s and throws
     `daemon did not become reachable`.
   - **Scenario:** `serve` → `resolveDaemonClient` → `Daemon.resolveDaemonEndpoint` →
     `ensureLocalDaemon`. With no daemon already running, every engine start fails after 5 s.
   - **Why tests miss it:** the test "spawns a child on a dead socket then resolves once the
     probe succeeds" (`ensure.daemon/index.test.ts:31`) starts its own `net` server on the socket.
     It passes whether or not the real child works.
   - **Fix:**
     - Spawn with `["run", "-A", entry]`, or an explicit `--allow-*` set.
     - Handle `deno compile` builds, where `execPath` is the host binary.
     - Add a test that the spawned child actually binds a temp socket.

3. **A turn that fails before streaming leaves no terminal event, and the service swallows the
   error** — `packages/engine/src/orchestrator/index.ts:72-116`,
   `packages/engine-service/src/start.engine.service/index.ts:152-164`
   - **What's wrong:** only `consume()` is wrapped in `Std.withError`. These run outside it and
     can throw:
     - the `USER_MESSAGE_SUBMITTED` / `MESSAGE_STARTED` appends;
     - `buildMessages` (its replay runs `EventEnvelope.parse` on every row);
     - `Provider.buildTools` and `streamText`.

     When one throws, `runAgent` rejects, and `startEngineService` discards the rejection with
     `void runErr`, logging nothing.
   - **Reproduced:** with an event log whose `replay` throws, `runAgent` rejects and the log ends
     with `user-message-submitted message-started`. There is no `MESSAGE_COMPLETED` or
     `MESSAGE_FAILED`.
   - **Scenario:** after a protocol schema change, one stored envelope no longer parses. Every
     later turn in that session fails the same way, leaving an orphan `MESSAGE_STARTED`, and no
     error reaches the log or stderr.
   - **Contradicts:** D007 ("some errors happen before any step starts … every run ends with
     MESSAGE_COMPLETED or MESSAGE_FAILED"), D029 ("never silence"), and claim C025.
   - **Fix:** after `MESSAGE_STARTED`, wrap the whole turn body in one guard that emits the `⚠️`
     text delta and `MESSAGE_FAILED`. Have engine-service log `runErr` through the injected
     logger or scope.
   - **Missing test:** a failure before the stream starts.

4. **Replayed parallel tool calls produce a message shape OpenAI-style APIs reject** —
   `packages/engine/src/build.messages/index.ts:74-91`
   - **What's wrong:** each resolved `TOOL_CALL_STARTED` becomes its own assistant message.
   - **Reproduced:** a step with two tool calls, replayed through `@ai-sdk/openai-compatible`,
     sends this request body:

     ```
     user,
     assistant(tool_calls:[c1]),
     assistant(tool_calls:[c2]),
     tool(c1),
     tool(c2),
     …
     ```

     The AI SDK merges consecutive `tool` messages, but not consecutive `assistant` messages.
   - **Scenario:** OpenAI Chat Completions requires every `tool_call_id` in an assistant message
     to be answered by the tool messages right after it. So the next turn gets a 400, and so does
     every later turn, because the same history is replayed. The shape is CONFIRMED; whether a
     given endpoint (mimo, meta, groq, generic) rejects it is PLAUSIBLE and depends on how strict
     it is. Anthropic merges same-role messages, so it is unaffected.
   - **Fix:** accumulate consecutive resolved tool calls, plus the step's preceding text, into
     one assistant message with several parts. Flush it at the first tool result, user message or
     message end.

5. **`executeCommand` throws even though the claim says it never does** —
   `packages/daemon/src/procedure/execute.command/index.ts:21-27`
   - **What's wrong:** when the spawn fails or output overflows `maxBuffer`, `error.details.code`
     is a string (`"ENOENT"`, `"ERR_CHILD_PROCESS_STDIO_MAXBUFFER"`). `Number()` turns it into
     `NaN`, which fails the output schema's `z.number().int()`.
   - **Reproduced** through the in-process caller: both `{command:"echo hi", cwd:"/nonexistent"}`
     and a command writing 2 MB to stdout throw `TRPCError INTERNAL_SERVER_ERROR "Output
     validation failed"`.
   - **Also wrong:**
     - A process killed by a signal returns `exitCode 1` with empty stderr. The signal is lost,
       and `error.message` is not used because stderr is `""`, not undefined.
     - The test named "falls back to exitCode 1 and error.message for a non-existent command"
       (`execute.command/index.test.ts:29`) actually asserts `127`. The fallback path is never
       tested.
   - **Fix:**
     - Use `exitCode = typeof code === "number" ? code : 1`.
     - Fall back to `error.message` when stderr is empty.
     - Set `maxBuffer` explicitly and truncate the output.
     - Add tests for a missing `cwd` and for oversized output.

6. **Interrupts sent before `onAbort` is wired are lost; a stale abort is kept** —
   `packages/engine-service/src/start.engine.service/index.ts:132-134, 159-161`;
   `packages/engine/src/orchestrator/index.ts:86-89`
   - **What's wrong:**
     - `runAgent` registers `onAbort` only after two appends and `buildMessages`.
     - `state.abort` is never cleared, so during the next turn's start-up window an interrupt
       calls the previous turn's already-finished abort.
   - **Reproduced** with a fake `runTurn` that wires `onAbort` 20 ms in: a submit followed by an
     interrupt 5 ms later ran to completion. It happened again on the second turn.
   - **Fix:**
     - Let the service own a per-turn `AbortController` and pass its `signal` into `runTurn`, or
       record "interrupt requested" and apply it when `onAbort` registers.
     - Clear `state.abort` when the turn ends.
     - No test sends an `interrupt` frame at all; add one.

7. **A failed turn's `⚠️` banner is replayed to the model as assistant speech** —
   `packages/engine/src/orchestrator/index.ts:226-231` with
   `packages/engine/src/build.messages/index.ts:63-73, 132-135`
   - **What's wrong:** the banner is written as a `TEXT_DELTA` on the assistant `messageID`.
     `buildMessages` flushes it at `MESSAGE_FAILED` like any other assistant text.
   - **Reproduced:** after a turn whose model threw `401 invalid x-api-key`, the next context
     contains `["assistant","⚠️ 401 invalid x-api-key"]`.
   - **Scenario:** the model sees text it never produced. Provider error strings (URLs, request
     IDs, quota messages) end up in every later prompt.
   - **Fix:** drop text belonging to a `messageID` that ended in `MESSAGE_FAILED`, or emit the
     banner as a display-only event or part (for example `excluded: true`).

8. **Tool output has no size limit and is replayed on every later turn** — traced through the
   daemon `readFile` procedure → `Tools.readFile` → `orchestrator/index.ts:184`
   (`JSON.stringify(part.output)`) → `build.messages/index.ts:102-112`
   - **What's wrong:** nothing on that path caps the output size.
   - **Scenario:** the model reads a multi-megabyte log or a binary file (decoded as UTF-8
     garbage). A `TOOL_CALL_COMPLETED` row of several MB is stored. The next step, and every
     later turn, exceeds the context window and ends in `MESSAGE_FAILED`. There is no compaction,
     so the session never recovers.
   - **Fix:** cap bytes in the daemon (with a truncation marker), refuse binary files, and/or
     truncate tool results in `buildMessages`.

9. **Where a steered message lands depends on how fast `append` is (latent)** —
   `packages/engine/src/orchestrator/index.ts:104-115` against the consumer loop at `120-213`
   - **What's wrong:** `prepareStep` appends `USER_MESSAGE_SUBMITTED` from the SDK's step loop.
     The stream parts of the previous step are appended from the consumer loop. Nothing orders the
     two.
   - **Reproduced:** with an `EventLogPort` that obeys the port contract but whose `append` awaits
     one macrotask (`setTimeout 0`), the log reads
     `tool-call-started ×2, USER(steer), tool-call-completed ×2`. The next turn then fails with
     `MissingToolResultsError: Tool results are missing for tool calls c1, c2`, and so does every
     later turn.
   - **Not triggered by today's adapters:** the memory and SQLite logs have synchronous bodies,
     and I verified they keep the correct order. It will trigger once `append` does real async
     I/O.
   - **Fix:**
     - Serialize every append through one promise chain, and have `prepareStep` wait until the
       consumer has drained through `finish-step`.
     - Add a test for steering at the boundary after a tool step; the existing test only drains
       at step 0.

10. **Text and reasoning `partID`s are provider stream IDs, not unique IDs** —
    `packages/engine/src/orchestrator/index.ts:155, 164`
    - **What's wrong:** `@ai-sdk/openai-compatible` emits `id: "txt-0"` on every step, and
      Anthropic emits `String(index)`. So every `TEXT_DELTA` across steps, messages and sessions
      shares `partID "txt-0"`, while the protocol brands it as an identity (D009).
    - **Impact:** nothing keys on `partID` today, so this is latent. It breaks the first consumer
      that does.
    - **Fix:** map each provider ID per step to `newID(PartID)`.

### Code — PLAUSIBLE

11. **Two starts can race for one socket; a live daemon's socket is deleted** —
    `packages/daemon/src/server/index.ts:7`,
    `packages/engine-service/src/start.engine.service/index.ts:219-233`
    - **Daemon:** `createDaemonServer` runs `rmSync(socketPath, {force:true})` with no liveness
      probe. If two `ensureDaemon` calls run at once (two engine starts), both probe dead, both
      spawn, and the second deletes the first's socket. The first daemon is detached and never
      reaps, so it is orphaned for good. This contradicts D014 ("the socket file acts as the
      mutex"). Bug 2 hides it today.
    - **Engine-service:** the same check-then-act gap exists between `socketIsLive`, `unlinkSync`
      and `listen`.
    - **SQLite side effect:** `new DatabaseSync(path)` sets no busy `timeout`, so a second writer
      process gets `SQLITE_BUSY` on `BEGIN IMMEDIATE` immediately.
    - **Fix:** probe before unlinking in the daemon, or use an `O_EXCL` lock file; set `timeout`
      on `DatabaseSync`.

12. **SQLite writer: a failed COMMIT leaves the connection inside a transaction** —
    `packages/event-log-sqlite/src/sqlite.event.log/index.ts:66-81`
    - **What's wrong:** only the seq/parse/insert block is guarded. If `commitStmt.run()` throws
      (`SQLITE_FULL`, `IOERR`), nothing rolls back, and every later `BEGIN IMMEDIATE` fails with
      "cannot start a transaction within a transaction" until the process restarts.
    - **Also:** a subscriber that throws after the commit makes `append` reject even though the
      row is stored.
    - **Fix:** guard `COMMIT` as well (roll back if `db.isTransaction`), and isolate subscriber
      calls.

13. **SQLite reader poller can crash the process** —
    `packages/event-log-sqlite/src/read.sqlite.event.log/index.ts:71-82`
    - **What's wrong:** `drain` runs inside `setInterval` with no guard. A row that fails to parse,
      or a throwing handler, becomes an uncaught error thrown from a timer, which ends the Deno
      process.
    - **Impact:** low today, because nothing in production uses the reader (see 14).

14. **Dead dependencies and code with no production caller**
    - `packages/engine-service/package.json:17-18` declares `@kuib-ai/engine` and
      `@kuib-ai/event-log-sqlite` but never imports them. That works against the D015 boundary.
    - `packages/engine/package.json:24` declares `@ai-sdk/openai`, which is unused.
    - Since the TUI view layer was removed, only `serve` is a live path. These have no non-test
      caller: `connectOrSpawn`, `createSqliteReader`, `createLocalOnlyDiscovery`, the whole
      transcript package (`foldTranscript`), and the daemon's `writeFile` / `executeCommand`.

15. **Agent file tools have no path scoping; relative paths resolve against the daemon's cwd** —
    `packages/tools/src/read.file/index.ts:8`, `packages/daemon/src/procedure/read.file/index.ts:14`
    - **What's wrong:** the model can read any file the user can read (`~/.ssh`, `~/.aws`, the
      repo `.env`). That content goes to the model provider and stays in the log permanently.
    - **Relative paths:** they resolve against the daemon's own cwd. For an auto-spawned daemon
      that is the cwd of whichever process first spawned it, which is effectively arbitrary.
    - This is a design-level concern; see Open questions.

16. **Missing tests** (each is a gap in the priority areas):
    - Orchestrator: the abort/`onAbort` path (C025's abort sentence is untested), the stop-reason
      mapping (C024 — I verified it by hand: `tool-call-request, normal`), `maxSteps` (C026),
      steering after a tool step, and failures before streaming.
    - Engine-service: `interrupt` frames (none at all), the queue continuing after `runTurn`
      rejects ("errors included" in C043), and independence between sessions.
    - event-log-sqlite: the rollback path, COMMIT failure, and a second writer connection.
    - Daemon: `executeCommand` spawn errors and `maxBuffer`, whether the real `ensureDaemon`
      spawn works, and the TCP server test, which leaks its listener (the handle doesn't expose
      it, so it can't be closed).
    - Protocol: no tests at all, including the nested discriminated unions (`AnyMessage` →
      `MessageAssistant` → error kind).

### Claims — not TRUE (4 PARTLY TRUE, 0 FALSE)

17. **C025 — PARTLY TRUE.**
    - Wrong sentence: "Every turn ends with a terminal event."
    - What the code does: this holds only for errors raised inside the stream consumer. Failures
      in the appends, `buildMessages`, `buildTools` or `streamText` end the turn with no terminal
      event (finding 3).
    - The rest of the claim is accurate: the `⚠️` banner plus `MESSAGE_FAILED`, `onAbort`, and an
      error after an abort being recorded as completed.

18. **C038 — PARTLY TRUE.**
    - Wrong sentence: "It never throws."
    - What the code does: it throws `Output validation failed` for a missing `cwd` and for output
      over 1 MiB (finding 5).
    - "falling back to `error.message` and exit code 1" only happens when `details.code` is
      absent or null. Even then stderr is `""`, not `error.message`, for a signal kill.
    - The cited test "falls back to exitCode 1 and error.message for a non-existent command"
      asserts 127, so it doesn't support the sentence.

19. **C039 — PARTLY TRUE.**
    - Wrong sentence: "`createDaemonServer` … removes any stale socket file."
    - What the code does: it removes whatever is at the path, including a live daemon's socket;
      there is no probe.
    - "also starts a second standalone server on that TCP port" leaves out that it binds all
      interfaces with no authentication (finding 1).
    - Also: the start-up line prints `+ tcp :<port>` even when the TCP bind fails, because the
      error is ignored.

20. **C021 — PARTLY TRUE.**
    - Wrong sentence: "If anything fails it rolls back and rethrows."
    - What the code does: only the seq/parse/insert block rolls back. A `BEGIN IMMEDIATE`
      failure is simply thrown, and a `COMMIT` failure is neither rolled back nor recovered
      (finding 12).

### Important behaviour no claim mentions

- The daemon TCP listener binds every interface and has no authentication (1).
- Auto-starting the local daemon fails under Deno. C040 is accurate as written, but the spawn it
  describes cannot succeed (2).
- engine-service swallows `runTurn` rejections without logging them (3).
- An `interrupt` does not clear queued prompts, so they start a new turn right after the abort.
- The `⚠️` failure banner goes into the model context (7).
- Tool output is unbounded and replayed forever (8).
- Text/reasoning `partID`s come from provider stream IDs (10).
- `streamText` is called without `onError`, so the AI SDK prints every stream error to stderr.
  (I saw `Error: 401 invalid x-api-key` during a reproduction.)
- Only `serve` is a live production path; `connectOrSpawn`, `createSqliteReader` and the
  transcript package have no production caller (14).

## Verified OK

- **Claims:** 44 of 48 TRUE after reading each paragraph against its cited sources: C001–C020,
  C022–C024, C026–C037, C040–C048.
- **Checked by running code:**
  - **C027:** AI SDK v7.0.102 keeps messages returned by `prepareStep` for later steps
    (`currentStepMessages = stepMessages`, `dist/index.js:10400`). Steering persists within the
    turn, and the second step's prompt was `user, assistant, tool, user`.
  - **C024:** the mapping produces `tool-call-request` and `normal`.
  - **C041:** a unix-socket `Deno.createHttpClient` tRPC client against an in-process daemon:
    `readDir` works and a failed `readFile` surfaces as a `TRPCClientError`.
  - **C019, C021, C022:** the SQLite writer keeps event order correct in the steering scenario.
    Reader rowid tailing and seq floor logic are sound for an append-only table.
- **C005:** no string-literal discriminators in core.
- **C006:** the engine never emits `message-updated` or `tool-call-output-delta`.
- **C010:** no code outside the protocol uses the message types.
- **C002, C003:**
  - Every unit is `dir/index.ts`, except `provider/live.test.ts`.
  - Every package has `tsgo --noEmit`, and every package but protocol has
    `deno test -A --no-check`.
  - No test mocks modules.
- **Unix socket permissions:** `ensureAppPaths` creates the socket directories with mode `0700`
  (`packages/config/src/ensure.app.paths/index.ts:17-18`), so the unix sockets are private by
  default.
- **Cross-site form posts to the TCP daemon are rejected:** tRPC's form-data handler passes a
  `FormData`, and `ExecuteCommandInput` rejects it.
- **Tests:** `deno test -A --no-check` per package, all green:

  | Package | Result |
  | --- | --- |
  | tools | 2 passed |
  | transcript | 1 passed |
  | engine | 13 passed, 1 ignored (live) |
  | engine-service | 2 passed |
  | event-log-sqlite | 3 passed |
  | daemon | 10 passed |
  | protocol | no tests |

- **`pnpm journal check`:** 0 errors, 0 warnings.
- **`pnpm journal drift --files`:** all 46 claims with anchors show "dirty", only because of the
  uncommitted `@context` header edits; core attribution coverage is 146/146.
- **Not run:** `pnpm run check`. It runs `agents sync` and writes caches, which a read-only
  review must not do.
- **How reproductions ran:** as `deno eval` scripts. They wrote no files in the repo; temporary
  sockets and databases under `/tmp` were removed.

## Open questions

- Is the TCP daemon meant to be reachable on the LAN before mesh auth exists? If so, what is the
  auth plan? Otherwise, should it default to loopback?
- Should `interrupt` also drop the session's queued prompts (D018)? Right now they run right
  after the abort.
- Should agent `readFile` / `readDir` be limited to a root or a deny-list? Should relative paths
  be rejected?
- Is it intended that the `⚠️` banner reaches the model context?
- Host domain (outside my scope): with no `connectOrSpawn` caller, how are turns submitted to
  `serve` today? It starts the engine-service with no client attached, so it reaps after 5 s.
  Does the process exit after the reap, given the open SQLite handle and telemetry exporter?

## Plan updates (for the orchestrator)

- P01-I02 (review-core) → review done.
- Suggested follow-ups (not roadmapped by me):
  - Daemon TCP auth and loopback bind (1).
  - Fix the `ensureDaemon` spawn flags (2).
  - Guarantee a terminal event and log swallowed errors (3).
  - Group tool calls when replaying (4).
  - Fix `executeCommand`'s exit-code mapping (5).
  - Per-turn abort owned by the service (6).
  - Stop replaying the failure banner (7).
  - Cap tool output (8).
  - Serialize appends (9).
- Claims to rewrite and re-stamp once code or intent is settled: C021, C025, C038, C039, and
  C040's wording.
