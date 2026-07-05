#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Context was compacted and the journal index was rebuilt. Run /remember <feature-name> to reload your active journal context before continuing work."
  }
}
EOF
