## TASK-128: Fix arch conduct to use CLI instead of API
**Meta:** P0 | S | 5 | READY | Focus:yes | 7-operations | local | scripts/arch.sh

### Problem
The `arch conduct` command is reportedly using an API directly instead of calling the configured AI CLI. This violates the ARCH principle of using local CLIs for AI interaction to ensure portability and user control over tools.

### Acceptance Criteria
- [ ] Audit `scripts/arch.sh` and ensure `conduct` uses `invoke_agent` (which calls the CLI).
- [ ] If `conduct` logic is found to be using direct API calls (e.g. via `curl` or a hidden node script), refactor it to use the `invoke_agent` mechanism.
- [ ] Verify that `arch conduct` correctly routes to the primary CLI defined in `arch.config.json`.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
