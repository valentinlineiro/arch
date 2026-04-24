#!/usr/bin/env bash

set -e

# ── Colors ────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; GRAY='\033[0;90m'; NC='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────
find_ready_task() {
  grep -B 1 "READY" docs/SPRINT.md | grep -m 1 "## TASK-" | grep -o "TASK-[0-9]\{3\}" || echo ""
}

# ── Router ────────────────────────────────────────────────────────
case "$1" in
  "conduct")
    echo -e "  ${GREEN}ARCH${NC} — invoking CONDUCTOR mode"
    if command -v claude-code &> /dev/null; then
      claude-code docs/agents/CONDUCTOR.md
    elif command -v claude &> /dev/null; then
      claude -p "$(cat docs/agents/CONDUCTOR.md)"
    else
      echo -e "  ${YELLOW}Note:${NC} No AI CLI detected. Showing protocol:"
      cat docs/agents/CONDUCTOR.md
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
      claude-code docs/agents/EXEC.md
    elif command -v claude &> /dev/null; then
      claude -p "$(cat docs/agents/EXEC.md)"
    else
      echo -e "  ${YELLOW}Note:${NC} No AI CLI detected. Showing protocol:"
      cat docs/agents/EXEC.md
    fi
    ;;

  "refine")
    echo -e "  ${GREEN}ARCH${NC} — invoking REFINE mode"
    if command -v claude-code &> /dev/null; then
      claude-code docs/agents/REFINE.md
    else
      cat docs/agents/REFINE.md
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
      claude-code docs/agents/HUMAN.md
    else
      cat docs/agents/HUMAN.md
    fi
    ;;

  "status")
    if [ -f "docs/DISPATCH.md" ]; then
      cat docs/DISPATCH.md
    else
      echo "No DISPATCH.md found. Run 'arch conduct' first."
    fi
    ;;

  "task")
    CMD="$2"
    ID="$3"
    if [ -z "$ID" ]; then
      echo -e "  ${YELLOW}Usage:${NC} arch task [done|start] [TASK-ID]"
      exit 1
    fi
    case "$CMD" in
      "done")
        echo -e "  ${GREEN}✓${NC} marking $ID as DONE"
        python3 -c "
import sys
import re
content = open('docs/SPRINT.md').read()
pattern = r'(## ' + re.escape('$ID') + r'.*?Meta:.*?)\|( READY| IN_PROGRESS)'
if re.search(pattern, content, re.DOTALL):
    new_content = re.sub(pattern, r'\1| DONE', content, flags=re.DOTALL)
    with open('docs/SPRINT.md', 'w') as f:
        f.write(new_content)
else:
    print('  Task $ID not found or already DONE.')
"
        ;;
      "start")
        echo -e "  ${GREEN}→${NC} marking $ID as IN_PROGRESS"
        python3 -c "
import sys
import re
from datetime import datetime
content = open('docs/SPRINT.md').read()
pattern = r'(## ' + re.escape('$ID') + r'.*?Meta:.*?)\| READY'
if re.search(pattern, content, re.DOTALL):
    replacement = r'\1| IN_PROGRESS\n**Locked-by:** cli | **Locked-at:** ' + datetime.now().isoformat()
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    with open('docs/SPRINT.md', 'w') as f:
        f.write(new_content)
else:
    print('  Task $ID not found or not in READY state.')
"
        ;;
    esac
    ;;

  *)
    echo "Usage: arch [conduct|exec|refine|retro|human|status|task]"
    exit 1
    ;;
esac
