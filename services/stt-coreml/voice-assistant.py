#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["openai", "requests"]
# ///
"""Voice assistant: record → transcribe on minerva → respond via Groq → speak via MiMo TTS.

Usage:
  uv run voice-assistant.py              # speak, Ctrl+C, get response
  uv run voice-assistant.py --loop       # continuous loop
  uv run voice-assistant.py --mlx        # use Qwen3-ASR (MLX) on port 9010
  uv run voice-assistant.py --no-tts     # text only, no speech output
"""

import base64, json, os, socket, struct, subprocess, sys, tempfile, time
from pathlib import Path

env_file = Path("/tmp/llm.env")
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip()

_use_mlx = "--mlx" in sys.argv
STT_HOST = os.environ.get("STT_HOST", "100.70.111.96")
STT_PORT = int(os.environ.get("STT_PORT", "9010" if _use_mlx else "9009"))
STT_ENGINE_LABEL = "Qwen3-ASR (MLX)" if _use_mlx else "Parakeet (CoreML)"
LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
LLM_MODEL = os.environ.get("LLM_MODEL", "openai/gpt-oss-20b")
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "https://api.groq.com/openai/v1")
TTS_API_KEY = os.environ.get("TTS_API_KEY", "")
TTS_BASE_URL = os.environ.get("TTS_BASE_URL", "https://token-plan-sgp.xiaomimimo.com/v1")
TTS_VOICE = os.environ.get("TTS_VOICE", "Milo")
ENABLE_TTS = "--no-tts" not in sys.argv and bool(TTS_API_KEY)

from datetime import datetime
_now = datetime.now()
SYSTEM_PROMPT = f"""You are Ana, a helpful voice assistant.
Today's date: {_now.strftime('%A, %B %d, %Y')}. Your knowledge cutoff date is December 2024.
You receive transcribed speech from the user. Respond naturally and concisely as if in a conversation. Keep responses short — 1-3 sentences unless the user asks for detail.
If the transcription seems garbled, ask the user to repeat."""

def transcribe(pcm_data):
    audio = base64.b64encode(pcm_data).decode()
    req = json.dumps({"action": "transcribe", "audio": audio, "sampleRate": 16000}).encode()
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(60)
    sock.connect((STT_HOST, STT_PORT))
    sock.sendall(struct.pack(">I", len(req)) + req)
    hdr = b""
    while len(hdr) < 4:
        hdr += sock.recv(4 - len(hdr))
    length = struct.unpack(">I", hdr)[0]
    data = b""
    while len(data) < length:
        data += sock.recv(length - len(data))
    sock.close()
    return json.loads(data)

def record():
    if sys.platform == "darwin":
        cmd = ["sox", "-d", "-r", "16000", "-b", "16", "-c", "1", "-e", "signed-integer", "-t", "raw", "-"]
    else:
        cmd = ["parec", "--format=s16le", "--rate=16000", "--channels=1", "--raw"]

    rec = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    time.sleep(0.3)
    if rec.poll() is not None:
        print("Recorder failed to start")
        sys.exit(1)

    print("\n🎤 Listening... (Ctrl+C to send)\n", flush=True)
    pcm = b""
    try:
        while True:
            chunk = rec.stdout.read(4096)
            if not chunk:
                break
            pcm += chunk
    except KeyboardInterrupt:
        pass
    rec.terminate()
    return pcm

def respond(text, history):
    from openai import OpenAI

    if not LLM_API_KEY:
        print("\nSet LLM_API_KEY in /tmp/llm.env")
        sys.exit(1)

    client = OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)
    history.append({"role": "user", "content": text})

    completion = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + history[-10:],
        max_completion_tokens=256,
        temperature=0.7,
        stream=True,
    )

    print("\n💬 ", end="", flush=True)
    reply = ""
    for chunk in completion:
        if chunk.choices and chunk.choices[0].delta.content:
            c = chunk.choices[0].delta.content
            print(c, end="", flush=True)
            reply += c
    print("\n")

    history.append({"role": "assistant", "content": reply})
    return reply, history

def speak(text):
    import requests

    t0 = time.monotonic()
    resp = requests.post(
        f"{TTS_BASE_URL}/chat/completions",
        headers={"api-key": TTS_API_KEY, "Content-Type": "application/json"},
        json={
            "model": "mimo-v2.5-tts",
            "messages": [{"role": "assistant", "content": text}],
            "audio": {"format": "wav", "voice": TTS_VOICE},
        },
        timeout=30,
    )
    dt = time.monotonic() - t0

    if resp.status_code != 200:
        print(f"  [TTS error {resp.status_code}: {resp.text[:100]}]", flush=True)
        return

    data = resp.json()
    audio_b64 = data["choices"][0]["message"]["audio"]["data"]
    audio_bytes = base64.b64decode(audio_b64)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_bytes)
        wav_path = f.name

    print(f"  🔊 Playing ({dt*1000:.0f}ms TTS)...", flush=True)
    if sys.platform == "darwin":
        subprocess.run(["afplay", wav_path], check=False)
    else:
        subprocess.run(["paplay", wav_path], check=False)

    os.unlink(wav_path)

loop = "--loop" in sys.argv
history = []

print("=" * 50)
print("  Voice Assistant")
print(f"  STT:  {STT_HOST}:{STT_PORT} ({STT_ENGINE_LABEL})")
print(f"  LLM:  {LLM_MODEL} @ {LLM_BASE_URL.split('//')[1].split('/')[0]}")
print(f"  TTS:  {'MiMo TTS (' + TTS_VOICE + ')' if ENABLE_TTS else 'disabled (set TTS_API_KEY)'}")
print("=" * 50)

while True:
    pcm = record()
    duration = len(pcm) / 32000
    if duration < 0.5:
        print("Too short, skipping.")
        if not loop:
            break
        continue

    print(f"Transcribing {duration:.1f}s...", flush=True)
    t0 = time.monotonic()
    resp = transcribe(pcm)
    dt = time.monotonic() - t0

    if not resp.get("ok") or not resp.get("text", "").strip():
        print(f"STT error: {resp.get('error', 'empty transcript')}")
        if not loop:
            break
        continue

    text = resp["text"]
    print(f"\n📝 \"{text}\"  ({dt*1000:.0f}ms)", flush=True)

    reply, history = respond(text, history)

    if ENABLE_TTS and reply.strip():
        speak(reply)

    if not loop:
        break
