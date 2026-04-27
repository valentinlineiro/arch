#!/usr/bin/env bash
# arch-install.sh
# Adds ARCH framework to any existing or new git repo.
# Usage: bash arch-install.sh /path/to/your-repo
#        bash arch-install.sh .  (current directory)
#
# Run this script from inside the arch/ directory.

set -e

# ── Colors ────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; GRAY='\033[0;90m'; NC='\033[0m'

# ── Args ──────────────────────────────────────────────────────────
TARGET="${1:-.}"
ARCH_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$ARCH_DIR/AGENTS.md" ]; then
  echo "Error: run this script from inside the arch/ directory."
  exit 1
fi

TARGET="$(cd "$TARGET" && pwd)"

echo ""
echo -e "  ${GREEN}ARCH${NC} — Autonomous Routing and Context Hierarchy"
echo -e "  ${GRAY}Installing into: $TARGET${NC}"
echo ""

# ── Init git if needed ────────────────────────────────────────────
if [ ! -d "$TARGET/.git" ]; then
  git -C "$TARGET" init -q
  echo -e "  ${GRAY}+${NC} initialized git repo"
fi

# ── Copy core files ───────────────────────────────────────────────
mkdir -p \
  "$TARGET/cli/dist" \
  "$TARGET/docs/agents" \
  "$TARGET/docs/adr" \
  "$TARGET/docs/archive" \
  "$TARGET/docs/tasks" \
  "$TARGET/docs/guidelines" \
  "$TARGET/docs/refinement" \
  "$TARGET/scripts"

files=(
  "AGENTS.md"
  "arch.config.json"
  "cli/package.json"
  "cli/dist/index.js"
  "docs/DONE.md"
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
  dest="$TARGET/$file"
  if [ -f "$dest" ]; then
    echo -e "  ${YELLOW}~${NC} $file (already exists, skipping)"
  else
    mkdir -p "$(dirname "$dest")"
    cp "$ARCH_DIR/$file" "$dest"
    echo -e "  ${GRAY}+${NC} $file"
  fi
done

# ── Symlinks for CLI compatibility ────────────────────────────────
echo ""
echo -e "  ${GRAY}Creating CLI symlinks...${NC}"

cd "$TARGET"

[ ! -e "CLAUDE.md" ] && ln -s AGENTS.md CLAUDE.md \
  && echo -e "  ${GRAY}→${NC} CLAUDE.md"
[ ! -e "GEMINI.md" ] && ln -s AGENTS.md GEMINI.md \
  && echo -e "  ${GRAY}→${NC} GEMINI.md"

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
  git -C "$TARGET" add -A
  git -C "$TARGET" commit -m "chore: initialize ARCH framework" -q
  echo -e "  ${GREEN}✓${NC} Initial commit created"
fi

# ── Done ──────────────────────────────────────────────────────────
echo ""
echo -e "  ${GREEN}Done.${NC} Next steps:"
echo ""
echo -e "  ${GRAY}1.${NC} Edit   $TARGET/docs/guidelines/core.md — add your stack"
echo -e "  ${GRAY}2.${NC} Create $TARGET/docs/tasks/TASK-001.md  — your first task"
echo -e "  ${GRAY}3.${NC} Run    THINK mode to assess system state:"
echo ""
echo -e "       ./scripts/arch.sh conduct"
echo ""
