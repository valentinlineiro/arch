## TASK-067: Commit idea drafts when they are registered
**Meta:** P1 | XS | IN_PROGRESS | Focus:yes | 7-operations | local | docs/agents/DO.md, docs/guidelines/bugs.md, docs/refinement/

### Bug
ARCH currently allows an idea draft to be created in `docs/refinement/` without being committed in the same operation. That breaks the expected durability of registration and can leave newly registered ideas vulnerable to loss or invisible in the task history.

### Root Cause
The DO-mode rule for `idea:` registration says to create the draft file and stop, but the workflow is not being enforced consistently as a committed atomic operation.

### Fix
Make idea registration an atomic create-and-commit operation, and clarify the protocol so newly registered idea drafts are always persisted in git immediately.

### Acceptance Criteria
- [ ] Clarify in `docs/agents/DO.md` that `idea:` registration must end with a commit in the same operation
- [ ] Ensure the registration workflow leaves no uncommitted idea draft behind after creation
- [ ] Preserve the stop-after-draft behavior: create the idea, commit it, and wait for THINK evaluation

### Definition of Done
- [ ] Idea registration is durable and auditable in git history
- [ ] Protocol and actual workflow match
