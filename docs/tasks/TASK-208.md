## TASK-208: Implement L3 Self-Archive - audited autonomous task completion
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude-code | docs/agents/DO.md, docs/AGENTS.md, docs/adr/, cli/src/main/ts/application/use-cases/mark-task-done.ts
**Depends:** TASK-207

### Context
Every task completion currently requires a human Auditor to verify ACs and move the file to `docs/archive/`. For XS/S tasks where `SemanticACVerifier` (TASK-207) returns high confidence, this is pure overhead. This task implements L3 self-archive: the agent archives its own task when the L3 gate passes, writes an auditable INBOX entry, and tags the commit — all without blocking for human review.

The boundary shift from L2 to L3 requires an ADR and updates to DO.md and CLAUDE.md hard limits.

### Acceptance Criteria
- [ ] ADR written at `docs/adr/ADR-009-l3-self-archive.md` documenting the L3 gate conditions, audit trail requirements, and rollback procedure → file: docs/adr/ADR-009-l3-self-archive.md
- [ ] `MarkTaskDone` checks L3 gate before proceeding: (1) task size is XS or S, (2) `SemanticACVerifier.verify()` returns `pass: true, confidence: 'high'` → code: verified by reading mark-task-done.ts
- [ ] On L3 pass: task archived, INBOX entry written as `AWAITING_REVIEW | TASK-XXX [L3-AUTO]` with verifier evidence appended → prose: verified by checking INBOX after a dry-run
- [ ] On L3 fail (M/L size, or confidence not high): falls back to current behavior (no self-archive, human reviews) → code: verified by unit test
- [ ] Commit message for L3 self-archive uses `done: [TASK-XXX] <title> [L3-AUTO]` format → prose: verified by reading the implementation
- [ ] DO.md updated: close step documents L3 self-archive path and conditions → file: docs/agents/DO.md
- [ ] CLAUDE.md hard limits section updated: "agent may self-archive XS/S tasks when L3 gate passes" → file: docs/AGENTS.md
- [ ] Unit tests cover: L3 pass (XS, high confidence), L3 fail (M size), L3 fail (medium confidence), INBOX entry format → test: `npm test` passes in `cli/`
- [ ] `arch review` passes → cmd: `arch review`
- [ ] `npm test` passes in `cli/` → cmd: `cd cli && npm test`

### Definition of Done
- [ ] All ACs checked.
- [ ] ADR present and referenced in KAIZEN-LOG.md.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
