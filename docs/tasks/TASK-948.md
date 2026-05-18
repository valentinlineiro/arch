## TASK-948: Enhance CLI UX with interactivity and local dashboard
**Meta:** P3 | S | READY | Focus:no | 7-operations | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [ ] Operation completes without error
  - `cmd: (command); exit: 0`
- [ ] Output exists at expected path
  - `file: (path)`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.35_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_

**Guidelines:**
- testing-a-change.md
- core.md

**Failure Patterns:**
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Enhance CLI UX with interactivity and local dashboard

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes