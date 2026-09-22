---
id: R113
title: Ana proactive monitoring and notifications
state: idea
horizon: later
domains: [product]
depends-on: ["[[roadmap/items/R106-ana-application]]"]
converges-with: []
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/ana/decisions#Core Capabilities]]", "[[_archive/ana/decisions#Open Questions]]"]
touched: 2026-09-22
---

# R113 — Ana proactive monitoring and notifications

## Idea

Ana proactively monitors and notifies: infrastructure (Tailscale nodes going down),
communications (important WhatsApp messages), events (new AI model releases) and pending-task
reminders. Needs a monitoring architecture — polling vs event-driven, which services to watch,
and notification routing to whichever device the user is at.

## Why

Proactive notifications are one of Ana's three core capabilities and set it apart from a
request/response assistant.

## Open questions

- Polling vs event-driven; which services to watch first.
- Notification routing across devices (tie-in with device-composable execution).

## Constraints already decided

- Ana runs on the kuib engine and mesh: [[roadmap/items/R106-ana-application]].

## History

- 2026-09-22 migrated from the archive
