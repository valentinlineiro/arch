#!/usr/bin/env bash
# arch-init — scaffolds ARCH framework into the current repository
# Usage: bash arch-init.sh [project-name] [--opt-in-telemetry]
# Or via npx: npx arch-init [project-name] [--opt-in-telemetry]

set -e

# ── Colors ────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; GRAY='\033[0;90m'; NC='\033[0m'

ARG1="."
OPT_IN_TELEMETRY=false

for arg in "$@"; do
  if [ "$arg" == "--opt-in-telemetry" ]; then
    OPT_IN_TELEMETRY=true
  elif [[ "$arg" != -* ]]; then
    ARG1="$arg"
  fi
done

# Handle project directory creation if ARG1 is not "."
if [ "$ARG1" != "." ]; then
  if [ ! -d "$ARG1" ]; then
    mkdir -p "$ARG1"
    echo -e "  ${GRAY}+${NC} created directory: $ARG1"
  fi
  cd "$ARG1"
fi

PROJECT=$(basename "$PWD")
DOCS_DIR="docs"

echo ""
echo -e "  ${GREEN}ARCH${NC} — initializing framework for: $PROJECT"
echo ""

# ── Init git if needed ────────────────────────────────────────────
if [ ! -d ".git" ]; then
  git init -q
  echo -e "  ${GRAY}+${NC} initialized git repo"
fi

# ── Create structure ──────────────────────────────────────────────
mkdir -p \
  "cli/dist" \
  "$DOCS_DIR/agents" \
  "$DOCS_DIR/adr" \
  "$DOCS_DIR/archive" \
  "$DOCS_DIR/tasks" \
  "$DOCS_DIR/guidelines" \
  "$DOCS_DIR/refinement" \
  "scripts"

# ── Download core files from GitHub ───────────────────────────────
BASE_URL="https://raw.githubusercontent.com/valentinlineiro/arch/main"

files=(
  "AGENTS.md"
  "arch.config.json"
  "cli/package.json"
  "cli/dist/index.js"
  "docs/KAIZEN-LOG.md"
  "docs/METRICS.md"
  "docs/TASK-FORMAT.md"
  "docs/agents/THINK.md"
  "docs/agents/DO.md"
  "docs/guidelines/core.md"
  "docs/guidelines/autonomy.md"
  "docs/adr/ADR-000-template.md"
  "scripts/arch.sh"
)

for file in "${files[@]}"; do
  dest="$file"
  if [ ! -f "$dest" ]; then
    mkdir -p "$(dirname "$dest")"
    curl -s "$BASE_URL/$file" -o "$dest"
    echo -e "  ${GRAY}+${NC} $file"
  else
    echo -e "  ${GRAY}~${NC} $file (already exists, skipping)"
  fi
done

# ── Symlinks for CLI compatibility ────────────────────────────────
echo ""
echo -e "  ${GRAY}Creating CLI compatibility symlinks...${NC}"

# Function to create symlink safely
create_symlink() {
  local target="$1"
  local link="$2"
  if [ ! -e "$link" ]; then
    ln -s "$target" "$link"
    echo -e "  ${GRAY}→${NC} $link"
  fi
}

create_symlink "AGENTS.md" "CLAUDE.md"
create_symlink "AGENTS.md" "GEMINI.md"

# ── Telemetry (Opt-in) ────────────────────────────────────────────
if [ "$OPT_IN_TELEMETRY" = true ]; then
  echo ""
  echo -e "  ${GREEN}Telemetry opted-in${NC}"
  
  if [ ! -f ".arch-local" ]; then
    UUID=$(node -e 'console.log(require("crypto").randomUUID())')
    echo "PROJECT_UUID=$UUID" > .arch-local
    echo -e "  ${GRAY}+${NC} generated project UUID"
  fi
  
  UUID=$(grep PROJECT_UUID .arch-local | cut -d= -f2)
  VERSION=$(node -e 'console.log(require("./arch.config.json").version)')
  ROUTING=$(node -e 'console.log(JSON.stringify(require("./arch.config.json").routing))')
  
  cat > registry.json << REGISTRY
{
  "uuid": "$UUID",
  "version": "$VERSION",
  "routing": $ROUTING
}
REGISTRY
  echo -e "  ${GRAY}+${NC} registry.json"
  
  # Push to registry (repository_dispatch)
  echo -e "  ${GRAY}Publishing to registry...${NC}"
  # Note: The endpoint and event_type are defined in TASK-095/TASK-096.
  #repository_dispatch requires authentication, so this curl will fail without a token
  # but we provide the logic as requested.
  curl -s -X POST -H "Accept: application/vnd.github.v3+json" \
    -H "Authorization: token ${GITHUB_TOKEN:-anonymous}" \
    https://api.github.com/repos/valentinlineiro/arch/dispatches \
    -d "{\"event_type\": \"project_registry\", \"client_payload\": $(cat registry.json)}" || true
fi

# ── .gitignore ────────────────────────────────────────────────────
if [ ! -f ".gitignore" ]; then
  cat > .gitignore << 'GITIGNORE'
# ARCH — local overrides
.arch-local

# Common
.DS_Store
*.env
.env.*
node_modules/
__pycache__/
*.pyc
GITIGNORE
  echo -e "  ${GRAY}+${NC} .gitignore"
elif ! grep -q "# ARCH" .gitignore; then
  printf '\n# ARCH — local overrides\n.arch-local\n' >> .gitignore
  echo -e "  ${GRAY}~${NC} .gitignore (appended)"
fi

# ── Initial commit ────────────────────────────────────────────────
echo ""
read -p "  Create initial commit? (y/n) " -n 1 -r REPLY
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git add -A
  git commit -m "chore: initialize ARCH framework" -q
  echo -e "  ${GREEN}✓${NC} Initial commit created"
fi

# ── Done ──────────────────────────────────────────────────────────
echo ""
echo -e "  ${GREEN}Done.${NC} Next steps:"
echo ""
echo -e "  ${GRAY}1.${NC} Edit   ${GRAY}docs/guidelines/core.md${NC}  — add your stack"
echo -e "  ${GRAY}2.${NC} Create ${GRAY}docs/tasks/TASK-001.md${NC}  — your first task"
echo -e "  ${GRAY}3.${NC} Run    ${GRAY}THINK mode${NC} to assess state:"
echo ""
echo -e "       ./scripts/arch.sh conduct"
echo ""
echo -e "  Docs: https://github.com/valentinlineiro/arch"
echo ""
