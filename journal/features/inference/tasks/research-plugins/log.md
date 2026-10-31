# research-plugins — log

## 2026-10-25 22:50 — start
- Read WORKER.md, brief; context: AGENTS.md rules, inference plan decisions/gaps/items listed in
  the brief, synthesis shapes 4 and 7, extension axes of the four prior-art files,
  engine-foundation D001/D002/D004/D007, G001–G003, deno-namespace-bundling research, R009,
  R216, R217, R221, claims protocol-ports / package-barrels / house-structure-rules and the
  code they point at (protocol ports, enums, tools/tool.spec, engine/provider/model).
- Wrote plan.md. Started background sparse clones via
  /var/tmp/kuib-prior-art/research-plugins-scripts/clone.sh (log: clone.log beside it).
- Deno: workspace binary is 2.9.6 (aarch64 linux). Memory: 7.5 GB, 4.4 GB available.
- Next: read subjects as clones land (opencode, pi first), start the research file.

## 2026-10-25 23:05 — clones done, sub-agents out, orchestrator's Deno facts received
- All clones in /var/tmp/kuib-prior-art/research-plugins (cone sparse): opencode 450e7b9,
  pi d5b3de2, vscode ef01428, backstage 2fea3e2, vite 82e7aa0, rollup 7726f83, go-plugin
  fa60f8a, terraform 5598830, mcp-spec dae694f, mcp-ts 951fe56, fastify 5df959f, obsidian-api
  9abd960. opencode has restructured since 2026-10-08: plugin system now in
  packages/core/src/plugin/ (built-in providers under plugin/provider/*.ts).
- Six read-only sub-agents searching: vscode, backstage, vite+rollup, go-plugin+terraform,
  mcp spec+sdk, fastify+obsidian. Every cited line to be reopened in the source.
- Orchestrator's message (2026-10-25, Deno 2.9.6, host `deno compile -A`, plugin as file URL to
  import() at runtime): local .js loads; .ts with own enum + relative import loads; module
  Worker loads; data: URL loads; plugin importing npm:zod / jsr:@std/text FAILS in the compiled
  host ("Could not find constraint zod@3.23.8 in the list of packages", "Module not found:
  jsr:@std/text@1/to-kebab-case") and loads once bundled with `deno bundle` into one .js;
  a plugin importing the host's own lib.ts gets a SECOND instance (symbol compares false) in the
  compiled host, same instance under `deno run`. To be cited as the orchestrator's probe.
  My probes go to what is unmeasured: https: import with --allow-import, Worker permissions
  in a compiled binary, subprocess over stdio cost, startup/per-call cost of each path,
  `--include` for computed specifiers, and a plugin carrying its own zod vs the host's.
- Next: read opencode plugin sources (saved dump), then pi, then probes.

## 2026-10-25 23:15 — ruling on D008 received (orchestrator's message)
- Owner ruled on inference D008 on 2026-10-25 (now in plan.md): plugins implement ports of the
  shape protocol already holds (event.log.port, file.system.port, discovery.port), named like
  them, with kuib's own functionality registered through the same path. A ruling: risks it
  carries are reported; it is not reopened. The detailed cut, names and loading stay in scope.
- opencode read so far (450e7b9, packages/core/src/plugin/): hooks.ts (hook registry keyed
  `${domain}.${name}`, provider-scoped callbacks, sequential trigger, Scope finalizer dispose);
  internal.ts (built-ins are `InternalPlugin = Plugin<Requirements|Scope>` resolved with 49
  internal services via Effect.provide(context) — a path a third party does not get; `pre` and
  `post` ordered lists; `guarded` ids that remove operations skip); module.ts (plugin = default
  export {id, effect|setup}; npm.add installs packages at runtime; ManagedPolicy may deny
  `plugin:<target>`); instance.ts (duplicate ids throw); plugin.ts (activate: duplicate id dies;
  prefix diff by (id, revision); registrations ordered by setup; failed revision not retried).

## 2026-10-25 23:25 — resume instruction and a ninth question
- Orchestrator: resume (reread WORKER.md, brief, log) — context intact, continuing where the
  log ends. Brief reread: no `## Go` / `## Resume` section appended at this time.
- Ninth question added by the orchestrator's message (the other eight stand): **9. Trust.**
  Owner, 2026-10-25: plugins built against protocol's types, compiled, "and maybe have a lookup
  place; but that would result in RCE". Answer from subjects and measurement: who decides which
  code runs (explicit install, record of approval, hashes/signatures, registries and their
  supply-chain failures); what a plugin reaches in process vs a Deno worker with narrowed
  permissions (measure 2.9.6, flags included) vs a separate process with declared permissions;
  which contributions can be data with no code. Build-time type-check against protocol and
  refusing an incompatible plugin belong to question 6. Section `## Trust`; carried into the
  recommendation.
- opencode read: plugin/src/effect/plugin.ts (Plugin {id, effect(ctx)} with a Context of 24
  domains = one general plugin object), host.ts (resolve entrypoints server/tui/rpc; load =
  importModule), source.bun.ts/source.node.ts (runtime-specific loaders, reload by digest),
  runtime.ts ("plugins must use the host's effect and @opencode/plugin modules" — foreign
  copies throw; solved with a Bun.plugin module interceptor), provider/vllm.ts (built-in
  provider plugin id "opencode.provider.vllm" via createLocalProviderPlugin).
- Next: saved dump bdm2p5f29.txt (PLAN.md, README.md, effect/provider|model|aisdk|tool.ts,
  schema/plugin.ts, dynamic.ts, figma plugin, local.ts, config source), then pi.

## 2026-10-26 00:05 — opencode, Backstage, go-plugin/Terraform, pi written; probes batch 1 done
- Research file has: frontmatter, What was read, opencode, pi, Backstage, go-plugin/Terraform.
  Sub-agents done: fastify/obsidian, backstage, go-plugin/terraform, vscode (not yet written);
  running: vite/rollup, mcp. Every cited line from a sub-agent spot-checked in the source
  before writing (Backstage 12 lines, gp/tf 10 lines).
- Probe batch 1 (probe1.log): compiled -A host does NOT import http:// at runtime ("Module not
  found"), deno run -A does; `--allow-all conflicts with --allow-import`; a compiled host
  without --allow-read still imports a local file plugin (module loading is not a read
  permission) but the plugin cannot readTextFile; in-process plugin has exactly the host's
  permissions (host -A: read-ok, env-ok, run-ok); Worker.deno.permissions needs
  `--unstable-worker-options` at compile; subprocess over stdio (deno run child): ready
  ~40-44 ms, round trip ~0.09-0.11 ms, child RSS ~44 MB; in-process import of a local plugin
  ~0.15 ms; binaries ~108.8 MB; first compile 8.3 s then ~0.5 s.
- Probe batch 2 running (probe2.log): http import with --allow-import compiled in, Worker
  permissions with the unstable flag, compiled plugin executable over stdio, zod identity
  (npm: in plugin, bundled plugin), hash-then-data: URL import, process floor.
- Next: VS Code section (spot-check first), Vite/Rollup and MCP when they land, secondary
  subjects, web issues for opencode/pi harms, Deno section from probe logs, Trust, Cuts,
  Recommendation, Unverified leads; then report.md.

## 2026-10-26 00:40 — VS Code written; probes 2 and 3 done; vite/rollup landed
- VS Code section written after reopening 14 cited lines. Vite/Rollup sub-agent done (being
  spot-checked). MCP sub-agent still running.
- Probe batch 2 (probe2.log): compiled host WITH --allow-import=127.0.0.1:18777 still "Module
  not found" for http:// at runtime (deno run with same flags works) → a compiled binary never
  fetches remote modules at runtime; Worker deno.permissions with --unstable-worker-options
  compiled in: inherit = host perms, "none" = nothing, narrowed {read:[/etc/hostname]} works,
  escalation refused "NotCapable: Can't escalate parent thread permissions"; Worker ready
  11-27 ms, round trip 0.05-0.066 ms; compiled child plugin executable over stdio: ready
  12-16 ms, round trip 0.053-0.091 ms, RSS ~63 MB; binaries 104.9 MB (tiny) / 108.8 MB (host);
  tiny startup 9-15 ms; 433 KB bundled plugin import 19-31 ms.
- Probe batch 3 (probe3.log): plugin `npm:zod@4.1.0` loads in compiled host ONLY because the
  host embedded that exact package (sameConstructor true); `npm:zod@3.23.8` fails "Could not
  find constraint 'zod@3.23.8' in the list of packages."; `jsr:@std/text` fails "Module not
  found"; bundled plugin inlines zod → second instance (sameConstructor false) but zod 4
  instanceof and host parsing with the foreign schema both succeed (traits-based); hash then
  import via data: or blob: URL works (840 B: 0.4-1.8 ms; 433 KB: ~40 ms); a relative import
  inside a data: module fails → verified-bytes loading needs a single-file bundle.
- Next: Vite/Rollup section, MCP when it lands, secondary subjects (fastify/obsidian), web
  issues (opencode, pi), Deno docs citations, then Deno/Trust/Cuts/Recommendation/Leads.

## 2026-10-26 01:10 — all six sub-agents done; subjects written; web harms added
- Research file now holds: opencode, pi, VS Code, Backstage, Vite/Rollup, go-plugin/Terraform,
  MCP, secondary (Fastify, Obsidian). Added from the web: opencode V2 migration guide (hard
  break, 18-row mapping, "not always exact renames"), pi#9068 (user_bash fail-open → fail-closed).
  Deno security doc read (same-thread privilege, Worker with reduced permissions, --allow-import
  gates import(someVariable)).
- Next: Deno section (from probe1-3 logs + orchestrator's facts + docs), Trust, Cuts for kuib,
  Recommendation, Unverified leads; then pnpm journal check and report.md.

## 2026-10-26 01:50 — research file complete, journal check green; writing report
- Owner's context rule received (via orchestrator): at 60% context, log state, `done … restart`,
  stop. Estimated use is below that; finishing with report.md and `done`.
- Research file (1,348 lines) complete: frontmatter; What was read; How the subjects cut it
  (opencode, pi, VS Code, Backstage, Vite/Rollup, go-plugin/Terraform, MCP, secondary Fastify +
  Obsidian + Grafana in Trust); Deno (probes 1-3 + orchestrator's facts + docs); Cuts for kuib
  (A-F + ruling's risks); Trust (Q9); Recommendation (cut, names table, built-ins, loading,
  identity, applications, now vs waits, roadmap item); Unverified leads.
- `pnpm journal check`: 0 errors, 0 warnings.
- State if restarted: only report.md and `pnpm orchestra done research-plugins` remain. Report
  findings (drafted): F1 built-ins same path must be enforced (G003 lint+test); F2 compiled host
  fetches no code → single-file bundles + hash record, roadmap item; F3 second instance →
  data at boundary, two-field identity (G007); F4 PROTOCOL_VERSION + descriptor version +
  refusal listing supported (D011); F5 port = largest unit, one descriptor many contributions
  (D007/D008 risk); F6 startup cost of same-path built-ins → descriptors as data + literal
  import() (D010); F7 P03-I01: duplicate identity = typed error, no load-order precedence;
  F8 names without sibling (inferencePluginAdapter, plugin.inference, registry value); F9
  trust forms measured; F10 application = composition root (engine-foundation D004); F11
  asymmetries tool.spec/defineTool, provider/model/createModel+FACTORIES; F12 R216 question
  answered by measurement.
