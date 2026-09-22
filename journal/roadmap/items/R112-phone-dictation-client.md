---
id: R112
title: Phone dictation client streaming to minerva
state: idea
horizon: later
domains: [product]
depends-on: ["[[roadmap/items/R003-stt-engine]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/ana/decisions#Phone Dictation App]]", "[[_archive/ana/decisions#Open Questions]]"]
touched: 2026-09-22
---

# R112 — Phone dictation client streaming to minerva

## Idea

A thin phone app captures audio and streams it to minerva's STT server over Tailscale, getting
back near-instant transcription instead of slow local phone inference. Same WiFi ~105–205 ms
total; over Tailscale ~120–280 ms — both far faster than on-device. The servers already accept
remote TCP clients on minerva's tailnet address ([[domains/product/current#^C006]]).

## Why

Current phone STT runs locally and is slow; a keepalive-warmed path to minerva is much faster.

## Open questions

- Platform (iOS vs Android) and depth of system integration (keyboard replacement, share
  sheet, accessibility service).

## Constraints already decided

- STT servers listen on minerva's tailnet TCP address in addition to the local socket: [[domains/product/decisions#^D009]], [[domains/product/current#^C006]].
- Wire protocol is length-prefixed JSON, same for TCP and socket: [[domains/product/current#^C003]].

## History

- 2026-09-22 migrated from the archive
