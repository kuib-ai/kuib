---
id: R106
title: Ana — voice-driven personal assistant app on the kuib engine
state: shaped
horizon: next
domains: [product, core]
depends-on: ["[[roadmap/items/R003-stt-engine]]", "[[roadmap/items/R216-provider-plugins-and-auth]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/ana/decisions#Current Decisions]]", "[[_archive/ana/decisions#Placement & Relationship to Kuib]]", "[[_archive/ana/decisions#Core Capabilities]]", "[[_archive/ana/decisions#Hardware Topology]]", "[[_archive/ana/decisions#Provider]]"]
touched: 2026-09-22
---

# R106 — Ana — voice-driven personal assistant app on the kuib engine

## Idea

Ana is the first application built on the kuib engine, at `apps/ana`. Building it forces the
engine, provider and mesh packages to mature ahead of the coding agent. Today only a Python
prototype loop exists ([[domains/product/current#^C013]]).

**Placement.** Ana is an application, not a package. It consumes `@kuib-ai/engine` (agent loop,
orchestrator, provider), `@kuib-ai/protocol`, `@kuib-ai/tools` (device-composable via
`withDevice()`), `@kuib-ai/event-log-sqlite`, `@kuib-ai/telemetry` and the mesh module. Anything
Ana-specific (voice I/O, wake word, proactive monitoring) stays in `apps/ana`; anything reusable
(provider improvements, context management, tools) goes into packages.

**Capabilities:**

1. **Voice-driven agent** — always-on voice interface replacing dictation-into-terminal: run
   commands, check git, commit/push, open CDP, test things.
2. **Proactive notifications** — see [[roadmap/items/R113-ana-proactive-notifications]].
3. **Device-composable execution** — from one conversation, execute on any mesh device
   (minerva, thalia, athena, …).

**Model.** Default LLM is MiMo `mimo-v2.5-pro` on the Xiaomi token plan (OpenAI-compatible
`https://token-plan-sgp.xiaomimimo.com/v1`, Anthropic-compatible `…/anthropic`); the same plan
carries `mimo-v2.5-asr`, `mimo-v2.5-tts`, `-voiceclone`, `-voicedesign`. The prototype still
defaults to Groq.

**Topology.** minerva (M4 Mac Mini, always on) is the inference hub and Ana's brain; thalia (M3
Pro MacBook) is the primary interaction device and can run STT locally; the phone is a thin
voice client; athena (12 GB Oracle VM) is a candidate for always-on relay/monitoring. Full
inventory: [[roadmap/research/hardware-topology]].

## Why

A daily-use assistant is the fastest way to harden the engine, provider and mesh packages.

## Open questions

- Ana's app shape: is it a kuib session driven by a voice host, or its own process embedding the engine?
- Which STT/TTS endpoints Ana addresses by node identity vs fixed addresses.

## Constraints already decided

- `mimo` provider exists in the engine: [[domains/core/current#^C029]], [[domains/core/decisions#^D021]].
- Daemons are addressed by node identity through discovery: [[domains/core/decisions#^D028]].
- minerva is the inference hub: [[domains/product/decisions#^D009]]; spoken replies via MiMo TTS: [[domains/product/decisions#^D010]].

## History

- 2026-09-22 migrated from the archive
