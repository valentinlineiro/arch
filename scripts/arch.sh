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
  "validate"|"lint"|"inbox"|"next"|"govern"|"rank"|"batch"|"drain"|"conduct"|"promote"|"version"|"loop"|"sandbox"|"mv"|"exec"|"index"|"ask"|"causal"|"reflect"|"report"|"memory"|"init"|"--version"|"-v")
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
    echo "Usage: arch [review|task|govern|memory|version]"
    echo ""
    echo "Commands:"
    echo "  review                   Structural validation and drift check (--fast to skip drift)"
    echo "  task <subcommand>        Task lifecycle — run 'arch task' for subcommands"
    echo "    capture \"<intent>\"     Primary intake: create task from intent (deterministic)"
    echo "    start|done|next|...    Lifecycle transitions"
    echo "  govern [subcommand]      Enforcement tick (no LLM); subcommands:"
    echo "    (no subcommand)        Archive DONE tasks, assign focus, check thresholds"
    echo "    reflect                THINK mode: surface Kaizen, detect drift (LLM)"
    echo "    inbox                  Show weekly dashboard"
    echo "    conduct                Invoke DO mode with an AI agent"
    echo "    approve TASK-XXX       Human approval gate"
    echo "  memory <subcommand>      Knowledge retrieval (deterministic):"
    echo "    ask \"<question>\"       Corpus search across archive + ADRs"
    echo "    causal                 Record and query causal relations"
    echo "    index                  Rebuild the context index"
    echo "    explain TASK-XXX       Explain a task's context"
    echo "    deps TASK-XXX          Show task dependencies"
    echo "  version                  Show current version"
    echo ""
    echo "Deprecated (use canonical replacements instead):"
    echo "  ask        → arch memory ask"
    echo "  causal     → arch memory causal"
    echo "  index      → arch memory index"
    echo "  reflect    → arch govern reflect"
    echo "  inbox      → arch govern inbox"
    echo "  conduct    → arch govern conduct"
    echo "  capture    → arch task capture"
    echo "  validate   → arch review --fast"
    echo "  lint       → arch review --fast"
    echo "  next       → arch task next"
    echo "  rank       → arch task rank"
    echo "  promote    → arch task promote"
    exit 1
    ;;
esac
