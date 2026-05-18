## TASK-943: fix arch.sh help and task-command help misalignment with can
**Meta:** P3 | XS | DONE | Focus:no | 2-code-generation | local | docs/tasks/
**Closed-at:** 2026-05-18T14:05:54.242Z
**Actor:** unknown
**Created-at:** 2026-05-18T14:05:31.541Z
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
_confidence: 0.56_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/event.ts _(core)_
- cli/src/main/ts/domain/repositories/task-repository.ts _(core)_

**ADRs:**
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-001: Use git as the primary state engine _(enforced)_
- ADR-002: Context as a budget, not a default _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
_Was the Relevant Context above useful?_
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

_If partial or off:_
- [ ] wrong files
- [ ] missing files
- [ ] wrong ADRs
- [ ] too much noise
- [ ] confidence misleading

#### Intent
fix arch.sh help and task-command help misalignment with canonical CLI commands

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes