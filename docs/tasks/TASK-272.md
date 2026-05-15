## TASK-272: Add Local-First Decomposition heuristic to THINK refinement protocol
**Meta:** P2 | S | READY | Focus:no | 6-writing | claude | docs/agents/THINK.md

### Context

The current THINK refinement process often produces M/L tasks that require Claude/Gemini, losing the cost efficiency of local Ollama models. By adding a "Local-First Decomposition" heuristic to THINK Phase 2, agents are required to attempt splitting M+ tasks into at least 2-3 XS/S subtasks when the logic is modularizable. An `arch review` warning should surface when too many M/L tasks lack a decomposition justification.

### Acceptance Criteria

- [ ] `docs/agents/THINK.md` Phase 2 includes a "Local-First Decomposition" heuristic with explicit criteria for when decomposition is mandatory vs. justified as complex.
- [ ] `arch review` warns when READY tasks have M/L size without a documented decomposition rationale.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [ ] THINK.md updated with Local-First Decomposition heuristic; arch review check implemented.
- [ ] `arch review` passes.
