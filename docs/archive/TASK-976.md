## TASK-976: optimize context indexing to eliminate rebuild amplification
**Meta:** P3 | S | DONE | Focus:no | 2-code-generation | local | ARCH_CONTEXT_AXIOMS.md
**Closed-at:** 2026-05-21T07:30:00.000Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [ReviewBlindspot]
**Decision:** Task verified and closed. A test regression in `command-registry.test.ts` (missing `hansei` subcommand from TASK-964) was identified and fixed during review.
**Constraint:** Test suite must be updated whenever public CLI surface changes.
**Cost:** Review turn count increased due to test stabilization.
**Forward Action:** Add a pre-commit check to verify CLI subcommand parity with registry.
