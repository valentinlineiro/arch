## TASK-969: Automate Turns: metadata in task closure: derive turn count 
**Meta:** P3 | XS | DONE | Focus:no | 2-code-generation | local | docs/tasks/
**Turns:** 0
**Closed-at:** 2026-05-23T23:49:37.681Z
**Locked-commit:** f5af0023
**Actor:** unknown
**Created-at:** 2026-05-19T14:47:36.048Z
**Depends:** none

### Acceptance Criteria
- [x] `mark-task-done.ts` derives Turns count via `git rev-list --count lockedCommit..HEAD` when `lockedCommit` is present, and appends `Turns: N` to the Meta line.
  - `file: cli/src/main/ts/application/use-cases/mark-task-done.ts`

- [x] If `lockedCommit` is absent (XS tasks without it), Turns field is omitted — no error.
  - `prose: verified by closing an XS task without lockedCommit — no Turns appended, no error`

- [x] `npm test` passes.
  - `prose: 544+ tests pass`

### Context


### Relevant Context
_confidence: 0.47_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/sprint.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/services/metrics-engine.ts _(core)_

**ADRs:**
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-002: Context as a budget, not a default _(enforced)_
- ADR-003: DISPATCH output is ephemeral — exception to ADR-001 _(enforced)_

**Guidelines:**
- testing-a-change.md
- core.md

**Failure Patterns:**
- Missing Mura Signals*(Sprint v0.6.0-final)*: Although TASK-182 introduced the `Turns: N` metadata field, agents are not consistently recording this field at task completion. This creates a data gap for THINK Phase 4 (Mura detection). **Proposal:** Automate turn-count recording in the `arch task done` command or within the EXEC loop logic to remove reliance on agent judgment. _(docs/KAIZEN-LOG.md)_
- Phantom Archive Sync Latency*(Sprint v0.6.0-final)*: Tasks marked `DONE` by an Auditor (human or agent) remain in `docs/tasks/` until the next `arch govern` tick. This creates a "stale backlog" window where `arch status` and INBOX show tasks that are technically complete. **Proposal:** Integrate phantom-archive sync directly into `arch task done`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [x] partial — correct direction, missing key files
- [x] off — wrong files dominated

#### Intent
Automate Turns: metadata in task closure: derive turn count automatically using git rev-list --count lockedCommit..HEAD in the Auditor or mark-task-done flow. Remove need for manual Turns: field entry.

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Turns derivation already implemented in mark-task-done.ts — git rev-list count from lockedCommit..HEAD, written via task.turns, persisted via taskRepository.save(). Task was pre-implemented. Pre-existence check warned correctly.
**Constraint:** Turns is only set when lockedCommit is present and gitRepository is available. XS tasks without lockedCommit get no Turns field — correct per spec.
**Cost:** No code changes. Verification only.
**Forward Action:** None required.
