## TASK-076: Remove redundant DONE.md and simplify archiving
**Meta:** P2 | S | READY | Focus:yes | 7-operations | local | docs/DONE.md, cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts
**Depends:** none

### Acceptance Criteria
- [ ] Remove `docs/DONE.md` from the repository.
- [ ] Remove `updateDoneTable` logic from `MarkdownTaskRepository.ts`.
- [ ] Update `MarkdownTaskRepository` tests to remove `DONE.md` dependency.
- [ ] Verify `arch status` still reports correct `DONE` count from `docs/archive/`.

### Definition of Done
- [ ] `docs/DONE.md` is gone.
- [ ] CLI code is simplified.
- [ ] `arch review` passes.
