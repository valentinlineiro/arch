## TASK-970: Define and document code quality audit process for agent-emi
**Meta:** P3 | S | READY | Focus:no | 6-writing | local | docs/tasks/
**Actor:** unknown
**Created-at:** 2026-05-19T14:47:36.063Z
**Depends:** none

### Acceptance Criteria
- [ ] Document exists at declared path
  - `file: (path)`
- [ ] Content is accurate and complete
  - `prose: reviewed and verified`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.46_

**Files:**
- cli/src/main/ts/application/use-cases/drift-checker.ts _(domain)_
- cli/src/main/ts/domain/services/deterministic-hansei-checker.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/repositories/task-repository.ts _(core)_
- cli/src/main/ts/domain/repositories/git-repository.ts _(core)_

**ADRs:**
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_
- ADR-023: Deterministic Gate Invariant _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_
- Bugs without formal registration*(Sprint 3)*: `arch review` WARNs had no defined path to the backlog. TASK-041/042/043 were created manually after detection. The bug protocol (TASK-040) resolved this, but friction persisted throughout Sprint 2 and part of Sprint 3. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Define and document code quality audit process for agent-emitted code: specify complexity thresholds, linting rules that trigger manual review, refactoring sprint trigger conditions, and peer review protocol for hotspots. Initial audit of DriftChecker as first subject. Produce process doc.

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes