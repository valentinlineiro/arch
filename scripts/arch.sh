#!/usr/bin/env bash
# arch.sh — local dev shim while the CLI binary is not on PATH
# Run once: cd cli && npm install && npm run build && npm link
# After linking, 'arch' runs directly — this script is no longer needed.

set -e

export LC_ALL=C
BIN="node $(dirname "$0")/../cli/dist/index.js"

exec $BIN "$@"
