## TASK-279: Implement arch ask - memory queries over the full ARCH operational corpus
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/
**Closed-at:** 2026-05-19T12:02:23.796Z

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Implementation was fully complete before this task was picked up — `arch ask` existed in `ask-command.ts` + `ask-corpus.ts` from the TASK-942 era. The task was promoted and picked up as if it were unimplemented. The actual work this session was verification: confirmed corpus matches, related task/ADR refs, and no-API-key operation. No code written.

**Constraint:**
The task had placeholder Hansei that said "real Hansei to be written at REVIEW time." This is a pre-completion Hansei that was never updated. The convention of seeding Hansei at promotion time reduces commit friction but creates a gap when a task is closed without review — placeholder text can survive to archive.

**Cost:**
Zero implementation cost. One session turn to verify ACs against pre-existing code.

**Forward Action:**
IDEA-verify-pre-existing-before-start — agents should grep for command/function presence before treating a task as unimplemented. Recurring pattern (also TASK-259, TASK-260 this session): task is created describing work that was done as a side effect of a prior task.

## Approval
Approved-by: Auditor | 2026-05-19
