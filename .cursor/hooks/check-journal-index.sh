#!/usr/bin/env bash
set -euo pipefail

ROOT="${CURSOR_PROJECT_DIR:-${CLAUDE_PROJECT_DIR:?project dir not set}}"
cd "$ROOT"

if pnpm exec tsx scripts/compile-journal-index.ts --check >/dev/null 2>&1; then
  exit 0
fi

cat <<'EOF'
{
  "additional_context": "Journal index is stale or missing. Run /journal-validate to rebuild before relying on journal context."
}
EOF
