#!/usr/bin/env python3
"""Record from mic, stream 1s chunks to stt-coreml over TCP, print transcripts."""

import base64, json, queue, socket, struct, subprocess, sys, threading, time

HOST = sys.argv[1] if len(sys.argv) > 1 else "100.70.111.96"
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 9009
SAMPLE_RATE = 16000
CHUNK_BYTES = SAMPLE_RATE * 2  # 1 second

def log(msg):
    print(f"[stt {time.strftime('%H:%M:%S')}] {msg}", flush=True)

def transcribe(host, port, pcm):
    audio = base64.b64encode(pcm).decode()
    req = json.dumps({"action": "transcribe", "audio": audio, "sampleRate": SAMPLE_RATE}).encode()
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(30)
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

# Ping
log(f"pinging {HOST}:{PORT}...")
try:
    resp = transcribe(HOST, PORT, b"\x00" * 32000)
    log(f"server alive — test response: ok={resp.get('ok')}")
except Exception as e:
    log(f"cannot reach server: {e}")
    sys.exit(1)

q = queue.Queue(maxsize=8)

def worker():
    while True:
        chunk = q.get()
        if chunk is None:
            break
        try:
            t0 = time.monotonic()
            resp = transcribe(HOST, PORT, chunk)
            dt = time.monotonic() - t0
            if resp.get("ok") and resp.get("text", "").strip():
                print(f"  >>> {resp['text']}  ({dt*1000:.0f}ms)", flush=True)
        except Exception as e:
            log(f"error: {e}")

t = threading.Thread(target=worker, daemon=True)
t.start()

log("starting parec...")
rec = subprocess.Popen(
    ["parec", "--format=s16le", "--rate=16000", "--channels=1", "--raw"],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE,
)
time.sleep(0.3)
if rec.poll() is not None:
    log(f"parec failed: {rec.stderr.read().decode()}")
    sys.exit(1)

log("speak now (ctrl+c to stop)")
buf = b""

try:
    while True:
        data = rec.stdout.read(4096)
        if not data:
            break
        buf += data
        while len(buf) >= CHUNK_BYTES:
            chunk, buf = buf[:CHUNK_BYTES], buf[CHUNK_BYTES:]
            try:
                q.put_nowait(chunk)
            except queue.Full:
                pass
except KeyboardInterrupt:
    pass
finally:
    q.put(None)
    t.join(timeout=5)
    rec.terminate()
    log("done")
