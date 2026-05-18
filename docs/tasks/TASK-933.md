## TASK-933: Repair corpus drift in TASK-249, TASK-919, TASK-258
**Meta:** P2 | XS | IN_PROGRESS | Focus:yes | 9-audit | claude | docs/tasks/TASK-249.md, docs/tasks/TASK-919.md, docs/tasks/TASK-258.md

### Context

Promoted from IDEA-corpus-drift-repair (TASK-927 audit, finding 7).

Three tasks in committed state produce persistent `arch review` warnings:

- **TASK-249** (`READY | Focus:yes`): focus assigned to a non-executing task. Also missing `## Hansei` section.
- **TASK-919** (`IN_PROGRESS | Focus:no`): agent executing without focus sovereignty.
- **TASK-258**: Acceptance Criteria items are not in `- [ ]` checkbox format; missing `## Hansei` section.

All three are pure metadata corrections. If investigation reveals any fix requires a protocol change rather than metadata cleanup, stop, split that sub-fix out, and continue with the remainder.

### Acceptance Criteria

- [ ] `FocusStatusAlignment` produces no warning for TASK-249 (READY → Focus:no).
  - `cmd: arch review` — no TASK-249 line under FocusStatusAlignment
- [ ] `FocusStatusAlignment` produces no warning for TASK-919 (IN_PROGRESS → Focus:yes).
  - `cmd: arch review` — no TASK-919 line under FocusStatusAlignment
- [ ] `TaskTemplateCompliance` produces no warning for TASK-249 (Hansei stub added).
  - `cmd: arch review` — no TASK-249 line under TaskTemplateCompliance
- [ ] `TaskTemplateCompliance` produces no warning for TASK-258 (AC format fixed + Hansei stub added).
  - `cmd: arch review` — no TASK-258 line under TaskTemplateCompliance
- [ ] `arch review` warning count does not increase as a result of these fixes.

### Definition of Done
- [ ] All ACs verified by Auditor via `arch review` output.
- [ ] No new warnings introduced.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Placeholder — to be filled at close.
**Constraint:** Placeholder — to be filled at close.
**Cost:** Placeholder — to be filled at close.
**Forward Action:** Placeholder — to be filled at close.
