## TASK-246: Hansei Signal Routing & Reflect Integration
**Meta:** P2 | M | READY | Focus:yes | 7-operations | local | cli/src/main/ts/domain/services/

**Depends:** TASK-245

### Acceptance Criteria
- [ ] Implement `SignalRouter` to append H2 and H3 Hansei signals to `.arch/causal-signal.jsonl`.
- [ ] `arch report` aggregates Hansei categories to identify systemic friction trends (e.g., "High [ContextWaste] in Module X").
- [ ] Hansei signals feed the `arch reflect` (THINK Phase 3) prioritization engine.
- [ ] Generate automated "Weak Signal" warnings when H2 thresholds (≥3 occurrences) are met for a specific category or module.
- [ ] Link Hansei "Forward Action" tasks/IDEAs to the causal graph for traceability.

### Definition of Done
- [ ] Completing a task with H2 Hansei results in a new entry in `causal-signal.jsonl`.
- [ ] `arch report` shows a breakdown of Hansei categories.
- [ ] `arch reflect` identifies a systemic issue based on aggregated Hansei data.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Metadata-only update to remove dead context paths (`signal-router.ts`, `report-generator.ts`) that were listed before the target files existed. Task remains READY; no implementation has occurred.

**Constraint:**
Context paths referenced files to be created during implementation; they were listed speculatively and flagged as dead by arch review before implementation began.

**Cost:**
None. Context field now points to the target directory until implementation files exist.

**Forward Action:**
No forward action required for this metadata correction. Implementation will update context to specific files when work begins.
