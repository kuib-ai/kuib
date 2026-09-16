# MLX Swift & Qwen3-ASR Architecture Analysis

## 1. MLX Swift Project Structure

**Repository:** `ml-explore/mlx-swift` (Apple official)
**Swift tools version:** 6.3 (experimental cgen)
**Platforms:** macOS 14+, iOS 17+, tvOS 17+, visionOS 1+

### Package Dependencies
```swift
.package(url: "https://github.com/ml-explore/mlx-swift", from: "0.10.0")
```

### Library Targets
| Target | Purpose | Dependencies |
|---|---|---|
| `MLX` | Core array framework, ops, I/O, device management | `Cmlx`, `swift-numerics` |
| `MLXNN` | Neural network layers (Module, Linear, Conv, Transformer, etc.) | `MLX` |
| `MLXRandom` | Random number generation | `MLX` |
| `MLXOptimizers` | SGD, Adam, etc. | `MLX`, `MLXNN` |
| `MLXFFT` | FFT operations | `MLX` |
| `MLXLinalg` | Linear algebra | `MLX` |
| `MLXFast` | Fused/fast kernels (scaled_dot_product_attention, etc.) | `MLX`, `Cmlx` |
| `Cmlx` | C/C++ MLX core + Metal backend (vendored as source) | System frameworks |

### Source Layout
```
Source/
  Cmlx/           — Vendored MLX C++ core (mlx/, mlx-c/, metal-cpp/, fmt/, json/)
  MLX/             — Swift core: MLXArray, DType, Device, IO, Ops, Memory, GPU
  MLXNN/           — Module, Linear, Conv, Embedding, Transformer, Quantized, etc.
  MLXFast/         — Fused kernels (scaledDotProductAttention)
  MLXFFT/          — FFT bindings
  MLXLinalg/       — Linalg bindings
  MLXRandom/       — Random
  MLXOptimizers/   — Optimizer implementations
  Examples/        — Tutorial, Example1, CustomFunction examples
```

All Swift targets enable `StrictConcurrency` experimental feature.

### Backend Selection
- **macOS/iOS (Metal):** Uses Metal GPU backend + Accelerate framework
- **Linux (CUDA):** Uses CUDA backend when `SPM_CUDA != "0"`
- **Linux (CPU):** CPU-only fallback

For the stt-engine on M4 Mac Mini, the Metal backend is used automatically.

### Higher-Level Libraries
- **mlx-swift-lm** (`ml-explore/mlx-swift-lm`): LLM and VLM implementations — separate repo, not part of mlx-swift itself
- **mlx-swift-examples**: Example apps (MNISTTrainer, LLMEval, StableDiffusion, MLXChatExample)

**Important:** There is NO mlx-swift-audio or mlx-swift-asr library yet. Audio/ASR inference in Swift via MLX would need to be built from scratch, porting the Python model architecture.

## 2. Key MLX Swift APIs

### Array Creation and Manipulation
```swift
import MLX

let x = MLXArray(1.0)                           // scalar
let y = MLXArray(converting: [1.0, 2.0], [2])   // from array literal
let z = MLXArray.ones([2, 2])                    // filled
let w = MLXArray.zeros([3, 4])                   // zeros

// Lazy evaluation — compute graph recorded, evaluated on read or explicit eval()
let result = x + y
result.eval()

// Indexing
let row = x[0]
let slice = x[0..<3]

// Reshaping
let reshaped = x.reshaped([2, -1])
let transposed = x.transposed(0, 2, 1, 3)
let flat = x.flattened(start: -2, end: -1)
```

### Model Loading (safetensors)
```swift
import MLX

// Load safetensors file → dictionary of arrays
let weights: [String: MLXArray] = try loadArrays(url: modelURL)

// Load with metadata
let (weights, metadata) = try loadArraysAndMetadata(url: modelURL)
```

### Module System (MLXNN)
```swift
import MLXNN

class MyModel: Module, UnaryLayer {
    let linear1: Linear
    let linear2: Linear

    init() {
        self.linear1 = Linear(512, 256)
        self.linear2 = Linear(256, 128)
    }

    func callAsFunction(_ x: MLXArray) -> MLXArray {
        var x = linear1(x)
        x = maximum(x, 0)  // ReLU
        return linear2(x)
    }
}

// Load weights into model
let model = MyModel()
let weights = try loadArrays(url: weightsURL)
model.update(parameters: ModuleParameters.unflattened(weights.map { ($0.key, $0.value) }))
eval(model)  // Force evaluation of all parameters
```

### Key NN Layers Available
- `Linear`, `QuantizedLinear`, `Embedding`, `QuantizedEmbedding`
- `Conv1d`, `Conv2d`, `ConvTransposed1d/2d`
- `LayerNorm`, `RMSNorm`, `GroupNorm`, `BatchNorm`
- `MultiHeadAttention` (with `MLXFast.scaledDotProductAttention`)
- `Transformer` encoder/decoder layers
- `GELU`, `SiLU`, `ReLU`, `Tanh`, etc.
- `Dropout`, `Pooling`, `Upsample`

### Quantization
```swift
// Quantize an existing model
quantize(model: model, groupSize: 64, bits: 4, mode: .affine)

// Individual layer
let qLinear = QuantizedLinear(existingLinear, groupSize: 64, bits: 4)

// Quantized operations
let result = quantizedMM(x, weight, scales: scales, biases: biases,
                          transpose: true, groupSize: 64, bits: 4, mode: .affine)
```

Supported quantization modes: `.affine` (standard), NV FP4 (with global scale).
Bit widths: 2, 4, 5, 6, 8 bits supported via the `quantized()`/`dequantized()` ops.

### FFT (needed for mel spectrogram)
```swift
import MLXFFT

let spectrum = MLX.fft.rfft(windowedFrames)  // real FFT
```

## 3. Qwen3-ASR Model Architecture

### Overview
Qwen3-ASR is an **encoder-decoder** model:
- **Audio Encoder:** Conv2d stem (8× temporal downsample) → sinusoidal positional embeddings → transformer encoder layers → MLP projection
- **Text Decoder:** Embedding → transformer decoder with MRoPE (Multi-dimensional Rotary Position Embedding) → LM head

### Audio Encoder Details

**Conv2d Stem** (3 layers, each stride=2):
- Input: mel spectrogram `(B, 128, n_frames)` → treated as `(B, H=128, W=n_frames, C=1)` in NHWC
- `Conv2d(1, dhs, kernel=3, stride=2, padding=1)` + GELU × 3
- Output: `(B, 16, n_frames/8, dhs)` → reshape to `(B, n_frames/8, dhs*16)`
- `dhs = 480` (downsample hidden size)
- After conv: `Linear(dhs * 16, d_model)` projection

**Chunked Processing:**
- Mel frames split into chunks of `n_window * 2 = 100` frames
- Each chunk processed independently through conv stem
- Position embeddings restart at 0 per chunk (not cumulative)

**Transformer Encoder:**
- 0.6B: 18 layers, 14 heads, FFN dim 3584, d_model 896
- 1.7B: 24 layers, 16 heads, FFN dim 4096, d_model 1024
- Pre-norm with **LayerNorm** (not RMSNorm)
- Bidirectional attention with windowed (block-diagonal) masking
- GELU activation

**Output Projection:**
- LayerNorm → `Linear(d_model, d_model)` + GELU → `Linear(d_model, output_dim)`
- output_dim: 1024 (0.6B) or 2048 (1.7B)

### Text Decoder Details

**Architecture:** Qwen3-style causal transformer
- 0.6B: 28 layers, 16 heads (12 KV heads), hidden 1024, intermediate 2816
- 1.7B: 28 layers, 16 heads (8 KV heads), hidden 2048, intermediate 11008

**Key innovations:**
- **MRoPE** (Multi-dimensional RoPE): 3 spatial dimensions (temporal, height, width) with sections [24, 20, 20]. Uses stride-3 interleaving, NOT chunking. Standard nn.RoPE will NOT work.
- **Q/K RMSNorm**: Per-head RMSNorm on queries and keys before attention
- **GQA**: Grouped Query Attention (num_kv_heads < num_heads)
- **SwiGLU** FFN: `gate_proj`, `up_proj`, `down_proj` with SiLU activation

**Audio Feature Injection:**
- Audio encoder output tokens replace audio placeholder positions in the text embedding
- Uses cumulative-sum indexing for position mapping
- `audio_token_id = 151646` marks placeholder positions

### Inference Pipeline
1. Load audio → mono 16kHz numpy array
2. Compute mel spectrogram (128 bins, 400 FFT, 160 hop)
3. Split into ~30s chunks at low-energy boundaries
4. Per chunk:
   - Compute mel features → `(1, 128, n_frames)`
   - Audio encoder: mel → audio feature tokens `(1, n_tokens, output_dim)`
   - Build prompt: `[system] [user: audio_placeholders] [assistant:]`
   - Prefill: inject audio features at placeholder positions → populate KV cache
   - Autoregressive decode: greedy token generation until EOS
   - Parse output: extract text from special tokens
5. Merge chunk transcriptions

### Streaming (experimental in mlx-qwen3-asr)
- `StreamingState` buffers audio in chunks (default 2s / 32000 samples)
- Processes accumulated audio with sliding context
- `unfixed_chunk_num = 2`, `unfixed_token_num = 5` — trailing chunks/tokens are unstable
- Stable text is the prefix that won't change with more audio
- Energy-based endpointing option for automatic chunk boundaries

## 4. Audio Preprocessing

### Parameters
```
Sample rate:  16000 Hz
FFT size:     400 (25ms window at 16kHz)
Hop length:   160 (10ms stride at 16kHz)
Mel bins:     128 (Slaney-normalized filterbank)
Window:       Hann
```

### Pipeline (from `audio.py`)
1. **Load audio** → mono float32, 16kHz (via ffmpeg or fast WAV parser)
2. **Reflect pad** by `n_fft // 2 = 200` on each side
3. **STFT**: Frame extraction via `as_strided`, Hann window, `rfft`
4. **Power spectrogram**: `|STFT|²`
5. **Mel projection**: Pre-computed filterbank `(128, 201)` @ spectrogram
6. **Log scale**: `log10(max(mel, 1e-10))`; clamp to `max - 8.0`; normalize: `(x + 4) / 4`
7. **Trim**: Drop last STFT frame (Whisper convention)

### Mel Filterbank
Pre-computed and stored in `assets/mel_filters.npz`. Generated by `scripts/generate_mel_filters.py`. Shape: `(128, 201)` where 201 = N_FFT // 2 + 1.

### Key Difference from Whisper
- No forced padding to 30s (3000 frames). Audio processed at natural length.
- Same mel formula otherwise (Whisper-compatible log-mel).

## 5. Quantization in MLX

### How Quantized Models Are Used
Pre-quantized models on HuggingFace (e.g., `mlx-community/Qwen3-ASR-0.6B-MLX-8bit`) store weights as:
- `weight`: Packed quantized integers
- `scales`: Per-group scale factors
- `biases`: Per-group bias (for affine quantization)

### Loading Quantized Weights
The Python implementation uses `mlx.nn.QuantizedLinear` and `mlx.nn.QuantizedEmbedding`. Weight remapping in `convert.py` handles HuggingFace → MLX key translation.

In MLX Swift, the same pattern exists:
- `QuantizedLinear` and `QuantizedEmbedding` classes in `MLXNN/Quantized.swift`
- Accept `weight`, `scales`, `biases`, `groupSize`, `bits`, `mode` directly
- `quantizedMM()` for efficient quantized matrix multiplication on GPU

### Quantization Levels (from Soniqo benchmarks)
| Quant | WER% | Speed | RAM |
|---|---|---|---|
| 5-bit | 1.74 (0.6B) / 1.32 (1.7B) | 70× / 36× | 1.03 / 1.92 GB |
| 8-bit | 1.82 / 1.52 | 66× / 30× | 1.3 / 2.7 GB |
| 4-bit | 2.20 (0.6B) | 86× | 1.0 GB |

## 6. What Porting Qwen3-ASR to MLX Swift Requires

### Must Implement (no existing Swift equivalents)
1. **MRoPE** — the interleaved multi-dimensional rotary embedding. Standard RoPE won't work. Need to port `mrope.py` (the interleaving logic with sections [24, 20, 20]).
2. **Audio preprocessing** — STFT with reflect padding, mel filterbank, log-mel normalization. MLX Swift has FFT via `MLXFFT` but no high-level mel spectrogram function.
3. **Conv2d stem** — three stride-2 convolutions with channel-major reshape. `MLXNN.Conv2d` exists but the reshape logic (NHWC → channel-major) needs careful porting.
4. **Windowed encoder attention** — block-diagonal masking with `cu_seqlens` boundaries.
5. **Audio token injection** — cumulative-sum indexing to replace placeholder positions.
6. **Prompt/tokenizer** — tokenizer loading from HuggingFace vocab files. The Python uses `regex`-based tokenization. Need a Swift tokenizer or use `swift-tokenizers`.
7. **Autoregressive generation** — greedy decoding with KV cache, EOS detection, repetition detection.
8. **Quantized weight loading** — reading pre-quantized safetensors into `QuantizedLinear`/`QuantizedEmbedding`.

### Already Available in MLX Swift
- `Module`, `Linear`, `QuantizedLinear`, `QuantizedEmbedding`
- `Conv2d`, `LayerNorm`, `RMSNorm`
- `MultiHeadAttention` (with `scaledDotProductAttention`)
- Safetensors loading (`loadArrays`)
- FFT (`mx.fft.rfft` equivalent)
- All basic array ops, reshape, transpose, concatenate, etc.

### Estimated Effort
Porting Qwen3-ASR to MLX Swift is a substantial task (~2000-3000 lines of Swift, excluding tests). The main complexity is:
1. MRoPE (correctness-critical, ~200 lines)
2. Audio preprocessing (mel spectrogram, ~200 lines)
3. Encoder with windowed attention (~400 lines)
4. Decoder with GQA + KV cache (~400 lines)
5. Top-level model + token injection (~200 lines)
6. Tokenizer (~300 lines)
7. Generation loop (~300 lines)
8. Streaming support (~400 lines)

### Alternative: Use CoreML Path Instead
The `parakeet-coreml` approach (CoreML/ANE via Swift CoreML framework) avoids all of this complexity. CoreML models are pre-compiled — you just load the `.mlmodelc` and call `prediction()`. No need to implement transformer layers, attention, or quantization in Swift. This is why the plan's P01 starts with Parakeet on CoreML rather than Qwen3-ASR on MLX Swift.
