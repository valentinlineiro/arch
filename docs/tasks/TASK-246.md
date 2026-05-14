## TASK-246: Hansei Signal Routing & Reflect Integration
**Meta:** P2 | M | READY | Focus:no | 7-operations | local | cli/src/main/ts/domain/services/signal-router.ts, cli/src/main/ts/domain/services/report-generator.ts

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
