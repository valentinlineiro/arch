#!/usr/bin/env bash

set -e

# ── Colors ────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; GRAY='\033[0;90m'; NC='\033[0m'

# ── Configuration ──────────────────────────────────────────────────
# Path to the CLI entry point
BIN="node $(dirname "$0")/../cli/dist/index.js"

# ── Agent Invoker ────────────────────────────────────────────────
invoke_agent() {
  local mode_name=$1
  local prompt_file=$2
  local extra_flags=$3
  local task_class=$4
  local task_size=$5
  
  echo -e "  ${GREEN}ARCH${NC} — invoking ${mode_name} mode"
  
  node -e "
    const fs = require(\"fs\");
    const { execSync, spawnSync } = require(\"child_process\");
    try {
      const config = JSON.parse(fs.readFileSync(\"arch.config.json\", \"utf8\"));
      const taskClass = process.argv[3];
      const taskSize = process.argv[4];

      let preferredCliName = null;
      if (taskClass && config.routing && config.routing[taskClass]) {
        preferredCliName = config.routing[taskClass];
      }

      let preferredModel = null;
      if (taskSize && config.governance && config.governance.modelTiers && config.governance.modelTiers[taskSize]) {
        preferredModel = config.governance.modelTiers[taskSize];
      }

      // Determine CLI order: preferred first, then others
      let clisToTry = config.clis;
      if (preferredCliName && preferredCliName !== \"local\") {
        const found = config.clis.find(c => c.name === preferredCliName);
        if (found) {
          clisToTry = [found, ...config.clis.filter(c => c.name !== preferredCliName)];
        }
      }

      for (const cli of clisToTry) {
        try {
          execSync(\"which \" + cli.bin, { stdio: \"ignore\" });
          let cmd = cli.template.replace(/\\{prompt\\}/g, \"\$(cat \" + process.argv[1] + \")\");
          
          if (preferredModel) {
            cmd += \" --model \" + preferredModel;
          }
          
          if (process.argv[2]) {
            cmd += \" \" + process.argv[2];
          }
          const result = spawnSync(\"sh\", [\"-c\", cmd], { stdio: \"inherit\" });
          process.exit(result.status ?? 0);
        } catch (e) {}
      }
    } catch (e) {
      console.error(\"Error in invoke_agent:\", e.message);
    }
    process.exit(1);
  " "$prompt_file" "$extra_flags" "$task_class" "$task_size" || {
    local status=$?
    if [ $status -eq 1 ]; then
      echo -e "  ${YELLOW}Note:${NC} No AI CLI detected or invocation failed. Showing protocol:"
      cat "$prompt_file"
    else
      exit $status
    fi
  }
}

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
    shift
    invoke_agent "CONDUCTOR (THINK)" "docs/agents/THINK.md" "$*"
    ;;

  "exec")
    shift
    # Find focused task for routing
    FOCUSED_TASK_FILE=$(grep -l "Focus:yes" docs/tasks/*.md 2>/dev/null | head -n 1)
    TASK_CLASS=""
    TASK_SIZE=""
    if [ -n "$FOCUSED_TASK_FILE" ]; then
      META=$(grep "^\*\*Meta:\*\*" "$FOCUSED_TASK_FILE")
      TASK_SIZE=$(echo "$META" | cut -d'|' -f2 | tr -d ' ')
      TASK_CLASS=$(echo "$META" | cut -d'|' -f5 | tr -d ' ')
    fi
    invoke_agent "EXEC (DO)" "docs/agents/DO.md" "$*" "$TASK_CLASS" "$TASK_SIZE"
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
