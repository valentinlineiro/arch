## TASK-933: Repair corpus drift in TASK-249, TASK-919, TASK-258
**Meta:** P2 | XS | DONE | Focus:yes | 9-audit | claude | docs/tasks/TASK-249.md, docs/tasks/TASK-919.md, docs/tasks/TASK-258.md | Closed-at: 2026-05-18T12:00:00Z

### Context

Promoted from IDEA-corpus-drift-repair (TASK-927 audit, finding 7).

Three tasks in committed state produce persistent `arch review` warnings:

- **TASK-249** (`READY | Focus:yes`): focus assigned to a non-executing task. Also missing `## Hansei` section.
- **TASK-919** (`IN_PROGRESS | Focus:no`): agent executing without focus sovereignty.
- **TASK-258**: Acceptance Criteria items are not in `- [ ]` checkbox format; missing `## Hansei` section.

All three are pure metadata corrections. If investigation reveals any fix requires a protocol change rather than metadata cleanup, stop, split that sub-fix out, and continue with the remainder.

### Acceptance Criteria

- [x] `FocusStatusAlignment` produces no warning for TASK-249 (READY → Focus:no).
  - `cmd: arch review` — no TASK-249 line under FocusStatusAlignment
- [x] `FocusStatusAlignment` produces no warning for TASK-919 (IN_PROGRESS → Focus:yes).
  - `cmd: arch review` — no TASK-919 line under FocusStatusAlignment
- [x] `TaskTemplateCompliance` produces no warning for TASK-249 (Hansei stub added).
  - `cmd: arch review` — no TASK-249 line under TaskTemplateCompliance
- [x] `TaskTemplateCompliance` produces no warning for TASK-258 (AC format fixed + Hansei stub added).
  - `cmd: arch review` — no TASK-258 line under TaskTemplateCompliance
- [x] `arch review` warning count does not increase as a result of these fixes (dropped from 18 to 15 items under TaskTemplateCompliance).

### Definition of Done
- [x] All ACs verified by Auditor via `arch review` output.
- [x] No new warnings introduced.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Three metadata violations cleared: TASK-249 Focus:yes→no, TASK-919 Focus:no→yes, TASK-258 AC format converted and Hansei stub added. No protocol changes required.
**Constraint:** Remaining TaskTemplateCompliance warnings (TASK-259 through TASK-284) are pre-existing — beyond this task's scope.
**Cost:** Zero — pure metadata edits, no implementation risk.
**Forward Action:** TASK-927 can close once TASK-930, 931, 932 are done. TaskTemplateCompliance residual backlog tracked by IDEA-tiered-obligations (once promoted).
