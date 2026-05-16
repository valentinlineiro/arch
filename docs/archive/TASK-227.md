## TASK-227: Relocate drift-checker to application layer and define domain boundary
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/
**Closed-at:** 2026-05-12T07:30:48.268Z
**Depends:** none

## Approval
Approved-by: Auditor | 2026-05-12

## Hansei

The root cause was that `protectedPaths` was set broadly without a written definition of what `domain/` means. That made it impossible to correct misplacements without triggering the same governance that was supposed to prevent them. ADR-016 closes that gap: protection is now scoped to the actual domain core.
