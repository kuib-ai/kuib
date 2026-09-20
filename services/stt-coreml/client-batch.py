#!/usr/bin/env python3
"""Record audio, send entire file to stt-coreml for batch transcription.

Usage:
  python3 client-batch.py                  # record from mic, Ctrl+C to stop, then transcribe
  python3 client-batch.py recording.raw    # transcribe an existing file
"""

import base64, json, os, socket, struct, subprocess, sys, time

HOST = os.environ.get("STT_HOST", "100.70.111.96")
PORT = int(os.environ.get("STT_PORT", "9009"))
ENGINE = os.environ.get("STT_ENGINE", None)
LANGUAGE = os.environ.get("STT_LANG", None)

def transcribe(host, port, pcm_data):
    audio = base64.b64encode(pcm_data).decode()
    msg = {"action": "transcribe", "audio": audio, "sampleRate": 16000}
    if ENGINE:
        msg["engine"] = ENGINE
    if LANGUAGE:
        msg["language"] = LANGUAGE
    req = json.dumps(msg).encode()
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(60)
    sock.connect((host, port))
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

if len(sys.argv) > 1:
    path = sys.argv[1]
    with open(path, "rb") as f:
        pcm = f.read()
    print(f"File: {path} ({len(pcm)/1024:.0f} KB, {len(pcm)/32000:.1f}s)")
else:
    print("Recording... speak now, Ctrl+C to stop.")
    if sys.platform == "darwin":
        rec = subprocess.Popen(
            ["sox", "-d", "-r", "16000", "-b", "16", "-c", "1", "-e", "signed-integer", "-t", "raw", "-"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
    else:
        rec = subprocess.Popen(
            ["parec", "--format=s16le", "--rate=16000", "--channels=1", "--raw"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
    time.sleep(0.3)
    if rec.poll() is not None:
        print(f"recorder failed: {rec.stderr.read().decode()}")
        sys.exit(1)
    try:
        pcm = b""
        while True:
            chunk = rec.stdout.read(4096)
            if not chunk:
                break
            pcm += chunk
    except KeyboardInterrupt:
        pass
    rec.terminate()
    print(f"Recorded {len(pcm)/1024:.0f} KB ({len(pcm)/32000:.1f}s)")

t0 = time.monotonic()
resp = transcribe(HOST, PORT, pcm)
dt = time.monotonic() - t0

if resp.get("ok"):
    print(f"\n{resp['text']}\n")
    print(f"  confidence: {resp['confidence']:.2f}")
    print(f"  audio:      {resp['durationSeconds']:.1f}s")
    print(f"  inference:  {resp['processingTimeSeconds']*1000:.0f}ms")
    print(f"  round-trip: {dt*1000:.0f}ms")
    rtfx = resp['durationSeconds'] / resp['processingTimeSeconds']
    print(f"  RTFx:       {rtfx:.0f}x")
else:
    print(f"Error: {resp.get('error')}")
