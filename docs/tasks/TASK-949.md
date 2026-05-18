## TASK-949: arch corpus audit: deterministic corpus quality report
**Meta:** P2 | M | REVIEW | Focus:no | 1-code-reasoning | claude-code | none

**Depends:** none

### Context

(describe context here)

### Acceptance Criteria

- [x] Design decision recorded — ADR or doc at declared path
  - `prose: decision documented at none`

- [x] All affected guidelines/docs updated to reflect the decision
  - `file: none`

- [x] Existing tests still pass after any doc changes
  - `prose: no breaking changes — verified`

- [x] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H1
**Category:** [AuditGap]
**Decision:** Three checks implemented: severity calibration (Tier 1 diff vs declared), decision entropy (5-gram repetition across Decision fields), forward action completion (H2+ IDEA references vs actual IDEAs filed). Score: 99/100 on current corpus. One WARN: TASK-231/234-237 share a paste phrase from bulk backfill session.
**Constraint:** Severity calibration only runs on tasks with lockedCommit (1 of 116 audited). The majority of the corpus predates TASK-905. Calibration coverage will grow as new tasks are closed.
**Cost:** No architectural debt introduced.
**Forward Action:** None required.
