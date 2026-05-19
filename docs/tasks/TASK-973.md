## TASK-973: formalize the external experiment protocol for ARCH validati
**Meta:** P3 | S | READY | Focus:no | 1-documentation-only | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [ ] Intent addressed
  - `prose: verified`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.49_

**Files:**
- cli/src/main/ts/domain/repositories/task-repository.ts _(core)_
- cli/src/main/ts/domain/services/task-validator.ts _(core)_
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_
- cli/src/main/ts/application/use-cases/validate-system.ts _(domain)_

**ADRs:**
- ADR-001: Use git as the primary state engine _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-025: Two-Track Versioning Architecture _(enforced)_

**Failure Patterns:**
- Bugs without formal registration*(Sprint 3)*: `arch review` WARNs had no defined path to the backlog. TASK-041/042/043 were created manually after detection. The bug protocol (TASK-040) resolved this, but friction persisted throughout Sprint 2 and part of Sprint 3. _(docs/KAIZEN-LOG.md)_
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
formalize the external experiment protocol for ARCH validation

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes