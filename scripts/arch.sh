#!/usr/bin/env bash

set -e

# Colors
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; GRAY='\033[0;90m'; NC='\033[0m'

# Configuration
BIN="node $(dirname "$0")/../cli/dist/index.js"

# Agent Invoker
invoke_agent() {
  local mode_name=$1
  local prompt_file=$2
  local extra_flags=$3
  local task_class=$4
  local task_size=$5

  echo -e "  ${GREEN}ARCH${NC} — invoking ${mode_name} mode"

  node -e "
    const fs = require('fs');
    const os = require('os');
    const { execSync, spawnSync } = require('child_process');

    const promptFile = '$prompt_file';
    const taskClass = '$task_class';
    const taskSize = '$task_size';
    const extraFlags = '$extra_flags';

    try {
      const config = JSON.parse(fs.readFileSync('arch.config.json', 'utf8'));

      let preferredCliName = null;
      if (taskClass && config.routing && config.routing[taskClass]) {
        preferredCliName = config.routing[taskClass];
      }

      let preferredModel = null;
      if (taskSize && config.governance && config.governance.modelTiers && config.governance.modelTiers[taskSize]) {
        preferredModel = config.governance.modelTiers[taskSize];
      }

      const hasOpencode = config.clis.some(c => c.name === 'opencode');
      if (!hasOpencode) {
        config.clis.push({
          name: 'opencode',
          bin: 'opencode',
          template: 'opencode run {prompt}'
        });
      }

      let clisToTry = config.clis;
      if (preferredCliName && preferredCliName !== 'local') {
        const found = config.clis.find(c => c.name === preferredCliName);
        if (found) {
          clisToTry = [found, ...config.clis.filter(c => c.name !== preferredCliName && c.name !== 'opencode'), ...config.clis.filter(c => c.name === 'opencode')];
        }
      }

      const pathEnv = process.env.PATH || '';
      const promptContent = fs.readFileSync(promptFile, 'utf8');

      for (const cli of clisToTry) {
        try {
          execSync('type ' + cli.bin, { stdio: 'ignore', shell: true, env: { PATH: pathEnv } });
        } catch (e) {
          continue;
        }

        let cmd;
        if (cli.name === 'opencode') {
          const tf = os.tmpdir() + '/arch-prompt-' + Date.now() + '.md';
          fs.writeFileSync(tf, promptContent);
          cmd = 'opencode run < ' + tf;
        } else {
          const tf = os.tmpdir() + '/arch-prompt-' + Date.now() + '.md';
          fs.writeFileSync(tf, promptContent);
          cmd = cli.template.replace(/{prompt}/g, tf);
          if (preferredModel) {
            cmd = cmd + ' --model ' + preferredModel;
          }
        }

        if (extraFlags) {
          cmd = cmd + ' ' + extraFlags;
        }

        const result = spawnSync('sh', ['-c', cmd], { stdio: 'inherit', env: { ...process.env, PATH: pathEnv } });

        if (result.status !== 0 && cli.name !== 'opencode') {
          console.error('  ' + cli.bin + ' exited with status ' + result.status + ', trying next...');
          continue;
        }
        process.exit(result.status ?? 0);
      }
      throw new Error('No working CLI found');
    } catch (e) {
      console.error('Error in invoke_agent:', e.message);
    }
    process.exit(1);
  " || {
    local status=$?
    if [ $status -eq 1 ]; then
      echo -e "  ${YELLOW}Note:${NC} No AI CLI detected or invocation failed. Showing protocol:"
      cat "$prompt_file"
    else
      exit $status
    fi
  }
}

# Router
case "$1" in
  "status"|"validate"|"inbox"|"next"|"govern"|"rank"|"batch"|"drain"|"version"|"--version"|"-v")
    $BIN "$@"
    ;;

  "review")
    PUSH=false
    for arg in "$@"; do
      if [ "$arg" == "--push" ]; then
        PUSH=true
      fi
    done

    $BIN "$@"

    if [ "$PUSH" = true ]; then
      echo ""
      echo -e "  ${GREEN}✓${NC} Review passed. Pushing to remote..."
      git push
    fi
    ;;

  "task")
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

    if [ "$2" == "done" ]; then
      echo ""
      $0 govern
    fi
    ;;

  "archive")
    shift
    $0 task done "$@"
    ;;

  "conduct")
    shift
    invoke_agent "CONDUCTOR (THINK)" "docs/agents/THINK.md" "$*"
    ;;

  "exec")
    shift
    FOCUSED_TASK_FILE=$(grep -l "Focus:yes" docs/tasks/*.md 2>/dev/null | head -n 1)
    TASK_CLASS=""
    TASK_SIZE=""
    TASK_ID=""
    if [ -n "$FOCUSED_TASK_FILE" ]; then
      TASK_ID=$(basename "$FOCUSED_TASK_FILE" .md)
      META=$(grep "^\*\*Meta:\*\*" "$FOCUSED_TASK_FILE")
      TASK_SIZE=$(echo "$META" | cut -d'|' -f2 | tr -d ' ')
      TASK_CLASS=$(echo "$META" | cut -d'|' -f6 | tr -d ' ')
    fi

    SHOULD_BATCH=$(node -e "
      const fs = require('fs');
      try {
        const config = JSON.parse(fs.readFileSync('arch.config.json', 'utf8'));
        const batchEnabled = config.governance?.batchWritingTasks === true;
        const matchesCriteria = '$TASK_CLASS' === '6-writing' && '$TASK_SIZE' === 'XS';
        console.log(batchEnabled && matchesCriteria);
      } catch (e) {
        console.log(false);
      }
    ")

    if [ "$SHOULD_BATCH" == "true" ]; then
      echo -e "  ${YELLOW}BATCH${NC} — queuing ${TASK_ID} for Anthropic Batch API"
      $BIN batch add "$TASK_ID" "docs/agents/DO.md"
    else
      invoke_agent "EXEC (DO)" "docs/agents/DO.md" "$*" "$TASK_CLASS" "$TASK_SIZE"
    fi
    ;;

  *)
    echo "Usage: $0 [status|validate|review|inbox|next|govern|rank|batch|drain|archive|task|version|conduct|exec]"
    echo ""
    echo "Commands:"
    echo "  status     Show task counts"
    echo "  validate   Check repository structure"
    echo "  review     Run deep audit and drift check"
    echo "  inbox      Show weekly dashboard"
    echo "  next       Suggest the next task"
    echo "  govern     Autonomous governance tick"
    echo "  rank       Rank READY tasks by Value/Size ratio"
    echo "  batch      Manage batch queue"
    echo "  drain      Submit and process batch queue"
    echo "  archive    Alias for task done"
    echo "  task       Manage tasks (start/done)"
    echo "  version    Show current version"
    echo "  conduct    Invoke THINK mode with an AI agent"
    echo "  exec       Invoke DO mode with an AI agent"
    exit 1
    ;;
esac