## TASK-919: arch init: full repo scaffolding with stack detection
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/init-command.ts
**Closed-at:** 2026-05-19T10:15:00.000Z
**Depends:** TASK-918

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** The implementation was largely pre-existing — stack detection, seed task, idempotency, and arch.config.json routing were all already in place. The primary gap was the AGENTS.md symlink: the command was writing AGENTS.md as a file rather than placing content in docs/AGENTS.md and symlinking from root. Fixed by swapping the write target and adding a third symlink creation call. AC format was also rewritten from DeterministicACVerifier sub-bullet style to ValidateTaskAcs inline `→` style.
**Constraint:** The task was marked IN_PROGRESS with no prior implementation commits; the actual implementation predated the task. Exploration was required to identify the actual gap rather than rebuild from scratch.
**Cost:** No architectural debt. The symlink fix brings init output into alignment with the actual arch repo structure (CLAUDE.md → docs/AGENTS.md).
**Forward Action:** No IDEA required — gap was contained and fully resolved.

## Approval
Approved-by: Auditor | 2026-05-19
