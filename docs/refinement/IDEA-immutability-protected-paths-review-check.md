# IDEA: Add protected_paths to arch.config.json and enforce via arch review
**Created:** 2026-04-30
**Source:** Human proposal (IMMUTABILITY protocol) — no machine-checkable guard against editing core architectural paths without an ADR
**Status:** DRAFT
**Meta:** P2 | M | local | cli/src/, arch.config.json, docs/adr/

## Problem
ADRs protect architectural decisions conceptually but nothing blocks an agent from editing a protected path (e.g. `docs/adr/`, `arch.config.json`, `cli/src/domain/`) without a linked ADR. Small "cleanup" tasks can cause architectural erosion over time with no automated guard.

## Proposed solution
Add a `protectedPaths` array to `arch.config.json`:

```json
"protectedPaths": [
  "docs/adr/",
  "cli/src/domain/",
  "arch.config.json"
]
```

Add a new `arch review` check (`Immutability`) that scans the most recent commit: if it touches a protected path, verify the commit message references an ADR (e.g. `ADR-XXX`) or a task that has an ADR in its ACs. If neither is present, emit a WARN.

This is not a hard block (agents can still commit) but makes the violation visible in the next review cycle.

## Dependencies
None — extends existing `arch review` infrastructure.

## Estimated size
M

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
