## TASK-937: Implement proportional protocol - lightweight XS capture, close, and template
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/commands/capture-command.ts, docs/TASK-FORMAT.md, docs/AGENTS.md
**Closed-at:** 2026-05-18T22:30:00Z

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Scope deliberately narrow: three friction points only (template, close path, DoD exemption). No changes to L3 gate or Auditor bypass conditions. All non-goals documented explicitly to prevent scope creep during implementation.

**Constraint:**
TASK-934 (tiered obligations) is the prerequisite; this is the follow-on. Both are needed to fully close the XS ceremony gap — neither is complete without the other.

**Cost:**
Stripped XS template reduces documentation surface; operators may omit context that would have been useful. Acceptable trade: the friction cost of the full template on XS work is higher than the occasional missed context.

**Forward Action:**
Monitor whether XS self-archive rate increases after this ships. If it does not, the close-path friction is not the binding constraint — look at capture friction instead.

## Approval
Approved-by: Auditor | 2026-05-18
