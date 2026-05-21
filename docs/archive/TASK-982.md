## TASK-982: Implement ARCH Audit v1.1 Language-Agnostic Engine
**Meta:** P3 | M | DONE | Focus:false | 2-code-generation | local | docs/tasks/
**Turns:** 1
**Closed-at:** 2026-05-21T15:04:20.656Z
**Actor:** unknown
**Locked-commit:** e52dbbcc
**Created-at:** 2026-05-21T15:03:28.459Z
**Depends:** none

### Gaps
- Advanced Java AST parsing (currently uses regex heuristics for imports and class definitions).
- Multi-language cross-linkage (resolving dependencies between TS and Java entities in polyglot repos).
- Performance optimization for very large repositories (UEG-IR can become large).

### Acceptance Criteria
- [ ] Implementation file exists at declared context path
  - `file: (path)`
- [ ] Tests pass
  - `cmd: npm test; exit: 0`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context


### Relevant Context
_confidence: 0.46_

**Files:**
- docs/INBOX.md _(utility)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- .arch/focus-ledger.jsonl _(utility)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/audit-inference.ts _(core)_

**ADRs:**
- ADR-003: DISPATCH output is ephemeral — exception to ADR-001 _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_

**Guidelines:**
- bugs.md
- core.md

**Failure Patterns:**
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_
- Completed Task Stagnation*(Sprint 5)*: `TASK-117` was marked DONE but remained in `docs/tasks/`, consuming context and potentially misleading agents. **Proposal:** Implement "Archival Guard" in THINK mode to autonomously move DONE tasks to `docs/archive/`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Implement ARCH Audit v1.1 Language-Agnostic Engine

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Implemented ARCH Audit v1.1 as a structural decomposition engine utilizing a Unified Epistemic Graph (UEG-IR).
**Constraint:** Strict non-authoritative constraints enforced: absolute removal of all ranking, scoring, and semantic inference logic.
**Cost:** Refactored previous structural extraction into a plugin-based adapter system; added Java support via regex-based adapter.
**Forward Action:** None required; v1.1 core pipeline is fully functional and compliant with the implementation contract.