## TASK-250: Unify CLI surface by intent-based verb domains
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/index.ts, cli/src/main/ts/application/, docs/agents/DO.md, docs/agents/THINK.md | Closed-at: 2026-05-18T21:00:00Z

## Hansei
**Severity:** H0
**Category:** [MissingDecisionRecord]

**Decision:**
All four design gaps (closure verb, review scope, alias policy, help ownership) were identified during drafting and resolved in the Decisions section before implementation begins. Specification is complete at READY time.

**Constraint:**
Gaps were not visible until the initial draft existed; they emerged from examining the current CLI surface rather than being anticipated upfront. This is expected for large refactoring tasks.

**Cost:**
The two-version alias lifecycle creates a compatibility surface that must be tracked across releases. No implementation debt introduced at draft stage.

## Approval
Approved-by: Auditor | 2026-05-18
