## TASK-974: Command registry as single source of truth for CLI surface

**Meta:** P1 | M | IN_PROGRESS | Focus:no | 2-code-generation | human | cli/src/main/ts/

## Context

CLI help was split across hardcoded strings in `index.ts` and `task-command.ts`. Missing commands (`memory index/explain/deps`, `govern report/conduct/approve`) were a direct symptom of the duplication. No automated check prevented drift.

## What

1. Command registry: `command-registry.ts` with 59 entries, visibility classification.
2. Help derived from registry: top-level and task help render dynamically.
3. Scope-aware review: `arch review --staged/delta/full/hybrid` modes.
4. Pre-push hook delta mode: runs `--staged` by default, no longer blocks on global state.
5. Tests: `command-registry.test.ts` with invariant coverage.

## Acceptance Criteria

- `arch --help` output matches `COMMAND_REGISTRY.filter(visibility=public)`
- `arch task --help` output matches `getPublicSubCommands('task')`
- `arch review --staged` skips global checks (OrphanTasks, FocusStatusAlignment, SentinelCoverage, DeadContext)
- `arch review --full` runs all checks
- `npm test` passes (562 tests, 0 failures)

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