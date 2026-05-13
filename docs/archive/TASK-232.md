## TASK-232: Grandfather legacy tasks in arch review - silence Hansei warnings
**Meta:** P2 | XS | DONE | Focus:yes | 7-operations | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts | Closed-at: 2026-05-13T13:30:00Z
**Depends:** none

### Context
`arch review` emits 160+ HanseiPresent warnings for legacy tasks (TASK-001 to TASK-183) that predate the Hansei protocol. This creates noise that obscures real violations in the active backlog.

### Acceptance Criteria
- [x] `HanseiPresent` check only enforces the section for tasks created at or after TASK-195 (when the protocol was mandated), OR a cutoff task number is configurable in arch.config.json
- [x] `arch review` output no longer lists legacy archived tasks as HanseiPresent violations
- [x] TASK-229 (and any post-protocol tasks missing Hansei) still correctly flagged

## Hansei
The root cause was a path mismatch: `hanseiSinceTaskId` lives under `config.governance` in `arch.config.json` but the checker read it from the root. The fix was one line; the better fix would have been consistent nesting from the start.

