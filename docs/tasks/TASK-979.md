## TASK-979: Deterministic Governance Gates --id TASK-950 --priority P1 -
**Meta:** P3 | S | READY | Focus:no | 1-code-reasoning | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [ ] Intent addressed
  - `prose: verified`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.56_

**Files:**
- cli/src/main/ts/domain/services/action-governance-service.ts _(core)_
- cli/src/main/ts/domain/models/reconciliation.ts _(core)_
- cli/src/main/ts/domain/models/evidence.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- .arch/causal-signal.jsonl _(utility)_

**ADRs:**
- ADR-023: Deterministic Gate Invariant _(enforced)_
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_
- ADR-011: Unified Provider Strategies _(enforced)_

**Failure Patterns:**
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_
- Unstructured IDEAs before TASK-033*(Sprint 3)*: The original TEMPLATE only had `## Proposal` with no structured fields. THINK had to infer gaps without dependency or size context. The first 8 IDEAs were refined with more friction than necessary. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Deterministic Governance Gates --id TASK-950 --priority P1 --size S

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes