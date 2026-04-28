## TASK-048: Detect dirty worktree and task/archive drift in arch review
**Meta:** P1 | S | 5 | DONE | Focus:yes | 2-code-generation | claude-code | cli/src/, docs/agents/THINK.md, docs/agents/DO.md, docs/guidelines/
**Depends:** none

### Acceptance Criteria
- [x] `arch review` or THINK/DO protocol detects dirty worktree from tracked deletions and relevant root temp files
- [x] System detects inconsistency when the same task exists in both `docs/tasks/` and `docs/archive/` in an invalid state
- [x] Output clearly classifies ignorable runtime artifacts vs real repo drift
- [x] Rule is documented in the corresponding guideline or protocol

### Definition of Done
- [x] Deterministic check implemented or protocol updated
- [x] No obvious false positives on intentional human changes
- [ ] PR aprobado
