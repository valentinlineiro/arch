#!/usr/bin/env bash

set -e

# ── Colors ────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; GRAY='\033[0;90m'; NC='\033[0m'

# ── Configuration ──────────────────────────────────────────────────
export LC_ALL=C
# Path to the CLI entry point
BIN="node $(dirname "$0")/../cli/dist/index.js"

# ── Router ────────────────────────────────────────────────────────
case "$1" in
  "validate"|"lint"|"inbox"|"next"|"govern"|"rank"|"batch"|"drain"|"conduct"|"promote"|"version"|"loop"|"sandbox"|"mv"|"exec"|"capture"|"index"|"think"|"ask"|"causal"|"--version"|"-v")
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

    $BIN "$@"

    # Push if flag present and review passed (set -e ensures we only reach here on success)
    if [ "$PUSH" = true ]; then
      echo ""
      echo -e "  ${GREEN}✓${NC} Review passed. Pushing to remote..."
      git push
    fi
    ;;

  "task")
    # Pre-archive guard for 'task done'
    if [ "$2" == "done" ]; then
      task_id=""
      force=false
      for arg in "$@"; do
        if [[ "$arg" =~ ^TASK-[0-9]{3}$ ]]; then
          task_id="$arg"
        elif [ "$arg" == "--force" ]; then
          force=true
        fi
      done

      if [ -n "$task_id" ] && [ "$force" = false ]; then
        task_file="docs/tasks/${task_id}.md"
        if [ -f "$task_file" ]; then
          if grep -q "^[[:space:]]*- \[ \]" "$task_file"; then
            echo -e "  ${RED}✖${NC} Error: Task ${task_id} has unchecked Acceptance Criteria."
            echo -e "    Please check all ACs or use ${YELLOW}--force${NC} to override."
            exit 1
          fi
        fi
      fi
    fi
    $BIN "$@"
    ;;

  *)
    echo "Usage: $0 [review|task|inbox|govern|version|batch|drain|conduct|loop|sandbox|mv|exec|capture|index|think|ask|causal]"
    echo ""
    echo "Commands:"
    echo "  review            Run deep audit and drift check (--fast to skip drift)"
    echo "  inbox             Show weekly dashboard"
    echo "  task              Manage tasks (start|done|next|rank|promote|compress|...)"
    echo "  govern            Autonomous governance tick"
    echo "  version           Show current version"
    echo "  batch             Manage batch queue"
    echo "  drain             Submit and process batch queue"
    echo "  conduct           Invoke THINK mode with an AI agent"
    echo "  exec              Invoke DO mode with an AI agent"
    echo "  loop              Autonomous execution loop"
    echo "  sandbox           Secure execution wrapper (non-AI)"
    echo "  mv                Move a file and update task contexts"
    echo "  capture           Capture a new intent"
    echo "  index             Rebuild the context index"
    echo "  think             Process intents and build tasks"
    echo "  ask               Query operational memory"
    echo "  causal            Record and query causal relations between entities"
    echo ""
    echo "Deprecated (use canonical replacements instead):"
    echo "  validate          → arch review --fast"
    echo "  lint              → arch review --fast"
    echo "  next              → arch task next"
    echo "  rank              → arch task rank"
    echo "  promote           → arch task promote"
    exit 1
    ;;
esac
