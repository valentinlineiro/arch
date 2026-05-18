## TASK-283: Define Sentinel call log infrastructure and CLI command
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/, docs/agents/DO.md

### Context

DO.md mandates Sentinel preflight reasoning calls for high-cost or high-risk operations, but there is no structured log of these calls and `arch review` cannot verify they occurred. This task defines the Sentinel call log format, implements `arch sentinel log` CLI command, and adds a `SentinelCoverage` drift check for IN_PROGRESS tasks above a cost threshold.

### Acceptance Criteria

- [ ] `docs/SENTINEL-LOG.md` format is defined and `arch sentinel log TASK-XXX --trigger "<reason>" --outcome GO|HALT` appends validated entries.
- [ ] A `SentinelCoverage` drift check in `arch review` verifies at least one SENTINEL-LOG entry exists for IN_PROGRESS tasks above the configured cost threshold.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Sentinel log infrastructure, CLI command, and drift check implemented.
- [ ] `arch review` passes.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Task created at promotion time; no implementation decisions made yet.

**Constraint:**
Hansei fields populated at creation to satisfy pre-commit linter requirement for M+ tasks.

**Cost:**
No implementation cost incurred at this stage.

**Forward Action:**
Real Hansei to be written at REVIEW time per ADR-019.
