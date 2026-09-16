# FluidAudio Swift SDK — Patterns for Building STT on CoreML/ANE

Repo: `FluidInference/FluidAudio` (Apache-2.0, ~2.8k stars)
Swift tools version: 6.0, platforms: macOS 14+, iOS 17+

## 1. Project Structure

```
Package.swift                    # Zero external Swift deps; two binary targets
Sources/
  FluidAudio/
    ASR/
      Parakeet/
        SlidingWindow/           # Offline encoder + overlapping windows = pseudo-streaming
          TDT/                   # Token-and-Duration Transducer decoder
            AsrManager.swift     # public actor — THE entry point
            AsrModels.swift      # Model loading, HF download, version dispatch
            ChunkProcessor.swift # Chunk boundary math, parallel processing
            Decoder/             # TdtDecoderV2, V3, state, hypothesis, joint inference
          SlidingWindowAsrManager.swift  # High-level streaming API (audio in → transcript updates out)
          SlidingWindowAsrSession.swift
        Streaming/               # True streaming models (Nemotron EOU, RNN-T)
          StreamingAsrManager.swift
          EncoderCacheManager.swift
        Unified/                 # Unified offline+streaming config
        AudioBuffer.swift
      Canary/                    # NVIDIA Canary model family
      Cohere/                    # Cohere Transcribe
    TTS/                         # Kokoro, KokoroAne, PocketTTS, StyleTTS2
    VAD/                         # Silero VAD
    Diarizer/                    # Online + offline speaker diarization
    Shared/
      AudioConverter.swift       # Sample rate conversion, mono downmix
      AudioMelSpectrogram.swift  # Pure Swift mel spectrogram (Accelerate/vDSP)
      ANEMemoryOptimizer.swift   # Page-aligned allocations, buffer pooling, zero-copy views
      ANEMemoryUtils.swift       # 64-byte aligned posix_memalign for ANE DMA
      MLArrayCache.swift         # Reusable MLMultiArray cache to avoid allocations
      MLModelConfigurationUtils.swift  # Per-model compute unit selection
      ModelHub/                  # HuggingFace model download + caching
      AppLogger.swift            # os.Logger wrapper
  FluidAudioCLI/                 # CLI tool (`swift run fluidaudiocli transcribe ...`)
```

Key observations:
- **Zero external Swift dependencies** — only system frameworks (CoreML, AVFoundation, Accelerate, Metal)
- Binary targets: `NemoTextProcessing` (Rust→xcframework) and C++17 `FastClusterWrapper`
- Each model family owns its own manager, decoder, and pipeline — no premature abstractions

## 2. CoreML Model Loading

Models are 4 CoreML files for Parakeet TDT: `Preprocessor.mlmodelc`, `Encoder_INT8.mlmodelc`, `Decoder.mlmodelc`, `JointDecision.mlmodelc` (or `JointDecisionv3.mlmodelc` for v3).

### Critical pattern: per-model compute unit selection

```swift
// Preprocessor always CPU — its ops map to CPU regardless of setting
ModelSpec(fileName: "Preprocessor", computeUnits: .cpuOnly)

// Encoder on ANE by default (.cpuAndNeuralEngine), with optional GPU override
// GPU is ~24% faster on M-series but ANE is more power-efficient
ModelSpec(fileName: "Encoder_INT8", computeUnits: encoderComputeUnits ?? config.computeUnits)

// Decoder + Joint on ANE
ModelSpec(fileName: "Decoder", computeUnits: config.computeUnits)
ModelSpec(fileName: "JointDecision", computeUnits: config.computeUnits)
```

Default configuration: `.cpuAndNeuralEngine` — NOT `.all`. Setting `.all` can cause the system to dispatch to GPU when ANE would be faster.

### Model download + caching

Models are lazy-downloaded from HuggingFace on first use. `ModelHub` handles:
- HF tree listing to discover files
- Retry policy with backoff
- Local caching to `~/Library/Caches/FluidAudio/<repo>/`
- Compiled model caching (`.mlmodelc` is already compiled)

### Vocabulary

JSON file (`vocab.json`) mapping token ID → string. Loaded once, cached on the `AsrManager` actor. Two formats supported: array (index = ID) or dict (key = ID string).

## 3. Audio Preprocessing — Mel Spectrogram

`AudioMelSpectrogram.swift` is a **pure Swift implementation** using `Accelerate` (vDSP). NOT CoreML.

Config matching NeMo's `AudioToMelSpectrogramPreprocessor`:
- 16kHz sample rate, 512 FFT, 160 hop (10ms), 400 window (25ms)
- 128 mel bins (for Nemotron) or 80 (for Parakeet — which uses the CoreML preprocessor instead)
- Hann window (symmetric), 0.97 preemphasis, center padding
- Slaney mel scale (linear below 1kHz, log above)

### Performance patterns

1. **Pre-allocated reusable buffers** — `realIn`, `imagIn`, `realOut`, `imagOut`, `powerSpec`, `frame` are instance vars, not per-call allocations
2. **vDSP vectorized ops** — `vDSP_vmul` for windowing, `vDSP_mmul` for filterbank application, `vDSP_vsq`/`vDSP_vadd` for power spectrum, `vDSP_vsma` for preemphasis
3. **Flat filterbank matrix** — `melFilterbankFlat` is pre-flattened `[nMels * numFreqBins]` for `vDSP_mmul`
4. **FFT via `vDSP_DFT_zop_CreateSetup`** — setup created once in init, reused for all frames

However: **for Parakeet TDT, the preprocessor is a CoreML model** (`Preprocessor.mlmodelc`), NOT this Swift mel extractor. The Swift mel is used for Nemotron and other models that need a native frontend. This is a key insight — Parakeet's mel+CMVN is baked INTO the CoreML graph.

## 4. Inference Pipeline (Parakeet TDT)

### Architecture: Encoder → Decoder → Joint (transducer)

```
Raw audio (PCM 16kHz Float32)
  ↓ Preprocessor.mlmodelc (mel spectrogram + CMVN, CPU-pinned)
Mel features [1, 80, T]
  ↓ Encoder_INT8.mlmodelc (FastConformer, ANE)
Encoder output [1, T/8, 1024]  (8x temporal downsampling)
  ↓ TDT decoder loop (greedy, per-frame):
  │   For each encoder frame:
  │     Decoder.mlmodelc (LSTM prediction network, ANE)
  │       → hidden state + cell state
  │     JointDecision.mlmodelc (joint network, ANE)
  │       → token logits + duration logits
  │     If blank → skip N frames (duration prediction)
  │     If token → emit token, update LSTM state
  ↓
Hypothesis: [(tokenId, startFrame, endFrame, logProb)]
  ↓ Vocabulary lookup + SentencePiece decoding
Text transcript with word-level timestamps
```

### The TDT duration trick

TDT predicts BOTH a token AND a duration per frame. When blank is predicted, the decoder skips N frames (the duration) instead of processing frame-by-frame. This is the source of Parakeet's 2-3x speedup over vanilla RNN-T — most of speech is silence/noise, and TDT skips it entirely.

### Decoder loop (`TdtDecoderV3.decodeWithTimings`)

Greedy decoding, NOT beam search. Per encoder frame:
1. Run decoder LSTM with current target + hidden/cell state → new hidden/cell state
2. Run joint network with encoder frame + decoder output → (token logits, duration logits)
3. If best token = blank: advance by predicted duration
4. If best token ≠ blank: emit token, advance by 1 frame, update decoder state

Safety: `maxTokensPerChunk` (10,000) and `consecutiveBlankLimit` (500) prevent infinite loops.

## 5. Streaming — Sliding Window

Parakeet TDT is a **non-streaming encoder** (full attention over the entire input). "Streaming" is achieved via overlapping sliding windows.

### `SlidingWindowAsrManager` (actor)

```
Audio input → sampleBuffer → chunk windows → AsrManager.transcribe → tokens → dedup → transcript
              (15s chunks)   (with overlap)
```

Config defaults:
- **Chunk**: 15.0s (actually 14.88s after mel context + frame alignment — see §2.3 in Architecture.md)
- **Left context**: 10.0s overlap (previous chunk's audio re-processed)
- **Right context**: 2.0s (future audio included)
- **Confirmation threshold**: 0.85 confidence + ≥10s context

### Two-tier transcript state

```swift
public private(set) var volatileTranscript: String = ""    // May change as more audio arrives
public private(set) var confirmedTranscript: String = ""   // Locked, won't change
```

Updates emitted as `AsyncStream<SlidingWindowTranscriptionUpdate>` — non-throwing, because chunk failure resets state but doesn't kill the stream.

### Token deduplication between windows

`SequenceMatcher` handles overlap dedup: tokens from the new window that overlap with the previous window's tokens are matched by temporal adjacency (not just string equality) to avoid dropping coincidental matches between far-apart words.

## 6. ANE Optimization Patterns

### 6.1 Page-aligned memory allocation

```swift
// ANE requires 64-byte alignment for optimal DMA transfers
var alignedPointer: UnsafeMutableRawPointer?
posix_memalign(&alignedPointer, 64, alignedBytes)

let array = try MLMultiArray(
    dataPointer: pointer,
    shape: shape,
    dataType: dataType,
    strides: strides,
    deallocator: { bytes in Darwin.free(bytes) }
)
```

This is critical — `MLMultiArray` default allocation may not be ANE-aligned, causing an implicit copy on every prediction.

### 6.2 MLMultiArray cache (avoid allocation in hot loops)

`sharedMLArrayCache` pre-warms arrays for known shapes at init:
```swift
await sharedMLArrayCache.prewarm(shapes: [
    ([1, 240_000], .float32),           // audio signal
    ([1], .int32),                       // audio length
    ([2, 1, decoderHiddenSize], .float32) // LSTM state
])
```

Then in the hot path: `try await sharedMLArrayCache.getArray(shape:dataType:)` returns a pre-allocated, correctly-shaped array.

### 6.3 Zero-copy chaining between models

`ZeroCopyDiarizerFeatureProvider` chains output from one model directly as input to the next without copying:
```swift
ZeroCopyDiarizerFeatureProvider.chain(
    from: encoderOutput, outputName: "encoded",
    to: "encoder_output"
)
```

### 6.4 Compute unit selection is per-model, measured

The preprocessor runs on CPU (its ops don't map to ANE anyway). The encoder, decoder, and joint run on `.cpuAndNeuralEngine`. Never use `.all` globally — it lets the system dispatch to GPU which may be slower.

For throughput workloads (plugged in, not battery): encoder can optionally use `.cpuAndGPU` for ~24% speedup on Apple Silicon GPUs, WER-neutral.

## 7. Memory Management

### Actor-based model stores

Every component that owns CoreML models uses a Swift `actor`:
```swift
public actor AsrManager {
    internal var preprocessorModel: MLModel?
    internal var encoderModel: MLModel?
    internal var decoderModel: MLModel?
    internal var jointModel: MLModel?
}
```

Why actors not locks: CoreML `MLModel.prediction()` is async but NOT reentrant — concurrent calls corrupt internal scratch buffers. Actor isolation serializes access without manual locking.

### Models stay loaded

Models are loaded once and kept resident. `cleanup()` explicitly nils them. There's no automatic unloading — the assumption is models stay warm for the lifetime of the manager.

### Buffer lifecycle

- `ANEMemoryOptimizer.bufferPool` — keyed buffer pool with NSLock (not actor, for synchronous access)
- `sharedMLArrayCache` — global shared cache, pre-warmed at init
- Mel spectrogram instance owns its own pre-allocated FFT buffers

## 8. API Design Patterns to Adopt

### 8.1 `actor` for anything that owns models

Every model manager is an actor. This is non-negotiable for Swift 6 concurrency safety.

### 8.2 `AsyncStream` for streaming output

```swift
// Non-throwing for incremental updates that survive transient errors
AsyncStream<SlidingWindowTranscriptionUpdate>

// Throwing for operations where mid-stream failure terminates
AsyncThrowingStream<Double, Error>  // progress
```

### 8.3 Config structs with sensible defaults

```swift
public struct ASRConfig: Sendable {
    public static let `default` = ASRConfig()
    public let sampleRate: Int = 16000
    public let tdtConfig: TdtConfig = .default
    // ...
}
```

### 8.4 Error enums per domain

```swift
public enum ASRError: LocalizedError, Sendable {
    case notInitialized
    case invalidAudioData
    case processingFailed(String)
    case unsupportedPlatform(String)
}
```

### 8.5 `AVAudioPCMBuffer` + raw `[Float]` + `URL` entry points

Three transcription methods accepting different input types:
```swift
public func transcribe(_ audioBuffer: AVAudioPCMBuffer, ...) async throws -> ASRResult
public func transcribe(_ url: URL, ...) async throws -> ASRResult
public func transcribe(_ audioSamples: [Float], ...) async throws -> ASRResult
```

### 8.6 Vocabulary + decoder state are external

`TdtDecoderState` is passed `inout` — the caller owns it. This enables session-level state management (reset per utterance, carry across for continuous).

## Summary: What To Adopt for kuib's STT Engine

1. **Swift 6 actor for model ownership** — `AsrManager` pattern
2. **Per-model compute unit pinning** — preprocessor CPU, encoder+decoder+joint ANE
3. **64-byte aligned `posix_memalign`** for ANE DMA-optimal MLMultiArray allocation
4. **Pre-warm MLMultiArray cache** at init for known shapes
5. **Zero external Swift deps** — only system frameworks
6. **Parakeet's preprocessor IS a CoreML model** — no need to rewrite mel extraction in Swift for Parakeet (the CoreML graph includes it). Only needed for other models.
7. **Sliding window for pseudo-streaming** — offline encoder + overlapping chunks
8. **AsyncStream for transcript updates** — non-throwing for resilience
9. **Config structs with `.default`** — `Sendable`, composable
10. **HuggingFace model download + local caching** — lazy, first-use
11. **Actor isolation** serializes CoreML calls — no locks, no `@unchecked Sendable`
12. **TDT greedy decoding** — not beam search. Simple, fast, accurate enough.

## What NOT to copy

- The full sliding window complexity (overlap math, dedup, dual-decode arbitration) — start with batch, add streaming later
- Custom vocabulary boosting (CTC head, BK-tree rescoring) — premature for v1
- NeMo text processing (Rust xcframework) — heavyweight, add later if needed
- Multi-model version dispatch (v2/v3/110m/ja) — start with one model
