## TASK-917: Fix MetricsEngine calibration: accept IN_PROGRESS->DONE as valid completion
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 1-code-reasoning | claude-code | cli/src/main/ts/domain/services/metrics-engine.ts

**Depends:** none

### Context

`arch report` exits 1 with "CRITICAL INTEGRITY BREACH" because `MetricsEngine.calibrateTask()` only recognises `REVIEW -> DONE` as a valid completion event. Tasks closed via `arch task done` from IN_PROGRESS status (L3 self-archive or direct close) produce an `IN_PROGRESS -> DONE` event in `docs/EVENTS.md` — which the calibrator doesn't match. Since `completedAt` is set post-EventLogger-activation, these tasks hit the "logistics-governance gap" branch and are marked INVALID. One INVALID task makes the whole report INVALID.

### Acceptance Criteria

- [ ] `MetricsEngine.calibrateTask()` accepts both `REVIEW -> DONE` and `IN_PROGRESS -> DONE` as valid completion transitions. Filter updated from `e.transition === 'REVIEW -> DONE'` to include both.
  - `file: cli/src/main/ts/domain/services/metrics-engine.ts`

- [ ] `arch report` exits 0 after the fix. No CRITICAL INTEGRITY BREACH.
  - `prose: verified by running arch report after fix`

- [ ] Unit test: task with `IN_PROGRESS -> DONE` event gets HIGH or MEDIUM integrity (not INVALID).
  - `cmd: npm test`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
