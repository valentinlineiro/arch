## TASK-961: Fix archive parser to skip non-DONE tasks: add status filter
**Meta:** P1 | XS | DONE | Focus:no | 2-code-generation | local | docs/tasks/
**Locked-commit:** 28f6941d
**Closed-at:** 2026-05-20T13:10:00Z
**Actor:** unknown
**Created-at:** 2026-05-19T14:47:05.377Z
**Depends:** none

### Acceptance Criteria
- [x] Implementation file exists at declared context path
  - `file: cli/src/main/ts/domain/services/archive-parser.ts`
- [x] Tests pass
  - `cmd: npm --prefix cli test; exit: 0`
- [x] `arch review` passes
  - `cmd: arch review; exit: 0`

### Context


### Relevant Context
_confidence: 0.47_

**Files:**
- .arch/focus-ledger.jsonl _(utility)_
- .arch/chronicle.jsonl _(utility)_
- docs/EVENTS.md _(utility)_
- docs/INBOX.md _(utility)_
- .arch/reflect-breach-log.jsonl _(utility)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_
- Phantom Archive Sync Latency*(Sprint v0.6.0-final)*: Tasks marked `DONE` by an Auditor (human or agent) remain in `docs/tasks/` until the next `arch govern` tick. This creates a "stale backlog" window where `arch status` and INBOX show tasks that are technically complete. **Proposal:** Integrate phantom-archive sync directly into `arch task done`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Fix archive parser to skip non-DONE tasks: add status filter in ArchiveParser.parseArchivedTasks() to skip any file whose Meta: line does not contain DONE as the status token. Removes false INVALID signals from TASK-231/234-237 (READY status in archive) and restores correct metrics baseline.

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [ReviewBlindspot]
**Decision:** Duplicate of TASK-926. The status filter (lines 51-53 of archive-parser.ts) was added by TASK-926 on 2026-05-18, one day before this task was filed. Discovery made during TDD pre-flight: archive-parser.ts already contained `if (statusField !== 'DONE') continue;`. No non-DONE files exist in docs/archive/. No code change required.
**Constraint:** None — task was obsolete at creation time.
**Cost:** One investigation cycle to confirm the prior fix was complete and correct.
**Forward Action:** None required.