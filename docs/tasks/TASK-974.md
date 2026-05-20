## TASK-974: Command registry as single source of truth for CLI surface

**Meta:** P1 | M | IN_PROGRESS | Focus:no | 2-code-generation | cli | command-registry

## Context

CLI help was split across hardcoded strings in `index.ts` and `task-command.ts`. Missing commands (`memory index/explain/deps`, `govern report/conduct/approve`) were a direct symptom of the duplication. No automated check prevented drift.

## What

1. Create `command-registry.ts` with 59 command entries, each having `visibility` (public/internal/deprecated/experimental), `description`, and `category`.
2. Make top-level `--help` dynamically derive from registry (was hardcoded).
3. Make `arch task --help` dynamically derive from registry (was hardcoded).
4. Add `command-registry.test.ts` with 10 invariant tests that fail on any subcommand drift.
5. Expose all memory and govern subcommands via registry.

## Acceptance Criteria

- `arch --help` output matches `COMMAND_REGISTRY.filter(visibility=public)`
- `arch task --help` output matches `getPublicSubCommands('task')`
- `npm test` passes (562 tests, 0 failures)
- Adding a public command without adding to registry causes a test failure

## Verifiability

- cmd: cd cli && npm run build && npm test 2>&1 | grep "tests"
- file: cli/src/main/ts/domain/services/command-registry.ts
- file: cli/src/main/ts/index.ts (default case renders from registry)
- file: cli/src/main/ts/application/commands/task-command.ts (--help renders from registry)
- file: cli/src/test/ts/command-registry.test.ts

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** CLI help surface was bifurcated between hardcoded strings and runtime behavior. Created a canonical registry and made all help render from it.
**Constraint:** Registry entries must stay in sync with actual CLI implementation. Tests enforce this but tests could be bypassed.
**Cost:** 573 lines added across 3 files. Registry itself is single source of truth but the registry file is independent of the switch-case in index.ts — they must be kept manually aligned.
**Forward Action:** Consider adding a lint rule that cross-references the registry against the switch-case in index.ts to prevent divergence.