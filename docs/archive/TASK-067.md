## TASK-067: Commit IDEA operations (registration and promotion) atomically
**Meta:** P1 | XS | 5 | DONE | Focus:yes | 7-operations | local | docs/agents/DO.md, docs/agents/THINK.md, docs/guidelines/bugs.md, docs/refinement/
**Closed-at:** 2026-04-27T15:20:00Z

### Bug
ARCH currently allows IDEA operations (registration and promotion) to occur without being committed in the same operation. That breaks the expected durability of state changes and can leave the repository in an inconsistent or unpersisted state.

### Root Cause
The DO-mode and THINK-mode protocols do not consistently enforce atomic commits for these specific operations.

### Fix
Make IDEA registration (DO mode) and promotion (THINK mode) atomic create/update-and-commit operations. Update the protocols to explicitly require immediate commits.

### Acceptance Criteria
- [x] Clarify in `docs/agents/DO.md` that `idea:` registration must end with a commit in the same operation
- [x] Update `docs/agents/THINK.md` to require an atomic commit when an IDEA is promoted to a TASK
- [x] Ensure the registration workflow leaves no uncommitted idea draft behind after creation
- [x] Ensure the promotion workflow leaves no uncommitted task file or IDEA status change behind

### Definition of Done
- [x] Idea registration is durable and auditable in git history
- [x] Idea promotion is durable and auditable in git history
- [x] Protocols (`DO.md` and `THINK.md`) and actual workflow match
