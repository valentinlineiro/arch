## TASK-951: --dry-run
**Meta:** P3 | S | READY | Focus:no | 2-code-generation | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [ ] Implementation file exists at declared context path
  - `file: (path)`
- [ ] Tests pass
  - `cmd: npm test; exit: 0`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.35_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
--dry-run

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes