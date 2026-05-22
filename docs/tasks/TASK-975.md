## TASK-975: Bug: arch govern INTEGRITY_FIX writes ledger entry but does 
**Meta:** P3 | XS | REVIEW | Focus:yes | 2-code-generation | local | docs/tasks/
**Actor:** unknown
**Created-at:** 2026-05-20T13:25:51.423Z
**Depends:** none

### Acceptance Criteria
- [x] Implementation file exists at declared context path
  - `file: cli/src/main/ts/application/use-cases/govern-system.ts`
- [x] Tests pass
  - `cmd: cd cli && npm test; exit: 0`
- [x] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.51_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/application/use-cases/govern-system.ts _(core)_
- cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts _(core)_

**ADRs:**
- ADR-020: Focus sovereignty model

### Context Feedback
- [x] accurate — files and ADRs were on-target

#### Intent
Bug: arch govern INTEGRITY_FIX writes ledger entry but does not rewrite Focus:yes to Focus:no in archived task files, causing the same set of archived tasks to trigger INTEGRITY_FIX on every govern tick

### Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Systemic truthy check on string-based enums ('NONE' is truthy) caused broad misidentification of focused tasks. Hardcoded paths prevented updates to archived tasks.
**Constraint:** FocusLevel enum uses strings; comparisons must be explicit.
**Cost:** Significant ledger bloat and stale focus state in archives.
**Forward Action:** Fixed truthy checks in govern-system.ts, generate-inbox.ts, select-next-task.ts, and markdown-task-repository.ts. Use explicit enum comparison.

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
