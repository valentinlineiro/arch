## TASK-202: Escalation maturity Phase 1 - Level 3 Detectable
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts, cli/src/main/ts/
**Closed-at:** 2026-05-12T08:16:20.949Z
**Depends:** TASK-193

## Hansei
EscalationMaturity was the trigger for TASK-227 (drift-checker relocation). Protecting the entire `domain/` directory caused the governance tool to block its own maintenance. ADR-016 narrowed the protection to `domain/models/` and `domain/repositories/`. The Level 3 Detectable implementation is correct — the protectedPaths misconfiguration was pre-existing debt that surfaced only under real use.
