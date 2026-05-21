## TASK-980: Implement Deterministic Governance Gates (ADR-023)
**Meta:** P1 | S | DONE | Focus:no | 1-code-reasoning | local | cli/src/main/ts/application/commands/reflect-command.ts
**Closed-at:** 2026-05-21T08:40:38.958Z

**Depends:** none

### Context

ARCH is a governing system. Governance gates — checks that produce a pass/fail outcome — must be fully deterministic. LLM output is probabilistic and non-reproducible; a gate that an LLM can influence is not a law, it is a negotiation.

This task implements **ADR-023: Deterministic Gate Invariant**. All governance pass/fail outcomes must be owned by deterministic code. LLM output (specifically `arch reflect hansei` Tier 2) is relegated to advisory-only status with a guaranteed exit code 0.

### Acceptance Criteria

- [x] `docs/adr/ADR-023-deterministic-gate-invariant.md` created → file: docs/adr/ADR-023-deterministic-gate-invariant.md
- [x] `arch reflect hansei` Tier 2 exit code hardened to 0 → file: cli/src/main/ts/application/commands/reflect-command.ts
- [x] Tier 2 output header updated to "ADVISORY" → file: cli/src/main/ts/application/commands/reflect-command.ts
- [x] `npm test` passes in the CLI directory → cmd: npm test --prefix cli; exit: 0
- [x] `arch review` passes → cmd: node cli/dist/index.js review; exit: 0

### Definition of Done
- [x] All ACs checked by Auditor → prose: Auditor verifies each AC against repo state
- [x] Tests pass → cmd: npm test --prefix cli; exit: 0
- [x] `arch review` passes → cmd: node cli/dist/index.js review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Promoted as the foundational task for the current sprint to secure the system's epistemological contract.
**Constraint:** No constraints apply as the task has just been initialized.
**Cost:** No cost has been incurred yet for this task execution.
**Forward Action:** Implement ADR-023 and harden the command exit codes.
