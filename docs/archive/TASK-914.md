## TASK-914: arch task new --class: task scaffolding by class
**Meta:** P2 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/task-command.ts, docs/templates/
**Closed-at:** 2026-05-17T13:13:54.525Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** arch task new --class works. Templates in docs/templates/ loaded by class prefix. Two bugs fixed: readDirectory needs rootPath prefix; fmt.success does not exist (replaced with fmt.check).
**Constraint:** Template resolution uses class prefix only (e.g. "2" for "2-code-generation"). Full class name match checked first.
**Cost:** None — bugs were in new code, not existing paths.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-17
