## TASK-931: Round-trip Locked-commit through parser; reconcile lock model in docs
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts, docs/AGENTS.md, docs/agents/DO.md | Closed-at: 2026-05-18T14:00:00Z

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Added `lockedCommitMatch` regex to `parseTask()` and populated `lockedCommit` in the returned task object. Updated DO.md and AGENTS.md to document the three-tier lock model: `lockedBy`/`lockedAt` in-memory, `Locked-commit` persisted auxiliary.
**Constraint:** No schema changes — `lockedCommit` already existed on the `Task` type in `domain/models/task.ts`. Fix was purely additive.
**Cost:** Zero — one regex read added; no mutation to write path.
**Forward Action:** `deterministic-hansei-checker` can now reliably use `task.lockedCommit` as a diff baseline when tasks are reloaded across sessions.
