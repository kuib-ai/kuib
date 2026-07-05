#!/usr/bin/env bash
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:?CLAUDE_PROJECT_DIR is not set}"
pnpm exec tsx scripts/compile-journal-index.ts
