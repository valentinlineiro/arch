## TASK-123: Review generates recursive "fix violations" tasks
**Meta:** P0 | XS | 8 | READY | Focus:yes | 7-operations | local | docs/archive/, cli/src/main/ts/application/use-cases/review-system.ts

## Problem
Large diff warning triggers TASK-XXX creation, but archiving that task (1 file deletion) itself becomes a large diff, triggering the next violation task. Pattern: TASK-111, 113, 114, 117 all follow this cycle.

## Evidence
- docs/archive/TASK-111.md, TASK-113.md, TASK-114.md, TASK-117.md: all show identical "Large git diff" violations
- review-system.ts:35: triggers on large diffs
- Each archival creates a 1-file change that exceeds threshold

## Impact
Protocol feedback loop — system cannot self-heal without intervention.

## Acceptance Criteria
- [ ] Archiving a task is excluded from diff size calculation
- [ ] `arch review` can pass without triggering new violation tasks
- [ ] No recursive violation pattern in archive/