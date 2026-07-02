#!/usr/bin/env bash
# One-command design session in an isolated worktree.
#   window 0 = claude "/wireframe", window 1 = live wireframe picker — both in the worktree.
# Every action is idempotent; the script converges to the desired state on every run:
#   - worktree at .claude/worktrees/rupsha-design on branch rupsha/design (created from master if missing)
#   - root .env copied in when missing (never overwritten)
#   - pnpm install runs every time (no-op when current), so rebases that add packages just work
#   - branch rebased onto master only when the worktree is clean; on conflict the rebase is left
#     in place and claude launches with a resolve-the-rebase-with-Rupsha prompt instead of /wireframe
#   - claude window: left alone if running (never kills a live conversation), started if idle
#   - picker window: always killed and re-inited fresh
#   - wrong session shape: salvages a running claude window, rebuilds everything else around it
# Run locally or over ssh:  ssh -t rs10@septimus /home/rs10/developer/kuib-ai/kuib/scripts/design-session.sh
set -euo pipefail

# ssh -t runs this without zshrc — pin the tool locations this machine actually uses
export PATH="$HOME/.local/share/pnpm/bin:$HOME/.local/bin:$HOME/.local/share/fnm/aliases/default/bin:$PATH"

REPO="/home/rs10/developer/kuib-ai/kuib"
SESSION="${SESSION:-kuib/rupsha}"
BRANCH="${BRANCH:-rupsha/design}"
WORKTREE="${WORKTREE:-$REPO/.claude/worktrees/rupsha-design}"
CLAUDE_CMD="${CLAUDE_CMD:-claude \"/wireframe\"}"
PICKER_CMD="${PICKER_CMD:-pnpm wireframes}"
CLAUDE_BIN="${CLAUDE_CMD%% *}"

ensure_worktree() {
  git -C "$REPO" worktree prune
  if [ ! -e "$WORKTREE/.git" ]; then
    if git -C "$REPO" show-ref --quiet --verify "refs/heads/$BRANCH"; then
      git -C "$REPO" worktree add "$WORKTREE" "$BRANCH"
    else
      git -C "$REPO" worktree add -b "$BRANCH" "$WORKTREE" master
    fi
  fi
  if [ -f "$REPO/.env" ] && [ ! -f "$WORKTREE/.env" ]; then
    cp "$REPO/.env" "$WORKTREE/.env"
  fi
}

ensure_installed() {
  (cd "$WORKTREE" && pnpm install)
}

REBASE_CONFLICT=0
CONFLICT_PROMPT='The rebase of this design branch onto master stopped with conflicts in this worktree. Before anything else: walk Rupsha through each conflicted file, discuss the right resolution with her, apply it, and complete the rebase with git rebase --continue. Only once the rebase is done, run /wireframe and carry on.'

ensure_rebased() {
  if [ -d "$(git -C "$WORKTREE" rev-parse --git-path rebase-merge)" ]; then
    REBASE_CONFLICT=1
    return
  fi
  if [ -n "$(git -C "$WORKTREE" status --porcelain)" ]; then
    return
  fi
  if ! git -C "$WORKTREE" rebase master; then
    REBASE_CONFLICT=1
  fi
}

build() {
  tmux new-session -d -s "$SESSION" -c "$WORKTREE"
  tmux send-keys -t "$SESSION" "$CLAUDE_CMD" C-m
  tmux new-window -t "$SESSION" -c "$WORKTREE"
  tmux send-keys -t "$SESSION" "$PICKER_CMD" C-m
  tmux select-window -t "$SESSION:^"
}

find_claude_pane() {
  tmux list-panes -s -t "$SESSION" -F "#{window_id}:#{pane_id}:#{pane_current_command}" |
    awk -F: -v bin="$CLAUDE_BIN" '$3 == bin { print $1 ":" $2; exit }'
}

salvage() {
  local claude_window claude_pane window_id pane_id
  IFS=: read -r claude_window claude_pane <<< "$1"
  while IFS=: read -r window_id pane_id; do
    if [ "$window_id" != "$claude_window" ]; then
      tmux kill-window -t "$window_id" 2>/dev/null || true
      continue
    fi
    if [ "$pane_id" != "$claude_pane" ]; then
      tmux kill-pane -t "$pane_id" 2>/dev/null || true
    fi
  done < <(tmux list-panes -s -t "$SESSION" -F "#{window_id}:#{pane_id}")
  tmux new-window -t "$SESSION" -c "$WORKTREE"
  tmux send-keys -t "$SESSION" "$PICKER_CMD" C-m
  tmux select-window -t "$SESSION:^"
}

converge_windows() {
  local position=0
  local window_id pane_cmd
  while IFS=: read -r window_id pane_cmd; do
    if [ "$position" -eq 0 ]; then
      if [ "$pane_cmd" = "zsh" ] || [ "$pane_cmd" = "bash" ]; then
        tmux send-keys -t "$window_id" "cd $WORKTREE" C-m
        tmux send-keys -t "$window_id" "$CLAUDE_CMD" C-m
      fi
    else
      tmux respawn-pane -k -t "$window_id"
      tmux send-keys -t "$window_id" "cd $WORKTREE" C-m
      tmux send-keys -t "$window_id" "$PICKER_CMD" C-m
    fi
    position=$((position + 1))
  done < <(tmux list-windows -t "$SESSION" -F "#{window_id}:#{pane_current_command}")
}

ensure_session() {
  if ! tmux has-session -t "=$SESSION" 2>/dev/null; then
    build
    return
  fi
  local windows panes claude_pane
  windows=$(tmux list-windows -t "$SESSION" -F x | wc -l)
  panes=$(tmux list-panes -s -t "$SESSION" -F x | wc -l)
  if [ "$windows" -eq 2 ] && [ "$panes" -eq 2 ]; then
    converge_windows
    return
  fi
  claude_pane=$(find_claude_pane)
  if [ -n "$claude_pane" ]; then
    salvage "$claude_pane"
    return
  fi
  tmux kill-session -t "$SESSION"
  build
}

ensure_worktree
ensure_rebased
if [ "$REBASE_CONFLICT" -eq 1 ]; then
  CLAUDE_CMD="claude \"$CONFLICT_PROMPT\""
  CLAUDE_BIN="${CLAUDE_CMD%% *}"
else
  ensure_installed
fi
ensure_session

if [ "${1:-}" = "--ensure-only" ]; then
  exit 0
fi

exec tmux attach-session -t "$SESSION"
