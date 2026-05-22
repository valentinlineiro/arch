## TASK-991: Resolve Hansei contradiction between DO.md and TASK-FORMAT.md
**Meta:** P2 | XS | READY | Focus:no | default | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [ ] DO.md:20 updated to match TASK-FORMAT.md triggered-only language for XS/S Hansei
  - `grep: "triggered-only for XS/S" docs/agents/DO.md`
- [ ] Remove "because the close transition enforces its presence" from DO.md
  - `cmd: grep -c "close transition enforces" docs/agents/DO.md; test "$(cat)" = "0"`
- [ ] Verify alignment: AGENTS.md, TASK-FORMAT.md, and DO.md agree on same rule
  - `cmd: grep -c "optional for XS/S unless a trigger applies" docs/AGENTS.md > /dev/null && echo "AGENTS.md: ok" && grep -c "XS/S: Hansei only when" docs/TASK-FORMAT.md > /dev/null && echo "TASK-FORMAT.md: ok" && grep -c "triggered-only for XS/S" docs/agents/DO.md > /dev/null && echo "DO.md: ok"`

### Context

### Relevant Context
_confidence: 0.53_

**Files:**
- docs/agents/DO.md _(core)_
- docs/TASK-FORMAT.md _(core)_
- docs/AGENTS.md _(core)_

**ADRs:**
- ADR-019: Hansei format and triggered-only design _(enforced)_

**Guidelines:**

**Failure Patterns:**

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Harmonize Hansei requirement for XS/S tasks: DO.md says "always required", TASK-FORMAT.md and AGENTS.md say "triggered-only". Align DO.md to the spec.

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
