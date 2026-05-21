## TASK-984: Improve audit signal/noise for large Python repos
**Meta:** P3 | S | IN_PROGRESS | Focus:yes | 2-code-generation | local | docs/tasks/
**Actor:** unknown
**Created-at:** 2026-05-21T15:35:53.408Z
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
- cli/src/main/ts/domain/models/causal-signal.ts _(core)_
- cli/src/main/ts/domain/models/audit-inference.ts _(core)_
- cli/src/main/ts/application/use-cases/causal-signal-log.ts _(domain)_
- cli/src/main/ts/domain/services/signal-extraction-engine.ts _(core)_
- cli/src/main/ts/domain/services/signal-router.ts _(core)_

**ADRs:**
- ADR-002: Context as a budget, not a default _(enforced)_
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_

**Guidelines:**
- bugs.md
- core.md

**Failure Patterns:**
- Legacy tasks with stale dependencies*(Sprint 3)*: TASK-007, TASK-014, TASK-021 referenced RETRO.md, HUMAN.md, and monolithic SPRINT.md — all deleted in Sprint 3. Required manual triage. Signal: when an artifact is deleted, actively search for references in the backlog. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Improve audit signal/noise for large Python repos

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes