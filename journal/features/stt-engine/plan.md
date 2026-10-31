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
checkpoint:
  summary: "P01 code complete. Renamed to services/stt-coreml. Swift 6.0 (toolchain 6.3.3 on minerva), SwiftNIO for socket server, Nx project.json wired. All P01 items done. Live evaluation on 2026-10-18/19 compared Qwen3-ASR 0.6B, Whisper Large-v3-Turbo, and Cohere Transcribe 2B; architecture for resident multi-model confidence routing and Cohere Transcribe Roman Hinglish/Benglish adaptation recorded in research/multilingual-routing-and-adaptation-2026-10-19.md."
  next: ["P02-I01", "P03-I02", "P03-I03", "P03-I04"]
  blockers: []
  note: "2026-10-19: Evaluated Qwen3-ASR 0.6B, Whisper Large-v3-Turbo, and Cohere Transcribe 2B (CohereLabs/cohere-transcribe-03-2026) on live English + Hinglish/Benglish dictation. Cohere Transcribe's FastConformer encoder (8x subsampling, 12.5 Hz) captures phonemes accurately and runs with very low latency and strong punctuation, lacking only Indian voiced aspirates in top encoder layers and Roman Hinglish/Benglish/developer priors in the decoder. Designed two complementary tracks in [[features/stt-engine/research/multilingual-routing-and-adaptation-2026-10-19]]: (1) keeping 3-5 models resident in minerva's 16 GB RAM with per-segment confidence/entropy routing, rolling bidirectional context reconciliation during speech, and instant buffered retry/script switching; (2) 3-zone LoRA adaptation of Cohere Transcribe 2B (frozen bottom 75% encoder, light LoRA on top 25% encoder, heavy LoRA on decoder) + developer ITN for numeric digits."
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
- TTS (separate feature; MiMo API + Kokoro decided in [[_archive/ana/decisions|ana]]).

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
- State: implemented
- Decisions: D001, D002, D003, D005
- Addresses: G001
- Refs:
  - `services/stt-coreml/Package.swift` — Package.swift
  - `services/stt-coreml/Sources/SttCoreML/ParakeetBackend.swift` — ParakeetBackend.swift

### P01-I02 — Batch transcription over unix socket

- Acceptance: Server listens on `~/.kuib/stt.sock`. Accepts PCM 16-bit 16kHz audio
  buffer, calls FluidAudio's transcribe API, returns transcript text. JSON protocol
  over the socket. Measured end-to-end latency for a 3-second utterance.
- State: implemented
- Decisions: D004
- Refs:
  - `services/stt-coreml/Sources/SttCoreML/Server.swift` — Server.swift
  - `services/stt-coreml/Sources/SttCoreML/Protocol.swift` — Protocol.swift
  - `services/stt-coreml/Sources/SttCoreML/Main.swift` — Main.swift

### P01-I03 — Backend abstraction for multi-engine support

- Acceptance: STT backends behind a protocol (`SttBackend`) with `transcribe(audio:)`.
  FluidAudio is the first backend. The protocol allows adding mlx-swift backends (P03)
  without changing the server or socket protocol. Model selection per request via a
  `engine` field in the JSON protocol.
- State: implemented
- Decisions: D006
- Refs:
  - `services/stt-coreml/Sources/SttCoreML/SttBackend.swift` — SttBackend.swift

## P02 — Streaming inference

### P02-I01 — Chunked streaming with partial results

- Acceptance: Server processes audio chunks as they arrive (configurable chunk window).
  Emits partial transcripts as chunks complete. Final transcript emitted on end-of-utterance.
  Measured first-partial latency.
- State: planned
- Addresses: G003

### P02-I02 — VAD integration for end-of-utterance

- Acceptance: Voice activity detection determines when user stops speaking. Silence
  threshold configurable. Avoids premature cutoff on pauses. Can use Silero VAD or
  similar lightweight model.
- State: planned

## P03 — Qwen3-ASR via MLX Swift (accuracy path)

### P03-I01 — MLX Swift integration for Qwen3-ASR 0.6B

- Acceptance: Server can load Qwen3-ASR 0.6B (5-bit quantized) via mlx-swift alongside
  Parakeet CoreML. Model selection configurable. Measured WER and latency on minerva
  compared to Parakeet.
- State: planned
- Decisions: D001, D006

### P03-I02 — Model switching / dual-model pipeline

- Acceptance: Configurable model selection per request. Option for dual-pipeline: fast
  partial via Parakeet, high-accuracy final via Qwen3-ASR when utterance completes.
- State: planned

### P03-I03 — Resident multi-model pool and per-segment confidence routing

- Acceptance: `minerva` keeps 3–5 specialized models warm in its 16 GB unified memory
  (e.g., `Cohere Transcribe 2B`, `Parakeet TDT v3`, a Roman Hinglish/Benglish specialist,
  and an on-demand Devanagari/native-script model) with zero cold-switch overhead. Incoming
  audio is segmented at VAD micro-pauses (`2–4 s`); segments whose primary-model decoder
  confidence / token log-probability falls below threshold are automatically re-transcribed
  against the secondary resident model while the next segment is being spoken. Includes
  rolling background context reconciliation across adjacent segments and client audio-buffer
  retention for single-key retry or script switching. See
  [[features/stt-engine/research/multilingual-routing-and-adaptation-2026-10-19]].
- State: planned
- Decisions: D006, D007
- Addresses: G005

### P03-I04 — Cohere Transcribe 2B Roman Hinglish/Benglish adaptation and developer ITN

- Acceptance: Unwrap `CohereLabs/cohere-transcribe-03-2026` (FastConformer 8x subsampling
  encoder + Transformer decoder) and apply a 3-zone adaptation: freeze the bottom ~75% of
  the encoder, apply light LoRA (`r=16`) to the top ~25% of the encoder for Indian voiced
  aspirates (`bh`, `dh`, `gh`, `jh`) and non-rhotic syllable boundaries, and apply heavy
  LoRA (`r=32–64`) to the decoder for Roman Hinglish, Kolkata Roman Benglish, and developer
  vocabulary (`minerva`, `cetus`, `eos`, `cornelius`, `kuib`, `tsgo`, `claude`). Add
  deterministic Inverse Text Normalization (ITN) / logit biasing so developer numbers and
  units (`port 8080`, `port 8000`, `16GB`) emit numeric digits. See
  [[features/stt-engine/research/multilingual-routing-and-adaptation-2026-10-19]].
- State: planned
- Decisions: D007
- Addresses: G005

## P04 — TypeScript client package

### P04-I01 — Client package in monorepo

- Acceptance: `packages/stt` with Zod-typed schemas for STT events (partial transcript,
  final transcript, error). Connects to the unix socket. Runtime-agnostic (no Bun or
  Deno-specific APIs in the public interface).
- State: planned
- Addresses: G004

### P04-I02 — Streaming API

- Acceptance: Client exposes an async iterator / event emitter for streaming transcripts.
  Ana can subscribe to partial results as they arrive.
- State: planned

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

### D007 — Resident multi-model confidence routing and Cohere Transcribe 2B adaptation

- Status: accepted
- Ruling: "in my minerva machine, i will have, i can most likely keep four or five models loaded in the ram properly, and in terms of processing, also, i think only one will run at any time. so, it should accommodate itself and basically should be able to switch very seamlessly. keeping the real time factor. and since we will do some intelligent batching. some proper chunking of audio, the switching can be. segmented among the sections where i am speaking. that particular language... the single model that we are making will likely be able to handle all three languages. but it should still be able to handle some specific configuration and maybe some model score is low or high. or maybe let's say if i want the script in devanagari. i can have another model ready there for that." (roysupriyo10, 2026-10-19)
- Context: Live testing on 2026-10-18/19 showed `Qwen3-ASR 0.6B` mangles Hindi/technical phonetics, stock `whisper-large-v3-turbo` with `<|hi|>` locks the entire output into Devanagari, and `CohereLabs/cohere-transcribe-03-2026` (`2B`, FastConformer 8x subsampling) is extremely fast with accurate punctuation on English and hears Indic phonemes cleanly in its encoder, failing only in its English-biased decoder vocabulary.
- Decision: Pair two complementary capabilities on `minerva`: (1) keep 3–5 specialized models warm in unified memory and route VAD-segmented audio chunks dynamically using decoder confidence / entropy scores (plus explicit request configuration such as Roman vs Devanagari script), reconciling adjacent segments in the background while the user is still speaking; and (2) adapt `Cohere Transcribe 2B` via a 3-zone LoRA strategy (frozen bottom ~75% encoder, light LoRA on top ~25% encoder, heavy LoRA on decoder) with developer ITN for numeric digits.
- Consequences: Zero cold-switch latency on `minerva`; seamless mid-utterance code-switching across English, Roman Hinglish, and Roman Benglish; retains ability to switch to native-script models on demand.
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

### G005 — Cohere Transcribe layer inspection and confidence routing thresholds

- Status: planned
- Recommendation: Inspect `CohereLabs/cohere-transcribe-03-2026` weight structure and token log-probability distributions on English vs Hinglish/Benglish utterances to set the segment confidence threshold and target module names for the 3-zone LoRA.
- Context: Details and architecture recorded in
  [[features/stt-engine/research/multilingual-routing-and-adaptation-2026-10-19]].
