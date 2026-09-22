---
domain: infra
summary: Workspace tooling, config/env/std/telemetry foundations, lint rules, agent wiring and the journal itself.
code: ["*", ".agents/**", ".claude/**", ".cursor/**", ".gemini/**", "bin/**", "scripts/**", "packages/{config,env,std,telemetry,eslint-plugin-house-style,tsconfig,deno-types}/**"]
---

# Infra

## Journal system

Project context lives in `journal/` in three layers: `roadmap/` holds intent (items with graph
edges), `domains/` holds built truth attributed to source, and `features/` tracks work in flight.
`journal/SPEC.md` is the contract and `scripts/journal.ts` enforces it. ^C001

> [!sources]- C001 · structure · verified 9374dfb
> - `journal/SPEC.md` › "| Intent | `roadmap/` |"
> - `scripts/journal.ts` › `commandCheck` · #8392ce3a
> - why: [[domains/infra/decisions#^D001]]
> - from: [[features/context-system/plan]]

`journal.ts check` validates roadmap items, domain claims and decisions, feature plans against
their `implementation.toml`, wireframes, archive ledgers, and file ownership: every tracked file
outside `journal/` must match exactly one domain's `code` globs, and a TS module's `@context`
header must name its owning domain. Generated files (`_index.md`, `roadmap/ROADMAP.md`, the
AGENTS.md block) must match a fresh `build`. ^C002

> [!sources]- C002 · behaviour · verified 9374dfb
> - `scripts/journal.ts` › `validateOwnership` · #42b9a925
> - `scripts/journal.ts` › `loadFeatures` · #dced1a3a
> - `scripts/journal.ts` › `validateArchive` · #15dc70c2
> - `scripts/journal.ts` › "generated output is stale"

Each claim's sources are checked mechanically: symbol anchors are hashed from the TypeScript
AST, quotes must appear verbatim, test names must appear in their file. `journal.ts drift` ranks
claims as broken, changed, unverified, stale (commits since `verified`) or dirty, and reports
per-domain attribution coverage; `journal.ts stamp` rewrites hashes and `verified` to HEAD. ^C003

> [!sources]- C003 · behaviour · verified 9374dfb
> - `scripts/journal.ts` › `symbolHash` · #687da64b
> - `scripts/journal.ts` › `checkAnchor` · #b1a77690
> - `scripts/journal.ts` › `commandDrift` · #7430bd28
> - `scripts/journal.ts` › `commandStamp` · #391efaaa
> - why: [[domains/infra/decisions#^D002]]

Every TS module under `apps/` and `packages/` opens with `// @context @journal/domains/<domain>`,
optionally narrowed to a claim with `#^C###`. `house/require-context-link` resolves a directory
link to its `current.md` (falling back to `plan.md`, then `decisions.md`) and reports a missing
block anchor as a dead link. ^C004

> [!sources]- C004 · behaviour · verified 9374dfb
> - `packages/eslint-plugin-house-style/src/rules/require.context.link/index.ts` › `hasBlockAnchor` · #3ac1269f
> - `packages/eslint-plugin-house-style/src/rules/require.context.link/index.ts` › "DIRECTORY_ENTRY_FILES"
> - test: `packages/eslint-plugin-house-style/src/rules/require.context.link/index.test.ts` › "deadContextAnchor"
> - why: [[domains/infra/decisions#^D003]]

## Workspace and tooling

The repo is one pnpm workspace over `apps/*` and `packages/*` with `catalogMode: strict`: every
dependency version lives in the default catalog and manifests reference it as `catalog:`. Deno is
itself a catalog-pinned root devDependency (build scripts allowed for `deno` and `nx`), so
`pnpm install` provisions the runtime; the root manifest pins pnpm through `packageManager` and
Node through strict `engines`. ^C005

> [!sources]- C005 · structure · verified 9374dfb
> - `pnpm-workspace.yaml` › "catalogMode: strict"
> - `pnpm-workspace.yaml` › "deno: 2.9.6"
> - `pnpm-workspace.yaml` › "allowBuilds:"
> - `package.json` › ""deno": "catalog:","
> - `package.json` › ""engineStrict": true,"
> - why: [[domains/infra/decisions#^D007]]
> - why: [[domains/infra/decisions#^D008]]
> - from: [[_archive/architecture-overview/decisions#Build System]]
> - from: [[_archive/architecture-overview/decisions#Runtime & Distribution]]

Nx is the task runner. `nx.json` caches `generate`, `typecheck`, `test`, `lint` and `format`;
`typecheck` depends on upstream `generate` targets, and `typecheck` and `test` key their cache on
`deno --version`. Each TS package defines the same four scripts: `typecheck` (`tsgo --noEmit`),
`test` (`deno test -A --no-check`), `lint` (`eslint .`) and `format` (`prettier --write .`). ^C006

> [!sources]- C006 · behaviour · verified 9374dfb
> - `nx.json` › ""dependsOn": ["^generate"],"
> - `nx.json` › "{ "runtime": "deno --version" }"
> - `packages/std/package.json` › ""test": "deno test -A --no-check","
> - `packages/std/package.json` › ""typecheck": "tsgo --noEmit","
> - why: [[domains/infra/decisions#^D008]]
> - why: [[domains/infra/decisions#^D023]]

Deno is used only as a runtime: there is no `deno.json`, and Deno always runs with `--no-check`.
`tsgo` is the single type-checker. It reads Deno's declarations from `@kuib-ai/deno-types`,
whose `generate` target (also run on `postinstall`) writes `deno types > index.d.ts` — a
gitignored file cached on the installed Deno version. The shared `@kuib-ai/tsconfig/base.json`
lists `node` and `@kuib-ai/deno-types` in `types` and is strict (`noUncheckedIndexedAccess`,
`verbatimModuleSyntax`, `allowImportingTsExtensions`, `noEmit`, NodeNext resolution), so imports
carry explicit `.ts` specifiers. ^C007

> [!sources]- C007 · behaviour · verified 9374dfb
> - `packages/deno-types/package.json` › ""generate": "deno types > index.d.ts","
> - `packages/deno-types/package.json` › ""postinstall": "deno types > index.d.ts","
> - `packages/deno-types/.gitignore` › "index.d.ts"
> - `packages/tsconfig/base.json` › ""@kuib-ai/deno-types""
> - `packages/tsconfig/base.json` › ""allowImportingTsExtensions": true,"
> - `packages/tsconfig/package.json`
> - `packages/std/tsconfig.json` › ""extends": "@kuib-ai/tsconfig/base.json","
> - why: [[domains/infra/decisions#^D004]]
> - why: [[domains/infra/decisions#^D005]]
> - why: [[domains/infra/decisions#^D009]]

`pnpm run check` first runs `scripts/check.root.manifest.ts`, which fails if the root
`package.json` has gained `workspaces`, `catalog` or `catalogs` (Deno's pnpm-workspace
migration), then `journal.ts check`, then `typecheck`, `lint` and `format` across all projects
through Nx with parallelism 10. `pnpm test` runs every project's `test` target; `pnpm check:circular` runs madge
over `packages` and `apps`. ^C008

> [!sources]- C008 · behaviour · verified 9374dfb
> - `package.json` › ""check": "deno run --allow-read scripts/check.root.manifest.ts &&"
> - `package.json` › "deno run -A scripts/journal.ts check && nx run-many --parallel=10 -t typecheck lint format""
> - `package.json` › ""check:circular": "madge --circular --extensions ts,tsx packages apps","
> - `scripts/check.root.manifest.ts` › "["workspaces", "catalog", "catalogs"]"
> - `scripts/check.root.manifest.ts` › "pnpm-workspace.yaml is the source of truth"
> - why: [[domains/infra/decisions#^D006]]
> - from: [[_archive/house-style-linting/decisions#Lint infra changes (2026-07-01)]]

A package exposes `.` → `src/index.ts` and `./*` → `src/*/index.ts`, so every unit directory is
importable as a subpath (`@kuib-ai/std` additionally names `./pino`). The root `src/index.ts`
default-exports a namespace object of the package's values (`Env`, `Config`, `Std`,
`Telemetry`); types are imported from unit subpaths. ^C009

> [!sources]- C009 · structure · verified 9374dfb
> - `packages/env/package.json` › ""./*": "./src/*/index.ts""
> - `packages/std/package.json` › ""./pino": "./src/pino/index.ts","
> - `packages/env/src/index.ts` › `Env` · #1a60080d
> - `packages/config/src/index.ts` › `Config` · #d0e618e8
> - `packages/std/src/index.ts` › `Std` · #646ece27
> - `packages/telemetry/src/index.ts` › `Telemetry` · #3cdac00a
> - `packages/config/package.json` › ""./*": "./src/*/index.ts""
> - `packages/telemetry/package.json` › ""./*": "./src/*/index.ts""
> - why: [[domains/infra/decisions#^D015]]
> - from: [[_archive/house-style-linting/decisions#The house style (audited from the author's hand-written reference codebase)]]

`eslint.config.ts` is a flat config loaded from TypeScript: it ignores build output, `.nx`,
`.references` and the generated Deno declarations, applies the JS and typescript-eslint
recommended sets, and applies the house-style plugin's `recommended` rules to
`apps/**/*.{ts,tsx}` and `packages/**/*.{ts,tsx}`. Test files turn off
`house/require-context-link`, `house/named-exports-are-types` and `house/dot-case-filename`.
Prettier formats everything except the lockfile, `journal`, `.agents` and `.claude`. ^C010

> [!sources]- C010 · behaviour · verified 9374dfb
> - `eslint.config.ts` › "rules: houseStylePlugin.configs.recommended.rules,"
> - `eslint.config.ts` › ""packages/deno-types/index.d.ts","
> - `eslint.config.ts` › "files: ["**/*.test.ts", "**/*.test.tsx"],"
> - `.prettierignore` › "journal"
> - `package.json` › ""jiti": "catalog:","
> - why: [[domains/infra/decisions#^D015]]
> - from: [[_archive/house-style-linting/decisions#Lint infra changes (2026-07-01)]]

## Environment (`@kuib-ai/env`)

`bootstrapEnv(schema, mode, cwd)` finds the workspace root by walking up from `cwd` to the first
directory holding `pnpm-workspace.yaml` (falling back to `cwd`), loads `.env.<mode>` and then
`.env` from it without overriding existing variables, and returns `schema.parse(process.env)`.
The effective order is OS environment over `.env.<mode>` over `.env`; `mode` defaults to
`NODE_ENV`, else `development`. ^C011

> [!sources]- C011 · behaviour · verified 9374dfb
> - `packages/env/src/bootstrap.env/index.ts` › `bootstrapEnv` · #f5b44955
> - `packages/env/src/workspace.root/index.ts` › `findWorkspaceRoot` · #4c1bfc3e
> - test: `packages/env/src/bootstrap.env/index.test.ts` › "keeps OS environment above mode and base dotenv files"
> - test: `packages/env/src/bootstrap.env/index.test.ts` › "keeps the mode dotenv file above the base dotenv file"
> - test: `packages/env/src/bootstrap.env/index.test.ts` › "throws when the resolved env is invalid"
> - test: `packages/env/src/workspace.root/index.test.ts` › "walks up to the directory containing pnpm-workspace.yaml"
> - test: `packages/env/src/workspace.root/index.test.ts` › "returns the original start when the marker is never found"
> - why: [[domains/infra/decisions#^D013]]
> - from: [[_archive/architecture-overview/decisions#Config & Env Resolution (`@kuib-ai/env`, 2026-07-01)]]

`resolveDirs` returns five base directories — `config`, `data`, `state`, `cache`, `runtime` —
with no application name appended. Outside production (`NODE_ENV !== "production"`) each base is
`<workspace>/dist/<kind>`; in production it is the platform base. The `dev` option forces
either branch, `cwd` picks the workspace, and `platform` (`darwin | linux | win32`) routes
`win32` to Windows bases and everything else to Unix bases. ^C012

> [!sources]- C012 · behaviour · verified 9374dfb
> - `packages/env/src/resolve.dirs/index.ts` › `resolveDirs` · #cad82863
> - `packages/env/src/resolve.dir/index.ts` › `resolveDir` · #3651d5c3
> - `packages/env/src/resolve.is.dev/index.ts` › `resolveIsDev` · #a33e54a2
> - `packages/env/src/is.production/index.ts` › `isProduction` · #c34a00ec
> - `packages/env/src/resolve.dev.root/index.ts` › `resolveDevRoot` · #2fe1cd92
> - `packages/env/src/resolve.platform.base/index.ts` › `resolvePlatformBase` · #ef17490c
> - `packages/env/src/resolve.dirs.options/index.ts` › `ResolveDirsOptions` · #2ece0060
> - `packages/env/src/base.dirs/index.ts` › `BaseDirs` · #72194161
> - `packages/env/src/path.kind/index.ts` › `PathKindEnum` · #90785b05
> - test: `packages/env/src/resolve.dirs/index.test.ts` › "returns the five bases under dist in development"
> - test: `packages/env/src/resolve.dir/index.test.ts` › "uses the platform base in production (no app suffix)"
> - test: `packages/env/src/resolve.dir/index.test.ts` › "honors { dev: true } in production"
> - test: `packages/env/src/resolve.platform.base/index.test.ts` › "routes win32 to Windows bases"
> - why: [[domains/infra/decisions#^D010]]
> - why: [[domains/infra/decisions#^D012]]
> - from: [[_archive/application-directories/decisions#Infra API contract (`@kuib-ai/env`)]]

On Linux and macOS the bases follow XDG: `$XDG_CONFIG_HOME`, `$XDG_DATA_HOME`,
`$XDG_STATE_HOME`, `$XDG_CACHE_HOME` and `$XDG_RUNTIME_DIR`, defaulting to `~/.config`,
`~/.local/share`, `~/.local/state`, `~/.cache` and the OS temp directory. Relative or empty
values are ignored. ^C013

> [!sources]- C013 · behaviour · verified 9374dfb
> - `packages/env/src/resolve.unix.base/index.ts` › `resolveUnixBase` · #e207dcf0
> - test: `packages/env/src/resolve.unix.base/index.test.ts` › "prefers XDG_* env vars when set"
> - test: `packages/env/src/resolve.unix.base/index.test.ts` › "falls back to the XDG defaults"
> - test: `packages/env/src/resolve.unix.base/index.test.ts` › "ignores relative XDG paths"
> - why: [[domains/infra/decisions#^D011]]
> - from: [[_archive/application-directories/decisions#macOS — Apple Library vs CLI expectation]]

On Windows a set `XDG_*` variable still wins; otherwise `config` is `%APPDATA%` (roaming),
`data`, `state` and `cache` are `%LOCALAPPDATA%`, each falling back to
`%USERPROFILE%\AppData\{Roaming,Local}`, and `runtime` falls back to `%TEMP%`, then the OS temp
directory. Non-absolute values are ignored. ^C014

> [!sources]- C014 · behaviour · verified 9374dfb
> - `packages/env/src/resolve.windows.base/index.ts` › `resolveWindowsBase` · #c94f58af
> - test: `packages/env/src/resolve.windows.base/index.test.ts` › "maps config to APPDATA and data/state/cache to LOCALAPPDATA"
> - test: `packages/env/src/resolve.windows.base/index.test.ts` › "prefers XDG_* when set on Windows"
> - test: `packages/env/src/resolve.windows.base/index.test.ts` › "falls back to TEMP for runtime"
> - test: `packages/env/src/resolve.windows.base/index.test.ts` › "ignores relative XDG and AppData paths"
> - why: [[domains/infra/decisions#^D011]]
> - from: [[_archive/application-directories/decisions#Windows — Known Folders]]

## Configuration (`@kuib-ai/config`)

`bootstrapConfig({ cwd, mode, cli })` loads the environment through `bootstrapEnv` with a schema
of `KUIB_*` variables, resolves application paths, then deep-merges three layers in increasing
precedence: the TOML config file, the environment (`KUIB_NODE_LABEL`, `KUIB_TARGET_NODE`,
`KUIB_MODEL`, `KUIB_MODEL_BASE_URL`, `KUIB_LOG_LEVEL`, `KUIB_TRACE_ENDPOINT`, `KUIB_WEB_PORT`,
`KUIB_SECURITY_PROFILE`) and CLI overrides (target node, model, log level, web port). When only
`KUIB_MODEL_ID` or `KUIB_MODEL_BASE_URL` is set, the model becomes
`openai-compatible/<id>`. It returns `{ config, paths, secrets, runtime }`. ^C015

> [!sources]- C015 · behaviour · verified 9374dfb
> - `packages/config/src/bootstrap.config/index.ts` › `bootstrapConfig` · #3eae28bb
> - `packages/config/src/bootstrap.config/index.ts` › `BootstrapEnv` · #6f3a285e
> - `packages/config/src/bootstrap.config/index.ts` › `merge` · #6deff37a
> - `packages/config/src/config.overrides/index.ts` › `ConfigOverrides` · #fdc9af1d
> - test: `packages/config/src/bootstrap.config/index.test.ts` › "applies config file, environment, then CLI precedence"
> - test: `packages/config/src/bootstrap.config/index.test.ts` › "loads an alternate config file selected by CLI"
> - why: [[domains/infra/decisions#^D013]]
> - from: [[_archive/architecture-overview/decisions#Config & Env Resolution (`@kuib-ai/env`, 2026-07-01)]]

The config file schema is strict — unknown sections or keys are rejected — and every section
defaults when absent: `[node] label`, `[target] node`, `[model] default` (default
`groq/llama-3.3-70b-versatile`) and `base_url`, `[logging] level` (default `info`),
`[telemetry] endpoint`, `[web] port` (default 4321) and `[security] profile`
(`development | production | readonly`, default `development`). The node label defaults to
`<user>@<hostname>` and the target node to the local label; the result is re-validated as
`KuibConfig` with `model.baseURL` in camelCase. `config.example.toml` documents these
sections. ^C016

> [!sources]- C016 · behaviour · verified 9374dfb
> - `packages/config/src/kuib.config.file/index.ts` › `KuibConfigFile` · #af2d8d54
> - `packages/config/src/kuib.config.file/index.ts` › `ModelConfigFile` · #49cf72af
> - `packages/config/src/kuib.config.file/index.ts` › `SecurityConfigFile` · #f11bee67
> - `packages/config/src/kuib.config/index.ts` › `KuibConfig` · #f83d626e
> - `packages/config/src/bootstrap.config/index.ts` › "`${userInfo().username}@${hostname()}`"
> - `config.example.toml` › "Persistent, non-secret Kuib configuration."
> - test: `packages/config/src/bootstrap.config/index.test.ts` › "rejects unknown config fields instead of silently ignoring typos"
> - test: `packages/config/src/bootstrap.config/index.test.ts` › "loads defaults and derives all development application paths"
> - why: [[domains/infra/decisions#^D013]]
> - from: [[_archive/security-model/decisions#Security Profiles — Per-Device (User-Configurable)]]

`resolveAppPaths` appends `kuib/` to the base directories: `config.toml` and `mesh.config.toml`
under config, `kuib.db` under data, `kuib.log` under state, `daemon.sock` and `engine.sock`
under runtime, and a cache directory. Each file path except the cache directory can be overridden;
`bootstrapConfig` takes the override from the CLI first, then `KUIB_CONFIG`,
`KUIB_MESH_CONFIG`, `KUIB_DB_PATH`, `KUIB_LOG_PATH`, `KUIB_DAEMON_SOCKET`,
`KUIB_ENGINE_SOCKET`, and uses development bases unless the mode is `production`. Resolving
paths creates nothing; `ensureAppPaths` creates the parent directories on request, with socket
directories at mode `0700`. ^C017

> [!sources]- C017 · behaviour · verified 9374dfb
> - `packages/config/src/resolve.app.paths/index.ts` › `resolveAppPaths` · #4cabfc63
> - `packages/config/src/app.paths/index.ts` › `AppPaths` · #736ff54e
> - `packages/config/src/ensure.app.paths/index.ts` › `ensureAppPaths` · #b5655b72
> - test: `packages/config/src/bootstrap.config/index.test.ts` › "derives production paths from platform base directories"
> - test: `packages/config/src/bootstrap.config/index.test.ts` › "creates application directories only when explicitly requested"
> - why: [[domains/infra/decisions#^D010]]
> - from: [[_archive/application-directories/decisions#Example consumer layout (after app suffix)]]
> - from: [[_archive/security-model/decisions#Per-user daemon scoping & local auth (2026-07-01)]]

Provider secrets (`KUIB_GROQ_API_KEY`, `KUIB_ANTHROPIC_API_KEY`, `KUIB_META_API_KEY`,
`KUIB_MIMO_API_KEY`, `KUIB_MODEL_API_KEY`) and operational values (mode, session id defaulting
to `default`, daemon URL and port, Tailscale web IP, web dev flag, MiMo base URL) are returned as
`secrets` and `runtime`, never inside `KuibConfig`. `.env` files are gitignored except
`.env.example`, which lists these secrets and the path and preference overrides. ^C018

> [!sources]- C018 · behaviour · verified 9374dfb
> - `packages/config/src/bootstrap.config/index.ts` › `ProviderSecrets` · #5c6417de
> - `packages/config/src/bootstrap.config/index.ts` › `RuntimeConfig` · #c0a13082
> - `.env.example` › "Development secrets and punch-through overrides only."
> - `.gitignore` › "!.env.example"
> - test: `packages/config/src/bootstrap.config/index.test.ts` › "keeps secrets and operational overrides outside KuibConfig"
> - why: [[domains/infra/decisions#^D013]]
> - from: [[_archive/architecture-overview/decisions#Config & Env Resolution (`@kuib-ai/env`, 2026-07-01)]]

## Shared primitives (`@kuib-ai/std`)

`Logger` is a port with `debug`, `info`, `warn`, `error` — each taking a message, or a bindings
object and an optional message — and `child(bindings)`. It has three implementations:
`createNoopLogger`, `createConsoleLogger` (injectable sink, optional `name` binding) and
`createPinoLogger` under `@kuib-ai/std/pino`, which writes synchronously to a file
`destination`, pretty-prints through `pino-pretty` when asked, or writes JSON to stdout, and
serializes `err` fields as protocol errors when they parse as one. Levels are `LogLevelEnum`
(`fatal` … `trace`). ^C019

> [!sources]- C019 · behaviour · verified 9374dfb
> - `packages/std/src/logger.port/index.ts` › `Logger` · #c66a2f74
> - `packages/std/src/create.noop.logger/index.ts` › `createNoopLogger` · #88773346
> - `packages/std/src/create.console.logger/index.ts` › `createConsoleLogger` · #1cd9a7e5
> - `packages/std/src/pino/index.ts` › `createPinoLogger` · #0cfa58d8
> - `packages/std/src/pino/index.ts` › `serializeErr` · #7c2fe076
> - `packages/std/src/log.level.enum/index.ts` › `LogLevelEnum` · #69fb04ff
> - test: `packages/std/src/pino/index.test.ts` › "writes structured lines to a file destination"
> - test: `packages/std/src/create.console.logger/index.test.ts` › "forwards info with bindings to the sink"
> - test: `packages/std/src/create.noop.logger/index.test.ts` › "accepts log calls without throwing"

Log scopes carry ambient fields through async work. `withScope(bindings, fn)` pushes bindings on
an `AsyncLocalStorage` stack for the duration of `fn` (popped when a returned promise settles,
including on rejection); every logger implementation wraps its emit functions so the merged
scope — inner keys winning — is added to each line; `bindLogger` snapshots the current scope into
a child logger. `scripts/demo-log-scope.ts` demonstrates this with pino-pretty. ^C020

> [!sources]- C020 · behaviour · verified 9374dfb
> - `packages/std/src/log.scope/index.ts` › `withScope` · #5c8fddb3
> - `packages/std/src/log.scope/index.ts` › `wrapLogFn` · #273346fa
> - `packages/std/src/log.scope/index.ts` › `bindLogger` · #84ffe685
> - `scripts/demo-log-scope.ts` › "Demo: ambient log scopes with pino-pretty formatting."
> - test: `packages/std/src/log.scope/index.test.ts` › "merges nested scopes; inner wins on key clash"
> - test: `packages/std/src/log.scope/index.test.ts` › "isolates concurrent roots"
> - test: `packages/std/src/log.scope/index.test.ts` › "pops nested scope when the inner async work rejects"

`withError` turns a promise, an async function or a sync function into a `Result` tuple —
`[error, null]` or `[null, value]` — so callers branch with `isErr` instead of `try/catch`.
Failures go through `mapError` unless a mapper is passed: a value that already parses as a
protocol `AnyError` passes through; anything else becomes an `UNKNOWN` error carrying the message
and any `stdout`, `stderr`, `code` and `statusCode` fields. `errorFields(cause)` returns
`{ err }` for log calls. ^C021

> [!sources]- C021 · behaviour · verified 9374dfb
> - `packages/std/src/with.error/index.ts` › `withError` · #8c86b2fe
> - `packages/std/src/is.err/index.ts` › `isErr` · #ba058a13
> - `packages/std/src/map.error/index.ts` › `mapError` · #3a759d79
> - `packages/std/src/error.fields/index.ts` › `errorFields` · #4a457aaa
> - test: `packages/std/src/with.error/index.test.ts` › "maps async Promise rejection to Protocol.Error"
> - test: `packages/std/src/with.error/index.test.ts` › "passes through an already classified Protocol.Error"
> - test: `packages/std/src/with.error/index.test.ts` › "preserves exec-style details"
> - test: `packages/std/src/error.fields/index.test.ts` › "maps a thrown Error to unknown"
> - why: [[domains/infra/decisions#^D016]]

## Telemetry (`@kuib-ai/telemetry`)

`startTelemetry({ endpoint, serviceName })` does nothing and returns `false` when `endpoint` is
unset or empty. Otherwise it requires `serviceName`, registers a `NodeTracerProvider` whose
resource carries the service name as both `service.name` and the OpenInference project name,
exports through `OpenInferenceSimpleSpanProcessor` to an OTLP/proto exporter at
`<endpoint>/v1/traces`, registers the AI SDK's `@ai-sdk/otel` integration with
`registerTelemetry`, and returns `true`. The package reads no environment; the endpoint comes
from `[telemetry] endpoint` / `KUIB_TRACE_ENDPOINT`. ^C022

> [!sources]- C022 · behaviour · verified 9374dfb
> - `packages/telemetry/src/start.telemetry/index.ts` › `startTelemetry` · #46c1d56c
> - `packages/telemetry/package.json` › "OpenTelemetry span export for the AI SDK to Phoenix"
> - test: `packages/telemetry/src/start.telemetry/index.test.ts` › "returns false when endpoint is undefined"
> - test: `packages/telemetry/src/start.telemetry/index.test.ts` › "registers provider and telemetry and returns true when endpoint is set"
> - why: [[domains/infra/decisions#^D014]]
> - from: [[_archive/observability/decisions#Decision]]

## House-style lint rules

`@kuib-ai/eslint-plugin-house-style` registers thirteen `house/*` rules and a `recommended`
config that sets all of them to `error`, together with reused core rules: `func-style`
(`expression`), `eqeqeq` (`always`), `no-labels` off, unused vars allowed only with a `_`
prefix, `no-explicit-any`, value imports from `@kuib-ai/protocol/*` subpaths banned (types
allowed), and `no-restricted-syntax` bans on `try`/`catch`, `as unknown` and `as any`. Rules are
tested with `@typescript-eslint/rule-tester` wired to `@std/testing/bdd`. ^C023

> [!sources]- C023 · behaviour · verified 9374dfb
> - `packages/eslint-plugin-house-style/src/index.ts` › `houseStylePlugin` · #4b05c0d7
> - `packages/eslint-plugin-house-style/src/index.ts` › `recommendedRules` · #d46d5041
> - `packages/eslint-plugin-house-style/src/index.ts` › "Do not use try/catch. Handle errors explicitly via the async tuple helper."
> - `packages/eslint-plugin-house-style/package.json` › ""@typescript-eslint/rule-tester": "catalog:","
> - why: [[domains/infra/decisions#^D015]]
> - why: [[domains/infra/decisions#^D023]]
> - why: [[domains/infra/decisions#^D016]]
> - from: [[_archive/house-style-linting/decisions#Rules (final set)]]
> - from: [[_archive/house-style-linting/decisions#Lint infra changes (2026-07-01)]]

Module-shape rules:

| Rule | Enforces |
|---|---|
| `dot-case-filename` | Directories under `src/` and file stems are dot.case; `@scope` and `[param]` segments are exempt |
| `named-exports-are-types` | Named exports are types, interfaces, enums or namespaces; the unit value is the default export |
| `no-package-barrel-named-exports` | A package or app `src/index` only default-exports |
| `no-named-import-from-package-root` | `@kuib-ai/<pkg>` roots are imported as a default namespace only |
| `no-re-exports` | No `export … from` or `export * from` |
| `no-cross-package-relative` | Relative imports may not escape their `packages/*` or `apps/*` package |

^C024

> [!sources]- C024 · behaviour · verified 9374dfb
> - `packages/eslint-plugin-house-style/src/rules/dot.case.filename/index.ts` › `dotCaseFilename` · #62589781
> - `packages/eslint-plugin-house-style/src/rules/named.exports.are.types/index.ts` › `namedExportsAreTypes` · #6dafe499
> - `packages/eslint-plugin-house-style/src/rules/no.package.barrel.named.exports/index.ts` › `noPackageBarrelNamedExports` · #f008e2b3
> - `packages/eslint-plugin-house-style/src/rules/no.named.import.from.package.root/index.ts` › `noNamedImportFromPackageRoot` · #8521edb5
> - `packages/eslint-plugin-house-style/src/rules/no.re.exports/index.ts` › `noReExports` · #a0795aa8
> - `packages/eslint-plugin-house-style/src/rules/no.cross.package.relative/index.ts` › `noCrossPackageRelative` · #c82e845c
> - test: `packages/eslint-plugin-house-style/src/rules/dot.case.filename/index.test.ts` › "dot-case-filename"
> - test: `packages/eslint-plugin-house-style/src/rules/named.exports.are.types/index.test.ts` › "named-exports-are-types"
> - test: `packages/eslint-plugin-house-style/src/rules/no.package.barrel.named.exports/index.test.ts` › "no-package-barrel-named-exports"
> - test: `packages/eslint-plugin-house-style/src/rules/no.named.import.from.package.root/index.test.ts` › "no-named-import-from-package-root"
> - test: `packages/eslint-plugin-house-style/src/rules/no.re.exports/index.test.ts` › "no-re-exports"
> - test: `packages/eslint-plugin-house-style/src/rules/no.cross.package.relative/index.test.ts` › "names the escaped package boundary"
> - why: [[domains/infra/decisions#^D015]]
> - why: [[domains/infra/decisions#^D017]]
> - from: [[_archive/house-style-linting/decisions#The house style (audited from the author's hand-written reference codebase)]]
> - from: [[_archive/house-style-linting/decisions#RESOLVED: relative imports — cross-package-only ban (2026-07-01)]]

Code-form rules:

| Rule | Enforces |
|---|---|
| `no-arrow` | No arrow functions anywhere; autofixes to `function (...) {}` |
| `prefer-guard-clauses` | No `else`; an `else if` chain is reported once, at its top `if` |
| `no-prose-comments` | Only `@context`, `eslint`, `global` and `@ts-` comments |
| `named-union-members` | No inline object literal as a union member |
| `named-schema-union` | No inline `z.object()` as a Zod union member |
| `no-destructure-props` | No destructured props in JSX-returning functions in `.tsx` files |

^C025

> [!sources]- C025 · behaviour · verified 9374dfb
> - `packages/eslint-plugin-house-style/src/rules/no.arrow/index.ts` › `noArrow` · #189d7cbc
> - `packages/eslint-plugin-house-style/src/rules/prefer.guard.clauses/index.ts` › `preferGuardClauses` · #a408bd81
> - `packages/eslint-plugin-house-style/src/rules/no.prose.comments/index.ts` › `isAllowedComment` · #5d2039ac
> - `packages/eslint-plugin-house-style/src/rules/named.union.members/index.ts` › `namedUnionMembers` · #bc50c36f
> - `packages/eslint-plugin-house-style/src/rules/named.schema.union/index.ts` › `namedSchemaUnion` · #3f8ff33c
> - `packages/eslint-plugin-house-style/src/rules/no.destructure.props/index.ts` › `noDestructureProps` · #e6f0c1b0
> - test: `packages/eslint-plugin-house-style/src/rules/no.arrow/index.test.ts` › "no-arrow"
> - test: `packages/eslint-plugin-house-style/src/rules/prefer.guard.clauses/index.test.ts` › "prefer-guard-clauses"
> - test: `packages/eslint-plugin-house-style/src/rules/no.prose.comments/index.test.ts` › "no-prose-comments"
> - test: `packages/eslint-plugin-house-style/src/rules/named.union.members/index.test.ts` › "named-union-members"
> - test: `packages/eslint-plugin-house-style/src/rules/named.schema.union/index.test.ts` › "named-schema-union"
> - test: `packages/eslint-plugin-house-style/src/rules/no.destructure.props/index.test.ts` › "no-destructure-props"
> - why: [[domains/infra/decisions#^D018]]
> - why: [[domains/infra/decisions#^D019]]
> - why: [[domains/infra/decisions#^D020]]
> - from: [[_archive/house-style-linting/decisions#no-arrow: ban everywhere (2026-07-19)]]
> - from: [[_archive/house-style-linting/decisions#prefer-guard-clauses rule (2026-07-03)]]

## Agent wiring

`AGENTS.md` is the single instruction source for every agent tool, and `.agents/` holds the
tool-neutral rest: skills (`.agents/skills/<name>/SKILL.md`, `name` equal to the folder), MCP
servers (`.agents/mcp_config.json`, Antigravity format) and the shared session hook. Tool files
are adapters generated by `scripts/agents.ts sync`: `CLAUDE.md` imports `@AGENTS.md`,
`.claude/skills` is a symlink to `.agents/skills`, Gemini's `.gemini/settings.json` sets
`context.fileName` to `AGENTS.md`, and Antigravity gets an always-on rule in
`.agents/rules/agents.md` pointing at `AGENTS.md`. `.mcp.json`, `.cursor/mcp.json` and the Gemini
settings carry the same MCP servers, translating remote `serverUrl` per tool. `.claude/agents/`
holds a `Research` subagent (read by Claude Code and Cursor). ^C026

> [!sources]- C026 · structure · verified 9374dfb
> - `scripts/agents.ts` › `outputs` · #dc41efe7
> - `scripts/agents.ts` › `mcpServers` · #d223c497
> - `scripts/agents.ts` › `skillProblems` · #6e62986c
> - `CLAUDE.md` › "@AGENTS.md"
> - `AGENTS.md` › "single instruction source for every agent tool"
> - `.agents/rules/agents.md` › "trigger: always_on"
> - `.agents/mcp_config.json`
> - `.mcp.json` › "mcpServers"
> - `.cursor/mcp.json` › "mcpServers"
> - `.claude/skills`
> - `.claude/agents/Research.md`
> - why: [[domains/infra/decisions#^D024]]

Every tool runs the same session hook, `.agents/hooks/journal-context <format>`, which injects
the features in flight (`journal.ts brief`) and warns when `journal.ts check` fails. Claude Code
runs it on `SessionStart` (`startup|resume|clear|compact`, so context returns after compaction),
Gemini CLI on `SessionStart`, Cursor on `sessionStart` plus a `preCompact` reminder. The Claude
form exits early under Cursor, which also runs Claude hooks. Antigravity has no session event
and relies on its always-on rule. `.claude/settings.json` also raises auto-compact to 80%. ^C027

> [!sources]- C027 · behaviour · verified 9374dfb
> - `.agents/hooks/journal-context` › "exec \"$deno\" run -A scripts/journal.ts brief --hook \"$format\""
> - `.agents/hooks/journal-context` › "if [ \"$format\" = \"claude\" ] && [ -n \"${CURSOR_PROJECT_DIR:-}\" ]; then"
> - `scripts/agents.ts` › `claudeSettings` · #2a805e1d
> - `scripts/agents.ts` › `geminiSettings` · #0ffedced
> - `scripts/agents.ts` › `cursorHooks` · #82c18889
> - `scripts/journal.ts` › `commandBrief` · #12b88989
> - `.claude/settings.json` › "startup|resume|clear|compact"
> - `.claude/settings.json` › "\"CLAUDE_AUTOCOMPACT_PCT_OVERRIDE\": \"80\""
> - `.gemini/settings.json` › "journal-context gemini"
> - `.cursor/hooks.json` › "journal-context cursor pre-compact"
> - why: [[domains/infra/decisions#^D024]]

`pnpm agents check` (first step of `pnpm run check` after the manifest guard) fails when any
adapter is missing, stale, a symlink where a file belongs, or when a retired path
(`.claude/rules`, `.claude/hooks`, `.cursor/hooks`, `.claude/templates`) reappears; it also
requires every skill's `name` to equal its folder and a `description`. ^C030

> [!sources]- C030 · behaviour · verified 9374dfb
> - `scripts/agents.ts` › `problem` · #4901f0bc
> - `scripts/agents.ts` › "must be a regular file, not a symlink"
> - `package.json` › "deno run -A scripts/agents.ts check"
> - why: [[domains/infra/decisions#^D024]]

## Orchestration

`bin/orchestra` (a uv script) coordinates agent CLIs in one tmux session. Tasks are journal
records in the checkout it runs in — `journal/features/<feature>/tasks/<task-id>/` holding
`brief.md`, `prompt.md`, `task.toml` (status, agent, command, cwd, times, `reported`) and
`report.md` — so a worktree's orchestration is committed on its branch.
Runtime stays in tmux: a worker is the window `w:<task-id>`, the orchestrator's pane is the
session option `@orchestra_pane`. `spawn` opens the window, starts the agent's TUI, waits until
its screen settles and types the prompt (`--arg` passes it as an argument instead); `send`,
`peek`, `status` and `close` drive workers. Workers only do assigned work and never message the
orchestrator: `done` only writes the worker's own record. `watch` finds out — it returns on the
first unreported event from the records (`done`, `blocked`, `failed`), from tmux (`lost`)
or from the screens (`idle`: unchanged without `done`, flagged once per screen via a window
option) — so re-running it re-arms without repeats, and `--follow` streams one line per
event; `reconcile`
marks tasks whose window vanished as `lost` and `--respawn` relaunches them with a resume
prompt. `journal.ts check` validates task records. ^C031

> [!sources]- C031 · behaviour · verified 9374dfb
> - `bin/orchestra` › "FEATURES = ROOT / \"journal\" / \"features\""
> - `bin/orchestra` › "\"-t\", f\"{session()}:\", \"-n\", f\"w:{task.id}\", \"-c\", cwd,"
> - `bin/orchestra` › "def wait_tui_ready(pane: str, timeout: int = 90) -> bool:"
> - `bin/orchestra` › "task.update(reported=task.status)"
> - `bin/orchestra` › "events.append((task, \"idle\", \"screen unchanged and no `done` — `orchestra peek` it\"))"
> - `bin/orchestra` › "changes.append(f\"{task.id}: window was gone — respawned with a resume prompt\")"
> - `bin/orchestra` › "#!/usr/bin/env -S uv run --script"
> - `scripts/journal.ts` › `validateTasks` · #ccee1b5b
> - `.agents/skills/orchestrate/SKILL.md`
> - `.agents/skills/orchestrate/WORKER.md`
> - why: [[domains/infra/decisions#^D026]]

## Scripts

`pnpm reload` (`scripts/reload.ts`) kills the detached daemon and engine-service processes by
command-line pattern (`start.daemon`, `host-tui/src/index.ts serve`) and deletes
`daemon.sock` and `engine.sock` from the development runtime directory
`dist/runtime/kuib`, so the next host run spawns them from current code. ^C028

> [!sources]- C028 · behaviour · verified 9374dfb
> - `scripts/reload.ts` › "const patterns = ["start.daemon", "host-tui/src/index.ts serve"];"
> - `scripts/reload.ts` › "join(repoRoot, "dist", "runtime", "kuib")"
> - `package.json` › ""reload": "deno run -A scripts/reload.ts","
> - why: [[domains/infra/decisions#^D021]]
> - from: [[_archive/tool-system/decisions#Open / follow-ups]]

`pnpm design` (`scripts/design-session.sh`) idempotently converges a tmux session running
`claude "/wireframe"` in the worktree `.claude/worktrees/rupsha-design` on branch
`rupsha/design`: it creates the worktree from `master` if missing, copies the root `.env` when
absent, rebases onto `master` only when the worktree is clean (launching Claude with a
conflict-resolution prompt instead if the rebase stops, otherwise running `pnpm install`), never kills a
Claude pane already running in the worktree, and attaches unless given `--ensure-only`.
Worktrees under `.claude/worktrees` are gitignored. ^C029

> [!sources]- C029 · behaviour · verified 9374dfb
> - `scripts/design-session.sh` › "BRANCH="${BRANCH:-rupsha/design}""
> - `scripts/design-session.sh` › "CLAUDE_CMD="${CLAUDE_CMD:-claude \"/wireframe\"}""
> - `scripts/design-session.sh` › "ensure_rebased() {"
> - `scripts/design-session.sh` › "--ensure-only"
> - `package.json` › ""design": "./scripts/design-session.sh""
> - `.gitignore` › ".claude/worktrees"
> - why: [[domains/infra/decisions#^D022]]
> - from: [[_archive/ux-iteration-process/decisions#Tooling decisions]]
