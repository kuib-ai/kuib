#!/usr/bin/env python3
"""Watch /tmp/stt-input.raw and transcribe whenever it's written."""

import base64, json, os, socket, struct, time

SOCKET_PATH = os.path.expanduser("~/.kuib/stt.sock")
WATCH_FILE = "/tmp/stt-input.raw"

def transcribe(path):
    with open(path, "rb") as f:
        pcm = f.read()
    audio = base64.b64encode(pcm).decode()
    req = json.dumps({"action": "transcribe", "audio": audio, "sampleRate": 16000}).encode()
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.settimeout(30)
    sock.connect(SOCKET_PATH)
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

print(f"Watching {WATCH_FILE} — send audio with:", flush=True)
print(f"  pw-record --format=s16 --rate=16000 --channels=1 /tmp/rec.raw", flush=True)
print(f"  scp /tmp/rec.raw 100.70.111.96:{WATCH_FILE}", flush=True)

last_mtime = 0
while True:
    try:
        st = os.stat(WATCH_FILE)
        if st.st_mtime > last_mtime and st.st_size > 0:
            last_mtime = st.st_mtime
            duration = st.st_size / 32000
            print(f"\n[{time.strftime('%H:%M:%S')}] New audio: {st.st_size/1024:.0f} KB ({duration:.1f}s)", flush=True)
            t0 = time.monotonic()
            resp = transcribe(WATCH_FILE)
            dt = time.monotonic() - t0
            if resp.get("ok"):
                print(f">>> {resp['text']}  ({dt*1000:.0f}ms, conf={resp['confidence']:.2f})", flush=True)
            else:
                print(f"Error: {resp.get('error')}", flush=True)
    except FileNotFoundError:
        pass
    except Exception as e:
        print(f"Error: {e}", flush=True)
    time.sleep(0.5)
