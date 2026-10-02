---
id: R108
title: Wake word and always-on listening for Ana
state: absorbed
horizon: later
domains: [product]
depends-on: ["[[roadmap/items/R003-stt-engine]]"]
converges-with: []
split-from: []
absorbed-into: "[[roadmap/items/R017-ana-voice]]"
feature: ""
origin: ["[[_archive/ana/decisions#Open Questions]]", "[[_archive/ana/decisions#Core Capabilities]]"]
touched: 2026-09-28
---

# R108 — Wake word and always-on listening for Ana

## Idea

Local keyword spotting gates the full STT pipeline so Ana can listen always-on without
streaming every sound to minerva. End-of-utterance VAD is already planned in the STT feature
([[features/stt-engine/plan]], P02-I02); this item is the wake-word front end and the
always-listening capture loop on the client device.

## Why

"Always-on voice interface" is Ana's first capability; today the prototype records until Ctrl+C.

## Open questions

- Which keyword spotter (on-device, per client platform) and where it runs (client vs minerva).
- False-accept tolerance vs battery on phone/laptop.

## Constraints already decided

- No server-side VAD today; streams end only on client `streamEnd`: [[domains/product/current#^coreml-stream-sessions]].

## History

- 2026-09-22 migrated from the archive
- 2026-09-28 absorbed into [[roadmap/items/R017-ana-voice]]
