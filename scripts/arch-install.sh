#!/usr/bin/env bash
# arch-install.sh
# Installs the ARCH CLI globally and scaffolds a governed repository.
# Usage: bash arch-install.sh [/path/to/your-repo]
#        bash arch-install.sh .  (current directory)

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; GRAY='\033[0;90m'; NC='\033[0m'

TARGET="${1:-.}"

echo ""
echo -e "  ${GREEN}ARCH${NC} — Autonomous Routing and Context Hierarchy"
echo ""

# ── Install CLI globally ──────────────────────────────────────────
if command -v arch &>/dev/null && arch version &>/dev/null 2>&1; then
  CURRENT=$(arch version 2>/dev/null || echo "unknown")
  echo -e "  ${GRAY}arch CLI already installed (${CURRENT})${NC}"
else
  echo -e "  ${GRAY}Installing @valentinlineiro/arch...${NC}"
  npm install -g @valentinlineiro/arch
  echo -e "  ${GREEN}✓${NC} arch CLI installed"
fi

echo ""

# ── Scaffold governed repo ────────────────────────────────────────
TARGET="$(cd "$TARGET" && pwd)"
echo -e "  ${GRAY}Scaffolding: $TARGET${NC}"
echo ""

arch init "$TARGET"

echo ""
echo -e "  ${GREEN}Done.${NC}"
echo ""
echo -e "  ${GRAY}Next steps:${NC}"
echo -e "  ${GRAY}1.${NC} Edit   $TARGET/docs/guidelines/core.md — add your stack"
echo -e "  ${GRAY}2.${NC} Create your first task: arch task capture \"<intent>\""
echo -e "  ${GRAY}3.${NC} Run governance: arch govern reflect"
echo ""
