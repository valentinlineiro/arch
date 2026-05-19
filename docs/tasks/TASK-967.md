## TASK-967: Enhance arch task done as guided close path mirror of arch t
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | local | docs/tasks/
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
_confidence: 0.48_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/services/deterministic-hansei-checker.ts _(core)_
- cli/src/main/ts/domain/models/batch-entry.ts _(core)_

**ADRs:**
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-007: Census Context Budget Check in DriftChecker _(enforced)_
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Missing Mura Signals*(Sprint v0.6.0-final)*: Although TASK-182 introduced the `Turns: N` metadata field, agents are not consistently recording this field at task completion. This creates a data gap for THINK Phase 4 (Mura detection). **Proposal:** Automate turn-count recording in the `arch task done` command or within the EXEC loop logic to remove reliance on agent judgment. _(docs/KAIZEN-LOG.md)_
- Phantom Archive Sync Latency*(Sprint v0.6.0-final)*: Tasks marked `DONE` by an Auditor (human or agent) remain in `docs/tasks/` until the next `arch govern` tick. This creates a "stale backlog" window where `arch status` and INBOX show tasks that are technically complete. **Proposal:** Integrate phantom-archive sync directly into `arch task done`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Enhance arch task done as guided close path mirror of arch task capture: detect placeholder/missing Hansei and invoke hansei-wizard interactively, auto-generate ## Approval template on human confirmation, set status to REVIEW, write REVIEW_REQUEST to INBOX, commit in one command. --batch mode for headless contexts. --force emits warning to INBOX instead of silently bypassing.

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