#!/usr/bin/env bash

set -e

# ── Colors ────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; GRAY='\033[0;90m'; NC='\033[0m'

# ── Configuration ──────────────────────────────────────────────────
# Path to the CLI entry point
BIN="node $(dirname "$0")/../cli/dist/index.js"

# ── Router ────────────────────────────────────────────────────────
case "$1" in
  "status"|"validate"|"inbox"|"next"|"version"|"--version"|"-v")
    $BIN "$@"
    ;;

  "review")
    # Check for --push flag
    PUSH=false
    for arg in "$@"; do
      if [ "$arg" == "--push" ]; then
        PUSH=true
      fi
    done

    # Execute review
    $BIN "$@"

    # Push if flag present and review passed (set -e ensures we only reach here on success)
    if [ "$PUSH" = true ]; then
      echo ""
      echo -e "  ${GREEN}✓${NC} Review passed. Pushing to remote..."
      git push
    fi
    ;;

  "task")
    $BIN "$@"
    ;;

  "conduct")
    echo -e "  ${GREEN}ARCH${NC} — invoking CONDUCTOR mode (THINK)"
    if command -v claude &> /dev/null; then
      claude -p "$(cat docs/agents/THINK.md)" --dangerously-skip-permissions
    elif command -v gemini &> /dev/null; then
      gemini -p "$(cat docs/agents/THINK.md)" -y
    else
      echo -e "  ${YELLOW}Note:${NC} No AI CLI detected. Showing protocol:"
      cat docs/agents/THINK.md
    fi
    ;;

  "exec")
    echo -e "  ${GREEN}ARCH${NC} — invoking EXEC mode (DO)"
    if command -v claude &> /dev/null; then
      claude -p "$(cat docs/agents/DO.md)" --dangerously-skip-permissions
    elif command -v gemini &> /dev/null; then
      gemini -p "$(cat docs/agents/DO.md)" -y
    else
      echo -e "  ${YELLOW}Note:${NC} No AI CLI detected. Showing protocol:"
      cat docs/agents/DO.md
    fi
    ;;

  *)
    echo "Usage: $0 [status|validate|review|inbox|next|task|version|conduct|exec]"
    echo ""
    echo "Commands:"
    echo "  status     Show task counts"
    echo "  validate   Check repository structure"
    echo "  review     Run deep audit and drift check"
    echo "  inbox      Show weekly dashboard"
    echo "  next       Suggest the next task"
    echo "  task       Manage tasks (start/done)"
    echo "  version    Show current version"
    echo "  conduct    Invoke THINK mode with an AI agent"
    echo "  exec       Invoke DO mode with an AI agent"
    exit 1
    ;;
esac
