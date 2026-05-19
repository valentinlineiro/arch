## TASK-270: Add load-balancing mechanism to LoopEngine for refinement queue pressure
**Meta:** P3 | S | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/

### Context

`arch loop` follows a fixed GOVERN → SELECT → EXEC → REVIEW → ARCHIVE cycle focused on READY tasks. When the refinement queue grows large (>20 pending IDEAs), the loop ignores it entirely, causing a pipeline bottleneck. This task introduces dynamic mode selection in `LoopEngine` based on system metrics.

### Acceptance Criteria

- [ ] `LoopEngine` reads the count of pending IDEAs and adjusts loop mode: when IDEAs exceed the configured threshold, a REFINE phase is triggered instead of the default EXEC phase.
- [ ] Threshold is configurable in `arch.config.json` with a default of 20.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Load-balancing logic implemented in LoopEngine with configurable threshold.
- [ ] `arch review` passes.
