## TASK-280: Design multiagent runtime specification - Planner, Historian, Reviewer, Conductor, Optimizer
**Meta:** P2 | S | READY | Focus:no | 6-writing | claude | docs/agents/, cli/src/main/ts/

### Context

ARCH's current two-mode agent model (THINK/DO) conflates responsibilities that benefit from specialization, limiting parallelism and increasing context bloat. This task produces a formal design specification for the five-agent multiagent layer (Planner, Historian, Reviewer, Conductor, Optimizer), documenting agent roles, communication model (repository as shared memory), and prerequisite ordering.

### Acceptance Criteria

- [ ] A design document specifies the role, input, output, and lifecycle of each of the five agents.
- [ ] The document explicitly states prerequisite ordering (memory Phase 2, routing Phase 3, policies Phase 4 must precede implementation).
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Multiagent runtime specification written and placed in docs/agents/ or docs/adr/.
- [ ] `arch review` passes.
