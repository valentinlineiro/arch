## TASK-931: Round-trip Locked-commit through parser; reconcile lock model in docs
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts, docs/AGENTS.md, docs/agents/DO.md | Closed-at: 2026-05-18T14:00:00Z

### Context

Promoted from IDEA-lock-model-contradiction (TASK-927 audit, finding 3).

Human decision: persist `Locked-commit` as auxiliary provenance field (not a meta line field); must round-trip through the parser. `lockedBy` / `lockedAt` remain session/in-memory only. The meta line stays canonical and compact.

**Current state:**
- `markdown-task-repository.ts:88` writes `Locked-commit` via `ensureField` — correct per decision.
- `markdown-task-repository.ts:145–200` (parseTask): never reads `Locked-commit` back. It silently drops on every reload.
- `docs/agents/DO.md:16`: says "add lock in Meta line" — wrong. Meta line is not the home for lock state.
- `docs/AGENTS.md:126`: says "Lock fields (lockedBy, lockedAt) are in-memory only. Never write them to the meta line." — mostly right but doesn't distinguish Locked-commit from lockedBy/lockedAt.

### Acceptance Criteria

- [x] `parseTask()` reads `**Locked-commit:**` from task content and populates `task.lockedCommit`.
- [x] A task saved with a `lockedCommit` value, then reloaded via `parseTask()`, has a non-null `lockedCommit`.
- [x] `docs/agents/DO.md` no longer says "add lock in Meta line." Updated to: set `lockedBy`/`lockedAt` in memory for session tracking; `Locked-commit` is written as an auxiliary provenance field (not in meta line).
- [x] `docs/AGENTS.md` distinguishes `lockedBy`/`lockedAt` (in-memory only) from `Locked-commit` (persisted auxiliary field, round-trips through parser).
- [x] `arch review` unchanged (no new violations introduced).

### Definition of Done
- [x] Tests pass (a round-trip test: write task with lockedCommit → reload → lockedCommit preserved).
- [x] `arch review` unchanged.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Added `lockedCommitMatch` regex to `parseTask()` and populated `lockedCommit` in the returned task object. Updated DO.md and AGENTS.md to document the three-tier lock model: `lockedBy`/`lockedAt` in-memory, `Locked-commit` persisted auxiliary.
**Constraint:** No schema changes — `lockedCommit` already existed on the `Task` type in `domain/models/task.ts`. Fix was purely additive.
**Cost:** Zero — one regex read added; no mutation to write path.
**Forward Action:** `deterministic-hansei-checker` can now reliably use `task.lockedCommit` as a diff baseline when tasks are reloaded across sessions.
