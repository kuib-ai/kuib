---
title: How kuib's plugins are cut across the workspace — opencode, pi, VS Code, Backstage, Vite and Rollup, go-plugin and Terraform, MCP, with Deno probes
date: 2026-10-25
origin: ["conversation 2026-10-25"]
---

# How kuib's plugins are cut across the workspace

Research for [[features/inference/plan]], item P06-I06, asked by the owner on 2026-10-25:
"will that be as a per package basis? … will there be inferencePluginAdapter? or
plugin.inference? or a general plugin that exposes everything that eery package does? and we
should ideally use that same interface for making all of the functionality ourselves?"

The ruling on D008 of 2026-10-25 stands under everything below: plugins implement ports of the
shape `protocol` already holds (`event.log.port`, `file.system.port`, `discovery.port`), named
like them, with kuib's own functionality registered through the same path. Where a subject shows
that ruling carrying a risk, the risk is reported; the ruling is not reopened.

CONFIRMED means the cited source, document or issue was read, or the probe was run, by the
researcher. INFERRED means reasoned from what was read. ORCHESTRATOR means a probe the
orchestrator ran on 2026-10-25 and reported in the task's messages; it is cited as such.

## What was read

All on 2026-10-25, cloned shallow and sparse under `/var/tmp/kuib-prior-art/research-plugins/`.

| Subject | Repository and commit | Prefix below |
|---|---|---|
| opencode | `anomalyco/opencode@450e7b9` (2026-10-25), `packages/` | `oc:` |
| pi | `earendil-works/pi@d5b3de2` (2026-10-25), `packages/` | `pi:` |
| VS Code | `microsoft/vscode@ef01428` (2026-10-25) | `vsc:` |
| Backstage | `backstage/backstage@2fea3e2` (2026-10-25) | `bs:` |
| Vite | `vitejs/vite@82e7aa0` (2026-10-23) | `vite:` |
| Rollup | `rollup/rollup@7726f83` (2026-10-23) | `rollup:` |
| go-plugin | `hashicorp/go-plugin@fa60f8a` (2026-10-12) | `gp:` |
| Terraform | `hashicorp/terraform@5598830` (2026-10-23) | `tf:` |
| MCP specification | `modelcontextprotocol/modelcontextprotocol@dae694f` (2026-10-23) | `spec:` |
| MCP TypeScript SDK | `modelcontextprotocol/typescript-sdk@951fe56` (2026-10-23) | `sdk:` |
| Fastify | `fastify/fastify@5df959f` (2026-10-25) | `fastify:` |
| Obsidian API | `obsidianmd/obsidian-api@9abd960` (2026-10-05) | `obsidian:` |

So `oc:core/src/plugin/internal.ts:215` means
`anomalyco/opencode@450e7b9:packages/core/src/plugin/internal.ts:215`.

Read in full by the researcher: `oc:plugin/src/effect/{plugin,registration,provider,model,aisdk,tool}.ts`,
`oc:plugin/src/effect/{PLAN,README}.md`, `oc:plugin/src/{host,source,source.bun,source.node,runtime,runtime-modules}.ts`,
`oc:core/src/plugin/{hooks,internal,module,instance,provider,service,sdk}.ts`, `oc:core/src/plugin.ts`,
`oc:core/src/plugin/provider/{vllm,dynamic}.ts`, `oc:schema/src/plugin.ts`, `oc:plugins/figma/index.ts`.
Read in part: `oc:core/src/plugin/provider/local.ts`, `oc:core/src/config/plugin/source.ts`.
Six read-only sub-agents searched the other clones; every line cited from them was reopened in
the source before it was written here. Web pages and issues are cited with their URL and the
date read. Deno is the workspace's `deno 2.9.6 (stable, release, aarch64-unknown-linux-gnu)`;
probes live under `/var/tmp/kuib-prior-art/research-plugins/probe/` and were run through
`/var/tmp/kuib-guard.sh 30 1500 --`.

Journal context read: `AGENTS.md`; inference D002–D011, D015, D019, D031, G002, G003, G007,
G016, P02-I03, P03-I01; synthesis shapes 4 and 7 and the extension axes of the four prior-art
files of 2026-10-08; engine-foundation D001, D002, D004, D007, G001–G003 and
`research/deno-namespace-bundling.md`; R009, R216, R217, R221; the claims `^protocol-ports`,
`^package-barrels`, `^house-structure-rules` and the code under them.

## How the subjects cut it

### opencode

**Unit of extension.** One plugin object, `{ id: string; effect: (context) => Effect }`
(`oc:plugin/src/effect/plugin.ts:57-60`), whose `Context` exposes 24 domains at once — `agent`,
`aisdk`, `command`, `credential`, `event`, `experimental`, `integration`, `mcp`, `model`,
`generate`, `permission`, `plugin`, `provider`, `reference`, `rpc`, `session`, `shell`, `skill`,
`storage`, `tool`, `vcs`, `websearch`, `worktree`, plus `app`, `location`, `options`
(`oc:plugin/src/effect/plugin.ts:26-55`). This is the owner's third option, "a general plugin
that exposes everything", in production. Each domain offers `transform` (replayed to rebuild a
domain's state) and some offer `hook` (a live interception point): `oc:plugin/src/effect/README.md:3-6`
"The Effect plugin API grants plugins two in-process capabilities: `hook` installs behavior at an
OpenCode extension point. `reload` reruns every transform hook for a stateful domain." The
smallest contribution is one `transform` callback editing one record, for example
`editor.update("example", (provider) => { provider.name = "Example" })` (`README.md:17-21`);
a provider is `editor.add({ info, models })` (`oc:plugin/src/effect/provider.ts:15-28`); a
language model is a hook that sets `event.language` (`oc:plugin/src/effect/aisdk.ts:5-18`).
CONFIRMED.

**Who owns the contract.** One package, `@opencode/plugin`, owns every domain's editor and hook
map (`oc:plugin/src/effect/*.ts`), while the registry is in core: `PluginHooks` keys callbacks by
`${domain}.${name}` and runs them in registration order
(`oc:core/src/plugin/hooks.ts:66-67,88-95`). Adding a hook to any part of the runtime means
editing the one plugin package and the one registry. The maintainers' own plan lists as
deferred "Typed error model", "Transform timeouts", "Cross-domain atomic rebuilds", "Automatic
dependency tracking" (`oc:plugin/src/effect/PLAN.md:507-515`) and states "The runtime does not
infer cross-domain dependencies" (`PLAN.md:405`): a plugin that reads another domain must
subscribe to that domain's update event and call `rebuild()` itself (`PLAN.md:372-403`).
CONFIRMED.

**The path built-ins take.** The plan's first goal is "Internal and external plugins use the
same public plugin API" (`oc:plugin/src/effect/PLAN.md:9`). The code at this commit does not
meet it. Built-ins are typed `InternalPlugin = Plugin<Requirements | Scope.Scope>`
(`oc:core/src/plugin/internal.ts:215`), where `Requirements` is a list of 49 internal services
— `Config`, `Credential`, `Session`, `Permission`, `Npm`, `LLMClient`, `KV` and the rest
(`internal.ts:109-159`) — provided to every built-in before it runs
(`internal.ts:278-287`: `effect: (host) => plugin.effect(host).pipe(Effect.provide(context))`).
The built-in vLLM provider pulls `Config.Service`, `Environment.Service` and `Location.Service`
from that context (`oc:core/src/plugin/provider/local.ts:43-45`); the dynamic provider pulls
`Npm.Service` to install an AI SDK package at runtime (`oc:core/src/plugin/provider/dynamic.ts:9-15`).
None of these is in the public `Context`. A third party cannot write the vLLM plugin as it is
written. 33 providers ship this way (`oc:core/src/plugin/provider.ts:36-70`). CONFIRMED.

**Loading and isolation.** In process, on Bun or Node. A configured plugin is a string
(`"pkg"`, `"-pkg"` to remove) or `{ package, options }` (`oc:core/src/config/plugin/source.ts:113-119`);
a package target is **installed with npm at load time** unless already present
(`oc:core/src/plugin/module.ts:103-109`: `yield* npm.add(operation.target)`), then the
entrypoint is resolved by subpath (`server`, `tui`, `rpc`; `oc:plugin/src/host.ts:17-44`) and
imported (`host.ts:46-48`). The only gate is a managed policy that may deny
`integration.use` for `plugin:<target>` (`module.ts:52-59`). There is no hash, no signature and
no permission narrower than the process. A plugin may not bring its own copy of the host's
libraries: the Bun loader throws `Cannot load "…" from plugin node_modules: "…" is not provided
by OpenCode; plugins must use the host's "effect" and "@opencode/plugin" modules`
(`oc:plugin/src/runtime.ts:28-34`), and a `Bun.plugin` module interceptor substitutes the host's
copies (`runtime.ts:17-27`). On Node the same job is done with `module.registerHooks`
(`oc:plugin/src/source.node.ts:17-49`). This is the second-instance problem the orchestrator
measured in a compiled Deno host (see `## Deno`); opencode solves it with a loader hook that a
`deno compile` binary does not offer. CONFIRMED.

**Naming.** Plugin ids are free strings, branded only at the type level
(`oc:schema/src/plugin.ts:7`); built-ins use dotted ids such as `opencode.provider.vllm`
(`oc:core/src/plugin/provider/vllm.ts:15`), `opencode.provider.dynamic` (`dynamic.ts:7`),
`opencode.figma` (`oc:plugins/figma/index.ts:8`). The maintainers settled their public words in
one list: "Replayable domain registration: `transform`; Explicit domain replay: `rebuild`;
Runtime callback registration: `hook`; Registration cleanup: `dispose`; … Hook names use dotted
lifecycle names such as `"execute.before"` and `"execute.after"`" (`PLAN.md:48-58`) — and the
shipped README already says `reload` where the plan says `rebuild` (`README.md:6,141,152-162`
against `PLAN.md:53`). The source of a plugin is an enum of four: `builtin`, `package`, `local`,
`sdk` (`oc:schema/src/plugin.ts:10-21`). CONFIRMED.

**Order and conflicts.** Order is position: a `pre` list of 36 built-ins and a `post` list of
17 config projections (`oc:core/src/plugin/internal.ts:217-272`), with external plugins between
them, and the order inside `pre` carries meaning — `// Render model prompts after the patch
plugin selects the available editing tools.` (`internal.ts:233`). The plan states the rule:
"Transform order is plugin registration order, then transform registration order within the
plugin" (`PLAN.md:97`); "Hooks run sequentially in plugin and registration order. Later hooks
observe mutations made by earlier hooks" (`PLAN.md:145-146`). Two plugins editing one record
are resolved by last writer, with no detection. Two plugins with one id are fatal: `Duplicate
plugin ID` dies the activation (`oc:core/src/plugin.ts:93-98`), `duplicate instance plugin ids`
throws at bind (`oc:core/src/plugin/instance.ts:38-42`). Two ids are protected from removal by
repository config: `guarded` (`internal.ts:274-276`). CONFIRMED.

**Lifecycle.** Each activation forks a Scope; every registration is a Scope finalizer, so
closing the scope removes it (`oc:core/src/plugin/hooks.ts:71-84`, `oc:core/src/plugin.ts:47-80`).
Reactivation diffs the ordered list by `(id, revision)` and keeps only the unchanged prefix
alive: "Registrations are ordered by setup, so only the unchanged prefix can stay alive"
(`plugin.ts:108-112,127`); a failed revision is not retried by reordering (`plugin.ts:141`). A
transform that throws disables the plugin: `Plugin disabled after ${failure.state}.transform
failed` (`plugin.ts:51-53`). CONFIRMED.

**Versioning.** None in the contract: no plugin API version, no host version check, no
`engines` field read. The public `Context` is whatever `@opencode/plugin` exports at the host's
version, and the plan says the Promise API, the typed error model and transform timeouts are
"Deferred Decisions" (`PLAN.md:507-515`). CONFIRMED (absence, by reading the loader
`oc:core/src/plugin/module.ts:78-91`, which decodes only `{ id, effect | setup }`).

**Where the cut went wrong, and the harm.** (1) The first goal of the redesign is unmet at
the commit that ships it: built-ins see 49 services the public surface does not, so the public
surface is not proven sufficient by anything that matters (`internal.ts:109-159,215`). (2) A
plugin is a general object over 24 domains, so one package's growth is every plugin author's
upgrade; the plan's own migration list is seven domains wide (`PLAN.md:449-457`). (3) Loading
runs `npm add` inside the application process on a string from config (`module.ts:109`), the
same shape as the supply-chain path described in `## Trust`. (4) Order is a hand-kept list
with a comment where it matters (`internal.ts:233`). (5) The redesign is a hard break for
every existing plugin, by the maintainers' own migration guide: "V1 plugin implementations do
not run in V2. Moving a file or renaming its config entry is not enough"; "Every V2 plugin needs
a stable `id`"; the mapping table of eighteen V1 extension points to V2 APIs comes with "These
are migration destinations, not always exact renames" and "There is no direct V2 hook
corresponding to every experimental V1 hook"; the only version coupling offered is
"Published plugins should depend on a version of `@opencode/plugin` compatible with the
OpenCode release they target" (https://opencode.ai/v2/docs/build/plugins/migrate-v1/, read
2026-10-26). The V2 guide lists the plugin API as one of "three intentional breaking changes"
and places it outside the compatibility promise: "Supported V1 functionality outside those
areas is intended to remain compatible with V1" (https://opencode.ai/v2/docs/migrate-v1/,
read 2026-10-26). CONFIRMED.

### pi

**Unit of extension.** A module whose default export is a factory `(pi: ExtensionAPI) => void | Promise<void>`
(`pi:coding-agent/src/core/extensions/types.ts:2049`), loaded with jiti
(`loader.ts:579-589`: `jiti.import(extensionPath, { default: true })`; a non-function default
is silently not an extension, `:585-588`). The `ExtensionAPI` is one object: 44 `on(event, handler)`
overloads from `project_trust` to `input` (`types.ts:1601-1668`), `registerTool`,
`registerCommand`, `registerShortcut`, `registerFlag`, four renderer registrations,
`registerProvider(name, config) | registerProvider(provider)`, `unregisterProvider`,
`registerMcpServer`, `registerVirtualModel`, and an `events` bus "for extension communication"
(`types.ts:1675-1921`). The provider ladder is written in the docs: "Add models behind a
supported API → `models.json`; Change an existing provider endpoint or headers → `models.json`
or a small provider extension; Discover models dynamically → A provider with `refreshModels`;
Add a `/login` flow → … OAuth configuration; Implement an unsupported wire protocol → A
provider with `stream` or `streamSimple`" (`pi:coding-agent/docs/custom-provider.md:9-16`);
"Registering only `baseUrl` or `headers` for an existing provider preserves its built-in models"
(`:33`). The smallest code contribution is one `on()` handler; the smallest contribution of all
is a `models.json` row. CONFIRMED.

**Who owns the contract.** One package, `@earendil-works/pi-coding-agent`, owns the whole
`ExtensionAPI` (2,308 lines of `types.ts`); the model layer `pi-ai` owns a second, lower
registry keyed by **api name**: `registerApiProvider(provider, sourceId?)` sets
`apiProviderRegistry.set(provider.api, …)` (`pi:ai/src/compat.ts:128-140`), and the type is
open on purpose — `export type Api = KnownApi | (string & {})` over ten known names
(`pi:ai/src/types.ts:64-76`). Built-ins register "without clobbering existing entries: compat
may load after a test or extension has already registered an override for a builtin api id"
(`compat.ts:195-206`), and code that must know whether the built-in is still in charge
compares instances: `if (getApiProvider(model.api) !== builtinApiProviderInstances.get(model.api))
return undefined` (`:238-239`). A single string key, last writer wins, no owner recorded
beyond an optional `sourceId`. CONFIRMED.

**The path built-ins take.** Two paths. Built-in APIs are registered through the same
`registerApiProvider` a third party uses (`compat.ts:184-206`), and the coding agent's own
mcp, codemode, llama and tool-search features are extensions in the tree
(`pi:coding-agent/src/extensions/{mcp,codemode,llama,tool-search}/`). But the built-in
*providers* (Anthropic, OpenAI, …) are a generated catalogue plus ten hand-written API modules
imported statically into `BUILTIN_APIS` (`compat.ts:184-195`), and the built-in *tools*
(`read`, `bash`, `edit`, …) have typed events a custom tool does not: `BashToolCallEvent …
LsToolCallEvent` are eight named shapes while a third party's tool is `CustomToolCallEvent`
(`types.ts:1205-1256`), with eight `isXToolResult` guards for the built-ins alone
(`:1343-1364`). CONFIRMED.

**Loading and isolation.** In process, with the host's permissions, by the docs' own first
sentence: "An extension runs inside the Pi process with the same operating-system permissions.
It can inspect prompts, tool calls, files, credentials, and session history, so load extensions
only from sources you trust" (`pi:coding-agent/docs/extensions.md:5`); "Provider extensions run
inside Pi and can inspect credentials, prompts, tool definitions, model responses, and usage.
Treat them as trusted code" (`custom-provider.md:5`). Discovery: `cwd/.pi/extensions/`, then
`~/.pi/agent/extensions/`, then configured paths; one level deep; a directory with a `pi`
manifest in `package.json` declares its entries (`loader.ts:745-825,831-879`). Packages come
from `npm:`, `git:` or a local path, pinned by version, tag or commit
(`pi:coding-agent/docs/packages.md:9-14,35-40`), and are **installed at startup**: "If a
configured package fails to install at startup, for example because npm cannot reach the
registry, Pi warns about it, skips that package's resources, and keeps running. Pi tries to
install it again on the next start or `/reload`" (`packages.md:19`). The gate is project trust:
"Project packages are installed and loaded only after project trust is resolved. Packages can
execute extension code … Review third-party package source before installing it"
(`packages.md:23`); "Project trust does not limit what tool calls can access or affect"
(`security.md:33`); the first user-level extension that answers `project_trust` "owns the
decision" (`security.md:63`). The second-instance problem is documented as a rule for authors:
"Do not list host-provided packages in `dependencies`. A physical copy can bypass Pi's
extension module mapping in compiled ESM and create duplicate classes, registries, and
initialization work" (`packages.md:92`); "Installed packages load with separate module roots"
(`:94`); the loader maps host modules into the extension through jiti virtual modules
(`loader.ts:570-582`, "Compiled binaries and the bundled Node distribution use embedded modules").
CONFIRMED.

**Naming.** Events are `snake_case` strings in one union (`types.ts:1405-1441`); hooks are
named for the moment (`before_provider_request`, `after_provider_response`, `tool_execution_start`);
registrations are `register<Thing>`; the api key of a provider is a kebab string
(`"anthropic-messages"`, `types.ts:64-75`). The host package name is in the API's type
(`import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"`, `custom-provider.md:37`).
CONFIRMED.

**Order and conflicts.** Load order is discovery order (project, then global, then configured;
`loader.ts:853-876`), and every dispatch walks extensions in that order and their handlers in
registration order (`runner.ts:1096-1127`: `for (const { ext, handlers } of snapshotEventHandlers(…))
for (const handler of handlers)`). Who wins is decided per event, by hand: `emit` keeps the
*last* result and stops on `cancel` (`:1104-1109`); the comment on the next method says
"Returns the event's own action unless a handler overrides it; the last override wins"
(`:1127`); `emitToolCall` keeps the last and stops on `block` (`:1249-1268`). A handler that
throws is reported to an error sink and the next one runs (`:1111-1121`), except `user_bash`,
which "now fails closed: errors or invalid defined results abort the command without invoking
later handlers" (`pi:coding-agent/CHANGELOG.md:628`). Name conflicts: "Extension registration
conflicts no longer unload the entire later extension. All extensions stay loaded, and
conflicting command/tool/flag names are resolved by first registration in load order"
(`CHANGELOG.md:3576`); an MCP server name owned by another extension throws
(`loader.ts:480-483`). Provider registration is a queue flushed when the registry binds
(`loader.ts:215-218`), last name wins in the `pi-ai` map. CONFIRMED.

**Lifecycle.** No per-extension dispose: `reload` throws away the whole runtime — "Reload
replaces the extension runtime, so code after `await ctx.reload()` must not reuse state from the
old runtime" (`extensions.md:50`); "Release resources in `session_shutdown` even when normal
operation attempted cleanup. Keep cleanup idempotent because cancellation, reload, session
replacement, and process exit can converge on the same path" (`:377-378`). Captured handles are
poisoned after a session replacement: "Old `pi` and command `ctx` references now throw instead
of silently targeting the replaced session" (`CHANGELOG.md:2554`). CONFIRMED.

**Versioning.** None in the contract: no API version, no host range, no manifest field read by
the loader. The changelog is the contract's history: 62 "Breaking" headings in the coding
agent's changelog and 33 in `pi-ai`'s (`grep -c -i breaking` on each `CHANGELOG.md`). Among the
extension-facing breaks: `ToolDefinition.execute` parameter order changed (`CHANGELOG.md:3949`);
`session_switch` and `session_fork` removed (`:2896`); `ModelRegistry.getApiKey` replaced, then
`getApiKeyAndHeaders` replaced by `ModelRuntime.getAuth()` (`:3044,1404`); `refresh()` went
from sync to async "Extensions must await it" (`:1405`); `compat.reasoningEffortMap` moved
(`:2310`); `ContextUsage` fields became nullable (`:3658`); TypeBox 0.34 → 1.x
(`:2553,1192`); keybinding ids renamed (`:3180-3181`); custom providers' `Context` became
`TranscriptContext` and "custom providers must read them with `getCurrentSystemPrompt()`"
(`pi:ai/CHANGELOG.md:303`); `azure-openai-responses` renamed `azure` (`:150`); a stream
function "no longer type-checks" unless it returns the host's stream class (`:112`). CONFIRMED.

**Where the cut went wrong, and the harm.** (1) One object over everything means every change
in the host is a potential break for every extension, and the changelog shows it happening
roughly weekly (62 + 33 breaking sections). (2) Conflict rules differ by event — last wins
here, first wins there, fail-closed in one place — and each had to be decided after a bug:
pi#9068, "user_bash silently falls back to host execution when an execution-routing extension
fails" (opened 2026-09-03, closed 2026-09-16 by PR #9662): "When the handler throws, the
handler failure is caught and execution continues without custom operations … For an extension
acting as the execution-domain provider, however, this is fail-open behavior. The extension
error is reported, but the command still executes. A configured execution domain must not
silently degrade to host execution" (https://github.com/earendil-works/pi/issues/9068, read
2026-10-26; the fix is `CHANGELOG.md:628`). A hook that "runs the next handler on error" is
the wrong rule for a hook that routes execution, and nothing in a one-rule-per-event design
says so in advance. (3) The open `Api` string with last-writer
registration makes "is the built-in still in charge" an identity comparison in core
(`compat.ts:239`). (4) Startup installs packages from the network, and failure is a warning
(`packages.md:19`). (5) The second-instance problem is pushed onto authors as a manifest rule
(`packages.md:92`) with a warning when detected, not a mechanism. (6) Built-in tools carry typed
events third-party tools do not (`types.ts:1205-1256`): the public contract is narrower than
the one the built-ins use.

### VS Code

**Unit of extension.** An extension is a package whose manifest declares, as data, what it
contributes and when it wakes: `name`, `publisher`, `version`, `engines: { vscode }`, `main?`,
`browser?`, `activationEvents?`, `extensionDependencies?`, `extensionPack?`, `contributes?`,
`enabledApiProposals?`, `api?`, `capabilities?`
(`vsc:src/vs/platform/extensions/common/extensions.ts:357-389`). Each key under `contributes`
is a **contribution point** the host registers with a name, a JSON schema and an optional
generator of implicit activation events (`vsc:src/vs/workbench/services/extensions/common/extensionsRegistry.ts:663-674`);
59 such names exist (`extensionPoints.json`, generated from the AST by
`build/lib/extractExtensionPoints.ts`). Registration refuses a duplicate name — `Duplicate
extension point: …` — and slots the schema under `contributes.<name>` in the package.json
schema (`extensionsRegistry.ts:680-694`); exactly one handler per point ("Handler already
set!", `:128-131`). Code is the second half: `activate(context)` returns the extension's
exports and `deactivate()` runs on shutdown (`vsc:src/vs/workbench/api/common/extHostExtensionActivator.ts:18-21`);
`context.subscriptions` holds the disposables the host disposes at deactivation
(`vsc:src/vscode-dts/vscode.d.ts:8418-8431`). CONFIRMED.

**Who owns the contract.** The host, in two layers that are owned differently. Contribution
points are owned by the feature that registers them, inside the workbench, each with its own
schema and handler (the pattern: `ExtensionsRegistry.registerExtensionPoint<T>({ extensionPoint:
'jsonValidation', jsonSchema: {…} })`, `vsc:src/vs/workbench/api/common/jsonValidationExtensionPoint.ts:26-31`;
`setHandler((extensions, { added, removed }) => …)`, `configurationExtensionPoint.ts:262`). The
code API is one file, `vscode.d.ts`, 21,241 lines, built as one `typeof vscode` object per
extension by a factory (`vsc:src/vs/workbench/api/common/extHost.api.impl.ts:137-152,291,2009`)
and handed to the extension by intercepting `require('vscode')`: the requesting file's path
selects the extension and its API instance (`vsc:src/vs/workbench/api/common/extHostRequireInterceptor.ts:148-172`,
`vsc:src/vs/workbench/api/node/extHostExtensionService.ts:44-55`). Beside the stable file sit 184
`vscode.proposed.<name>.d.ts` files, each gated by `checkProposedApiEnabled(extension, '<name>')`
— 155 call sites in the API factory — which throws `Extension '…' CANNOT use API proposal: …`
(`vsc:src/vs/workbench/services/extensions/common/extensions.ts:326-337`). CONFIRMED.

**The path built-ins take.** The same API object, with two privileges. The git extension
imports only `'vscode'` and Node (50 files import `from 'vscode'`, 0 import `vs/` internals under
`extensions/git/src`) and declares `engines.vscode: ^1.5.0` (`vsc:extensions/git/package.json:8-10`).
Privilege one: proposed API. Git lists 34 `enabledApiProposals`, the TypeScript extension 5;
a non-built-in's declaration is nulled — `if (!extension.isBuiltin && isNonEmptyArray(extension.enabledApiProposals))
{ // restrictive: extension cannot use proposed API in this context and its declaration is
nulled` (`vsc:src/vs/workbench/services/extensions/common/extensionsProposedApi.ts:110-113`) —
unless the product's `product.json` lists it or `--enable-proposed-api` is passed. Privilege
two: no version check — `if (extensionIsBuiltin || (… no main and no browser …)) { // No
version check for builtin or declarative extensions  return true; }`
(`vsc:src/vs/platform/extensions/common/extensionValidator.ts:333-341`), which is why git's
`^1.5.0` is never enforced. Both are flags on the record, not a different code path. CONFIRMED.

**Loading and isolation.** Out of process. The extension host is an Electron utility process
started with `entryPoint: 'vs/workbench/api/node/extensionHostProcess'` and
`allowLoadingUnsignedLibraries: true` (`vsc:src/vs/platform/extensions/electron-main/extensionHostStarter.ts:114-125`);
three kinds exist, `LocalProcess`, `LocalWebWorker`, `Remote` (`extensionHostKind.ts:9-13`), and
the web-worker host runs in an iframe with `sandbox="allow-scripts allow-same-origin"`
(`webWorkerExtensionHost.ts:145-147`). Renderer and host speak over an RPC protocol of proxy
pairs — `MainThreadCommands` / `ExtHostCommands`, 171 identifiers in
`vsc:src/vs/workbench/api/common/extHost.protocol.ts` (`:4206-4300`). Inside the Node host there
is no sandbox: the only module interception is a blocklist of one package, `natives`, "by
patching the node require() function" (`vsc:src/vs/workbench/api/node/extensionHostProcess.ts:76-91`);
`process.exit` is monkey-patched to a warning (`:94-104`). The manifest's `capabilities.untrustedWorkspaces`
is an enable/disable gate for untrusted folders, not a capability model
(`vsc:src/vs/platform/extensions/common/extensions.ts:289-314`; default for an extension with
`main` and no declaration: not supported, `extensionManifestPropertiesService.ts:276-309`).
Identity is `publisher.name`, compared case-insensitively (`extensionManagementUtil.ts:76-82`,
`extensions.ts:448-488`). CONFIRMED.

**Naming.** Contribution points are camelCase nouns of the thing contributed (`commands`,
`configuration`, `jsonValidation`, `languages`); activation events are `on<Thing>:<arg>`
(`onLanguage:typescript`, `onCommand:…`, `onFileSystem:git`, plus `*` and `onStartupFinished`);
API proposals are camelCase names of the proposal; proxies are `MainThread<Area>` /
`ExtHost<Area>`. CONFIRMED.

**Order and conflicts.** Activation is by event, not by list: events are read into a map at
registry init (`extensionDescriptionRegistry.ts:83-88`), and implicit ones are derived from
`contributes` by the point's generator (`vsc:src/vs/platform/extensionManagement/common/implicitActivationEvents.ts:49-80`),
which "can run correctly only on the renderer process because that is the only place where all
extension points and all implicit activation events generators are known" (`:25-27`).
Dependencies activate first: `// must first wait for the dependency to activate`
(`extHostExtensionActivator.ts:273-313`); a cycle removes the whole loop at registry build
(`extensionDescriptionRegistry.ts:111-113,201-202`). Conflicts are decided per point: a
duplicate configuration key is dropped with `Cannot register '{0}'. This property is already
registered.` — first wins (`configurationExtensionPoint.ts:310-314`); a duplicate command at the
API throws `command '…' already exists` (`extHostCommands.ts:155-157`); a duplicate extension
id logs `is already registered` and keeps the first, in the order "builtin, user, under
development" (`extensionDescriptionRegistry.ts:66-77`); at scan time the newer version or the
system copy wins (`extensionsScannerService.ts:374-395`). CONFIRMED.

**Versioning.** `engines.vscode` against the product version, with the rule in the schema:
"Cannot be *. For example: ^1.105.0 indicates compatibility with a minimum VS Code version of
1.105.0" (`extensionsRegistry.ts:181-183`); a version "not specific enough" or a mismatch is an
error that makes the extension invalid and drops it from the scan
(`extensionValidator.ts:349-375`, `extensionsScannerService.ts:755-765,283-285`), and the
gallery refuses to install it (`extensionGalleryService.ts:1097-1120`). The API file is
additive; what is not yet stable lives in a proposal file an ordinary extension cannot use
(`extensionsProposedApi.ts:110-113`). CONFIRMED.

**Where the cut went wrong, and the harm.** (1) The first-party advantage is structural: 34
proposals in git alone mean the API that ships a product is not the API a third party gets,
and the gate is a boolean on the record, not a mechanism anyone else can satisfy
(`extensionsProposedApi.ts:110-113`). (2) Implicit activation is a cross-process computation
with a comment admitting it can only run in one place (`implicitActivationEvents.ts:25-27`). (3)
The process boundary protects the renderer, not the user: the host has full Node, and the
authors' own fix for a crashing native module is a one-name blocklist in `require`
(`extensionHostProcess.ts:76-91`). (4) Conflict rules differ by point and are implemented in
each handler: first-wins for configuration, throw for commands, keep-first for ids — nothing
general. (5) `extensionsRegistry.ts:683` "Duplicate extension point" is an exception at startup
of the host itself: adding a point is a host change, and two features cannot share a name even
by accident.

### Backstage's backend system

**Unit of extension.** Four units, each a `BackendFeature` (an opaque `{ $$type: '@backstage/BackendFeature' }`,
`bs:packages/backend-plugin-api/src/types.ts:25-29`, with the note "This type is opaque in order
to simplify future API evolution"): a **plugin** (`createBackendPlugin({ pluginId, register(reg) })`,
`bs:packages/backend-plugin-api/src/wiring/createBackendPlugin.ts:36-55`), a **module** that
extends one named plugin (`createBackendModule({ pluginId, moduleId, register })`,
`createBackendModule.ts:36-60`; the doc on `pluginId`: "Should exactly match the `id` of the
plugin that the module extends"), an **extension point** (`createExtensionPoint<T>({ id })`,
which is only an id and a phantom type, `createExtensionPoint.ts:41-52`) and a **service**
(`createServiceRef` / `createServiceFactory`, `services/system/types.ts:105-141,238-277`). A
fifth, the feature loader, returns features from a function (`createBackendFeatureLoader.ts:26-46`).
A plugin registers the extension points it owns and one `registerInit({ deps, init })`
(`createBackendPlugin.ts:86-88,118-134`: "registerInit must only be called once",
"registerExtensionPoint called after registerInit"). CONFIRMED.

**Who owns the contract.** The plugin that is extended. A module's `registerInit` may depend on
`ServiceRef | ExtensionPoint` (`bs:packages/backend-plugin-api/src/wiring/types.ts:127-144`); a
plugin's may depend on service refs only (`types.ts:97-120`). The initializer enforces the
scope: `Illegal dependency: Module '${moduleId}' for plugin '${pluginId}' attempted to depend
on extension point '${ref.id}' for plugin '${ep.pluginId}'. Extension points can only be used
within their plugin's scope.` and `Rejected dependency on extension point ${ref.id} from
outside of a module` (`bs:packages/backend-app-api/src/wiring/BackendInitializer.ts:289-300`).
One provider per extension-point id: `ExtensionPoint with ID '…' is already registered`
(`BackendInitializer.ts:616-624`); one plugin per id and one module per `(pluginId, moduleId)`
(`:630-633,645-649`). The docs state the rule: "Extension points for a given plugin are also
only accessible to modules that extend that same plugin"
(`bs:docs/backend-system/architecture/05-extension-points.md:10`). This is the owner's first
option — each package defines its own contract — made mechanical: the contract is a typed id
exported from a `-node` library, and a third party extends it with a module that names the
plugin. CONFIRMED.

**The path built-ins take.** The same one. The catalog plugin is `createBackendPlugin({ pluginId:
'catalog', register(env) { … env.registerInit({ deps: { logger: coreServices.logger, config:
coreServices.rootConfig, …` (`bs:plugins/catalog-backend/src/service/CatalogPlugin.ts:107-109,181-184`,
read from the commit object) and registers its extension points through the public
`env.registerExtensionPoint` (`:120-122,154,173,176-178`); the GitHub module is
`createBackendModule({ pluginId: 'catalog', moduleId: 'github', …` depending on
`catalogProcessingExtensionPoint` (`bs:plugins/catalog-backend-module-github/src/module/githubCatalogModule.ts:38-55`).
`grep -rn -E "backend-app-api|backend-defaults|@internal/" plugins/catalog-backend/src` finds
nothing: the first-party catalog imports nothing a third party could not. The framework itself
does use internals (`BackendInitializer.ts:33-42`, `from '@internal/backend'` and a relative
import into `backend-plugin-api/src` "to avoid duplication"), but that is the host, not a
plugin. CONFIRMED.

**Loading and isolation.** `backend.add(feature | Promise<{ default: BackendFeature }>)`
(`bs:packages/backend-app-api/src/wiring/types.ts:55-59`), so `backend.add(import('@backstage/plugin-catalog-backend'))`
is the documented spelling (`bs:docs/backend-system/architecture/02-backends.md:20-29`); every
feature is validated at start for `$$type`, `version === 'v1'` and a `featureType` of
`service | registrations | loader` (`validateBackendFeature.ts:298-332`). Opt-in discovery reads
`backend.packages` from config and `require()`s each dependency of the backend's own
`package.json` whose `backstage.role` is a backend role (`bs:packages/backend-defaults/src/PackageDiscoveryService.ts:93-118,145-177`):
the set of loadable code is the backend's declared dependency tree, nothing fetched at runtime.
Everything runs in one Node process; "isolation" is a deployment choice: "Each plugin operates
completely independently of all other plugins and they only communicate with each other
through network calls … it is also possible to split this setup into multiple backends"
(`bs:docs/backend-system/architecture/04-plugins.md:8`); "Plugins must never communicate with
each other directly through code" (`:80`). No sandbox, no permission model. CONFIRMED.

**Naming.** Written down as a table (`bs:docs/backend-system/architecture/08-naming-patterns.md`):
plugin export `<camelId>Plugin`, id `'<kebab-id>'` (`:16-17`); module export
`<pluginId>Module<ModuleId>`, id `'<module-id>'` (`:32-33`); extension point interface
`<PluginId><Name>ExtensionPoint`, reference `<pluginId><Name>ExtensionPoint`, id
`'<pluginId>.<name>'` (`:49-51`); service interface `<Name>Service`, reference `<name>ServiceRef`,
id `'<pluginId>.<name>'`, factory `<name>ServiceFactory` (`:70-73`); packages
`plugin-<pluginId>-backend`, `plugin-<pluginId>-node` (extension points live here),
`plugin-<pluginId>-backend-module-<moduleId>` (`01-index.md:65-70`). Ids are checked against
`/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/i` (`bs:packages/backend-plugin-api/src/wiring/constants.ts:30-31`);
the `'<pluginId>.<name>'` form of an extension point id is convention only
(`createExtensionPoint.ts:44-51` accepts any string). Core services: `core.logger`,
`core.httpRouter`, `core.rootConfig` (scope root) (`coreServices.ts:75-77,134-136,160-162`). CONFIRMED.

**Order and conflicts.** Root services first, then every plugin in parallel; inside a plugin,
modules are topologically sorted on the extension points they provide and consume, reversed —
"If a modules provides extension point A we want it to be initialized AFTER all modules that
depend on extension point A" — then the plugin itself (`BackendInitializer.ts:442-443,478-540`);
a cycle fails with `Circular dependency detected for modules of plugin '…'` (`:501-508`). There
is no plugin-to-plugin init order (`Promise.all`, `:479`). Services: one factory per service id;
a factory passed to `backend.add` silently replaces a default, a second explicit one throws
`Duplicate service implementations provided for …` (`ServiceRegistry.ts:254-262`); the
`pluginMetadata` service "cannot be overridden" (`:236-240`). Two contributions to one extension
point are the extension point's own business (the catalog's `addEntityProvider` pushes to an
array, `CatalogPlugin.ts:120-122`). CONFIRMED.

**Lifecycle.** `coreServices.lifecycle` (plugin scope) and `coreServices.rootLifecycle` with
`addStartupHook` / `addShutdownHook` (`bs:packages/backend-plugin-api/src/services/definitions/LifecycleService.ts:56-77`);
stop runs root `beforeShutdown`, then every plugin's shutdown hooks in parallel with failures
logged, then root shutdown (`BackendInitializer.ts:689-725`). Extension points are usable only
until `init` resolves: "it is not possible to further interact with the extension points once
the `init` method has resolved" (`bs:docs/backend-system/architecture/06-modules.md:10`) — there is
no runtime registration after boot. CONFIRMED.

**Versioning.** By name, not by number: "If you want to make breaking changes to an extension
point that already has some usage, we recommend that you instead deprecate the existing one and
create a new one with a different name … for example `scaffolderActionsV2ExtensionPoint`"
(`05-extension-points.md:142`); "It is a public API surface that your plugin will need to
maintain over time … you can always design an extension point interface for additions only"
(`:132`); "better to export multiple extension points with few methods" (`:12`). In
`backend-plugin-api/src` 113 exports are `@public`, 40 `@alpha` (all behind the `/alpha`
subpath), 0 `@deprecated`. Internally the registration record carries `version: 'v1'` and two
generations (`plugin` and `plugin-v1.1`) are handled side by side
(`bs:packages/backend-plugin-api/src/wiring/types.ts:159-168`, `BackendInitializer.ts:598-628`). CONFIRMED.

**Where the cut went wrong, and the harm.** The old backend is the record. Every plugin took
an "environment" object the integrator built by hand — "A `types.ts` file that defines the
'environment', i.e. the various dependencies that get created by the backend and passed down
into each plugin" and `apiRouter.use('/todo', await todo(todoEnv)); // repeated for N plugins`
(`bs:docs/backend-system/building-backends/08-migrating.md:28-51`) — so every change to a
plugin's dependencies was a change in every backend ("a significantly simplified backend
package that rarely if ever needs to change when plugins or their dependencies evolve",
`:13-16`). Builders were the extension mechanism ("Any type of builder or helper methods …
should be moved to a library package", `building-plugins-and-modules/08-migrating.md:299`), and
the whole `@backstage/backend-common` package is deprecated with the move (`:214,265`). Two
costs the new system still carries: an extension point is useless after `init` (`06-modules.md:10`),
and ownership is by convention in the id and by code only at the module boundary — nothing
stops `createExtensionPoint({ id: 'catalog.foo' })` in a package that is not the catalog.

### Vite and Rollup

**Unit of extension.** One object with many optional hooks. Rollup: `OutputPlugin { cacheKey?; name: string;
version? }` plus every hook as an optional member, and `Plugin<A> extends OutputPlugin { api?: A }`
"for inter-plugin communication" (`rollup:src/rollup/types.d.ts:597-609`); 23 hooks
(`:470-519`), partitioned at the type level into input/output, sync/async and by merge rule:
`FirstPluginHooks = 'load' | 'resolveId' | …`, `SequentialPluginHooks = 'transform' | 'renderChunk' | …`,
`ParallelPluginHooks` = the rest (`:545-568`). Any hook may be an object `{ handler, order?: 'pre' | 'post' | null }`
(`:578`), and a parallel hook may add `sequential?: boolean` (`:589-595`). The docs define the
four kinds: "`first`: … the hooks are run sequentially until a hook returns a value other than
`null` or `undefined`"; "`sequential`: … all of them will be run in the specified plugin order";
"`parallel`: … subsequent hooks of this kind will be run in parallel"
(`rollup:docs/plugin-development/index.md:91-94`). Vite's `Plugin<A> extends RolldownPlugin<A>`
(`vite:packages/vite/src/node/plugin.ts:101`) and adds Vite-only members: `enforce`, `apply`,
`applyToEnvironment`, `config`, `configEnvironment`, `configResolved`, `configureServer`,
`transformIndexHtml`, `hotUpdate`, `sharedDuringBuild`, `perEnvironmentStartEndDuringDev`
(`plugin.ts:117-374`; 21 top-level optional members). The smallest contribution is one hook on
one plugin; there is no smaller unit. CONFIRMED.

**Who owns the contract.** The host, as one type; the merge rule of each hook is part of that
type, not of the plugin. Vite's docs: "Note that this is separate from hooks ordering, those are
still separately subject to their `order` attribute" (`vite:docs/guide/api-plugin.md:639`).
Inter-plugin dependency is by `name` and `api`: "we recommend the pattern below. Note that
`api` will never conflict with any upcoming plugin hooks" and `plugins.find(plugin => plugin.name
=== parentName)` in `buildStart` (`rollup:docs/plugin-development/index.md:2440,2471-2486`).
CONFIRMED.

**The path built-ins take.** Opposite answers. Rollup has **no** internal plugins: the driver
holds exactly the user's flattened, truthy plugins (`rollup:src/Graph.ts:108`,
`src/utils/options/options.ts:254`), and default loading is an inline `fs.readFile` fallback,
not a plugin (`rollup:src/ModuleLoader.ts:281-296`); `grep -rn "name: '" rollup/src` → 0. Vite
is **built from** plugins of the public type: `cssPlugin(config): Plugin`, `assetPlugin(config): Plugin`,
`definePlugin(config): Plugin` (`vite:packages/vite/src/node/plugins/{css,asset,define}.ts:314,190,12`),
43 internal plugins named `vite:*`, 28 placed by hand in `resolvePlugins` around the three
user buckets (`vite:packages/vite/src/node/plugins/index.ts:60-155`). What the internals use
that a third party does not: an `@internal scan?: boolean` option on `resolveId` (`plugin.ts:139-142`),
casts `as Plugin` / `satisfies Plugin` to widen Rolldown plugins (`plugins/index.ts:86,125`),
and a flag set from outside the type (`(plugin as Plugin).perEnvironmentWatchChangeDuringDev = true`,
`plugins/resolve.ts:385`). No hidden hooks: `grep -n "^  _[a-zA-Z]" plugin.ts` → 0. CONFIRMED.

**Loading and isolation.** Config only, in process. `plugins: [...]` is flattened to any
depth with promises awaited and falsy entries dropped (`vite:packages/vite/src/node/config.ts:1525-1553`,
`utils.ts:1698-1705`); `apply: 'serve' | 'build' | (config, env) => boolean` filters by
command (`plugin.ts:218-221`). No discovery from disk (NOT FOUND in both). The one dynamic
import of a plugin set is gated by the `devtools` option (`config.ts:819-829`). CONFIRMED.

**Naming.** Plugin `name` is a free string, recommended `rollup-plugin-` prefixed
(`rollup:docs/plugin-development/index.md:61`); Vite's internals are `vite:<thing>`. A missing
name is synthesised — `at position N` (`rollup:src/rollup/rollup.ts:185-191`,
`pluginNames.ts:1-2`) — and only becomes an error when such a plugin touches `this.cache`
(`PluginCache.ts:62-70`). Hooks are verbs or lifecycle nouns (`resolveId`, `load`, `transform`,
`buildStart`, `renderChunk`, `configResolved`). CONFIRMED.

**Order and conflicts.** Three buckets per hook — `[...pre, ...normal, ...post]`, stable within
a bucket (`rollup:src/utils/PluginDriver.ts:435-457`) — and in Vite a second, coarser layer per
plugin: `enforce: 'pre' | 'post'` with the documented order "Alias → User plugins with
`enforce: 'pre'` → Vite core plugins → User plugins without enforce value → Vite build plugins →
User plugins with `enforce: 'post'` → Vite post build plugins" (`vite:docs/guide/api-plugin.md:627-637`,
`config.ts:2370-2385`). Who wins is the hook's kind: `resolveId` and `load` are first-non-null
(`PluginDriver.ts:159-163`; `ModuleLoader.ts:281-296`), `transform` chains every plugin's output
into the next (`src/utils/transform.ts:112-121`), `config` results are deep-merged in plugin
order with arrays concatenated and scalars last-wins (`vite:…/config.ts:2814-2852`,
`utils.ts:1470-1567`). Two plugins with one name are not detected at registration
(`DUPLICATE_PLUGIN_NAME` fires only from the cache, `rollup:src/utils/logs.ts:394-399`; Vite:
NOT FOUND — plugins are tracked by object identity, `pluginContainer.ts:168`). Every hook error
is tagged with the plugin's name (`PluginDriver.ts:396`; Vite sets `err.plugin`,
`pluginContainer.ts:924-935`). CONFIRMED.

**Lifecycle.** Build-scoped: `buildStart` … `buildEnd`/`closeBundle`; Vite's dev server adds
`configureServer` and `closeServer` (`plugin.ts:295,314`). Vite 6 made one plugin instance
serve several environments, so state must be keyed: "the plugin state needs to be keyed with
`this.environment`" (`vite:docs/guide/api-environment-plugins.md:162`), with `perEnvironmentState`
in code (`vite:packages/vite/src/node/environment.ts:20-31`) and `applyToEnvironment` to make a
non-aware plugin per-environment (`:183-214`). CONFIRMED.

**Versioning.** The plugin learns the host's version (`this.meta.rollupVersion`,
`rollup:src/rollup/types.d.ts:273-276`; Vite's `meta` carries `viteVersion`, `rollupVersion`,
`rolldownVersion`, `pluginContainer.ts:666-674`); nothing declares what the plugin needs beyond
an optional `version?: string` "for use in inter-plugin communication scenarios"
(`types.d.ts:603`, docs `:85`). Breaking changes to hooks arrive with each major: Rollup 4
"For `this.resolve`, the default of the `skipSelf` option is now `true`", "`this.moduleIds` has
been removed from the plugin context" (`rollup:CHANGELOG.md:3099-3107`); Rollup 3 removed
`this.emitAsset`, `this.resolveId`, `resolveAssetUrl` and changed "The order of plugin hooks
when generating output" (`CHANGELOG-3.md:1199-1250`); Rollup 2 changed the `writeBundle`
signature and removed `ongenerate`, `transformBundle` (`CHANGELOG-2.md:3071-3078`). Vite 8 moved
the whole plugin pipeline from Rollup to Rolldown: "All parallel hooks in Rollup work as
sequential hooks", and four hooks are "Missing support by Rolldown" (`vite:docs/guide/migration.md:363-373`);
Vite 7 removed the hook-level `enforce`/`transform` of `transformIndexHtml` (`CHANGELOG.md:1583`).
CONFIRMED.

**Where the cut went wrong, and the harm.** (1) One object, many hooks, one owner: every major
of the host rewrote the plugin contract (five majors, each with a "Plugin API Changes"
section), and the merge rule of a hook — first, sequential, parallel — changed under plugins
when the bundler underneath changed (`migration.md:363`). (2) Conflict handling is a property
of the hook kind, so a plugin author must know which kind each hook is to predict whether
their result will be seen; Vite's `enforce` adds a second ordering axis the docs must warn is
"separate from hooks ordering" (`api-plugin.md:639`). (3) Duplicate names are not an error,
so inter-plugin discovery by `name` (`index.md:2471-2486`) can bind to the wrong plugin.
(4) Vite's internals need casts and an `@internal` option to stay within the public type, the
small print of "built-ins through the same path". (5) Performance is the user's problem: "the
performance of community plugins is out of Vite's control"; `resolveId`, `load`, and `transform`
"may cause some files to load slower than others … The longer it takes to transform a file,
the more significant the request waterfall" (`vite:docs/guide/performance.md:15-29`); Rollup
removed its own async timings because "the readings were wildly inaccurate and very misleading"
(`rollup:CHANGELOG-3.md:1239`).

### HashiCorp go-plugin and Terraform providers

**Unit of extension.** A separate executable. The host launches it (`Cmd *exec.Cmd`,
`gp:client.go:155-164`), the child prints one handshake line to stdout —
`CoreProtocolVersion | AppProtocolVersion | network | address | protocol | serverCert`
(`gp:server.go:426-432`; example `1|3|unix|/path/to/socket|grpc`, `gp:docs/internals.md:36-44`) —
and the host dials it. A plugin author implements `Plugin { Server(*MuxBroker) (interface{}, error);
Client(*MuxBroker, *rpc.Client) (interface{}, error) }` or `GRPCPlugin { GRPCServer(…); GRPCClient(…) }`
(`gp:plugin.go:24-46`); a `PluginSet` is `map[string]Plugin` (`gp:server.go:57-59`). Terraform's
one plugin kind is `"provider"` implementing `providers.Interface`, 35 methods from
`GetProviderSchema()` to `Close()` (`tf:internal/providers/provider.go:15-152`). CONFIRMED.

**Who owns the contract.** The host, as a `.proto` file per major version that is frozen once
released: "Any minor versions of protocol 6 to follow should modify this file while maintaining
backwards compatibility. Breaking changes, if any are required, will come in a subsequent major
version with its own separate proto definition" (`tf:docs/plugin-protocol/tfplugin6.proto:4-12`,
protocol 6.11); "The minor version increases for each change introducing optional new
functionality that can be ignored by implementations of prior versions"; "The major version
increases for any significant change to the protocol where compatibility is broken … the
plugin handshake includes a negotiation step where client and server can work together to
select a mutually-supported major version" (`tf:docs/plugin-protocol/README.md:63-73`); "The
protobuf specification for a version is immutable after it has been included in at least one
Terraform release" (`:179-181`). The major is the protobuf package name (`tfplugin5`,
`tfplugin6`), minors are feature-detected, not on the wire (`:75-82`). Terraform supports two
majors at once: `VersionedPlugins = map[int]plugin.PluginSet{ 5: {…}, 6: {…} }`
(`tf:internal/plugin/plugin.go:11-22`) and dispatches on the negotiated number
(`tf:internal/command/meta_providers.go:494-508`, `default: panic("unsupported protocol version")`).
This is D011's "additions optional only" with the mechanism that makes it hold: a frozen file,
a number negotiated at start, and an installer that refuses what it cannot speak
(`SupportedPluginProtocols = ">= 5, <7"`, `tf:internal/getproviders/registry_client.go:61`;
`provider %s %s is not supported by this version of terraform`, `errors.go:157-176`). CONFIRMED.

**The path built-ins take.** A different one, by design and admitted. The one built-in
provider is a Go constructor in a map — `"terraform": func() (provider.Interface, error) {
return terraformProvider.NewProvider(), nil }` (`tf:internal/builtin/providers/factories.go:11-17`)
— merged into the factories under the pseudo-address `terraform.io/builtin/terraform`
(`meta_providers.go:355-382`, "The internal providers are _always_ available … because they
don't need any special installation"; `tf:internal/addrs/provider.go:21-33,66-77`). It
implements the same Go interface as the gRPC client does (`provider.go:17-25`,
`var _ providers.Interface = &Provider{}`), so the engine above it sees one type; what it skips
is the process, the handshake and the installer (`providers_mirror.go:150-152`, "Skipping %s
because it is built in to Terraform CLI"). CONFIRMED.

**Loading and isolation.** A process per provider, launched from a file the installer put in
the cache (`meta_providers.go:453-470`: `Cmd: exec.Command(execFile)`, `AutoMTLS`, `Managed: true`),
spoken to over gRPC on a local socket; `SecureConfig` can verify a checksum of the executable
before launch, with the caveat written beside it: "The host process should ensure the checksum
was provided by a trusted and authoritative source. The binary should be installed in such a
way that it can not be modified by an unauthorized user between the time of this check and the
time of execution" (`gp:client.go:317-357`). The magic cookie is explicitly "not a security
measure, just a UX feature" (`gp:server.go:49-52`). What the boundary buys, in the
maintainers' words: "Plugins can't crash your host process: A panic in a plugin doesn't panic
the plugin user" and "The plugin only has access to the interfaces and args given to it, not to
the entire memory space of the process" (`gp:README.md:89-90,100-103`); Vault uses it "where
dynamic library loading is not acceptable for security reasons" (`:154-157`). What it costs,
also in their words: "Shared libraries have one major advantage over our system which is much
higher performance … we've never required any more performance out of our plugin system"
(`:162-165`); the host keeps a `StartTimeout` for the child to say it started (`gp:client.go:191-192`)
and logs `plugin process exited` when it dies (`:777-790`). No figure for latency or
serialization appears anywhere in the repository (NOT FOUND; `grep -rli isolation` → 0 files).
CONFIRMED.

**Naming and identity.** A provider is `hostname/namespace/type`
(`registry.terraform.io/hashicorp/aws`; `tf:internal/addrs/provider.go:87-93,120-143`), the
pseudo-host `terraform.io/builtin/` for built-ins (`:21-33`), and a legacy namespace `-` for
pre-0.13 unqualified names that `init` now refuses: `This configuration or its associated state
refers to the unqualified provider %q. You must complete the Terraform 0.13 upgrade process`
(`tf:internal/command/init.go:428-434`). Identity on the wire is three fields, never one string
to split — the thing G007 recommends. The method names changed between majors
(`GetSchema` → `GetProviderSchema`, `Configure` → `ConfigureProvider`;
`tfplugin5.proto:330-344` against `tfplugin6.proto:362-376`). CONFIRMED.

**Order and conflicts.** None to resolve: a provider is a leaf keyed by its address; two
providers never contribute to one thing. The host picks the protocol version — the server
"iterate[s] in reverse order, to ensure we match the newest compatible plugin version" and
falls back to its lowest for a client that sent no list (`gp:server.go:165-221`); the client
verifies and fails with `incompatible API version with plugin. Plugin version: %d, Client
versions: %d` (`gp:client.go:1028-1052`). CONFIRMED.

**Lifecycle.** `Kill()` ends the subprocess, graceful first, then after two seconds "plugin
failed to exit gracefully" and a hard kill (`gp:client.go:491-563`); `Reattach` connects to an
already running process (`:299-314`); the host can be upgraded while a plugin runs
(`gp:README.md:68`). CONFIRMED.

**Where the cut went wrong, and the harm.** (1) The versioning promise was broken once and the
repair is a note: "Some of the `.proto` files contain statements about being updated in-place
for minor versions. This reflects an earlier version management strategy which is no longer
followed … The outdated comments in those files are retained in order to keep the promise of
immutability, even though it is now incorrect" (`tf:docs/plugin-protocol/README.md:206-212`).
(2) One SDK's quirk is in the wire contract forever: `bool legacy_type_system = 5;` with
"==== THIS MUST BE LEFT UNSET IN ALL OTHER SDKS ====" (`tfplugin6.proto:668-679`), and dead
fields stay with `[ deprecated = true ]` because the file is immutable (`:209-212`). (3) A
version that is not sent is guessed: "sdk.v2 doesn't include the protocol version in the
ReattachConfig … so client.NegotiatedVersion() always returns 0. We assume that an unmanaged
provider reporting protocol version 0 is actually using proto v5" (`meta_providers.go:538-543`).
(4) Protocol 5 clients carry eight state-store methods as `panic("not implemented")`
(`tf:internal/plugin/grpc_provider.go:1450-1480`): a port that grows forces every older
implementation to carry stubs. (5) The identity migration (legacy `-` namespace) is still a
hard error in `init` years later (`init.go:428-434`).

### MCP

**Unit of extension.** A server process (or HTTP endpoint) that lists and serves tools,
resources and prompts over JSON-RPC. A tool is `Tool extends BaseMetadata, Icons { name; title?;
description?; inputSchema: { type: "object"; … }; outputSchema?; annotations?; _meta? }`
(`spec:schema/2026-07-28/schema.ts:954-968,1973-2014`), listed by `tools/list` with a `nextCursor`
and `ttlMs`/`cacheScope` (`:1767-1781,1054-1105`), called by `tools/call { name, arguments }`
(`:1863-1885`). Everything a server contributes is **data on the wire**; the only code is the
server's own. The spec's own trust rule on that data: "all properties in `ToolAnnotations` are
hints … Clients should never make tool use decisions based on `ToolAnnotations` received from
untrusted servers" (`:1901-1909`). CONFIRMED.

**Who owns the contract.** The specification, as a dated schema file per revision — six
directories, `2024-11-05` … `2026-07-28` and `draft` (`spec:docs/specification/`,
`spec:schema/`), 1,117 → 3,197 lines of `schema.ts`. The newest revision changed the contract's
own mechanism: "Make MCP stateless: remove the `initialize`/`notifications/initialized`
handshake. Every request now carries its protocol version and client capabilities in `_meta`"
(`spec:docs/specification/2026-07-28/changelog.mdx:14`); "There is no negotiation handshake.
Every request carries its protocol version, and the server accepts or rejects each request
independently" (`basic/versioning.mdx:12-13`); a version the server does not implement "MUST
respond with an `UnsupportedProtocolVersionError` listing the versions it does support"
(`:48-52`) and "The client SHOULD select a mutually supported version from the `supported` list
and retry" (`:69-71`); `server/discover` is mandatory (`server/discover.mdx:7-9`). The previous
revision was the handshake: "If the server supports the requested protocol version, it MUST
respond with the same version. Otherwise, the server MUST respond with another protocol
version it supports … If the client does not support the version in the server's response, it
SHOULD disconnect" (`spec:docs/specification/2025-11-25/basic/lifecycle.mdx:167-175`).
Capabilities are an open map with a named `extensions` field: "Known capabilities are defined
here, in this schema, but this is not a closed set" (`spec:schema/2026-07-28/schema.ts:716`,
`:785,882`). CONFIRMED.

**The path built-ins take.** None: a host has no built-in MCP servers; its own tools are not
MCP. (The SDK's `McpServer` is the server side, used by third parties and first parties
alike.) INFERRED from the specification's scope.

**Loading and isolation.** stdio: "the client launches the MCP server as a subprocess … The
server reads JSON-RPC messages from `stdin` and writes JSON-RPC messages to `stdout` …
Messages are delimited by newlines … The server MUST NOT write anything to its `stdout` that is
not a valid MCP message" (`spec:docs/specification/2026-07-28/basic/transports/stdio.mdx:7-21`);
"If the server process exits unexpectedly, the client SHOULD restart it. Because the protocol
is stateless, any in-flight requests are simply lost and the client can retry them against the
fresh process" (`:111-113`). The permissions of a stdio server are whatever the client gave the
subprocess; the spec says nothing about them. Streamable HTTP in this revision is one POST
endpoint, no sessions, no GET stream (`basic/transports/streamable-http.mdx:16-20,30-36`), with
`Origin` validation against DNS rebinding and "When running locally, servers SHOULD bind only
to localhost" (`:58-64`). The trust principles are on the host: "Users must explicitly consent
to and understand all data access and operations"; "Tools represent arbitrary code execution and
must be treated with appropriate caution … Hosts must obtain explicit user consent before
invoking any tool" (`spec:docs/specification/2026-07-28/index.mdx:97-113`); "While MCP itself
cannot enforce these security principles at the protocol level, implementors SHOULD" (`:117-118`).
CONFIRMED.

**Naming.** Methods are `<area>/<verb>` (`tools/list`, `tools/call`, `resources/read`,
`server/discover`); notifications are `notifications/<area>/<event>`; `_meta` keys are
reverse-DNS prefixed (`io.modelcontextprotocol/protocolVersion`). Tool names: "SHOULD be between
1 and 128 characters … only allowed characters: uppercase and lowercase ASCII letters, digits,
underscore, hyphen, and dot … SHOULD be unique within a server" (`server/tools.mdx:309-316`),
enforced in the SDK by `/^[A-Za-z0-9._-]{1,128}$/` (`sdk:packages/core-internal/src/shared/toolNameValidation.ts:16`).
Collisions across servers are the aggregator's problem: "Clients or proxies that aggregate tools
from multiple servers MAY encounter naming collisions … and SHOULD implement a disambiguation
strategy such as prefixing tool names with a server identifier" (`:324-327`); "The server
`name` … is not guaranteed to be unique across servers and SHOULD NOT be relied upon"
(`:329-330`). CONFIRMED.

**Order and conflicts.** None inside a server beyond "Servers SHOULD return tools in a
deterministic order" (`server/tools.mdx:71-72`); the SDK refuses a duplicate: `Tool ${name} is
already registered` (`sdk:packages/server/src/server/mcp.ts:1102-1104`), lists in insertion
order and filters disabled tools (`:261-268`), and renames without a duplicate guard (`:982-983`).
Across servers, see naming. CONFIRMED.

**Lifecycle.** A `RegisteredTool` has `enable`, `disable`, `remove`, `update`, each of which
sends `notifications/tools/list_changed` (`sdk:…/mcp.ts:964-968,1020-1027,1264-1268`); in the
newest revision that notification "is only delivered on a `subscriptions/listen` stream when the
client requested it" (`spec:schema/2026-07-28/schema.ts:1888-1898`). Shutdown over stdio: close
stdin, wait, then kill (`stdio.mdx:89-94`). CONFIRMED.

**Versioning.** Date strings, one schema per revision, a deprecation policy with "a minimum
twelve-month deprecation window" (`changelog.mdx:107-112`), and a compatibility matrix for
"Modern", "Legacy" and "Dual-era" implementations (`basic/versioning.mdx:34-39,164-180`). The
SDK carries both eras: `SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26',
'2024-11-05', '2024-10-07']` for the handshake (`sdk:packages/core/src/constants.ts:1-3`) and
`FIRST_MODERN_PROTOCOL_VERSION = '2026-07-28'` for per-request metadata
(`sdk:packages/core-internal/src/shared/protocolEras.ts:25-37`); the client refuses `Server's
protocol version is not supported` (`sdk:packages/client/src/client/client.ts:1086-1088`) and the
server answers an unknown version with its own latest legacy version (`sdk:packages/server/src/server/server.ts:936-939`).
Capability enforcement is off by default: "Currently this defaults to `false`, for backwards
compatibility with SDK versions that did not advertise capabilities correctly. In future, this
will default to `true`" (`sdk:packages/core-internal/src/shared/protocol.ts:84-90`). CONFIRMED.

**Where the cut went wrong, and the harm.** (1) In under two years the protocol removed its
own handshake, sessions, the GET stream, resumability, `ping`, `logging/setLevel`, batching, and
moved tasks to an extension (`2026-07-28/changelog.mdx:12-28`; `2025-06-18/changelog.mdx:12-13`):
a versioned protocol does not stop the contract from being rewritten, it only lets both sides
know. (2) Capability negotiation existed for four revisions before the SDK dared enforce it
(`protocol.ts:84-90`). (3) Tool identity is a per-server string; the moment two servers meet,
the aggregator invents prefixes (`tools.mdx:324-330`) — the one-string identity G007 warns of.
(4) Everything a tool says about itself is untrusted by rule (`schema.ts:1901-1909`), so the
host must decide trust from the server's provenance, which the protocol does not carry.

### Secondary subjects, where they add a cut or a harm

**Fastify — encapsulation.** `register(plugin)` creates a child context: "changes to the Fastify
instance (via `decorate`) will not affect the current context ancestors, only its descendants"
(`fastify:docs/Reference/Plugins.md:8-11`); implemented as `const instance = Object.create(old)`
with per-child copies of hooks and decorators (`fastify:lib/plugin-override.js:38-47`), and a
plugin opts out with the hidden `Symbol.for('skip-override')` or `fastify-plugin`
(`lib/plugin-utils.js:61-63,147-154`; `plugin-override.js:29-36`). Plugin metadata carries
`name`, a `fastify` version range, `dependencies` and `decorators`, checked at registration
with `The dependency '%s' of plugin '%s' is not registered` and `fastify-plugin: %s - expected
'%s' fastify version, '%s' is installed` (`lib/plugin-utils.js:73-77,113-127`;
`lib/errors.js:495-511`). A duplicate decorator throws `The decorator '%s' has already been
added!` within one context only (`lib/decorate.js:19-22`; `docs/Reference/Decorators.md:298-300`).
The cut it adds: a plugin's contributions are scoped to the subtree that registered it, so two
plugins can hold the same name without meeting. The harm: the escape hatch is the common case
— every shared utility must be wrapped in `fastify-plugin` or declared at the root
(`docs/Guides/Plugins-Guide.md:164-167`) — and no built-in uses `register` (0 hits in `lib/`).
CONFIRMED.

**Obsidian — a class with a manifest.** `abstract class Plugin extends Component` with
`onload()`, `onunload()`, `manifest: PluginManifest` (`obsidian:obsidian.d.ts:7115-7153`);
`PluginManifest { id; name; author; version; minAppVersion; description; isDesktopOnly?; dir? }`
(`:7371-7422`); `requireApiVersion(version)` for feature detection at run time (`:7953-7964`).
Everything registered through `register*` is undone on unload: "Registers an event to be
detached when unloading" (`:3033-3038`). Command ids are namespaced by the host: "The command id
and name will be automatically prefixed with this plugin's id and name" (`:7174-7178`); only CLI
handlers state a conflict rule, "Command IDs must be globally unique. Attempting to register a
command that is already registered will throw an Error" (`:7317-7320`). Trust: a plugin is a
`main.js` that may `require('fs')` or `require('electron')` and "Must bundle all external
dependencies into this file" (`obsidian:README.md:29-35`); no security statement exists in the
API package (0 hits for security/trust/sandbox/permission). The cut it adds: host-prefixed
identities, so a plugin cannot collide with another by accident. CONFIRMED.

## Deno

Everything here was measured on the workspace's `deno 2.9.6 (stable, release,
aarch64-unknown-linux-gnu)` with `--no-lock`, from `/var/tmp/kuib-prior-art/research-plugins/probe/`
(`host.ts`, `plugins/*.js|ts`, `serve.ts`; runner scripts `probe1.sh` … `probe3.sh` and their logs
beside the folder in `research-plugins-scripts/`), through `/var/tmp/kuib-guard.sh 30 1500 --`,
with `DENO_DIR` set inside the probe folder. The host binaries were deleted after measuring. The
orchestrator's probe of the same day is cited as ORCHESTRATOR.

**What a compiled executable loads at runtime.**

| Plugin source, loaded by `import()` from a compiled host | Result | Evidence |
|---|---|---|
| A local `.js` file, by `file://` URL | loads; no `--allow-read` needed for the module itself | `host-net` (compiled with `--allow-net` only): `{"ok":true,"ms":0.2,…}` while the plugin's own `Deno.readTextFile` fails `NotCapable` (probe1). ORCHESTRATOR: same. |
| A local `.ts` with its own enum and a relative import | loads | ORCHESTRATOR; `rel.js` → `dep.js`: `{"ok":true,…,"value":"dep-ok"}` (probe3) |
| A `data:` or `blob:` URL holding the module's bytes | loads; a relative import inside fails `invalid URL: relative URL with a cannot-be-a-base base` | probe3; ORCHESTRATOR for `data:` |
| `npm:zod@4.1.0` when the host embedded that exact package | loads, **same instance** as the host's (`sameConstructor: true`) | probe3 |
| `npm:zod@3.23.8` when the host did not embed it | `TypeError: Could not find constraint 'zod@3.23.8' in the list of packages.` | probe3; ORCHESTRATOR saw the same text |
| `jsr:@std/text@1/to-kebab-case` | `TypeError: Module not found: jsr:@std/text@1/to-kebab-case` | probe3; ORCHESTRATOR |
| `http://127.0.0.1:18777/remote.js` from a host compiled with `-A` | `TypeError: Module not found: http://127.0.0.1:18777/remote.js` | probe1 |
| the same, host compiled with `--allow-read --allow-net --allow-env --allow-run --allow-import=127.0.0.1:18777` | `Module not found` again; `deno run` with the same flags loads it (`ms: 0.48`) | probe2 |
| A module Worker from a `file://` URL | loads | probe2; ORCHESTRATOR |

So: a `deno compile` binary never fetches a module at runtime, whatever its permissions; the
documentation's "Require that remote dependencies are already cached" and "`--include` … Note
this currently only works for files on the file system and not remote files"
(https://docs.deno.com/runtime/reference/cli/compile/, read 2026-10-25) hold for `npm:`, `jsr:`
and `https:` alike. A third-party plugin for a compiled kuib is therefore **a local file, with
every dependency bundled into it** (`deno bundle --platform=deno` produced a 433,005-byte
single file from a plugin importing `npm:zod@4.1.0`, probe2), or a module the host chose to
embed at build time. `-A` and `--allow-import` cannot be combined: `error: --allow-all
conflicts with --allow-import` (probe1, both `run` and `compile`); the default `--allow-import`
list is `deno.land:443,jsr.io:443,esm.sh:443,raw.esm.sh:443,cdn.jsdelivr.net:443,raw.githubusercontent.com:443,gist.githubusercontent.com:443`
(`deno run --help`, 2.9.6). CONFIRMED.

**Identity across the boundary.** ORCHESTRATOR: a plugin that imports the host's own `lib.ts`
by path gets a second instance in the compiled host (a symbol compares false) and the same
instance under `deno run`. Measured here with a library: the bundled plugin carries its own zod
(the bundle inlines `.deno/npm/registry.npmjs.org/zod/4.1.0/v4/classic/external.js`, probe3),
so `schema.constructor === host.z.ZodObject` is **false**; yet `schema instanceof host.z.ZodType`
is **true** and `host.z.object({ s: pluginSchema }).safeParse(…)` succeeds (probe3) — zod 4
recognises foreign instances of the same major by their internal traits. Two consequences for
kuib: (1) nothing from `@kuib-ai/protocol` that a plugin imports is the host's object —
enums, classes, `Symbol`s, Zod schema identities all differ — unless the host embedded that
module and the plugin imports it by the same specifier the host did; (2) the contract between
host and plugin must be checked as **data at the boundary** (parse the plugin's output with the
host's schema), never by identity. A plugin written in TypeScript against `@kuib-ai/protocol`
types is fine: `import type` is erased and the runtime shapes are plain data. CONFIRMED.

**Permissions.** In process, a plugin has exactly the host's permissions: host `-A` → the plugin
reads `/etc/hostname`, reads `HOME`, spawns `true` (`"hostname":"read-ok","env":"env-ok","run":"run-ok"`);
host compiled with `--allow-read=<plugins> --allow-net=127.0.0.1` → `NotCapable` for all three
(probe1). This is the documented model: "All code executing on the same thread shares the same
privilege level. It is not possible for different modules to have different privilege levels
within the same thread"; "Deno sets no limits on the execution of code at the same privilege
level" (https://docs.deno.com/runtime/fundamentals/security/, read 2026-10-26). A **Worker** can
be narrowed, not widened: with `--unstable-worker-options` compiled in, `deno: { permissions:
"none" }` → everything `NotCapable`; `{ read: ["/etc/hostname"], net: false, env: false, run: false, … }`
→ `hostname: read-ok`, `env: NotCapable`, `run: NotCapable`; `"inherit"` → the host's; a worker
asking for `env: true` in a host without env → `NotCapable: Can't escalate parent thread
permissions` (probe2). Without the flag: `Unstable API 'Worker.deno.permissions'. The
--unstable-worker-options flag must be provided.` (probe1); the flag "Enable[s] unstable Web
Worker API options. Specifically, it enables you to specify permissions available to workers"
(https://docs.deno.com/runtime/reference/cli/unstable_flags/, read 2026-10-26). A **subprocess**
has whatever it was started with: a compiled plugin executable built with no `--allow-*` reads
nothing (`"hostname":"NotCapable"`), one built with `--allow-read=/etc/hostname` reads that file
(probe2). Permissions are fixed at compile time: "the runtime flags used to execute the script
must be specified at compilation time. This includes permission flags" (compile docs, read
2026-10-25). CONFIRMED.

**Costs** (medians of three unless stated; one M4-class ARM Linux host, 8 GB):

| Path | Ready | Per call | Memory | Evidence |
|---|---|---|---|---|
| In-process `import()` of an 840-byte plugin | 0.14–0.17 ms | a function call | shared | probe1 P4 |
| In-process `import()` of the 433 KB bundled plugin (own zod) | 18.6–31.5 ms | a function call | shared | probe2 P6 |
| Hash the bytes, then import them by `data:` / `blob:` URL | 840 B: 0.4–1.8 ms; 433 KB: 39.5–41.8 ms | — | shared | probe3 P9b |
| Module Worker (same binary), `postMessage` round trip | 11–27 ms to first message | 0.051–0.066 ms | one isolate | probe2 P2b |
| Subprocess `deno run` of a child script, JSON lines on stdio | 40–44 ms | 0.09–0.11 ms | child RSS 44 MB | probe1 P3 |
| Subprocess compiled plugin executable, JSON lines on stdio | 12–16 ms | 0.053–0.091 ms | child RSS 63 MB; binary 104.9 MB | probe2 P3b |
| Compiled host process floor (`console.log` only) | 9–15 ms | — | binary 104.9 MB | probe2 P10–P11 |
| `deno compile` of the host | 0.51 s warm (8.25 s the first time) | — | binary 108.8 MB | probe1 |

The per-call figures are for a `{ ping }` / `{ pong }` object and bound the transport only; a
model step's deltas would add serialisation proportional to their size. CONFIRMED.

**What this settles for G002 and engine-foundation G002.** The in-process form is the only one
that costs nothing per call; it gives a plugin the whole process. A Worker costs about a tenth
of a millisecond per crossing and about 15 ms to start, is narrowable only behind an unstable
flag, and shares the binary. A compiled plugin executable costs about as much per crossing,
~15 ms to start, 60 MB resident and 105 MB on disk, and is the only form whose permissions the
plugin author declares and the host can read before running it. Nothing remote is loaded at
run time by a compiled host under any flag, so "a lookup place" (the owner, 2026-10-25) can
only mean a place that **downloads a file to disk** which the host then imports — the RCE the
owner named, unless what is downloaded is verified first (`## Trust`).

## Cuts for kuib

Six cuts appear in the subjects. The first three are the owner's options; the others are what the
subjects add. Each is held against kuib's decisions, with what it costs when a package changes,
when a contract grows, and when a plugin touches several packages.

### Cut A — each package owns its contract; a plugin extends one named package

Backstage is the pure form: a module names the plugin it extends and may depend only on that
plugin's extension points (`bs:…/BackendInitializer.ts:289-300`); VS Code's contribution points
are owned by the feature that registers them (`vsc:…/extensionsRegistry.ts:680-694`); Terraform has
one package and one contract (`tf:internal/providers/provider.go:15-152`).

- When a package changes: only its own extension points move; Backstage deprecates by name
  (`scaffolderActionsV2ExtensionPoint`, `05-extension-points.md:142`) and a module keeps working
  until it opts in.
- When a contract grows: by addition on that package's point alone; "better to export multiple
  extension points with few methods" (`05-extension-points.md:12`).
- When a plugin touches several packages: it is several modules, one per package, or it is
  refused — "Extension points can only be used within their plugin's scope".
- Where it went wrong: the old Backstage, where every plugin took an environment the integrator
  assembled by hand and every dependency change touched every backend (`08-migrating.md:28-51`);
  and the point is dead after `init` (`06-modules.md:10`).
- kuib: this is the ruling's shape. `protocol` holds the port types (D002), and the package that
  **calls** a port owns the registry a plugin registers into: `inference` for the model port's
  offerings, formats and blocks (P03-I01); the engine for tools; the daemon for the file system
  and discovery. A plugin that brings a provider *and* a tool registers into two registries,
  which is what Backstage forces and VS Code allows in one manifest. Touches D002, D008, G003,
  P03-I01; engine-foundation G003 (tool and context contracts).

### Cut B — one general plugin object that exposes everything every package does

opencode V2's `Context` of 24 domains (`oc:plugin/src/effect/plugin.ts:26-55`), pi's
`ExtensionAPI` with 44 events and a dozen `register*` methods (`pi:…/types.ts:1596-1921`), Vite
and Rollup's one object with every hook optional (`rollup:src/rollup/types.d.ts:597-609`).

- When a package changes: every plugin author's type changes; opencode's redesign ships "V1
  plugin implementations do not run in V2" and an eighteen-row mapping that is "not always
  exact renames" (migrate-v1, 2026-10-26); pi's changelog carries 62 breaking sections.
- When a contract grows: the one type grows; Vite's `Plugin` has 21 Vite-only members on top
  of Rolldown's (`plugin.ts:101-374`) and needed `enforce`, `order`, `apply`,
  `applyToEnvironment`, `sharedDuringBuild` to tell them apart.
- When a plugin touches several packages: easy — that is the point — and the reason the type
  never stops growing.
- Where it went wrong: built-ins see what the public object does not (opencode's 49 services,
  `internal.ts:109-159,215`; pi's eight typed tool events, `types.ts:1205-1256`), so the
  general object is never proven sufficient; conflict rules differ by hook and are learned from
  bugs (pi#9068).
- kuib: rejected by the ruling and by the evidence. "`plugin.inference`" would be this cut
  spelled as a namespace (`Plugin.Inference`), with the owner of a contract inverted: the
  format's contract would live under `plugin`, not under `inference` or `protocol`. Touches
  D008, D010.

### Cut C — one plugin shape that contributes to extension points the packages own

VS Code's manifest: `contributes.<point>` as data validated by the point's schema, plus an
`activate` for the code (`vsc:…/extensions.ts:357-389`); Backstage's `BackendFeature` as the one
opaque wrapper for plugins, modules, services and loaders (`bs:…/types.ts:25-29`); Obsidian's
`Plugin` class with `register*` methods undone on unload (`obsidian.d.ts:7115-7153`).

- When a package changes: the shape of the plugin record does not; the point it owns does.
- When a contract grows: a new key under `contributes`, a new extension point; the record is
  opaque "in order to simplify future API evolution" (`bs:…/types.ts:27`).
- When a plugin touches several packages: one record, several contributions, each checked by
  its owner (VS Code: one `package.json`, 59 points).
- Where it went wrong: the record admits anything, so what a built-in may say and a third
  party may not becomes a flag on the record (VS Code's `isBuiltin` nulling proposals,
  `extensionsProposedApi.ts:110-113`); conflicts are per point, each handler its own rule.
- kuib: this is how Cut A is carried without a plugin having to be several things: **one
  descriptor, many contributions, each named for the port or registry it serves**. It is the
  owner's first option in the shape of the third. Touches D008, G003, G016.

### Cut D — out of process over a versioned protocol

go-plugin and Terraform (`gp:server.go:426-432`; `tf:docs/plugin-protocol/README.md:63-82`), MCP
(`spec:…/stdio.mdx:7-21`), VS Code's extension host (`extensionHostStarter.ts:114-125`).

- When a package changes: the wire contract is frozen per major and negotiated at start or per
  request; the package changes behind it.
- When a contract grows: minor = optional additions, feature-detected (`README.md:63-67`);
  major = new file, both served at once (`VersionedPlugins`, `tf:internal/plugin/plugin.go:11-22`).
- When a plugin touches several packages: it speaks several services on one connection
  (go-plugin's broker) or one protocol with several areas (MCP).
- Where it went wrong: the frozen file keeps its mistakes forever (`legacy_type_system`,
  deprecated fields, `tfplugin6.proto:209-212,668-679`); a protocol can still be rewritten
  wholesale (MCP removed its handshake, `2026-07-28/changelog.mdx:14`); the boundary protects
  the host, not the user (VS Code's host has full Node; a Terraform provider has the
  user's credentials); per call it costs a serialisation and a context switch (`## Deno`:
  ~0.05–0.1 ms per crossing, ~15 ms and 60 MB per process).
- kuib: not the first form (G002's recommendation stands: build in process, keep the port
  plain data so this form can come later without a new contract). The measured costs say a
  model port could live here — a step is a handful of crossings — while a block (D007) could
  not: a block is called inside the translation of every frame. Touches G002, D010, D011;
  engine-foundation D001, G002; R221 (one binary, roles).

### Cut E — contributions as data with no code

pi's `models.json` row and "Registering only `baseUrl` or `headers` for an existing provider"
(`custom-provider.md:9-16,33`); VS Code's declarative extensions, which skip even the version
check because they have no `main` (`extensionValidator.ts:333-341`); MCP's tool list
(`spec:schema/2026-07-28/schema.ts:1973-2014`); Terraform's provider schema returned over the
wire. The harm on this road is shape 7 of the synthesis: the table decays into code beside it.

- kuib: D008 already lists "an offering as data" as the smallest size; G016 requires every
  value in a row to cite its fixture. A data contribution needs no trust decision beyond
  parsing it with the host's schema (`## Trust`). Touches D008, G016, D004/D015 (the row names
  enums the core compiled in — a new provider's row needs a new member: G007's risk).

### Cut F — encapsulated scope

Fastify: what a plugin registers is visible only to its subtree, and the escape hatch is the
common case (`fastify:docs/Reference/Plugins.md:8-11`, `Plugins-Guide.md:164-167`).

- kuib: no use now. An application (engine-foundation D004) is the natural scope: Ana's
  tools need not be kuib's. That is a property of the **application's descriptor list**, not
  of a registry tree. Noted for Q7.

### The ruling's risks, as the subjects show them

Reported, not reopened (D008, 2026-10-25).

- **A port is the largest unit, not the smallest.** D007 and D008 make a block and an offering
  row contributions too. If "plugins implement ports" is read as "every contribution is a
  port", blocks become ports and the port count explodes (Terraform's interface is 35
  methods, eight of which protocol-5 clients carry as `panic("not implemented")`,
  `grpc_provider.go:1450-1480`). If it is read as "ports are one kind of contribution", kuib
  has two paths again — opencode's `transform` beside `hook`. The reconciliation in the
  recommendation: a descriptor's contributions are each named for an extension point; a port
  implementation is one kind of extension point, a block variant another, a row a third.
- **Same path for built-ins costs startup.** Vite registers 28 internal plugins per
  environment before the first user plugin runs (`plugins/index.ts:60-155`); opencode makes
  every session entry point wait for plugin activation (`oc:core/src/plugin/service.ts:29-34`).
  kuib's D010 and the principle "a translation is loaded only when first used" mean the
  built-ins' descriptors must be data and their code loaded by a literal `import()` the
  compiler includes (`## Deno`, compile docs on statically analysable dynamic imports).
- **"Named like them" names only the contracts.** `*.port` has siblings; the registry, the
  loader, the descriptor and the identity do not all have one (`## Recommendation`, Names).
- **Nothing privileged must be enforced, not stated.** Every subject that said so and did not
  enforce it drifted: opencode's PLAN.md goal 1 against `internal.ts:215`; Goose, Crush and
  LiteLLM before it (harnesses 13, sdks W15). G003's lint rule and outside-the-package test are
  the enforcement.

## Trust

The owner, 2026-10-25: plugins built against protocol's types, compiled, "and maybe have a
lookup place; but that would result in RCE". Three questions: who decides which code runs,
what the code can reach, and what needs no code at all.

### Who decides which code runs

| Subject | What runs | Who decided, and what is recorded | Verification before running |
|---|---|---|---|
| opencode | a package named in config | the config string; `npm add` at load time (`oc:core/src/plugin/module.ts:103-109`); a managed policy may deny `plugin:<target>` (`:52-59`) | none (no hash, no signature) |
| pi | `npm:`/`git:`/local, pinned by version, tag or commit (`packages.md:35-40`) | the settings file; installed at startup, failure is a warning and a retry (`packages.md:19`); project trust gates project-declared packages (`:23`) | none; "Review third-party package source before installing it" |
| VS Code | a marketplace or local VSIX | the user's install; `engines.vscode` checked at install and scan (`extensionValidator.ts:333-375`); untrusted-workspace capability gates enablement (`extensions.ts:289-314`) | version compatibility only (signing is outside this checkout: NOT FOUND) |
| Backstage | the backend's own declared dependencies | `package.json`; discovery reads only dependencies with a backend `backstage.role` (`PackageDiscoveryService.ts:121-177`) | the package manager's lock file; nothing at run time |
| Terraform | a provider binary from a registry or mirror | `init` resolves versions and writes `.terraform.lock.hcl` with checksums ("recorded in the dependency lockfile", `tf:internal/command/init.go:936,1369`) | archive SHA-256 against the registry's `SHA256SUMS`, and a GPG signature over that document, graded `verifiedChecksum | officialProvider | partnerProvider | communityProvider` (`tf:internal/getproviders/registry_client.go:361-365`, `package_authentication.go:25-29,63-95`); the installer refuses protocols it cannot speak (`registry_client.go:61`) |
| go-plugin | a path the host chose | the host; optional `SecureConfig { Checksum, Hash }` with the warning that the checksum must come from "a trusted and authoritative source" and the binary must not be modifiable "between the time of this check and the time of execution" (`gp:client.go:317-331`) | `ErrChecksumsDoNotMatch` (`:53,661-666`) |
| Grafana | a plugin directory | the admin; **"If a plugin is unsigned, then Grafana neither loads nor starts it"**, log `plugin '<plugin id>' is unsigned`; statuses `Core | Invalid signature | Modified signature ("The plugin has changed since it was signed. This may indicate malicious intent.") | Unsigned | Signed`; `allow_loading_unsigned_plugins` logs `WARN … Running an unsigned plugin`; "Unsigned plugins are not supported in Grafana Cloud" (https://grafana.com/docs/grafana/v13.2/administration/plugin-management/plugin-sign/, read 2026-10-26) | signature of every plugin at startup |
| MCP | a server the host configured | the host, with "explicit user consent before invoking any tool"; everything the server says about itself is untrusted (`index.mdx:97-113`; `schema.ts:1901-1909`) | none in the protocol; provenance is the host's |

The two systems that put a verification in front of the code — Terraform and Grafana — both
record the decision in a file the user can read (`.terraform.lock.hcl`; a signed `MANIFEST`),
both refuse by default, and both keep an explicit override that logs. The two that install at
run time from a string — opencode and pi — are the supply-chain shape: a name resolves to
whatever the registry serves at that moment, with pinning as the only defence. Terraform's own
warning applies to any hash scheme: a checksum from the same place as the code proves only
that the download was not corrupted (`gp:client.go:323-324`). CONFIRMED.

For kuib, measured (`## Deno`): a compiled host cannot fetch code at run time at all, so a
"lookup place" is a catalogue of **files**, and the RCE is exactly "the host imports a file
someone else wrote". What the probes show is possible: read the file, hash it, compare with a
record the user approved when they installed it (name, version, SHA-256, protocol version),
and import the **verified bytes** by `blob:` URL — not the path, so the file cannot change
between check and import (the race `gp:client.go:328-331` warns of). Cost: 0.4 ms for a small
plugin, ~40 ms for a 433 KB bundle (probe3). The record is the kuib equivalent of the lock file;
a signature by the author or by a kuib registry can be added on top later, Grafana's way, and
is not needed for the first form, which is "the user put this file here and approved its hash".

### What a plugin can reach

Measured on 2.9.6 (`## Deno`, probes 1–2):

| Form | Reach | Narrowing | Escalation |
|---|---|---|---|
| In process (`import()` into the host) | everything the host has: with `-A`, files, env, spawn | none — "All code executing on the same thread shares the same privilege level" (Deno security docs, 2026-10-26); the host would have to be compiled with less, which the model path (net) and the daemon (read, run) cannot afford | n/a |
| Module Worker, `deno: { permissions }` | what the host grants it, down to `"none"` or `{ read: ["/one/file"] }` | yes, measured; needs `--unstable-worker-options` compiled in | refused: `NotCapable: Can't escalate parent thread permissions` |
| Subprocess, compiled plugin executable over stdio | what its own `--allow-*` flags gave it at compile time (`"hostname":"NotCapable"` with none; read-ok with `--allow-read=/etc/hostname`) | by the plugin's author, visible in how it was compiled, or by the host spawning `deno run` with flags it chooses | n/a — separate process |

A Worker cannot import `npm:`/`jsr:` any more than the host can (same binary), and it shares
the host's module cache, so a plugin that reaches the host's `protocol` module reaches the same
code but a different instance (ORCHESTRATOR). What a Worker protects: files, env, spawn,
network from the plugin's own calls; what it does not: the data the host sends it (prompts,
keys the host puts into a request). A subprocess additionally survives a crash of the plugin
(`gp:README.md:89-90`) and can be a different language (MCP's reason for existing).

### Which contributions can be data with no code at all

From D008's sizes: an **offering as data** (a row: provider, model, format, one variant per
step, native slug, limits; G016), a **provider's address and header** changes (pi's
"Registering only `baseUrl` or `headers`", `custom-provider.md:33`), a **model's facts**
(models.dev's whole product), an **application's plugin list and order**, **tool declarations
served by an MCP server** (the code is elsewhere). A data contribution is parsed by the host's
schema at the boundary (D011: one discriminator per union, optional additions only) and needs
no trust decision beyond "do I accept rows from this file"; VS Code goes as far as skipping
the version check for an extension with no `main` (`extensionValidator.ts:335-338`). What
cannot be data: a block variant (code that renders a frame), a new format, a port
implementation, authentication that runs a flow. The owner's "built against protocol's types,
compiled" describes these, and they are the ones the hash record is for.

### Build-time check and refusal (question 6)

How a plugin author type-checks: against `@kuib-ai/protocol`'s types for the release they
target, with `import type` only — erased at run time, so the second-instance problem of
`## Deno` does not arise for types; a plugin that imports a **value** from `protocol` (an enum
object, a schema) must be bundled with it and will hold its own copy. How the engine refuses a
plugin built against an incompatible protocol: the descriptor states the protocol version it was
built against, the host compares it with the version it ships, and refuses with a typed error
that lists what it supports — MCP's `UnsupportedProtocolVersionError { supported, requested }`
(`spec:schema/2026-07-28/schema.ts:450,483-499`), go-plugin's `incompatible API version with
plugin. Plugin version: %d, Client versions: %d` (`gp:client.go:1051-1052`), Terraform's
installer refusing before download (`registry_client.go:257-281`). Under D011 a minor is
additions-only, so one number per major suffices and a plugin built against 1.x runs on 1.y ≥ x
if it declares what it needs (Fastify's `fastify: '^x'` range, VS Code's `engines.vscode`).

## Recommendation

### The cut

**Contracts are ports in `protocol`; extension points are registries owned by the package that
calls the port; a plugin is one descriptor whose contributions are each named for the extension
point they serve; kuib's own functionality is a set of such descriptors, embedded in the binary
and registered through the same functions.** This is Cut A carried by Cut C. It follows the
ruling on D008 (ports of protocol's shape, named like them, built-ins through the same path),
keeps D002 (one `protocol`), D007 and D008's sizes (a row, a block, a format, a port), D010 (no
general object, nothing validated between layers inside the process, code loaded on first use),
D011 (plain data at every boundary) and D019 (the existing `event.log.port`, `file.system.port`
and `discovery.port` are the first three extension points — nothing is built beside them).

What is rejected, with the subject that shows the harm: a general plugin object over every
package (Cut B: opencode's break of every V1 plugin, pi's 62 breaking sections, Vite's 21
extra members); a plugin per package as a separate kind of thing (`inferencePluginAdapter`:
Backstage's old environment objects, assembled per plugin by hand); load order as meaning
(opencode's `pre`/`post` lists with a comment where it matters; Vite's `enforce` beside
`order`); last-writer-wins on one string key (pi's `apiProviderRegistry`); install-at-run-time
from a name (opencode, pi).

### Names

Each against the sibling it mirrors, found in the tree on 2026-10-25.

| Proposed | Mirrors | Where the sibling is |
|---|---|---|
| `model.port` → `ModelPort` (P02-I03) | `event.log.port` → `EventLogPort`, `file.system.port` → `FileSystemPort`, `discovery.port` → `DiscoveryPort` | `packages/protocol/src/*.port/index.ts` |
| `plugin.descriptor` → `PluginDescriptor` (the record: id, version, protocol version, contributions) | `node.descriptor` → `NodeDescriptor` | `packages/protocol/src/node/node.descriptor/` |
| `plugin.id` → `PluginID` | `session.id` → `SessionID`, `device.id` → `DeviceID`, `node.id` → `NodeID`, `provider.id`, `model.id` | `packages/protocol/src/id/*.id/` |
| `plugin.source.enum` → `PluginSourceEnum` { `BUILTIN`, `FILE` } (where a descriptor came from) | `endpoint.kind.enum` → `EndpointKindEnum`; `message.format.enum` → `MessageFormatEnum` | `packages/protocol/src/endpoint/endpoint.kind.enum/`, `packages/protocol/src/message.format.enum/` |
| `register.offering`, `register.format`, `register.block`, `register.provider` (functions of `inference`, P03-I01) | verb.object units: `resolve.model.config`, `resolve.daemon.endpoint`, `create.model` (as `provider/model`), `ensure.daemon`, `start.daemon` | `packages/engine/src/provider/`, `packages/daemon/src/` |
| `resolve.offering` (provider + model → offering, format, blocks) | `resolve.model.config`, `resolve.daemon.endpoint`, `resolve.app.paths` | same |
| `load.plugin` → `loadPlugin` (read, hash, compare with the record, import verified bytes) | `load.key` (inference), `load.fixture` (testing) | `packages/inference/src/load.key/`, `packages/testing/src/load.fixture/` |
| `PROTOCOL_VERSION` (a constant in `protocol`) | **no sibling** in the workspace; the subjects' names are `LATEST_PROTOCOL_VERSION` (MCP), `CoreProtocolVersion` (go-plugin) | — |
| the registry *value* (what `register.*` writes into and `resolve.*` reads) | **no sibling**: the workspace has no `*.registry` or `*.store` unit; the nearest is `FACTORIES` inside `engine/src/provider/model` | for the owner |
| `inferencePluginAdapter` (owner's candidate) | **no sibling**: "adapter" names nothing in the tree (only `event-log-sqlite`'s description "node:sqlite adapter"); "plugin" prefixed to a package name has no sibling; a camelCase unit name has none (units are dot.case folders) | rejected |
| `plugin.inference` (owner's candidate) | **no sibling** as a unit; as a sub-barrel `Plugin.Inference` it would mirror `Engine.Provider`, but inverts ownership (inference's contract under `plugin`) | rejected |

Existing asymmetries noticed, left unchanged, for the owner: `packages/tools/src/tool.spec/`
default-exports `defineTool` (a verb) while the folder is named for the type `ToolSpec`, and
tools are a `ToolSpec` with `use(consume)` rather than a `*.port` — under the ruling a tool a
plugin contributes would implement a port, so `tool.spec` and a future `tool.port` would name
one idea twice; `ToolContext { fs: FileSystemPort }` already hands a port to a tool.
`packages/engine/src/provider/model/` default-exports `createModel` (folder named for the
noun, export for the verb) and holds `FACTORIES`, the one registry-like value in the tree,
unnamed as a unit.

### Where built-ins stand

Through the same functions, enforced: a lint rule that folders under `inference/src/<provider>/`
import only the package's public entry and `protocol` (G003), and a test that registers the
Anthropic translation from **outside** the package — the fake translation of P03-I03 is the
first third party (sdks W15's suggestion). Built-ins are descriptors whose `source` is
`BUILTIN` and whose code is reached by a literal `import()` (so `deno compile` embeds it and
nothing runs until first use, D010). Register the descriptors at start; load the code on the
first `resolve`. No `pre`/`post` list: order where it exists is **data in the application's
descriptor list**, and two descriptors contributing one identity to one extension point is a
typed error at registration (Backstage's `already registered`, MCP's `Tool … is already
registered`), never a precedence.

### Loading

First form, this feature: in process. A plugin is **one file**, bundled with its dependencies
(`deno bundle --platform=deno`, 433 KB with its own zod); the host never fetches code (`## Deno`).
`loadPlugin` reads the file, hashes it, compares with the approval record the user created when
installing (`PluginID`, version, SHA-256, protocol version), refuses on mismatch with a typed
error, and imports the verified bytes by `blob:` URL. Everything that crosses the boundary is
parsed with the host's schemas (D011); nothing is compared by identity (`## Deno`, second
instance). Later forms, same descriptor, no new contract: a Worker with narrowed permissions
(unstable flag; ~15 ms start, ~0.06 ms per crossing) for a plugin the user marks untrusted;
a compiled plugin executable over stdio with MCP's framing (newline-delimited JSON-RPC, nothing
else on stdout) for a port implementation in another language or with declared permissions
(~15 ms, ~60 MB, ~0.05–0.09 ms per crossing). A block cannot cross a process boundary at an
acceptable cost (called per frame); a port can.

### Identity

A contribution's identity is two fields on the wire — the `PluginID` and the string value the
plugin authored (G007's recommendation) — never one string to split (Terraform's three fields;
MCP's cross-server prefixing as the failure mode). Plugin-authored enums cannot extend
`ProviderEnum`/`ModelEnum` compiled into the core (D004, D015); a reader that lacks the plugin
still loads the session because the identity is data. The protocol version travels with the
descriptor and the refusal lists what the host supports (MCP, go-plugin). Lifecycle: a
descriptor is registered, its registrations are undone together (opencode's Scope, Obsidian's
`Component`); no runtime unload in the first form beyond process restart — hot reload is what
every subject got wrong first (pi's "code after `await ctx.reload()`", opencode's prefix
diff).

### Applications (question 7)

An application — kuib, Ana — is **the composition root that chooses descriptors**, the thing
Backstage calls the backend (`backend.add(…)`) and Vite the config (`plugins: [...]`), not a
plugin and not the engine. It owns session meaning and context policy (engine-foundation D004)
and its own tools and context policy enter through the same registration path as a third
party's (Cut F's scope: Ana's descriptor list need not contain kuib's tools). The engine is
what the descriptors extend; `protocol` is what they are typed against.

### What this feature builds now, and what waits

Now, so the answer is not blocked later:

- **P02 (`protocol`)**: `model.port` as planned (P02-I03), with requests and deltas as plain
  data; `plugin.descriptor`, `plugin.id`, `plugin.source.enum`; a `PROTOCOL_VERSION` constant;
  the ports keep no functions in their data (G002 kept).
- **P03-I01 (`inference`)**: the registry as `register.*` / `resolve.*` functions that accept
  contributions from a descriptor — never by importing a built-in by name; a typed error on a
  duplicate identity; the lint rule and the outside-the-package test of G003.
- **P03-I03 / P04**: the fake translation registered as a third party would be.

Waits, as its own roadmap item (proposed below): `load.plugin` with the hash record and
`blob:` import; the Worker and subprocess forms; the install command that writes the record;
the tool and daemon ports' registries (R009, R217; engine-foundation G003).

Gaps this closes or moves: G002 — the in-process form is built, the port stays data, the other
two forms are measured and possible; G003 — folders in `inference`, lint rule, outside test, as
recommended; G007 — two-field identity, as recommended, plus the protocol version on the
descriptor. New gap to record: the registry value has no sibling name (owner's call).

### Roadmap item proposed

**R### — Plugins: descriptor, loading and trust for third-party code in the compiled engine.**
Horizon later; domains core, infra; `depends-on` R020 (inference) and R021 (tests);
`converges-with` R009 (agent capabilities), R014 (security and secrets), R221
(self-contained engine); absorbs the "Plugin loading mechanism under Deno" question of R216.
Scope: `load.plugin` with the approval record and verified-bytes import; the Worker and
subprocess forms with their permissions; the install/remove commands; the tool and daemon
registries. Not in R020's scope, which ends at the in-process registry and the first third
party being kuib's own test.

## Unverified leads

- opencode issues on the V2 plugin break (plugins failing to load after the `id`/`setup`
  change; `npm add` at load failing offline) were not read: the search returned only the
  migration guides and third-party write-ups (2026-10-26). The guide's statements are cited;
  user reports are not.
- VS Code marketplace signing of VSIX files and the `--enable-proposed-api` flow are outside
  the sparse checkout (`src/vs/workbench/contrib`, `src/vs/platform/extensionManagement/node`);
  the "no runtime JSON-schema validation of `contributes`" finding is bounded by the checkout.
- Backstage's `docs/overview/threat-model.md` (trust model for plugins) and `@internal/backend`
  are outside the checkout.
- Terraform's `terraform-registry-address` module holds the `Provider` struct's `String()`
  and the legacy-namespace literal; cited from `internal/addrs/provider.go` only.
- Grafana's `MANIFEST.txt` contents (per-file hashes) and who signs each level were not on
  the page read; the behaviour quoted (unsigned not loaded; statuses; Cloud) is.
- The Eclipse/OSGi extension registry and Neovim were not read: VS Code already shows
  data-declared extension points with lazy activation, and pi already shows in-process Lua-style
  trust. If the owner wants a second data point for either, they are the two to open.
- pi's `ExtensionRunner` snapshot semantics (`snapshotEventHandlers`) and the exact set of
  events where the first result wins were not enumerated beyond `emit`, `emitToolCall` and
  the `user_bash` change.
- Deno: whether `import defer` (engine-foundation research) works for embedded built-in
  descriptors in a compiled binary was not probed here; the literal `import()` path was.
- The per-call cost figures bound the transport with a `{ ping }` object; a step's deltas were
  not streamed across a Worker or a subprocess.
