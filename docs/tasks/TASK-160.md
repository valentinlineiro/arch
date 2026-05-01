## TASK-160: Implement Non-Docker Executable AC Sandbox
**Meta:** P0 | L | READY | Focus:no | 7-operations | local | cli/src/main/ts/domain/services/sandbox.ts
**Depends:** ADR-003, TASK-157

### Acceptance Criteria
- [ ] Research and implement a lightweight sandbox (e.g., `node:vm`, `isolate-vm`, or `firejail`) instead of Docker.
- [ ] Implement an allowlist for commands (test, grep, jq, node, git status).
- [ ] Enforce read-only filesystem access except for `/tmp`.
- [ ] Implement 30s timeout for execution.
- [ ] ACs requiring network/write must be tagged `privileged:yes` and require human approval.

### Context
#### Problem
ACs ejecutables pueden ser peligrosos. Docker es demasiado pesado para este propósito.

#### Solution
Implementar un sandbox ligero sin Docker para ejecución segura de ACs.

### Definition of Done
- [ ] All ACs checked.
- [ ] arch review passes.
