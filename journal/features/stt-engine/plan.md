---
owner: roysupriyo10
lifecycle: implementing
summary: Unified STT service on M4 Mac Mini (minerva) — FluidAudio for Parakeet CoreML/ANE, mlx-swift for Qwen3-ASR, single unix socket API. TypeScript client in monorepo.
topics:
  - stt
  - voice
  - coreml
  - apple-silicon
  - ana
supersedes: []
superseded-by: []
roadmap: R003
context: []
---

# Plan — stt-engine

## Objective

Ship a CoreML-backed STT service (`services/stt-coreml`) running on minerva (M4 Mac
Mini, 16GB, 38 TOPS ANE). One service, one unix socket, multiple backends: FluidAudio
for Parakeet on CoreML/ANE, mlx-swift for Qwen3-ASR on GPU, and any future models.
Platform-explicit naming (`stt-coreml`) — leaves room for `stt-cuda`, `stt-onnx`, etc.
behind the same socket protocol. A TypeScript client package (`packages/stt`) is the
platform-agnostic boundary; apps only depend on the client.

## Non-goals

- Python inference runtime (latency overhead, not the target stack).
- Cloud/API-based STT (MiMo ASR is a fallback, not the primary path).
- Phone client or multi-device audio routing (later; Ana scope).
- Wake word detection (separate concern).
- TTS (separate feature; MiMo API + Kokoro decided in [[ana]]).

## Principles

1. CoreML/ANE first — the M4's 38 TOPS ANE doesn't scale down across variants like GPU
   does. Prefer the runtime that uses dedicated silicon.
2. Models stay warm — loaded on startup, always resident. Cold start is a one-time cost.
3. The TypeScript client is runtime-agnostic — survives the Bun → Deno migration.
4. Unix socket for IPC — lowest latency local transport, same pattern as the kuib
   engine-service.

## P01 — Swift CoreML inference server

### P01-I01 — Swift package with FluidAudio dependency

- Acceptance: Swift package compiles on macOS ARM64. FluidAudio added as Swift Package
  dependency. Parakeet TDT v3 CoreML model loads on startup via FluidAudio's AsrManager.
  Model stays resident in memory. Measured cold load time and warm inference time on
  minerva's M4.

### P01-I02 — Batch transcription over unix socket

- Acceptance: Server listens on `~/.kuib/stt.sock`. Accepts PCM 16-bit 16kHz audio
  buffer, calls FluidAudio's transcribe API, returns transcript text. JSON protocol
  over the socket. Measured end-to-end latency for a 3-second utterance.

### P01-I03 — Backend abstraction for multi-engine support

- Acceptance: STT backends behind a protocol (`SttBackend`) with `transcribe(audio:)`.
  FluidAudio is the first backend. The protocol allows adding mlx-swift backends (P03)
  without changing the server or socket protocol. Model selection per request via a
  `engine` field in the JSON protocol.

## P02 — Streaming inference

### P02-I01 — Chunked streaming with partial results

- Acceptance: Server processes audio chunks as they arrive (configurable chunk window).
  Emits partial transcripts as chunks complete. Final transcript emitted on end-of-utterance.
  Measured first-partial latency.

### P02-I02 — VAD integration for end-of-utterance

- Acceptance: Voice activity detection determines when user stops speaking. Silence
  threshold configurable. Avoids premature cutoff on pauses. Can use Silero VAD or
  similar lightweight model.

## P03 — Qwen3-ASR via MLX Swift (accuracy path)

### P03-I01 — MLX Swift integration for Qwen3-ASR 0.6B

- Acceptance: Server can load Qwen3-ASR 0.6B (5-bit quantized) via mlx-swift alongside
  Parakeet CoreML. Model selection configurable. Measured WER and latency on minerva
  compared to Parakeet.

### P03-I02 — Model switching / dual-model pipeline

- Acceptance: Configurable model selection per request. Option for dual-pipeline: fast
  partial via Parakeet, high-accuracy final via Qwen3-ASR when utterance completes.

## P04 — TypeScript client package

### P04-I01 — Client package in monorepo

- Acceptance: `packages/stt` with Zod-typed schemas for STT events (partial transcript,
  final transcript, error). Connects to the unix socket. Runtime-agnostic (no Bun or
  Deno-specific APIs in the public interface).

### P04-I02 — Streaming API

- Acceptance: Client exposes an async iterator / event emitter for streaming transcripts.
  Ana can subscribe to partial results as they arrive.

## Decisions

### D001 — CoreML/ANE over MLX/GPU for primary inference

- Status: accepted
- Context: Plain M4 has 10-core GPU (120 GB/s bandwidth) but 38 TOPS ANE — same ANE as
  M4 Pro/Max. MLX runs on GPU and scales with GPU cores; CoreML uses ANE and doesn't
  lose speed on the base M4. Soniqo benchmarks show Parakeet CoreML INT8 at 117× RT
  regardless of chip variant.
- Options considered: MLX (GPU), CoreML (ANE), ONNX Runtime, CPU-only.
- Decision: CoreML/ANE as primary runtime. MLX Swift as secondary for models without
  good CoreML exports (Qwen3-ASR).
- Consequences: Swift is required (CoreML is a native Apple framework). Server is
  macOS-only. This is acceptable since minerva is the dedicated inference node.
- Supersedes: —
- Superseded by: —

### D002 — Swift as the server language

- Status: accepted
- Context: CoreML's API is ObjC/Swift-native. Calling it from Zig/Rust means bridging
  through the ObjC runtime — unnecessary friction. Swift compiles to standalone binary,
  has first-party mlx-swift bindings, and is the natural language for Apple ML frameworks.
- Options considered: Swift, Zig (+ ObjC bridge), Rust (+ objc crate), C++.
- Decision: Swift. Standalone binary compiled with `swift build -c release`.
- Consequences: Need Swift toolchain on minerva. Cross-compilation from Linux not
  practical for CoreML (framework only exists on macOS). Development happens on minerva
  or another Mac, with code kept in the kuib monorepo.
- Supersedes: —
- Superseded by: —

### D003 — Parakeet TDT v3 as initial model

- Status: accepted
- Context: Research (see `research/model-comparison.md`) evaluated Moonshine, Parakeet,
  Qwen3-ASR, Whisper, Cohere Transcribe, and SenseVoice. On plain M4 CoreML/ANE,
  Parakeet TDT v3 INT8 achieves 117× RT with 2.37% WER (LibriSpeech clean), 0.9 GB
  RAM, and has a proven CoreML export used in 20+ production Mac apps via FluidAudio.
- Options considered: Parakeet TDT v3 (CoreML), Qwen3-ASR 0.6B (MLX), Moonshine (WASM/CPU),
  Cohere Transcribe (MLX, no streaming).
- Decision: Start with Parakeet TDT v3 on CoreML. Add Qwen3-ASR 0.6B via MLX Swift in
  P03 for higher accuracy (1.74% WER) when needed.
- Consequences: 2.37% WER is excellent for a voice assistant. Streaming is supported
  natively by the transducer architecture. Qwen3-ASR path available later for sub-2% WER.
- Supersedes: —
- Superseded by: —

### D004 — Unix socket with JSON protocol for IPC

- Status: accepted
- Context: Same pattern as `@kuib-ai/engine-service` — unix socket with JSON messages.
  Lowest latency local transport. The TypeScript client connects the same way.
- Options considered: Unix socket, HTTP, gRPC, stdin/stdout.
- Decision: Unix socket at `~/.kuib/stt.sock`. JSON-framed messages (length-prefix +
  JSON body). Same lifecycle pattern as engine-service (survive client death, self-reap
  when idle, single-instance mutex).
- Consequences: Consistent with existing kuib architecture. Client implementation is
  straightforward — just socket connect + JSON parse.
- Supersedes: —
- Superseded by: —

### D005 — FluidAudio as dependency, not custom CoreML inference

- Status: accepted
- Context: FluidAudio (Apache-2.0, 2.8k stars, 37 releases, 20+ production apps) handles
  all CoreML complexity: 4-model pipeline (Preprocessor, Encoder INT8, Decoder, Joint),
  64-byte ANE-aligned memory, actor-based model ownership, compute-unit pinning, TDT greedy
  decoding. Writing custom CoreML inference would be 1000+ lines of specialized Swift that
  the owner cannot review (no Swift experience). See `research/fluidaudio-analysis.md`.
- Options considered: FluidAudio as dependency, write custom CoreML from FluidAudio's
  patterns, Soniqo speech-swift (license unclear).
- Decision: Use FluidAudio as a Swift Package dependency. Our code is a thin server
  wrapper (~200 lines) that calls FluidAudio's public API.
- Consequences: Dependent on FluidAudio's release cadence. If FluidAudio breaks or is
  abandoned, we have the research to write our own (patterns documented in analysis).
  Apache-2.0 means we can fork if needed.
- Supersedes: —
- Superseded by: —

### D006 — Unified service for all STT backends

- Status: accepted
- Context: Parakeet runs on CoreML/ANE (via FluidAudio), Qwen3-ASR runs on MLX/GPU (via
  mlx-swift). Both should be accessible through one service, one socket, one API. The
  client shouldn't know or care which backend handles a request.
- Options considered: Separate services per model, unified service with backend protocol.
- Decision: One service with a `SttBackend` protocol. FluidAudio backend (P01), mlx-swift
  backend (P03). Request includes optional `engine` field for model selection; default is
  the fastest available backend.
- Consequences: ANE and GPU run independently — Parakeet on ANE and Qwen3-ASR on GPU can
  even run concurrently without contention. The backend protocol must be simple enough that
  adding a new model is just implementing `transcribe(audio:)`.
- Supersedes: —
- Superseded by: —

## Gaps

### G001 — Parakeet CoreML model files source

- Status: resolved
- Context: FluidAudio downloads models from HuggingFace
  `FluidInference/parakeet-tdt-0.6b-v3-coreml`. Four model files: Preprocessor (CPU),
  Encoder INT8 (ANE), Decoder (ANE), JointDecision (ANE). FluidAudio handles download
  and local caching automatically. Also available at
  `aufklarer/Parakeet-TDT-v3-CoreML-INT8-30s`.

### G002 — Swift development workflow from Linux

- Status: resolved
- Context: Code lives in monorepo at `services/stt-coreml/`. Developed on any machine,
  built on minerva. `swift build` on minerva pulls deps + downloads models automatically.
  No cross-compilation needed — CoreML framework only exists on macOS.

### G003 — Streaming chunk configuration for Parakeet

- Status: open
- Context: MeetPing's production config uses 3.0s chunk window, 1.0s hypothesis chunk,
  1.0s left context, 0.5s right context, 0.6 confirmation threshold, resulting in ~1.4s
  first-partial. These parameters need tuning for voice-assistant latency requirements.
  Smaller chunks = faster first-partial but potentially lower accuracy.

### G004 — Deno migration impact on client package

- Status: open
- Context: The Bun → Deno migration is planned (landed 2026-09-22 — Deno is the runtime, `Deno.*` is used freely in host/runtime code; see `journal/features/deno-runtime/plan.md`). The STT client package must use
  runtime-agnostic APIs (no `bun:*` or `Deno.*` in the public interface). Unix socket
  access differs between runtimes — need an abstraction or conditional import.
