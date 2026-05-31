## TASK-275: Implement adaptive planning - human-state qualifiers for task status
**Meta:** P3 | S | BLOCKED | Focus:no | 6-writing | claude | docs/TASK-FORMAT.md, docs/guidelines/

### Context

ARCH task statuses model pipeline state but not human state. A task can be technically READY but unreachable due to cognitive bandwidth, energy, or context load. This task extends the task status vocabulary with optional human-state qualifiers and integrates them into `arch next` with an optional `--energy` flag.

### Acceptance Criteria

- [ ] `docs/TASK-FORMAT.md` documents the optional human-state qualifiers (`READY/high-cost`, `READY/context-heavy`, `BLOCKED/energy`, `READY/maintenance`) with usage guidance.
- [ ] `arch next` accepts an optional `--energy low|medium|high` flag and filters/sorts suggestions accordingly.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Human-state qualifiers documented in TASK-FORMAT.md and integrated into arch next.
- [ ] `arch review` passes.
