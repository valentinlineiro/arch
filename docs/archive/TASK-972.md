## TASK-972: Implement semantic compression layer infrastructure: precede
**Meta:** P1 | L | DONE | Focus:no | 1-code-reasoning | local | docs/tasks/
**Closed-at:** 2026-05-20T12:46:07Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Confidence calibration (component 5 of stated intent) deferred — requires structured THINK recommendation data that does not yet exist. Three pure domain services delivered (PrecedentNoveltyScorer, GovernanceDriftDetector, InstitutionalAnomalyTracker), CorpusEntry extended with precedent fields, and --layer2 flag wired into corpus-audit. Deferral identified and documented in the implementation plan before any code was written.
**Constraint:** THINK currently produces narrative text with no queryable recommendation schema; building calibration infrastructure without an upstream recommendation feed would produce an empty data store.
**Cost:** No additional cost beyond planned scope — deferral was scoped out explicitly in the implementation plan before implementation began, with rationale recorded.
**Forward Action:** Create a dedicated task for confidence calibration after IDEA-think-generated-proposals produces structured recommendation records with outcome data.

## Approval
Approved-by: human-auditor | 2026-05-20
