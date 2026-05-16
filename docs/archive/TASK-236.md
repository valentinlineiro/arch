## TASK-236: Align THINK.md replenishment trigger with core.md threshold rule
**Meta:** P3 | XS | READY | Focus:no | 6-writing | claude-code | docs/agents/THINK.md
**Depends:** none

### Context
`docs/guidelines/core.md` §5 mandates: "Propose at least one new IDEA when READY tasks < 3 (THINK Phase 1)". THINK.md Phase 1 does not mention this threshold. Gap between high-level guidelines and operational protocol.

### Acceptance Criteria
- [ ] THINK.md Phase 1 explicitly checks READY task count
- [ ] If READY < 3, protocol mandates proposing at least one new IDEA
- [ ] Matches the rule in core.md §5

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Task was completed directly in session 2026-05-16 without formal lifecycle. Changes applied before this task file was created. Hansei added retroactively for corpus compliance.
**Constraint:** This task predated the implementation it tracked — created from a stale IDEA batch. Retroactively closed.
**Cost:** No cost — the work was already done when this task was created.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-16
