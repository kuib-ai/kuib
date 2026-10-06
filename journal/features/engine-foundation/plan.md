---
owner: roysupriyo10
lifecycle: draft
summary: Shape the reusable engine for Kuib and Ana, preserving namespace APIs and establishing fast, low-overhead deployment as one Deno executable.
topics: [engine, applications, context, providers, telemetry, mesh, bundling, startup]
supersedes: []
superseded-by: []
roadmap: R019
context:
  - "[[domains/core/current#^package-barrels]]"
  - "[[domains/core/current#^agent-turn]]"
  - "[[domains/core/current#^message-replay]]"
  - "[[domains/core/current#^provider-factories]]"
  - "[[domains/core/current#^agent-tools]]"
  - "[[domains/core/current#^mid-run-submits]]"
  - "[[domains/core/decisions#^D014]]"
  - "[[domains/core/decisions#^D015]]"
  - "[[domains/core/decisions#^D016]]"
  - "[[domains/core/decisions#^D020]]"
  - "[[domains/host/current#^host-layout]]"
  - "[[domains/host/current#^serve-startup]]"
  - "[[domains/host/current#^serve-wiring]]"
  - "[[domains/infra/current#^start-telemetry]]"
  - "[[domains/infra/current#^house-structure-rules]]"
checkpoint:
  summary: "Graduated the October 4–6 engine/mesh discussion into a draft feature. Firecrawl community research and limited namespace bundle probes are complete; compiled startup, memory and import-defer behavior remain unmeasured. No implementation choice has been approved."
  next: ["P01-I02", "P01-I03"]
  blockers: ["Owner review of the API/loading contract and evaluation plan precedes further experiments or implementation."]
  note: "Read research/deno-namespace-bundling/review.md before P01-I02: native import defer is blocked today (plain compile fails on the pnpm layout, bundled compile and tsgo NodeNext reject the syntax); G002's 'pnpm inclusion unverified' is stale. Owner, 2026-10-06: \"let us first focus on getting the shape of the llm abstraction right\"; \"we also need to think about OTEL from the getgo\"; \"i want proper spans\"; on cache placement \"i think it's better if we manage our own right?\"; \"new agents that can be based on an already cached context window can always start off with work\" (workers forking from a shared cached base; touches R007: R207, R208, R307); on language and size \"best to not care about this too much\", \"not worrying about all of this any further\" (engine stays TypeScript; measurements in the review note); on the protocol \"for the iteration phase; we shall keep to zod; but i am planning to replace everything with protobuf before i release so as to practice realtime migration and backward compat in production from that point onwards\". The model-boundary and protocol-change discussion (P01-I03, G003, G004) is in progress in conversation; no shape is agreed yet. Constraint found 2026-10-06: on current Claude models a thinking block's signature binds it to the system prompt, tools and every earlier message, so editing or excluding earlier turns invalidates later thinking blocks (400 on accounts created from 2026-08-31, or dropped with prefix_mismatch_behavior); context control must strip or drop them after an edit point. G004 fact: Phoenix POST /v1/traces accepts only application/x-protobuf (gzip or deflate allowed)."
---

# Plan — engine-foundation

## Objective

Make the engine reusable by Kuib, Ana and subsequent applications through explicit model, tool,
context and session-state boundaries, with a coherent path from one device to a mesh. Preserve
the owner's `Protocol.Message.…` mental model while establishing snappy startup and bounded
overhead for an application distributed as one Deno executable.

The immediate deliverable is a reviewed architecture and evidence-backed first implementation
slice. This draft captures accepted constraints and proposed mechanisms without treating the
earlier brainstorm as an approved design.

## Non-goals

- Self-contained process bootstrap and single-instance entry wiring in this first slice;
  [[roadmap/items/R221-self-contained-engine]] covers that subsequent work.
- Shipping the native terminal UI, an embedded libghostty terminal, Ana's complete application,
  or a hosted storage service as part of the initial engine reshaping.
- Replacing workspace dependency management or tsgo: pnpm resolves dependencies; Deno runs;
  tsgo is the typechecker.

## Principles

- Simple source APIs and user mental models can justify substantial implementation complexity.
- Keep application-specific meaning outside reusable engine mechanisms.
- Treat runtime-independent core interfaces and Deno-first application deployment as compatible
  requirements at different boundaries.
- Measure startup, first use, retained heap, RSS and executable size separately.
- Discuss assumptions in prose. The owner chooses architecture and implementation direction.
- Evidence and proposed behavior stay in this feature until built and verified.

## Verified starting point

The following repository facts were checked against the linked code and existing domain claims
on 2026-10-06. The relevant `pnpm journal claims` entries are fresh; this graduation changes no
implementation claim.

- `runAgent` accepts SDK model types and a concrete daemon client, constructs the two read tools,
  invokes a fixed `buildMessages`, and delegates multi-step streaming/tool execution to SDK
  machinery while translating its stream into durable protocol events.
- `buildMessages` replays the log twice and returns SDK `ModelMessage[]`.
- The host entry imports `run`, which imports `serve`; `serve` eagerly imports the engine and
  telemetry. The provider factory imports Anthropic, Groq and OpenAI-compatible implementations.
- Telemetry's SDK imports occur before its disabled-endpoint check. Enabled telemetry registers
  the OTEL provider and AI SDK integration globally.
- Protocol and other package barrels are nested default-exported objects. House lint requires
  default root namespaces and prohibits reexports; changing representation would require a
  deliberate policy change, not scattered lint suppressions.
- The workspace pins Deno 2.9.6; the installed protocol Zod is 4.6.5. The community's reported
  Zod 4.5 allocation improvement is not an additional upgrade gain established for this checkout.

### Evidence already available

- [[features/engine-foundation/research/deno-namespace-bundling]] — Firecrawl search/scrape
  synthesis, detailed notes, source captures, alternatives and compatibility gaps.
- [[features/engine-foundation/research/deno-namespace-bundling/review]] — second-session review:
  citation audit, repository-fact check and Deno 2.9.6 spot probes. Plain compile fails at start
  on this pnpm layout, bundled compile rejects `import defer`, and tsgo rejects it under
  `NodeNext`; literal dynamic imports stay lazy under bundled compile.
- [[roadmap/research/startup-and-compile]] — September 23 Apple Silicon measurements:
  protocol import 33 ms, engine/providers 107 ms, telemetry 170 ms, combined host imports 222 ms;
  compiled help 89.7 ms with bundling/minification versus a 14.4 ms compiled hello-world floor.
  Import figures are separate, overlapping graphs, not additive savings or new Linux results.
- Limited Deno 2.9.6 bundle probes retained unused members of both default objects and nested ESM
  namespaces; a flat namespace eliminated the unused function. Direct-source Rollup 4.64.0
  eliminated the nested-ESM member but retained the ordinary-object case. These are output-code
  observations, not compiled-application performance measurements.

## P01 — Review the shape and available evidence

### P01-I01 — Community namespace and Deno packaging research

- Acceptance: Sources distinguish static initialization, tree-shaking, deferred evaluation,
  native compilation versus bundling, and RAM versus artifact size; uncertainties and local
  probe limits are explicit.
- State: verified
- Decisions: D001, D002, D003
- Refs:
  - `journal/features/engine-foundation/research/deno-namespace-bundling.md` — synthesis
  - `journal/features/engine-foundation/research/deno-namespace-bundling/` — notes and sources

### P01-I02 — Review the namespace/loading contract and recommended first comparison

- Acceptance: The owner reviews the options and their failure conditions; synchronous first
  access, schema identity, namespace reflection and tolerable first-use latency are recorded.
  The next experiments and their acceptance measurements are chosen in prose.
- State: planned
- Decisions: D001, D002, D003, D010
- Addresses: G001, G002

### P01-I03 — Agree the first reusable-engine slice

- Acceptance: Define which model, tool, context and application-state responsibilities belong
  to each layer, and agree the sequence of loading changes, telemetry replacement and provider
  work. Consumer requirements include both Kuib and Ana.
- State: planned
- Decisions: D004, D006, D007, D010
- Addresses: G003, G004

## P02 — Establish compiled startup and memory evidence

### P02-I01 — Measure the existing compiled application

- Acceptance: Record exact runtime/build versions, platform, role and flags; compare ordinary,
  bundled and minified compilation where compatible. Capture launch-to-ready, first dispatch,
  cold/warm code-cache behavior, payload/binary sizes, RSS and heap/external allocations.
  Verify pnpm dependency inclusion and relocated execution; document failed variants.
- State: planned
- Decisions: D001, D003
- Addresses: G002
- Refs:
  - `apps/host-tui/src/index.ts` — current entry
  - `apps/host-tui/src/run/serve/index.ts` — current engine wiring
  - `journal/roadmap/research/startup-and-compile.md` — historical comparison

### P02-I02 — Verify deferred boundaries inside one executable

- Acceptance: Within the owner-reviewed matrix, establish which modules initialize before and
  after access for literal dynamic imports and native `import defer`. Exercise namespace/default
  access, alternate eager paths, cycles, top-level await, initialization failure and first-use
  latency. Test tsgo/lint compatibility and actual compiled artifacts rather than source syntax
  alone. Report behavior of plain, bundled and minified compilation separately.
- State: planned
- Decisions: D001, D002, D010
- Addresses: G001, G002

### P02-I03 — Select the loading/bundling design from measured trade-offs

- Acceptance: Present preserved API semantics, initialization/memory gains and build-policy
  costs. The owner selects a design and performance budgets before production changes.
- State: planned
- Decisions: D002, D003, D010
- Addresses: G001, G002

## P03 — Implement the reviewed engine boundaries

### P03-I01 — Decouple model invocation, tools and context policy

- Acceptance: After P01-I03, implement the chosen contracts so applications provide tools and
  context policy and SDK-specific types stay inside an adapter. Preserve the existing observable
  turn behavior, cancellation and mid-run steering, documenting any approved semantic change.
  Establish where durable tool-request recording precedes execution; do not hide autonomous
  tool dispatch behind a nominal model interface.
- State: planned
- Decisions: D004, D007
- Addresses: G003
- Refs:
  - `packages/engine/src/orchestrator/index.ts` — agent loop
  - `packages/engine/src/build.messages/index.ts` — existing context replay
  - `packages/engine/src/provider/build.tools/index.ts` — existing tool bridge
  - `packages/engine/src/orchestrator/index.test.ts` — existing behavioral coverage

### P03-I02 — Replace telemetry SDK dependencies while retaining OTEL output

- Acceptance: Implement the reviewed event/span contract and exporter; retain required model,
  tool, error and timing information with stable relationships. Verify collector encoding,
  bounded buffering, batch delivery, failed export handling and shutdown flushing. Remove SDK
  packages only when the agreed telemetry contract is verified and startup/memory effects are
  recorded.
- State: planned
- Decisions: D006
- Addresses: G004
- Refs:
  - `packages/telemetry/src/start.telemetry/index.ts` — current exporter and SDK registration
  - `packages/telemetry/package.json` — current dependency graph

### P03-I03 — Evaluate and, if selected, replace provider adapters

- Acceptance: Present per-wire-format behavior from source/changelogs/fixtures, including
  preparation, streaming, reasoning metadata, tool arguments, usage, failures and cancellation.
  The owner chooses retention or replacement and provider order; any selected replacement is
  verified against recorded cases before its SDK dependency is removed.
- State: planned
- Decisions: D007
- Addresses: G003
- Refs:
  - `packages/engine/src/provider/model/index.ts` — current factories
  - `packages/engine/src/provider/build.provider.options/index.ts` — SDK option coupling

## P04 — Specify the single-device and mesh contracts

### P04-I01 — Resolve authority, replication and recovery rules

- Acceptance: An owner-reviewed design specifies per-session leadership, commit boundaries,
  daemon authority, fencing persistence, in-flight tool recovery, crash/restart behavior,
  partitions, sleep, membership changes and permanent replica loss. Explicitly reconcile the
  proposed unified-election design with R105's prior coordinator-lease direction and core D014's
  daemon boundary before treating either proposal as settled.
- State: planned
- Decisions: D005, D008, D009, D010
- Addresses: G005, G006

### P04-I02 — Resolve data routing, blobs and placement

- Acceptance: Specify application-owned file targets, generic placement hints, direct/relayed
  routing, native-host data paths and single-node behavior. Define blob availability before
  commit, encrypted hosted-member keys, quota behavior and node recovery. Review laptop engine
  eligibility and placement policy without imposing the scratchpad's unconfirmed voting rules.
- State: planned
- Decisions: D004, D005, D008, D009
- Addresses: G005, G006

## Decisions

### D001 — Portable core interfaces with Deno-first single-executable deployment

- Status: accepted
- Ruling: "i want the implementation to be agnostic of boht the runtime" (owner, 2026-10-05); "i want to be deno first"; "i will have to bundle the application as deno single compiled binary" (owner, 2026-10-06).
- Context: Library portability and deployment packaging concern different boundaries.
- Decision: Keep reusable mechanisms behind runtime-independent contracts and assess the
  application against a one-executable Deno deployment. Exact bundling flags remain open.
- Consequences: An extra runtime or multi-file distribution is not the default proposal.
- Supersedes: —
- Superseded by: —

### D002 — Preserve the readable dotted API

- Status: accepted
- Ruling: "well i still want to keep the shape"; "this is what i can reason about properly"; "Protocol.Messages...." (owner, 2026-10-06).
- Context: Current default objects preserve readability but bring eager dependency graphs.
- Decision: Preserve the dotted usage model. ESM representation, deferral and transformations
  remain candidates for the owner to assess; no module-style policy change is accepted here.
- Consequences: Flat section-only imports are a comparison with a visible API compromise.
- Supersedes: —
- Superseded by: —

### D003 — Optimize the application's own startup and retained overhead

- Status: accepted
- Ruling: "i want to make the lowest overhead possible for evberything -- i do also want OTEL"; "i want snappy startups"; "i also don't want it to keep hogging ram" (owner, 2026-10-06).
- Context: The owner is asking about implementation performance.
- Decision: Assess startup, CPU/allocation work and retained memory using the actual deployment.
- Consequences: Bundle size and isolated import times inform investigation but do not stand in
  for measured executable latency or memory savings.
- Supersedes: —
- Superseded by: —

### D004 — Reuse mechanisms across applications and keep session meaning application-owned

- Status: accepted
- Ruling: "i would like to be able to reuse the context control mechanism and control it from the consumer however way i'd like to"; "so the attachment hint would then be a proeprty of the session on a per application basis (kuib/ana)"; "whatever we are building must support subsequent iterations/applications" (owner, 2026-10-06).
- Context: Ana needs device access without inheriting coding-specific folder assumptions.
- Decision: Applications define session-state meaning and context policy. The shared engine
  supplies reusable mechanisms; the concrete API and package boundaries remain to be reviewed.
- Consequences: An attached folder is not intrinsic to every engine session.
- Supersedes: —
- Superseded by: —

### D005 — Device-targeted work with one file source of truth

- Status: accepted
- Ruling: "target the device at an individual layer so that I can keep on single source of truth every single time for the files"; "make the mesh property of the application rather than relying on the file system sync" (owner, 2026-10-05).
- Context: Native hosts provide local clipboard/screen access while work may live remotely.
- Decision: Address the node holding the files. File synchronization is not the engine's
  foundation. Hosts, engine execution and device services may be placed independently.
- Consequences: Session recovery cannot manufacture files on an unavailable owning node.
- Supersedes: —
- Superseded by: —

### D006 — Replace the telemetry SDK while preserving OTEL interoperability

- Status: accepted
- Ruling: "OTEL i agree since that is the least funcitonal portion" (owner, 2026-10-06).
- Context: The current telemetry path imports SDKs and hooks into AI SDK instrumentation.
- Decision: Replace that SDK stack while retaining OTEL output. The event-consumer/exporter
  mechanism is proposed and its coverage and encoding must be reviewed.
- Consequences: Existing log append timestamps do not automatically reproduce request timing,
  retries or trace relationships; required observability needs an explicit contract.
- Supersedes: —
- Superseded by: —

### D007 — An engine-owned model boundary and incremental provider replacement

- Status: proposed
- Ruling: "i was also planning to remove the ai sdk and make my own wrappers -- what do you think about that? should i do that?"; "sdks are already there so could we not scan for edge cases on a per provider basis?" (owner, 2026-10-06).
- Context: The current loop, context builder and tools bridge depend directly on SDK types.
- Options considered: Keep the SDK behind a model contract; replace it by wire format; retain
  selected provider adapters while replacing orchestration.
- Decision: Proposal only: own one-invocation preparation/streaming types, engine-controlled
  continuation and injectable tools/context, with a temporary SDK adapter. Provider order and
  the final removal decision remain with the owner.
- Consequences: Exact payload inspection, metadata fidelity and behavioral parity are part of
  the comparison, alongside startup overhead.
- Supersedes: —
- Superseded by: —

### D008 — Unified per-session leadership and full replicas

- Status: proposed
- Ruling: "wouldn't it be better if hte third node acted as full node with everything"; "write elections and engine elections -- maybe make them same for a session" (owner, 2026-10-06).
- Context: The discussion explored witness stalls and separate log/engine leadership.
- Options considered: Coordinator leases, per-session Raft, full replicas and restricted
  storage/witness/non-voting members.
- Decision: Record the proposed single leader for log writing and engine execution, with full
  replicas preferred and an encrypted hosted storage member as an option. No consensus library,
  membership algorithm, hosted tier or replica quota has been selected.
- Consequences: This could replace R105's coordinator-lease direction; that contradiction stays
  explicit until resolved. Term fencing alone is not a complete execution-authority protocol.
- Supersedes: —
- Superseded by: —

### D009 — A simple mental model across single-device and mesh deployments

- Status: accepted
- Ruling: "and be adaptable enough that it can be run in any config -- single machine or mesh machine" (owner, 2026-10-05); "it should be simple and beautiful"; "the implementation may be complicated as hell"; "but the usage and mental model must be simple" (owner, 2026-10-06).
- Context: Placement, transport, leadership and data routing must not become a chaotic interface.
- Decision: Design for both configurations and later applications. Automatic routing/placement,
  laptop execution and direct bulk-data transfer are design goals to assess under that model.
- Consequences: Proposed session/node/blob names and policies require review; internal voting
  restrictions and routing details are not yet user-facing contracts.
- Supersedes: —
- Superseded by: —

### D010 — Plans and assumptions are discussed before implementation

- Status: accepted
- Ruling: "each assumption we make is a discussion" (owner, 2026-10-04); "please get me the plan first instead of implemetnation"; "do not take decisions for me"; "graduate this current journal as a feature" (owner, 2026-10-06).
- Context: The owner requested a tracked feature and research, while reserving design choices.
- Decision: Graduate the discussion into this draft, keep research under the feature, and
  present options in prose before experiments or production changes are selected.
- Consequences: Completing research or creating this feature does not approve a bundler,
  namespace refactor, SDK migration design or mesh implementation.
- Supersedes: —
- Superseded by: —

### D011 — Self-contained bootstrap follows the engine-shape work

- Status: accepted
- Ruling: "self-contained is a later problem" (owner, 2026-10-05).
- Context: The discussion began around R221 and then moved to reusable engine responsibilities.
- Decision: Establish the engine shape and first reviewed slice before taking up self-contained
  process wiring. R221 remains its own roadmap item.
- Consequences: This feature's scope is not silently substituted for R221's startup entry work.
- Supersedes: —
- Superseded by: —

## Gaps

### G001 — Exact namespace and first-access contract

- Status: open
- Recommendation: Review synchronous first access, schema singleton identity, namespace escape, reflection and startup/first-use trade-offs before selecting an export representation.
- Context: Dotted spelling is settled; current objects, deferred namespaces and transforms have
  different semantics. Existing lint constrains the allowed implementation forms.

### G002 — Compiled Deno behavior and memory evidence

- Status: open
- Recommendation: Approve P02's comparison before treating `import defer`, bundling flags or dynamic boundaries as the production solution; set performance budgets from measured results.
- Context: The Deno 2.9.5 community report accepts plain deferred compilation and rejects bundled
  compilation. Exact local 2.9.6 behavior, pnpm inclusion, startup and memory remain unverified.

### G003 — Model, tool, context and application-state contracts

- Status: open
- Recommendation: Review a concrete contract for one model invocation, payload inspection, tool dispatch, consumer-defined context and application state; decide SDK retention/removal and provider order after comparing fidelity and maintenance cost.
- Context: The four-piece engine/mesh/tool-set/application shape was proposed. Application-owned
  state and consumer control are accepted; package layout and concrete APIs are not selected.

### G004 — Telemetry coverage and collector compatibility

- Status: open
- Recommendation: Specify required spans, timing, correlation, retries and buffering behavior, then verify Phoenix's accepted OTLP encoding before implementing the replacement.
- Context: Replacement intent is accepted; the claim that existing log events already contain
  everything needed for SDK-equivalent spans has not been established.

### G005 — Consensus and recovery contract

- Status: open
- Recommendation: Review per-session leadership, durable commit boundaries, membership, sleep, fencing and unknown tool outcomes, explicitly comparing the proposal with R105's earlier coordinator-lease direction. Select a substrate only after these rules are clear.
- Context: Per-session Raft, full replicas, a hosted encrypted member, blob quorum and engine/log
  co-leadership remain proposed. The earlier "at most one sleeping voter" policy is unconfirmed.

### G006 — Device authority, routing, blobs and placement

- Status: open
- Recommendation: Define the engine/mesh/device-tool boundary and authority for both agent and direct owner actions. Review data paths, placement hints, laptop behavior, storage keys/quotas and handover rules before accepting the scratchpad's interface proposal.
- Context: The candidate direct host-to-daemon path revisits core D014's "only the engine calls
  the daemon" consequence. Native hosts, libghostty terminal integration, Headscale discovery,
  content-addressed blobs and hosted storage are related design context, not built claims.
