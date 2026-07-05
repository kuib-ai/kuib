#!/usr/bin/env bash
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:?CLAUDE_PROJECT_DIR is not set}"

if pnpm exec tsx scripts/compile-journal-index.ts --check >/dev/null 2>&1; then
  exit 0
fi

cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Journal index is stale or missing. Run /journal-validate to rebuild before relying on journal context."
  }
}
EOF
