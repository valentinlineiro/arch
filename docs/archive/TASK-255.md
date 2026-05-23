## TASK-255: Split THINK into structural default loop and --deep mode
**Meta:** P1 | M | DONE | Focus:no | 6-writing | claude | docs/agents/THINK.md, arch.config.json, cli/src/main/ts/application/commands/reflect-command.ts, cli/src/main/ts/application/use-cases/govern-system.ts
**Closed-at:** 2026-05-15T00:00:00Z
**Depends:** TASK-254

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
THINK.md rewrite is scoped to structural split only. Phase 3 "Immediate Improvements" removal is deferred to TASK-256 so that each commit is atomic and reviewable independently.

**Constraint:**
Combining THINK split and Kaizen evidence gate changes in one task would make the diff harder to audit and increase the risk of introducing inconsistencies across the restructured protocol.

**Cost:**
TASK-255 and TASK-256 must be sequenced — TASK-256 should not start until TASK-255 is at REVIEW or DONE, to avoid conflicting edits to THINK.md.

**Forward Action:**
Start TASK-256 only after this task is audited at DONE; monitor for Phase 3 Kaizen evidence gate compliance in subsequent THINK sessions.

## Approval
Approved-by: Auditor | 2026-05-15
