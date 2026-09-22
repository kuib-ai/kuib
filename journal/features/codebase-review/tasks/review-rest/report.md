# review-rest — report

Status: done

## Summary

I reviewed host-tui, cli, config, env, std, telemetry, stt-coreml (Swift and the Python scripts)
and stt-mlx. In the working tree, the only in-scope code change is the one-line `@context` header
in each of 51 files, so this review covers the code as committed. I found 23 code findings: 18
confirmed and 5 plausible. The most serious ones are below.

- **Env file loading.** In production, a `.env` file is loaded from whatever directory the user
  runs `kuib` in. That file can redirect the model base URL, the trace endpoint and the daemon.
- **Frame size.** Neither STT server limits the frame length it will buffer, so any peer can
  exhaust its memory.
- **Shutdown.** stt-coreml never handles SIGINT or SIGTERM. I reproduced this.
- **Streaming state.** stt-coreml's per-connection streaming state races between Tasks and the
  event loop, and its batch backends interleave concurrent requests.
- **Config precedence.** Setting only `KUIB_MODEL_BASE_URL` overrides the model named in the
  config file. An explicit `mode` loses to `NODE_ENV`. A mistyped `--config` path is silently
  ignored. I reproduced all three.
- **Unenforced setting.** `[security] profile = "readonly"` is accepted but nothing enforces it.

I checked 50 claims: 37 are TRUE, 11 PARTLY TRUE and 2 FALSE (host#C011, product#C006).

Every repro script is in `/tmp/kuib-review/`, outside the repo. Nothing in the repo was written
except this file.

## Findings

### A. Code — CONFIRMED (reproduced, or traced end to end)

1. **Production reads `.env` from any working directory, and that file can redirect secrets,
   prompts and tool execution.**
   - Where: `packages/env/src/bootstrap.env/index.ts:13-19`, with the fallback at
     `packages/env/src/workspace.root/index.ts:12-14`.
   - What's wrong: `bootstrapEnv` looks for `pnpm-workspace.yaml`. If it doesn't find one it
     falls back to `cwd`, and it loads `.env.<mode>` and `.env` from there in every mode,
     production included. dotenv only fills variables that are unset, so a user's
     `KUIB_*_API_KEY` stays in place while the redirects are added around it.
   - Failure scenario (reproduced): run from a cloned repo containing
     `.env: KUIB_TRACE_ENDPOINT=https://collector.example` and
     `KUIB_DAEMON_URL=http://attacker.example:9`, with `mode: "production"` and no workspace
     marker. Result: `config.telemetry.endpoint = https://collector.example` and
     `runtime.daemonURL = http://attacker.example:9`.
     - The trace endpoint receives every prompt and every tool input/output.
     - The daemon URL receives the file reads, writes and commands.
     - `KUIB_MODEL_BASE_URL` sends the user's `KUIB_MODEL_API_KEY` to a host of the attacker's
       choosing.
     - `XDG_*` variables written into `process.env` also move every app path.
   - Fix: load dotenv files only when `resolveIsDev()` is true, and only from a workspace root
     that was actually found; drop the `cwd` fallback for dotenv. Production reads the OS
     environment and `config.toml` only.

2. **Neither STT server bounds frame length, so any peer can exhaust memory.**
   - Where: `services/stt-coreml/Sources/SttCoreML/Server.swift:115-124` (the decoder, installed
     at `:34` without `maximumBufferSize`) and `services/stt-mlx/server.py:66-70`.
   - What's wrong: the length is a raw `UInt32` (up to 4 GiB). Swift waits in `.needMoreData`
     while `ByteToMessageHandler` buffers everything. Python calls `readexactly(length)`.
   - Failure scenario: a header of `ff ff ff ff` followed by a steady byte stream grows the
     process until it is OOM-killed.
     - stt-coreml's listener is reachable from the whole tailnet (see #7).
     - stt-mlx binds `0.0.0.0` by default (`server.py:25`), so any host on the LAN can reach it.
   - Fix: cap frames (for example 32 MiB, or whatever the longest audio needs) and close the
     connection on oversize. In Swift, throw from `decode` or pass
     `ByteToMessageHandler(..., maximumBufferSize:)`; in Python, check `length` before
     `readexactly`.

3. **stt-coreml ignores SIGINT and SIGTERM, so it can only be stopped with SIGKILL.**
   - Where: `Server.swift:56-70`.
   - What's wrong: the two `DispatchSource` signal sources are locals inside the
     `withCheckedContinuation` body. Nothing retains them, so they are released as soon as the
     body returns, and their handlers (which hold `cont`) go with them. Meanwhile
     `signal(..., SIG_IGN)` has already been set.
   - Reproduced: `/tmp/kuib-review/sigtest.swift` copies the pattern, and a SIGTERM to self never
     fires the handler. The runtime prints "SWIFT TASK CONTINUATION MISUSE: … leaked its
     continuation". The control, with the source retained, fires as expected.
   - Consequence: the documented shutdown (close listeners, shut down the event loop group,
     remove the socket) is unreachable, and Ctrl+C does nothing.
   - Fix: keep both sources alive for the whole `run()`, for example as `let`s declared before
     `withCheckedContinuation` and wrapped in `withExtendedLifetime`, or as stored properties.

4. **stt-coreml streaming state is mutated off the event loop, and sessions get clobbered,
   leaked or misrouted.**
   - Where: `Server.swift:174-234` and `:247-257`.
   - What's wrong: `RequestHandler` is `@unchecked Sendable`. The Tasks running on the
     cooperative pool write `streamingSession` and `eouStreamingSession` (`:191`, `:198`, `:225`,
     `:230`) while `channelRead` and `channelInactive` read them on the NIO loop. That is a data
     race, and it also produces these logic errors (all traced):
   - a. **`streamEnd` clears the wrong session.** Its Task sets `self.streamingSession = nil`
     after `finish()` returns, which can be seconds later.
     - Scenario: a voice loop sends `streamEnd`, then `streamStart` for the next utterance. The
       new session is assigned first, then the old `streamEnd` Task nils it out.
     - Result: every later `streamAudio` gets "No active stream", and the new session is never
       cancelled.
   - b. **A second `streamStart` leaks the running session, and audio can go to the stale one.**
     A `streamStart` while a stream is active never cancels the old session. If the old stream
     was `parakeet-eou`, `streamAudio` checks `eouStreamingSession` first (`:213`), so the new
     default stream's audio is fed to the stale EOU session.
   - c. **A session created after disconnect is never cancelled.** An EOU session loads a model,
     which takes seconds. If the client disconnects during the load, `channelInactive` has
     already run, so the Task assigns a session that nothing will ever cancel. Each one holds a
     loaded model.
   - Fix:
     - Hop back to the event loop before touching handler state, and clear a session only if it
       is still the one that was finished (`===`).
     - Cancel any existing session on `streamStart`.
     - Drop the new session if `!context.channel.isActive`.
     - Feed audio through one per-connection `AsyncStream` consumer; see #B2 for why.

5. **Batch backends interleave concurrent requests because actors are reentrant.**
   - Where: `services/stt-coreml/Sources/SttCoreML/EouBackend.swift:21-50`,
     `ParakeetBackend.swift:17-32`, and the per-request Task at `Server.swift:236-243`.
   - What's wrong: each request runs in its own Task, from any connection. Both backends are
     actors, but an actor gives up exclusivity at every `await`.
     - In `EouBackend.transcribe`, request B's `manager.reset()` can run between A's
       `appendAudio`, `processBufferedAudio` and `finish()`. Both clients get mixed or truncated
       transcripts.
     - `ParakeetBackend` copies `decoderState` out, awaits, and writes it back. Two concurrent
       requests share the struct's `MLMultiArray` buffers, and the last write wins.
   - Traced from language semantics and the FluidAudio 0.15.7 checkout; not run on minerva.
   - Fix: serialise each backend explicitly (an async FIFO or single consumer task), not by
     relying on actor isolation.

6. **Host CLI parse errors exit with code 0.**
   - Where: `apps/host-tui/src/index.ts:51-54` and `packages/cli/src/parse.cli/index.ts:34-38`.
   - What's wrong: `parseCli` returns `null` both for `--help` and for a parse error, and `main`
     returns normally in both cases.
   - Reproduced: `deno run -A src/index.ts --bogus` prints the error and exits 0. Scripts and
     supervisors see success.
   - Fix: return a discriminated result, or set `process.exitCode = 2` on parse errors.

7. **stt-coreml has a hard-coded bind address, no authentication, and deletes the socket
   unconditionally.**
   - Where: `Main.swift:28` and `Server.swift:27`, `:44-54`.
   - What's wrong:
     - TCP binds to `100.70.111.96` (minerva's Tailscale IP). On any other machine the bind fails
       with EADDRNOTAVAIL after both models have loaded, and the process exits.
     - Any tailnet peer can use the service; there is no authentication.
     - `run()` deletes `~/.kuib/stt.sock` without first checking whether a server is live.
   - Failure scenario: start a second instance on minerva. It deletes the first instance's
     socket, binds a new one, then fails on the TCP bind (EADDRINUSE) and exits. Nothing is left
     on the unix socket, and the first server is unreachable locally.
   - Same hard-coded IP in the scripts: `bridge.py:11`, `client-batch.py:11`,
     `client-stream.py:11`, `record-and-send.py:6`, `stream-live.py:6` and
     `voice-assistant.py:27`.
   - Fix: take host and port from env or arguments, defaulting to unix-only (or `127.0.0.1`).
     Probe the socket with `connect` before deleting it, as engine-service does. Add an optional
     shared token.

8. **With no `XDG_RUNTIME_DIR`, the production runtime dir falls back to shared `/tmp` and is
   never checked for ownership.**
   - Where: `packages/env/src/resolve.unix.base/index.ts:34-37` and
     `packages/config/src/ensure.app.paths/index.ts:17-18`.
   - What's wrong: on Linux without `XDG_RUNTIME_DIR` (ssh sessions without pam_systemd,
     containers, cron), the sockets go to `/tmp/kuib/{daemon,engine}.sock`.
     `mkdirSync({recursive, mode: 0o700})` applies the mode only to directories it creates; an
     existing directory is used as it is.
   - Failure scenario: user B creates `/tmp/kuib` with mode 0777 before A runs. A's daemon
     socket then lives in a directory B owns. B can unlink it and bind their own socket, so A's
     engine sends every file read, write and command to B. If B creates the directory with mode
     0700 instead, A fails with EACCES.
     - macOS is unaffected, because `tmpdir()` is the per-user `$TMPDIR`.
   - Fix: fall back to a per-user directory (`/tmp/kuib-<uid>`, or `$XDG_STATE_HOME/kuib/run`).
     After creating it, `lstat` and require owner = uid and mode 0700; otherwise refuse.

9. **Setting only `KUIB_MODEL_BASE_URL` silently replaces the model chosen in the config file.**
   - Where: `packages/config/src/bootstrap.config/index.ts:139-145`.
   - What's wrong: when `KUIB_MODEL` is unset and either `KUIB_MODEL_ID` or `KUIB_MODEL_BASE_URL`
     is set, the env layer writes
     `model.default = openai-compatible/${KUIB_MODEL_ID ?? "llama-3.3-70b-versatile"}`. That
     overrides the file.
   - Failure scenario (reproduced): file `[model] default = "openai-compatible/qwen3:8b"` plus
     env `KUIB_MODEL_BASE_URL` gives `openai-compatible/llama-3.3-70b-versatile`. An
     `anthropic/...` file model is overridden the same way.
     - `.env.example:25` suggests exactly this override.
   - Fix: let the env layer set only `base_url`. Derive a compat model only when no layer names
     a model, or require `KUIB_MODEL_ID` for it.

10. **An explicit `mode` is overridden by `NODE_ENV`, and the dotenv file for the wrong mode is
    loaded.**
    - Where: `bootstrap.config/index.ts:118-121`.
    - What's wrong: the code computes `mode = env.NODE_ENV ?? requestedMode`.
    - Reproduced: `bootstrapConfig({ mode: "production" })` with `.env: NODE_ENV=development`
      gives `runtime.mode = development` and paths under `dist/`. `.env.production` was loaded
      for a mode the run did not end up in.
    - Fix: `mode = options.mode ?? env.NODE_ENV ?? "development"`, and pick the dotenv file from
      the final mode.

11. **A mistyped config path is silently replaced by defaults.**
    - Where: `bootstrap.config/index.ts:107-112`.
    - What's wrong: `loadFile` returns `{}` for a missing path, even when the user chose that
      path with `--config` or `KUIB_CONFIG`.
    - Reproduced: `--config <dir>/typo.toml` starts on the default model with no warning.
    - Fix: throw `CONFIG_INVALID` when an explicitly overridden config path does not exist.

12. **`[security] profile` is accepted but nothing enforces it.**
    - Where: `packages/config/src/kuib.config.file/index.ts:48-55`; no reader anywhere in
      `apps/` or `packages/` (grep).
    - What's wrong: `profile = "readonly"` validates and is stored in `KuibConfig`, but nothing
      restricts the daemon's `writeFile` or `executeCommand` procedures. A user who sets
      readonly gets a false sense of safety.
    - Fix: enforce it in the daemon or tool registry, or reject non-`development` values until it
      is enforced.

13. **Several flags and settings are dead.**
    - Where: `apps/host-tui/src/index.ts:57-68` and elsewhere as listed.
    - What's wrong:
      - `--daemon-socket` and `--engine-socket` are parsed and then dropped, even though
        `ConfigOverrides` supports both. `--daemon-socket /x` is ignored while `serve` binds and
        dials the defaults.
      - `--session` and `KUIB_SESSION_ID` end up in `runtime.sessionID`, which nothing reads;
        `serve` takes session IDs per SUBMIT.
      - `[web] port`, `KUIB_WEB_PORT`, `KUIB_WEB_TAILSCALE_IP`, `KUIB_WEB_DEV` and the `webPort`
        override have no consumer. They are leftovers from host-web. `KUIB_WEB_DEV=false` would
        also count as enabled (`!== undefined`).
      - `apps/host-tui/src/cli/` duplicates the schema and is unused.
      - `@kuib-ai/transcript` is declared in `apps/host-tui/package.json` but never imported.
    - Fix: forward the two socket flags; delete or wire the rest.

14. **`withScope` shares the parent's mutable stack between concurrent nested scopes.**
    - Where: `packages/std/src/log.scope/index.ts:27-56`.
    - What's wrong: a nested scope pushes onto `parent.stack`, and all concurrent children share
      that one array.
    - Reproduced: two concurrent `withScope({call})` calls under one root. Inside `a`,
      `currentScope()` returns `{root:1, call:"b"}`. Pops follow whichever scope settles first,
      so a scope can pop a sibling's bindings.
    - Current engine and host nesting is sequential, so this is latent until any
      `Promise.all` of scoped work (for example parallel tool calls). The existing test
      "isolates concurrent roots" only covers roots.
    - Fix: always call `storage.run({ stack: [...parentStack, bindings] }, fn)`, with no shared
      mutation.

15. **`createPinoLogger` ignores `pretty` when a `destination` is given, so host logs are never
    pretty.**
    - Where: `packages/std/src/pino/index.ts:48-52` and `apps/host-tui/src/log/index.ts:9-10`.
    - Reproduced: `{destination, pretty: true}` writes raw JSON lines. The host always passes a
      destination, so its `pretty: mode !== "production"` does nothing.
    - Fix: pipe pino-pretty into the file (it has a `destination` option), or drop the option in
      the host.

16. **Python client read loops spin forever when the server closes.**
    - Where: `bridge.py:24-28`, `client-batch.py:28-34`, `voice-assistant.py:52-58`,
      `watch-and-transcribe.py:18-24`, `record-and-send.py:21-27` and `test-transcribe.py:14-18`.
    - What's wrong: `data += sock.recv(n)` never checks for `b""`. `bridge.py` and
      `test-transcribe.py` also read the header with a single `recv(4)`.
    - Failure scenario: a server close mid-response (stt-mlx does this on any error; see #17)
      pins a core at 100% forever, because the socket timeout never fires on EOF.
    - The `Conn` classes in `client-stream.py`, `stream-live.py` and `stream-and-transcribe.py`
      already do this correctly; reuse that helper.

17. **stt-mlx closes the connection instead of sending an `error` frame on bad input.**
    - Where: `services/stt-mlx/server.py:79-89`, `:50` and `:160-187`.
    - What's wrong: invalid base64, `sampleRate: 0` (`ZeroDivisionError` at `:50`), non-object
      JSON or a model exception all raise inside `handle_client`. The client gets a closed
      socket and no `{"ok": false, "type": "error"}` frame.
    - Fix: wrap each request in a handler that returns an error frame, and validate
      `sampleRate > 0` and the `audio` field.

18. **`voice-assistant.py` lets a world-writable `/tmp/llm.env` override the user's
    environment.**
    - Where: `services/stt-coreml/voice-assistant.py:18-24`.
    - What's wrong: `os.environ[k] = v` overwrites existing values, and `/tmp` is shared between
      users.
    - Failure scenario: another local user plants `/tmp/llm.env` with
      `LLM_BASE_URL=https://attacker`. The victim's own `LLM_API_KEY` is then sent to that URL.
      Secrets kept in `/tmp` may also be readable by other users.
    - Fix: read from `~/.config/...` after checking the owner, and use `os.environ.setdefault`.

### B. Code — PLAUSIBLE (reasoned, not reproduced)

1. **On Windows, the cache directory is the data directory.**
   - Where: `packages/env/src/resolve.windows.base/index.ts:31-36` with
     `packages/config/src/resolve.app.paths/index.ts:19-25`.
   - What's wrong: data, state and cache all resolve to `%LOCALAPPDATA%`, so `cacheDir`,
     `kuib.db` and `kuib.log` all sit in `%LOCALAPPDATA%\kuib`. Any future "clear cache"
     (`rm -r cacheDir`) deletes the database. Nothing uses `cacheDir` today.
   - Socket paths: sockets become plain paths under `%TEMP%\kuib\`, but Node's `net` on Windows
     expects `\\.\pipe\` names. The `0o700` mode is also a no-op on Windows.
   - The Windows tests run on POSIX with `platform: "win32"`, so separators and runtime behaviour
     are never exercised.
   - Fix: per-kind subdirectories (`%LOCALAPPDATA%\kuib\{Data,State,Cache}`, `%APPDATA%\kuib`),
     and a named-pipe runtime on win32.

2. **stt-coreml's `streamAudio` and `streamEnd` Tasks are unordered.**
   - Where: `Server.swift:213-231`.
   - What's wrong: each frame starts a separate non-isolated `Task { await session.feedAudio }`,
     and Swift gives no FIFO guarantee between separately created Tasks hopping to an actor.
     Frames can arrive out of order, and `finish()` can run before the last frames are fed, so
     the end of the utterance is lost from `final`.
   - `started` is also sent from inside the session's `init`, before the handler stores the
     session, so an immediate `streamAudio` can race to "No active stream".
   - Fix: the per-connection `AsyncStream` from A4.

3. **`ParakeetBackend` carries TDT decoder state (LSTM state and `lastToken`) from one unrelated
   request into the next.**
   - Where: `ParakeetBackend.swift:21-32`.
   - What's wrong: FluidAudio's single-chunk path uses the passed state without resetting it,
     while its own independent-chunk paths create fresh state (`ChunkProcessor.swift:581`). Each
     utterance is therefore conditioned on the previous client's last token, which likely costs
     accuracy.
   - Fix: `TdtDecoderState.make()` per request, or `reset()` first.

4. **Workspace cache and check gaps.**
   - Where: `nx.json:17-24`, `package.json:9`.
   - What's wrong:
     - `lint` and `format` use inputs `["default"]` and there are no `namedInputs`. Editing
       `eslint.config.ts` or a house-style rule doesn't invalidate other projects' cached lint
       results, so check can go green on stale results.
     - `check` runs the `format` target, which is `prettier --write .`. It rewrites files instead
       of failing on unformatted code.
     - stt-coreml's `build` inputs omit `Package.resolved`.
   - Fix: add `{workspaceRoot}/eslint.config.ts`, the plugin sources and the prettier config as
     shared inputs; use a `format:check` (`prettier --check`) in `check`.

5. **stt-coreml doesn't validate `sampleRate`.**
   - Where: `Server.swift:96`, `EouBackend.swift:52`.
   - What's wrong:
     - The parakeet backend ignores the value (it assumes 16 kHz), so 48 kHz input is decoded at
       the wrong speed.
     - With `engine: parakeet-eou` and `sampleRate: 0`, `durationSeconds` becomes `inf`.
       `JSONEncoder` throws on non-finite floats, so the connection is closed with no reply.
       (`AVAudioFormat` accepts 0, so it does not crash; I checked in /tmp.)
   - Fix: reject non-positive rates, and resample or reject anything other than 16 kHz.

### C. Claims that are not TRUE

1. **host#C011 — FALSE.**
   - Claim: "writing to the resolved log path, pretty-printed outside production mode".
   - Code: the destination always wins, so the file gets JSON lines in every mode (A15).

2. **product#C006 — FALSE.**
   - Claim: "SIGINT/SIGTERM close both listeners, shut the event loop group down and remove the
     socket".
   - Code: the signal sources are released immediately and both signals are set to `SIG_IGN`, so
     none of that runs (A3).
   - The claim also doesn't mention that the socket path is deleted without checking for a live
     server (A7).

3. **product#C004 — PARTLY TRUE.**
   - Claim: "`sampleRate` (default 16000)". Code: the parakeet backend and both stream kinds
     ignore it and assume 16 kHz; only `parakeet-eou` batch uses it.
   - Claim: "`error` (`ok: false`)". Code: stt-mlx sends an error frame only for unknown or
     unexpected actions. Malformed input drops the connection (A17).

4. **product#C013 — PARTLY TRUE.**
   - Claim: "pre-seeded from `/tmp/llm.env`". Code: the file overrides the environment (A18).
   - Claim: "the last 10 turns of history". Code: `history[-10:]` is the last 10 messages, about
     5 exchanges.

5. **infra#C015 — PARTLY TRUE.**
   - Claim: "When only `KUIB_MODEL_ID` or `KUIB_MODEL_BASE_URL` is set, the model becomes
     `openai-compatible/<id>`". Code:
     - `<id>` defaults to `llama-3.3-70b-versatile` when only the URL is set.
     - The derived model overrides the config file's `[model] default` (A9).
   - The paragraph also implies that the `mode` option is authoritative; `NODE_ENV` overrides it
     (A10).

6. **infra#C017 — PARTLY TRUE.**
   - Claim: "socket directories at mode `0700`".
   - Code: the mode applies only when the directory is created. Existing directories keep
     whatever owner and mode they have, and nothing checks them (A8).

7. **infra#C019 — PARTLY TRUE.**
   - Claim: "pretty-prints through `pino-pretty` when asked".
   - Code: `pretty` is ignored whenever `destination` is set; the order is destination, then
     pretty, then stdout (A15).

8. **infra#C006 — PARTLY TRUE.**
   - Claim: "Each TS package defines the same four scripts".
   - Code: `packages/cli` and `packages/protocol` have no `test` script.

9. **infra#C008 — PARTLY TRUE.**
   - Claim: the manifest check is followed "then `journal.ts check`".
   - Code: `scripts/agents.ts check` runs between the two (`package.json:9`).
   - The claim also doesn't say that the `format` step runs `prettier --write`.

10. **infra#C010 — PARTLY TRUE.**
    - Claim: "Prettier formats everything except the lockfile, `journal`, `.agents` and
      `.claude`".
    - Code: `.prettierignore` also excludes `.gitignore`, `journal/_index.md`, `AGENTS.md`,
      `CLAUDE.md`, `.mcp.json`, `.cursor` and `.gemini`.

11. **infra#C024 — PARTLY TRUE.**
    - Claim: `no-cross-package-relative` means "relative imports may not escape their
      `packages/*` or `apps/*` package".
    - Code: it only reports when the target is inside a different package
      (`no.cross.package.relative/index.ts:59`), so escaping to the repo root
      (`../../../../scripts/journal.ts`) passes. `packageRootOf` (`:13-21`) takes the innermost
      `packages`/`apps` path segment, so `src/apps/x` inside a package is misread as its own
      package, a false positive.
    - Claim: `@scope`/`[param]` exemption.
    - Code: `dot-case-filename` exempts only directories, so a `[param]` file stem is reported.
      Directories above the last `/src/` are never checked.

12. **infra#C025 — PARTLY TRUE.**
    - `prefer-guard-clauses` reports at the `else`/`else if` node (`node.alternate`), not at the
      top `if`.
    - `no-prose-comments` allows `@context` anywhere in a comment and any comment starting with
      `global ` or `globals` (`no.prose.comments/index.ts:13,17`). So `// global state is mutated
      here` passes.
    - `no-destructure-props` fires only when the return value is directly a JSX element; a
      ternary or `&&` return is missed.
    - Other rule gaps the helper confirmed with `eslint --stdin` (I spot-checked the first two):
      - The `no-arrow` autofix rewrites arrows that use lexical `this`, which changes behaviour.
      - `named-schema-union` misses `z.object(...).strict()` and `z.strictObject` members.
      - `named-union-members` misses object literals nested in intersections and generics.

13. **infra#C028 — PARTLY TRUE.**
    - Claim: "so the next host run spawns them from current code".
    - Code: only the daemon is respawned (by `serve` through `ensureDaemon`). Nothing in the host
      spawns the engine-service any more, since `engine.client`'s spawn has no host caller.
    - Unmentioned: `pkill -f start.daemon` also kills daemons from other checkouts and worktrees
      of the same user, but only this checkout's sockets are deleted. The script root is built
      from `new URL(import.meta.url).pathname`, which breaks on paths with spaces (`%20`) and on
      Windows (`reload.ts:9`).

Important behaviour no claim mentions:
- The production `.env`-from-cwd exposure (A1).
- `[security] profile` is never enforced (A12).
- `scripts/design-session.sh:19` hard-codes `REPO=/home/rs10/...`, so `pnpm design` only works on
  septimus.
- stt-coreml's socket lives at `~/.kuib/stt.sock`, outside kuib's `AppPaths` and runtime-dir
  scheme.
- With `reapIdleMs: 5000` and no client in the host, a manually started `kuib serve` closes
  itself about 5 s after start unless something attaches.

### D. Missing tests

- `packages/cli`: no `test` script and no tests (parse errors, `--help` detection, help output).
- host-tui: no tests for dispatch, exit codes, or CLI-to-bootstrap mapping (which would have
  caught the dropped socket flags) or the logger.
- config: no tests for the compat-model mapping (A9), mode precedence (A10), a missing explicit
  config file (A11), or `KUIB_*` env mapping beyond target and web port.
- std: no test for concurrent nested scopes (A14) or for pino `pretty` combined with a
  destination (A15).
- stt-coreml: no Swift test target at all (framing, oversize frames, stream lifecycle).
- stt-mlx: no tests.

## Verified OK

Claims: 50 checked. 37 TRUE, 11 PARTLY TRUE, 2 FALSE.

| Domain | Checked | TRUE | Not TRUE |
|---|---|---|---|
| host | 14 | 13 | C011 |
| infra (Workspace, Env, Config, Std, Telemetry, Lint, Scripts) | 23 | 14 | C006, C008, C010, C015, C017, C019, C024, C025, C028 |
| product | 13 | 10 | C004, C006, C013 |

- host: C001–C010 and C012–C014 are TRUE.
- infra: C005, C007, C009, C011–C014, C016, C018, C020–C023 and C029 are TRUE.
- product: C001–C003, C005 and C007–C012 are TRUE.

Code paths checked and found fine:
- **Env precedence:** the OS environment wins over `.env.<mode>`, which wins over `.env`.
- **XDG fallbacks:** relative and empty values are ignored.
- **Windows:** XDG wins over `APPDATA`/`LOCALAPPDATA`, then `homedir`, and the runtime dir falls
  back from `TEMP` to `tmpdir`.
- **`resolveAppPaths`** (overrides) and **`ensureAppPaths`**: resolving creates nothing, and
  directories are created only when asked.
- **Config parsing:** the config file is strict and every default matches `config.example.toml`.
- **Secrets:** they stay out of `KuibConfig`. `.env` is gitignored and no secrets are committed
  (grep across the scope).
- **`withError`/`mapError`/`errorFields`:** they behave as C021 describes.
- **`startTelemetry`:** it reads no environment.
- **host `serve` wiring:** model built once; daemon client resolution for the local and mesh
  paths; the scope carries session and device IDs; `takePending` and `onAbort` are threaded
  through.
- **Daemon auto-spawn under Deno:** `spawn(process.execPath, [entry])` in `ensureDaemon` does get
  permissions. I tested it; Deno rewrites the call to `run -A`.
- **Framing:** both servers use the same 4-byte big-endian framing. stt-mlx serialises
  inference on one worker thread.
- **Script table:** the C012 script table matches every script.

Verification:
- `pnpm journal check`: 0 errors, 0 warnings.
- `pnpm journal drift --files`: every host claim and every in-scope infra claim is "dirty" only
  because of the uncommitted one-line `@context` header edits (in-scope `git diff` is 51 files,
  +51/−51, all headers). Product claims are fresh. Attribution: host 11/11, infra 55/55, product
  20/20.
- Tests, run with `deno test -A --no-check` in each package: host-tui 3 steps, config 8,
  env 24, std 21 and telemetry 3 all passed; house-style (run by the helper) 116 steps passed.
- `pnpm run check`: not run. It writes, because the `format` target runs `prettier --write` and
  Nx writes its cache, and this review was read-only.
- Repros are in `/tmp/kuib-review/`:
  - `repro-config.ts`: A1, A9, A10, A11.
  - `repro-std.ts`: A14, A15.
  - `sigtest.swift` and `sigtest2.swift`: A3.
  - `avfmt.swift`: B5.
  - `parent.ts`/`child.ts`: the Deno spawn check.

## Open questions

1. Should `kuib serve` started by hand exit after 5 s idle (`reapIdleMs: 5000`), now that no host
   client spawns or attaches to it?
2. Is stt-coreml's TCP listener meant to be open to the whole tailnet without authentication? Or
   should it default to unix-only, with the address coming from config?
3. `Package.swift` declares `swift-tools-version: 6.3`, but the stt-engine notes and commit
   `e634000` say 6.0. Which is intended? (minerva has 6.3.3.)
4. Is Windows a real target for the daemon and engine sockets? If so, the runtime needs named
   pipes (B1).
5. Should `[security] profile` be enforced now, or removed until it is (A12)?
6. The new AGENTS.md rule says Python runs via uv, with PEP 723 metadata and a
   `uv run --script` shebang. 8 of the 10 stt-coreml scripts and `stt-mlx/server.py` still use
   `#!/usr/bin/env python3` and have no inline metadata. `server.py` also imports `numpy` without
   declaring it in `pyproject.toml`. Is fixing these in scope for a follow-up?
