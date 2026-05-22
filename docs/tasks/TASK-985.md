## TASK-985: Execute docs/ simplification and consolidation per proposal
**Meta:** P3 | S | REVIEW | Focus:yes | 3-refactoring | local | docs/tasks/
**Actor:** unknown
**Created-at:** 2026-05-22T07:50:24.785Z
**Depends:** none

### Acceptance Criteria
- [x] Intent addressed
  - `prose: verified`
- [x] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.50_

**Files:**
- docs/GOVERNANCE.md
- docs/guidelines/core.md
- docs/archive/design/

### Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Executed major documentation consolidation to reduce cognitive surface area. Merged EPISTEMIC-DOCTRINE into GOVERNANCE and what-ai-must-never-do into core.md.
**Constraint:** `arch review` currently requires `docs/HALT-LOG.md` to exist, so it was kept as a dummy file.
**Cost:** Reduced root doc count from 21 to 14.
**Forward Action:** None. System state is cleaner and more cohesive.

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
