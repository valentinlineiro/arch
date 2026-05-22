## TASK-985: Execute docs/ simplification and consolidation per proposal
**Meta:** P3 | S | READY | Focus:no | 3-refactoring | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [ ] Intent addressed
  - `prose: verified`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.50_

**Files:**
- cli/src/main/ts/domain/models/reflect-proposal.ts _(core)_
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_
- cli/src/main/ts/application/use-cases/reflect-proposal-log.ts _(domain)_

**ADRs:**
- ADR-003: DISPATCH output is ephemeral — exception to ADR-001 _(enforced)_
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_

**Failure Patterns:**
- Level Terminology Collision*(Sprint v0.6.0-final)*: Simultaneous advancement of "Autonomy Levels" (L1-L4) and "Escalation Maturity" (L1-E7) has led to terminal confusion where "Level 3" has two different meanings. **Proposal:** Adopt distinct prefixes (Capability vs Enforcement) per IDEA-level-terminology-disambiguation. _(docs/KAIZEN-LOG.md)_
- Completed Task Stagnation*(Sprint 5)*: `TASK-117` was marked DONE but remained in `docs/tasks/`, consuming context and potentially misleading agents. **Proposal:** Implement "Archival Guard" in THINK mode to autonomously move DONE tasks to `docs/archive/`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Execute docs/ simplification and consolidation per proposal

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes