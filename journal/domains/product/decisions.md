---
domain: product
---

# Product — decisions

### D001 — CoreML/ANE for primary STT inference

- Status: accepted
- Context: minerva is a base M4 (10-core GPU, 120 GB/s) with the same 38 TOPS Neural Engine as M4 Pro/Max. MLX runs on the GPU and scales with GPU cores; CoreML targets the ANE and loses no speed on the base chip. Parakeet CoreML INT8 benchmarks at ~117× real time regardless of chip variant.
- Decision: CoreML on the ANE is the primary STT runtime; MLX is secondary, for models without a good CoreML export (Qwen3-ASR).
- Consequences: The primary server is macOS-only, acceptable because minerva is the dedicated inference node.
- Supersedes: —
- Superseded by: —
- From: [[features/stt-engine/plan]]

^D001

### D002 — Swift for the CoreML server

- Status: accepted
- Context: CoreML's API is Swift/ObjC-native; Zig, Rust or C++ would bridge through the ObjC runtime. Swift builds a standalone binary and is the natural language for Apple ML frameworks.
- Decision: The CoreML server is a Swift package built with `swift build -c release`.
- Consequences: Needs the Swift toolchain on the build machine; CoreML cannot be cross-compiled from Linux, so it is built on minerva or another Mac while the code lives in the monorepo.
- Supersedes: —
- Superseded by: —
- From: [[features/stt-engine/plan]]

^D002

### D003 — Parakeet TDT v3 as the default model

- Status: accepted
- Context: Moonshine, Parakeet, Qwen3-ASR, Whisper, Cohere Transcribe and SenseVoice were compared. On M4 CoreML/ANE, Parakeet TDT v3 INT8 reaches ~117× real time at 2.37% WER (LibriSpeech clean) in 0.9 GB RAM, with a CoreML export proven in production Mac apps via FluidAudio, and its transducer architecture supports streaming.
- Decision: Parakeet TDT v3 on CoreML is the first and default engine; Qwen3-ASR 0.6B (1.74% WER) is the higher-accuracy option.
- Consequences: Good-enough accuracy for a voice assistant at the lowest latency; sub-2% WER needs a second engine.
- Supersedes: —
- Superseded by: —
- From: [[features/stt-engine/plan]]

^D003

### D004 — Unix socket with length-prefixed JSON

- Status: accepted
- Context: The kuib engine-service already uses a unix socket with JSON messages; a unix socket is the lowest-latency local transport and trivial for clients to speak.
- Decision: The server listens on `~/.kuib/stt.sock`; every message is a 4-byte big-endian length followed by a JSON body.
- Consequences: Clients need only socket connect plus JSON parse. The same framing carries over unchanged to a TCP listener for remote clients.
- Supersedes: —
- Superseded by: —
- From: [[features/stt-engine/plan]]

^D004

### D005 — FluidAudio as a dependency, not custom CoreML inference

- Status: accepted
- Context: FluidAudio (Apache-2.0, widely used in production Mac apps) handles the four-model Parakeet pipeline, ANE-aligned memory, actor-based model ownership, compute-unit pinning and TDT decoding. Custom CoreML inference would be 1000+ lines of specialised Swift the owner cannot review.
- Decision: Depend on FluidAudio as a Swift package; our code is a thin server wrapper over its public API.
- Consequences: Tied to FluidAudio's release cadence; Apache-2.0 allows a fork if it is abandoned.
- Supersedes: —
- Superseded by: —
- From: [[features/stt-engine/plan]]

^D005

### D006 — One service, many backends behind `SttBackend`

- Status: accepted
- Context: Several models should be reachable through one service and one API without the client caring which backend answers.
- Decision: Backends implement an `SttBackend` protocol; a request's optional `engine` field selects one, defaulting to the fastest available.
- Consequences: Adding a model is implementing `transcribe`; the socket protocol does not change.
- Supersedes: —
- Superseded by: —
- From: [[features/stt-engine/plan]]

^D006

### D007 — stt-mlx speaks the stt-coreml wire protocol

- Status: accepted
- Context: Qwen3-ASR runs on MLX, not CoreML, and was brought up as a separate Python server rather than a backend inside the Swift service.
- Decision: `stt-mlx` implements the same length-prefixed JSON protocol and message types over TCP, so existing clients switch engines by changing only host and port.
- Consequences: Engine choice between Parakeet and Qwen3-ASR is currently a choice of endpoint (port 9009 vs 9010), not the `engine` field of D006.
- Supersedes: —
- Superseded by: —
- From: [[features/stt-engine/plan]]

^D007

### D008 — Streaming STT, not only batch

- Status: accepted
- Context: The biggest latency factor in voice interaction is batch mode — waiting for the user to finish before inference starts. Streaming runs inference while the user speaks and saves more perceived latency than where inference runs; Parakeet's transducer architecture supports it, but the Hex SDK only exposed batch.
- Decision: Talk to FluidAudio directly and offer a streaming session (partial, confirmed and final transcripts) alongside batch transcription.
- Consequences: The protocol carries a per-connection stream lifecycle; chunk and context sizes trade first-partial latency against accuracy.
- Supersedes: —
- Superseded by: —
- From: [[roadmap/research/voice-io-landscape#Streaming vs Batch]]

^D008

### D009 — minerva is the inference hub

- Status: accepted
- Context: minerva (M4 Mac Mini) is always on with no battery concern; other devices (laptop, phone) should send audio to it over LAN/Tailscale, where the network adds only a few milliseconds.
- Decision: The STT servers run on minerva and accept remote clients over TCP on its tailnet address in addition to the local unix socket.
- Consequences: Remote clients pay LAN/Tailscale RTT only; the listen address is currently hard-coded to minerva.
- Supersedes: —
- Superseded by: —
- From: [[roadmap/research/hardware-topology#Minerva — Inference Hub]]

^D009

### D010 — MiMo TTS for spoken replies

- Status: accepted
- Context: MiMo TTS (`mimo-v2.5-tts`) gives high quality with prosody control through natural-language instructions and inline tags, and is already part of the token plan; its cost is network latency to Singapore.
- Decision: Ana's spoken replies use MiMo TTS through its chat-completions API (text in an `assistant` message, base64 WAV back).
- Consequences: Every spoken reply pays a network round trip.
- Supersedes: —
- Superseded by: —
- From: [[roadmap/research/voice-io-landscape#MiMo TTS (chosen primary)]]

^D010
