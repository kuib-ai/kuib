---
id: R109
title: Kokoro local TTS for instant acknowledgments
state: shaped
horizon: later
domains: [product]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/ana/decisions#Voice I/O Architecture]]"]
touched: 2026-09-22
---

# R109 — Kokoro local TTS for instant acknowledgments

## Idea

Kokoro (82M, Apache-2.0) runs on minerva as a local TTS fallback: ~50 ms on CPU, good quality
but no prosody/emotion control; `kokoro-fastapi` wraps it as an HTTP API. Split of roles:
MiMo TTS for anything expressive (responses, notifications, reading content); Kokoro for
instant low-latency acknowledgments ("got it", "done", "working on it") and when MiMo is
unreachable. Alternatives evaluated (Chatterbox, Qwen3-TTS, Fish Speech, CosyVoice, Piper):
[[roadmap/research/voice-io-landscape#Other Models Evaluated]].

## Why

Every MiMo reply pays a round trip to Singapore; short acknowledgments should feel instant.

## Open questions

- Who picks the voice per utterance (rule on length/kind vs the LLM tagging it).
- Keeping the two voices recognisably the same persona.

## Constraints already decided

- MiMo TTS is primary for spoken replies: [[domains/product/decisions#^D010]].
- minerva is the inference hub: [[domains/product/decisions#^D009]].

## History

- 2026-09-22 migrated from the archive
