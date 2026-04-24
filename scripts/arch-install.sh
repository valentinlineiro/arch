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
ARCH_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$ARCH_DIR/docs/AGENTS.md" ]; then
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

# ── Copy docs/ ────────────────────────────────────────────────────
mkdir -p \
  "$TARGET/docs/agents" \
  "$TARGET/docs/adr" \
  "$TARGET/docs/archive"

files=(
  "docs/AGENTS.md"
  "docs/BACKLOG.md"
  "docs/SPRINT.md"
  "docs/DONE.md"
  "docs/DISPATCH.md"
  "docs/REFINEMENT.md"
  "docs/RETRO.md"
  "docs/GUIDELINES.md"
  "docs/ROUTING.md"
  "docs/agents/CONDUCTOR.md"
  "docs/agents/EXEC.md"
  "docs/agents/REFINE.md"
  "docs/agents/RETRO.md"
  "scripts/arch.sh"
  "docs/adr/ADR-000-template.md"
  "scripts/arch.sh"
)

for file in "${files[@]}"; do
  dest="$TARGET/$file"
  if [ -f "$dest" ]; then
    echo -e "  ${YELLOW}~${NC} $file (already exists, skipping)"
  else
    cp "$ARCH_DIR/$file" "$dest"
    echo -e "  ${GRAY}+${NC} $file"
  fi
done

# ── Symlinks for CLI compatibility ────────────────────────────────
echo ""
echo -e "  ${GRAY}Creating CLI symlinks...${NC}"

cd "$TARGET"

[ ! -e "AGENTS.md" ] && ln -s docs/AGENTS.md AGENTS.md \
  && echo -e "  ${GRAY}→${NC} AGENTS.md"
[ ! -e "CLAUDE.md" ] && ln -s docs/AGENTS.md CLAUDE.md \
  && echo -e "  ${GRAY}→${NC} CLAUDE.md"
[ ! -e "GEMINI.md" ] && ln -s docs/AGENTS.md GEMINI.md \
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
echo -e "  ${GRAY}1.${NC} Edit   $TARGET/docs/GUIDELINES.md  — add your stack"
echo -e "  ${GRAY}2.${NC} Write  $TARGET/docs/REFINEMENT.md  — your first idea"
echo -e "  ${GRAY}3.${NC} Run    CONDUCTOR to assess system state:"
echo ""
echo -e "       claude-code $TARGET/docs/agents/CONDUCTOR.md"
echo ""
