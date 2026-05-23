## TASK-927: Audit and remediate ARCH protocol/implementation inconsistencies
**Meta:** P1 | M | DONE | Focus:no | 9-audit | claude | cli/src/main/ts/, docs/ | Closed-at: 2026-05-18T15:30:00Z

## Hansei

**Severity:** H3b
**Category:** [SpecDrift]
**Decision:** All 7 findings resolved. TASK-928/929 fixed medium no-decision-required bugs. TASK-930/931/932 resolved the three High invariant contradictions (INBOX reads, lock model, archive status). TASK-933 repaired corpus drift. Owner: human (decisions provided 2026-05-18).
**Constraint:** Finding 6 (git sync contradiction, bundled in IDEA-inbox-invariant-contradiction) remains undecided — git sync policy spans a larger scope than TASK-930's INBOX-read fix. Deferred to a future session.
**Cost:** Three High invariant violations were live in production code. Accumulated over multiple sessions without detection. Cost absorbed; no rollout impact since ARCH is pre-1.0.
**Forward Action:** TASK-930/931/932/933 closed. IDEA-tiered-obligations ready to promote when tiered Hansei implementation is prioritized. Finding 6 (git sync) needs a separate decision. TASK-927 is closed.

## Approval
Approved-by: Auditor | 2026-05-18
