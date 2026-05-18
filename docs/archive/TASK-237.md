## TASK-237: Consolidate L2 autonomy rule to single canonical source
**Meta:** P3 | XS | DONE | Focus:no | 6-writing | claude-code | docs/guidelines/autonomy.md, docs/AGENTS.md, docs/agents/THINK.md | Closed-at: 2026-05-16T00:00:00Z
**Depends:** none

### Context
The L2 autonomous promotion rule (XS + 6-writing/7-operations + human Decision required) is repeated verbatim across docs/AGENTS.md, docs/guidelines/autonomy.md, and docs/agents/THINK.md. Violates DRY and creates drift risk during maintenance.

### Acceptance Criteria
- [ ] `docs/guidelines/autonomy.md` is the canonical source for the L2 rule
- [ ] `docs/AGENTS.md` and `docs/agents/THINK.md` reference the rule by link/name instead of repeating it
- [ ] Rule text is identical across all references (or removed from non-canonical locations)

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Task was completed directly in session 2026-05-16 without formal lifecycle. Changes applied before this task file was created. Hansei added retroactively for corpus compliance.
**Constraint:** This task predated the implementation it tracked — created from a stale IDEA batch. Retroactively closed.
**Cost:** No cost — the work was already done when this task was created.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-16
