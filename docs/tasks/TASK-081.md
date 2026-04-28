## TASK-081: Auto-inject Closed-at timestamp in MarkTaskDone
**Meta:** P2 | XS | IN_PROGRESS | Focus:yes | 1-implementation | cli | cli/src/main/ts/application/use-cases/mark-task-done.ts | lock:cli
**Depends:** none

### Acceptance Criteria
- [ ] `MarkTaskDone.execute()` injects `Closed-at: <ISO 8601 UTC>` as a new line after `**Depends:**` when transitioning a task to DONE.
- [ ] The timestamp is only injected when no `Closed-at` field already exists (idempotent).
- [ ] `MarkdownTaskRepository` reads and preserves `Closed-at` when parsing task files.
- [ ] Unit tests cover: timestamp injection, idempotency (existing field not overwritten), and force-bypass path.

### Definition of Done
- [ ] `arch task done TASK-XXX` produces a file with `Closed-at` set automatically.
- [ ] `arch review` passes.
