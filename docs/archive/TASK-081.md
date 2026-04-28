## TASK-081: Auto-inject Closed-at timestamp in MarkTaskDone
**Meta:** P2 | XS | DONE | Focus:yes | 1-implementation | cli | cli/src/main/ts/application/use-cases/mark-task-done.ts
**Depends:** none
**Closed-at:** 2026-04-28T08:31:30.120Z

### Acceptance Criteria
- [x] `MarkTaskDone.execute()` injects `Closed-at: <ISO 8601 UTC>` as a new line after `**Depends:**` when transitioning a task to DONE.
- [x] The timestamp is only injected when no `Closed-at` field already exists (idempotent).
- [x] `MarkdownTaskRepository` reads and preserves `Closed-at` when parsing task files.
- [x] Unit tests cover: timestamp injection, idempotency (existing field not overwritten), and force-bypass path.

### Definition of Done
- [x] `arch task done TASK-XXX` produces a file with `Closed-at` set automatically.
- [x] `arch review` passes.
