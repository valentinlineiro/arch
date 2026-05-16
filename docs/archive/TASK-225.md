## TASK-225: Causal signal arbitration layer [ADR-015]
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/, .arch/
**Closed-at:** 2026-05-12T07:53:50.264Z
**Depends:** TASK-224

## Approval
Approved-by: Auditor | 2026-05-12

## Hansei
Implemented and committed 2026-05-11; never formally closed. Signal layer has no real signals yet — the backward loop (lifecycle events → signal generation) was partially wired via TASK-226 for `arch loop` but `arch task done` and `arch govern` paths still don't generate signals automatically. That gap is the next Chronicle work item.
