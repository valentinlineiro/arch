#!/usr/bin/env bash
# arch-install — installs the ARCH CLI globally
# Usage: curl -fsSL https://raw.githubusercontent.com/valentinlineiro/arch/main/scripts/arch-init.sh | bash

set -e

GREEN='\033[0;32m'; GRAY='\033[0;90m'; NC='\033[0m'

echo ""
echo -e "  ${GREEN}ARCH${NC} — installing CLI"
echo ""

if ! command -v npm &>/dev/null; then
  echo "  Error: npm is required. Install Node.js from https://nodejs.org"
  exit 1
fi

npm install -g @valentinlineiro/arch

echo ""
echo -e "  ${GREEN}Done.${NC} Run ${GRAY}arch init${NC} in your repository to get started."
echo ""
