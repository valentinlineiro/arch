## TASK-912: arch deps TASK-XXX : dependency tree visualization
**Meta:** P2 | S | READY | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/application/commands/, cli/src/main/ts/index.ts

**Depends:** none

### Context

Backlog navigation requires manually reading each task file to understand the dependency graph. With 9+ active tasks, "which tasks does TASK-206 unblock?" requires grep. Pure graph traversal over `Depends:` fields.

### Acceptance Criteria

- [ ] `arch deps TASK-XXX` prints the dependency tree for the named task:
  - What it depends on (upstream, with their status)
  - What it unlocks (downstream tasks that list it in Depends)
  Format: ASCII tree. Terminal-only. Read-only. No LLM.
  - `cmd: node cli/dist/index.js deps TASK-206`

- [ ] `arch deps --all` prints the full dependency graph sorted by unblocking leverage (tasks that unlock the most downstream work shown first with count).
  - `cmd: node cli/dist/index.js deps --all`

- [ ] Cycle detection: if a dependency cycle exists, emit `[CYCLE] TASK-XXX → TASK-YYY → TASK-XXX` and exit 1.
  - `cmd: node cli/dist/index.js deps --all`

- [ ] `DepsCommand` registered in `index.ts` under `arch deps`.
  - `file: cli/src/main/ts/index.ts`

- [ ] Unit test: linear chain A→B→C renders correctly. Cycle A→B→A detected. Empty deps renders correctly.
  - `prose: verified during implementation`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
