## BUG: Review generates recursive "fix violations" tasks
**Author:** review | **Status:** OPEN | **Focus:** yes

### Problem
Large diff warning triggers TASK-117 creation, but archiving TASK-117 (1 file deletion) itself becomes a large diff, triggering the next violation task. Pattern: TASK-111, 113, 114, 117 all follow this cycle.

### Evidence
- docs/archive/TASK-111.md, TASK-113.md, TASK-114.md, TASK-117.md: all show identical "Large git diff" violations
- review-system.ts:35: triggers on large diffs
- Each archival creates a 1-file change that exceeds threshold

### Impact
Protocol feedback loop - system cannot self-heal without intervention.

### Priority
High