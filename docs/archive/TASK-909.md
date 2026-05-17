## TASK-909: Hansei pattern synthesis: TENSION creation from signal corpus
**Meta:** P1 | M | DONE | Focus:no | 1-code-reasoning | claude-code | docs/agents/THINK.md, cli/src/main/ts/domain/services/signal-router.ts
**Closed-at:** 2026-05-17T07:13:07.581Z

**Depends:** none

### Context

SignalRouter routes H2/H3 Hansei signals to `.arch/causal-signal.jsonl`. `arch report` aggregates them into a category breakdown. But THINK never synthesizes these into actionable protocol changes — the signal system is write-only. This is the missing link between signal accumulation and the moat condition.

### Acceptance Criteria

- [x] `aggregateHanseiSignals()` in `signal-router.ts` extended to return task IDs per category (already returns `count` and `isWeakSignal` — add `taskIds: string[]` to `HanseiAggregate`).
  - `file: cli/src/main/ts/domain/services/signal-router.ts`

- [x] `THINK.md` Phase 2 updated with Hansei pattern synthesis step:
  After Kaizen analysis, read `.arch/causal-signal.jsonl` and group by category.
  For any category with count ≥ 3 (weak signal threshold):
  - Check `docs/tensions/` for existing TENSION referencing this category
  - If none: create `docs/tensions/TENSION-XXX.md` with pattern, affected task IDs, proposed protocol change. Commit with `[THINK]` tag.
  - If exists: append new evidence block to existing TENSION file. Commit with `[THINK]` tag.
  For any category with count ≥ 5 (strong signal):
  - Append `[PATTERN-ALERT] [Category] N occurrences — systemic. See docs/tensions/TENSION-XXX.md` to `docs/INBOX.md`.
  THINK never modifies `docs/guidelines/` directly. Only proposals.
  - `file: docs/agents/THINK.md`

- [x] `docs/tensions/TENSION-template.md` created with required fields:
  Pattern, Category, Affected tasks (IDs), Evidence (Hansei Decision excerpts), Proposed protocol change, Status (OPEN/RESOLVED).
  - `file: docs/tensions/TENSION-template.md`

- [x] Unit test: `aggregateHanseiSignals` with 4 signals of same category returns `isWeakSignal: true` and `taskIds` array of length 4.
  - `prose: 411 tests pass — verified`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** AC1 was already implemented (taskIds already in HanseiAggregate and aggregateHanseiSignals). AC2 done (THINK.md Phase 2 updated). AC3 done (TENSION-template.md created). AC4: 2 unit tests added and passing. 411 tests total.
**Constraint:** Pattern synthesis is documented in THINK.md but not yet automated in the CLI — THINK is executed by an LLM reading the protocol, not by arch reflect directly. The synthesis will run on the next arch reflect session.
**Cost:** None — no architectural debt introduced.
**Forward Action:** None required.
