---
title: Multilingual STT routing, confidence switching, and Cohere Transcribe adaptation
date: 2026-10-19
origin: ["conversation 2026-10-18 to 2026-10-19"]
---

# Multilingual STT routing, confidence switching, and Cohere Transcribe adaptation

Captures the empirical STT findings and architectural blueprint reasoned on 2026-10-18 and
2026-10-19 for extending [[features/stt-engine/plan|stt-engine]] (`minerva`) to handle
code-switched English, Roman Hinglish, Roman Benglish, developer terminology, and multi-model
confidence routing. Each statement is marked by standing: **ruled** (the owner's explicit
direction), **agreed** (accepted in discussion), or **proposed**.

## 1. Empirical findings from live dictation tests (2026-10-18 to 2026-10-19)

Three local ASR families were evaluated via live push-to-talk dictation on macOS (`Hex`):

| Model | Params | Architecture | Observed behaviour on English + Indic code-switching |
|---|---|---|---|
| `Qwen/Qwen3-ASR-0.6B` | 0.6B | Audio-adapter LLM | High latency on Hindi; phonetic and cross-script hallucinations on technical and Hinglish speech (e.g., `"minerva"` -> `"minerware"`, `"code"` -> Korean Hangul tokens, `"unnecessary"` and `"Whisper"` -> phonetic Devanagari words). |
| `openai/whisper-large-v3-turbo` | 809M | 32L Transformer encoder (30s padded, 50 Hz) + 4L decoder | Passing `<\|hi\|>` locks the decoder into Devanagari and forces English technical words into phonetic Hindi substitutions (e.g., `"Whisper turbo"` -> phonetic Devanagari words). |
| `CohereLabs/cohere-transcribe-03-2026` | ~2B | FastConformer encoder (`8x` subsampling, 12.5 Hz / 80 ms frames, dynamic length) + Transformer decoder | Extremely fast on English with accurate prosody-aware punctuation and capitalization (`PnC`). Recognizes modern vocabulary (`"claude"`). Lacks Hindi/Bengali training in the decoder (`"Cetus toh sahi aa raha hai bhai"` -> `"setestu sai araiwai"`, `"baad mein milte hain"` -> `"bad name is there"`). |

### Key diagnostic insight (agreed)

When speaking Roman Hinglish into `Cohere Transcribe` (`"Cetus toh sahi aa raha hai bhai"` ->
`"setestu sai araiwai"`):

- `setestu` maps phonetically to *Cetus toh*
- `sai` maps phonetically to *sahi*
- `araiwai` maps phonetically to *aa raha hai bhai*

The FastConformer acoustic encoder captures every syllable boundary and phoneme without dropping
frames, but two specific gaps occur at the upper encoder and decoder stages:

1. **Missing Indian voiced aspirates and prosody in top encoder layers:** None of the 14
   pre-trained languages in `Cohere Transcribe` include Indian voiced aspirated stops (`bh`,
   `dh`, `gh`, `jh`), causing `/bʱaːi/` (`"bhai"`) to project near `/waɪ/` (`"wai"`). Similarly,
   non-rhotic Indian English `"port eight thousand"` (`/poːt eɪt/`) merges across the syllable
   boundary into `"forty thousand"`, and `"port eighty-eighty"` maps to the homophones
   `"Port a.t.e.t."` or `"What a deity!"`.
2. **Missing Roman Hinglish / Benglish / developer lexical priors in the decoder:** Because the
   decoder language model has zero weight on Romanized Hindi (`toh`, `sahi`, `aa raha hai`,
   `bhai`, `meye`) or Kolkata Bengali (`korbo`, `achhe`, `bhalo`) and Homelab proper nouns
   (`minerva`, `cetus`, `eos`, `cornelius`, `kuib`, `tsgo`), cross-attention snaps those valid
   phonetic embeddings to the closest English lookalikes.

## 2. Track A — Multi-model resident pool and segment-level confidence routing (ruled)

Owner direction (2026-10-19):
- "in my minerva machine, i can most likely keep four or five models loaded in the ram properly,
  and in terms of processing, also, i think only one will run at any time. so, it should
  accommodate itself and basically should be able to switch very seamlessly. keeping the real
  time factor."
- "since we will do some intelligent batching, some proper chunking of audio, the switching can
  be segmented among the sections where i am speaking that particular language"
- "the single model that we are making will likely be able to handle all three languages. but it
  should still be able to handle some specific configuration and maybe some model score is low
  or high. or maybe let's say if i want the script in devanagari. i can have another model ready
  there for that."

### 2.1 Resident model pool on `minerva` (16 GB unified memory)

`minerva` keeps 3 to 5 specialized models warm in unified memory simultaneously (`~4–7 GB`
combined across CoreML/ANE and MLX/GPU):

1. **Primary fast model:** `Cohere Transcribe 2B` (or fine-tuned multilingual Roman variant).
2. **Streaming / low-overhead transducer:** `Parakeet TDT v3` on CoreML/ANE (`0.9 GB`).
3. **Roman Hinglish / Benglish fallback specialist:** `Oriserve/Whisper-Hindi2Hinglish-Swift` or
   dedicated Indic LoRA adapter.
4. **Native-script specialist (on demand / configuration):** Devanagari / Bengali script model when
   native script output is explicitly requested instead of Roman script.

Because only one active segment executes a forward pass at any given moment (and ANE + GPU are
independent execution units), keeping multiple models resident eliminates cold-load latency
(`0 ms` weight-switch overhead).

### 2.2 Segment-level confidence routing

Utterances frequently code-switch mid-thought (for example, starting a clause in English and
finishing in Hindi or Bengali). Rather than routing an entire 15-second utterance to a single
model after key release:

1. **VAD micro-segmentation while push-to-talk is held:** Incoming 16 kHz PCM is sliced at
   natural pause boundaries (`2–4 s` segments) as the user speaks.
2. **Encoder-decoder entropy mismatch detection:** Each completed segment is decoded by the
   primary model first. When the acoustic encoder is confident (clean speech energy) but the
   decoder exhibits high token entropy / low log-probability (such as emitting low-confidence
   phonetic approximations like `"setestu"` or `"araiwai"`), the router flags the segment.
3. **Automatic parallel fallback:** Any segment falling below the confidence threshold is
   immediately re-evaluated against the secondary resident model (or language-specific adapter)
   on `minerva` while the user is still speaking the next segment.
4. **Explicit configuration override:** Requests carry optional script/language preferences
   (e.g., `script: "roman" | "devanagari"`, `engine`, or domain vocabulary hints) so callers or
   hotkeys can pin a specific model or output script when desired.

### 2.3 Rolling bidirectional context reconciliation without end-of-utterance latency

To ensure segment boundaries read coherently without adding latency after the user releases the
push-to-talk key:

- While the user is speaking **Segment $k+1$**, **Segment $k-1$** and **Segment $k$** are already
  decoded on `minerva`.
- A lightweight rolling reconciliation pass checks `[Segment k-1, Segment k]` (and once
  Segment $k+1$ arrives, acts as `[previous, current, subsequent]` around Segment $k$) in the
  background *during* speech capture.
- When the user releases the key after the final **Segment $N$**, only the last boundary
  (`Segment N-1 <-> Segment N`) remains to be reconciled (`~5–10 ms`), keeping perceived
  end-of-utterance paste latency under `80 ms`.

### 2.4 Client buffer retention for instant retry / model switch

If an utterance was transcribed with the wrong model or script configuration, the client and
`minerva` retain the most recent utterance buffer in memory. A single retry shortcut can issue
an undo (`Cmd+Z`), re-run the buffered audio against an alternate resident model, and paste the
replacement text without requiring the user to repeat the utterance.

## 3. Track B — Surgical adaptation of `Cohere Transcribe 2B` (agreed)

To make a single base model handle English, Roman Hinglish, Roman Benglish, and developer
terminology at `Cohere Transcribe` speed:

### 3.1 Three-zone parameter strategy

| Zone | Layers | Strategy | Rationale |
|---|---|---|---|
| **Zone 1: Lower/Mid Encoder** | Conv `8x` stem + bottom ~75% of Conformer layers | **Frozen (0 trainable params)** | Preserves universal acoustic features, mic/noise robustness, and pause/pitch prosody used for punctuation. Prevents catastrophic forgetting on smaller datasets. |
| **Zone 2: Upper Encoder** | Top ~25% (last 4–6 Conformer layers) + adapter projection | **Light LoRA (`r=16`, low LR)** | Allows upper syllable-grouping layers to preserve Indian voiced aspirates (`bh`, `dh`, `gh`, `jh`), retroflex/dental contrasts, and Bengali rounded vowels (`o`/`a`) as distinct embeddings instead of collapsing `"bhai"` into `"wai"`, and adapts to non-rhotic Indian English syllable boundaries (`"port 8000"`). |
| **Zone 3: Transformer Decoder** | Self-attention, cross-attention, and LM head | **Heavy LoRA (`r=32–64`)** | Teaches the decoder Roman Hinglish, Kolkata Roman Benglish, and technical vocabulary (`minerva`, `cetus`, `eos`, `cornelius`, `kuib`, `tsgo`, `claude`) while preserving prosody-driven comma and period placement. |

### 3.2 Punctuation, numbers, and Inverse Text Normalization (ITN)

1. **Pause vs syntax punctuation tuning:** Keep `Cohere Transcribe`'s native comma and period
   placement, but train on conversational dictation samples where short mid-clause thinking
   pauses after conjunctions/prepositions (`for`, `but`, `ki`, `matlab`, `kyunki`) do not emit
   premature periods.
2. **Developer number and unit formatting (ITN):** `Cohere Transcribe`'s raw decoder emits
   numbers as words (`"forty thousand"`, `"five gb"`). Add a deterministic `<1 ms` Inverse Text
   Normalization (ITN) pass and decoder logit bias so developer shorthand (`"port eighty-eighty"`
   -> `port 8080`, `"port eight thousand"` -> `port 8000`, `"sixteen gb"` -> `16GB`, `"one, two,
   three"` -> `1, 2, 3`) outputs numeric digits reliably.
3. **Vocabulary pruning (for Roman-locked profiles):** For strictly Roman-script adapters,
   non-Latin script token rows can be masked or sliced out of the decoder output projection so
   non-Latin hallucinations are impossible.

## 4. Track C — Recursive improvement flywheel and cluster serving lab (agreed)

### 4.1 Automated failure discovery and data flywheel

Modeled on frontier recursive improvement loops:

1. **Implicit friction capture:** Log utterances on `minerva` into the hot storage tier (`1 TB
   SSD`), recording `(raw_pcm_wav, model_transcript, per_token_logprobs, immediate_retry_or_edit)`.
2. **Entropy + teacher consensus labeling:** Flag clips with **low acoustic uncertainty + high
   decoder entropy** or immediate user edits. Run an offline teacher pass (Claude / Gemini Argon
   with full session context) to generate corrected ground-truth Roman Hinglish/Benglish labels.
3. **Two-tier storage layout (once physical topology is wired in Bengaluru):**
   - **Tier 1 (`1 TB SSD`):** Hot working tier for resident models, active Mel/Arrow training
     caches, and the live dictation flywheel inbox.
   - **Tier 2 (`5 TB HDD`, `ext4 -m 0 -T largefile`, `noatime`):** Cold model and dataset vault
     storing base checkpoints and public corpora (`IndicVoices`, `Kathbath`) strictly as
     Parquet or WebDataset `.tar` shards (never loose `.wav` files).

### 4.2 High-concurrency serving experiments (Kubernetes + `vLLM`)

Once the adapted model is validated locally for daily dictation and `Ana`/`Kuib` voice input
(allowing `Ana` to drive any text LLM via `submit(prompt)` without depending on Gemini Live),
use the home cluster (`minerva`, `eos`, `cetus`, `cornelius`) to test multi-user STT serving
dynamics for external users in the owner's circle:

- **Two-stage scheduling:** Dynamic ragged batching for the compute-bound FastConformer encoder
  paired with continuous batching and PagedAttention for the memory-bandwidth-bound Transformer
  decoder and cross-attention KV cache (`vLLM` natively supports `Cohere Transcribe`).
- **Tail-latency protection:** Audio chunked prefill and shortest-job-first scheduling so long
  monologues do not block short 2-second commands (preventing P99 head-of-line blocking).
- **Multi-LoRA serving:** Single base `Cohere Transcribe 2B` weight residency serving multiple
  per-user regional/slang LoRA adapters concurrently.
