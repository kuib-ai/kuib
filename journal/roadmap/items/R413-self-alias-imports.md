---
id: R413
title: Literal `@/` self-alias for intra-package imports
state: idea
horizon: maybe
domains: [infra]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/house-style-linting/decisions#RESOLVED: relative imports — cross-package-only ban (2026-07-01)]]"]
touched: 2026-09-22
---

# R413 — Literal `@/` self-alias for intra-package imports

## Idea

Replace within-package `../unit` relatives with absolute self-aliases. Two routes were
investigated and deferred:

- **(A) literal `@/`** — project references + Nx sync + declaration emit + a `.d.ts`
  path-rewriter (`tsc-alias` / `ts-patch` `typescript-transform-paths`). Delivers the `@/` token
  but bolts a real build pipeline onto a zero-build, run-from-source repo.
- **(B) globally unique `@pkg/*` aliases** in the base tsconfig (`@std/* →
  packages/std/src/*`, …) — no rewriter or build, exposes nothing externally; not the literal
  `@/` token.

Evidence gathered: `@/` does not survive declaration emit (the emitted `.d.ts` keeps
`import("@/…")` unresolved; consumers get `TS2307` or, under `skipLibCheck`, a silent `any` —
a false green). Project references and Nx sync only relocate the problem. Runtime is the new
blocker: **Deno does not apply tsconfig `paths`**, so any alias must resolve through package
`exports` or an import map (and there is deliberately no `deno.json`). `@std/*` would also
collide with JSR's `@std` packages already in use.

## Why

Absolute intra-package imports read better; the author is fine with the current setup, so this
is optional.

## Open questions

- Is there any alias route compatible with Deno-as-pure-runtime and no `deno.json`?

## Constraints already decided

- Relative imports banned only across packages: [[domains/infra/decisions#^D017]].
- Deno is a pure runtime with no `deno.json`: [[domains/infra/decisions#^D004]].

## History

- 2026-09-22 migrated from the archive
