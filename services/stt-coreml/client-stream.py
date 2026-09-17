#!/usr/bin/env python3
"""Stream live mic audio to stt-coreml, print transcripts in real-time.

Usage:
  python3 client-stream.py                 # stream from mic
  python3 client-stream.py recording.raw   # stream a file (simulates real-time)
"""

import base64, json, os, socket, struct, subprocess, sys, threading, time

HOST = os.environ.get("STT_HOST", "100.70.111.96")
PORT = int(os.environ.get("STT_PORT", "9009"))
ENGINE = os.environ.get("STT_ENGINE", None)
CHUNK_SECONDS = 3.0
SEND_INTERVAL_MS = 100
SEND_BYTES = 16000 * 2 * SEND_INTERVAL_MS // 1000

class Conn:
    def __init__(self, host, port):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((host, port))
        self.lock = threading.Lock()

    def send(self, req):
        payload = json.dumps(req).encode()
        with self.lock:
            self.sock.sendall(struct.pack(">I", len(payload)) + payload)

    def recv(self):
        hdr = b""
        while len(hdr) < 4:
            c = self.sock.recv(4 - len(hdr))
            if not c: raise ConnectionError("closed")
            hdr += c
        length = struct.unpack(">I", hdr)[0]
        data = b""
        while len(data) < length:
            c = self.sock.recv(length - len(data))
            if not c: raise ConnectionError("closed")
            data += c
        return json.loads(data)

    def close(self):
        self.sock.close()

def receiver(conn, stop):
    while not stop.is_set():
        try:
            conn.sock.settimeout(0.5)
            r = conn.recv()
            t = r.get("type", "")
            text = r.get("text", "")
            if t == "partial" and text:
                print(f"\r  ... {text}    ", end="", flush=True)
            elif t == "confirmed" and text:
                print(f"\r  >>> {text}  (conf={r.get('confidence',0):.2f})", flush=True)
            elif t == "final":
                print(f"\n  === {text} ===\n", flush=True)
                stop.set()
            elif t == "error":
                print(f"\n  [error] {r.get('error')}", flush=True)
        except socket.timeout:
            continue
        except Exception as e:
            if not stop.is_set():
                print(f"\n  [recv error] {e}", flush=True)
            break

# Connect and start stream
conn = Conn(HOST, PORT)
start_msg = {"action": "streamStart", "chunkSeconds": CHUNK_SECONDS}
if ENGINE:
    start_msg["engine"] = ENGINE
conn.send(start_msg)
conn.sock.settimeout(30)
while True:
    r = conn.recv()
    if r.get("type") == "started":
        break
    elif r.get("type") == "error":
        print(f"Failed: {r.get('error')}")
        sys.exit(1)

stop = threading.Event()
threading.Thread(target=receiver, args=(conn, stop), daemon=True).start()

if len(sys.argv) > 1 and sys.argv[1] != "--":
    # File mode: stream a recording
    path = sys.argv[1]
    with open(path, "rb") as f:
        pcm = f.read()
    print(f"Streaming {len(pcm)/1024:.0f} KB ({len(pcm)/32000:.1f}s)...")
    offset = 0
    while offset < len(pcm) and not stop.is_set():
        chunk = pcm[offset:offset + SEND_BYTES]
        conn.send({"action": "streamAudio", "audio": base64.b64encode(chunk).decode()})
        offset += len(chunk)
        time.sleep(SEND_INTERVAL_MS / 1000)
else:
    # Mic mode: stream from parec
    rec = subprocess.Popen(
        ["parec", "--format=s16le", "--rate=16000", "--channels=1", "--raw"],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    time.sleep(0.3)
    if rec.poll() is not None:
        print(f"parec failed: {rec.stderr.read().decode()}")
        sys.exit(1)
    print("Speak now (Ctrl+C to stop)")
    try:
        while not stop.is_set():
            data = rec.stdout.read(SEND_BYTES)
            if not data: break
            conn.send({"action": "streamAudio", "audio": base64.b64encode(data).decode()})
    except KeyboardInterrupt:
        pass
    rec.terminate()

conn.send({"action": "streamEnd"})
stop.wait(timeout=10)
conn.close()
