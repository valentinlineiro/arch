## TASK-215: FEATURE 4 - Organizational drift detection
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/domain/services/drift-checker.ts, docs/agents/THINK.md, docs/adr/
**Depends:** none

### Acceptance Criteria
- [x] `checkOrphanTasks` added to `DriftChecker`: directed BFS from active root set (READY/IN_PROGRESS tasks), flags tasks unreachable in the enables-direction graph.
- [x] `checkObsoleteGuidelines` added to `DriftChecker`: scans `docs/guidelines/*.md` for dead path references.
- [x] `checkUnappliedADRs` added to `DriftChecker`: flags ACCEPTED ADRs never referenced in `docs/tasks/` or `docs/archive/`.
- [x] All three checks registered in `DriftChecker.check()`.
- [x] Unit tests written for all three new checks.
- [x] `docs/agents/THINK.md` updated with Phase 3.5 — Semantic Drift Analysis protocol.
- [x] ADR written for the two-tier separation (deterministic DriftChecker vs. semantic THINK Phase 3.5) and the active root set definition.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] Design spec: `docs/superpowers/specs/2026-05-07-drift-detection-design.md`
- [x] ADR-013 written and accepted.

## Hansei
Active root set is execution-centric (READY/IN_PROGRESS/REVIEW) — the shift to intention-centric (INTENT nodes) will require revisiting the orphan semantics when docs/intents/ is introduced.
