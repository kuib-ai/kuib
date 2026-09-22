---
id: R408
title: Web host auth model for kuib web and code.kuib.ai
state: shaped
horizon: later
domains: [host, infra]
depends-on: []
converges-with: ["[[roadmap/items/R305-web-host-viewer]]"]
split-from: []
absorbed-into: ""
feature: ""
origin: ["[[_archive/security-model/decisions#Web host auth — `kuib web` + code.kuib.ai (2026-07-01)]]"]
touched: 2026-09-22
---

# R408 — Web host auth model for kuib web and code.kuib.ai

## Idea

When a web host returns (`kuib web` exposing the engine over HTTP to a local page or the hosted
frontend at `https://code.kuib.ai`), apply the auth model reasoned out in 2026-07 from an
explicit attacker enumeration. A submit runs the agent loop, so this is the highest-risk
boundary in the product.

**Core rule: CORS is not an authorization boundary** — it governs reading responses, not
whether a request is sent and processed. Auth must be positive.

**Header bearer token, not cookies.** A per-run, in-memory, high-entropy token gates every
non-static request (`Authorization: Bearer …`; SSE carries `?token=` because `EventSource`
cannot set headers). Cookies are auto-attached (the CSRF vector), and code.kuib.ai ↔ localhost
is cross-site so a cookie would need `SameSite=None`, which re-permits every attacker origin. A
custom header forces a CORS preflight that is denied for non-allowlisted origins. No localhost
TLS in v1 (`http://localhost` is a secure context; the mesh hop is WireGuard-encrypted).

**Defence in depth:**

- Bind loopback + this node's tailnet IP only, never `0.0.0.0`.
- `Host` allowlist (`localhost`, `127.0.0.1`, own tailnet IP, `*.ts.net`) against DNS rebinding.
- Origin allowlist without reflection: loopback, own tailnet identity, `https://code.kuib.ai`;
  anything else → 403.
- Private Network Access preflight (`Access-Control-Allow-Private-Network: true`).
- `Content-Type: application/json` enforced on submit (closes the `text/plain` simple-request
  bypass).
- Pairing handshake for the hosted origin: `kuib web` prints a high-entropy, single-use, 5-min,
  rate-limited (≤5 attempts) code exchanged at `/pair` for the token. The hosted site stays
  dataless. A same-origin dev token endpoint exists only under a dev flag and never answers the
  hosted origin.
- A remote-origin submit is an elevated risk tier — transport becomes an input of
  [[roadmap/items/R404-per-device-security-profiles]].

**Residual risks:** token in SSE URL (localhost-only, per-run; tighten to per-connection stream
tickets later); WebSocket, if ever added, does not enforce CORS and needs in-band token + Origin
check; same-user local processes are not a new boundary; the token lives only in memory.

The 2026-07-01 implementation verified: unauth → 401, bad Host → 421, disallowed Origin → 403,
`text/plain` submit → 415, authed submit → 202 streaming. That host was deleted in the
deno-runtime migration.

## Why

The design is the only remaining record of the web boundary's security reasoning.

## Open questions

- Transport and catch-up protocol live in [[roadmap/items/R305-web-host-viewer]]; this item is its auth half.
- Per-connection SSE stream tickets instead of the run token in the URL.

## Constraints already decided

- The engine runs in the serve process, never inside a UI host: [[domains/host/decisions#^D001]].
- `[web] port` config already exists (default 4321): [[domains/infra/current#^C016]].

## History

- 2026-09-22 migrated from the archive
