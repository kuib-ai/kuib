# research-plugins — report

Status: done

## Summary
One research file answers the owner's nine questions (the eight of the brief plus Trust) on how
kuib's plugins are cut, from the source of opencode, pi, VS Code, Backstage, Vite and Rollup,
go-plugin and Terraform, MCP (with Fastify, Obsidian and Grafana where they add a cut), from
their migration guides, changelogs and one issue, and from 26 probes on the workspace's Deno
2.9.6 plus the orchestrator's probe. Recommendation: contracts are `*.port` interfaces in
`protocol` (the D008 ruling); extension points are registries owned by the package that calls
the port; a plugin is one `plugin.descriptor` whose contributions are each named for the
extension point they serve (a row, a block variant, a format, a port implementation); kuib's
own functionality is descriptors embedded in the binary and registered through the same
functions, enforced by a lint rule and an outside-the-package test. A compiled Deno host
fetches no code at run time under any flag, so a third-party plugin is one bundled file whose
hash the host checks against an approval record before importing the verified bytes. No code
was changed.

## Files
- journal/features/inference/research/plugin-architecture-2026-10-25.md — new; the research
  (What was read, How the subjects cut it, Deno, Cuts for kuib, Trust, Recommendation,
  Unverified leads)
- journal/features/inference/tasks/research-plugins/{plan,log,report}.md — task records

## Tests
- none changed (no code touched)

## Deviations from the approved plan
- Gate was `none`; plan.md was written at start and followed. Two additions from the
  orchestrator's messages during the task: the D008 ruling of 2026-10-25 (treated as a ruling;
  risks reported, not reopened) and a ninth question, Trust (answered in `## Trust` and carried
  into the recommendation). The orchestrator's Deno facts are cited as ORCHESTRATOR and were
  not re-run; my probes went to what was unmeasured.
- opencode had restructured since 2026-10-08 (plugin system now in `packages/core/src/plugin/`,
  built-in providers as internal plugins); the current tree at 450e7b9 was read, not the
  commit of the earlier research.
- The "Terraform providers" subject is `hashicorp/terraform` itself (protocol docs, plugin
  client, installer); `terraform-plugin-go` was not needed.

## Plan updates (for the orchestrator)
- P06-I06 → implemented (research file exists with the required sections; `pnpm journal check`
  green)
- Decision to record, if the owner agrees (follows the D008 ruling; not a reversal): "A plugin
  is one descriptor whose contributions are named for the extension point they serve; ports in
  `protocol` are the contracts, registries in the calling package are the extension points;
  kuib's own functionality is descriptors registered through the same functions."
- Decision to record: "A compiled host fetches no code at run time; a third-party plugin is one
  bundled file whose hash is checked against an approval record before import" (from the
  measurements in `## Deno`).
- G002 → recommendation confirmed by measurement: build in process; Worker (unstable flag) and
  compiled-executable forms possible later without a new contract.
- G003 → recommendation confirmed: folders in `inference`, a lint rule on their imports, a test
  registering the Anthropic translation from outside the package.
- G007 → recommendation confirmed, plus: the descriptor carries the protocol version it was
  built against; refusal lists what the host supports.
- New gap: the registry value has no sibling name in the workspace (owner's call).
- Roadmap follow-up: a new item "Plugins: descriptor, loading and trust for third-party code in
  the compiled engine" (depends on R020, R021; converges with R009, R014, R221; absorbs R216's
  "Plugin loading mechanism under Deno" question). Written as a proposal in the research
  file's `## Recommendation`; not created (outside the grant).
- P02 additions proposed: `plugin.descriptor`, `plugin.id`, `plugin.source.enum`,
  `PROTOCOL_VERSION` beside `model.port`. P03-I01 acceptance addition proposed: contributions
  arrive through a descriptor, a duplicate identity is a typed error, no load-order precedence.

## Journal
- Claims rewritten and stamped: none (no code changed; read-only task)
- Claims possibly affected but not updated: none. `^protocol-ports`, `^package-barrels` and
  `^house-structure-rules` were read for sibling names only.

## Names
- `model.port` → `ModelPort` — mirrors `event.log.port` → `EventLogPort`, `file.system.port`,
  `discovery.port`
- `plugin.descriptor` → `PluginDescriptor` — mirrors `node.descriptor` → `NodeDescriptor`
- `plugin.id` → `PluginID` — mirrors `session.id` → `SessionID`, `device.id`, `node.id`,
  `provider.id`, `model.id`
- `plugin.source.enum` → `PluginSourceEnum` — mirrors `endpoint.kind.enum` → `EndpointKindEnum`,
  `message.format.enum`
- `register.offering` / `register.format` / `register.block` / `register.provider` — mirror the
  verb.object units `resolve.model.config`, `resolve.daemon.endpoint`, `ensure.daemon`,
  `start.daemon`
- `resolve.offering` — mirrors `resolve.model.config`, `resolve.daemon.endpoint`, `resolve.app.paths`
- `load.plugin` → `loadPlugin` — mirrors `load.key` (inference), `load.fixture` (testing)
- `PROTOCOL_VERSION` — no sibling (subjects: MCP `LATEST_PROTOCOL_VERSION`, go-plugin
  `CoreProtocolVersion`); for the owner's review
- the registry value — no sibling (`FACTORIES` inside `engine/src/provider/model` is the
  nearest, unnamed as a unit); for the owner's review
- `inferencePluginAdapter` (owner's candidate) — no sibling; rejected in the research
- `plugin.inference` (owner's candidate) — no sibling as a unit; as a sub-barrel it would
  mirror `Engine.Provider` but inverts ownership; rejected
- Existing asymmetries noticed, left unchanged: `packages/tools/src/tool.spec/` is named for
  the type `ToolSpec` and default-exports the verb `defineTool`; tools are a `ToolSpec` with
  `use(consume)`, not a `*.port`, while `ToolContext` already hands a `FileSystemPort` to a tool;
  `packages/engine/src/provider/model/` is named for the noun and exports `createModel`, and
  holds `FACTORIES`, the one registry-like value in the tree.

## Verification
- `pnpm journal check`: green — `archive ledger coverage: 311/311`, `0 errors, 0 warnings`
- `pnpm run check`: not run — no code, config or journal structure changed beyond the granted
  files; `pnpm journal check` covers the journal.
- Tests: none run (research task). Probes: 26 runs on Deno 2.9.6 through
  `/var/tmp/kuib-guard.sh 30 1500 --`, logs in
  `/var/tmp/kuib-prior-art/research-plugins-scripts/probe{1,2,3}.log`; compiled binaries deleted.
- Every line a sub-agent cited was reopened in the source before being written (opencode read
  directly; Backstage 12 lines, go-plugin/Terraform 10, VS Code 14, Vite/Rollup 16, MCP 12,
  Fastify/Obsidian 8 spot-checked). Web sources cited with URL and date.

## Findings (reviews)
- F1 · HIGH · D008 ruling, G003 · "built-ins through the same path" is stated by opencode
  (`PLAN.md:9`) and unmet in its code (`internal.ts:109-159,215`: 49 internal services); VS Code
  nulls proposals for non-built-ins (`extensionsProposedApi.ts:110-113`); Backstage's catalog
  alone meets it (0 internal imports) · a convention drifts the moment a fix is urgent ·
  enforce G003 mechanically: lint rule on the built-in folders' imports + a test registering
  the Anthropic translation from outside `inference`
- F2 · HIGH · G002, R216 · a `deno compile` host never fetches a module at run time: `http:`
  and `jsr:` "Module not found", `npm:` "Could not find constraint" unless the exact package is
  embedded, under `-A` and under `--allow-import` alike (probes 1–3) · a "lookup place" can only
  serve files the host then imports — the RCE the owner named · plugins are single-file bundles
  on disk; the host checks a hash against an approval record and imports verified bytes by
  `blob:` URL (0.4 ms small, ~40 ms for 433 KB); new roadmap item
- F3 · HIGH · G007, D004, D015, D011 · a plugin's copy of any `protocol` value is a second
  instance in a compiled host (ORCHESTRATOR; probe3 `sameConstructor: false`), zod 4 interoperates
  by traits · identity comparisons across the boundary silently fail · the host parses every
  crossing value with its own schema; identity travels as two fields (`PluginID` + the plugin's
  string); `import type` only from `protocol` in plugins
- F4 · MEDIUM · D011 · every out-of-process subject refuses an incompatible contract by number
  with the supported list (MCP `UnsupportedProtocolVersionError`, go-plugin `incompatible API
  version`, Terraform installer); MCP still rewrote its protocol wholesale (handshake removed,
  `2026-07-28/changelog.mdx:14`) · a number alone does not stop breaks but makes them refusals
  instead of crashes · add `PROTOCOL_VERSION` to `protocol` in P02 and the version to the
  descriptor; refuse with a typed error listing what is supported
- F5 · MEDIUM · D007, D008 ruling · a port is the largest contribution; blocks and rows are
  smaller than any port · read as "every contribution is a port", ports explode (Terraform's
  35 methods, 8 stubs `panic("not implemented")`); read as "ports are one kind", kuib has two
  paths (opencode's `transform` beside `hook`) · one descriptor, many contributions, each named
  for its extension point (row, block variant, format, port implementation)
- F6 · MEDIUM · D010 · same-path built-ins cost startup where they are code: Vite registers 28
  internal plugins per environment (`plugins/index.ts:60-155`), opencode makes session entry
  points wait for activation (`service.ts:29-34`) · built-in descriptors as data at start, code
  behind a literal `import()` the compiler embeds, loaded on first `resolve`
- F7 · MEDIUM · P03-I01 · conflicts in the subjects are precedence by position or kind (pi
  last-wins on one key, `compat.ts:128-140`; Vite/Rollup first-non-null vs chained; opencode
  `pre`/`post` lists with a comment, `internal.ts:233`) and were learned from bugs (pi#9068
  fail-open) · a duplicate identity in one extension point is a typed error at registration;
  order, where it exists, is data in the application's descriptor list; add to P03-I01's
  acceptance
- F8 · LOW · names · `inferencePluginAdapter` and `plugin.inference` have no sibling; the
  registry value and `PROTOCOL_VERSION` have none either · names without siblings go to the
  owner (AGENTS.md) · see `## Names`
- F9 · MEDIUM · Trust (question 9), G002 · in process a plugin has exactly the host's
  permissions (probe1); a Worker can be narrowed only behind `--unstable-worker-options`
  (probe2, escalation refused); a compiled plugin executable has what its author compiled in
  (probe2: ~15 ms, ~60 MB, 0.05–0.09 ms per crossing) · the first form protects nothing but
  the file's integrity · hash record now; Worker and subprocess forms later on the same
  descriptor; a block can never cross a process (called per frame), a port can
- F10 · LOW · engine-foundation D004, G003 · an application is the composition root that
  chooses descriptors (Backstage `backend.add`, Vite `plugins: [...]`), not a plugin and not
  the engine · its own tools and context policy enter through the same registration path ·
  record when engine-foundation takes up G003
- F11 · LOW · existing asymmetries · `tool.spec`/`defineTool`, `provider/model`/`createModel`
  + `FACTORIES`; a plugin-contributed tool would implement a port while tools are `ToolSpec`
  today · one idea named twice if `tool.port` is added beside `tool.spec` · owner's review
- F12 · MEDIUM · R216 open question "Plugin loading mechanism under Deno (npm specifiers at
  runtime vs bundled registry)" · answered by measurement: npm specifiers at run time do not
  work in a compiled host; bundled files do · absorb into the proposed roadmap item
