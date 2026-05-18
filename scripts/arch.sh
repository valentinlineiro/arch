#!/usr/bin/env bash
# arch.sh — fallback shim if 'arch' binary is not on PATH
# Install:  cd cli && npm run upgrade   (builds + links globally)
# Upgrade:  cd cli && npm run upgrade   (same command after CLI changes)

set -e

export LC_ALL=C
BIN="node $(dirname "$0")/../cli/dist/index.js"

exec $BIN "$@"
