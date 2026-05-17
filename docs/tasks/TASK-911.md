## TASK-911: Persistent session identity : Actor field in task lock
**Meta:** P2 | S | IN_PROGRESS | Focus:yes | 7-operations | claude-code | cli/src/main/ts/application/use-cases/mark-task-in-progress.ts, cli/src/main/ts/domain/models/task.ts, arch.config.json

**Depends:** none

### Context

Every session is anonymous. `arch report` shows cycle time by size but not by model. Routing decisions (which model for which class) are made on assumption, not evidence. Adding an `Actor` field at task start time enables evidence-based routing decisions after corpus builds.

### Acceptance Criteria

- [ ] `Task` model gains `actor?: string` field.
  - `file: cli/src/main/ts/domain/models/task.ts`

- [ ] `MarkTaskInProgress.execute()` reads `actor` from `arch.config.json` routing strategies for the task's class. Format: `<provider>/<model>` (e.g. `claude-code/sonnet`). If no routing config matches, falls back to `arch.config.json` `defaultActor` field, then `unknown`.
  - `file: cli/src/main/ts/application/use-cases/mark-task-in-progress.ts`

- [ ] `MarkdownTaskRepository.save()` persists `Actor: <value>` alongside `Locked-by` and `Locked-at`.
  - `file: cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts`

- [ ] `arch report` cycle-time breakdown extended: if Actor field present in ≥5 archived tasks, add `Actor breakdown` table showing avg turns per actor per size tier.
  - `file: cli/src/main/ts/application/commands/report-command.ts`

- [ ] Backwards compatible: tasks without Actor field continue to work. Report falls back to current behavior when Actor data is sparse.
  - `prose: verified by running arch review after implementation`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

- [ ] `npm test` passes.
  - `prose: verified during implementation`

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
