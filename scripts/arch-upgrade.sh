#!/usr/bin/env bash
# arch-upgrade.sh
# Upgrades the ARCH CLI to the latest published version.
# Usage: bash arch-upgrade.sh
#        npm install -g @valentinlineiro/arch@latest  (equivalent)

set -e

GREEN='\033[0;32m'; GRAY='\033[0;90m'; NC='\033[0m'

echo ""
echo -e "  ${GREEN}ARCH${NC} — upgrading CLI"
echo ""

BEFORE=$(arch version 2>/dev/null || echo "unknown")
npm install -g @valentinlineiro/arch@latest
AFTER=$(arch version 2>/dev/null || echo "unknown")

echo ""
if [ "$BEFORE" = "$AFTER" ]; then
  echo -e "  ${GRAY}Already up to date (${AFTER})${NC}"
else
  echo -e "  ${GREEN}✓${NC} Upgraded ${BEFORE} → ${AFTER}"
fi

echo ""
