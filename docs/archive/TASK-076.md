## TASK-076: Remove redundant DONE.md and simplify archiving
**Meta:** P2 | S | DONE | Focus:yes | 7-operations | local | docs/DONE.md, cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts
**Depends:** none

### Acceptance Criteria
- [x] Remove `docs/DONE.md` from the repository.
- [x] Remove `updateDoneTable` logic from `MarkdownTaskRepository.ts`.
- [x] Update `MarkdownTaskRepository` tests to remove `DONE.md` dependency.
- [x] Verify `arch status` still reports correct `DONE` count from `docs/archive/`.

### Definition of Done
- [x] `docs/DONE.md` is gone.
- [x] CLI code is simplified.
- [x] `arch review` passes.
