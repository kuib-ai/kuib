---
title: Proposed package structure and names for inference
date: 2026-10-08
origin: ["conversation 2026-10-07 to 2026-10-08"]
---

# Proposed package structure and names for inference

Shown to the owner in conversation; **proposed, not ruled**, except where a decision in
[[features/inference/plan]] is cited. The first tree was drawn before the plugin discussion;
the second reflects it.

## Structure

```
packages/protocol/src/
  step/                    new: what is asked, the deltas, the closed step
  model.port/              new: the interface a model implements
  (identity enums and the offering shape: location inside protocol not yet proposed)

packages/inference/        @kuib-ai/inference, namespace Inference
  src/
    index.ts               barrel
    registry               register and resolve providers, models, offerings, formats, blocks
    transport              send the request, split the response into frames
    path                   offering + step asked → request → frames → deltas → closed step
    anthropic.messages/    a built-in format, shaped like a plugin
      blocks               one unit per variant of each step
      fold.frames          frames → deltas, a pure state machine
    providers              built-in rows: Anthropic, Xiaomi (data, registered like a plugin's)
  fixtures/                recorded provider traffic, per offering
```

Rules proposed with it:

- `inference` depends on `protocol` and `std` only; no AI SDK; nothing beyond `fetch` and web
  streams.
- The core knows no provider. Built-in formats and providers register through the same path a
  plugin uses and import only what a plugin could (plan gap G003).
- A format is loaded on first use and is not in the barrel.
- The engine would depend on the port only. The slice is additive: nothing moves out of
  `packages/engine` until a later feature wires it in.

House rules that apply (from `core/package-barrels` and `infra/house-structure-rules`): one
default-exported namespace per package barrel, every unit in its own dot-case directory as
`index.ts` with a colocated `index.test.ts`, a `"./*"` subpath export, a first-line `@claim`,
no prose comments, and the package added to the core domain's `code` globs.

## Names and the sibling each mirrors

| Name | Mirrors | Note |
|---|---|---|
| `inference` (package) | `engine`, `daemon`, `transcript` | The owner's word |
| `model.port` | `event.log.port`, `file.system.port` | |
| `build.request` | `build.messages`, `build.tools` | |
| `fold.frames` | `fold.transcript` | Flag: a streaming transform, not quite a fold |
| `anthropic.messages`, `openai.chat` | none | Flag: named after the provider's HTTP schema |
| "translation" (the layer per format) | none | The owner's word: "a translation of the neutral intent path" |
| "format" (which schema an endpoint speaks) | none | The owner's word |
| "offering" (one model at one provider) | none | Flag: my word, not yet accepted |
| "block" (one variant of one step) | none | From the owner's "lego blocks" |
| "delta" (what a translation emits) | `TextDelta`, `ReasoningDelta` | "Chunk" is kept for the stream store's batch |

Asymmetries to settle (plan gaps G004 and G005): the protocol says a step is "started" and
"finished" while the design says "asked" and "answered"; today's `providerID` covers both who
serves a model and who made it.

## The picture of how behaviour is switched

Agreed by the owner (plan decision D006). Columns are code, rows are data.

```
ANTHROPIC_MESSAGES

step                   variants, each written once
─────────────────────  ─────────────────────────────────
ask for reasoning      EFFORT · BUDGET · TOGGLE · NONE
send reasoning back    SIGNED · PLAIN · NONE
place cache marks      MARKERS · IMPLICIT · NONE
place an instruction   SYSTEM_ROLE · USER_TEXT
authenticate           X_API_KEY · API_KEY · BEARER

                     reasoning  send back  cache     instruction  authenticate
Claude Sonnet 5.5    EFFORT     SIGNED     MARKERS   SYSTEM_ROLE  X_API_KEY
Claude Haiku 4.5     BUDGET     SIGNED     MARKERS   USER_TEXT    X_API_KEY
MiMo 2.6 at Xiaomi   TOGGLE     PLAIN      IMPLICIT  untested     API_KEY
```

The MiMo row is from its documentation and is untested. Decision D016 adds one more variant
to "ask for reasoning": an effort change carried inside the conversation, which keeps the
cache.
