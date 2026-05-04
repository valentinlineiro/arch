## TASK-165: Implement Command Allowlist and FS Guard for Sandbox
**Meta:** P0 | S | REVIEW | Focus:yes | 7-operations | local | cli/src/main/ts/domain/services/sandbox.ts
**Depends:** TASK-164

### Acceptance Criteria
- [x] Implement allowlist for commands (test, grep, jq, node, git status).
- [x] Enforce read-only filesystem access except for `/tmp`.

### Definition of Done
- [ ] `arch review` passes.
