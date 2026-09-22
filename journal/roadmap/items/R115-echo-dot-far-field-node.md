---
id: R115
title: Echo Dot jailbreak into a far-field mic and speaker node (parked)
state: idea
horizon: maybe
domains: [product]
depends-on: []
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/ana/decisions#Echo Dot C78MP8 (parked)]]", "[[roadmap/research/echo-dot-hack-checklist]]"]
touched: 2026-09-22
---

# R115 — Echo Dot jailbreak into a far-field mic and speaker node (parked)

## Idea

Repurpose a 3rd-gen Echo Dot (C78MP8 "crumpet", MediaTek MT8516) as a far-field 4-mic array +
speaker node in Ana's mesh for the desk/room area. Parked: the Kamakiri exploit does not work;
candidate paths are mtkclient, UART recon and voltage glitching. Blocked on a CP2102 1.8 V
USB-UART adapter. Full hardware-hacking procedure, shopping list and references:
[[roadmap/research/echo-dot-hack-checklist]].

## Why

The Echo Dot's 4 far-field mics + speaker are the best ambient voice combo for the desk area
if it can be jailbroken.

## Open questions

- Whether any of mtkclient / UART / glitching actually opens crumpet (donut-only so far).

## Constraints already decided

- Parked behind hardware acquisition; not on the critical path for Ana.

## History

- 2026-09-22 migrated from the archive
