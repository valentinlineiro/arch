#!/usr/bin/env bash
# arch-upgrade.sh
# Upgrades ARCH framework files in an existing project.
# SAFE: only touches agent protocols and routing — never project state.
#
# Usage: bash arch-upgrade.sh /path/to/your-repo
#        bash arch-upgrade.sh .
#
# Run from inside the arch/ directory.

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; GRAY='\033[0;90m'; NC='\033[0m'

TARGET="${1:-.}"
ARCH_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$ARCH_DIR/docs/AGENTS.md" ]; then
  echo "Error: run this script from inside the arch/ directory."
  exit 1
fi

TARGET="$(cd "$TARGET" && pwd)"

# Verify target has ARCH installed
if [ ! -f "$TARGET/docs/agents/CONDUCTOR.md" ]; then
  echo -e "${RED}Error:${NC} ARCH not found in $TARGET"
  echo "Run arch-install.sh first."
  exit 1
fi

echo ""
echo -e "  ${GREEN}ARCH Upgrade${NC}"
echo -e "  ${GRAY}Target: $TARGET${NC}"
echo ""

# ── Files that are SAFE to upgrade (framework, not project state) ──
UPGRADEABLE=(
  "docs/agents/CONDUCTOR.md"
  "docs/agents/EXEC.md"
  "docs/agents/REFINE.md"
  "docs/agents/RETRO.md"
  "docs/ROUTING.md"
  "docs/adr/ADR-000-template.md"
)

# ── Files that are NEVER touched (project state) ──────────────────
# docs/BACKLOG.md    — your tasks
# docs/SPRINT.md     — your active sprint
# docs/DONE.md       — your history
# docs/DISPATCH.md   — generated state
# docs/RETRO.md      — your retrospectives
# docs/REFINEMENT.md — your ideas
# docs/GUIDELINES.md — your approved rules (CORE section may differ)

echo -e "  Upgrading framework files (agent protocols + routing):"
echo ""

UPDATED=0
SKIPPED=0

for file in "${UPGRADEABLE[@]}"; do
  src="$ARCH_DIR/$file"
  dest="$TARGET/$file"

  if [ ! -f "$src" ]; then
    echo -e "  ${YELLOW}?${NC} $file (not found in source, skipping)"
    continue
  fi

  if [ ! -f "$dest" ]; then
    cp "$src" "$dest"
    echo -e "  ${GREEN}+${NC} $file (new)"
    UPDATED=$((UPDATED + 1))
  elif diff -q "$src" "$dest" > /dev/null 2>&1; then
    echo -e "  ${GRAY}=${NC} $file (unchanged)"
    SKIPPED=$((SKIPPED + 1))
  else
    # Show diff summary before overwriting
    DIFF_LINES=$(diff "$dest" "$src" | grep -c '^[<>]' || true)
    cp "$src" "$dest"
    echo -e "  ${GREEN}↑${NC} $file (${DIFF_LINES} lines changed)"
    UPDATED=$((UPDATED + 1))
  fi
done

# ── GUIDELINES.md: upgrade CORE section only ──────────────────────
echo ""
echo -e "  ${GRAY}Note: docs/GUIDELINES.md not touched.${NC}"
echo -e "  ${GRAY}If ARCH updated its CORE rules, review CHANGELOG.md${NC}"
echo -e "  ${GRAY}and apply manually to preserve your project-specific rules.${NC}"

# ── Commit ────────────────────────────────────────────────────────
echo ""
if [ "$UPDATED" -gt 0 ]; then
  read -p "  Commit upgrade? (y/n) " -n 1 -r REPLY
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$TARGET"
    git add docs/agents/ docs/ROUTING.md docs/adr/
    git commit -m "chore: upgrade ARCH framework files" -q
    echo -e "  ${GREEN}✓${NC} Committed"
  fi
else
  echo -e "  ${GRAY}Already up to date.${NC}"
fi

echo ""
echo -e "  ${GREEN}Done.${NC} $UPDATED file(s) updated, $SKIPPED unchanged."
echo ""
echo -e "  ${GRAY}Project state files untouched:${NC}"
echo -e "  ${GRAY}BACKLOG, SPRINT, DONE, DISPATCH, RETRO, REFINEMENT, GUIDELINES${NC}"
echo ""
