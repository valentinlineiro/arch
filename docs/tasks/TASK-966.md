## TASK-966: Implement THINK-generated promotion proposals: when IDEA ent
**Meta:** P2 | M | IN_PROGRESS | Focus:yes | 2-code-generation | local | docs/tasks/
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
_confidence: 0.44_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/models/reflect-decision.ts _(core)_
- cli/src/main/ts/application/use-cases/validate-task-acs.ts _(domain)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_
- Legacy tasks with stale dependencies*(Sprint 3)*: TASK-007, TASK-014, TASK-021 referenced RETRO.md, HUMAN.md, and monolithic SPRINT.md — all deleted in Sprint 3. Required manual triage. Signal: when an artifact is deleted, actively search for references in the backlog. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Implement THINK-generated promotion proposals: when IDEA enters human review, THINK generates complete task draft (title, class, size estimate, rationale), AC template with at least one cmd:/file: predicate per AC, novelty flag against archive, and explicit uncertainty surface. Labeled as preparation not decision. Human Decision field still required.

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Not yet started.
**Constraint:** No constraints apply — task has not started.
**Cost:** No cost incurred — task has not started.
**Forward Action:** None.