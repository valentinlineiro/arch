## TASK-279: Implement arch ask — memory queries over the full ARCH operational corpus
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/

### Context

ARCH accumulates operational memory across hundreds of tasks, retros, ADRs, and guidelines, but this memory is not queryable. Agents repeat work already done and miss relevant prior decisions. `arch ask "<question>"` will analyze the full corpus and return causal patterns, recurring failure signatures, and actionable recommendations, powered by the ContextIndex from TASK-219.

### Acceptance Criteria

- [ ] `arch ask "<question>"` queries the ARCH corpus and returns relevant patterns, related tasks/ADRs, and a suggested action.
- [ ] The command requires no external API key and works locally.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [ ] `arch ask` command implemented and functional against the local corpus.
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
