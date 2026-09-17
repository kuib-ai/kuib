#!/usr/bin/env python3
"""Test client for stt-coreml unix socket server."""

import base64, json, os, socket, struct, sys, time

SOCKET_PATH = os.path.expanduser("~/.kuib/stt.sock")

def send_request(req: dict) -> dict:
    payload = json.dumps(req).encode()
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.connect(SOCKET_PATH)
    sock.sendall(struct.pack(">I", len(payload)) + payload)

    hdr = sock.recv(4)
    length = struct.unpack(">I", hdr)[0]
    data = b""
    while len(data) < length:
        data += sock.recv(length - len(data))
    sock.close()
    return json.loads(data)

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 test-transcribe.py ping")
        print("  python3 test-transcribe.py <path-to-raw-pcm-16bit-16khz>")
        sys.exit(1)

    if sys.argv[1] == "ping":
        print(send_request({"action": "ping"}))
        return

    path = sys.argv[1]
    with open(path, "rb") as f:
        audio = base64.b64encode(f.read()).decode()

    size_kb = os.path.getsize(path) / 1024
    duration_s = os.path.getsize(path) / (16000 * 2)
    print(f"Sending {size_kb:.0f} KB ({duration_s:.1f}s of audio)...")

    t0 = time.monotonic()
    resp = send_request({"action": "transcribe", "audio": audio, "sampleRate": 16000})
    elapsed = time.monotonic() - t0

    if resp.get("ok"):
        print(f"\nTranscript: {resp['text']}")
        print(f"Confidence: {resp['confidence']:.3f}")
        print(f"Audio duration: {resp['durationSeconds']:.2f}s")
        print(f"Inference time: {resp['processingTimeSeconds']:.3f}s")
        print(f"Round-trip: {elapsed:.3f}s")
        rtfx = resp['durationSeconds'] / resp['processingTimeSeconds'] if resp['processingTimeSeconds'] > 0 else 0
        print(f"RTFx: {rtfx:.1f}x")
    else:
        print(f"Error: {resp.get('error')}")

if __name__ == "__main__":
    main()
