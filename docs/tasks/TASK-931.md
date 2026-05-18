## TASK-931: Round-trip Locked-commit through parser; reconcile lock model in docs
**Meta:** P1 | S | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts, docs/AGENTS.md, docs/agents/DO.md

### Context

Promoted from IDEA-lock-model-contradiction (TASK-927 audit, finding 3).

Human decision: persist `Locked-commit` as auxiliary provenance field (not a meta line field); must round-trip through the parser. `lockedBy` / `lockedAt` remain session/in-memory only. The meta line stays canonical and compact.

**Current state:**
- `markdown-task-repository.ts:88` writes `Locked-commit` via `ensureField` — correct per decision.
- `markdown-task-repository.ts:145–200` (parseTask): never reads `Locked-commit` back. It silently drops on every reload.
- `docs/agents/DO.md:16`: says "add lock in Meta line" — wrong. Meta line is not the home for lock state.
- `docs/AGENTS.md:126`: says "Lock fields (lockedBy, lockedAt) are in-memory only. Never write them to the meta line." — mostly right but doesn't distinguish Locked-commit from lockedBy/lockedAt.

### Acceptance Criteria

- [ ] `parseTask()` reads `**Locked-commit:**` from task content and populates `task.lockedCommit`.
- [ ] A task saved with a `lockedCommit` value, then reloaded via `parseTask()`, has a non-null `lockedCommit`.
- [ ] `docs/agents/DO.md` no longer says "add lock in Meta line." Updated to: set `lockedBy`/`lockedAt` in memory for session tracking; `Locked-commit` is written as an auxiliary provenance field (not in meta line).
- [ ] `docs/AGENTS.md` distinguishes `lockedBy`/`lockedAt` (in-memory only) from `Locked-commit` (persisted auxiliary field).
- [ ] `arch review` passes after changes.

### Definition of Done
- [ ] Tests pass (a round-trip test: write task with lockedCommit → reload → lockedCommit preserved).
- [ ] `arch review` passes.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Placeholder — to be filled at close.
**Constraint:** Placeholder — to be filled at close.
**Cost:** Placeholder — to be filled at close.
**Forward Action:** Placeholder — to be filled at close.
