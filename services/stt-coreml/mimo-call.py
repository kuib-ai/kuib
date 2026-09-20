#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["openai"]
# ///
"""Send text to MiMo API. Pipe from STT or pass as argument.

Usage:
  uv run mimo-call.py "translate this to Hindi"
  echo "hello world" | uv run mimo-call.py
  MIMO_MODEL=mimo-v2.5 uv run mimo-call.py "explain quantum computing"
"""

import os, sys
from openai import OpenAI

API_KEY = os.environ.get("MIMO_API_KEY")
if not API_KEY:
    print("Set MIMO_API_KEY env var first")
    print("Get one at: https://platform.xiaomimimo.com/#/console/api-keys")
    sys.exit(1)

MODEL = os.environ.get("MIMO_MODEL", "mimo-v2.5-pro")
BASE_URL = os.environ.get("MIMO_BASE_URL", "https://api.xiaomimimo.com/v1")

if len(sys.argv) > 1:
    text = " ".join(sys.argv[1:])
elif not sys.stdin.isatty():
    text = sys.stdin.read().strip()
else:
    print("Pass text as argument or pipe it in")
    sys.exit(1)

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

completion = client.chat.completions.create(
    model=MODEL,
    messages=[
        {"role": "system", "content": "You are MiMo, an AI assistant developed by Xiaomi."},
        {"role": "user", "content": text},
    ],
    max_completion_tokens=1024,
    temperature=1.0,
    top_p=0.95,
    stream=True,
)

for chunk in completion:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
print()
