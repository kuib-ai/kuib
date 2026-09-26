# Startup cost and `deno compile` — measurements (2026-09-23)

Evidence for [[features/deno-runtime/plan#D007 — The terminal UI is native; engine, daemon and tooling stay TypeScript]],
[[roadmap/items/R300-own-tui-library]], [[roadmap/items/R303-single-binary-roles]] and
[[roadmap/items/R221-self-contained-engine]]. Measured on the Apple Silicon dev Mac with Deno
2.9.6, `apps/host-tui` at commit `3bb66d0`.

## Process start

Median of 15 runs after 2 warm-ups, each spawned through `sh -c` (which adds about 5 ms):

| What runs | Median |
| --- | --- |
| `/bin/echo` — process floor | 5.4 ms |
| compiled Deno `console.log("hi")` — runtime floor | 14.4 ms |
| `kuib --help`, `deno compile --bundle --minify` | 89.7 ms |
| `kuib --help`, `deno compile --bundle` | 110.3 ms |
| `kuib --help`, `deno run -A --no-check` | 199.8 ms |
| `kuib --help`, through the pnpm `deno` shim | 256.9 ms |

The Deno runtime costs about 9 ms over the process floor. The rest is the module graph:
`src/index.ts` imports every role's dependencies before it reads its arguments, so `--help`
loads OpenTelemetry, the AI SDK, tRPC and pino. The pnpm shim adds about 55 ms because it starts
Node to launch Deno.

## Import cost per package

Time for `await import(<package entry>)` in a fresh `deno eval --no-check`, unbundled, median of
7 runs:

| Package | Import |
| --- | --- |
| `zod` | 16 ms |
| `@kuib-ai/protocol` | 33 ms |
| `@kuib-ai/transcript` | 34 ms |
| `@kuib-ai/std` | 37 ms |
| `@kuib-ai/event-log-sqlite` | 38 ms |
| `@kuib-ai/cli` | 40 ms |
| `@kuib-ai/engine-service` | 57 ms |
| `@kuib-ai/std/pino` | 60 ms |
| `@kuib-ai/config` | 65 ms |
| `@kuib-ai/daemon` (tRPC server) | 78 ms |
| `@kuib-ai/engine` (AI SDK, providers) | 107 ms |
| `@kuib-ai/telemetry` (OpenTelemetry) | 170 ms |
| everything `host-tui` imports | 222 ms |

## `deno compile` findings

- **Type-checking.** `deno compile` type-checks unless given `--no-check`. With no `deno.json`,
  Deno reads the nearest `tsconfig.json`, whose `lib: ["ESNext"]` replaces Deno's default
  `deno.window` lib, so `Deno`, `console`, `crypto`, `RequestInfo` and `import.meta.url` are
  missing. tsgo already type-checks; compile with `--no-check`.
- **Injected libraries.** A compiled binary exits with `Did not find magic bytes.` when
  `DYLD_INSERT_LIBRARIES` is set (a tmux global environment injected a clipboard helper). The same
  binary starts with the variable unset.
- **pnpm layout.** Without `--bundle`, `deno compile` embeds only the packages the workspace
  manifests list, not their own dependencies, which pnpm's isolated layout keeps as symlinks under
  `node_modules/.pnpm/<package>/node_modules/`. The binary fails at start with
  `Could not find package '@jsr/std__collections'` (needed by `@std/toml`); `ai`'s
  `@ai-sdk/gateway`, `provider` and `provider-utils` are missing too. Upstream:
  [denoland/deno#30509](https://github.com/denoland/deno/issues/30509), open.
- **`--bundle` works.** `--bundle` runs esbuild from the entry point, so reached dependencies are
  included: 5.76 MB embedded instead of 59.63 MB, a 74 MB binary instead of 131 MB, and
  `kuib --help` runs. It is marked experimental and drops imports it cannot trace; `serve` was not
  tried.
- **Daemon spawn.** `ensureDaemon` spawns `process.execPath` with the path of
  `start.daemon/index.ts`. In a compiled binary `execPath` is the binary itself, which then treats
  the path as an unknown command; the daemon has to become a role of the binary.
