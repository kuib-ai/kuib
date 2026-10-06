---
title: Review of the namespace bundling research
date: 2026-10-06
origin: ["conversation 2026-10-06"]
---

# Review of the namespace bundling research

An independent check of [[features/engine-foundation/research/deno-namespace-bundling]] and its
three notes, made by a second session on 2026-10-06 at the owner's request. It covers three
things: the plan's repository facts against the code, every cited claim against the captured
sources, and small throwaway probes on the pinned Deno. Nothing here selects a design.

**Result: the sourcing is reliable, but the leading candidate is blocked on this workspace
today.** Native `import defer` works only under plain `deno compile`, and plain compile does not
produce a working kuib binary with the pnpm layout. Bundled compile works but rejects the syntax.
tsgo rejects the syntax under the house tsconfig. Literal dynamic imports stay lazy under bundled
compile and are the only loading change that works with the current toolchain.

## What was checked and holds

- `pnpm run check` passes with the feature in place; 114/114 claims are fresh.
- Every item under "Verified starting point" in [[features/engine-foundation/plan]] matches the
  code: `runAgent`, the double replay in `buildMessages`, the eager
  `index → run → serve → engine/telemetry` chain, telemetry SDK imports ahead of the endpoint
  check, nested default-object barrels, Deno 2.9.6, Zod 4.6.5.
- The probe files in `/tmp/opencode/namespace-probe` show what the synthesis reports.
- About 175 cited claims across the three notes were compared with the captures. No fabricated
  quote, wrong date, wrong version or wrong number was found.
- Deno #36560 was re-read live: still open, no maintainer reply, content as described.

## Probes on Deno 2.9.6 (Linux arm64, eos)

Run in `/tmp`, outside the repository. They are spot checks by a reviewer, not the P02
measurements, and they predate the owner review that the plan's blocker asks for.

| Path | `import defer` toy | The kuib host entry |
| --- | --- | --- |
| `deno run` | Works. An untouched sibling stays unevaluated behind a facade that re-exports deferred namespaces; `Protocol.Heavy.value` reads normally. | — |
| Plain `deno compile` | Works; deferral holds in the binary. | Compiles (59.62 MB embedded, 167 MB binary) and **fails at start**: `Could not find package '@jsr/std__collections'` from `@jsr/std__toml`. Same from the repo root and from `apps/host-tui`. |
| `deno compile --bundle` | **Rejected**: `Expected "from" but found "*"`. `deno bundle` fails the same way. | Works. |

- Deno 2.9.6 downloads **esbuild 0.25.5** (`~/.cache/deno/dl/esbuild-0.25.5-1`). No capture in the
  research states the version; it was taken from the issue reporter's machine.
- A literal dynamic `import()` stays unevaluated until called under both plain compile and
  `compile --bundle --minify`.
- **tsgo** (7.0.0-dev.20260707.2) and tsc 6.0.3 reject `import defer` under `module: NodeNext`,
  which is what `packages/tsconfig/base.json` sets: `TS18060: Deferred imports are only supported
  when the '--module' flag is set to 'esnext' or 'preserve'`. Both accept it under
  `module: Preserve`. Prettier accepts the syntax. The ESLint parser was not tested.
- **The compile directory changes the binary.** `compile --bundle --minify` of the host entry run
  from the repo root embeds the whole workspace `node_modules` (507.35 MB of files, 637 MB binary).
  Run from `apps/host-tui` it embeds 2.95 MB (108 MB binary). A likely cause, not confirmed: under
  BYONM the whole-tree fallback fires when any `.node` file exists in the scanned `node_modules`
  (captured PR #34529), and the root tree holds Nx's native addon.
- Each workspace package bundled alone from its own directory embeds under 1.1 MB.
- `kuib --help`, bundled and minified: about 127 ms median for the 108 MB binary and about 155 ms
  for the 637 MB one, against about 8 ms for a compiled hello-world. 15 runs after 3 warm-ups,
  spawned from Python.

Probe sources, for reproduction:

```ts
// heavy.ts
console.log("EVAL heavy");
export const value = 42;
// sibling.ts
console.log("EVAL sibling");
export const other = 7;
// facade.ts
import defer * as Heavy from "./heavy.ts";
import defer * as Sibling from "./sibling.ts";
export { Heavy, Sibling };
// main.defer.ts
import * as Protocol from "./facade.ts";
console.log("main start");
console.log("read", Protocol.Heavy.value);
console.log("main end");
// main.dynamic.ts
console.log("main start");
if (Deno.args[0] === "use") {
  const Heavy = await import("./heavy.ts");
  console.log("read", Heavy.value);
}
console.log("main end");
```

Commands, all with the workspace Deno and `--no-check -A`: `deno run`, `deno bundle`,
`deno compile -o <out>`, `deno compile --bundle [--minify] -o <out>`. For the host:
`deno compile [--bundle --minify] -o <out> src/index.ts` from `apps/host-tui`, and the same with
`apps/host-tui/src/index.ts` from the repo root.

## Binary size probes (same machine, later the same day)

- A compiled hello-world is 100.0 MB; the bundled, minified host is 108 MB. kuib's own embedded
  code is 2.95 MB, so the size is the runtime (`denort`, 104.9 MB unpacked).
- Of the runtime, `.text` is about 45 MB, `.rodata` 20.5 MB, and the symbol tables
  (`.symtab` 10.8 MB, `.strtab` 23.5 MB) about 34 MB.
- `strip` on a finished compiled binary breaks it in every variant tried (`--strip-debug`,
  `--strip-unneeded`, `--strip-all --keep-section=.note.sui --keep-section=.sui.phdrs`):
  `Could not find standalone binary section`. The embedded payload sits in `.sui.phdrs` and
  `.note.sui`, which strip relocates.
- **Stripping the runtime first works.** Unzip
  `~/.cache/deno/dl/release/v2.9.6/denort-aarch64-unknown-linux-gnu.zip`, run `strip --strip-all`
  on `denort` (67.3 MB), and compile with `DENORT_BIN=<stripped denort>`. The bundled, minified
  host is then 73.8 MB, prints its help, and starts in the same time (about 125 ms median). It
  compresses to 19 MB with xz and 22 MB with zstd. Only `--help` was exercised.
- Compressed size of the unstripped hello-world: 22 MB xz, 25 MB zstd, 32 MB gzip.
- `--engine quickjs`: hello-world is 59.1 MB, starts in 22 ms against 8 ms for V8, and idles at
  31 MB resident against 38 MB. The kuib host compiles to 62.1 MB and panics at start
  (`libs/core/modules/map.rs:1208`, `Option::unwrap()` on `None`).

## What the research missed or overstated

**In the synthesis and plan**

- The plain-compile failure was already on record in [[roadmap/research/startup-and-compile]]
  (2026-09-23, Deno 2.9.6, this workspace). The synthesis cites that file for timings but calls
  the pnpm question "not a guaranteed current failure", and plan G002 says pnpm inclusion
  "remain[s] unverified".
- "Plain compile + native deferred namespaces" is listed first among candidates without saying
  that it needs a working plain compile and a tsconfig `module` other than `NodeNext`.
- The community-patterns note calls `import defer` a "watch-list item" with Deno support
  unverified; the other two notes document it from Deno 2.8. The synthesis follows the latter
  without recording the conflict.
- `prepare.protocol.ts` builds a full-protocol probe with a `sideEffects: false` variant; no
  result for it is recorded.

**Deno runtime note**

- "Pure-ESM bundles that avoid that fallback are a different case" is overstated: the fallback
  depends on a `.node` file existing anywhere in the tree, reached or not (PR #34529 capture).
- Plain compile is called the "simpler module-preserving candidate" without saying that under
  BYONM it embeds every `node_modules` tree; the captured docs warn this "can make binaries large
  and slow to start".
- Discussion #28536 is called unanswered, but the capture holds the author's follow-up that the
  whole workspace is bundled. Issue #30509 also reports compile broken with the `hoisted` linker.
- Captured PR #32360 shows Deno filtering TS18060; the note does not connect that to the
  workspace's `NodeNext` setting.
- Left out: `--exclude` (the documented way to trim embedded `node_modules`), `--engine quickjs`
  (experimental, documented as lower startup and memory), and the Deno 2.9 statement that Deno
  does not read `pnpm-workspace.yaml` and migrates it into `package.json`.

**Namespace tree-shaking note**

- esbuild #3149 is misdescribed. The note relies on the maintainer's 2023-06-09 "I don't think
  it's possible" for `__NO_SIDE_EFFECTS__`; the capture shows him the next day "copying Rollup's
  current observable behavior", and the issue is closed. What shipped is not in the captures.
- "Direct compiled-executable evidence" for #36560 is overstated: the issue never reports running
  the binary. The probe above closes that gap for a toy.
- No capture shows two-level `A.B.C` pruning in any bundler; the only two-level evidence is the
  first session's Rollup 4.64.0 probe.
- Left out: in esbuild #2636 the TypeScript contributor reports export access through esbuild's
  namespace objects as "consistently 4x slower" than plain objects, compounding with fully
  qualified access. That bears on the nested-ESM candidate.
- A stated gap is answerable from the captures: Deno 2.9.6 passes `package.json` `sideEffects` to
  esbuild with tree-shaking on, and exposes no purity flags on `deno bundle` or `deno compile`.
- The esbuild changelog capture ends at 0.27.2; later releases exist and were not read.

**Community patterns note**

- esbuild's nested-namespace limit is called "historical"; the maintainer's wording is "currently
  only one level deep" and both issues are open.
- Effect's list of bundlers with deep scope analysis is Rolldown, Rollup and Webpack 5+. esbuild
  is absent and the note does not say so.
- RxJS is overstated as a namespace precedent: its guide frames `import * as rxjs` as importing
  everything and marks `rxjs/operators` deprecated.
- Next's `optimizePackageImports` is described as experimental; the source says "not recommended
  for production".
- Left out: TypeScript's own compiler as the closest precedent for a fixed public namespace
  shape; the Zod maintainer's statement that backend bundle size at Zod's scale "is not
  meaningful" and his use of self-overwriting getters for deferred initialization; esbuild's rule
  that property reads such as `foo.bar` are not side-effect free; Zod #6050, closed as completed
  on 2026-08-14, where a third-party repro reports Rollup and Webpack dropping unused locales
  while esbuild 0.28 keeps them.

## What this changes for the plan

- Native `import defer` needs a plain compile that works with this pnpm layout, or an esbuild in
  Deno that can bundle deferred imports, and a tsconfig `module` other than `NodeNext`.
- Coarse literal dynamic imports at the command, provider and telemetry boundaries work with the
  current toolchain and keep the dotted API. This is the synthesis's own first step.
- G002 should cite the existing record of the plain-compile failure.
- Compiles for measurement must state the directory they were run from.

Deno 2.9.7 was released on 2026-09-16. Its release notes were only skimmed for bundle and compile
entries; no esbuild bump was seen.
