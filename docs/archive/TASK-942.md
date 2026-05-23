## TASK-942: Narrow arch memory ask scope - remove THINK-layer fields, tighten corpus dirs
**Meta:** P2 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/ask-corpus.ts, cli/src/main/ts/application/commands/ask-command.ts
**Closed-at:** 2026-05-18T20:00:00Z
**Depends:** TASK-938

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Narrowing is correctness, not reduction. The `causeGroups`/`recurringSignals` fields were added before the THINK boundary was formally written. They belong in `arch govern reflect`, not in a query tool. Removing them from `arch memory ask` output sharpens the layer boundary.

**Constraint:**
Any operator or agent relying on `causeGroups` from `arch memory ask` will lose that signal. Acceptable: the same signal is available via `arch govern reflect`, which is the authoritative surface for it.

**Cost:**
`AskResult` interface change breaks any downstream code reading those fields. Audit callers before implementing.

**Forward Action:**
After shipping, verify `arch govern reflect` surfaces equivalent pattern signals so no information is lost from the system.
