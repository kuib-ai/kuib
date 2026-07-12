---
title: "House-Style Linting"
type: implementation
status: in-progress
layer: process
created: 2026-06-30
tags: [linting, eslint, house-style, context-graph, conventions, tooling]
depends-on: ["[[architecture-overview]]", "[[protocol-design]]"]
informs: ["[[journal-system]]", "[[testing-strategy]]"]
---

# House-Style Linting

A custom ESLint plugin that encodes the user's hand-coding conventions (so agent-written code matches the user's idiom and stays comprehensible) and enforces the code→journal context graph. **Built and verified** (session 2026-06-30): runs against `packages/protocol/src/message.ts` with 42 warnings, 0 errors, rules firing correctly.

Package: `kuib/packages/eslint-plugin-house-style` (`@kuib/eslint-plugin-house-style`). Modeled on a prior custom ESLint plugin (`ESLintUtils.RuleCreator`). Loaded from TS source via jiti in `kuib/eslint.config.ts`. All rules at **`warn`** (non-blocking; bulk-fix at boundaries, not per-commit). The plugin itself is written in the house style (dot.case dir-per-unit, default exports, const function-expressions, zero comments).

## The house style (audited from the author's hand-written reference codebase)

The author's cleanest hand-written code. Conventions:

- **S1** one unit per file (even a single scalar gets its own file).
- **S2** each unit is `index.ts`/`index.tsx` in its own directory; the directory name is the unit name.
- **S3** directory/file names are **dot.case** (`is.active`, `theme.toggle`). Exempt: `index`, `*.slice`, `*.middleware`, `deprecated`, `*.d`.
- **S4** pure-module barrels compose a **namespace object** (default-exported), never `export *`. (Component/service barrel conventions for Solid are still OPEN.)
- **C1** the unit is `export default`; named exports must be types/interfaces/enums. **Package/app root barrels are stricter:** only `export default` the namespace object — no named type re-exports. Types are imported from section subpaths (`@kuib-ai/cli/cli.schema`), never from the package root. Enforced by `no-package-barrel-named-exports` + `no-named-import-from-package-root`.
- **C2** units are `const x = function (...) {}` — never `function foo(){}` declarations, never arrows (allows generic `function <T>`). React/Solid components too.
- **C3** strict equality; loose/truthy only in direct boolean checks (`if (data)`).
- **C4** no `try/catch` — errors handled explicitly via Go-style tuple helper (`const [err, val] = await withError(...)`). Override via `eslint-disable`.
- **C5** labeled blocks (`Label: { … break Label; }`) are an intentional construct — `no-labels` stays OFF.
- **C6** **zero comments.** The only allowed comments are `@context` links and `eslint-disable`/`ts-` directives. Code is self-explanatory by style.

(Three module archetypes were found in the reference codebase: pure-module = namespace-object barrel; component = named re-export barrel; service/store = `export *`. Only the pure-module convention is locked; the component/service archetypes are deferred to the Solid bucket because they were React-derived.)

## Rules (final set)

Custom (in the plugin), all `error` (severity flipped from `warn` 2026-07-01):

- `require-context-link` — each file must carry one `@context @journal/<entry>` → resolves to `journal/<entry>/decisions.md` (flat layout; the resolver walks up past the `kuib/` monorepo root to find the `journal/` dir, since the journal sits one level above). Flags missing / dead / stale (stale = the target ADR still contains the unfilled scaffolding placeholder token, i.e. `FEATURE_NAME` wrapped in double braces). Per-file granularity (synergy with S1).
- `dot-case-filename` (S3) · `no-top-level-arrow` (C2, arrows) · `named-exports-are-types` (C1/S1) · `no-package-barrel-named-exports` / `no-named-import-from-package-root` (C1 barrel: default-only root, types via section subpaths) · `no-re-exports` (ban `export … from` / `export * from` — import the defining unit) · `no-prose-comments` (C6) · `no-destructure-props` (Solid: destructuring props breaks reactivity — `.tsx` only, on JSX-returning functions) · `no-cross-package-relative` (bans relative imports that escape the `packages/*`/`apps/*` boundary — pure path math, no resolver; see RESOLVED section below).

Reused built-ins (per "reuse existing plugins"), all `error`:

- `func-style: ["error","expression"]` (C2, declarations) · `no-restricted-syntax` on `TryStatement` (C4) · `eqeqeq: ["error","always"]` (C3) · `no-labels: off` (C5) · `no-restricted-imports` (protocol subpath value-imports). Severities + rule set live in the plugin's `configs.recommended`, consumed by `eslint.config.ts`.

## Decisions

- **No protocol exemption** — Zod schemas follow house style too. The `z.infer` wrinkle dissolves: `const X = z.object(...); type X = z.infer<typeof X>; export default X; export type { X }` (default-export schema, named type export — C1-compliant). Implies refactoring `message.ts`/`id.ts`/`event.ts` into broken-down dot.case files with default exports. The 42 `named-exports-are-types` warnings on `message.ts` ARE this refactor signal.
- **TypeScript switched to stable 6.0.3** (from TS7 native-preview `7.0.1-rc`) — the TS7 native package has no classic `lib/typescript.js` JS API, so `typescript-eslint` couldn't load. 6.0.3 is in typescript-eslint 8.62's supported `<6.1.0` range. tsgo (`@typescript/native-preview`) still used for builds; classic `tsc` kept at root only for eslint. (See [[architecture-overview]] build system.)
- Catalog deps added via `pnpm add --save-catalog` (registry-resolved), never hand-written versions.

## Types: named enums over bare unions; tagged unions only when shapes diverge (2026-07-01)

Studied the author's type-structuring across `figr/identity` + kuib protocol. Locked:

- **Discriminator values → a named `*.enum.ts` enum, never a bare string-literal union.** Both `ProjectsEnum` (identity) and `PartTypeEnum` (kuib) do this; `named-exports-are-types` already allows `export enum`. (Fixed: `apps/host-tui` `TranscriptRole = "user"|…` → `TranscriptRoleEnum` in its own `transcript.role.enum/`, with `transcript.entry`, `fold.transcript`, and a namespace barrel — mirroring `protocol/src/part/`.)
- **Generic machinery in identity** (the "complicated generics"): generic utility wrappers (`DeepPartial<T>`, `HydratedDocument<T>`, `PartialBy<T,K>`, conditional `T extends object ? …`), **tagged discriminated unions** (`TokenBooleanValueByMode | TokenStringValueByMode | …`, each `{ type: SomeEnum.X; value }`), `Exclude`-derived enum subsets, and **enum-keyed `Record`** (`Record<ColorInfoEnum, …>`).
- **Apply only where warranted (don't cargo-cult):** the enum-keyed `Record` _does_ fit (`roleColor: Record<TranscriptRoleEnum, string>`). A **tagged discriminated union does NOT yet** — identity only splits a union when variant _shapes diverge_ (boolean vs color value); the transcript entries are uniform `{id, role, text}`, so a union would be N identical members. Use a **single structured type + the enum** now; switch to the tagged union the moment a role's shape diverges (e.g. `tool` gaining `callID`/status). Generic wrappers don't fit a concrete view-model. In-memory view-models stay plain `type` (not Zod) — Zod is only for wire/disk/process boundaries.

## RESOLVED: relative imports — cross-package-only ban (2026-07-01)

Decided **(ii) cross-package only**: within-package `../unit` relatives stay; only relatives that _escape_ a package are banned. Enforced by a **custom `house/no-cross-package-relative` rule** (pure `node:path` math against the `packages/*` / `apps/*` layout — no resolver, no dependency, deterministic; verified it fires cross-package and allows within-package). Cross-package relatives were already ≈0, so the rule is preventive; no codemod was needed.

**Why NOT total-ban / absolute-everywhere `@/` (investigated and rejected, with evidence):**

- **`@/` self-alias does not survive `tsc` declaration emit.** A spike on `std` showed the emitted `.d.ts` contains `import("@/async.with.error")` **unresolved** — TypeScript never rewrites `paths` aliases in output (by design; the TS team declined this). A consumer then either errors `TS2307` or, under `skipLibCheck: true`, silently degrades the type to `any` (a **false green**). Verified with a type probe.
- **Project references + Nx sync do NOT fix it** — they make consumers read the dependency's `.d.ts` instead of source, but the `@/` still leaks into that `.d.ts`. Nx sync only auto-maintains the `references` arrays; it doesn't change what `tsc` emits. References relocate the problem, they don't resolve it.
- **Runtime is fine either way** — Bun resolves `@/` per-file (nearest tsconfig); the break is TypeScript-only.

**Deferred routes to literal `@/` (long-running; not adopted now):**

- **(A) literal `@/`** = project references + Nx sync + declaration emit + a `.d.ts` path-rewriter (`tsc-alias` / `ts-patch` `typescript-transform-paths`). Delivers the `@/` token but bolts a real build pipeline onto a zero-build, run-source-on-Bun repo.
- **(B) globally-unique `@pkg/*` aliases** in the root base tsconfig (`@std/* → packages/std/src/*`, …) — resolves locally via tsconfig `paths`, bypasses the export map, exposes nothing externally, needs no rewriter/build. Works in tsc + Bun; not the literal `@/` token.

Author is fine with the current config (within-package relative + `@kuib-ai/<pkg>` cross-package); (A)/(B) can be revisited later.

**Rejected `eslint-plugin-import-x` for the rule:** it needs a native `unrs-resolver` + build-approval + resolver settings, and `no-relative-packages` still **silently didn't fire** without full resolver config. The custom rule is dependency-free and actually enforces — a case where custom beats prebuilt.

## Lint infra changes (2026-07-01)

- **All house rules are now `error`** (was `warn`). Flipping surfaced **zero** violations beyond relative-imports — the codebase was already clean on every other rule.
- **Rule config lives in the plugin**, not `eslint.config.ts`: the plugin exports `configs.recommended` (custom `house/*` rules + reused built-ins `func-style`/`eqeqeq`/`no-restricted-imports`/`no-restricted-syntax`/`no-unused-vars`, all `error`); `eslint.config.ts` just does `rules: houseStylePlugin.configs.recommended.rules`.
- **The plugin dogfoods itself** — removed from the ignore list; `@context` added to every rule file; plugin typecheck + `eslint .` green. It uses `@typescript-eslint/utils` + `node:path` (the right tools); it correctly does **not** depend on `@kuib-ai/std` (rules are synchronous, so `withError` doesn't apply).
- **Circular-dependency detection via `madge`** — `pnpm check:circular` (`madge --circular --extensions ts,tsx packages apps`); currently **0 cycles** across 143 files. This is the real guard against barrel cycles, independent of import path style.

## Open Questions — Solid-JSX linting bucket (deferred)

React-derived rules can't be ported to Solid (different component model). Still open:

- Solid component definition + the no-destructure-props rule scope.
- Component/service barrel archetypes in Solid (named re-export? `export *`?).
- State idioms (signals/stores/memos — the RTK replacement).
- Props typing (`type` vs `interface`) for components.
- Solid reactivity lints (effect deps, etc.).

## prefer-guard-clauses rule (2026-07-03)

New plugin rule `house/prefer-guard-clauses`: every `else` branch is an error — invert into a guard clause (early return/continue/throw); dispatch on a discriminant with `switch`. Reports once per chain (topmost `if`), distinct messages for plain `else` vs `else if` chains. Escape hatch is an eslint-disable comment, same convention as the try/catch ban. Lives in the plugin's recommended config — house preferences are never wired loosely into `eslint.config.ts`. The orchestrator's fullStream `else if` chain was converted to `switch` when the rule landed.
