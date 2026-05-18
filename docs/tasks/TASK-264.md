## TASK-264: Implement dynamic model provisioning with environment-aware config
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | claude | arch.config.json, cli/src/main/ts/domain/services/

### Context

`modelTiers` in `arch.config.json` are currently static, causing friction when moving between local GPU machines and cloud runners. Users must manually update config or agents run with suboptimal models. The solution integrates `llm-checker` for local discovery and adds environment-specific config overrides for local vs cloud environments.

### Acceptance Criteria

- [ ] `arch.config.json` supports environment-specific `modelTiers` with `local` and `cloud` keys.
- [ ] `arch setup` or `arch govern` detects the environment (local vs cloud/CI) and applies the appropriate model tier overrides.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Environment-aware model provisioning implemented and verified on both local and CI environments.
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
