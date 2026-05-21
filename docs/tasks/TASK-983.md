## TASK-983: Fix EACCES permission crash in audit command
**Meta:** P3 | XS | IN_PROGRESS | Focus:yes | 2-code-generation | local | docs/tasks/
**Actor:** unknown
**Created-at:** 2026-05-21T15:16:07.034Z
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
_confidence: 0.55_

**Files:**
- cli/src/main/ts/domain/services/command-registry.ts _(core)_
- cli/src/main/ts/application/commands/audit-command.ts _(domain)_
- cli/src/main/ts/application/commands/corpus-audit-command.ts _(domain)_
- cli/src/main/ts/domain/models/ueg-ir.ts _(core)_
- cli/src/main/ts/domain/services/java-adapter.ts _(core)_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_

**Guidelines:**
- bugs.md
- core.md

**Failure Patterns:**
- Missing Mura Signals*(Sprint v0.6.0-final)*: Although TASK-182 introduced the `Turns: N` metadata field, agents are not consistently recording this field at task completion. This creates a data gap for THINK Phase 4 (Mura detection). **Proposal:** Automate turn-count recording in the `arch task done` command or within the EXEC loop logic to remove reliance on agent judgment. _(docs/KAIZEN-LOG.md)_
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Fix EACCES permission crash in audit command

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes