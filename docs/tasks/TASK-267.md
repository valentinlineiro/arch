## TASK-267: Fix malformed meta lines in docs/archive/ and add pre-archive guard
**Meta:** P1 | S | REVIEW | Focus:yes | 7-operations | claude | docs/archive/
**Actor:** unknown
**Locked-commit:** 789f4d8e
**Created-at:** 2026-05-19T12:41:45.380Z

### Context

`arch report` failed with CRITICAL INTEGRITY BREACH due to malformed meta lines in `docs/archive/` (e.g., empty size fields like `P1 | | DONE`). This task identifies and backfills all malformed archived meta lines and adds a pre-archive validation guard to `arch review` so no task can be archived with a malformed meta line.


### Relevant Context
_confidence: 0.45_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/services/archive-parser.ts _(core)_
- cli/src/main/ts/domain/models/event.ts _(core)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_

**Guidelines:**
- testing-a-change.md
- core.md

**Failure Patterns:**
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_
- Completed Task Stagnation*(Sprint 5)*: `TASK-117` was marked DONE but remained in `docs/tasks/`, consuming context and potentially misleading agents. **Proposal:** Implement "Archival Guard" in THINK mode to autonomously move DONE tasks to `docs/archive/`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Acceptance Criteria

- [x] All malformed meta lines in `docs/archive/` are identified and corrected with appropriate field values derived from context.
- [x] `arch review` includes a pre-archive guard that fails if a task being archived has a malformed meta line.
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] All archive meta lines valid; pre-archive guard implemented.
- [x] `arch review` passes.

## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** AC1 was already satisfied before work began — `ArchiveMetaIntegrity` drift check already passes against all archive files. No empty size fields exist. The original incident (empty size fields in archive) was fixed by a prior task. The real gap was AC2: no pre-archive guard in `archiveFile()` to block a malformed meta line from being archived in the first place. `validateMetaLineFormat()` added to `govern-system.ts` validates Priority (P0-P3), Size (XS/S/M/L/XL), and Status presence before any archive move.
**Constraint:** The drift check (`ArchiveMetaIntegrity`) validates what is already in the archive. The pre-archive guard (`validateMetaLineFormat`) validates what is about to enter the archive. Both layers are now present. Pre-existing tasks that somehow bypassed the drift check would still be caught on re-archive attempts.
**Cost:** One session. Investigation took longer than implementation because the archive was already clean — the task's original premise (malformed meta lines needing backfill) was stale.
**Forward Action:** IDEA-verify-pre-existing-before-start — pattern recurs: task describes a problem that was already fixed. Agents should verify the error condition still exists before implementing the fix.
