# STT Model Comparison for M4 Mac Mini

Research date: 2026-09-17

## Apple Silicon benchmarks (Soniqo, M5 Pro 48GB)

Plain M4 has 10-core GPU (not 20 like Pro) but same 38 TOPS ANE. MLX (GPU) numbers
scale down ~40% on plain M4. CoreML (ANE) numbers are unchanged.

| Model | Runtime | Quant | WER% | Speed | RAM |
|---|---|---|---|---|---|
| Qwen3-ASR 1.7B | MLX | 5-bit | 1.32 | 36× RT | 1.92 GB |
| Qwen3-ASR 1.7B | MLX | 8-bit | 1.52 | 30× RT | 2.7 GB |
| WhisperKit Large-v3 Turbo | CoreML | FP16 | 1.71 | 12× RT | 0.4 GB |
| Qwen3-ASR 0.6B | MLX | 5-bit | 1.74 | 70× RT | 1.03 GB |
| Qwen3-ASR 0.6B | MLX | 8-bit | 1.82 | 66× RT | 1.3 GB |
| Qwen3-ASR 0.6B | MLX | 4-bit | 2.20 | 86× RT | 1.0 GB |
| Parakeet TDT v3 | CoreML | INT8 | 2.37 | 117× RT | 0.9 GB |
| Nemotron Streaming | CoreML | INT8 | 2.82 | 17× RT | 961 MB |
| Qwen3-ASR 0.6B | CoreML | INT8 | 3.02 | 10× RT | 1.4 GB |
| Omnilingual CTC 300M | MLX | 4-bit | 4.26 | 222× RT | 0.4 GB |

## Open ASR Leaderboard (diverse test sets)

| Model | Avg WER | LS Clean |
|---|---|---|
| Cohere Transcribe 2B | 5.42 | 1.25 |
| Qwen3-ASR 1.7B | 5.76 | 1.63 |
| Whisper Large v3 | 7.44 | 2.01 |

## Key findings

- **Parakeet TDT v3 CoreML** is the best CoreML/ANE model: 117× RT, 2.37% WER, 0.9 GB.
  Same speed on plain M4 as M4 Pro (ANE doesn't scale down). 20+ production Mac apps.
- **Qwen3-ASR 0.6B MLX 5-bit** is the best balanced model: 1.74% WER, 70× RT, 1.03 GB.
  But runs on GPU which is weaker on plain M4 (~28× RT estimated).
- **Qwen3-ASR CoreML export is poor**: 3.02% WER, 10× RT (worse than MLX path).
- **Cohere Transcribe** is #1 on accuracy but has no streaming — batch only.
- **Moonshine** is fastest on CPU (34-107ms) but no ANE path, 6.65% WER.

## Decision rationale

Start with Parakeet CoreML (fast, proven, full ANE on plain M4). Add Qwen3-ASR via
MLX Swift in P03 when sub-2% accuracy is needed. The CoreML path leaves GPU free for
other tasks; the MLX path can run Qwen3-ASR on GPU when higher accuracy is required.

## Sources

- Soniqo benchmarks: soniqo.audio/benchmarks (M5 Pro, release builds)
- Cohere Transcribe: huggingface.co/CohereLabs/cohere-transcribe-03-2026
- Qwen3-ASR: huggingface.co/Qwen/Qwen3-ASR-1.7B
- mlx-qwen3-asr: github.com/moona3k/mlx-qwen3-asr
- mlx-audio STT models: blaizzy.github.io/mlx-audio/models/stt
- MeetPing Parakeet deep-dive (streaming config, production findings)
- FluidAudio: github.com/FluidInference/FluidAudio
