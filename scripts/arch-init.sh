#!/usr/bin/env bash
# arch-init — scaffolds ARCH framework into the current repository
# Usage: bash arch-init.sh [project-name]
# Or via npx: npx arch-init [project-name]

set -e

PROJECT=${1:-$(basename "$PWD")}
DOCS_DIR="docs"
GREEN='\033[0;32m'
GRAY='\033[0;90m'
NC='\033[0m'

echo ""
echo "  ARCH — initializing framework for: $PROJECT"
echo ""

# Create directory structure
mkdir -p "$DOCS_DIR/agents" "$DOCS_DIR/adr" "$DOCS_DIR/archive"

# Download core files from GitHub
BASE_URL="https://raw.githubusercontent.com/valentinlineiro/arch/main"

files=(
  "docs/AGENTS.md"
  "docs/BACKLOG.md"
  "docs/SPRINT.md"
  "docs/DONE.md"
  "docs/REFINEMENT.md"
  "docs/RETRO.md"
  "docs/GUIDELINES.md"
  "docs/ROUTING.md"
  "docs/agents/EXEC.md"
  "docs/agents/REFINE.md"
  "docs/agents/RETRO.md"
  "docs/adr/ADR-000-template.md"
)

for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    curl -s "$BASE_URL/$file" -o "$file"
    echo -e "  ${GRAY}+${NC} $file"
  else
    echo -e "  ${GRAY}~${NC} $file (already exists, skipping)"
  fi
done

# Create symlinks for CLI compatibility
echo ""
echo "  Creating CLI compatibility symlinks..."

[ ! -f "AGENTS.md" ]  && ln -s docs/AGENTS.md AGENTS.md  && echo -e "  ${GRAY}→${NC} AGENTS.md → docs/AGENTS.md"
[ ! -f "CLAUDE.md" ]  && ln -s docs/AGENTS.md CLAUDE.md  && echo -e "  ${GRAY}→${NC} CLAUDE.md → docs/AGENTS.md"
[ ! -f "GEMINI.md" ]  && ln -s docs/AGENTS.md GEMINI.md  && echo -e "  ${GRAY}→${NC} GEMINI.md → docs/AGENTS.md"

# Add .gitignore entry if needed
if [ -f ".gitignore" ] && ! grep -q "# ARCH" .gitignore; then
  echo "" >> .gitignore
  echo "# ARCH — local overrides" >> .gitignore
  echo ".arch-local" >> .gitignore
fi

echo ""
echo -e "  ${GREEN}Done.${NC} Next steps:"
echo ""
echo "  1. Edit docs/GUIDELINES.md — add your stack and core conventions"
echo "  2. Add your first idea to docs/REFINEMENT.md"
echo "  3. Run your AI CLI with: arch refine"
echo "     (or manually: claude-code docs/agents/REFINE.md docs/REFINEMENT.md)"
echo ""
echo "  Docs: https://github.com/valentinlineiro/arch"
echo ""
