#!/usr/bin/env bash

set -e

# ── Colors ────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; GRAY='\033[0;90m'; NC='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────
find_ready_task() {
  grep -B 1 "READY" docs/SPRINT.md | grep -m 1 "## TASK-" | grep -o "TASK-[0-9]\{3\}" || echo ""
}

# ── Router ────────────────────────────────────────────────────────
BIN="node cli/dist/index.js"

case "$1" in
  "conduct")
    echo -e "  ${GREEN}ARCH${NC} — invoking CONDUCTOR mode"
    if command -v claude-code &> /dev/null; then
      claude-code docs/agents/THINK.md
    elif command -v claude &> /dev/null; then
      claude -p "$(cat docs/agents/THINK.md)"
    else
      echo -e "  ${YELLOW}Note:${NC} No AI CLI detected. Showing protocol:"
      cat docs/agents/THINK.md
    fi
    ;;

  "exec")
    TASK_ID="$2"
    if [ -z "$TASK_ID" ]; then
      TASK_ID=$(find_ready_task)
    fi
    if [ -z "$TASK_ID" ]; then
      echo -e "  ${YELLOW}Error:${NC} No READY task found and no ID provided."
      exit 1
    fi
    echo -e "  ${GREEN}ARCH${NC} — invoking EXEC mode for: $TASK_ID"
    if command -v claude-code &> /dev/null; then
      claude-code docs/agents/DO.md
    elif command -v claude &> /dev/null; then
      claude -p "$(cat docs/agents/DO.md)"
    else
      echo -e "  ${YELLOW}Note:${NC} No AI CLI detected. Showing protocol:"
      cat docs/agents/DO.md
    fi
    ;;

  "refine")
    echo -e "  ${GREEN}ARCH${NC} — invoking REFINE mode"
    if command -v claude-code &> /dev/null; then
      claude-code docs/agents/THINK.md
    else
      cat docs/agents/THINK.md
    fi
    ;;

  "retro")
    echo -e "  ${GREEN}ARCH${NC} — invoking RETRO mode"
    if command -v claude-code &> /dev/null; then
      claude-code docs/agents/RETRO.md
    else
      cat docs/agents/RETRO.md
    fi
    ;;

  "human")
    echo -e "  ${GREEN}ARCH${NC} — invoking HUMAN mode"
    if command -v claude-code &> /dev/null; then
      claude-code docs/agents/DO.md
    else
      cat docs/agents/DO.md
    fi
    ;;

  "status")
    $BIN status
    ;;

  "validate")
    $BIN validate
    ;;

  "review")
    $BIN review
    ;;

  "task")
    $BIN "$@"
    ;;

  *)
    echo "Usage: arch [conduct|exec|refine|retro|human|status|validate|review|task]"
    exit 1
    ;;
esac
