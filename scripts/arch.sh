#!/usr/bin/env bash
# ARCH CLI Entry Point
# Directs to the compiled TypeScript distribution

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node "$ROOT/cli/dist/index.js" "$@"
