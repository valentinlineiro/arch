## TASK-897: Author ARCH-Core minimal execution contract for weak models
**Meta:** P2 | M | DONE | Focus:no | 6-writing | claude-code | docs/
**Closed-at:** 2026-05-16T13:52:13.046Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Implemented all 4 ACs. ARCH-CORE.md authored as 5-step CLI-only contract. AGENTS.md updated with two entry points table. arch.config.json coreMode hint added to Ollama provider.
**Constraint:** ARCH-CORE.md is a doc artifact — no CLI enforcement of Core mode boundary. Relies on human routing the right doc to the right model.
**Cost:** ARCH-CORE.md is not enforced by the CLI — no runtime boundary between Core and Governance mode. Relies entirely on human routing the correct doc.
**Forward Action:** None.

## Approval
Approved-by: Auditor | 2026-05-16
