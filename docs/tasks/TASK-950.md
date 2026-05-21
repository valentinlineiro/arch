## TASK-950: Implement Deterministic Governance Gates (ADR-023)
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 1-code-reasoning | local | cli/src/main/ts/application/commands/reflect-command.ts

**Depends:** none

### Context

ARCH is a governing system. Governance gates — checks that produce a pass/fail outcome — must be fully deterministic. LLM output is probabilistic and non-reproducible; a gate that an LLM can influence is not a law, it is a negotiation.

This task implements **ADR-023: Deterministic Gate Invariant**. All governance pass/fail outcomes must be owned by deterministic code. LLM output (specifically `arch reflect hansei` Tier 2) is relegated to advisory-only status with a guaranteed exit code 0.

### Acceptance Criteria

- [ ] `docs/adr/ADR-023-deterministic-gate-invariant.md` created.
  - Documents the principle: LLMs never influence exit codes on governance paths.
  - Classifies commands: `review`, `govern`, `status`, `task` (deterministic) vs `reflect`, `ask` (advisory).
  - `file: docs/adr/ADR-023-deterministic-gate-invariant.md`

- [ ] `arch reflect hansei` Tier 2 exit code hardened to 0.
  - Remove `process.exit(result.status ?? 0)` after Tier 2.
  - `file: cli/src/main/ts/application/commands/reflect-command.ts`

- [ ] Tier 2 output header updated to "ADVISORY".
  - Must state: "This analysis is not a governance gate."
  - `file: cli/src/main/ts/application/commands/reflect-command.ts`

- [ ] `npm test` passes in the CLI directory.
  - `cmd: npm test --prefix cli; exit: 0`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review; exit: 0`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] Tests pass
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Promoted as the foundational task for the current sprint to secure the system's epistemological contract.
**Constraint:** No constraints apply as the task has just been initialized.
**Cost:** No cost has been incurred yet for this task execution.
**Forward Action:** Implement ADR-023 and harden the command exit codes.
