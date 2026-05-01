## TASK-164: Research and POC for Non-Docker Sandbox
**Meta:** P0 | S | REVIEW | Focus:no | 7-operations | local | cli/src/main/ts/domain/services/sandbox.ts
**Depends:** TASK-157, ADR-005

### Acceptance Criteria
- [x] POC using `node:vm` or `isolate-vm` for basic command execution.
- [x] Benchmarking overhead and security boundaries.

### Definition of Done
- [ ] Sandbox approach selected and documented.
- [ ] `arch review` passes.
