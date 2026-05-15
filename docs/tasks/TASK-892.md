## TASK-892: "Glossary Command Addition"
**Meta:** P3 | XS | READY | Focus:no | 6-writing | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [ ] Ensure the command simplifies accessing architectural terms. → prose: verified
- [ ] Support user comprehension through visual aids if available within capabilities. → prose: verified
- [ ] Integrate with existing documentation or databases seamlessly, without performance degradation → prose: verified

### Context

### Relevant Context
_confidence: 0.55_

**Files:**
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_
- cli/src/main/ts/domain/models/causal-relation.ts _(core)_
- cli/src/main/ts/application/use-cases/ask-corpus.ts _(domain)_
- cli/src/main/ts/application/use-cases/batch-system.ts _(domain)_
- cli/src/main/ts/application/use-cases/causal-graph.ts _(domain)_

**ADRs:**
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-001: Use git as the primary state engine _(enforced)_
- ADR-002: Context as a budget, not a default _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Missing Mura Signals*(Sprint v0.6.0-final)*: Although TASK-182 introduced the `Turns: N` metadata field, agents are not consistently recording this field at task completion. This creates a data gap for THINK Phase 4 (Mura detection). **Proposal:** Automate turn-count recording in the `arch task done` command or within the EXEC loop logic to remove reliance on agent judgment. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

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
add arch explain command for on-demand glossary lookup

### Definition of Done
- [ ] All ACs checked → prose: all ACs above verified
- [ ] arch review passes → cmd: node cli/dist/index.js review; exit: 0
