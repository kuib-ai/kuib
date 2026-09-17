#!/usr/bin/env python3
"""TCP bridge: streams PCM from network, sends 1s chunks to stt.sock."""

import base64, json, os, queue, socket, struct, sys, threading, time

SOCKET_PATH = os.path.expanduser("~/.kuib/stt.sock")
SAMPLE_RATE = 16000
BYTES_PER_SAMPLE = 2
CHUNK_SECONDS = 1
CHUNK_BYTES = SAMPLE_RATE * BYTES_PER_SAMPLE * CHUNK_SECONDS
BIND_ADDR = sys.argv[2] if len(sys.argv) > 2 else "100.70.111.96"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9009

def log(msg):
    print(f"[bridge {time.strftime('%H:%M:%S')}] {msg}", flush=True)

def transcribe(pcm: bytes) -> str:
    audio = base64.b64encode(pcm).decode()
    req = json.dumps({"action": "transcribe", "audio": audio, "sampleRate": SAMPLE_RATE}).encode()
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.settimeout(30)
    sock.connect(SOCKET_PATH)
    sock.sendall(struct.pack(">I", len(req)) + req)
    hdr = sock.recv(4)
    length = struct.unpack(">I", hdr)[0]
    data = b""
    while len(data) < length:
        data += sock.recv(length - len(data))
    sock.close()
    resp = json.loads(data)
    if resp.get("ok"):
        return resp.get("text", "")
    return f"[error: {resp.get('error')}]"

def transcriber(q: queue.Queue):
    while True:
        chunk = q.get()
        if chunk is None:
            break
        try:
            t0 = time.monotonic()
            text = transcribe(chunk)
            dt = time.monotonic() - t0
            if text.strip():
                print(f"  >>> {text}  ({dt*1000:.0f}ms)", flush=True)
        except Exception as e:
            log(f"transcribe error: {e}")

def handle(conn, addr):
    log(f"connected: {addr}")
    q = queue.Queue(maxsize=8)
    worker = threading.Thread(target=transcriber, args=(q,), daemon=True)
    worker.start()

    buf = b""
    total = 0
    try:
        while True:
            data = conn.recv(8192)
            if not data:
                log("client EOF")
                break
            total += len(data)
            buf += data
            while len(buf) >= CHUNK_BYTES:
                chunk, buf = buf[:CHUNK_BYTES], buf[CHUNK_BYTES:]
                try:
                    q.put_nowait(chunk)
                except queue.Full:
                    log("dropping chunk (transcriber backed up)")
        if buf:
            try:
                q.put_nowait(buf)
            except queue.Full:
                pass
    except Exception as e:
        log(f"recv error: {e}")
    finally:
        q.put(None)
        worker.join(timeout=30)
        conn.close()
        log(f"disconnected (total: {total} bytes, {total/32000:.1f}s)")

srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind((BIND_ADDR, PORT))
srv.listen(1)
log(f"listening on {BIND_ADDR}:{PORT} (chunk={CHUNK_SECONDS}s)")

while True:
    conn, addr = srv.accept()
    threading.Thread(target=handle, args=(conn, addr), daemon=True).start()
