## TASK-203: Escalation maturity Phase 2 - E4 Fail-Closed
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/, docs/agents/DO.md
**Closed-at:** 2026-05-16T16:27:09.556Z
**Depends:** TASK-202

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Definition of Ready validation added to MarkTaskInProgress. Stale INBOX check added to NextCommand. Both exit non-zero as specified. One pre-existing test used a mock task with empty context array despite meta line declaring 'none' — fixed by falling back to raw content scan for context and ACs.
**Constraint:** DoR 'none' context declaration requires raw content scan as fallback — the parsed context field is empty when the repository mock doesn't call the parser.
**Cost:** None — no architectural debt introduced. Raw content fallback is minimal and bounded.
**Forward Action:** Consider updating MockTaskRepositoryForIntegration to include parsed fields to avoid future mock/parser divergence.

## Approval
Approved-by: Auditor | 2026-05-16
