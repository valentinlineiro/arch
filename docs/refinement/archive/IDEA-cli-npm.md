# IDEA: Ship CLI as standalone npm package
**Created:** 2026-05-12
**Source:** Internal discussion — user feedback
**Status:** DRAFT
**Sessions:** 2
**Meta:** P2 | M | local | cli/

- **Class:** 6-writing
- **Size:** M

## Problem

Current CLI requires manual install (`npm install && npm run build`) and Node.js runtime. Users want simpler cross-platform installation.

## Proposed Solution

Publish CLI as standalone package with pre-built binaries:

1. Add `esbuild` bundler to produce portable executable
2. Update build script to bundle all deps into single binary
3. Change package.json to ship binary via npm package
4. Publish to npm registry

## Source

Internal discussion — user feedback

---

**Promoted by:** human
**Promoted on:**

## Decision
REJECT: TTL expired — archived without human engagement across multiple THINK sessions.
