---
domain: infra
summary: Workspace tooling, config/env/std/telemetry foundations, lint rules, agent wiring and the journal itself.
code: ["*", ".agents/**", ".claude/**", ".cursor/**", ".gemini/**", "scripts/**", "tooling/**", "packages/{config,env,std,telemetry,eslint-plugin-house-style,tsconfig,deno-types}/**"]
---

# Infra

## Journal system

Project context lives in `journal/` in three layers: `roadmap/` holds intent (one file per
item, with graph edges), `domains/` holds built truth tied to the code, and `features/` tracks
work in flight. Everything is markdown with YAML frontmatter. `journal/SPEC.md` is the contract
and `tooling/journal.ts` enforces it. ^journal-layers

> [!sources]- structure · verified 2026-09-23
> - `tooling/journal.ts` › `commandCheck` · #00f2344d
> - `journal/SPEC.md` › "| Intent | `roadmap/` |"
> - why: [[domains/infra/decisions#^D001]]
> - from: [[features/context-system/plan]]

`journal.ts check` validates roadmap items, domain claims and decisions, feature plans (item
fields, decisions, gaps, the frontmatter checkpoint), task briefs, wireframes, archive ledgers,
file ownership and code links: every file outside `journal/` matches exactly one domain's
`code` globs, every TS module under `apps/` and `packages/` except tests opens with a
first-line `@claim`, every `@claim` names an existing domain or claim, and a first-line link names
the file's owning domain. Generated files (`_index.md`, `roadmap/ROADMAP.md`, the AGENTS.md
block) must match a fresh `build`. Claims whose evidence changed do not fail `check`; it only
counts them. ^journal-check

> [!sources]- behaviour · verified 2026-09-23
> - `tooling/journal.ts` › `validateOwnership` · #38578dac
> - `tooling/journal.ts` › `loadTasks` · #675a8a1a
> - `tooling/journal.ts` › `loadFeatures` · #b44bc487
> - `tooling/journal.ts` › `commandCheck` · #00f2344d
> - `tooling/journal.ts` › "generated output is stale"

A claim's evidence is verified by content hash, not by git history. `journal.ts stamp` writes
into the claim's sources every code scope linked to it with `@claim` (its label and a hash of
the scope: for TS/JS the declaration or statement below the link, printed without comments so
formatting does not count; for other languages the indented block below it), hashes whole-file
sources, and dates the claim. `drift` reports a claim as broken (a cited file, quote or test is
gone), changed (a scope or file hash differs, or a link was added or removed) or unverified
(never stamped), plus per-domain attribution coverage. `gate` fails while any claim is not
fresh: truth is due at commit, not while editing. ^claim-verification

> [!sources]- behaviour · verified 2026-09-23
> - `tooling/journal.ts` › `astScopes` · #745f58e8
> - `tooling/journal.ts` › `blockScopes` · #0c9758ae
> - `tooling/journal.ts` › `indexCode` · #28754ae4
> - `tooling/journal.ts` › `claimEvidence` · #a05a02fc
> - `tooling/journal.ts` › `commandGate` · #92d743cd
> - `tooling/journal.ts` › `commandStamp` · #74f171ed
> - why: [[domains/infra/decisions#^D027]]

Code points at its explanation with `@claim` directives, the one comment the house style allows
besides tooling directives. A `@claim <domain>[/<claim>]` on the first line of a file names what
explains the whole module; `@claim <domain>/<claim>` anywhere else ties that claim to the scope
below it. Nothing points back by hand: a claim's code sources are generated from the links.
`house/require-context-link` requires the first-line link in every TS module under `apps/` and
`packages/` and reports links whose domain or claim does not exist; `journal.ts claims <file>`
lists every claim tied to a file. ^code-links

> [!sources]- behaviour · verified 2026-09-23
> - `tooling/journal.ts` › `indexCode` · #28754ae4
> - `tooling/journal.ts` › `validateOwnership` · #38578dac
> - `tooling/journal.ts` › `commandClaims` · #6f03d7d1
> - `packages/eslint-plugin-house-style/src/rules/require.context.link/index.ts` › "const CLAIM_LINK = /^\\s*@claim\\s+(.+?)\\s*$/;"
> - test: `packages/eslint-plugin-house-style/src/rules/require.context.link/index.test.ts` › "deadClaim"
> - why: [[domains/infra/decisions#^D027]]

A feature is one `plan.md`. Its frontmatter holds the lifecycle, the roadmap item, the `context`
links a session loads, and the `checkpoint` (summary, next items, blockers, and the note the
previous session left). Its body holds phases, items, decisions and gaps; each item carries
`- State:` and optional `- Decisions:`, `- Addresses:` and `- Refs:` fields, and a phase's state
is derived from its items, never stored. `journal.ts set` writes an item's state and refs;
`journal.ts checkpoint` rewrites the checkpoint; both regenerate the generated indexes. ^feature-plans

> [!sources]- behaviour · verified 2026-09-23
> - `tooling/journal.ts` › `phaseState` · #402b4e47
> - `tooling/journal.ts` › `parsePlanBody` · #a2aefc5f
> - `tooling/journal.ts` › `commandSet` · #05816e7f
> - `tooling/journal.ts` › `commandCheckpoint` · #52077489
> - why: [[domains/infra/decisions#^D028]]

`journal.ts handoff <feature>` renders a handoff from what is on disk: the checkpoint and note,
accepted decisions that record an owner `Ruling`, open gaps with their `Recommendation`,
unfinished items per phase, the feature's tasks (marking live windows) and the context claims
that need re-verification. Nobody writes a continuation by hand; only the note is written at
handoff time. ^handoff

> [!sources]- behaviour · verified 2026-09-23
> - `tooling/journal.ts` › `renderHandoff` · #92d9c7e7
> - `tooling/journal.ts` › `commandBrief` · #ad2ad783
> - `tooling/orchestra.ts` › `cmdHandoff` · #0ae89f08
> - why: [[domains/infra/decisions#^D028]]

## Workspace and tooling

The repo is one pnpm workspace over `apps/*` and `packages/*` with `catalogMode: strict`: every
dependency version lives in the default catalog and manifests reference it as `catalog:`. Deno is
itself a catalog-pinned root devDependency (build scripts allowed for `deno` and `nx`), so
`pnpm install` provisions the runtime; the root manifest pins pnpm through `packageManager` and
Node through strict `engines`. ^pnpm-workspace

> [!sources]- structure · verified 2026-09-23
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
`test` (`deno test -A --no-check`), `lint` (`eslint .`) and `format` (`prettier --write .`). ^nx-tasks

> [!sources]- behaviour · verified 2026-09-23
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
carry explicit `.ts` specifiers. ^deno-runtime

> [!sources]- behaviour · verified 2026-09-23
> - `packages/deno-types/package.json` › ""generate": "deno types > index.d.ts","
> - `packages/deno-types/package.json` › ""postinstall": "deno types > index.d.ts","
> - `packages/deno-types/.gitignore` › "index.d.ts"
> - `packages/tsconfig/base.json` › ""@kuib-ai/deno-types""
> - `packages/tsconfig/base.json` › ""allowImportingTsExtensions": true,"
> - `packages/tsconfig/package.json` · #b73fe47c
> - `packages/std/tsconfig.json` › ""extends": "@kuib-ai/tsconfig/base.json","
> - why: [[domains/infra/decisions#^D004]]
> - why: [[domains/infra/decisions#^D005]]
> - why: [[domains/infra/decisions#^D009]]

`pnpm run check` first runs `scripts/check.root.manifest.ts`, which fails if the root
`package.json` has gained `workspaces`, `catalog` or `catalogs` (Deno's pnpm-workspace
migration), then `agents.ts check`, then `journal.ts check`, then `typecheck`, `lint` and `format` across all projects
through Nx with parallelism 10. `pnpm test` runs every project's `test` target; `pnpm check:circular` runs madge
over `packages` and `apps`. ^check-pipeline

> [!sources]- behaviour · verified 2026-09-23
> - `package.json` › ""check": "deno run --allow-read scripts/check.root.manifest.ts &&"
> - `package.json` › "deno run -A tooling/journal.ts check && nx run-many --parallel=10 -t typecheck lint format""
> - `package.json` › ""check:circular": "madge --circular --extensions ts,tsx packages apps","
> - `scripts/check.root.manifest.ts` › "["workspaces", "catalog", "catalogs"]"
> - `scripts/check.root.manifest.ts` › "pnpm-workspace.yaml is the source of truth"
> - why: [[domains/infra/decisions#^D006]]
> - from: [[_archive/house-style-linting/decisions#Lint infra changes (2026-07-01)]]

A package exposes `.` → `src/index.ts` and `./*` → `src/*/index.ts`, so every unit directory is
importable as a subpath (`@kuib-ai/std` additionally names `./pino`). The root `src/index.ts`
default-exports a namespace object of the package's values (`Env`, `Config`, `Std`,
`Telemetry`); types are imported from unit subpaths. ^package-exports

> [!sources]- structure · verified 2026-09-23
> - `packages/config/src/index.ts` › `Config` · #98b19ecc
> - `packages/env/src/index.ts` › `Env` · #e748a310
> - `packages/std/src/index.ts` › `Std` · #c92e2630
> - `packages/telemetry/src/index.ts` › `Telemetry` · #18efc467
> - `packages/env/package.json` › ""./*": "./src/*/index.ts""
> - `packages/std/package.json` › ""./pino": "./src/pino/index.ts","
> - `packages/config/package.json` › ""./*": "./src/*/index.ts""
> - `packages/telemetry/package.json` › ""./*": "./src/*/index.ts""
> - why: [[domains/infra/decisions#^D015]]
> - from: [[_archive/house-style-linting/decisions#The house style (audited from the author's hand-written reference codebase)]]

`eslint.config.ts` is a flat config loaded from TypeScript: it ignores build output, `.nx`,
`.references` and the generated Deno declarations, applies the JS and typescript-eslint
recommended sets, and applies the house-style plugin's `recommended` rules to
`apps/**/*.{ts,tsx}` and `packages/**/*.{ts,tsx}`. Test files turn off
`house/require-context-link`, `house/named-exports-are-types` and `house/dot-case-filename`.
Prettier formats everything except the lockfile, `journal`, `.agents` and `.claude`. ^eslint-config

> [!sources]- behaviour · verified 2026-09-23
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
`NODE_ENV`, else `development`. ^bootstrap-env

> [!sources]- behaviour · verified 2026-09-23
> - `packages/env/src/bootstrap.env/index.ts` › `bootstrapEnv` · #ce77845e
> - `packages/env/src/workspace.root/index.ts` › `findWorkspaceRoot` · #f9838e32
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
`win32` to Windows bases and everything else to Unix bases. ^base-dirs

> [!sources]- behaviour · verified 2026-09-23
> - `packages/env/src/base.dirs/index.ts` › `BaseDirs` · #09ab202e
> - `packages/env/src/is.production/index.ts` › `isProduction` · #5296a07a
> - `packages/env/src/path.kind/index.ts` › `PathKindEnum` · #90785b05
> - `packages/env/src/resolve.dev.root/index.ts` › `resolveDevRoot` · #38ab6652
> - `packages/env/src/resolve.dir/index.ts` › `resolveDir` · #d93ba38e
> - `packages/env/src/resolve.dirs.options/index.ts` › `ResolveDirsOptions` · #1d64059f
> - `packages/env/src/resolve.dirs/index.ts` › `resolveDirs` · #12e19c9e
> - `packages/env/src/resolve.is.dev/index.ts` › `resolveIsDev` · #7d8101b0
> - `packages/env/src/resolve.platform.base/index.ts` › `resolvePlatformBase` · #8efa13b5
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
values are ignored. ^unix-dirs

> [!sources]- behaviour · verified 2026-09-23
> - `packages/env/src/resolve.unix.base/index.ts` › `resolveUnixBase` · #47443e76
> - test: `packages/env/src/resolve.unix.base/index.test.ts` › "prefers XDG_* env vars when set"
> - test: `packages/env/src/resolve.unix.base/index.test.ts` › "falls back to the XDG defaults"
> - test: `packages/env/src/resolve.unix.base/index.test.ts` › "ignores relative XDG paths"
> - why: [[domains/infra/decisions#^D011]]
> - from: [[_archive/application-directories/decisions#macOS — Apple Library vs CLI expectation]]

On Windows a set `XDG_*` variable still wins; otherwise `config` is `%APPDATA%` (roaming),
`data`, `state` and `cache` are `%LOCALAPPDATA%`, each falling back to
`%USERPROFILE%\AppData\{Roaming,Local}`, and `runtime` falls back to `%TEMP%`, then the OS temp
directory. Non-absolute values are ignored. ^windows-dirs

> [!sources]- behaviour · verified 2026-09-23
> - `packages/env/src/resolve.windows.base/index.ts` › `resolveWindowsBase` · #3d1a5ac0
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
`openai-compatible/<id>`. It returns `{ config, paths, secrets, runtime }`. ^bootstrap-config

> [!sources]- behaviour · verified 2026-09-23
> - `packages/config/src/bootstrap.config/index.ts` › `BootstrapEnv` · #17f1944c
> - `packages/config/src/bootstrap.config/index.ts` › `merge` · #ec55e9fe
> - `packages/config/src/bootstrap.config/index.ts` › `bootstrapConfig` · #d5c8ffa5
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
sections. ^config-schema

> [!sources]- behaviour · verified 2026-09-23
> - `packages/config/src/kuib.config.file/index.ts` › `ModelConfigFile` · #52ce80d8
> - `packages/config/src/kuib.config.file/index.ts` › `SecurityConfigFile` · #d7b1ddcf
> - `packages/config/src/kuib.config.file/index.ts` › `KuibConfigFile` · #6ac8f030
> - `packages/config/src/kuib.config/index.ts` › `KuibConfig` · #415c1c66
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
directories at mode `0700`. ^app-paths

> [!sources]- behaviour · verified 2026-09-23
> - `packages/config/src/app.paths/index.ts` › `AppPaths` · #d1c8bada
> - `packages/config/src/ensure.app.paths/index.ts` › `ensureAppPaths` · #2965c671
> - `packages/config/src/resolve.app.paths/index.ts` › `resolveAppPaths` · #aa8c656b
> - test: `packages/config/src/bootstrap.config/index.test.ts` › "derives production paths from platform base directories"
> - test: `packages/config/src/bootstrap.config/index.test.ts` › "creates application directories only when explicitly requested"
> - why: [[domains/infra/decisions#^D010]]
> - from: [[_archive/application-directories/decisions#Example consumer layout (after app suffix)]]
> - from: [[_archive/security-model/decisions#Per-user daemon scoping & local auth (2026-07-01)]]

Provider secrets (`KUIB_GROQ_API_KEY`, `KUIB_ANTHROPIC_API_KEY`, `KUIB_META_API_KEY`,
`KUIB_MIMO_API_KEY`, `KUIB_MODEL_API_KEY`) and operational values (mode, session id defaulting
to `default`, daemon URL and port, Tailscale web IP, web dev flag, MiMo base URL) are returned as
`secrets` and `runtime`, never inside `KuibConfig`. `.env` files are gitignored except
`.env.example`, which lists these secrets and the path and preference overrides. ^config-secrets

> [!sources]- behaviour · verified 2026-09-23
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
(`fatal` … `trace`). ^logger-port

> [!sources]- behaviour · verified 2026-09-23
> - `packages/std/src/create.console.logger/index.ts` › `createConsoleLogger` · #d162098a
> - `packages/std/src/create.noop.logger/index.ts` › `createNoopLogger` · #8c79dacb
> - `packages/std/src/log.level.enum/index.ts` › `LogLevelEnum` · #69fb04ff
> - `packages/std/src/logger.port/index.ts` › `Logger` · #c66a2f74
> - `packages/std/src/pino/index.ts` › `serializeErr` · #909c37c5
> - `packages/std/src/pino/index.ts` › `createPinoLogger` · #f4d42633
> - test: `packages/std/src/pino/index.test.ts` › "writes structured lines to a file destination"
> - test: `packages/std/src/create.console.logger/index.test.ts` › "forwards info with bindings to the sink"
> - test: `packages/std/src/create.noop.logger/index.test.ts` › "accepts log calls without throwing"

Log scopes carry ambient fields through async work. `withScope(bindings, fn)` pushes bindings on
an `AsyncLocalStorage` stack for the duration of `fn` (popped when a returned promise settles,
including on rejection); every logger implementation wraps its emit functions so the merged
scope — inner keys winning — is added to each line; `bindLogger` snapshots the current scope into
a child logger. `scripts/demo-log-scope.ts` demonstrates this with pino-pretty. ^log-scopes

> [!sources]- behaviour · verified 2026-09-23
> - `packages/std/src/log.scope/index.ts` › `withScope` · #8b5b2a52
> - `packages/std/src/log.scope/index.ts` › `bindLogger` · #fbea7bc3
> - `packages/std/src/log.scope/index.ts` › `wrapLogFn` · #1129fc15
> - `scripts/demo-log-scope.ts` › "Demo: ambient log scopes with pino-pretty formatting."
> - test: `packages/std/src/log.scope/index.test.ts` › "merges nested scopes; inner wins on key clash"
> - test: `packages/std/src/log.scope/index.test.ts` › "isolates concurrent roots"
> - test: `packages/std/src/log.scope/index.test.ts` › "pops nested scope when the inner async work rejects"

`withError` turns a promise, an async function or a sync function into a `Result` tuple —
`[error, null]` or `[null, value]` — so callers branch with `isErr` instead of `try/catch`.
Failures go through `mapError` unless a mapper is passed: a value that already parses as a
protocol `AnyError` passes through; anything else becomes an `UNKNOWN` error carrying the message
and any `stdout`, `stderr`, `code` and `statusCode` fields. `errorFields(cause)` returns
`{ err }` for log calls. ^with-error

> [!sources]- behaviour · verified 2026-09-23
> - `packages/std/src/error.fields/index.ts` › `errorFields` · #7c652a5b
> - `packages/std/src/is.err/index.ts` › `isErr` · #6360a73b
> - `packages/std/src/map.error/index.ts` › `mapError` · #8527f4c9
> - `packages/std/src/with.error/index.ts` › `withError` · #0f396939
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
from `[telemetry] endpoint` / `KUIB_TRACE_ENDPOINT`. ^start-telemetry

> [!sources]- behaviour · verified 2026-09-23
> - `packages/telemetry/src/start.telemetry/index.ts` › `startTelemetry` · #7b2942b5
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
tested with `@typescript-eslint/rule-tester` wired to `@std/testing/bdd`. ^house-plugin

> [!sources]- behaviour · verified 2026-09-23
> - `packages/eslint-plugin-house-style/src/index.ts` › `recommendedRules` · #ed0b8b26
> - `packages/eslint-plugin-house-style/src/index.ts` › `houseStylePlugin` · #978e12b4
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

^house-structure-rules

> [!sources]- behaviour · verified 2026-09-23
> - `packages/eslint-plugin-house-style/src/rules/dot.case.filename/index.ts` › `dotCaseFilename` · #989b35a5
> - `packages/eslint-plugin-house-style/src/rules/named.exports.are.types/index.ts` › `namedExportsAreTypes` · #c25a9cd0
> - `packages/eslint-plugin-house-style/src/rules/no.cross.package.relative/index.ts` › `noCrossPackageRelative` · #6069d649
> - `packages/eslint-plugin-house-style/src/rules/no.named.import.from.package.root/index.ts` › `noNamedImportFromPackageRoot` · #8327036b
> - `packages/eslint-plugin-house-style/src/rules/no.package.barrel.named.exports/index.ts` › `noPackageBarrelNamedExports` · #0d17b1ec
> - `packages/eslint-plugin-house-style/src/rules/no.re.exports/index.ts` › `noReExports` · #4b8a0905
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
| `no-prose-comments` | Only `@claim`, `eslint`, `global` and `@ts-` comments |
| `named-union-members` | No inline object literal as a union member |
| `named-schema-union` | No inline `z.object()` as a Zod union member |
| `no-destructure-props` | No destructured props in JSX-returning functions in `.tsx` files |

^house-style-rules

> [!sources]- behaviour · verified 2026-09-23
> - `packages/eslint-plugin-house-style/src/rules/named.schema.union/index.ts` › `namedSchemaUnion` · #63261d40
> - `packages/eslint-plugin-house-style/src/rules/named.union.members/index.ts` › `namedUnionMembers` · #4fefdd5f
> - `packages/eslint-plugin-house-style/src/rules/no.arrow/index.ts` › `noArrow` · #f4ca48a7
> - `packages/eslint-plugin-house-style/src/rules/no.destructure.props/index.ts` › `noDestructureProps` · #5dab4b63
> - `packages/eslint-plugin-house-style/src/rules/no.prose.comments/index.ts` › `isAllowedComment` · #5cd00597
> - `packages/eslint-plugin-house-style/src/rules/prefer.guard.clauses/index.ts` › `preferGuardClauses` · #ef2e5020
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
are adapters generated by `pnpm agents sync`: `CLAUDE.md` imports `@AGENTS.md`,
`.claude/skills` is a symlink to `.agents/skills`, Gemini's `.gemini/settings.json` sets
`context.fileName` to `AGENTS.md`, and Antigravity gets an always-on rule in
`.agents/rules/agents.md` pointing at `AGENTS.md`. `.mcp.json`, `.cursor/mcp.json` and the Gemini
settings carry the same MCP servers, translating remote `serverUrl` per tool. `.claude/agents/`
holds a `Research` subagent (read by Claude Code and Cursor). ^agent-sources

> [!sources]- structure · verified 2026-09-23
> - `tooling/agents.ts` › `mcpServers` · #afbced0a
> - `tooling/agents.ts` › `outputs` · #041a7845
> - `CLAUDE.md` › "@AGENTS.md"
> - `AGENTS.md` › "single instruction source for every agent tool"
> - `.agents/rules/agents.md` › "trigger: always_on"
> - `.agents/mcp_config.json` · #35390ac6
> - `.mcp.json` › "mcpServers"
> - `.cursor/mcp.json` › "mcpServers"
> - `.claude/skills`
> - `.claude/agents/Research.md` · #bb689ef0
> - why: [[domains/infra/decisions#^D024]]

Every tool runs the same session hook, `.agents/hooks/journal-context <format>`, which injects
`journal.ts brief` and warns when `journal.ts check` fails. The brief depends on where the
session runs: in an orchestra worker window (`w:<task>`) it names the task, its brief, the
worker protocol and, when `log.md` exists, says to resume from it; in the session's orchestrator
pane it renders the handoff of the orchestrated feature; anywhere else it lists the features in
flight with their checkpoints and how many claims need re-verification. Claude Code runs the hook on
`SessionStart` (`startup|resume|clear|compact`, so context returns after `/clear` and
compaction), Gemini CLI on `SessionStart`, Cursor on `sessionStart` plus a `preCompact` reminder.
The Claude form exits early under Cursor, which also runs Claude hooks. Antigravity has no session
event and relies on its always-on rule. `.claude/settings.json` also raises auto-compact to
80%. ^session-hook

> [!sources]- behaviour · verified 2026-09-23
> - `tooling/agents.ts` › `claudeSettings` · #9883861d
> - `tooling/agents.ts` › `geminiSettings` · #63ccffff
> - `tooling/agents.ts` › `cursorHooks` · #8ff5ba49
> - `tooling/journal.ts` › `sessionRole` · #d0bb8f3b
> - `tooling/journal.ts` › `commandBrief` · #ad2ad783
> - `.agents/hooks/journal-context` › "journal=\"tooling/journal.ts\""
> - `.agents/hooks/journal-context` › "if [ \"$format\" = \"claude\" ] && [ -n \"${CURSOR_PROJECT_DIR:-}\" ]; then"
> - `.claude/settings.json` › "startup|resume|clear|compact"
> - `.claude/settings.json` › "\"CLAUDE_AUTOCOMPACT_PCT_OVERRIDE\": \"80\""
> - `.gemini/settings.json` › "journal-context gemini"
> - `.cursor/hooks.json` › "journal-context cursor pre-compact"
> - why: [[domains/infra/decisions#^D024]]

`pnpm agents sync` is a dry run: it prints the MCP servers it would import, the adapters it
would write and any hand edits (with a diff) it would overwrite, and writes nothing. `pnpm agents
sync --force` applies it: it imports MCP servers that a tool changed in its own file back into
`.agents/mcp_config.json` (refusing when two tools disagree), rewrites every adapter, overwriting
hand edits, and records a hash of each in `.agents/generated.lock.json`, so later edits are
detectable. `pnpm agents check` (first step of `pnpm run check` after the manifest guard) fails
when an adapter is missing, stale, edited outside sync, a symlink where a file belongs, or when a
retired path (`.claude/rules`, `.claude/hooks`, `.cursor/hooks`, `.claude/templates`)
reappears; it also requires every skill's `name` to equal its folder and a `description`. ^agents-check

> [!sources]- behaviour · verified 2026-09-23
> - `tooling/agents.ts` › `handEdited` · #2aa971e0
> - `tooling/agents.ts` › `importMcpServers` · #71f1d642
> - `tooling/agents.ts` › `skillProblems` · #c6d14143
> - `tooling/agents.ts` › `sync` · #5adbcf3b
> - `tooling/agents.ts` › `check` · #2b18a230
> - `.agents/generated.lock.json` · #2b19a15f
> - `package.json` › "deno run -A tooling/agents.ts check"
> - why: [[domains/infra/decisions#^D024]]
> - why: [[domains/infra/decisions#^D029]]

## Orchestration

`pnpm orchestra` (`tooling/orchestra.ts` on the workspace Deno) coordinates agent CLIs in one
tmux session. A task is a journal record, `journal/features/<feature>/tasks/<task>/`: `brief.md`
holds the task state in its frontmatter (`status`, `role` implementer|reviewer|probe, `gate`
none|plan, plan `items`, the `grant` of paths the worker may change, agent, command, cwd,
session, times, `reported`) above the brief the orchestrator writes; the worker writes
`plan.md`, an append-only `log.md` and `report.md` next to it. Runtime stays out of the journal:
a worker is the tmux window `w:<task>`, the orchestrator pane and feature are session options,
and each task's baseline and watch state sit in a per-session runtime directory under the
system temp dir. `spawn` opens the window with `ORCHESTRA_ROOT` set, starts the agent, waits
until its screen settles and pastes the one-line worker prompt, checking it is visible before
pressing Enter, then marks the plan items `in_progress`. Workers only do assigned work and never
message the orchestrator: `done` sets their own status (`done`, `blocked`, `failed`,
`plan-ready` after writing `plan.md`, `restart` after writing `log.md`). The orchestrator
answers with `go` (appends a `## Go` section and resumes a plan-ready worker), `send`,
`restart` (clears the worker and resumes it from its log), `accept` (marks the items
`implemented` with the granted changed files as refs), `peek`, `status` and `close`. ^orchestra

> [!sources]- behaviour · verified 2026-09-23
> - `tooling/journal.ts` › `loadTasks` · #675a8a1a
> - `tooling/orchestra.ts` › `deliver` · #848ac51c
> - `tooling/orchestra.ts` › `cmdSpawn` · #33961ece
> - `tooling/orchestra.ts` › `cmdGo` · #fe60ea15
> - `tooling/orchestra.ts` › `cmdRestart` · #c19aa1c5
> - `tooling/orchestra.ts` › `cmdAccept` · #787e7085
> - `tooling/orchestra.ts` › `cmdDone` · #0a4e069f
> - `package.json` › "\"orchestra\": \"deno run -A tooling/orchestra.ts\""
> - `.agents/skills/orchestrate/SKILL.md` · #6a3f65de
> - `.agents/skills/orchestrate/WORKER.md` · #39a1ad28
> - why: [[domains/infra/decisions#^D026]]
> - why: [[domains/infra/decisions#^D030]]

`pnpm orchestra watch` is how the orchestrator finds out. Each poll it reconciles records with
windows (a running task whose window is gone becomes `lost`) and prints unreported events as
`orchestra: <task> <kind>: <detail>`, each once: from the records (`done`, `plan-ready`,
`blocked`, `failed`, `restart`, `lost`), from the screen (`idle` when it stays unchanged and
calm for `--idle` polls, `context` when the status line shows usage at or above `--cap`), and
from the worker's repository against its spawn baseline (`scope` for a changed path outside the
grant, the task folders and the domain claim files; `git` when HEAD or the branch moved). It exits
after the first poll with events, or keeps streaming with `--follow` until nothing runs;
`reconcile --respawn` relaunches lost workers with a resume prompt. `handoff` arms a guard,
run by the tmux server, that waits until the orchestrator pane is calm, sends `/clear` and types a
resume line; the session hook then injects the rendered handoff. ^orchestra-watch

> [!sources]- behaviour · verified 2026-09-23
> - `tooling/orchestra.ts` › `reconcile` · #d384c2ae
> - `tooling/orchestra.ts` › `recordEvents` · #381e7ac0
> - `tooling/orchestra.ts` › `screenEvents` · #1be7ca48
> - `tooling/orchestra.ts` › `repoEvents` · #b9f58c98
> - `tooling/orchestra.ts` › `cmdWatch` · #c6073e69
> - why: [[domains/infra/decisions#^D030]]

## Scripts

`pnpm reload` (`scripts/reload.ts`) kills the detached daemon and engine-service processes by
command-line pattern (`start.daemon`, `host-tui/src/index.ts serve`) and deletes
`daemon.sock` and `engine.sock` from the development runtime directory
`dist/runtime/kuib`, so the next host run spawns them from current code. ^reload-script

> [!sources]- behaviour · verified 2026-09-23
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
Worktrees under `.claude/worktrees` are gitignored. ^design-script

> [!sources]- behaviour · verified 2026-09-23
> - `scripts/design-session.sh` › "BRANCH="${BRANCH:-rupsha/design}""
> - `scripts/design-session.sh` › "CLAUDE_CMD="${CLAUDE_CMD:-claude \"/wireframe\"}""
> - `scripts/design-session.sh` › "ensure_rebased() {"
> - `scripts/design-session.sh` › "--ensure-only"
> - `package.json` › ""design": "./scripts/design-session.sh""
> - `.gitignore` › ".claude/worktrees"
> - why: [[domains/infra/decisions#^D022]]
> - from: [[_archive/ux-iteration-process/decisions#Tooling decisions]]

The workspace's own tools live in `tooling/`, the private workspace package `@kuib-ai/tooling`:
`journal.ts`, `agents.ts` and `orchestra.ts` are single-file scripts run by the workspace Deno as
`pnpm journal`, `pnpm agents` and `pnpm orchestra`. The package declares their dependencies, so
nothing is added to the root manifest, and Nx type-checks (tsgo), lints and formats it like any
other project. Each tool dispatches on its first argument to a subcommand whose options, parsing
and `--help` come from `@kuib-ai/cli`; with no or an unknown subcommand it prints its usage.
Other one-off scripts stay single files in `scripts/`. ^workspace-tools

> [!sources]- structure · verified 2026-09-23
> - `tooling/agents.ts` › `SUBCOMMANDS` · #5e720576
> - `tooling/journal.ts` › `SUBCOMMANDS` · #4b3ccede
> - `tooling/orchestra.ts` › `SUBCOMMANDS` · #d1b7291c
> - `package.json` › "\"journal\": \"deno run -A tooling/journal.ts\""
> - `package.json` › "\"agents\": \"deno run -A tooling/agents.ts\""
> - `tooling/package.json` › "\"@kuib-ai/cli\": \"workspace:*\""
> - `pnpm-workspace.yaml` › "  - tooling"
> - why: [[domains/infra/decisions#^D030]]
