---
title: "Ana — Personal AI Assistant"
type: implementation
status: open
layer: product
created: 2026-09-16
tags: [ana, assistant, voice, stt, tts, mimo, mesh, proactive, context]
depends-on:
  [
    "[[vision]]",
    "[[provider-architecture]]",
    "[[multi-device-ux]]",
    "[[tool-system]]",
    "[[context-engine]]",
    "[[infrastructure-strategy]]",
    "[[distributed-mesh-state]]",
  ]
informs: ["[[provider-architecture]]"]
---

# Ana — Personal AI Assistant

Ana is a voice-driven personal AI assistant. It is the first application built on the Kuib engine, living at `apps/ana` in the monorepo. Building Ana forces the engine, provider, and mesh packages to mature — enabling the subsequent coding agent build.

## Current Decisions

### Placement & Relationship to Kuib

Ana is an **application**, not a package. It consumes Kuib's shared infrastructure:

- `@kuib-ai/engine` — agent loop, orchestrator, provider
- `@kuib-ai/protocol` — event schemas, Zod types
- `@kuib-ai/tools` — tool definitions, device-composable via `withDevice()` (see [[tool-system]])
- `@kuib-ai/event-log-sqlite` — persistence
- `@kuib-ai/telemetry` — observability
- `@kuib-ai/mesh` — WireGuard/Tailscale device routing (see [[distributed-mesh-state]])

Anything Ana-specific (voice I/O, wake word, proactive monitoring) stays in `apps/ana`. Anything reusable (provider improvements, context management, tool system) goes into packages.

### Core Capabilities

1. **Voice-driven agent** — always-on voice interface that replaces dictation-into-terminal. Can run commands, check git, commit/push, open CDP, test things.
2. **Proactive notifications** — monitors infrastructure (Tailscale nodes going down), communications (important WhatsApp messages), events (new AI model releases), reminds about pending tasks.
3. **Device-composable execution** — from one conversation, Ana executes on any device in the mesh (minerva, thalia, athena, etc.) via [[multi-device-ux]] and [[tool-system]]'s `withDevice()` wrapper.

### Voice I/O Architecture

**STT (Speech-to-Text): Parakeet TDT v3, local-first**

- Runs via Hex's embedded service mode (`hex service --embedded`) on Apple Silicon (CoreML via FluidAudio)
- Hex exposes a TypeScript SDK (`@kitlangton/hex`) — send WAV bytes, get transcript back
- Primary inference node: **minerva** (M4 Mac Mini, always on)
- Thalia (M3 Pro) runs Parakeet locally when at desk — zero network latency
- Phone/other devices stream audio to minerva over LAN (2-5ms RTT, negligible)
- Current mode is **batch** (full utterance → transcript). Streaming (transcribe as chunks arrive) is the ideal — Parakeet TDT's transducer architecture supports it, but Hex SDK currently exposes batch only
- MiMo ASR (`mimo-v2.5-asr`) available as API fallback but adds ~80-150ms RTT to Singapore

**TTS (Text-to-Speech): MiMo API primary, Kokoro local fallback**

- MiMo TTS (`mimo-v2.5-tts`) is primary — high quality, rich prosody control, already in token plan
- **No SSML**. Control via two mechanisms:
  1. Natural language instructions in the `user` message (e.g. "Speak slowly, warmly, with a slight whisper")
  2. Inline tags in the text itself (e.g. `[pause]`, `[sternly]`, `[commanding]`, `[trembling]`)
- Pronunciation: no IPA/phoneme override; use phonetic spelling or NL instruction ("pronounce 'kuib' as 'kweeb'")
- Three model variants: `mimo-v2.5-tts` (stock voices), `mimo-v2.5-tts-voicedesign` (create voice from text description), `mimo-v2.5-tts-voiceclone` (clone from audio sample)
- API format: chat completions, text in `assistant` role message, returns base64 WAV (24kHz mono) in `choices[0].message.audio.data`
- **Kokoro** (82M, Apache-2.0) as local fallback on minerva — ~50ms on CPU, no prosody control but instant for quick acknowledgments
- Tradeoff: MiMo gives tone/emotion control but adds network latency; Kokoro gives instant but flat delivery

**Latency hierarchy (STT):**

| Path | Network | Total |
|---|---|---|
| Local on thalia (M3 Pro) | 0ms | ~100-200ms |
| Phone → minerva (same WiFi) | ~2-5ms | ~105-205ms |
| Phone → minerva (Tailscale, different net) | 20-80ms | ~120-280ms |
| MiMo ASR API (Singapore) | 80-150ms | ~250-400ms+ |

### Context Management

- **Single persistent conversation channel** — not session-based. Ana is always the same conversation.
- **Structured extraction** (decided over rolling summarization) — extract facts, tasks, commitments into an indexed store; rebuild context each turn from system prompt + extracted facts + recent turns
- Lowest latency is the priority
- Leverages [[context-engine]] for exclusion/branching mechanics, but the persistent-channel and extraction layer are Ana-specific

### Hardware Topology

See [[ana/research/hardware-topology]] for full device inventory.

Key roles:
- **Minerva** (M4 Mac Mini, Bengaluru) — dedicated inference node, always on. Runs Parakeet STT, Kokoro TTS, Ana's brain.
- **Thalia** (M3 Pro MacBook, desk) — primary interaction device. Can run Parakeet locally for zero-latency STT.
- **Phone** — thin voice client. Streams audio to minerva for STT. Needs a lightweight app.
- **Athena** (12GB Oracle VM) — cloud compute, potential relay/always-on services.
- **Cornelius** (Kolkata node) — remote presence.

### Network

- Tailscale mesh connects all devices. Direct paths need NAT hole-punching (2-3 DERP packets to establish).
- **Keepalive** for low-latency voice paths is a **network-layer concern, NOT coupled to Ana**. A standalone systemd service on minerva pings key peers every 20s to keep NAT mappings alive.
- Measure NAT timeout first to pick the right keepalive interval.

### Provider

- **MiMo** (`mimo-v2.5-pro`) via Xiaomi token plan for LLM inference
- OpenAI-compatible endpoint: `https://token-plan-sgp.xiaomimimo.com/v1`
- Anthropic-compatible endpoint: `https://token-plan-sgp.xiaomimimo.com/anthropic`
- API key stored as `XIAOMI_API_KEY`
- Full model catalog: `mimo-v2.5-pro` (LLM), `mimo-v2.5-asr` (STT), `mimo-v2.5-tts` (TTS), `mimo-v2.5-tts-voiceclone`, `mimo-v2.5-tts-voicedesign`

### Phone Dictation App

- Current phone STT runs locally and is slow
- Goal: thin app that captures audio, streams to minerva over Tailscale, gets back near-instant transcription
- Minerva runs Hex embedded service with Parakeet TDT v3
- Same WiFi: ~105-205ms total. Over Tailscale: ~120-280ms. Both far faster than local phone inference.

### Echo Dot C78MP8 (parked)

- 3rd gen Echo Dot, MediaTek MT8516 SoC with patched BootROM
- Kamakiri exploit doesn't work. Potential paths: mtkclient, UART recon, voltage glitching
- Has hidden USB test pads (TP/TM markings near ports)
- **Blocked**: needs CP2102 USB-UART adapter (~200-300 INR, SP Road, Bengaluru)
- If jailbroken: repurpose as far-field mic array + speaker node in Ana's mesh

## Open Questions

- Streaming STT: can Hex/FluidAudio expose streaming Parakeet inference, or do we need to go direct NeMo?
- Wake word detection: local keyword spotting before activating full STT pipeline
- Phone app platform: iOS vs Android, and depth of system integration (keyboard replacement, share sheet, accessibility service)
- Proactive monitoring architecture: polling vs event-driven, which services to watch, notification routing
- Voice cloning: clone user's voice via `mimo-v2.5-tts-voiceclone` for Ana to sound familiar?
- Content creation mic: MacBook Pro M3 studio array sufficient for animated voiceover in quiet room (decided). Lavalier mic (~500-800 INR) as upgrade path.
