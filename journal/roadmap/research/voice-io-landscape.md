# Voice I/O Landscape Research

Research date: 2026-09-16

## STT (Speech-to-Text) Options

### Parakeet TDT v3 (chosen)

- **Source**: NVIDIA NeMo, Apache-2.0
- **Size**: 600M params
- **Runtime**: CoreML via FluidAudio on Apple Silicon
- **Latency**: ~100-200ms for short utterances on M3/M4
- **Languages**: 25 European languages (v3), English-only (v2)
- **Streaming**: Architecture supports it (transformer-transducer), but Hex SDK currently batch-only
- **Integration**: Hex app (`anomalyco/hex`, Rust rewrite) exposes TypeScript SDK (`@kitlangton/hex@0.3.0`)
- **Ranking**: #1 on HuggingFace ASR Leaderboard (throughput)

#### Hex SDK Integration Modes

1. **Embedded service** — spawn `hex service --embedded` as child process. App owns recording, Hex owns model + inference.
   ```ts
   const transcriber = await Hex.create({
     command: ["/path/to/hex-service", "service", "--embedded"],
     model: "parakeet_unified_en",
     language: "en",
   })
   const result = await transcriber.transcribe(wavBuffer)
   ```

2. **Desktop connect** — reuse running Hex app's mic and engine via loopback.
   ```ts
   const hex = await connect()
   const recording = await hex.dictation.start({ source: "my-app" })
   const { transcript } = await recording.finish()
   ```

Both modes are **local** — no built-in remote inference path. For phone→minerva, we add a network transport layer on top of the embedded service.

### MiMo ASR (`mimo-v2.5-asr`)

- **Type**: Cloud API (Singapore region)
- **Endpoint**: `https://token-plan-sgp.xiaomimimo.com/v1`
- **Latency**: 80-150ms RTT from Bengaluru + inference time
- **Role**: Fallback when local Parakeet unavailable

### Whisper (via WhisperKit)

- **Runtime**: CoreML on Apple Silicon
- **Latency**: Comparable to Parakeet, slightly slower on benchmarks
- **Available in Hex**: Yes (Whisper Small, Medium, Large v3)
- **Role**: Alternative local model, not primary

## TTS (Text-to-Speech) Options

### MiMo TTS (chosen primary)

- **Models**: `mimo-v2.5-tts`, `mimo-v2.5-tts-voicedesign`, `mimo-v2.5-tts-voiceclone`
- **Endpoint**: `https://token-plan-sgp.xiaomimimo.com/v1/chat/completions`
- **Format**: Chat completions API. Text in `assistant` role. Returns base64 WAV (24kHz mono) in `choices[0].message.audio.data`.
- **Control**: No SSML. Two mechanisms:
  1. NL style instructions via `user` message: `"Speak slowly, warmly, with a slight whisper"`
  2. Inline tags in text: `[pause]`, `[crying]`, `[sternly]`, `[commanding]`, `[trembling]`, `[sniffles]`, `[heavy breathing]`
- **Pronunciation**: Phonetic spelling or NL instruction in user message. No IPA/phoneme override.
- **Voice design**: Create voice from text description (no reference audio needed)
- **Voice cloning**: Clone from short audio sample
- **Quality**: High
- **Latency**: Network RTT to Singapore + inference

### Kokoro (chosen local fallback)

- **Size**: 82M params
- **License**: Apache-2.0
- **Runtime**: CPU-only, runs great on M3/M4 Mac
- **Latency**: ~50ms on CPU
- **Quality**: Good, but no prosody/emotion control
- **Voice clone**: Limited clone-tuning
- **Server**: `kokoro-fastapi` project wraps it as HTTP API
- **Role**: Quick acknowledgments where network latency is unacceptable

### Other Models Evaluated

| Model | Size | Latency | Emotion | Mac M3 Pro | Notes |
|---|---|---|---|---|---|
| Chatterbox Turbo | 350M | Ultra-low | `[laugh]`, `[cough]` tags | MPS maybe (4GB VRAM) | MIT, good quality |
| Chatterbox Multilingual | 500M | Low | Emotion exaggeration param | Needs GPU | |
| Qwen3-TTS | 0.6-1.7B | ~97ms streaming | NL instructions like MiMo | Tight at 18GB | Very good quality |
| Fish Speech S2 Pro | 4B | Medium | Inline emotion tags | Too large | Complex license |
| CosyVoice 3.0 | 500M | Low, streaming | Emotion cloning from ref | Needs GPU | Apache-2.0 |
| Piper | ~20M | Near-instant | None | Runs on anything | MIT, robotic quality |

### Decision Rationale

MiMo for anything that needs expression (responses, notifications, reading content). Kokoro for instant low-latency acknowledgments ("got it", "done", "working on it"). The two complement each other — MiMo for quality, Kokoro for speed.

## Streaming vs Batch

The biggest latency factor is **batch mode** — waiting for the user to finish speaking before inference starts. Streaming STT processes audio chunks as they arrive, running inference in parallel with speech.

- Parakeet TDT is architecturally designed for streaming (transformer-transducer)
- Hex SDK currently only exposes batch (`transcriber.transcribe(wav)` takes complete buffer)
- Streaming would shave hundreds of milliseconds off perceived latency
- This matters more than where inference runs (local vs LAN)

**Open**: whether to use Hex's batch mode and accept the latency, or go direct to FluidAudio/NeMo for streaming.
