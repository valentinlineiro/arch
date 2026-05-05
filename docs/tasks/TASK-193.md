## TASK-193: Implement arch next - single-task dispatch command
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/, cli/src/main/ts/index.ts, scripts/arch.sh
**Depends:** none

### Context
The executor currently decides what task to pick by reading the task board and applying priority rules from DO.md — a discretionary judgment that weak models perform unreliably and that introduces drift. `arch next` removes that judgment entirely: the CLI selects the highest-priority READY task (lowest P, then lowest ID) and prints its full file content to stdout, or exits non-zero with a human-readable reason if nothing is actionable. The executor's loop becomes: run `arch next` → execute ACs → `arch task review` → repeat. This is the single highest-leverage change toward weak-model and autonomous compatibility.

### Acceptance Criteria
- [ ] `arch next` prints the full content of the highest-priority READY task (lowest priority number, then lowest TASK-ID) to stdout
- [ ] `arch next` exits non-zero and prints a halt reason when: no READY tasks exist, the highest-priority READY task is blocked, or a P0 IN_PROGRESS task has a stale lock (> 3 days)
- [ ] `arch next` respects `Focus:yes` — a focused task always wins over any non-focused READY task
- [ ] `arch next --json` emits `{ "taskId": "TASK-XXX", "filePath": "...", "content": "..." }` for machine consumption
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
