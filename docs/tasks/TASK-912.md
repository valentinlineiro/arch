## TASK-912: arch deps TASK-XXX : dependency tree visualization
**Meta:** P2 | S | REVIEW | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/, cli/src/main/ts/index.ts

**Depends:** none

### Context

Backlog navigation requires manually reading each task file to understand the dependency graph. With 9+ active tasks, "which tasks does TASK-206 unblock?" requires grep. Pure graph traversal over `Depends:` fields.

### Acceptance Criteria

- [x] `arch deps TASK-XXX` prints the dependency tree for the named task:
  - What it depends on (upstream, with their status)
  - What it unlocks (downstream tasks that list it in Depends)
  Format: ASCII tree. Terminal-only. Read-only. No LLM.
  - `cmd: node cli/dist/index.js deps TASK-206`

- [x] `arch deps --all` prints the full dependency graph sorted by unblocking leverage (tasks that unlock the most downstream work shown first with count).
  - `cmd: node cli/dist/index.js deps --all`

- [x] Cycle detection: if a dependency cycle exists, emit `[CYCLE] TASK-XXX → TASK-YYY → TASK-XXX` and exit 1.
  - `cmd: node cli/dist/index.js deps --all`

- [x] `DepsCommand` registered in `index.ts` under `arch deps`.
  - `file: cli/src/main/ts/index.ts`

- [x] Unit test: linear chain A→B→C renders correctly. Cycle A→B→A detected. Empty deps renders correctly.
  - `prose: verified during implementation`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** DepsCommand implemented with single-task and --all modes. Cycle detection via DFS. Unblocking leverage computed by counting transitive dependents. arch deps --all shows TASK-206 unlocks 7 tasks.
**Constraint:** arch deps scans only active tasks (docs/tasks/) — archived tasks not traversed. Leverage count excludes archived dependents.
**Cost:** No architectural debt introduced — read-only command, no state mutation.
**Forward Action:** None required.
