## TASK-165: Implement Command Allowlist and FS Guard for Sandbox
**Meta:** P0 | S | DONE | Focus:no | 7-operations | local | cli/src/main/ts/domain/services/sandbox.ts
**Closed-at:** 2026-05-04T09:32:00.644Z
**Depends:** TASK-164

### Acceptance Criteria
- [x] Implement allowlist for commands (test, grep, jq, node, git status).
- [x] Enforce read-only filesystem access except for `/tmp`.

### Definition of Done
- [x] `arch review` passes.
