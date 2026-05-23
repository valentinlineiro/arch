## TASK-915: arch explain TASK-XXX : causal chain reconstruction
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/, cli/src/main/ts/application/use-cases/causal-signal-log.ts
**Closed-at:** 2026-05-17T13:20:35.049Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** ExplainCommand implemented with origin (IDEA or Spawned-from), Hansei, causal signals, downstream refs, and same-category related tasks. arch explain TASK-901 shows full provenance chain live.
**Constraint:** Same-category search scans first 50 archived tasks only — sufficient for current corpus, may miss older matches as archive grows.
**Cost:** No architectural debt introduced.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-17
