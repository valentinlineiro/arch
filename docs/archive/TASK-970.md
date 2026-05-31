## TASK-970: Define and document code quality audit process for agent-emi
**Meta:** P3 | S | DONE | Focus:no | 6-writing | local | docs/tasks/
**Turns:** 0
**Closed-at:** 2026-05-31T16:17:31.579Z
**Locked-commit:** ffc470e
**Actor:** unknown
**Created-at:** 2026-05-19T14:47:36.063Z
**Depends:** none

### Acceptance Criteria
- [x] Document exists at declared path
  - `file: docs/CODE-QUALITY-AUDIT.md`
- [x] Content is accurate and complete
  - `prose: reviewed and verified`
- [x] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context


### Relevant Context
_confidence: 0.47_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/services/deterministic-hansei-checker.ts _(core)_
- .arch/chronicle.jsonl _(utility)_
- docs/INBOX.md _(utility)_

**ADRs:**
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_
- Bugs without formal registration*(Sprint 3)*: `arch review` WARNs had no defined path to the backlog. TASK-041/042/043 were created manually after detection. The bug protocol (TASK-040) resolved this, but friction persisted throughout Sprint 2 and part of Sprint 3. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Define and document code quality audit process for agent-emitted code: specify complexity thresholds, linting rules that trigger manual review, refactoring sprint trigger conditions, and peer review protocol for hotspots. Initial audit of DriftChecker as first subject. Produce process doc.

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** CODE-QUALITY-AUDIT.md written: complexity thresholds (cyclomatic, line length, fan-in, nesting), linting rules triggering manual review (any casts, silent catch, parallel mutation, magic strings, nested async in loop), refactoring sprint trigger conditions, hotspot peer review protocol. First audit subject: drift-checker.ts — debt acknowledged, TASK-1036 is the refactor path.
**Constraint:** Sentinel check references arch sentinel but threshold enforcement is currently advisory only — not yet integrated into arch review exit code. That integration is TASK-1036 scope.
**Cost:** Process doc without tooling enforcement is advisory. Value increases when thresholds are wired into arch review.
**Forward Action:** Wire complexity thresholds into arch review (TASK-1036 or separate XS task).
