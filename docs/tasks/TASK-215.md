## TASK-215: FEATURE 4 - Organizational drift detection
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/domain/services/drift-checker.ts, docs/agents/THINK.md, docs/adr/
**Depends:** none

### Acceptance Criteria
- [ ] `checkOrphanTasks` added to `DriftChecker`: directed BFS from active root set (READY/IN_PROGRESS tasks), flags tasks unreachable in the enables-direction graph.
- [ ] `checkObsoleteGuidelines` added to `DriftChecker`: scans `docs/guidelines/*.md` for dead path references.
- [ ] `checkUnappliedADRs` added to `DriftChecker`: flags ACCEPTED ADRs never referenced in `docs/tasks/` or `docs/archive/`.
- [ ] All three checks registered in `DriftChecker.check()`.
- [ ] Unit tests written for all three new checks.
- [ ] `docs/agents/THINK.md` updated with Phase 3.5 — Semantic Drift Analysis protocol.
- [ ] ADR written for the two-tier separation (deterministic DriftChecker vs. semantic THINK Phase 3.5) and the active root set definition.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] Design spec: `docs/superpowers/specs/2026-05-07-drift-detection-design.md`
- [ ] ADR-013 written and accepted.
