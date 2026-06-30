---
title: "House-Style Linting"
type: implementation
status: in-progress
layer: process
created: 2026-06-30
tags: [linting, eslint, house-style, context-graph, conventions, tooling]
depends-on: ["[[architecture-overview]]", "[[protocol-design]]"]
informs: ["[[journal-system]]"]
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
- **C1** the unit is `export default`; named exports must be types/interfaces/enums.
- **C2** units are `const x = function (...) {}` — never `function foo(){}` declarations, never arrows (allows generic `function <T>`). React/Solid components too.
- **C3** strict equality; loose/truthy only in direct boolean checks (`if (data)`).
- **C4** no `try/catch` — errors handled explicitly via Go-style tuple helper (`const [err, val] = await asyncWithError(...)`). Override via `eslint-disable`.
- **C5** labeled blocks (`Label: { … break Label; }`) are an intentional construct — `no-labels` stays OFF.
- **C6** **zero comments.** The only allowed comments are `@context` links and `eslint-disable`/`ts-` directives. Code is self-explanatory by style.

(Three module archetypes were found in the reference codebase: pure-module = namespace-object barrel; component = named re-export barrel; service/store = `export *`. Only the pure-module convention is locked; the component/service archetypes are deferred to the Solid bucket because they were React-derived.)

## Rules (final set)

Custom (in the plugin), all `warn`:

- `require-context-link` — each file must carry one `@context @journal/<entry>` → resolves to `journal/<entry>/decisions.md` (flat layout; the resolver walks up past the `kuib/` monorepo root to find the `journal/` dir, since the journal sits one level above). Flags missing / dead / stale (stale = the target ADR still contains the unfilled scaffolding placeholder token, i.e. `FEATURE_NAME` wrapped in double braces). Per-file granularity (synergy with S1).
- `dot-case-filename` (S3) · `no-top-level-arrow` (C2, arrows) · `named-exports-are-types` (C1/S1) · `no-prose-comments` (C6) · `no-destructure-props` (Solid: destructuring props breaks reactivity — `.tsx` only, on JSX-returning functions).

Reused built-ins (per "reuse existing plugins"):

- `func-style: ["warn","expression"]` (C2, declarations) · `no-restricted-syntax` on `TryStatement` (C4) · `eqeqeq: ["warn","always"]` (C3) · `no-labels: off` (C5).

## Decisions

- **No protocol exemption** — Zod schemas follow house style too. The `z.infer` wrinkle dissolves: `const X = z.object(...); type X = z.infer<typeof X>; export default X; export type { X }` (default-export schema, named type export — C1-compliant). Implies refactoring `message.ts`/`id.ts`/`event.ts` into broken-down dot.case files with default exports. The 42 `named-exports-are-types` warnings on `message.ts` ARE this refactor signal.
- **TypeScript switched to stable 6.0.3** (from TS7 native-preview `7.0.1-rc`) — the TS7 native package has no classic `lib/typescript.js` JS API, so `typescript-eslint` couldn't load. 6.0.3 is in typescript-eslint 8.62's supported `<6.1.0` range. tsgo (`@typescript/native-preview`) still used for builds; classic `tsc` kept at root only for eslint. (See [[architecture-overview]] build system.)
- Catalog deps added via `pnpm add --save-catalog` (registry-resolved), never hand-written versions.

## Types: named enums over bare unions; tagged unions only when shapes diverge (2026-07-01)

Studied the author's type-structuring across `figr/identity` + kuib protocol. Locked:

- **Discriminator values → a named `*.enum.ts` enum, never a bare string-literal union.** Both `ProjectsEnum` (identity) and `PartTypeEnum` (kuib) do this; `named-exports-are-types` already allows `export enum`. (Fixed: `apps/host-tui` `TranscriptRole = "user"|…` → `TranscriptRoleEnum` in its own `transcript.role.enum/`, with `transcript.entry`, `fold.transcript`, and a namespace barrel — mirroring `protocol/src/part/`.)
- **Generic machinery in identity** (the "complicated generics"): generic utility wrappers (`DeepPartial<T>`, `HydratedDocument<T>`, `PartialBy<T,K>`, conditional `T extends object ? …`), **tagged discriminated unions** (`TokenBooleanValueByMode | TokenStringValueByMode | …`, each `{ type: SomeEnum.X; value }`), `Exclude`-derived enum subsets, and **enum-keyed `Record`** (`Record<ColorInfoEnum, …>`).
- **Apply only where warranted (don't cargo-cult):** the enum-keyed `Record` _does_ fit (`roleColor: Record<TranscriptRoleEnum, string>`). A **tagged discriminated union does NOT yet** — identity only splits a union when variant _shapes diverge_ (boolean vs color value); the transcript entries are uniform `{id, role, text}`, so a union would be N identical members. Use a **single structured type + the enum** now; switch to the tagged union the moment a role's shape diverges (e.g. `tool` gaining `callID`/status). Generic wrappers don't fit a concrete view-model. In-memory view-models stay plain `type` (not Zod) — Zod is only for wire/disk/process boundaries.

## OPEN: relative imports — scope undecided (2026-07-01)

Author wants "no relative imports + a lint rule." **Conflicts with the deliberate type-only-subpaths decision** (within a package, _value_ imports must be relative unless `exports` expose runtime subpaths — currently `"./*": { types }` only, on purpose, to stop consumers importing internal defaults; enforced by the `no-restricted-imports` rule on `@kuib-ai/protocol/*`). Audit: **232 relative imports** (protocol 39, daemon 7, host-tui 7, engine 6, …) — almost all _within-package value imports_. Two scopes:

- **(i) Total ban** — expose runtime subpaths in every `exports` map, drop the protocol restriction, self-reference, codemod all 232 → `@kuib-ai/…`, add no-relative rule. Reverses 2 decisions; loses internal-default encapsulation.
- **(ii) Cross-package only** — ban relative imports that _escape_ a package (`import/no-relative-packages`); keep within-package relative (the universal norm, preserves encapsulation). Cross-package relatives already ≈0.

**Recommended (ii); awaiting the author's call before adding the rule.**

## Open Questions — Solid-JSX linting bucket (deferred)

React-derived rules can't be ported to Solid (different component model). Still open:

- Solid component definition + the no-destructure-props rule scope.
- Component/service barrel archetypes in Solid (named re-export? `export *`?).
- State idioms (signals/stores/memos — the RTK replacement).
- Props typing (`type` vs `interface`) for components.
- Solid reactivity lints (effect deps, etc.).
