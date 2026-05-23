## TASK-921: AC predicate suggestions in arch task create: class-appropriate scaffolding
**Meta:** P1 | S | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/create-task.ts, docs/templates/
**Closed-at:** 2026-05-17T21:36:32.379Z
**Depends:** TASK-917

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** All 4 class templates updated with 3 example ACs using correct predicate types. CreateTask.scaffold() rewritten: class-aware predicate suggestion for LLM-generated ACs, skeleton ACs for fallback. DoR error messages now include remediation hints per violation. One test fix: case-insensitive class check.
**Constraint:** LLM-generated ACs get suggestive predicates (cmd/file/prose) but not actual command strings — the user must fill in the real command.
**Cost:** None — no architectural debt introduced.
**Forward Action:** None required.
