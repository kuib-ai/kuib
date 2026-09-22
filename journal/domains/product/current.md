---
domain: product
summary: "Ana voice assistant: speech-to-text services and their clients."
code: ["services/**"]
---

# Product

Ana is a voice assistant. What exists today is its speech-to-text layer: two inference servers
that speak one wire protocol, a set of Python scripts that exercise them, and a prototype
voice loop that chains transcription, an LLM reply and spoken output.

## Services

`services/` holds two STT servers. `stt-coreml` is a Swift package (macOS 14+, one executable
target `stt-coreml`) built on FluidAudio for Parakeet inference on CoreML and SwiftNIO for its
socket listeners. `stt-mlx` is a Python 3.12 project that serves Qwen3-ASR through
`mlx-qwen3-asr`, managed with `uv`. ^stt-services

> [!sources]- structure · verified 2026-09-23
> - `services/stt-coreml/Package.swift` › ".package(url: "https://github.com/FluidInference/FluidAudio.git", from: "0.9.1")"
> - `services/stt-coreml/Package.swift` › ".product(name: "NIO", package: "swift-nio")"
> - `services/stt-mlx/pyproject.toml` › ""mlx-qwen3-asr>=0.4.0","
> - why: [[domains/product/decisions#^D001]]
> - why: [[domains/product/decisions#^D002]]
> - why: [[domains/product/decisions#^D005]]
> - from: [[features/stt-engine/plan]]

Both services are Nx projects. `stt-coreml` has a cached `build` target (`swift build -c
release`, inputs `Sources/**/*.swift` and `Package.swift`) and a `run` target (`swift run
stt-coreml`). `stt-mlx` has only a `run` target (`uv run python server.py`). ^services-nx-targets

> [!sources]- structure · verified 2026-09-23
> - `services/stt-coreml/project.json` › ""command": "swift build -c release","
> - `services/stt-coreml/project.json` › ""command": "swift run stt-coreml","
> - `services/stt-mlx/project.json` › ""command": "uv run python server.py","

## Wire protocol

Every message in both directions is a 4-byte big-endian length followed by a UTF-8 JSON body.
`stt-coreml` implements the framing as a SwiftNIO decoder/encoder pair on every connection;
`stt-mlx` reads and writes the same frames with `struct` so the same clients work against
either server by changing only host and port. ^wire-framing

> [!sources]- behaviour · verified 2026-09-23
> - `services/stt-coreml/Sources/SttCoreML/Server.swift` › "// MARK: - Length-prefix framing (4-byte big-endian)"
> - `services/stt-coreml/Sources/SttCoreML/Server.swift` › "ByteToMessageHandler(LengthPrefixDecoder()),"
> - `services/stt-mlx/server.py` › "length = struct.unpack(">I", hdr)[0]"
> - `services/stt-mlx/server.py` › "Speaks length-prefixed JSON over TCP so the existing client-batch.py and"
> - why: [[domains/product/decisions#^D004]]
> - why: [[domains/product/decisions#^D007]]

A request carries `action` (`transcribe`, `ping`, `streamStart`, `streamAudio`, `streamEnd`)
plus optional `audio` (base64 of 16-bit little-endian mono PCM), `sampleRate` (default 16000),
`engine` and `chunkSeconds`; `stt-mlx` additionally reads `language`. A response carries `ok`,
`type` and, depending on type, `text`, `confirmed`, `confidence`, `durationSeconds`,
`processingTimeSeconds`, `engine` or `error`. Types are `result` (batch transcript), `started`,
`partial`, `confirmed`, `final` (stream events), `pong` and `error` (`ok: false`). ^wire-requests

> [!sources]- behaviour · verified 2026-09-23
> - `services/stt-coreml/Sources/SttCoreML/Protocol.swift` › "struct SttRequest: Codable, Sendable {"
> - `services/stt-coreml/Sources/SttCoreML/Protocol.swift` › "ok: true, type: confirmed ? "confirmed" : "partial","
> - `services/stt-coreml/Sources/SttCoreML/Protocol.swift` › "ok: false, type: "error","
> - `services/stt-mlx/server.py` › "language = req.get("language")"

Streaming is per connection: `streamStart` answers `started`, each `streamAudio` frame is fed
without a reply, transcript updates arrive asynchronously as `partial`/`confirmed`, and
`streamEnd` produces one `final` with the full text. Sending `streamAudio` or `streamEnd`
without an active stream returns an error. ^wire-streaming

> [!sources]- behaviour · verified 2026-09-23
> - `services/stt-coreml/Sources/SttCoreML/Server.swift` › "writeResponse(.error("No active stream. Send streamStart first."), context: context)"
> - `services/stt-coreml/Sources/SttCoreML/Protocol.swift` › "static func streamEnd(text: String) -> SttResponse {"
> - `services/stt-mlx/server.py` › "async def handle_stream(reader, writer, req):"
> - why: [[domains/product/decisions#^D008]]

## stt-coreml

On start the server downloads (first run) and loads the Parakeet models through
`AsrModels.downloadAndLoad()`, loads the Parakeet EOU model, then listens on the unix socket
`~/.kuib/stt.sock` and on TCP `100.70.111.96:9009` (the Tailscale address of minerva, hard-coded
in `Main.swift`). A stale socket file is removed before binding; SIGINT/SIGTERM close both
listeners, shut the event loop group down and remove the socket. Logs go to stdout prefixed
`[stt-coreml]`. ^coreml-startup

> [!sources]- behaviour · verified 2026-09-23
> - `services/stt-coreml/Sources/SttCoreML/Main.swift` › "let models = try await AsrModels.downloadAndLoad()"
> - `services/stt-coreml/Sources/SttCoreML/Main.swift` › "tcpHost: "100.70.111.96","
> - `services/stt-coreml/Sources/SttCoreML/Server.swift` › "let unixChannel = try await unixBootstrap.bind(unixDomainSocketPath: socketPath).get()"
> - `services/stt-coreml/Sources/SttCoreML/Server.swift` › "let sigterm = DispatchSource.makeSignalSource(signal: SIGTERM, queue: .main)"
> - why: [[domains/product/decisions#^D004]]
> - why: [[domains/product/decisions#^D009]]

Batch transcription goes through the `SttBackend` protocol (`engineName`, `loadModel()`,
`transcribe(audio:sampleRate:)` returning text, confidence, audio duration, processing time and
engine). Two backends are registered and selected by the request's `engine` field; the first,
`parakeet`, is the default. An unknown engine returns an error listing the available ones. ^coreml-batch-backend

> [!sources]- behaviour · verified 2026-09-23
> - `services/stt-coreml/Sources/SttCoreML/SttBackend.swift` · #4275f924
> - `services/stt-coreml/Sources/SttCoreML/Server.swift` › "self.defaultEngine = backends.first!.engineName"
> - `services/stt-coreml/Sources/SttCoreML/Main.swift` › "backends: [parakeet, eou],"
> - why: [[domains/product/decisions#^D006]]

| Engine | Backend | Model / manager | Notes |
|---|---|---|---|
| `parakeet` | `ParakeetBackend` | FluidAudio `AsrManager` with a TDT decoder state | Converts Int16 PCM to Float; reuses one decoder state across requests; returns the model's confidence |
| `parakeet-eou` | `EouBackend` | `StreamingModelVariant.parakeetEou320ms` via its streaming manager | Resets the manager, feeds the whole buffer, calls `finish()`; confidence is always `0.0` |

 ^coreml-engines

> [!sources]- behaviour · verified 2026-09-23
> - `services/stt-coreml/Sources/SttCoreML/ParakeetBackend.swift` › "let result = try await manager.transcribe(floats, decoderState: &state)"
> - `services/stt-coreml/Sources/SttCoreML/ParakeetBackend.swift` › "enum SttEngineError: Error, LocalizedError {"
> - `services/stt-coreml/Sources/SttCoreML/EouBackend.swift` › "init(variant: StreamingModelVariant = .parakeetEou320ms) {"
> - why: [[domains/product/decisions#^D003]]
> - why: [[domains/product/decisions#^D005]]

`streamStart` opens one of two session kinds. By default a `StreamingSession` wraps FluidAudio's
`SlidingWindowAsrManager` over the already-loaded Parakeet models: `chunkSeconds` (default 3.0,
capped at 11) with 1.0 s hypothesis chunks, 2.0 s left and right context, 5.0 s minimum context
before confirmation and a 0.80 confirmation threshold; its updates become `partial` or
`confirmed` with confidence. With `engine: "parakeet-eou"` an `EouStreamingSession` instead
creates and loads a fresh `parakeetEou320ms` manager for the stream and emits only `partial`
updates from its partial-transcript callback. Both kinds treat incoming audio as 16 kHz, tag
stream events with engine `parakeet-stream`, and are cancelled when the connection closes. No
VAD runs server-side: the stream ends only when the client sends `streamEnd`. ^coreml-stream-sessions

> [!sources]- behaviour · verified 2026-09-23
> - `services/stt-coreml/Sources/SttCoreML/StreamingSession.swift` › "chunkSeconds: min(chunkSeconds, 11.0),"
> - `services/stt-coreml/Sources/SttCoreML/StreamingSession.swift` › "confirmationThreshold: 0.80"
> - `services/stt-coreml/Sources/SttCoreML/EouStreamingSession.swift` › "await manager.setPartialTranscriptCallback { text in"
> - `services/stt-coreml/Sources/SttCoreML/Server.swift` › "let useEou = request.engine == "parakeet-eou""
> - `services/stt-coreml/Sources/SttCoreML/Server.swift` › "func channelInactive(context: ChannelHandlerContext) {"
> - `services/stt-coreml/Sources/SttCoreML/Protocol.swift` › "engine: "parakeet-stream", error: nil"
> - why: [[domains/product/decisions#^D008]]
> - from: [[features/stt-engine/plan]]

## stt-mlx

`server.py` loads a Qwen3-ASR `Session` (model from `STT_MLX_MODEL`, default
`Qwen/Qwen3-ASR-0.6B`) and listens on TCP `STT_MLX_HOST:STT_MLX_PORT` (default `0.0.0.0:9010`).
All inference runs on a single-worker thread pool. Batch `transcribe` returns a `result` with
engine `qwen3-asr-mlx` and a fixed confidence of `1.0`, passing the optional `language` through
to the model. ^mlx-server

> [!sources]- behaviour · verified 2026-09-23
> - `services/stt-mlx/server.py` › "MODEL_ID = os.environ.get("STT_MLX_MODEL", "Qwen/Qwen3-ASR-0.6B")"
> - `services/stt-mlx/server.py` › "PORT = int(os.environ.get("STT_MLX_PORT", "9010"))"
> - `services/stt-mlx/server.py` › "executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="mlx-asr")"
> - `services/stt-mlx/server.py` › ""confidence": 1.0,"
> - why: [[domains/product/decisions#^D007]]

After `streamStart`, `stt-mlx` sends `started`, initialises MLX streaming state
(`chunkSeconds`, default 2.0) and takes over the connection's read loop: each `streamAudio`
chunk is fed to the model and a `partial` is sent only when the text changed; `streamEnd`
finishes the state, sends `final` and returns to the request loop; `ping` is answered mid-stream
and any other action ends the stream with an error. It never emits `confirmed`. ^mlx-streaming

> [!sources]- behaviour · verified 2026-09-23
> - `services/stt-mlx/server.py` › "lambda: session.init_streaming(chunk_size_sec=req.get("chunkSeconds", 2.0)),"
> - `services/stt-mlx/server.py` › "if state.text != prev_text:"
> - `services/stt-mlx/server.py` › ""error": f"unexpected action during stream: {action}","

## Client and test scripts

`services/stt-coreml/` carries standalone Python 3 scripts (stdlib only unless noted) that
drive the protocol. Microphone capture shells out to `sox` on macOS or `parec` on Linux, always
as 16 kHz mono s16le.

| Script | Transport | Does |
|---|---|---|
| `test-transcribe.py` | unix socket | `ping`, or batch-transcribe a raw PCM file and print confidence, durations and RTFx |
| `watch-and-transcribe.py` | unix socket | Polls `/tmp/stt-input.raw` every 0.5 s and batch-transcribes it whenever its mtime changes |
| `stream-and-transcribe.py` | unix socket | Streams a raw PCM file in real time (or live `parec` with `--parec`) in 100 ms frames and prints partial/confirmed/final |
| `bridge.py` | TCP listener → unix socket | Accepts raw PCM over TCP (default `100.70.111.96:9009`), cuts 1 s chunks and batch-transcribes each through the socket; drops chunks when its 8-deep queue is full |
| `record-and-send.py` | TCP | Pings with 1 s of silence, then batch-transcribes live `parec` audio in 1 s chunks |
| `stream-live.py` | TCP | Streams live `parec` audio in 100 ms frames with `chunkSeconds: 1.5` |
| `client-batch.py` | TCP (`STT_HOST`/`STT_PORT`) | Records until Ctrl+C or reads a file, sends one `transcribe` (optional `STT_ENGINE`, `STT_LANG`), prints timing and RTFx |
| `client-stream.py` | TCP (`STT_HOST`/`STT_PORT`) | Streams mic or a file in 100 ms frames with `chunkSeconds: 3.0` (optional `STT_ENGINE`) |
| `mimo-call.py` | HTTPS | `uv` script (`openai`): sends argv/stdin text to the MiMo chat API (`MIMO_MODEL`, default `mimo-v2.5-pro`) and streams the reply |

 ^client-scripts

> [!sources]- structure · verified 2026-09-23
> - `services/stt-coreml/test-transcribe.py` › """"Test client for stt-coreml unix socket server.""""
> - `services/stt-coreml/watch-and-transcribe.py` › "WATCH_FILE = "/tmp/stt-input.raw""
> - `services/stt-coreml/stream-and-transcribe.py` › "CHUNK_BYTES = SAMPLE_RATE * 2 // 10  # 100ms chunks for smooth streaming"
> - `services/stt-coreml/bridge.py` › """"TCP bridge: streams PCM from network, sends 1s chunks to stt.sock.""""
> - `services/stt-coreml/record-and-send.py` › "resp = transcribe(HOST, PORT, b"\x00" * 32000)"
> - `services/stt-coreml/stream-live.py` › "conn.send({"action": "streamStart", "chunkSeconds": 1.5})"
> - `services/stt-coreml/client-batch.py` › "LANGUAGE = os.environ.get("STT_LANG", None)"
> - `services/stt-coreml/client-stream.py` › "CHUNK_SECONDS = 3.0"
> - `services/stt-coreml/mimo-call.py` › "MODEL = os.environ.get("MIMO_MODEL", "mimo-v2.5-pro")"

## Voice assistant prototype

`voice-assistant.py` is the one place the Ana persona runs end to end. It records until Ctrl+C
(skipping clips under 0.5 s), batch-transcribes over TCP against stt-coreml on port 9009 or,
with `--mlx`, stt-mlx on 9010, then streams a reply from an OpenAI-compatible LLM (default Groq,
`openai/gpt-oss-20b`) under a short "You are Ana" system prompt with the last 10 turns of
history. Unless `--no-tts` is given or no `TTS_API_KEY` is set, the reply is spoken through
MiMo TTS (`mimo-v2.5-tts`, voice `Milo`) and played with `afplay`/`paplay`. Keys and endpoints
come from the environment, pre-seeded from `/tmp/llm.env`; `--loop` repeats the cycle. ^voice-assistant

> [!sources]- behaviour · verified 2026-09-23
> - `services/stt-coreml/voice-assistant.py` › "SYSTEM_PROMPT = f"""You are Ana, a helpful voice assistant."
> - `services/stt-coreml/voice-assistant.py` › "STT_PORT = int(os.environ.get("STT_PORT", "9010" if _use_mlx else "9009"))"
> - `services/stt-coreml/voice-assistant.py` › "LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "https://api.groq.com/openai/v1")"
> - `services/stt-coreml/voice-assistant.py` › ""model": "mimo-v2.5-tts","
> - `services/stt-coreml/voice-assistant.py` › "env_file = Path("/tmp/llm.env")"
> - why: [[domains/product/decisions#^D010]]
> - from: [[_archive/ana/decisions#Voice I/O Architecture]]
