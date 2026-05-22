## TASK-989: Fix config gaps - XL Muri guard and models.md schema mismatch
**Meta:** P2 | S | REVIEW | Focus:no | 7-operations | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [x] Add XL entry to Muri thresholds in arch.config.json (turns: 200, cost: 5.0) → grep: "XL" arch.config.json
- [x] Verify XL is present in Muri table alongside XS/S/M/L → cmd: node -e "const c=require('./arch.config.json'); if(c.muri?.XL?.turns) console.log('XL ok')" ; exit: 0
- [x] Rewrite models.md examples to match actual `strategies` schema from arch.config.json → grep: "strategies" docs/guidelines/models.md
- [x] Remove stale `modelTiers` references from models.md → cmd: grep -q "modelTiers" docs/guidelines/models.md ; exit: 1
- [x] Max Muri cost for XL: 5.0 credits → cmd: node -e "const c=require('./arch.config.json'); if(c.muri.XL.cost<=5.0) console.log('cost ok')" ; exit: 0

### Context

### Relevant Context
_confidence: 0.55_

**Files:**
- arch.config.json _(core)_
- docs/guidelines/models.md _(core)_

**ADRs:**

**Guidelines:**
- models.md

**Failure Patterns:**

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Fix two config-level drifts: XL missing from Muri guards in arch.config.json, and models.md documenting stale modelTiers key instead of actual strategies schema.

### Definition of Done
- [x] All ACs checked by Auditor → prose: auditor verifies against repository state
- [x] `arch review` passes → cmd: arch check ; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Both gaps fixed cleanly — XL added to Muri thresholds in arch.config.json and models.md rewritten to use strategies schema instead of stale modelTiers.
**Constraint:** arch.config.json is a protected path — modification is within task scope and does not alter governance semantics.
**Cost:** No cost incurred — task has not started.
**Forward Action:** None.
