#!/usr/bin/env bash
# arch-upgrade.sh
# Upgrades ARCH framework files in an existing project to v0.4.0.
# SAFE: only touches framework files — never overwrites your tasks.
#
# Usage: bash arch-upgrade.sh /path/to/your-repo
#        bash arch-upgrade.sh .
#
# Run from inside the arch/ directory.

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; GRAY='\033[0;90m'; NC='\033[0m'

TARGET="${1:-.}"
ARCH_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$ARCH_DIR/AGENTS.md" ]; then
  echo "Error: run this script from inside the arch/ directory."
  exit 1
fi

TARGET="$(cd "$TARGET" && pwd)"

# Verify target has some ARCH structure
if [ ! -f "$TARGET/docs/AGENTS.md" ] && [ ! -f "$TARGET/AGENTS.md" ]; then
  echo -e "${RED}Error:${NC} ARCH structure not found in $TARGET"
  echo "Run arch-install.sh first."
  exit 1
fi

echo ""
echo -e "  ${GREEN}ARCH Upgrade (v0.4.0)${NC}"
echo -e "  ${GRAY}Target: $TARGET${NC}"
echo ""

# ── Migration: Legacy -> v0.4.0 ─────────────────────────────────────

migrate_file() {
  local src_rel="$1"
  local dest_rel="$2"
  if [ -f "$TARGET/$src_rel" ] && [ ! -f "$TARGET/$dest_rel" ]; then
    mkdir -p "$(dirname "$TARGET/$dest_rel")"
    mv "$TARGET/$src_rel" "$TARGET/$dest_rel"
    echo -e "  ${YELLOW}→${NC} migrated $src_rel to $dest_rel"
  fi
}

echo -e "  ${GRAY}Checking for legacy files...${NC}"
migrate_file "docs/agents/CONDUCTOR.md" "docs/agents/THINK.md"
migrate_file "docs/agents/EXEC.md" "docs/agents/DO.md"
[ -f "$TARGET/docs/agents/REFINE.md" ] && rm "$TARGET/docs/agents/REFINE.md" && echo -e "  ${GRAY}-${NC} removed legacy docs/agents/REFINE.md"
[ -f "$TARGET/docs/agents/HUMAN.md" ] && rm "$TARGET/docs/agents/HUMAN.md" && echo -e "  ${GRAY}-${NC} removed legacy docs/agents/HUMAN.md"
[ -f "$TARGET/docs/ROUTING.md" ] && rm "$TARGET/docs/ROUTING.md" && echo -e "  ${GRAY}-${NC} removed legacy docs/ROUTING.md (now in arch.config.json)"

# ── Files that are SAFE to upgrade (framework) ──────────────────
UPGRADEABLE=(
  "cli/dist/index.js"
  "cli/package.json"
  "docs/agents/THINK.md"
  "docs/agents/DO.md"
  "docs/adr/ADR-000-template.md"
  "docs/TASK-FORMAT.md"
  "scripts/arch.sh"
)

# ── New v0.4.0 files ──────────────────────────────────────────────
NEW_FILES=(
  "arch.config.json"
  "docs/KAIZEN-LOG.md"
  "docs/METRICS.md"
  "docs/guidelines/core.md"
  "docs/guidelines/autonomy.md"
)

echo ""
echo -e "  Upgrading framework files:"
echo ""

UPDATED=0

# Ensure directories exist
mkdir -p "$TARGET/cli/dist" "$TARGET/docs/tasks" "$TARGET/docs/archive" "$TARGET/docs/guidelines" "$TARGET/docs/refinement"

for file in "${UPGRADEABLE[@]}" "${NEW_FILES[@]}"; do
  src="$ARCH_DIR/$file"
  dest="$TARGET/$file"

  if [ ! -f "$src" ]; then continue; fi

  if [ ! -f "$dest" ]; then
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    echo -e "  ${GREEN}+${NC} $file (installed)"
    UPDATED=$((UPDATED + 1))
  elif diff -q "$src" "$dest" > /dev/null 2>&1; then
    echo -e "  ${GRAY}=${NC} $file (up to date)"
  else
    cp "$src" "$dest"
    echo -e "  ${GREEN}↑${NC} $file (updated)"
    UPDATED=$((UPDATED + 1))
  fi
done

# ── Symlinks ──────────────────────────────────────────────────────
echo ""
echo -e "  ${GRAY}Updating symlinks...${NC}"
cd "$TARGET"
[ -L "AGENTS.md" ] && rm "AGENTS.md"
[ ! -f "AGENTS.md" ] && cp "$ARCH_DIR/AGENTS.md" "AGENTS.md" && echo -e "  ${GREEN}+${NC} AGENTS.md (root)"
[ -L "CLAUDE.md" ] && rm "CLAUDE.md"
ln -s AGENTS.md CLAUDE.md && echo -e "  ${GRAY}→${NC} CLAUDE.md"
[ -L "GEMINI.md" ] && rm "GEMINI.md"
ln -s AGENTS.md GEMINI.md && echo -e "  ${GRAY}→${NC} GEMINI.md"

# ── Final check ──────────────────────────────────────────────────
echo ""
legacy_root_docs=()
for file in docs/*.md; do
  [ -e "$file" ] || continue
  base="$(basename "$file")"
  case "$base" in
    KAIZEN-LOG.md|METRICS.md|TASK-FORMAT.md)
      ;;
    *)
      legacy_root_docs+=("$base")
      ;;
  esac
done

if [ ${#legacy_root_docs[@]} -gt 0 ]; then
  echo -e "${YELLOW}Warning:${NC} Legacy root-level docs found: ${legacy_root_docs[*]}"
  echo -e "         Please migrate task content to docs/tasks/TASK-XXX.md"
  echo -e "         following the v0.4.0 Focus-based model."
fi

echo ""
echo -e "  ${GREEN}Upgrade complete.${NC}"
echo ""
