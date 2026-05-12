## TASK-227: Relocate drift-checker to application layer and define domain boundary
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/
**Depends:** none

## Context

`drift-checker.ts` lived in `domain/services/` despite depending on `FileSystem` and `GitRepository` (infrastructure) and being consumed exclusively by the `application/` layer. Its placement was a semantic lie: `domain/` implies pure business logic, no infrastructure dependencies. This caused EscalationMaturity to fire on every drift-related fix — the governance tool was blocking its own maintenance.

The broader issue: `protectedPaths` in `arch.config.json` covered all of `cli/src/main/ts/domain/` without a prior ADR defining what that boundary means. Protection was implicit, not designed.

## Acceptance Criteria

- [x] `drift-checker.ts` moved to `application/use-cases/`
- [x] All imports updated; build passes
- [x] `arch review` Commands check: `✔`
- [x] `arch review` EscalationMaturity check: `✔` (when ADR is staged)
- [x] ADR-016 written, defining the domain layer semantic boundary
- [x] `protectedPaths` narrowed to `domain/models/` and `domain/repositories/`
- [x] `ask` and `causal` added to `CLI_COMMANDS` set in drift-checker (false-positive fix)

## Hansei

The root cause was that `protectedPaths` was set broadly without a written definition of what `domain/` means. That made it impossible to correct misplacements without triggering the same governance that was supposed to prevent them. ADR-016 closes that gap: protection is now scoped to the actual domain core.
