#!/usr/bin/env python3
"""Qwen3-ASR inference server — same wire protocol as stt-coreml.

Speaks length-prefixed JSON over TCP so the existing client-batch.py and
client-stream.py scripts work by just changing STT_HOST/STT_PORT.

Usage:
    uv run python server.py
    STT_MLX_PORT=9010 STT_MLX_MODEL=Qwen/Qwen3-ASR-0.6B uv run python server.py
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import struct
import time
from concurrent.futures import ThreadPoolExecutor

import numpy as np

MODEL_ID = os.environ.get("STT_MLX_MODEL", "Qwen/Qwen3-ASR-0.6B")
HOST = os.environ.get("STT_MLX_HOST", "0.0.0.0")
PORT = int(os.environ.get("STT_MLX_PORT", "9010"))
ENGINE_NAME = "qwen3-asr-mlx"

executor: ThreadPoolExecutor
session = None


def load_model():
    global session
    from mlx_qwen3_asr import Session

    print(f"[stt-mlx] Loading {MODEL_ID}...")
    t0 = time.monotonic()
    session = Session(MODEL_ID)
    dt = time.monotonic() - t0
    print(f"[stt-mlx] Model loaded in {dt:.1f}s")
    info = session.model_info
    print(f"[stt-mlx] {info.get('model_id')} dtype={info.get('dtype')}")


def transcribe_sync(pcm: np.ndarray, sample_rate: int, language: str | None = None) -> dict:
    t0 = time.monotonic()
    result = session.transcribe((pcm, sample_rate), language=language)
    dt = time.monotonic() - t0
    duration = len(pcm) / sample_rate
    return {
        "ok": True,
        "type": "result",
        "text": result.text,
        "confidence": 1.0,
        "durationSeconds": round(duration, 3),
        "processingTimeSeconds": round(dt, 4),
        "engine": ENGINE_NAME,
    }


def pcm16_to_float32(raw: bytes) -> np.ndarray:
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


async def read_msg(reader: asyncio.StreamReader) -> dict | None:
    hdr = await reader.readexactly(4)
    length = struct.unpack(">I", hdr)[0]
    data = await reader.readexactly(length)
    return json.loads(data)


async def send_msg(writer: asyncio.StreamWriter, msg: dict):
    payload = json.dumps(msg, ensure_ascii=False).encode()
    writer.write(struct.pack(">I", len(payload)) + payload)
    await writer.drain()


async def handle_transcribe(writer, req):
    audio_b64 = req.get("audio", "")
    sample_rate = req.get("sampleRate", 16000)
    language = req.get("language")
    raw = base64.b64decode(audio_b64)
    pcm = pcm16_to_float32(raw)
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        executor, transcribe_sync, pcm, sample_rate, language
    )
    await send_msg(writer, result)


async def handle_stream(reader, writer, req):
    await send_msg(writer, {
        "ok": True, "type": "started",
        "engine": ENGINE_NAME,
    })

    from mlx_qwen3_asr.streaming import StreamingState

    loop = asyncio.get_running_loop()
    state: StreamingState = await loop.run_in_executor(
        executor,
        lambda: session.init_streaming(chunk_size_sec=req.get("chunkSeconds", 2.0)),
    )

    prev_text = ""
    while True:
        try:
            msg = await read_msg(reader)
        except (asyncio.IncompleteReadError, ConnectionError):
            break

        action = msg.get("action", "")

        if action == "streamAudio":
            raw = base64.b64decode(msg.get("audio", ""))
            pcm = pcm16_to_float32(raw)

            state = await loop.run_in_executor(
                executor,
                lambda pcm=pcm, st=state: session.feed_audio(pcm, st),
            )

            if state.text != prev_text:
                prev_text = state.text
                await send_msg(writer, {
                    "ok": True,
                    "type": "partial",
                    "text": state.text,
                    "confidence": 0.0,
                    "engine": ENGINE_NAME,
                })

        elif action == "streamEnd":
            state = await loop.run_in_executor(
                executor,
                lambda st=state: session.finish_streaming(st),
            )
            await send_msg(writer, {
                "ok": True,
                "type": "final",
                "text": state.text,
                "confirmed": True,
                "engine": ENGINE_NAME,
            })
            break

        elif action == "ping":
            await send_msg(writer, {"ok": True, "type": "pong"})

        else:
            await send_msg(writer, {
                "ok": False,
                "type": "error",
                "error": f"unexpected action during stream: {action}",
            })
            break


async def handle_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    addr = writer.get_extra_info("peername")
    try:
        while True:
            try:
                msg = await read_msg(reader)
            except (asyncio.IncompleteReadError, ConnectionError):
                break

            action = msg.get("action", "")

            if action == "transcribe":
                await handle_transcribe(writer, msg)
            elif action == "streamStart":
                await handle_stream(reader, writer, msg)
            elif action == "ping":
                await send_msg(writer, {"ok": True, "type": "pong"})
            else:
                await send_msg(writer, {
                    "ok": False,
                    "type": "error",
                    "error": f"unknown action: {action}",
                })
    except Exception as e:
        print(f"[stt-mlx] client {addr} error: {e}")
    finally:
        writer.close()
        await writer.wait_closed()


async def main():
    global executor
    executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="mlx-asr")

    loop = asyncio.get_running_loop()
    await loop.run_in_executor(executor, load_model)

    server = await asyncio.start_server(handle_client, HOST, PORT)
    addrs = ", ".join(str(s.getsockname()) for s in server.sockets)
    print(f"[stt-mlx] listening on {addrs}")

    async with server:
        await server.serve_forever()


if __name__ == "__main__":
    asyncio.run(main())
