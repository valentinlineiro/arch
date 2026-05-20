## TASK-976: optimize context indexing to eliminate rebuild amplification
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
_confidence: 0.45_

**Files:**
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_
- cli/src/main/ts/domain/models/feedback-signal.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/application/use-cases/context-inference.ts _(domain)_
- cli/src/main/ts/application/use-cases/causal-signal-log.ts _(domain)_

**ADRs:**
- ADR-028: Unified Epistemic Invariant Specification — Bounded Stream Enforcement _(enforced)_
- ADR-001: Use git as the primary state engine _(enforced)_
- ADR-002: Context as a budget, not a default _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Completed Task Stagnation*(Sprint 5)*: `TASK-117` was marked DONE but remained in `docs/tasks/`, consuming context and potentially misleading agents. **Proposal:** Implement "Archival Guard" in THINK mode to autonomously move DONE tasks to `docs/archive/`. _(docs/KAIZEN-LOG.md)_
- Unstructured IDEAs before TASK-033*(Sprint 3)*: The original TEMPLATE only had `## Proposal` with no structured fields. THINK had to infer gaps without dependency or size context. The first 8 IDEAs were refined with more friction than necessary. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
optimize context indexing to eliminate rebuild amplification

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes