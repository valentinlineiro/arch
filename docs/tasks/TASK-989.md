## TASK-989: Fix config gaps - XL Muri guard and models.md schema mismatch
**Meta:** P2 | S | IN_PROGRESS | Focus:yes | 7-operations | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [ ] Add XL entry to Muri thresholds in arch.config.json (turns: 200, cost: 5.0)
  - `grep: '"XL"' arch.config.json`
- [ ] Verify XL is present in Muri table alongside XS/S/M/L
  - `cmd: node -e "const c=require('./arch.config.json'); if(c.muri?.XL?.turns) console.log('XL ok')"`
- [ ] Rewrite models.md examples to match actual `strategies` schema from arch.config.json
  - `grep: "strategies" docs/guidelines/models.md`
- [ ] Remove stale `modelTiers` references from models.md
  - `cmd: grep -c "modelTiers" docs/guidelines/models.md; test "$(cat)" -eq "0"`
- [ ] Max Muri cost for XL: 5.0 credits
  - `cmd: node -e "const c=require('./arch.config.json'); if(c.muri.XL.cost<=5.0) console.log('cost ok')"`

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
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Not yet started.
**Constraint:** No constraints apply — task has not started.
**Cost:** No cost incurred — task has not started.
**Forward Action:** None.
