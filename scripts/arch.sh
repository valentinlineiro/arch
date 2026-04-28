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
  
  echo -e "  ${GREEN}ARCH${NC} — invoking ${mode_name} mode"
  
  node -e '
    const fs = require("fs");
    const { execSync, spawnSync } = require("child_process");
    try {
      const config = JSON.parse(fs.readFileSync("arch.config.json", "utf8"));
      for (const cli of config.clis) {
        try {
          execSync("which " + cli.bin, { stdio: "ignore" });
          let cmd = cli.template.replace(/\{prompt\}/g, "$(cat " + process.argv[1] + ")");
          if (process.argv[2]) {
            cmd += " " + process.argv[2];
          }
          const result = spawnSync("sh", ["-c", cmd], { stdio: "inherit" });
          process.exit(result.status ?? 0);
        } catch (e) {}
      }
    } catch (e) {}
    process.exit(1);
  ' "$prompt_file" "$extra_flags" || {
    local status=$?
    if [ $status -eq 1 ]; then
      echo -e "  ${YELLOW}Note:${NC} No AI CLI detected. Showing protocol:"
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
    invoke_agent "EXEC (DO)" "docs/agents/DO.md" "$*"
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
