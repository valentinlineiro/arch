## TASK-909: Hansei pattern synthesis: TENSION creation from signal corpus
**Meta:** P1 | M | READY | Focus:yes | 1-code-reasoning | claude-code | docs/agents/THINK.md, cli/src/main/ts/domain/services/signal-router.ts

**Depends:** none

### Context

SignalRouter routes H2/H3 Hansei signals to `.arch/causal-signal.jsonl`. `arch report` aggregates them into a category breakdown. But THINK never synthesizes these into actionable protocol changes — the signal system is write-only. This is the missing link between signal accumulation and the moat condition.

### Acceptance Criteria

- [ ] `aggregateHanseiSignals()` in `signal-router.ts` extended to return task IDs per category (already returns `count` and `isWeakSignal` — add `taskIds: string[]` to `HanseiAggregate`).
  - `file: cli/src/main/ts/domain/services/signal-router.ts`

- [ ] `THINK.md` Phase 2 updated with Hansei pattern synthesis step:
  After Kaizen analysis, read `.arch/causal-signal.jsonl` and group by category.
  For any category with count ≥ 3 (weak signal threshold):
  - Check `docs/tensions/` for existing TENSION referencing this category
  - If none: create `docs/tensions/TENSION-XXX.md` with pattern, affected task IDs, proposed protocol change. Commit with `[THINK]` tag.
  - If exists: append new evidence block to existing TENSION file. Commit with `[THINK]` tag.
  For any category with count ≥ 5 (strong signal):
  - Append `[PATTERN-ALERT] [Category] N occurrences — systemic. See docs/tensions/TENSION-XXX.md` to `docs/INBOX.md`.
  THINK never modifies `docs/guidelines/` directly. Only proposals.
  - `file: docs/agents/THINK.md`

- [ ] `docs/tensions/TENSION-template.md` created with required fields:
  Pattern, Category, Affected tasks (IDs), Evidence (Hansei Decision excerpts), Proposed protocol change, Status (OPEN/RESOLVED).
  - `file: docs/tensions/TENSION-template.md`

- [ ] Unit test: `aggregateHanseiSignals` with 4 signals of same category returns `isWeakSignal: true` and `taskIds` array of length 4.
  - `cmd: npm test`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

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
