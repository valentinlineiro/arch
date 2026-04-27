## TASK-047: Migrate sprint/backlog to single docs/tasks/ with Focus field
**Meta:** P1 | M | DONE | Focus:yes | 2-code-generation | claude-code | docs/tasks/, cli/src/, docs/AGENTS.md
**Depends:** ADR-004

### Acceptance Criteria
- [x] Create `docs/tasks/` as a single directory — merge content from `docs/tasks/sprint/` and `docs/tasks/backlog/`
- [x] Add `Focus: yes/no` field to the Meta line of each active task (`yes` = formerly in sprint, `no` = formerly in backlog)
- [x] Meta format updated: `P1 | S | READY | Focus:yes | 6-writing | claude | docs/`
- [x] CLI (`MarkdownTaskRepository`) updated to read from `docs/tasks/` and filter by `Focus`
- [x] `arch status` shows Focus:yes tasks as active and Focus:no tasks as queued
- [x] `docs/AGENTS.md` and `docs/agents/DO.md` updated — remove references to sprint/ and backlog/ as directories
- [x] `arch.config.json` paths updated if applicable
- [x] `arch review` Drift:Paths passes without WARNs after migration

### Definition of Done
- [x] Todos los tasks migrados al nuevo formato
- [x] CLI funcional con nueva estructura
- [x] `arch review`: OK
- [x] PR aprobado
