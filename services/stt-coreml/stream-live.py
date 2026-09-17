#!/usr/bin/env python3
"""Stream live mic audio to stt-coreml over TCP, print transcripts in real-time."""

import base64, json, socket, struct, subprocess, sys, threading, time

HOST = sys.argv[1] if len(sys.argv) > 1 else "100.70.111.96"
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 9009
SAMPLE_RATE = 16000
CHUNK_MS = 100
CHUNK_BYTES = SAMPLE_RATE * 2 * CHUNK_MS // 1000

def log(msg):
    print(f"[stt {time.strftime('%H:%M:%S')}] {msg}", flush=True)

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
                log(f"error: {r.get('error')}")
        except socket.timeout:
            continue
        except Exception as e:
            if not stop.is_set():
                log(f"recv error: {e}")
            break

log(f"connecting to {HOST}:{PORT}...")
conn = Conn(HOST, PORT)
log("connected")

conn.send({"action": "streamStart", "chunkSeconds": 1.5})
conn.sock.settimeout(30)
while True:
    r = conn.recv()
    if r.get("type") == "started":
        log("stream ready")
        break
    elif r.get("type") == "error":
        log(f"failed: {r.get('error')}")
        sys.exit(1)

stop = threading.Event()
threading.Thread(target=receiver, args=(conn, stop), daemon=True).start()

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
try:
    while not stop.is_set():
        data = rec.stdout.read(CHUNK_BYTES)
        if not data: break
        conn.send({"action": "streamAudio", "audio": base64.b64encode(data).decode()})
except KeyboardInterrupt:
    pass

log("ending stream...")
conn.send({"action": "streamEnd"})
rec.terminate()
stop.wait(timeout=10)
conn.close()
log("done")
