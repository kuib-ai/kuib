---
title: Deno namespace bundling and deferred initialization
date: 2026-10-06
origin: ["conversation 2026-10-06"]
---

# Deno namespace bundling and deferred initialization

Research for [[features/engine-foundation/plan]], informing
[[roadmap/items/R015-distribution]] and [[roadmap/items/R221-self-contained-engine]], extending
[[roadmap/research/startup-and-compile]]. Options remain proposals.

**Yes: `Protocol.Message.User` can remain the readable API while selected modules stay uninitialized or unused code is pruned—but the current nested default-exported objects provide neither guarantee.** One `deno compile` executable can contain separately evaluated modules; a flat bundle is optional. Native `import defer`, documented since Deno 2.8, makes synchronous namespace access a credible investigation path, although this application's Deno 2.9.6 compiled/bundled behavior remains unverified. Existing probes establish limited tree-shaking behavior, not startup or memory savings. The recommended next step is an owner-approved, native-first validation sequence before choosing export representations or build tooling. ([Deno compilation](https://docs.deno.com/runtime/reference/cli/compile/), [deferred evaluation](https://docs.deno.com/runtime/fundamentals/modules/#deferred-module-evaluation))

Research date: **2026-10-06**. This synthesis uses the researchers' **Firecrawl CLI search and scrape** results and existing local artifacts. No new experiments were run; the options below are proposals.

## The current object graph is eager; pruning has two separate barriers

Ordinary static imports evaluate their dependency graph before the importing module's body. Constructing `Protocol` from imported `Message` objects therefore does not make untouched properties lazy. Merely changing the import spelling to `import * as Protocol` also supplies no evaluation boundary. ([Import semantics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#hoisting))

For pruning, distinguish **flat ESM namespaces**, **nested namespace reexports**, and **ordinary objects**. In July 2021, esbuild maintainer Evan Wallace explained: “Imports are only tracked through one level, not through multiple levels.” His October 2022 explanation describes namespace-property devirtualization as one level deep. Thus flat `Message.User` can become a direct binding while `Protocol.Message.User` through reexported namespaces retains siblings. These are dated implementation explanations, corroborated by our limited current-runtime probes, not a language restriction. ([Maintainer, #1420](https://github.com/evanw/esbuild/issues/1420#issuecomment-873786196), [architecture, #2636](https://github.com/evanw/esbuild/issues/2636#issuecomment-1295405909))

**Default objects are a separate limitation.** Wallace's January 2023 response explains that `lib.foo()` supplies the entire object as `this`; removing sibling properties can change behavior. Unknown computed access, reflection, mutation and escaping objects further constrain analysis. Even after reachability is resolved, schema-construction calls introduce another barrier: unused results do not establish effect-free initialization. ([Maintainer, #2855](https://github.com/evanw/esbuild/issues/2855#issuecomment-1398604378), [effect analysis](https://esbuild.github.io/api/#tree-shaking-and-side-effects))

Community practice supports readable namespaces without promising arbitrary-depth optimization. Effect documents both root namespace imports and direct section imports, qualifying the former by bundler deep-scope analysis. Section imports preserve `Message.User`, but lose the required outer qualifier. The archived Lodash Babel plugin demonstrates preserving dotted authored calls while emitting leaf imports; extending that to this application's nested paths would require deliberate semantic analysis. Neither precedent selects architecture here. ([Effect](https://effect.website/docs/v3/micro/effect-users#importing-micro), [Lodash plugin](https://github.com/lodash/babel-plugin-lodash))

## One executable permits deferral, but native defer needs pipeline verification

**Plain `deno compile` embeds a module graph.** String-literal dynamic imports and their dependencies are included automatically; undiscoverable computed imports need explicit inclusion. `import()` remains Promise-based: an asynchronous feature activation can precede synchronous dotted access, but cannot transparently return a schema synchronously on its first property read. Experimental `compile --bundle` is distinct: Deno 2.9.6 disables code splitting and inlines imports. Esbuild can preserve asynchronous initialization inside one bundle, without promising deferred parsing or omitted bytes. ([Compile documentation](https://docs.deno.com/runtime/reference/cli/compile/#dynamic-imports), [2.9.6 implementation](https://raw.githubusercontent.com/denoland/deno/v2.9.6/cli/tools/bundle/mod.rs), [esbuild semantics](https://esbuild.github.io/api/#splitting))

**Native `import defer` defers module evaluation, not individual exports.** Deno 2.8+ documents experimental support: loading/parsing/linking precede synchronous evaluation on namespace-property access. Capturing or reexporting the deferred namespace binding does not itself evaluate it; reading exports, including `.default`, during eager facade assembly does. Consequently, wrapping today's default objects with deferred imports and immediately extracting their defaults defeats deferral. Deferring only the root postpones its synchronous eager graph until first use; it does not tree-shake nested objects. Exact spelling requires a deliberately designed facade/export representation. Independently deferred siblings require appropriate module boundaries and no alternative eager path. Top-level-await modules and dependencies needed to evaluate them run eagerly. ([Deno 2.8](https://deno.com/blog/v2.8#import-defer), [namespace triggers and asynchronous dependencies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import/defer))

A concrete adjacent-version report sharpens the uncertainty. **Deno #36560**, opened August 12, 2026, reports 2.9.5 accepting deferred imports in `deno run` and producing an executable with plain compilation, while bundled compilation rejects the syntax; its downloaded esbuild was 0.25.5. This is community evidence, not verification of our executable. Its suggested upgrade is insufficient evidence: **esbuild 0.25.7 added syntax support only**, requiring deferred imports to remain external with ESM output. Later bundling semantics and the exact local 2.9.6 pipeline remain unverified. Native deferral is therefore a serious candidate, not an established solution. ([Deno report](https://github.com/denoland/deno/issues/36560), [esbuild changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG-2025.md#0257))

Packaging also has a pnpm-specific caveat. Deno's June 2026 pruning PR says **BYONM keeps whole-tree behavior**; tagged 2.9.6 code corroborates the fallback when npm embedding is required. Managed-npm pruning claims cannot simply transfer to this pnpm workspace, although a pure-ESM bundle avoiding that fallback differs. The open pnpm symlink report concerns **2.4.3 in August 2025** and establishes a compatibility question, not a guaranteed current failure. ([Maintainer PR #34532](https://github.com/denoland/deno/pull/34532), [2.9.6 package collection](https://raw.githubusercontent.com/denoland/deno/v2.9.6/cli/standalone/native_addons.rs), [historical #30509](https://github.com/denoland/deno/issues/30509))

## Existing probes establish retention, not performance gains

**Local, limited observations:** Deno **2.9.6** bundles retained an unused function in both nested default objects and nested ESM namespaces, including minified output; a flat namespace removed it. Rollup **4.64.0**, operating directly on the synthetic sources, removed the nested-ESM unused function but retained the object case. The two-schema fixtures using actual protocol schemas retained unused initialization in Deno output. These observations concern emitted code; they establish neither a universally optimal bundler nor measured executable evaluation behavior. Rollup is a comparison, not an adopted dependency. The session-local probe artifacts were created in `/tmp/opencode/namespace-probe`; their observed outcomes are recorded here.

**No compiled-application startup or memory comparison exists.** Embedded bytes, evaluated initializers, allocated schema objects, V8 heap/external memory and process RSS are distinct quantities. Uninitialized modules can avoid allocation without disappearing from the executable; exact page residency and parser retention remain unknown. Successful ESM imports are cached with no ordinary unload API, so first-use savings need not reduce eventual retained memory; temporary objects can still be garbage-collected. Memoized getters can delay construction only when construction occurs inside them; returning an already-created static import does not help. ([Deno memory metrics](https://docs.deno.com/api/deno/~/Deno.memoryUsage), [module caching](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import#module_namespace_object), [lazy getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#smart_self-overwriting_lazy_getters))

For pruning, `sideEffects: false` permits dropping otherwise-unused modules; pure annotations permit dropping particular unused calls, preserving effectful arguments. Neither removes live object references or creates laziness. Declarations must be narrowly truthful: Zod registration and metadata operations have observable effects. Blanket purity settings are not justified. ([esbuild annotations](https://esbuild.github.io/api/#ignore-annotations), [pure calls](https://esbuild.github.io/api/#pure), [Zod registries](https://zod.dev/metadata#registries))

## Proposed validation should settle semantics before architecture

| Candidate to investigate | Readability and intended benefit | Decisive uncertainty |
| --- | --- | --- |
| Plain compile + native deferred namespaces | Exact dotted syntax; module evaluation on access | 2.9.6 executable semantics, facade boundaries, tsgo/lint support |
| Literal dynamic feature imports | Existing shape after async activation; delayed evaluation | Acceptable first-use latency and activation contract |
| Memoized schema getters | Exact property syntax; delayed construction | Identity, cycles, retained caches; imports remain eager |
| Nested ESM + comparative bundler | Exact dotted syntax; stronger export pruning | Real-schema effects, execution order, packaging compatibility |
| Binding-aware source transform | Exact authored syntax; emitted leaf imports | Supported expressions, fallback semantics, maintenance burden |

**Phase 1 — establish the contract and baseline.** Preserve the requested dotted spelling. Ask the owner about synchronous first access, namespace reflection/escape, singleton identity and acceptable first-use delay. Audit the recorded `host-tui → run → serve → engine/telemetry` eager path, providers and schema dependencies. Record production flags, actual Deno/esbuild versions, pnpm layout and target platforms; baseline the unchanged compiled application.

**Phase 2 — validate native semantics first, after authorization.** Compare plain compilation, bundled compilation and minified bundled compilation on representative boundaries. Test deferred namespace capture versus export access, unused siblings, alternate eager imports, cycles, top-level await and initialization failures. Include literal dynamic activation as the async comparator. Execute compiled artifacts, including relocated/offline runs and relevant npm/native dependencies. Use the workspace Deno with `--no-check`; **tsgo remains the sole typechecker**, with no `deno check`, `install` or `add`.

**Phase 3 — measure and return the decision.** Record process-to-ready and first-request-dispatch latency, first optional use, cold/warm code-cache conditions, artifact/payload size, initialization counts, RSS and heap/external memory before use, after use and after resource disposal. Compare against owner-set budgets. If native boundaries meet them, further build complexity needs justification; if pruning remains material, investigate direct-source Rollup and narrowly scoped transforms as controls. Present compatibility, semantic costs and measured gains before the owner chooses implementation.

## Recommendation for the current application

This is an agent recommendation for the owner to assess, not an adopted implementation.

### What the available measurements prioritize

The repository's [[roadmap/research/startup-and-compile|September 23 Apple Silicon measurements]]
used Deno 2.9.6 and separate fresh processes for package imports:

| Measurement | Recorded median |
| --- | --- |
| Protocol import | 33 ms |
| Engine, including SDK/providers | 107 ms |
| Telemetry import | 170 ms |
| Combined host import graph | 222 ms |
| Compiled help, bundled and minified | 89.7 ms |
| Compiled hello-world process floor | 14.4 ms |

The import medians overlap through shared dependencies and cannot be added into a savings
estimate. They are historical Mac results, not new measurements of the present Linux machine.
There is no before/after application RAM measurement. The current source still reaches engine
and telemetry through the entry's static `run` import, imports all provider factories together,
and loads telemetry dependencies before checking whether telemetry is enabled.

### Recommended sequence

1. **Keep the dotted API as the constraint and begin with coarse loading boundaries.** Compare
   literal dynamic imports at command, selected-provider and optional-telemetry boundaries.
   Preserve synchronous namespace use after a subsystem is activated. This targets the large
   measured dependency graphs without requiring a global module-style change. The exact
   compiled artifact still needs evaluation and dependency-inclusion checks.
2. **Investigate native `import defer` for synchronous on-access namespaces.** It is the most
   directly aligned Deno-native candidate for that specific requirement, but test ordinary
   compilation and bundled compilation separately. If the bundle path rejects it, ordinary
   compilation remains a candidate only after pnpm packaging, executable size, initialization
   and memory have been measured. Do not assume a newer esbuild parser implements bundling
   semantics.
3. **Use replacement to reduce costs that remain after activation.** When telemetry is enabled
   and the engine/provider is used, deferral alone postpones their work and retained state.
   The accepted telemetry-SDK replacement can remove that dependency graph once its own
   observability contract is agreed. Model-adapter replacement remains a separate owner choice.
4. **Only pursue deeper schema/member pruning if its measured contribution warrants it.**
   Native deferral, schema factories/getters, nested ESM plus a comparative bundler, and a custom
   binding-aware transform solve different problems. A global namespace refactor or custom
   compiler pass is not justified by the synthetic probes alone.

For memory, the installed Zod version checked on 2026-10-06 is **4.6.5**. The community's
[Zod 4.5 lazy-allocation benchmark](https://zod.dev/blog/reducing-memory-footprint) illustrates a
mechanism, but upgrading from a pre-4.5 version is not an available gain for this checkout.
Neither the reported retained heap per schema nor a smaller bundle is a forecast of this
application's RSS.

The proposed first experiment is therefore **Deno-native coarse dynamic boundaries versus
native deferred namespaces in a compiled executable**, with the current graph as the baseline.
That comparison should precede selection of a new export representation or bundler.

## Conclusion

The useful architectural freedom is to keep source readability while independently choosing evaluation boundaries and packaging. The next decision should follow evidence about **which unused work actually costs startup time or retained memory**, rather than assuming namespace depth, smaller bundles or an extra bundler settles that question.

### Research record

[[features/engine-foundation/research/deno-namespace-bundling/namespace-tree-shaking|Namespace semantics and maintainer discussions]] · [[features/engine-foundation/research/deno-namespace-bundling/deno-runtime|Deno packaging and memory]] · [[features/engine-foundation/research/deno-namespace-bundling/community-patterns|Community patterns and alternatives]] · [[features/engine-foundation/research/deno-namespace-bundling/retrieval|Retrieval notes]].

Raw Firecrawl responses live under `deno-namespace-bundling/sources/`. Captured Markdown pages use `.txt` so external page content is not interpreted as journal entries. Source bytes are preserved; command records retain their original invocation paths.
