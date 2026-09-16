# Hardware Topology & Device Roles

Research date: 2026-09-16

## Devices on Tailnet

| Node | Hardware | Location | Role in Ana |
|---|---|---|---|
| **minerva** | Mac Mini M4, 16GB+ | Bengaluru, desk room | Dedicated inference node. Runs Parakeet STT, Kokoro TTS, Ana engine. Always on. |
| **thalia** | MacBook Pro M3 Pro, 18GB | Bengaluru, desk | Primary interaction device. Runs Parakeet locally for zero-latency STT. 3-mic studio array. |
| **statice** | HP Pavilion 14 (Ryzen 5 5625U, 7.1GB) | Bengaluru, router room | Old laptop. Has DMIC but no PipeWire/PulseAudio installed. Low capability. Not suitable as room mic. |
| **athena** | 12GB Oracle Cloud VM | Cloud | Always-on cloud compute. Potential for relay services, monitoring. |
| **cornelius** | Unknown | Kolkata | Remote node. |
| **callux** | 0.5GB Oracle VM | Cloud | Minimal compute. |
| **pastor** | 0.5GB Oracle VM | Cloud | Minimal compute. |
| **aurora** | Laptop | Bengaluru | Girlfriend's laptop. Not part of Ana. |
| **vulcan** | EC2 | Cloud | Work machine (Figr). Not part of Ana. |

## Physical Layout (Bengaluru)

Two rooms:
- **Desk room**: thalia (MacBook), minerva (Mac Mini), PS5, Sony ULT Field 1 speaker (bass-heavy, not ideal for voice)
- **Router room**: statice (old laptop), router

User is typically at desk, on bed (adjacent to desk), or on PS5.

## Key Device Roles

### Minerva — Inference Hub
- M4 Apple Silicon, always on, no battery concern
- Runs: Hex embedded service (Parakeet STT), Kokoro TTS, Ana's core process
- Receives audio from all other devices over LAN/Tailscale
- Fits the Kuib mesh architecture: minerva is the engine/leader node

### Thalia — Primary Client
- M3 Pro, 18GB, 3-mic studio array
- Can run Parakeet locally (zero network latency) — fastest possible STT path
- Also sufficient for content creation voiceover (quiet room)
- May be closed/sleeping when user is on PS5 or in bed

### Phone — Mobile Thin Client
- Currently runs STT locally (slow)
- Target: lightweight app that streams audio to minerva, gets back transcription
- Over same WiFi: ~2-5ms network overhead (negligible)
- Over Tailscale (different network): 20-80ms

### Echo Dot C78MP8 — Parked Project
- 3rd gen Echo Dot, MediaTek MT8516 SoC
- Has 4 far-field microphones + decent speaker
- Jailbreak blocked: needs CP2102 USB-UART adapter (~200-300 INR, SP Road)
- If successful: best ambient mic + speaker combo for desk area
- Paths to try: mtkclient (software bypass), UART recon, voltage glitching

### Fitbit Versa 2 — Wearable
- Has Alexa built in (Google acquired Fitbit, Alexa still works via Google Health app)
- Mic works intermittently — sometimes picks up voice, sometimes doesn't
- Wake mechanism unreliable
- Not a primary Ana interface

## Network Considerations

- All Bengaluru devices on same WiFi → LAN latency ~2-5ms
- Tailscale for remote access (Kolkata, cloud VMs)
- Direct peer paths need NAT hole-punching (2-3 DERP relay packets)
- Keepalive service on minerva (every 20s) keeps direct paths warm — **decoupled from Ana**
- Sony ULT Field 1: good bass speaker but not suited for voice playback
