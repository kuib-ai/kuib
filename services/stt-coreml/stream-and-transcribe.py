#!/usr/bin/env python3
"""Stream audio from mic to stt-coreml, print partial/final transcripts."""

import base64, json, os, socket, struct, subprocess, sys, threading, time

SOCKET_PATH = os.path.expanduser("~/.kuib/stt.sock")
SAMPLE_RATE = 16000
CHUNK_BYTES = SAMPLE_RATE * 2 // 10  # 100ms chunks for smooth streaming

def log(msg):
    print(f"[stream {time.strftime('%H:%M:%S')}] {msg}", flush=True)

class SttConnection:
    def __init__(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.connect(SOCKET_PATH)
        self.lock = threading.Lock()

    def send(self, req: dict):
        payload = json.dumps(req).encode()
        with self.lock:
            self.sock.sendall(struct.pack(">I", len(payload)) + payload)

    def recv(self) -> dict:
        hdr = b""
        while len(hdr) < 4:
            chunk = self.sock.recv(4 - len(hdr))
            if not chunk:
                raise ConnectionError("Connection closed")
            hdr += chunk
        length = struct.unpack(">I", hdr)[0]
        data = b""
        while len(data) < length:
            chunk = self.sock.recv(length - len(data))
            if not chunk:
                raise ConnectionError("Connection closed")
            data += chunk
        return json.loads(data)

    def close(self):
        self.sock.close()

def receiver(conn: SttConnection, stop_event: threading.Event):
    last_text = ""
    while not stop_event.is_set():
        try:
            conn.sock.settimeout(0.5)
            resp = conn.recv()
            t = resp.get("type", "")
            text = resp.get("text", "")

            if t == "started":
                log("stream started")
            elif t == "partial":
                if text != last_text:
                    print(f"  ... {text}", flush=True)
                    last_text = text
            elif t == "confirmed":
                print(f"  >>> {text}  (conf={resp.get('confidence', 0):.2f})", flush=True)
                last_text = ""
            elif t == "final":
                print(f"\n  === FINAL: {text} ===\n", flush=True)
                stop_event.set()
            elif t == "error":
                log(f"error: {resp.get('error')}")
        except socket.timeout:
            continue
        except Exception as e:
            if not stop_event.is_set():
                log(f"receiver error: {e}")
            break

log("connecting to stt.sock...")
conn = SttConnection()

log("starting stream...")
conn.send({"action": "streamStart", "chunkSeconds": 3.0})

# Wait for "started" before sending audio
conn.sock.settimeout(30)
while True:
    resp = conn.recv()
    if resp.get("type") == "started":
        log("stream ready")
        break
    elif resp.get("type") == "error":
        log(f"stream start failed: {resp.get('error')}")
        sys.exit(1)

stop = threading.Event()
recv_thread = threading.Thread(target=receiver, args=(conn, stop), daemon=True)
recv_thread.start()

use_parec = "--parec" in sys.argv
if use_parec:
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
            if not data:
                break
            audio = base64.b64encode(data).decode()
            conn.send({"action": "streamAudio", "audio": audio})
    except KeyboardInterrupt:
        pass
    finally:
        rec.terminate()
else:
    if len(sys.argv) < 2 or sys.argv[1] == "--parec":
        print("Usage:")
        print("  python3 stream-and-transcribe.py <raw-pcm-file>")
        print("  python3 stream-and-transcribe.py --parec  (live mic via parec)")
        conn.send({"action": "streamEnd"})
        time.sleep(1)
        conn.close()
        sys.exit(0)

    path = sys.argv[1]
    with open(path, "rb") as f:
        pcm = f.read()
    total = len(pcm)
    offset = 0
    log(f"streaming {total/1024:.0f} KB ({total/32000:.1f}s)...")
    while offset < total:
        chunk = pcm[offset:offset + CHUNK_BYTES]
        audio = base64.b64encode(chunk).decode()
        conn.send({"action": "streamAudio", "audio": audio})
        offset += len(chunk)
        time.sleep(len(chunk) / 32000)

log("ending stream...")
conn.send({"action": "streamEnd"})
stop.wait(timeout=10)
conn.close()
log("done")
