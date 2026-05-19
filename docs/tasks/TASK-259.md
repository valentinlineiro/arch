## TASK-259: Automate turn-count recording in arch task done
**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | cli/src/main/ts/application/use-cases/loop-engine.ts, docs/KAIZEN-LOG.md

### Context

Mura detection in THINK Phase 3 depends on `Turns: N` metadata in archived tasks. This field is currently manual and consistently omitted by agents, causing a total loss of cycle-time data. The system can derive turn count from git log since the task was set to IN_PROGRESS.

### Acceptance Criteria

- [ ] `arch task done` (or the internal `ArchiveTask` use-case) automatically records a `Turns: N` field derived from git history or session context when archiving a task.
- [ ] The `Turns` field is present and non-zero in tasks archived after this change.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] ArchiveTask use-case populates `Turns: N` automatically without agent intervention.
- [ ] `arch review` passes.
