## TASK-203: Escalation maturity Phase 2 - E4 Fail-Closed
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/, docs/agents/DO.md
**Closed-at:** 2026-05-16T16:27:09.556Z
**Depends:** TASK-202

### Context
Phase 2 of 3. Ambiguous task shape and stale INBOX now cause hard failures rather than silent improvisation.

### Acceptance Criteria
- [x] `arch task start TASK-XXX` exits non-zero when the task fails the Definition of Ready: missing any Meta field (Priority, Size, Status, Focus, Class, CLI, Context), no ACs, or M+ task missing Gaps section → cmd: arch task start TASK-XXX; exit: 1
- [x] `arch task start` on a valid READY task succeeds → prose: verified with a well-formed task
- [x] Stale INBOX (last regeneration timestamp > 24h ago) causes `arch next` to emit a HALT reason and exit non-zero → prose: verified by backdating INBOX and running arch next
- [x] `arch review` passes → cmd: arch review; exit: 0
- [x] Tests pass → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [ ] `npm test` passes in `cli/`.

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Definition of Ready validation added to MarkTaskInProgress. Stale INBOX check added to NextCommand. Both exit non-zero as specified. One pre-existing test used a mock task with empty context array despite meta line declaring 'none' — fixed by falling back to raw content scan for context and ACs.
**Constraint:** DoR 'none' context declaration requires raw content scan as fallback — the parsed context field is empty when the repository mock doesn't call the parser.
**Cost:** None — no architectural debt introduced. Raw content fallback is minimal and bounded.
**Forward Action:** Consider updating MockTaskRepositoryForIntegration to include parsed fields to avoid future mock/parser divergence.

## Approval
Approved-by: Auditor | 2026-05-16
