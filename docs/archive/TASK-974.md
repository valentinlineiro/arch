## TASK-974: Command registry as single source of truth for CLI surface

**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | human | cli/src/main/ts/
**Closed-at:** 2026-05-20T12:46:07Z

## Context

CLI help was split across hardcoded strings in `index.ts` and `task-command.ts`. Missing commands (`memory index/explain/deps`, `govern report/conduct/approve`) were a direct symptom of the duplication. No automated check prevented drift.

## What

1. **Command registry** — `command-registry.ts` with 59 entries, visibility classification. Help rendered from registry (top-level and task).
2. **Scope-aware review** — `--staged` (delta), `--full`, `--hybrid` modes. Pre-push runs `--staged` by default. Global checks excluded from delta.
3. **Focus model alignment** — `Task.focus` changed from boolean to `FocusLevel` enum (NONE/LOW/MEDIUM/HIGH). Parser and serializer updated for both old (yes/no) and new (NONE/etc) formats. Conflict severity classification added (H1/H2/INFO). Existing tests updated.
4. **ConflictSeverity enum** — formal conflict structure for semantic drift detection.
5. **FocusConflict type** — structured conflict records for logging and analysis.

### Acceptance Criteria

- [x] Command registry, scope-aware review, FocusLevel enum delivered
  - `prose: verified`
- [x] `npm test` passes (562 tests, 0 failures)
  - `cmd: npm --prefix cli test; exit: 0`
- [x] `arch review` passes
  - `cmd: arch review; exit: 0`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes

## Verifiability

- cmd: cd cli && npm run build && npm test 2>&1 | grep "tests"
- cmd: arch review --staged; echo "exit: $?" (should exit 0)
- cmd: arch review --full --json 2>&1 | grep success (true when all critical checks pass)
- file: cli/src/main/ts/domain/services/command-registry.ts
- file: cli/src/main/ts/index.ts (help renders from registry)
- file: cli/src/main/ts/application/commands/task-command.ts (help renders from registry)
- file: cli/src/main/ts/application/use-cases/review-system.ts (scope-aware)
- file: cli/src/main/ts/application/commands/review-command.ts (--staged/--full flags)
- file: .git/hooks/pre-push (delta mode)

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Implemented delta/full/hybrid scope separation in review-system.ts and review-command.ts. Pre-push hook now runs --staged (delta) by default. Global checks (OrphanTasks, FocusStatusAlignment, SentinelCoverage, DeadContext, etc.) are excluded from delta scope and only run in full/hybrid mode.
**Constraint:** Registry must be kept manually aligned with index.ts switch-case. Scope defaults to hybrid; explicit --staged required for delta mode. Global checks fire on FAIL regardless of scope in hybrid/full.
**Cost:** Reduced pre-push hook noise. Global health now requires explicit --full run. False positives from historical state eliminated.
**Forward Action:** Address the Focus/IN_PROGRESS incoherence separately — it's a model-level decision not a review implementation issue.

## Approval
Approved-by: human-auditor | 2026-05-20