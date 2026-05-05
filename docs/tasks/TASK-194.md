## TASK-194: Implement HALT.md and halt-log drift check
**Meta:** P2 | S | READY | Focus:no | 2-code-generation | claude-code | docs/agents/DO.md, docs/TASK-FORMAT.md, cli/src/main/ts/domain/services/drift-checker.ts
**Depends:** none

### Context
Halt conditions are scattered across DO.md prose. A model must synthesize multiple docs to know when to stop — weak models drift instead of halting. HALT.md centralizes all halt conditions as a structured table mapping each to a CLI exit code; HALT-LOG.md is a new append-only log for halt events, keeping them separate from INBOX.md regeneration. A new `arch review` drift check verifies HALT.md exists and has a valid table structure.

### Acceptance Criteria
- [ ] `docs/HALT.md` exists with a structured table covering at minimum: no READY tasks, predicate failure, stale lock > 3 days, blocked task at top of queue, unchecked ACs at close — each row has: Condition, Trigger command, CLI exit code, HALT-LOG entry format
- [ ] `docs/HALT-LOG.md` exists as an append-only log; halt events are written here, not to INBOX.md
- [ ] A new `HaltPolicy` drift check in `DriftChecker` verifies HALT.md exists and its table has all required columns; surfaces as a named violation in `arch review`
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
