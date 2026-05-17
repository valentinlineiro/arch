## TASK-911: Persistent session identity : Actor field in task lock
**Meta:** P2 | S | DONE | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/mark-task-in-progress.ts, cli/src/main/ts/domain/models/task.ts, arch.config.json
**Closed-at:** 2026-05-17T12:05:15.284Z

**Depends:** none

### Context

Every session is anonymous. `arch report` shows cycle time by size but not by model. Routing decisions (which model for which class) are made on assumption, not evidence. Adding an `Actor` field at task start time enables evidence-based routing decisions after corpus builds.

### Acceptance Criteria

- [x] `Task` model gains `actor?: string` field.
  - `file: cli/src/main/ts/domain/models/task.ts`

- [x] `MarkTaskInProgress.execute()` reads `actor` from `arch.config.json` routing strategies for the task's class. Format: `<provider>/<model>` (e.g. `claude-code/sonnet`). If no routing config matches, falls back to `arch.config.json` `defaultActor` field, then `unknown`.
  - `file: cli/src/main/ts/application/use-cases/mark-task-in-progress.ts`

- [x] `MarkdownTaskRepository.save()` persists `Actor: <value>` alongside `Locked-by` and `Locked-at`.
  - `file: cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts`

- [x] `arch report` cycle-time breakdown extended: if Actor field present in ≥5 archived tasks, add `Actor breakdown` table showing avg turns per actor per size tier.
  - `file: cli/src/main/ts/application/commands/report-command.ts`

- [x] Backwards compatible: tasks without Actor field continue to work. Report falls back to current behavior when Actor data is sparse.
  - `prose: verified by running arch review after implementation`

- [x] `arch review` passes.
  - `prose: arch review OK — verified during implementation`

- [x] `npm test` passes.
  - `prose: verified during implementation`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** Actor field added to Task model, resolved from arch.config.json routing strategies in MarkTaskInProgress. Persisted as Actor: field. actorBreakdown added to MetricsEngine and ReportCommand. 415 tests pass.
**Constraint:** resolveActor reads config via taskRepository.fileSystem — this is fragile. A cleaner injection path would pass FileSystem directly to MarkTaskInProgress. Acceptable for now.
**Cost:** None — no architectural debt beyond the constraint above.
**Forward Action:** None required.
