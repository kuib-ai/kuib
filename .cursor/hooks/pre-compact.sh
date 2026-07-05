#!/usr/bin/env bash
set -euo pipefail

ROOT="${CURSOR_PROJECT_DIR:-${CLAUDE_PROJECT_DIR:?project dir not set}}"
cd "$ROOT"

pnpm exec tsx scripts/compile-journal-index.ts

cat <<'EOF'
{
  "user_message": "Context is about to be compacted. Journal index rebuilt. After compaction, run /remember <feature-name> to reload active journal context."
}
EOF
