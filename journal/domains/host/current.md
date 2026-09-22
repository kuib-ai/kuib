---
domain: host
summary: "Host adapters: the terminal host and its CLI surface."
code: ["apps/**", "packages/cli/**"]
---

# Host

## Layout

`apps/host-tui` (`@kuib-ai/host-tui`) is the only app. It has no view layer: `src/index.ts` is
the entry and dispatcher, `src/run/` is the command table (one command, `serve`), `src/log/`
builds the logger, `src/resolve.daemon.client/` picks the daemon transport, and `src/cli/`
holds a CLI schema module. It wires the workspace packages `cli`, `config`, `daemon`, `engine`,
`engine-service`, `event-log-sqlite`, `protocol`, `std` and `telemetry`. ^host-layout

> [!sources]- structure · verified 2026-09-23
> - `apps/host-tui/src/index.ts` › `main` · #81250f59
> - `apps/host-tui/src/run/index.ts` › `run` · #6d0305bb
> - `apps/host-tui/package.json` › "Terminal host for Kuib AI"
> - why: [[domains/host/decisions#^D002]]
> - from: [[_archive/host-layer/decisions#v1 Frontend — OpenTUI + Solid (nvim-flavored)]]

host-tui runs on Deno straight from TypeScript source: `dev` is `deno run -A src/index.ts`,
`dev:watch` adds `--watch` for restart-on-edit, tests run under `deno test -A --no-check`, and
type-checking is `tsgo --noEmit` against the shared base tsconfig. ^host-runtime

> [!sources]- structure · verified 2026-09-23
> - `apps/host-tui/package.json` › "deno run -A src/index.ts"
> - `apps/host-tui/package.json` › "deno run -A --watch src/index.ts"
> - `apps/host-tui/package.json` › "deno test -A --no-check"
> - `apps/host-tui/tsconfig.json` › "@kuib-ai/tsconfig/base.json"
> - why: [[domains/host/decisions#^D003]]
> - why: [[domains/host/decisions#^D008]]
> - from: [[_archive/host-layer/decisions#Runtime]]

## Entry and dispatch

On start, `main` parses argv against the entry's own inline `cliSchema`; a `null` result
(`--help` or a parse error, both already reported) ends the process quietly. Parsed values
become the `cli` overrides of `Config.bootstrapConfig`, the resolved application paths are
created with `Config.ensureAppPaths`, and the logger is built from the bootstrap and records the
parsed arguments and config file path. ^entry-parse

> [!sources]- behaviour · verified 2026-09-23
> - `apps/host-tui/src/index.ts` › `main` · #81250f59
> - `apps/host-tui/src/index.ts` › "Config.ensureAppPaths(bootstrap.paths)"
> - why: [[domains/host/decisions#^D009]]
> - from: [[_archive/application-directories/decisions#Decision]]

The first positional argument selects the role: none prints the top-level help, `serve` runs
the engine service, anything else writes `Unknown command: <name>` to stderr and exits 1. Each
invocation mints a fresh random `DeviceID` and hands it to the command. ^role-dispatch

> [!sources]- behaviour · verified 2026-09-23
> - `apps/host-tui/src/index.ts` › "const command = parsed.positionals[0];"
> - `apps/host-tui/src/index.ts` › "return run.serve(bootstrap, deviceID, log);"
> - `apps/host-tui/src/index.ts` › "Unknown command: ${command}"
> - `apps/host-tui/src/index.ts` › "Protocol.ID.DeviceID.parse(crypto.randomUUID())"
> - why: [[domains/host/decisions#^D004]]
> - from: [[_archive/host-layer/decisions#Single binary, multi-role distribution]]

Any error thrown by `main` is caught at top level: it is logged as "kuib failed to start" when
the logger exists, echoed to stderr, and the process exits 1. ^entry-errors

> [!sources]- behaviour · verified 2026-09-23
> - `apps/host-tui/src/index.ts` › "const [error] = await Std.withError(main);"
> - `apps/host-tui/src/index.ts` › "kuib failed to start"

The entry accepts ten optional string flags. Eight feed the config bootstrap:
`--config`, `--mesh-config`, `--db-path` and `--log-path` override file paths; `--session`
sets the session ID; `--target-node`, `--model` and `--log-level` override `target.node`,
`model.default` and `logging.level`. `--daemon-socket` and `--engine-socket` are declared and
parsed but not forwarded to the bootstrap. ^entry-flags

> [!sources]- behaviour · verified 2026-09-23
> - `apps/host-tui/src/index.ts` › `cliSchema` · #beb5f935
> - `apps/host-tui/src/index.ts` › `TuiCliValues` · #015f13f7
> - `apps/host-tui/src/index.ts` › "meshConfigFile: values["
> - why: [[domains/host/decisions#^D009]]

`src/cli` exports a `cli` object whose `schema` is a copy of the same ten-option schema; the
entry does not import it and keeps its own inline copy. ^cli-schema

> [!sources]- structure · verified 2026-09-23
> - `apps/host-tui/src/cli/index.ts` › `cli` · #871240a5

## Serve

`serve` starts the engine side of a node: it derives a `serve`-scoped child logger, starts
telemetry with service name `kuib-engine` and the configured endpoint, resolves the model
configuration from `model.default`, `model.baseURL` and the provider secrets, and builds the
model, provider options and `ModelRef` once for the whole process. ^serve-startup

> [!sources]- behaviour · verified 2026-09-23
> - `apps/host-tui/src/run/serve/index.ts` › `serve` · #91bf083f
> - `apps/host-tui/src/run/serve/index.ts` › "kuib-engine"
> - `apps/host-tui/src/run/serve/index.ts` › "Engine.Provider.resolveModelConfig"
> - why: [[domains/host/decisions#^D006]]
> - from: [[_archive/observability/decisions#Decision]]

It then resolves a daemon client for `target.node` (local label `node.label`), opens the SQLite
event log at the database path, and starts the engine service on the engine socket with a
5000 ms idle reap. Each turn runs `Engine.runAgent` inside a `Std.withScope` carrying the
session and device IDs, threading the service's `takePending` and `onAbort` into the agent
loop. ^serve-wiring

> [!sources]- behaviour · verified 2026-09-23
> - `apps/host-tui/src/run/serve/index.ts` › "EventLogSqlite.createSqliteEventLog(dbPath)"
> - `apps/host-tui/src/run/serve/index.ts` › "reapIdleMs: 5000"
> - `apps/host-tui/src/run/serve/index.ts` › "Std.withScope({ sessionID: sid, deviceID }"
> - `apps/host-tui/src/run/serve/index.ts` › "takePending,"
> - why: [[domains/host/decisions#^D001]]
> - why: [[domains/host/decisions#^D007]]
> - from: [[_archive/host-layer/decisions#Engine vs engine-service, control/data-plane split, host read access (2026-07-01)]]
> - from: [[_archive/host-layer/decisions#Turn scheduling — per-session queue + step-boundary steering (2026-07-02)]]

## Daemon client resolution

`resolveDaemonClient` picks the daemon transport by node identity. When the target node equals
the local label it resolves the local endpoint from the daemon URL or socket and creates a
daemon client on it; otherwise it loads the mesh config, builds static discovery over its
nodes, parses the target as a `NodeID` and connects through the mesh transport factory, which
rejects a node the mesh config does not list. ^daemon-resolution

> [!sources]- behaviour · verified 2026-09-23
> - `apps/host-tui/src/resolve.daemon.client/index.ts` › `DaemonConfig` · #87473839
> - `apps/host-tui/src/resolve.daemon.client/index.ts` › `resolveDaemonClient` · #b03a080a
> - test: `apps/host-tui/src/resolve.daemon.client/index.test.ts` › "takes the local path when targetNode equals the local label"
> - test: `apps/host-tui/src/resolve.daemon.client/index.test.ts` › "takes the remote mesh path resolving the target NodeID from the mesh config"
> - test: `apps/host-tui/src/resolve.daemon.client/index.test.ts` › "takes the remote mesh path and rejects when the target node is not in the mesh config"
> - why: [[domains/host/decisions#^D005]]
> - from: [[_archive/distributed-mesh-state/decisions#Implementation status — Layer 1 (node resolution seam) — DONE]]
> - from: [[_archive/multi-device-ux/decisions#Discovery contracts (substrate-agnostic) (2026-07-01)]]

## Logging

`createLog` builds a pino logger named `host-tui` at the configured `logging.level`, writing to
the resolved log path, pretty-printed outside production mode, with the log path bound as a
field on every record. ^host-logging

> [!sources]- behaviour · verified 2026-09-23
> - `apps/host-tui/src/log/index.ts` › `createLog` · #b097db85

## CLI package

`@kuib-ai/cli` is a small argument parser and help printer. Its root default-exports the
`Cli` namespace (`parseCli`, `printHelp`); the `CliSchema` (description + options) and
`CliOption` (`string` or `boolean`, optional `short`, `default`, `multiple`, `description`)
types are imported from the `cli.schema` subpath, and every `src/<section>/index.ts` is
reachable as `@kuib-ai/cli/<section>`. ^cli-package

> [!sources]- structure · verified 2026-09-23
> - `packages/cli/src/cli.schema/index.ts` › `CliOption` · #3cb640d3
> - `packages/cli/src/cli.schema/index.ts` › `CliSchema` · #745f7385
> - `packages/cli/src/index.ts` › `Cli` · #03a4dcf6
> - `packages/cli/package.json` › "./src/*/index.ts"
> - from: [[_archive/house-style-linting/decisions#The house style (audited from the author's hand-written reference codebase)]]

`parseCli` reads `process.argv` after the runtime and script by default. `--help` or `-h`
anywhere prints help and returns `null`; otherwise `node:util` `parseArgs` runs with the
schema's options and positionals allowed, and a parse failure writes the error plus a
`--help` hint to stderr and returns `null`. Success returns the typed values and the
positionals. ^parse-cli

> [!sources]- behaviour · verified 2026-09-23
> - `packages/cli/src/parse.cli/index.ts` › `ParseCliResult` · #802786ae
> - `packages/cli/src/parse.cli/index.ts` › `parseCli` · #94073097
> - `packages/cli/src/parse.cli/index.ts` › "Error parsing arguments"

`printHelp` writes `Usage: kuib [options]` (or `kuib <command>` for a subcommand), the schema
description, and one line per option with its short alias, a `<string>` marker for string
options, the description and any default. ^print-help

> [!sources]- behaviour · verified 2026-09-23
> - `packages/cli/src/print.help/index.ts` › `printHelp` · #fe497b25
> - `packages/cli/src/print.help/index.ts` › "Usage: ${invocation} [options]"
