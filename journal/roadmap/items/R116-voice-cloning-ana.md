---
id: R116
title: Voice cloning for Ana's persona
state: idea
horizon: maybe
domains: [product]
depends-on: ["[[roadmap/items/R106-ana-application]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/ana/decisions#Open Questions]]"]
touched: 2026-09-22
---

# R116 — Voice cloning for Ana's persona

## Idea

Give Ana a familiar, consistent voice by cloning one via `mimo-v2.5-tts-voiceclone` (clone from
a short audio sample) or designing one with `mimo-v2.5-tts-voicedesign` (from a text
description). Model variants: [[roadmap/research/voice-io-landscape#MiMo TTS (chosen primary)]].

## Why

A recognisable persona voice makes the assistant feel like a single continuous presence.

## Open questions

- Clone the user's own voice, design a distinct one, or offer a choice.
- Keeping the cloned MiMo voice consistent with the Kokoro fallback voice.

## Constraints already decided

- Spoken replies go through MiMo TTS: [[domains/product/decisions#^D010]].

## History

- 2026-09-22 migrated from the archive
